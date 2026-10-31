import {test} from 'node:test';
import assert from 'node:assert/strict';
import {filenameMetadata} from '../public/data.js';
import {compileRecords,analytics} from '../src/team.js';
import {distinctTables,isSourceNote,quantityHeaders,fallbackRows,hasSourceInk,isColorPoster,priceHeaderRecognized,readMoneyToken} from '../public/ocr.js';
import {documentCondition,normalizePolarity,recognizeWithTimeout,tableFields} from '../public/ocr.js';
import {parseAIExtraction} from '../public/data.js';
import {callAI,EXTRACTION_SCHEMA} from '../src/ai.js';
import {D1} from './support.mjs';
import {encrypt,random} from '../src/crypto.js';

test('filename proposals support spaced ranges, two months and invalid calendar dates without assigning condition',()=>{
 assert.deepEqual(filenameMetadata('Berdikari 3 - 10 oktober 2026.jpeg'),{supplier:'Berdikari',valid_from:'2026-10-03',valid_to:'2026-10-10'});
 assert.deepEqual(filenameMetadata('Ciomas 17 september - 1 oktober 2026 .jpeg'),{supplier:'Ciomas',valid_from:'2026-09-17',valid_to:'2026-10-01'});
 assert.deepEqual(filenameMetadata('Chikin 26 Oktober 2026.jpeg'),{supplier:'Chikin',valid_from:'2026-10-26'});
 assert.deepEqual(filenameMetadata('Synthetic 30 februari 2026.jpeg'),{});
 assert.deepEqual(filenameMetadata('Synthetic 20 - 10 oktober 2026.jpeg'),{});
 assert.deepEqual(filenameMetadata('Synthetic 28 desember - 3 januari 2027.jpeg'),{valid_from:'2026-12-28',valid_to:'2027-01-03'});
 assert.equal(filenameMetadata('Wahana fresh 14-21 Oktober 2026.jpeg').condition,undefined);
});
test('overlapping weekly lists preserve every update and average; same-day different amounts remain conflicts',()=>{
 const q=(from,to,amount)=>({supplier:'Synthetic PT',product:'Synthetic item',unit:'kg',condition:'fresh',valid_from:from,valid_to:to,amount});
 let g=compileRecords([q('2026-10-03','2026-10-10',100),q('2026-10-10','2026-10-18',120),q('2026-10-17','2026-10-25',140)],'2026-10-01','2026-10-31');
 assert.equal(g[0].suppliers[0].conflict,false);assert.equal(g[0].suppliers[0].average,120);assert.equal(g[0].quotes.length,3);assert.equal(analytics(g).series[0].latest,140);
 g=compileRecords([q('2026-10-03','',100),q('2026-10-03','',110)],'2026-10-01','2026-10-31');assert.equal(g[0].suppliers[0].conflict,true);
});
test('nested table regions are read once; adjacent blocks survive and the larger complete region is retained',()=>{
 const table=(left,right,top,bottom,geometry)=>({header:{left,right,top,bottom:top+20},rows:[[top+20,bottom]],geometry});
 const full=table(0,300,0,300),inner=table(10,290,100,200),other=table(310,600,0,300);
 assert.deepEqual(distinctTables([inner,other,full]),[full,other]);
 const ruled=table(0,300,25,300,'ruled');assert.deepEqual(distinctTables([full,ruled]),[full]);
});
test('notes and headers cannot become product prices, while ordinary products and low prices remain eligible',()=>{
 for(const s of ['26 Oktober 2026','BEKASI-BANDUNG UP 1.000','MINIMAL ORDER 2 TON','Price List Synthetic 2026'])assert.equal(isSourceNote(s),true,s);
 for(const s of ['KARKAS 06','Kulit','Product 2026'])assert.equal(isSourceNote(s),false,s);
 assert.equal(priceHeaderRecognized(['Item','Harga Spesial']),false);assert.equal(priceHeaderRecognized(['Item','Harga /kg']),true);
});
test('tiered currency prefixes retain the product and map printed quantity columns and terminal kg',()=>{
 const words='Synthetic Product Rp39.500 Rp40.500 Rp41.500 Kg'.split(' ').map((text,i)=>['5','1','1','1','1','1',i*110,50,100,20,95,text].join('\t')).join('\n');
 const text='PRODUCT 500 KG UP 100 - 499 KG 99 KG DOWN SATUAN';assert.deepEqual(quantityHeaders(text),['500 KG UP','100 - 499 KG','99 KG DOWN']);
 const rows=fallbackRows({text,tsv:words},'Synthetic','id-ID');assert.deepEqual(rows.map(r=>r.product),Array(3).fill('Synthetic Product'));assert.deepEqual(rows.map(r=>r.amount),[39500,40500,41500]);assert.deepEqual(rows.map(r=>r.minimum_order),quantityHeaders(text));assert.ok(rows.every(r=>r.unit==='kg'&&!r.reviewed));
});
test('blank source rows are skipped by image evidence; red-heavy posters are explicitly routed away from table OCR',()=>{
 const data=new Uint8ClampedArray(400).fill(255);assert.equal(hasSourceInk({data}),false);assert.equal(isColorPoster({data}),false);
 for(let i=0;i<data.length;i+=4){data[i]=220;data[i+1]=0;data[i+2]=0;}assert.equal(hasSourceInk({data}),true);assert.equal(isColorPoster({data}),true);
});

