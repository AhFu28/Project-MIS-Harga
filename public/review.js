import {issues,norm} from './lib/rules.js';
export const PAGE_SIZE=25;
export function reviewPage(rows,items,{filter='all',search='',page=0}={}){
 const query=norm(search),entries=rows.map((row,index)=>({r:row,i:index}));
 const selected=entries.filter(({r})=>(filter!=='issues'||issues(r,items).length)&&(filter!=='unmapped'||!r.category_id)&&norm(r.product+' '+r.sku).includes(query));
 const pages=Math.max(1,Math.ceil(selected.length/PAGE_SIZE)),current=Math.min(Math.max(0,page),pages-1);
 return {rows:selected.slice(current*PAGE_SIZE,(current+1)*PAGE_SIZE),count:selected.length,pages,page:current,issues:entries.filter(({r})=>issues(r,items).length).length};
}
