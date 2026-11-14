use super::*;

const HOUR: u64 = 3_600_000_000_000;

fn cfg() -> Config {
    Config {
        owner: "owner.near".into(),
        operator: "game.near".into(),
        token: "pl4.near".into(),
        fee_recipient: "treasury.near".into(),
        fee_bps: 500,
        max_amount: 1_000_000,
        refund_after_ns: 24 * HOUR,
        paused: false,
    }
}

fn funded(amount: u128) -> Trade {
    fund(&cfg(), "pl4.near", "t-1", false, "buyer.near", "seller.near", amount, 1_000).unwrap()
}

#[test]
fn config_rejects_unsafe_values() {
    assert_eq!(cfg().validate(), Ok(()));
    for bad in [
        Config { fee_bps: 1_001, ..cfg() },
        Config { max_amount: 0, ..cfg() },
        Config { refund_after_ns: 0, ..cfg() },
        Config { operator: String::new(), ..cfg() },
        Config { fee_recipient: "pl4.near".into(), ..cfg() },
    ] {
        assert_eq!(bad.validate(), Err(Error::BadConfig));
    }
}

#[test]
fn funding_records_the_trade_and_a_rounded_down_fee() {
    let t = funded(1_000);
    assert_eq!((t.amount, t.fee, t.status), (1_000, 50, Status::Funded));
    assert_eq!(funded(19).fee, 0); // 0.95 rounds down
    assert_eq!(funded(20).fee, 1);
    assert_eq!(outstanding(&t), 1_000);
}

#[test]
fn funding_is_refused_for_wrong_token_pause_duplicates_caps_and_bad_ids() {
    let c = cfg();
    let f = |token: &str, id: &str, exists: bool, seller: &str, amount: u128, c: &Config| {
        fund(c, token, id, exists, "buyer.near", seller, amount, 0).map(|_| ())
    };
    assert_eq!(f("fake.near", "t", false, "s.near", 10, &c), Err(Error::WrongToken));
    assert_eq!(f("pl4.near", "t", false, "s.near", 10, &Config { paused: true, ..cfg() }), Err(Error::Paused));
    assert_eq!(f("pl4.near", "", false, "s.near", 10, &c), Err(Error::BadTradeId));
    assert_eq!(f("pl4.near", "bad id!", false, "s.near", 10, &c), Err(Error::BadTradeId));
    assert_eq!(f("pl4.near", &"x".repeat(65), false, "s.near", 10, &c), Err(Error::BadTradeId));
    assert_eq!(f("pl4.near", "t", true, "s.near", 10, &c), Err(Error::TradeExists));
    assert_eq!(f("pl4.near", "t", false, "s.near", 0, &c), Err(Error::ZeroAmount));
    assert_eq!(f("pl4.near", "t", false, "s.near", 1_000_001, &c), Err(Error::AboveCap));
    assert_eq!(f("pl4.near", "t", false, "buyer.near", 10, &c), Err(Error::SelfTrade));
    assert_eq!(f("pl4.near", "t", false, "", 10, &c), Err(Error::SelfTrade));
    assert_eq!(f("pl4.near", "t", false, "s.near", 1_000_000, &c), Ok(()));
}

#[test]
fn release_pays_seller_95_and_treasury_5_exactly_once() {
    let c = cfg();
    let mut t = funded(1_000);
    let payouts = begin_release(&c, &mut t, "game.near").unwrap();
    assert_eq!(
        payouts,
        vec![
            Payout { kind: LegKind::Seller, to: "seller.near".into(), amount: 950 },
            Payout { kind: LegKind::Fee, to: "treasury.near".into(), amount: 50 },
        ]
    );
    // while transfers are in flight nothing can be sent again
    assert_eq!(begin_release(&c, &mut t, "game.near"), Err(Error::NothingToDo));
    finish_leg(&mut t, LegKind::Seller, true);
    assert_eq!(t.status, Status::Funded);
    assert_eq!(outstanding(&t), 50);
    finish_leg(&mut t, LegKind::Fee, true);
    assert_eq!(t.status, Status::Released);
    assert_eq!(outstanding(&t), 0);
    // replay after completion
    assert_eq!(begin_release(&c, &mut t, "game.near"), Err(Error::NotFunded));
    assert_eq!(begin_refund(&c, &mut t, "game.near", u64::MAX), Err(Error::NotFunded));
    // a late duplicate callback changes nothing
    finish_leg(&mut t, LegKind::Seller, false);
    assert_eq!((t.seller_leg, t.status), (Leg::Paid, Status::Released));
}

