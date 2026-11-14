import test from 'node:test';
import assert from 'node:assert/strict';
import {isWalletRejection} from '../src/lib/platform/walletErrors.js';
test('known wallet rejection permits retry but timeouts and ambiguous failures never do',()=>{
 for(const error of [{code:4001},{code:'4001'},{code:'USER_REJECTED_REQUEST'},{message:'User rejected the request'},{message:'User cancelled'}])assert.equal(isWalletRejection(error),true);
 for(const error of [{code:'NEAR_WALLET_TIMEOUT'},{message:'RPC timeout'},{message:'Network error'},{message:'Transaction failed'},{message:'Request was rejected'},{}])assert.equal(isWalletRejection(error),false);
});
