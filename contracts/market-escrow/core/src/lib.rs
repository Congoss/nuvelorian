//! Planet4 market escrow rules.
//!
//! This crate is the whole decision logic of the escrow contract, written as a pure state
//! machine with no blockchain dependency, so it can be tested natively on any machine.
//! The NEAR contract (`../contract`) only stores the state, checks who is calling, and turns
//! the returned payouts into `ft_transfer` calls.
//!
//! Life of a trade:
//!
//! ```text
//! (buyer ft_transfer_call) -> Funded
//! Funded --operator release--> seller leg + fee leg paid independently -> Released
//! Funded --operator refund, or buyer refund after the timeout--> Refunded
//! ```
//!
//! Invariants enforced here:
//! - the fee rate and the per-trade cap are fixed when the contract is created;
//! - seller payout + fee always equals the escrowed amount (no dust is kept);
//! - a trade can never be both paid out and refunded;
//! - a failed transfer leaves the leg retryable, a successful one can never be repeated;
//! - nobody, including the owner, can move escrowed tokens anywhere except to the seller,
//!   the fee recipient (fixed share) or back to the buyer.

use borsh::{BorshDeserialize, BorshSerialize};

pub const MAX_FEE_BPS: u16 = 1_000; // 10%
pub const BPS_DENOMINATOR: u128 = 10_000;
pub const MAX_TRADE_ID_LEN: usize = 64;

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq, Eq)]
pub struct Config {
    /// May pause new trades and replace the operator. Cannot touch escrowed tokens.
    pub owner: String,
    /// The game server account: confirms that the item was delivered (release) or was not (refund).
    pub operator: String,
    /// The only NEP-141 token accepted.
    pub token: String,
    pub fee_recipient: String,
    pub fee_bps: u16,
    /// Hard cap for one trade, in the token's smallest units.
    pub max_amount: u128,
    /// After this many nanoseconds without a release the buyer can take the tokens back alone.
    pub refund_after_ns: u64,
    pub paused: bool,
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum Leg {
    Unpaid,
    /// A transfer is in flight; its callback decides between Paid and Unpaid.
    Pending,
    Paid,
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum Status {
    Funded,
    Released,
    Refunded,
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq, Eq)]
pub struct Trade {
    pub buyer: String,
    pub seller: String,
    pub amount: u128,
    pub fee: u128,
    pub created_at_ns: u64,
    pub status: Status,
    pub seller_leg: Leg,
    pub fee_leg: Leg,
    pub refund_leg: Leg,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Error {
    Paused,
    WrongToken,
    BadTradeId,
    TradeExists,
    ZeroAmount,
    AboveCap,
    SelfTrade,
    BadConfig,
    NotOperator,
    NotAllowed,
    TooEarly,
    NotFunded,
    RefundInProgress,
    PayoutStarted,
    NothingToDo,
}

impl Error {
    pub fn message(self) -> &'static str {
        match self {
            Error::Paused => "ESCROW_PAUSED",
            Error::WrongToken => "WRONG_TOKEN",
            Error::BadTradeId => "BAD_TRADE_ID",
            Error::TradeExists => "TRADE_EXISTS",
            Error::ZeroAmount => "ZERO_AMOUNT",
            Error::AboveCap => "ABOVE_TRADE_CAP",
            Error::SelfTrade => "SELF_TRADE",
            Error::BadConfig => "BAD_CONFIG",
            Error::NotOperator => "NOT_OPERATOR",
            Error::NotAllowed => "NOT_ALLOWED",
            Error::TooEarly => "REFUND_TOO_EARLY",
            Error::NotFunded => "TRADE_NOT_FUNDED",
            Error::RefundInProgress => "REFUND_IN_PROGRESS",
            Error::PayoutStarted => "PAYOUT_ALREADY_STARTED",
            Error::NothingToDo => "NOTHING_TO_DO",
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum LegKind {
    Seller,
    Fee,
}

/// A transfer the contract must now send. `to` is always the seller or the fee recipient.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Payout {
    pub kind: LegKind,
    pub to: String,
    pub amount: u128,
}

impl Config {
    pub fn validate(&self) -> Result<(), Error> {
        let distinct = self.token != self.owner
            && self.token != self.operator
            && self.token != self.fee_recipient;
        let non_empty = !self.owner.is_empty()
            && !self.operator.is_empty()
            && !self.token.is_empty()
            && !self.fee_recipient.is_empty();
        if !distinct || !non_empty || self.fee_bps > MAX_FEE_BPS || self.max_amount == 0 || self.refund_after_ns == 0 {
            return Err(Error::BadConfig);
        }
        Ok(())
    }
}

pub fn valid_trade_id(id: &str) -> bool {
    !id.is_empty()
        && id.len() <= MAX_TRADE_ID_LEN
        && id.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_' || b == b':')
}

/// Fee rounded down, so the seller never receives less than `amount - amount * bps / 10000`.
pub fn fee_for(amount: u128, fee_bps: u16) -> u128 {
    // amount <= max_amount is checked before this is called; u128 cannot overflow for any
    // token supply below 3.4e34 units, and checked_mul turns the impossible case into zero fee.
    amount.checked_mul(fee_bps as u128).map(|v| v / BPS_DENOMINATOR).unwrap_or(0)
}

/// Tokens arrived from `token_caller` (the predecessor of `ft_on_transfer`).
/// Any error makes the token contract return the full amount to the buyer.
#[allow(clippy::too_many_arguments)]
pub fn fund(
    cfg: &Config,
    token_caller: &str,
    trade_id: &str,
    already_exists: bool,
    buyer: &str,
    seller: &str,
    amount: u128,
    now_ns: u64,
) -> Result<Trade, Error> {
    if token_caller != cfg.token {
        return Err(Error::WrongToken);
    }
    if cfg.paused {
        return Err(Error::Paused);
    }
    if !valid_trade_id(trade_id) {
        return Err(Error::BadTradeId);
    }
    if already_exists {
        return Err(Error::TradeExists);
    }
    if amount == 0 {
        return Err(Error::ZeroAmount);
    }
    if amount > cfg.max_amount {
        return Err(Error::AboveCap);
    }
    if buyer == seller || seller.is_empty() {
        return Err(Error::SelfTrade);
    }
    Ok(Trade {
        buyer: buyer.to_string(),
        seller: seller.to_string(),
        amount,
        fee: fee_for(amount, cfg.fee_bps),
        created_at_ns: now_ns,
        status: Status::Funded,
        seller_leg: Leg::Unpaid,
        fee_leg: Leg::Unpaid,
        refund_leg: Leg::Unpaid,
    })
}

/// The operator confirms delivery. Returns the transfers that still have to be sent and marks
/// them Pending. Calling it again after a failed transfer retries only the failed leg.
pub fn begin_release(cfg: &Config, trade: &mut Trade, caller: &str) -> Result<Vec<Payout>, Error> {
    if caller != cfg.operator {
        return Err(Error::NotOperator);
    }
    if trade.status != Status::Funded {
        return Err(Error::NotFunded);
    }
    if trade.refund_leg != Leg::Unpaid {
        return Err(Error::RefundInProgress);
    }
    let mut out = Vec::new();
    if trade.seller_leg == Leg::Unpaid {
        trade.seller_leg = Leg::Pending;
        out.push(Payout { kind: LegKind::Seller, to: trade.seller.clone(), amount: trade.amount - trade.fee });
    }
    if trade.fee_leg == Leg::Unpaid {
        if trade.fee == 0 {
            trade.fee_leg = Leg::Paid;
        } else {
            trade.fee_leg = Leg::Pending;
            out.push(Payout { kind: LegKind::Fee, to: cfg.fee_recipient.clone(), amount: trade.fee });
        }
    }
    settle(trade);
    if out.is_empty() && trade.status != Status::Released {
        // both legs are already in flight
        return Err(Error::NothingToDo);
    }
    Ok(out)
}

/// Callback of one payout transfer.
pub fn finish_leg(trade: &mut Trade, kind: LegKind, success: bool) {
    let leg = match kind {
        LegKind::Seller => &mut trade.seller_leg,
        LegKind::Fee => &mut trade.fee_leg,
    };
    if *leg == Leg::Pending {
        *leg = if success { Leg::Paid } else { Leg::Unpaid };
    }
    settle(trade);
}

fn settle(trade: &mut Trade) {
    if trade.status == Status::Funded && trade.seller_leg == Leg::Paid && trade.fee_leg == Leg::Paid {
        trade.status = Status::Released;
    }
}

/// Refund the whole amount to the buyer. Allowed for the operator at any time (the item could
/// not be delivered) and for the buyer alone once the timeout has passed. Never allowed after
/// any payout leg has started.
pub fn begin_refund(cfg: &Config, trade: &mut Trade, caller: &str, now_ns: u64) -> Result<Payout, Error> {
    if trade.status != Status::Funded {
        return Err(Error::NotFunded);
    }
    // a zero fee leg is marked Paid without moving tokens, so it does not block a refund
    if trade.seller_leg != Leg::Unpaid || (trade.fee_leg != Leg::Unpaid && trade.fee > 0) {
        return Err(Error::PayoutStarted);
    }
    if trade.refund_leg != Leg::Unpaid {
        return Err(Error::RefundInProgress);
    }
    if caller == cfg.operator {
        // allowed immediately
    } else if caller == trade.buyer {
        let unlocked_at = trade.created_at_ns.saturating_add(cfg.refund_after_ns);
        if now_ns < unlocked_at {
            return Err(Error::TooEarly);
        }
    } else {
        return Err(Error::NotAllowed);
    }
    trade.refund_leg = Leg::Pending;
    // `kind` is unused for refunds; the amount is always the full escrow
    Ok(Payout { kind: LegKind::Seller, to: trade.buyer.clone(), amount: trade.amount })
}

/// Callback of the refund transfer.
pub fn finish_refund(trade: &mut Trade, success: bool) {
    if trade.refund_leg != Leg::Pending {
        return;
    }
    if success {
        trade.refund_leg = Leg::Paid;
        trade.status = Status::Refunded;
    } else {
        trade.refund_leg = Leg::Unpaid;
    }
}

/// Tokens the contract still owes for this trade (what must remain on its balance).
pub fn outstanding(trade: &Trade) -> u128 {
    match trade.status {
        Status::Refunded | Status::Released => 0,
        Status::Funded => {
            let mut left = trade.amount;
            if trade.seller_leg == Leg::Paid {
                left -= trade.amount - trade.fee;
            }
            if trade.fee_leg == Leg::Paid {
                left -= trade.fee;
            }
            left
        }
    }
}

#[cfg(test)]
mod tests;