#[test]
fn only_the_operator_can_release() {
    let c = cfg();
    for caller in ["seller.near", "buyer.near", "owner.near", "treasury.near", "x.near"] {
        let mut t = funded(100);
        assert_eq!(begin_release(&c, &mut t, caller), Err(Error::NotOperator));
        assert_eq!(t, funded(100));
    }
}

#[test]
fn a_failed_leg_is_retried_alone_and_never_double_pays_the_other() {
    let c = cfg();
    let mut t = funded(1_000);
    begin_release(&c, &mut t, "game.near").unwrap();
    finish_leg(&mut t, LegKind::Seller, false); // e.g. seller has no storage on the token
    finish_leg(&mut t, LegKind::Fee, true);
    assert_eq!((t.seller_leg, t.fee_leg, t.status), (Leg::Unpaid, Leg::Paid, Status::Funded));
    assert_eq!(outstanding(&t), 950);
    // the fee already left, so a refund of the full amount is impossible
    assert_eq!(begin_refund(&c, &mut t, "game.near", 0), Err(Error::PayoutStarted));
    assert_eq!(begin_refund(&c, &mut t, "buyer.near", u64::MAX), Err(Error::PayoutStarted));
    let retry = begin_release(&c, &mut t, "game.near").unwrap();
    assert_eq!(retry, vec![Payout { kind: LegKind::Seller, to: "seller.near".into(), amount: 950 }]);
    finish_leg(&mut t, LegKind::Seller, true);
    assert_eq!(t.status, Status::Released);
}

#[test]
fn buyer_refund_needs_the_timeout_and_operator_refund_does_not() {
    let c = cfg();
    let mut t = funded(1_000);
    let unlock = 1_000 + 24 * HOUR;
    assert_eq!(begin_refund(&c, &mut t, "buyer.near", unlock - 1), Err(Error::TooEarly));
    assert_eq!(begin_refund(&c, &mut t, "seller.near", u64::MAX), Err(Error::NotAllowed));
    assert_eq!(begin_refund(&c, &mut t, "owner.near", u64::MAX), Err(Error::NotAllowed));
    let p = begin_refund(&c, &mut t, "buyer.near", unlock).unwrap();
    assert_eq!((p.to.as_str(), p.amount), ("buyer.near", 1_000));
    // in flight: no second refund and no release
    assert_eq!(begin_refund(&c, &mut t, "buyer.near", unlock), Err(Error::RefundInProgress));
    assert_eq!(begin_release(&c, &mut t, "game.near"), Err(Error::RefundInProgress));
    finish_refund(&mut t, true);
    assert_eq!((t.status, outstanding(&t)), (Status::Refunded, 0));
    assert_eq!(begin_release(&c, &mut t, "game.near"), Err(Error::NotFunded));

    let mut t2 = funded(1_000);
    let p2 = begin_refund(&c, &mut t2, "game.near", 0).unwrap();
    assert_eq!((p2.to.as_str(), p2.amount), ("buyer.near", 1_000));
}

#[test]
fn a_failed_refund_returns_the_trade_to_funded() {
    let c = cfg();
    let mut t = funded(1_000);
    begin_refund(&c, &mut t, "game.near", 0).unwrap();
    finish_refund(&mut t, false);
    assert_eq!(t, funded(1_000));
    // both paths are open again
    assert!(begin_release(&c, &mut t.clone(), "game.near").is_ok());
    assert!(begin_refund(&c, &mut t, "game.near", 0).is_ok());
}

#[test]
fn pause_blocks_new_trades_but_never_traps_existing_funds() {
    let paused = Config { paused: true, ..cfg() };
    let mut t = funded(1_000);
    assert!(begin_release(&paused, &mut t.clone(), "game.near").is_ok());
    assert!(begin_refund(&paused, &mut t, "buyer.near", u64::MAX).is_ok());
}

