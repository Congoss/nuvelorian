//! Planet4 market escrow on NEAR.
//!
//! A buyer pays for a game item by sending the market token (PL4, NEP-141) to this contract
//! with `ft_transfer_call` and a message `{"trade_id": "...", "seller": "..."}`. The contract
//! holds the tokens until one of two things happens:
//!
//! - `release(trade_id)`: the game server (operator) confirms the item was delivered. The
//!   contract pays the seller and sends the fixed fee share to the fee recipient.
//! - `refund(trade_id)`: the operator cancels, or the buyer takes the tokens back alone after
//!   the timeout. The game server cannot keep a buyer's tokens locked.
//!
//! All rules live in `p4-escrow-core` and are unit-tested there. This file only checks the
//! caller, stores state and sends transfers. There is no owner withdrawal and no upgrade method.

use near_sdk::json_types::U128;
use near_sdk::serde_json::{self, json};
use near_sdk::store::LookupMap;
use near_sdk::{env, is_promise_success, near, require, AccountId, Gas, NearToken, PanicOnDefault, Promise};
use p4_escrow_core::{self as rules, Config, LegKind, Trade};

const GAS_FT_TRANSFER: Gas = Gas::from_tgas(15);
const GAS_CALLBACK: Gas = Gas::from_tgas(8);
const ONE_YOCTO: NearToken = NearToken::from_yoctonear(1);
const NS_PER_SEC: u64 = 1_000_000_000;

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Escrow {
    config: Config,
    trades: LookupMap<String, Trade>,
    /// Tokens currently owed to buyers or sellers. Never exceeds the contract's token balance.
    held: u128,
    trade_count: u64,
}

#[near(serializers = [json])]
pub struct FundMessage {
    pub trade_id: String,
    pub seller: AccountId,
}

#[near(serializers = [json])]
pub struct ConfigView {
    pub owner: String,
    pub operator: String,
    pub token: String,
    pub fee_recipient: String,
    pub fee_bps: u16,
    pub max_amount: U128,
    pub refund_after_sec: u64,
    pub paused: bool,
    pub held: U128,
    pub trade_count: u64,
}

#[near(serializers = [json])]
pub struct TradeView {
    pub trade_id: String,
    pub buyer: String,
    pub seller: String,
    pub amount: U128,
    pub fee: U128,
    pub created_at_ns: u64,
    pub buyer_refund_from_ns: u64,
    pub status: String,
    pub seller_leg: String,
    pub fee_leg: String,
    pub refund_leg: String,
}

fn fail(error: rules::Error) -> ! {
    env::panic_str(error.message())
}

fn event(name: &str, data: serde_json::Value) {
    env::log_str(&format!(
        "EVENT_JSON:{}",
        json!({"standard": "p4escrow", "version": "1.0.0", "event": name, "data": [data]})
    ));
}

#[near]
impl Escrow {
    /// `fee_bps`, `max_amount`, `token` and `fee_recipient` can never be changed afterwards.
    #[init]
    pub fn new(
        owner: AccountId,
        operator: AccountId,
        token: AccountId,
        fee_recipient: AccountId,
        fee_bps: u16,
        max_amount: U128,
        refund_after_sec: u64,
    ) -> Self {
        let config = Config {
            owner: owner.to_string(),
            operator: operator.to_string(),
            token: token.to_string(),
            fee_recipient: fee_recipient.to_string(),
            fee_bps,
            max_amount: max_amount.0,
            refund_after_ns: refund_after_sec.saturating_mul(NS_PER_SEC),
            paused: false,
        };
        if let Err(e) = config.validate() {
            fail(e);
        }
        Self { config, trades: LookupMap::new(b"t"), held: 0, trade_count: 0 }
    }

    /// NEP-141 receiver. Called by the token contract after the buyer's `ft_transfer_call`.
    /// Returns the unused amount (always 0). Any panic makes the token return everything.
    pub fn ft_on_transfer(&mut self, sender_id: AccountId, amount: U128, msg: String) -> U128 {
        let message: FundMessage =
            serde_json::from_str(&msg).unwrap_or_else(|_| env::panic_str("BAD_MESSAGE"));
        let exists = self.trades.contains_key(&message.trade_id);
        let trade = rules::fund(
            &self.config,
            env::predecessor_account_id().as_str(),
            &message.trade_id,
            exists,
            sender_id.as_str(),
            message.seller.as_str(),
            amount.0,
            env::block_timestamp(),
        )
        .unwrap_or_else(|e| fail(e));
        self.held = self.held.checked_add(trade.amount).unwrap_or_else(|| env::panic_str("OVERFLOW"));
        self.trade_count += 1;
        event(
            "trade_funded",
            json!({"trade_id": message.trade_id, "buyer": trade.buyer, "seller": trade.seller,
                   "amount": U128(trade.amount), "fee": U128(trade.fee)}),
        );
        self.trades.insert(message.trade_id, trade);
        U128(0)
    }

    /// Operator only: the item was delivered, pay the seller and the fee.
    /// Safe to call again if a transfer failed; legs already paid are never repeated.
    /// Attach at least 80 TGas.
    pub fn release(&mut self, trade_id: String) {
        let mut trade = self.trade(&trade_id);
        let payouts = rules::begin_release(&self.config, &mut trade, env::predecessor_account_id().as_str())
            .unwrap_or_else(|e| fail(e));
        self.trades.insert(trade_id.clone(), trade);
        for payout in payouts {
            let fee_leg = payout.kind == LegKind::Fee;
            self.transfer(&payout.to, payout.amount, &trade_id).then(
                Self::ext(env::current_account_id())
                    .with_static_gas(GAS_CALLBACK)
                    .on_payout(trade_id.clone(), fee_leg, U128(payout.amount)),
            )
            .detach();
        }
    }

