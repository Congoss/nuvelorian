// Gateway pages are infrastructure responses, never player-facing messages.
export async function readRemoteResponse(response) {
 if(response.status===204)return null;
 const gateway=[502,503,504].includes(response.status);
 const fallback=()=>({code:gateway?'GATEWAY_UNAVAILABLE':'REMOTE_INVALID_RESPONSE'});
 if(!(response.headers.get('content-type') || '').includes('application/json')) {
  void response.body?.cancel().catch(() => {});
  return fallback();
 }
 let body;
 try{body=await response.json();}catch{return fallback();}
 if(gateway)return fallback();
 if(!body || typeof body!=='object' || Array.isArray(body))return fallback();
 if(typeof body.message==='string' && /<(?:!doctype|html|head|body|center|h1)\b/i.test(body.message))return fallback();
 return body;
}
