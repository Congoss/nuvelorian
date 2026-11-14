export function isWalletRejection(error){
 return ['USER_REJECTED','USER_REJECTED_REQUEST',4001,'4001'].includes(error?.code)
  ||/user (?:rejected|cancelled|canceled|denied)|rejected by user/i.test(String(error?.message||''));
}
