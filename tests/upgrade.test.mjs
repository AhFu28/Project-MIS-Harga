import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';
import {D1} from './support.mjs';
import {verifier,random} from '../src/crypto.js';
import {reviewPage,PAGE_SIZE} from '../public/review.js';
import {createOCRSession} from '../public/ocr-session.js';
import {measureStage} from '../public/performance.js';
test('pagination keeps original row identities across filtering, search, deletion and partial pages',()=>{
 const rows=Array.from({length:501},(_,i)=>({product:'Synthetic '+i,sku:'',amount:i===30?null:12345,unit:'kg',in_comparison:false,flags:[]}));
 assert.equal(PAGE_SIZE,25);let p=reviewPage(rows,[],{page:20});assert.equal(p.rows.length,1);assert.equal(p.rows[0].i,500);
 p=reviewPage(rows,[],{filter:'issues',page:10});assert.equal(p.page,0);assert.equal(p.rows[0].i,30);assert.equal(p.rows[0].r,rows[30]);
 p=reviewPage(rows,[],{search:'Synthetic 500'});assert.equal(p.count,1);assert.equal(p.rows[0].i,500);rows.pop();p=reviewPage(rows,[],{page:20});assert.equal(p.page,19);assert.equal(p.rows.at(-1).i,499);
});
test('vendor revalidation keeps auth and ETag; unauthenticated, errors, HTML and API remain no-store',async()=>{
 const env={DB:new D1(),BOOTSTRAP_ADMIN_HASH:await verifier('synthetic-asset-passphrase'),SETTINGS_ENCRYPTION_KEY:random(),ASSETS:{fetch:req=>new Response('synthetic-js',{status:new URL(req.url).pathname.endsWith('missing.js')?404:200,headers:{ETag:'"synthetic"','Content-Type':'text/javascript'}})}};
 const login=await worker.fetch(new Request('https://mis.test/api/login',{method:'POST',headers:{Origin:'https://mis.test','Content-Type':'application/json'},body:JSON.stringify({username:'adminF',password:'synthetic-asset-passphrase'})}),env);assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];
 const req=(path,auth=true,headers={})=>worker.fetch(new Request('https://mis.test'+path,{headers:{...(auth?{Cookie:cookie}:{}),...headers}}),env);
 const asset=await req('/vendor/0.4.0/library.js');assert.equal(asset.headers.get('Cache-Control'),'private, no-cache');assert.equal(asset.headers.get('ETag'),'"synthetic"');
 for(const path of ['/','/app.js','/api/status','/vendor/0.4.0/missing.js'])assert.equal((await req(path)).headers.get('Cache-Control'),'private, no-store');
 const denied=await req('/vendor/0.4.0/library.js',false);assert.equal(denied.status,401);assert.equal(denied.headers.get('Cache-Control'),'private, no-store');
 const loginHTML=await req('/vendor/0.4.0/library.js',false,{Accept:'text/html'});assert.equal(loginHTML.headers.get('Cache-Control'),'private, no-store');assert.ok(!(await loginHTML.text()).includes('synthetic-js'));
});
test('one serial OCR worker is reused, cancelled/failed workers are discarded, idle workers terminate',async()=>{
 let created=0,terminated=0;const session=createOCRSession(async()=>{created++;return {terminate:async()=>{terminated++;}};},{idleMs:10});
 await session.run(async()=>1);await session.run(async()=>2);assert.equal(created,1);
 await assert.rejects(()=>session.run(async()=>{throw Error('synthetic failure');}),/synthetic failure/);assert.equal(terminated,1);
 await session.run(async()=>3);assert.equal(created,2);await new Promise(r=>setTimeout(r,30));assert.equal(terminated,2);
 const controller=new AbortController();controller.abort();await assert.rejects(()=>session.run(async()=>4,{signal:controller.signal}),/dibatalkan/);assert.equal(created,2);await session.dispose();
});
test('cancelling OCR while the factory loads disposes the late worker and prevents recognition',async()=>{
 let release,terminated=0,read=false;const session=createOCRSession(()=>new Promise(r=>release=r));const controller=new AbortController();const pending=session.run(async()=>{read=true;},{signal:controller.signal});controller.abort();release({terminate:async()=>terminated++});await assert.rejects(()=>pending,/dibatalkan/);assert.equal(read,false);assert.equal(terminated,1);
});
test('performance stages preserve return values and errors without retaining price/file labels',async()=>{
 assert.equal(await measureStage('synthetic',async()=>42),42);await assert.rejects(()=>measureStage('synthetic-error',async()=>{throw Error('failure');}),/failure/);assert.equal(performance.getEntriesByName('mis:synthetic').length,1);performance.clearMeasures();
});
