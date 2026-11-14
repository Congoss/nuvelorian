// Minimal in-memory NEAR runtime for testing a compiled contract with Node only.
// It implements the host functions this contract imports, cross-contract promises with
// callbacks, state rollback on panic, and a mock NEP-141 token. It is a test double, not a
// reimplementation of nearcore: gas is not metered and receipts run immediately in order.
import {readFileSync} from 'node:fs';

const U64_MAX = 0xffffffffffffffffn;
const enc = new TextEncoder();
const dec = new TextDecoder();

export class Chain {
  constructor() {
    this.contracts = new Map(); // accountId -> {module, storage: Map<string, Uint8Array>}
    this.tokens = new Map();    // accountId -> MockToken
    this.now = 1_700_000_000_000_000_000n;
    this.logs = [];
  }

  deploy(accountId, wasmPath) {
    this.contracts.set(accountId, {module: new WebAssembly.Module(readFileSync(wasmPath)), storage: new Map()});
  }

  addToken(accountId) {
    const token = new MockToken(this, accountId);
    this.tokens.set(accountId, token);
    return token;
  }

  advance(seconds) { this.now += BigInt(seconds) * 1_000_000_000n; }

  /** Calls a method and runs every promise it creates. Returns {ok, value, logs, error}. */
  call(accountId, method, args = {}, {from = 'anyone.test', deposit = 0n, promiseResults = []} = {}) {
    if (this.tokens.has(accountId)) return this.tokens.get(accountId).call(method, args, {from, deposit});
    const contract = this.contracts.get(accountId);
    if (!contract) return {ok: false, error: 'ACCOUNT_NOT_FOUND', logs: []};

    const storage = new Map(contract.storage); // committed only if the call does not trap
    const registers = new Map();
    const logs = [];
    const promises = []; // {account, calls: [{method, args, deposit}], after: index | null}
    let returned = null;
    let memory;
    const input = enc.encode(JSON.stringify(args));
    const bytes = (ptr, len) => new Uint8Array(memory.buffer, Number(ptr), Number(len)).slice();
    const text = (ptr, len) => dec.decode(bytes(ptr, len));
    const key = (len, ptr) => Buffer.from(bytes(ptr, len)).toString('hex');
    const u128At = ptr => { const b = bytes(ptr, 16); let v = 0n; for (let i = 15; i >= 0; i--) v = (v << 8n) | BigInt(b[i]); return v; };
    const unsupported = name => () => { throw new Error('host function not supported by the mock: ' + name); };

    const env = {
      input: reg => { registers.set(reg, input); },
      register_len: reg => (registers.has(reg) ? BigInt(registers.get(reg).length) : U64_MAX),
      read_register: (reg, ptr) => { new Uint8Array(memory.buffer).set(registers.get(reg), Number(ptr)); },
      current_account_id: reg => { registers.set(reg, enc.encode(accountId)); },
      predecessor_account_id: reg => { registers.set(reg, enc.encode(from)); },
      attached_deposit: ptr => {
        const out = new Uint8Array(memory.buffer, Number(ptr), 16);
        let v = deposit; for (let i = 0; i < 16; i++) { out[i] = Number(v & 0xffn); v >>= 8n; }
      },
      block_timestamp: () => this.now,
      log_utf8: (len, ptr) => { logs.push(text(ptr, len)); },
      value_return: (len, ptr) => { returned = bytes(ptr, len); },
      storage_write: (kl, kp, vl, vp, reg) => {
        const k = key(kl, kp); const old = storage.get(k);
        storage.set(k, bytes(vp, vl));
        if (old) { registers.set(reg, old); return 1n; }
        return 0n;
      },
      storage_read: (kl, kp, reg) => { const v = storage.get(key(kl, kp)); if (!v) return 0n; registers.set(reg, v); return 1n; },
      storage_has_key: (kl, kp) => (storage.has(key(kl, kp)) ? 1n : 0n),
      storage_remove: (kl, kp, reg) => { const k = key(kl, kp); const v = storage.get(k); if (!v) return 0n; registers.set(reg, v); storage.delete(k); return 1n; },
      promise_batch_create: (len, ptr) => BigInt(promises.push({account: text(ptr, len), calls: [], after: null}) - 1),
      promise_batch_then: (index, len, ptr) => BigInt(promises.push({account: text(ptr, len), calls: [], after: Number(index)}) - 1),
      promise_batch_action_function_call: (index, ml, mp, al, ap, amountPtr) => {
        promises[Number(index)].calls.push({method: text(mp, ml), args: JSON.parse(text(ap, al) || '{}'), deposit: u128At(amountPtr)});
      },
      promise_batch_action_function_call_weight: (index, ml, mp, al, ap, amountPtr) => {
        promises[Number(index)].calls.push({method: text(mp, ml), args: JSON.parse(text(ap, al) || '{}'), deposit: u128At(amountPtr)});
      },
      promise_return: () => {},
      promise_results_count: () => BigInt(promiseResults.length),
      promise_result: (index, reg) => {
        const r = promiseResults[Number(index)];
        if (!r) return 0n;
        if (!r.ok) return 2n;
        registers.set(reg, enc.encode(r.value === undefined ? '' : JSON.stringify(r.value)));
        return 1n;
      },
      panic_utf8: (len, ptr) => { throw new Error(text(ptr, len)); },
      panic: () => { throw new Error('explicit guest panic'); },
    };
    const imports = {env: new Proxy(env, {get: (t, name) => t[name] || unsupported(String(name))})};

    let error = null;
    try {
      const instance = new WebAssembly.Instance(contract.module, imports);
      memory = instance.exports.memory;
      if (typeof instance.exports[method] !== 'function') throw new Error('METHOD_NOT_FOUND');
      instance.exports[method]();
    } catch (e) {
      error = String(e && e.message || e);
    }
    this.logs.push(...logs);
    if (error) {
      // a trap discards state changes and created promises, exactly like a failed receipt
      const panicLog = logs.find(l => !l.startsWith('EVENT_JSON:'));
      return {ok: false, error: panicLog || error, logs};
    }
    contract.storage = storage;
    let value;
    if (returned) { const s = dec.decode(returned); value = s ? JSON.parse(s) : undefined; }

    // run created promises: first the independent ones, then callbacks with their results
    const results = new Array(promises.length);
    const run = i => {
      const p = promises[i];
      const opts = {from: accountId, promiseResults: p.after === null ? [] : [results[p.after]]};
      let last = {ok: true};
      for (const c of p.calls) {
        last = this.call(p.account, c.method, c.args, {...opts, deposit: c.deposit});
        if (!last.ok) break;
      }
      results[i] = last;
    };
    promises.forEach((p, i) => { if (p.after === null) run(i); });
    promises.forEach((p, i) => { if (p.after !== null) run(i); });
    return {ok: true, value, logs, promises: promises.map((p, i) => ({account: p.account, calls: p.calls, result: results[i]}))};
  }

