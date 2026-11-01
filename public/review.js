import {issues,norm} from './lib/rules.js';
import {ruleKey,signature} from './lib/rules.js';
import {category} from './lib/standards.js';
export const PAGE_SIZE=25;
export function reviewPage(rows,items,{filter='all',search='',page=0}={}){
 const query=norm(search),entries=rows.map((row,index)=>({r:row,i:index}));
 const selected=entries.filter(({r})=>(filter!=='issues'||issues(r,items).length)&&(filter!=='unmapped'||!r.category_id)&&norm(r.product+' '+r.sku).includes(query));
 const pages=Math.max(1,Math.ceil(selected.length/PAGE_SIZE)),current=Math.min(Math.max(0,page),pages-1);
 return {rows:selected.slice(current*PAGE_SIZE,(current+1)*PAGE_SIZE),count:selected.length,pages,page:current,issues:entries.filter(({r})=>issues(r,items).length).length};
}
export function addCategoryCopies(rows,index,ids,confirmed,makeId=()=>crypto.randomUUID()){
 const source=rows[index],selected=[...new Set(ids)];if(!source||!selected.length||selected.some(id=>!category(id)))throw Error('Pilih item standar yang valid.');if(confirmed!==true)throw Error('Konfirmasi bahwa harga sumber berlaku untuk semua item yang dipilih.');
 const existing=new Set((source.mapping_group?rows.filter(r=>r.mapping_group===source.mapping_group):[source]).map(r=>r.category_id).filter(Boolean));const added=selected.filter(id=>!existing.has(id));if(!added.length)throw Error('Item tersebut sudah memiliki baris untuk sumber ini.');
 if(existing.size+added.length<2)throw Error('Pilih minimal dua item, atau gunakan pilihan tunggal di tabel.');
 const extraCount=added.length-(source.category_id?0:1);if(rows.length+extraCount>500)throw Error('Hasil melebihi 500 baris. Pisahkan batch sebelum menambah item.');
 const group=source.mapping_group||makeId(),base=structuredClone(source),created=[];
 for(const id of added){const target=!source.category_id&&!created.length?source:structuredClone(base);Object.assign(target,{mapping_group:group,category_id:id,category_origin:'manual-shared',item_id:null,item_snapshot:null,in_comparison:true,reviewed:false});if(target!==source)created.push(target);}
 source.mapping_group=group;source.reviewed=false;const flag='Harga sumber dipakai untuk beberapa item standar; periksa cakupan terhadap sumber.';
 for(const r of [...rows.filter(r=>r.mapping_group===group),...created]){r.flags=[flag,...(r.flags??[]).filter(x=>x!==flag)].slice(0,10);r.reviewed=false;}
 rows.splice(index+1,0,...created);return {created:created.length,group};
}
export function reusableCategoryRules(rows){
 const byIdentity=new Map();for(const r of rows.filter(r=>r.category_id)){const key=JSON.stringify([ruleKey(r),signature(r)]);if(!byIdentity.has(key))byIdentity.set(key,[]);byIdentity.get(key).push(r);}
 return {rows:[...byIdentity.values()].filter(rs=>new Set(rs.map(r=>r.category_id)).size===1).map(rs=>rs[0]),ambiguous:[...byIdentity.values()].filter(rs=>new Set(rs.map(r=>r.category_id)).size>1).map(rs=>rs[0].product)};
}