    /// Operator at any time, or the buyer alone after the timeout: return the full amount.
    /// Impossible once any payout has started. Attach at least 40 TGas.
    pub fn refund(&mut self, trade_id: String) {
        let mut trade = self.trade(&trade_id);
        let payout = rules::begin_refund(
            &self.config,
            &mut trade,
            env::predecessor_account_id().as_str(),
            env::block_timestamp(),
        )
        .unwrap_or_else(|e| fail(e));
        self.trades.insert(trade_id.clone(), trade);
        self.transfer(&payout.to, payout.amount, &trade_id).then(
            Self::ext(env::current_account_id()).with_static_gas(GAS_CALLBACK).on_refund(trade_id),
        )
        .detach();
    }

    #[private]
    pub fn on_payout(&mut self, trade_id: String, fee_leg: bool, amount: U128) -> bool {
        let success = is_promise_success();
        let mut trade = self.trade(&trade_id);
        rules::finish_leg(&mut trade, if fee_leg { LegKind::Fee } else { LegKind::Seller }, success);
        if success {
            self.held = self.held.saturating_sub(amount.0);
        }
        event(
            if success { "payout_sent" } else { "payout_failed" },
            json!({"trade_id": trade_id, "leg": if fee_leg { "fee" } else { "seller" },
                   "amount": amount, "status": status_name(&trade)}),
        );
        self.trades.insert(trade_id, trade);
        success
    }

    #[private]
    pub fn on_refund(&mut self, trade_id: String) -> bool {
        let success = is_promise_success();
        let mut trade = self.trade(&trade_id);
        rules::finish_refund(&mut trade, success);
        if success {
            self.held = self.held.saturating_sub(trade.amount);
        }
        event(
            if success { "refund_sent" } else { "refund_failed" },
            json!({"trade_id": trade_id, "buyer": trade.buyer, "amount": U128(trade.amount)}),
        );
        self.trades.insert(trade_id, trade);
        success
    }

    /// Owner only. Pausing stops new trades; release and refund keep working.
    #[payable]
    pub fn set_paused(&mut self, paused: bool) {
        self.assert_owner();
        self.config.paused = paused;
        event("paused_changed", json!({"paused": paused}));
    }

    /// Owner only. Replaces the game server account that confirms deliveries.
    #[payable]
    pub fn set_operator(&mut self, operator: AccountId) {
        self.assert_owner();
        require!(operator.as_str() != self.config.token, "BAD_CONFIG");
        self.config.operator = operator.to_string();
        event("operator_changed", json!({"operator": operator}));
    }

    pub fn get_config(&self) -> ConfigView {
        let c = &self.config;
        ConfigView {
            owner: c.owner.clone(),
            operator: c.operator.clone(),
            token: c.token.clone(),
            fee_recipient: c.fee_recipient.clone(),
            fee_bps: c.fee_bps,
            max_amount: U128(c.max_amount),
            refund_after_sec: c.refund_after_ns / NS_PER_SEC,
            paused: c.paused,
            held: U128(self.held),
            trade_count: self.trade_count,
        }
    }

    pub fn get_trade(&self, trade_id: String) -> Option<TradeView> {
        self.trades.get(&trade_id).map(|t| TradeView {
            trade_id: trade_id.clone(),
            buyer: t.buyer.clone(),
            seller: t.seller.clone(),
            amount: U128(t.amount),
            fee: U128(t.fee),
            created_at_ns: t.created_at_ns,
            buyer_refund_from_ns: t.created_at_ns.saturating_add(self.config.refund_after_ns),
            status: status_name(t).to_string(),
            seller_leg: format!("{:?}", t.seller_leg),
            fee_leg: format!("{:?}", t.fee_leg),
            refund_leg: format!("{:?}", t.refund_leg),
        })
    }
}

fn status_name(trade: &Trade) -> &'static str {
    match trade.status {
        rules::Status::Funded => "funded",
        rules::Status::Released => "released",
        rules::Status::Refunded => "refunded",
    }
}

impl Escrow {
    fn trade(&self, trade_id: &str) -> Trade {
        self.trades.get(trade_id).cloned().unwrap_or_else(|| env::panic_str("TRADE_NOT_FOUND"))
    }

    fn assert_owner(&self) {
        require!(env::attached_deposit() == ONE_YOCTO, "ONE_YOCTO_REQUIRED");
        require!(env::predecessor_account_id().as_str() == self.config.owner, "NOT_OWNER");
    }

    fn transfer(&self, to: &str, amount: u128, trade_id: &str) -> Promise {
        let token: AccountId = self.config.token.parse().unwrap_or_else(|_| env::panic_str("BAD_CONFIG"));
        let args = json!({"receiver_id": to, "amount": U128(amount), "memo": format!("p4:{trade_id}")});
        Promise::new(token).function_call(
            "ft_transfer".to_string(),
            args.to_string().into_bytes(),
            ONE_YOCTO,
            GAS_FT_TRANSFER,
        )
    }
}