#[test]
fn zero_fee_trades_release_with_one_transfer_and_stay_refundable_on_failure() {
    let c = cfg();
    let mut t = funded(10); // fee rounds to 0
    let payouts = begin_release(&c, &mut t, "game.near").unwrap();
    assert_eq!(payouts, vec![Payout { kind: LegKind::Seller, to: "seller.near".into(), amount: 10 }]);
    finish_leg(&mut t, LegKind::Seller, false);
    assert!(begin_refund(&c, &mut t, "game.near", 0).is_ok());

    let mut t2 = funded(10);
    begin_release(&c, &mut t2, "game.near").unwrap();
    finish_leg(&mut t2, LegKind::Seller, true);
    assert_eq!(t2.status, Status::Released);
}

#[test]
fn fee_never_overflows_and_never_exceeds_ten_percent() {
    assert_eq!(fee_for(u128::MAX, 1_000), 0); // impossible amount: no fee instead of a panic
    for amount in [1u128, 19, 20, 999, 10_000, 123_456_789_012_345_678_901_234] {
        for bps in [0u16, 1, 500, 1_000] {
            let fee = fee_for(amount, bps);
            assert!(fee <= amount / 10);
            assert_eq!(fee, amount * bps as u128 / 10_000);
        }
    }
}

/// Random walk over every operation and callback outcome. Tracks a model token ledger and
/// checks conservation after each step: escrow balance == sum of outstanding amounts, and
/// what left the escrow went only to the seller, the treasury (exact fee) or the buyer (full).
#[test]
fn random_sequences_conserve_tokens_and_never_pay_twice() {
    let c = cfg();
    let mut seed: u64 = 0x5EED_1234_ABCD_0042;
    let mut next = move |n: u64| {
        seed = seed.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
        (seed >> 33) % n
    };
    for round in 0..4_000 {
        let amount = 1 + next(1_000_000) as u128;
        let mut t = funded(amount);
        let (mut to_seller, mut to_fee, mut to_buyer) = (0u128, 0u128, 0u128);
        // transfers in flight: (is_refund, kind, amount)
        let mut flying: Vec<(bool, LegKind, u128)> = Vec::new();
        let mut now = 1_000u64;
        for _ in 0..24 {
            match next(6) {
                0 => {
                    if let Ok(ps) = begin_release(&c, &mut t, "game.near") {
                        for p in ps {
                            flying.push((false, p.kind, p.amount));
                        }
                    }
                }
                1 => {
                    let caller = if next(2) == 0 { "game.near" } else { "buyer.near" };
                    if let Ok(p) = begin_refund(&c, &mut t, caller, now) {
                        flying.push((true, LegKind::Seller, p.amount));
                    }
                }
                2 => {
                    // an outsider tries everything
                    assert!(begin_release(&c, &mut t, "x.near").is_err());
                    assert!(begin_refund(&c, &mut t, "x.near", u64::MAX).is_err());
                }
                3 => now += next(30) * HOUR,
                _ => {
                    if !flying.is_empty() {
                        let i = next(flying.len() as u64) as usize;
                        let (is_refund, kind, amt) = flying.remove(i);
                        let ok = next(3) != 0;
                        if is_refund {
                            finish_refund(&mut t, ok);
                            if ok {
                                to_buyer += amt;
                            }
                        } else {
                            finish_leg(&mut t, kind, ok);
                            if ok {
                                match kind {
                                    LegKind::Seller => to_seller += amt,
                                    LegKind::Fee => to_fee += amt,
                                }
                            }
                        }
                    }
                }
            }
            let escrow_balance = amount - to_seller - to_fee - to_buyer;
            assert_eq!(escrow_balance, outstanding(&t), "round {round}");
            assert!(to_buyer == 0 || (to_seller == 0 && to_fee == 0), "paid and refunded, round {round}");
            assert!(to_buyer == 0 || to_buyer == amount);
            assert!(to_seller == 0 || to_seller == amount - t.fee);
            assert!(to_fee == 0 || to_fee == t.fee);
        }
    }
}
