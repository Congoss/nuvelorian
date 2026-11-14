import path from 'node:path';
import {createEnhancementDemo} from '../server/utils/enhancementDemo.js';
export default function enhancementDemoPlugin(){return {name:'local-enhancement-sandbox',apply:'serve',configureServer(server){
  const demo=createEnhancementDemo({file:path.resolve('.local/enhancement-sandbox.json')});
  server.middlewares.use('/api/local-enhancement',async(req,res)=>{
    res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
    try{
      if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress))throw Object.assign(new Error('LOCAL_ONLY'),{statusCode:403});
      const origin=req.headers.origin;if(origin&&new URL(origin).host!==req.headers.host)throw Object.assign(new Error('INVALID_ORIGIN'),{statusCode:403});
      const owner=req.headers['x-demo-session'];let data;
      if(req.method==='GET')data={state:demo.get(owner,new URL(req.url,'http://local').searchParams.get('itemId')||'demo-weapon')};
      else if(req.method==='POST'){
        let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>10000)throw new Error('BODY_TOO_LARGE');}
        data=demo.act(owner,JSON.parse(raw));
      }else throw Object.assign(new Error('METHOD_NOT_ALLOWED'),{statusCode:405});
      res.end(JSON.stringify(data));
    }catch(error){res.statusCode=error.statusCode||400;res.end(JSON.stringify({error:error.message}));}
  });
}};}