test('suspicious leading zero grouped OCR amounts require review instead of losing a digit',()=>{assert.equal(readMoneyToken('03.500','id-ID'),null);assert.equal(readMoneyToken('0,500','en-US'),null);assert.equal(readMoneyToken('63.500','id-ID'),63500);});
test('source header condition is explicit and ambiguous header evidence remains unknown',()=>{
 assert.equal(documentCondition('RILIS HARGA UNTUK READY STOCK FROZEN LOCO'),'frozen');
 assert.equal(documentCondition('PRICE LIST AYAM FROZEN (JATENG)'),'frozen');
 assert.equal(documentCondition('HARGA FRESH UNTUK BESOK'),'fresh');
 assert.equal(documentCondition('HARGA FRESH\nHARGA FROZEN'),'lainnya');
 assert.equal(documentCondition('Synthetic document'),'lainnya');
});
test('invalid, empty or oversized AI output cannot replace an existing table',()=>{
 const valid={rows:[{product:'Synthetic',amount:12345,unit:'kg'}],complete:true,warnings:[]};assert.deepEqual(parseAIExtraction(JSON.stringify(valid)),valid);
 for(const rows of [[],[{product:'',amount:12345,unit:'kg'}],[{product:'Synthetic',amount:'12.345',unit:'kg'}],Array(501).fill(valid.rows[0])])assert.throws(()=>parseAIExtraction(JSON.stringify({...valid,rows})));
});
test('Gemini extraction requests a response schema while text review keeps its existing contract',async t=>{
 const key=random(),db=new D1();db.db.exec("CREATE TABLE settings(provider TEXT,ciphertext TEXT,model TEXT,consent INTEGER)");
 db.db.prepare('INSERT INTO settings VALUES(?,?,?,1)').run('gemini',await encrypt('synthetic-api-key',key,'gemini'),'gemini-2.5-flash');
 const sent=[];t.mock.method(globalThis,'fetch',async(url,options)=>{sent.push(JSON.parse(options.body));return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'{}'}]}}]});});
 const env={DB:db,SETTINGS_ENCRYPTION_KEY:key,GEMINI_FREE_CONFIRMED:'true'};
 await callAI(env,'gemini','Synthetic extraction',{file:{mimeType:'image/png',data:'synthetic'},responseSchema:EXTRACTION_SCHEMA});
 assert.equal(sent[0].generationConfig.responseMimeType,'application/json');assert.deepEqual(sent[0].generationConfig.responseSchema.required,['rows','complete','warnings']);
 await callAI(env,'gemini','Synthetic text review');assert.equal(sent[1].generationConfig.responseSchema,undefined);
});
test('dark headers are inverted before OCR without changing light table cells',()=>{
 const pixels={width:4,height:2,data:new Uint8ClampedArray(32).fill(255)};
 for(let i=0;i<28;i+=4)pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=50;
 normalizePolarity(pixels);assert.equal(pixels.data[0],205);assert.equal(pixels.data[28],0);assert.equal(pixels.data[3],255);
 const light={width:4,height:2,data:new Uint8ClampedArray(32).fill(255)};normalizePolarity(light);assert.equal(light.data[0],255);
});
test('a stalled OCR segment fails explicitly and successful OCR retains its output',async()=>{
 const expected={data:{text:'Synthetic'}};assert.deepEqual(await recognizeWithTimeout({recognize:async()=>expected},null,{},100),expected);
 await assert.rejects(()=>recognizeWithTimeout({recognize:()=>new Promise(()=>{})},null,{},5),/potongan lebih kecil/);
});

test('minor OCR glyph errors in a condition header retain the condition column',()=>{assert.equal(tableFields(['KODE ITEM','NAMA BARANG','SATUAN','KONDiIS!','HARGA']).conditionColumn,3);});
