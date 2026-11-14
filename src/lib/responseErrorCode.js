// HTTP 429 also carries gameplay cooldowns. Keep the server's specific reason.
export function responseErrorCode(status,body){
 if(typeof body?.code==='string' && body.code)return body.code;
 return status===429?'RATE_LIMITED':undefined;
}
