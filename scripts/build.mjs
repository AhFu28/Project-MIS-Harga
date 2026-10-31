import {cp,mkdir,rm,readFile,writeFile} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist/vendor',{recursive:true});await cp('public','dist',{recursive:true});await cp('node_modules/exceljs/dist/exceljs.min.js','dist/vendor/exceljs.min.js');await cp('node_modules/exceljs/LICENSE','dist/vendor/ExcelJS-LICENSE.txt');
// R2 stays opt-in: enabling it can activate a metered subscription.
const c=JSON.parse(await readFile('wrangler.jsonc','utf8'));
if(process.env.ENABLE_R2==='true')c.r2_buckets=[{binding:'DOCUMENTS',bucket_name:'mis-harga-documents'}];
if(process.env.GEMINI_FREE_CONFIRMED==='true')c.vars.GEMINI_FREE_CONFIRMED='true';
if(process.env.D1_DATABASE_ID)c.d1_databases[0].database_id=process.env.D1_DATABASE_ID;
await writeFile('wrangler.jsonc',JSON.stringify(c,null,2)+'\n');
console.log('Build complete. R2: '+Boolean(c.r2_buckets?.length)+'. Gemini free confirmed: '+c.vars.GEMINI_FREE_CONFIRMED);

for(const [src,dest] of [['pptxgenjs/dist/pptxgen.bundle.js','pptxgen.bundle.js'],['jspdf/dist/jspdf.umd.min.js','jspdf.umd.min.js'],['pdfjs-dist/build/pdf.mjs','pdf.mjs'],['pdfjs-dist/build/pdf.worker.mjs','pdf.worker.mjs']])await cp('node_modules/'+src,'dist/vendor/'+dest);
for(const pkg of ['pptxgenjs','jspdf','pdfjs-dist'])await cp('node_modules/'+pkg+'/'+(pkg==='pptxgenjs'?'LICENSE':'LICENSE'),'dist/vendor/'+pkg+'-LICENSE.txt');

await mkdir('dist/vendor/ocr',{recursive:true});
for(const name of ['tesseract.min.js','worker.min.js'])await cp('node_modules/tesseract.js/dist/'+name,'dist/vendor/ocr/'+name);
const {readdir}=await import('node:fs/promises');
for(const name of await readdir('node_modules/tesseract.js-core'))if(/\.wasm(?:\.js)?$/.test(name))await cp('node_modules/tesseract.js-core/'+name,'dist/vendor/ocr/'+name);
await cp('node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz','dist/vendor/ocr/eng.traineddata.gz');
for(const pkg of ['tesseract.js','tesseract.js-core'])await cp('node_modules/'+pkg+'/'+(pkg==='tesseract.js'?'LICENSE.md':'LICENSE'),'dist/vendor/ocr/'+pkg+'-LICENSE.txt');
