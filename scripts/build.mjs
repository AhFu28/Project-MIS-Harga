import {cp,mkdir,rm,readFile,writeFile} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist/vendor',{recursive:true});await cp('public','dist',{recursive:true});await cp('node_modules/exceljs/dist/exceljs.min.js','dist/vendor/exceljs.min.js');await cp('node_modules/exceljs/LICENSE','dist/vendor/ExcelJS-LICENSE.txt');
// R2 stays opt-in: enabling it can activate a metered subscription.
const c=JSON.parse(await readFile('wrangler.jsonc','utf8'));
if(process.env.ENABLE_R2==='true')c.r2_buckets=[{binding:'DOCUMENTS',bucket_name:'mis-harga-documents'}];
if(process.env.GEMINI_FREE_CONFIRMED==='true')c.vars.GEMINI_FREE_CONFIRMED='true';
if(process.env.D1_DATABASE_ID)c.d1_databases[0].database_id=process.env.D1_DATABASE_ID;
await writeFile('wrangler.jsonc',JSON.stringify(c,null,2)+'\n');
console.log('Build complete. R2: '+Boolean(c.r2_buckets?.length)+'. Gemini free confirmed: '+c.vars.GEMINI_FREE_CONFIRMED);
