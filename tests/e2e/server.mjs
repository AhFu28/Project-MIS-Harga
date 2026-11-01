// Synthetic in-memory backend for browser tests; never reads runtime secrets or production D1.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import worker from '../../src/worker.js';
import {D1} from '../support.mjs';
import {verifier,random} from '../../src/crypto.js';
const root=resolve('dist'),types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.wasm':'application/wasm','.gz':'application/gzip'};
const env={DB:new D1(),BOOTSTRAP_ADMIN_HASH:await verifier('synthetic-browser-passphrase'),SETTINGS_ENCRYPTION_KEY:random(),ASSETS:{async fetch(req){const url=new URL(req.url),path=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!path.startsWith(root+'/'))return new Response('Not found',{status:404});try{const bytes=await readFile(path),etag='"synthetic-'+bytes.length+'"';if(req.headers.get('If-None-Match')===etag)return new Response(null,{status:304,headers:{ETag:etag}});return new Response(bytes,{headers:{'Content-Type':types[extname(path)]??'application/octet-stream',ETag:etag}});}catch{return new Response('Not found',{status:404});}}}};
createServer(async(req,res)=>{try{const chunks=[];for await(const c of req)chunks.push(c);const input=new Request('http://127.0.0.1:4173'+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});const out=await worker.fetch(input,env);res.writeHead(out.status,Object.fromEntries(out.headers));res.end(Buffer.from(await out.arrayBuffer()));}catch(e){console.error(e);res.writeHead(500);res.end('Synthetic server error');}}).listen(4173,'127.0.0.1');
