import {test} from 'node:test';
import assert from 'node:assert/strict';
import {addCategoryCopies,reusableCategoryRules} from '../public/review.js';
import {rawRow} from '../public/data.js';
import {batchInput,compileRecords} from '../src/team.js';
const make=()=>rawRow({product:'Synthetic shared source',amount:12345,unit:'kg',condition:'frozen',source:'Synthetic row 1',source_row:1});
test('multi-item selection retains one price per item and its exact source, does not duplicate an existing target',()=>{
 const rows=[make()];const result=addCategoryCopies(rows,0,['std-paha-atas','std-paha-bawah'],true,()=> 'synthetic-group');assert.equal(result.created,1);assert.equal(rows.length,2);assert.deepEqual(rows.map(r=>r.category_id),['std-paha-atas','std-paha-bawah']);assert.ok(rows.every(r=>r.amount===12345&&r.mapping_group==='synthetic-group'&&r.source==='Synthetic row 1'&&!r.reviewed));assert.throws(()=>addCategoryCopies(rows,0,['std-paha-bawah'],true),/sudah/);
 const batch=batchInput({supplier:'Synthetic PT',valid_from:'2026-11-01',rows});assert.ok(batch.rows.every(r=>r.mapping_group==='synthetic-group'));const restored=batch.rows.map(r=>rawRow(r));assert.ok(restored.every(r=>r.mapping_group==='synthetic-group'));const groups=compileRecords(batch.rows,'2026-11-01','2026-11-01');assert.equal(groups.length,2);assert.ok(groups.every(g=>g.quotes.length===1&&g.suppliers[0].average===12345));
});
test('confirmation, category validity and capacity are checked before any source row is mutated',()=>{
 const rows=[make()],before=structuredClone(rows);for(const [ids,confirmed] of [[['std-paha-atas','std-paha-bawah'],false],[['unknown'],true],[['std-paha-atas'],true]]){assert.throws(()=>addCategoryCopies(rows,0,ids,confirmed));assert.deepEqual(rows,before);}
 const full=Array.from({length:500},make);assert.throws(()=>addCategoryCopies(full,0,['std-paha-atas','std-paha-bawah'],true),/500/);assert.equal(full.length,500);assert.ok(full.every(r=>!r.category_id));
});
test('shared source mappings remain batch-specific, while unambiguous identities can still be remembered',()=>{
 const rows=[make()];addCategoryCopies(rows,0,['std-paha-atas','std-paha-bawah'],true,()=> 'synthetic-group');const single=rawRow({product:'Synthetic other',amount:22222,unit:'kg',category_id:'std-dada-utuh'});rows.push(single);const rules=reusableCategoryRules(rows);assert.deepEqual(rules.rows,[single]);assert.deepEqual(rules.ambiguous,['Synthetic shared source']);
});
