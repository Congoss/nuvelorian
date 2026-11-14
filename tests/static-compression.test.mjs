import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,utimes,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createServer} from 'node:http';
import {gzipSync,brotliCompressSync,gunzipSync,brotliDecompressSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {createStaticHandler} from '../server/staticDelivery.js';
test('entrypoints below 1 KB always receive matching compressed sidecars',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'p4-compress-'));
 try {for(const name of ['index.html','release-version.json'])await writeFile(path.join(dir,name),'new entrypoint');
 execFileSync(process.execPath,['scripts/compress-build.mjs',dir]);
 for(const name of ['index.html','release-version.json'])for(const [ext,decode] of [['gz',gunzipSync],['br',brotliDecompressSync]])assert.deepEqual(decode(await readFile(path.join(dir,name+'.'+ext))),await readFile(path.join(dir,name)));
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('outdated sidecars cannot serve a previous entrypoint',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'p4-static-'));let server;
 try {await writeFile(path.join(dir,'index.html'),'current');for(const [ext,encode]of [['gz',gzipSync],['br',brotliCompressSync]]){const p=path.join(dir,'index.html.'+ext);await writeFile(p,encode('old'));await utimes(p,1,1);}
 const handler=createStaticHandler(dir);server=createServer((req,res)=>handler(req.url,res,req));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 for(const endpoint of ['/','/web','/index.html'])for(const encoding of ['identity','gzip','br']){const res=await fetch(`http://127.0.0.1:${server.address().port}${endpoint}`,{headers:{'accept-encoding':encoding}});assert.equal(await res.text(),'current');assert.equal(res.headers.get('content-encoding'),null);}
 }finally{if(server)await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true,force:true});}
});