  view(accountId, method, args = {}) {
    const r = this.call(accountId, method, args);
    if (!r.ok) throw new Error(r.error);
    return r.value;
  }
}

/** NEP-141 behaviour the escrow depends on: storage registration, 1 yocto, ft_transfer_call refunds. */
export class MockToken {
  constructor(chain, accountId) {
    this.chain = chain; this.accountId = accountId;
    this.balances = new Map(); this.transfers = [];
  }
  register(account) { if (!this.balances.has(account)) this.balances.set(account, 0n); }
  mint(account, amount) { this.register(account); this.balances.set(account, this.balanceOf(account) + BigInt(amount)); }
  balanceOf(account) { return this.balances.get(account) ?? 0n; }
  total() { let s = 0n; for (const v of this.balances.values()) s += v; return s; }

  move(from, to, amount) {
    if (amount <= 0n) return 'ZERO';
    if (!this.balances.has(to)) return 'RECEIVER_NOT_REGISTERED';
    if (this.balanceOf(from) < amount) return 'NOT_ENOUGH_BALANCE';
    this.balances.set(from, this.balanceOf(from) - amount);
    this.balances.set(to, this.balanceOf(to) + amount);
    this.transfers.push({from, to, amount});
    return null;
  }

  call(method, args, {from, deposit}) {
    if (method === 'ft_transfer' || method === 'ft_transfer_call') {
      if (deposit !== 1n) return {ok: false, error: 'ONE_YOCTO_REQUIRED', logs: []};
      const amount = BigInt(args.amount);
      const failed = this.move(from, args.receiver_id, amount);
      if (failed) return {ok: false, error: failed, logs: []};
      if (method === 'ft_transfer') return {ok: true, logs: []};
      // ft_transfer_call: the receiver decides how much it does not use; a panic returns everything
      const r = this.chain.call(args.receiver_id, 'ft_on_transfer', {sender_id: from, amount: String(amount), msg: args.msg}, {from: this.accountId});
      const unused = r.ok ? BigInt(r.value) : amount;
      if (unused > 0n) this.move(args.receiver_id, from, unused > amount ? amount : unused);
      return {ok: true, value: String(amount - unused), receiver: r, logs: r.logs};
    }
    return {ok: false, error: 'METHOD_NOT_FOUND', logs: []};
  }
}
