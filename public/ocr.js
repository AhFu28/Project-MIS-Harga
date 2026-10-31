import {rawRow} from './data.js';
import {parseMoney} from './lib/rules.js';
import {cleanProductName,normalizeUnit,UNITS,parseSourceWeight} from './lib/standards.js';
let loadPromise;
function load(){return loadPromise??=new Promise((resolve,reject)=>{const el=document.createElement('script');el.src='/vendor/ocr/tesseract.min.js';el.onload=resolve;el.onerror=()=>{loadPromise=null;reject(Error('Engine OCR lokal gagal dimuat. Coba lagi setelah masuk akun.'));};document.head.append(el);});}
const groups=points=>{const out=[];for(const p of points){const last=out.at(-1);if(last&&p<=last.at(-1)+2)last.push(p);else out.push([p]);}return out.map(g=>Math.round(g.reduce((a,b)=>a+b,0)/g.length));};
export function detectRuledTables({data,width:w,height:h}){
 const dark=(x,y)=>{const n=(y*w+x)*4;const light=.299*data[n]+.587*data[n+1]+.114*data[n+2];return light<180||(light<210&&Math.max(data[n],data[n+1],data[n+2])-Math.min(data[n],data[n+1],data[n+2])<50);};
 const segments=[];
 for(let y=0;y<h;y++){
  let left=-1,last=-1,count=0;
  const finish=()=>{if(last-left>=Math.max(70,w*.18)&&count/(last-left+1)>.78)segments.push({left,right:last,y});left=-1;last=-1;count=0;};
  for(let x=0;x<w;x++){if(dark(x,y)){if(left<0)left=x;last=x;count++;}else if(left>=0&&x-last>3)finish();}if(left>=0)finish();
 }
 const clusters=[];for(const s of segments){let c=clusters.find(c=>Math.abs(c.left-s.left)<=5&&Math.abs(c.right-s.right)<=5);if(!c){c={left:s.left,right:s.right,ys:[]};clusters.push(c);}c.ys.push(s.y);}
 const tables=[];
 for(const c of clusters){const lines=groups(c.ys);if(lines.length<5)continue;const top=lines[0],bottom=lines.at(-1);if(bottom-top<35)continue;
  const xs=[];for(let x=c.left;x<=c.right;x++){let hits=0;for(let y=top;y<=bottom;y++)if(dark(x,y))hits++;if(hits/(bottom-top+1)>.72)xs.push(x);}
  const columns=groups(xs).filter((x,i,a)=>i===0||x-a[i-1]>12);if(columns.length<3||columns.length>8)continue;
  const intervals=[];for(let i=1;i<lines.length;i++){const a=lines[i-1],b=lines[i];if(b-a<8||b-a>150)continue;const supported=columns.slice(1,-1).every(x=>{let n=0;for(let y=a+2;y<b-1;y++)if(dark(x,y))n++;return n/Math.max(1,b-a-3)>.65;});if(supported)intervals.push([a,b]);}
  if(intervals.length<3)continue;let start=0;while(start<intervals.length-1&&intervals[start+1][0]-intervals[start][1]>3)start++;
  const header=intervals[start],rows=[];for(const r of intervals.slice(start+1)){if(r[0]-(rows.at(-1)?.[1]??header[1])>4)break;rows.push(r);}if(rows.length<2)continue;
  const candidate={header:{left:columns[0],right:columns.at(-1),top:header[0],bottom:header[1]},rows,columns,geometry:'ruled'};
  if(!tables.some(t=>Math.abs(t.header.left-candidate.header.left)<8&&Math.abs(t.header.right-candidate.header.right)<8))tables.push(candidate);
 }
 return tables.sort((a,b)=>a.header.top-b.header.top||a.header.left-b.header.left);
}
export function detectGridTables({data,width:w,height:h}){
 const orange=(x,y)=>{const i=(y*w+x)*4,r=data[i],g=data[i+1],b=data[i+2];return r>180&&g>110&&g<235&&b<g-20&&r>g+10;};
 const grey=(x,y)=>{const i=(y*w+x)*4,r=data[i],g=data[i+1],b=data[i+2];return r>=65&&r<=215&&Math.max(r,g,b)-Math.min(r,g,b)<25;};
 const dark=(x,y)=>{const i=(y*w+x)*4,r=data[i],g=data[i+1],b=data[i+2];return (r+g+b)/3<130;};
 const bands=[];
 for(let y=0;y<h;y++){let start=-1,last=-1,count=0;const finish=()=>{if(last-start>Math.max(120,w*.07)&&count/(last-start+1)>.65){const old=bands.find(b=>Math.abs(b.left-start)<15&&Math.abs(b.right-last)<25&&y-b.bottom<30);if(old)old.bottom=y;else bands.push({left:start,right:last,top:y,bottom:y});}start=-1;last=-1;count=0;};for(let x=0;x<w;x++){if(orange(x,y)){if(start<0)start=x;last=x;count++;}else if(start>=0&&x-last>6)finish();}if(start>=0)finish();}
 const merged=[];for(const b of bands.filter(b=>b.bottom-b.top>=5&&b.bottom-b.top<=Math.max(120,h*.08))){const old=merged.find(m=>Math.min(m.right,b.right)-Math.max(m.left,b.left)>.75*Math.min(m.right-m.left,b.right-b.left)&&Math.abs(m.top-b.top)<22);if(old){old.left=Math.min(old.left,b.left);old.right=Math.max(old.right,b.right);old.top=Math.min(old.top,b.top);old.bottom=Math.max(old.bottom,b.bottom);}else merged.push({...b});}
 const tables=[];
 for(const head of merged){const next=merged.filter(b=>b.top>head.bottom&&Math.abs(b.left-head.left)<30).sort((a,b)=>a.top-b.top)[0];const end=next?.top??h;const ys=[];let solidLines=0;for(let y=head.bottom+1;y<end;y++){let hits=0,total=0,black=0;for(let bin=0;bin<12;bin++){let n=0;const a=Math.round(head.left+(head.right-head.left)*bin/12),b=Math.round(head.left+(head.right-head.left)*(bin+1)/12);for(let x=a;x<b;x++){if(grey(x,y))n++;if(dark(x,y))black++;}total+=n;if(n>Math.max(2,(b-a)*.25))hits++;}if(black/(head.right-head.left)>.72)solidLines++;if(hits>=10&&total/(head.right-head.left)>.45||black/(head.right-head.left)>.72)ys.push(y);}
 const boundaries=groups(ys);let rows=[];let previous=head.bottom+1;for(const y of boundaries){const gap=y-previous;if(gap>=9&&gap<=70)rows.push([previous,y]);else if(gap>70&&rows.length)break;previous=y;}if(rows.length<2)continue;
 const top=rows[0][0],bottom=rows.at(-1)[1],xs=[];for(let x=head.left+2;x<head.right-2;x++){let n=0,black=0;for(let y=top;y<bottom;y++){if(grey(x,y))n++;if(dark(x,y))black++;}if(solidLines>ys.length*.5?black/(bottom-top)>.8:n/(bottom-top)>.5||black/(bottom-top)>.8)xs.push(x);}
 const cols=[head.left,...groups(xs).filter(x=>x>head.left+25&&x<head.right-25),head.right];const clean=[cols[0]];for(const x of cols.slice(1))if(x-clean.at(-1)>25)clean.push(x);if(clean.length<3||clean.length>7)continue;
 tables.push({header:head,rows,columns:clean});
 }
 const ordered=tables.sort((a,b)=>Math.abs(a.header.left-b.header.left)<20?a.header.top-b.header.top:a.header.left-b.header.left),joined=[];for(const t of ordered){const prev=joined.at(-1);if(prev&&Math.abs(prev.header.left-t.header.left)<5&&t.header.top-prev.rows.at(-1)[1]<=3&&t.header.top>prev.header.bottom&&prev.columns.length===3&&prev.columns.length===t.columns.length&&prev.columns.every((x,i)=>Math.abs(x-t.columns[i])<5)){prev.rows.push([t.header.top,t.header.bottom+1],...t.rows);}else joined.push(t);}// Full ruled grids take precedence over colored product highlights inside them.
 const ruled=detectRuledTables({data,width:w,height:h}).filter(r=>!joined.some(t=>t.header.left<=r.header.left+8&&t.header.right>=r.header.right-8&&t.header.top<r.header.top&&t.rows[0][0]<=r.header.top+3));
 const overlaps=(a,b)=>Math.min(a.header.right,b.header.right)-Math.max(a.header.left,b.header.left)>.8*Math.min(a.header.right-a.header.left,b.header.right-b.header.left)&&a.header.top<=b.header.top+3&&a.rows.at(-1)[1]>=b.header.bottom;
 return [...ruled,...joined.filter(t=>!ruled.some(r=>overlaps(r,t)))].sort((a,b)=>a.header.top-b.header.top||a.header.left-b.header.left);
}
export function readMoneyToken(text,locale){let s=String(text).trim().replace(/(?:Rp|IDR)/gi,'').replace(/\/(?:kg|ekor|pack|pcs)\b/gi,'').trim().replace(/([.,])\s+(?=\d{3}(?:\D|$))/g,'$1');if(/^\d{1,3}(?:\s+\d{3})+$/.test(s))s=s.replace(/\s+/g,'');
 // OCR often interchanges dots and commas; both strict grammars allow at most two decimal places.
 return parseMoney(s,locale)??parseMoney(s,locale==='id-ID'?'en-US':'id-ID');}
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function crop(image,box,clean=false,scale=4){const [left,top,right,bottom]=box,pad=20,c=canvas(Math.max(1,right-left)*scale+pad*2,Math.max(1,bottom-top)*scale+pad*2),ctx=c.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(image,left,top,right-left,bottom-top,pad,pad,c.width-pad*2,c.height-pad*2);if(clean){const pixels=ctx.getImageData(pad,pad,c.width-pad*2,c.height-pad*2),{width:w,height:h,data}=pixels;const lines=[];for(let y=0;y<h;y++){let first=-1,last=-1;for(let x=0;x<w;x++){const i=(y*w+x)*4;if((data[i]+data[i+1]+data[i+2])/3<160){if(first<0)first=x;last=x;}else if(first>=0&&x-last>12){if(last-first>w*.85)lines.push(y);first=-1;}}if(last-first>w*.85)lines.push(y);}for(const line of lines)for(let y=Math.max(0,line-1);y<=Math.min(h-1,line+1);y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;data[i]=data[i+1]=data[i+2]=255;}ctx.putImageData(pixels,pad,pad);}return c;}
function wordsFromTSV(tsv){return (tsv??'').split('\n').map(l=>l.split('\t')).filter(a=>a[0]==='5'&&a[11]?.trim()).map(a=>({text:a[11],x:+a[6],y:+a[7],w:+a[8],h:+a[9],confidence:+a[10],line:a.slice(1,5).join(':')}));}
const metadata=/^(?:wa\s*:|whats?app|telp|telepon|phone|hp\s*:|no\s*[:.]|nomor|tgl\b|tanggal\b|berlaku\b|harga\s+(?:fresh|frozen|untuk)|senin\b|selasa\b|rabu\b|kamis\b|jum['’]?at\b|sabtu\b|minggu\b|price\s*list\b|pricelist\b|daftar\s+harga\b|list harga|stock point|note\b|catatan\b|info\b|pemesanan\b)/i;
export function fallbackRows(data,name,locale){
 const lines=[];for(const word of wordsFromTSV(data.tsv).sort((a,b)=>a.y-b.y||a.x-b.x)){
  const center=word.y+word.h/2;const line=lines.find(l=>l.key===word.line&&Math.abs(l.center-center)<=Math.max(3,Math.min(l.height,word.h)*.42));
  if(line){line.words.push(word);line.center=line.words.reduce((n,w)=>n+w.y+w.h/2,0)/line.words.length;line.height=Math.min(line.height,word.h);}else lines.push({key:word.line,center,height:word.h,words:[word]});
 }
 const rows=[],ordinaryOnly=/horeca/i.test(data.text??'');for(const line of lines.sort((a,b)=>a.center-b.center)){
  const words=line.words.sort((a,b)=>a.x-b.x),text=words.map(x=>x.text).join(' ');if(metadata.test(text.trim()))continue;
  const tokens=[...text.matchAll(/\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\b\d{4,}\b/g)].filter(t=>!/^(?:kg|gr|gram|ton|pcs)\b/i.test(text.slice(t.index+t[0].length)));
  if(!tokens.length)continue;let cursor=0,product='',part=0;
  for(const [i,token]of tokens.entries()){
   const prefix=text.slice(cursor,token.index).trim();if(prefix&&/[A-Za-z]/.test(prefix))product=cleanProductName(prefix);
   if(!product||metadata.test(product)){cursor=token.index+token[0].length;continue;}
   // shortcut: a HORECA heading selects the first ordinary column; verify unusual multi-table layouts manually.
   if(ordinaryOnly&&i>0)break;
   const amount=readMoneyToken(token[0],locale),unit=/\/\s*kg\b/i.test(text)?'kg':/\/\s*ekor\b/i.test(text)?'ekor':'';
   const flags=[ordinaryOnly?'Kolom HORECA diabaikan; verifikasi harga biasa terhadap sumber':'Periksa pasangan barang/harga dan satuan terhadap sumber'];
   if(tokens.length>1&&!ordinaryOnly)flags.push('Beberapa harga pada satu baris; periksa item dan tier.');
   const left=Math.min(...words.map(w=>w.x)),top=Math.min(...words.map(w=>w.y));
   rows.push({...rawRow({product,raw_product:prefix||product,amount,raw_amount:token[0],unit,condition:readSourceCondition('',product),source:name+' · baris OCR '+Math.round(top)+' bagian '+(++part),minimum_order:tokens.length>1&&!ordinaryOnly?'Kolom '+(i+1)+' — verifikasi tier':'',flags},name),source_box:[left,top,Math.max(...words.map(w=>w.x+w.w)),Math.max(...words.map(w=>w.y+w.h))]});
   cursor=token.index+token[0].length;
  }
 }
 return rows;
}
async function layoutOffThread(imageData,signal){return new Promise((resolve,reject)=>{const worker=new Worker('/ocr-layout-worker.js',{type:'module'});const stop=()=>{worker.terminate();reject(Error('OCR dibatalkan.'));};signal?.addEventListener('abort',stop,{once:true});const finish=()=>{signal?.removeEventListener('abort',stop);worker.terminate();};worker.onmessage=e=>{finish();e.data.error?reject(Error(e.data.error)):resolve(e.data.tables);};worker.onerror=()=>{finish();reject(Error('Deteksi tabel gagal. Pilih potongan lebih kecil.'));};worker.postMessage(imageData,[imageData.data.buffer]);if(signal?.aborted)stop();});}
export function readSourceCondition(column,product){const raw=String(column??''),text=/fresh|frozen/i.test(raw)?raw:String(product??''),fresh=/\bfresh\b/i.test(text),frozen=/\bfrozen\b/i.test(text);return fresh===frozen?'lainnya':fresh?'fresh':'frozen';}
export function tableFields(headers){const match=rx=>headers.findIndex(t=>rx.test(t)),skuColumn=match(/kode|code|sku/i),unitColumn=match(/satuan|^unit$/i),conditionColumn=match(/kondisi|condition/i),weightColumn=match(/berat|weight|netto|net weight/i);let nameColumn=headers.findIndex(t=>/nama|produk|product|^item$/i.test(t)&&!/kode|code|sku/i.test(t));if(nameColumn<0)nameColumn=skuColumn===0&&headers.length>2?1:0;const eligible=i=>i!==nameColumn&&i!==skuColumn&&i!==unitColumn&&i!==conditionColumn&&i!==weightColumn&&!/horeca/i.test(headers[i]);let priceColumns=headers.map((t,i)=>eligible(i)&&/harga|price|kg|karton|ton|order/i.test(t)?i:-1).filter(i=>i>=0);if(!priceColumns.length)priceColumns=headers.map((_,i)=>i).filter(i=>i>nameColumn&&eligible(i));return {nameColumn,skuColumn,unitColumn,conditionColumn,weightColumn,priceColumns};}
export function alignColumn(tsv,rows,top,scale,pad=20){const out=rows.map(()=>({text:'',words:[],confidence:100}));for(const w of wordsFromTSV(tsv)){const y=top+(w.y+w.h/2-pad)/scale,index=rows.findIndex(([a,b])=>y>=a&&y<b);if(index>=0)out[index].words.push(w);}for(const r of out){const lines=[];for(const w of r.words.sort((a,b)=>a.y-b.y||a.x-b.x)){const center=w.y+w.h/2;let line=lines.find(l=>Math.abs(l.center-center)<=Math.max(3,Math.min(l.height,w.h)*.45));if(!line){line={center,height:w.h,words:[]};lines.push(line);}line.words.push(w);}r.text=lines.sort((a,b)=>a.center-b.center).map(l=>l.words.sort((a,b)=>a.x-b.x).map(w=>w.text).join(' ')).join(' ');r.confidence=r.words.length?Math.min(...r.words.map(w=>w.confidence??100)):0;}return out;}
function ink(input,trim=24,soft=false){const ctx=input.getContext('2d',{willReadFrequently:true}),pixels=ctx.getImageData(0,0,input.width,input.height),d=pixels.data;for(let n=0;n<d.length;n+=4){const light=.299*d[n]+.587*d[n+1]+.114*d[n+2],v=soft?(light>220?255:light):(light<150?0:255);d[n]=d[n+1]=d[n+2]=v;}ctx.putImageData(pixels,0,0);ctx.fillStyle='#fff';ctx.fillRect(0,0,input.width,trim);ctx.fillRect(0,input.height-trim,input.width,trim);ctx.fillRect(0,0,trim,input.height);ctx.fillRect(input.width-trim,0,trim,input.height);}
export function reconcilePrice(first,second){return first!==null&&second!==null&&first!==second?null:first??second;}
export function priceHeaderRecognized(headers){return headers.some(t=>/harga|price/i.test(t))||headers.filter(t=>/\d.*(?:kg|karton|ton)/i.test(t)).length>=2;}
async function recognizePage(worker,image,name,locale,signal,progress){
 progress('Mendeteksi seluruh tabel…',5);
 const c=canvas(image.width,image.height),ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const tables=await layoutOffThread(ctx.getImageData(0,0,c.width,c.height),signal),rows=[],warnings=[];
 const stop=()=>{if(signal?.aborted)throw Error('OCR dibatalkan. Hasil sebelumnya tetap tersedia.');};
 const read=async(input,numeric=false,psm='7',tsv=false,soft=tsv&&!numeric)=>{stop();if(psm!=='3')ink(input,tsv?20:24,soft);await worker.setParameters({tessedit_pageseg_mode:psm,tessedit_char_whitelist:numeric?'0123456789., ':'',preserve_interword_spaces:'1'});const {data}=await worker.recognize(input,{},tsv?{text:true,tsv:true}:{text:true});return data;};
 if(tables.length){let done=0;progress('Ditemukan '+tables.length+' tabel · membaca header',10);for(const table of tables){
  const head=table.header,headers=[];for(let n=0;n<table.columns.length-1;n++){const cell=crop(image,[table.columns[n]+3,Math.max(head.top,head.bottom-52),table.columns[n+1]-3,head.bottom+1]);headers.push((await read(cell,false,head.bottom-head.top>35?'6':'7')).text.trim());cell.width=cell.height=1;}
  if(table.geometry==='ruled'&&!priceHeaderRecognized(headers)&&table.rows.length>2){
   const [a,b]=table.rows[0],second=[];
   for(let n=0;n<table.columns.length-1;n++){const cell=crop(image,[table.columns[n]+1,a+1,table.columns[n+1]-1,b-1],false,6);second.push((await read(cell,false,'7',false,false)).text.trim());cell.width=cell.height=1;}
   if(priceHeaderRecognized(second)){headers.splice(0,headers.length,...second);table.rows=table.rows.slice(1);}
  }
  const {nameColumn,skuColumn,unitColumn,conditionColumn,weightColumn,priceColumns}=tableFields(headers);if(!priceColumns.length||table.geometry==='ruled'&&!priceHeaderRecognized(headers)){warnings.push('Header harga belum dikenali; tabel tidak dipaksakan menjadi data harga. Gunakan teks mentah atau bantuan AI.');continue;}
  const columns=new Map(),top=table.rows[0][0],bottom=table.rows.at(-1)[1],dense=table.rows.some(([a,b])=>b-a<18);
  for(const n of new Set([nameColumn,...priceColumns,skuColumn,unitColumn,conditionColumn,weightColumn].filter(n=>n>=0))){if(dense&&(n===nameColumn||priceColumns.includes(n)))continue;const box=[table.columns[n]+1,top,table.columns[n+1]-1,bottom],scale=Math.max(1,Math.min(4,Math.floor(Math.sqrt(3500000/((box[2]-box[0])*(box[3]-box[1])))))),column=crop(image,box,false,scale);const cc=column.getContext('2d');cc.fillStyle='#fff';for(const boundary of [top,...table.rows.map(r=>r[1])])cc.fillRect(0,Math.max(0,20+(boundary-top)*scale-scale),column.width,scale*2);const data=await read(column,priceColumns.includes(n),'6',true,n===nameColumn||n===conditionColumn);columns.set(n,alignColumn(data.tsv,table.rows,top,scale));column.width=column.height=1;progress('Membaca blok '+(done+1)+'/'+tables.length+' · kolom '+(n+1),10+80*(done+.45*(n+1)/(table.columns.length-1))/tables.length);}
  for(const [i,[a,b]]of table.rows.entries()){
   progress('Memeriksa tabel '+(done+1)+'/'+tables.length+' · baris '+(i+1)+'/'+table.rows.length,10+80*(done+.45+.55*(i+1)/table.rows.length)/tables.length);
   let nameCell=columns.get(nameColumn)?.[i];if(dense){const cell=crop(image,[table.columns[nameColumn]+1,a+1,table.columns[nameColumn+1]-1,b-1],false,6);const data=await read(cell,false,'7',false,true);nameCell={text:data.text.trim(),confidence:data.confidence};cell.width=cell.height=1;}
   const originalName=nameCell?.text??'',product=cleanProductName(originalName),rawUnit=columns.get(unitColumn)?.[i].text??'',rawCondition=columns.get(conditionColumn)?.[i].text??'';let rawWeight=columns.get(weightColumn)?.[i].text??'',weight=parseSourceWeight(rawWeight);const weightFlags=[];if(weightColumn>=0&&(!weight||columns.get(weightColumn)?.[i].confidence<85)){const cell=crop(image,[table.columns[weightColumn]+1,a+1,table.columns[weightColumn+1]-1,b-1]),alternate=(await read(cell,false,'7',false,true)).text.trim(),parsed=parseSourceWeight(alternate);cell.width=cell.height=1;if(parsed&&(!weight||weight.kg===parsed.kg)){if(!weight)weightFlags.push('Berat dibaca ulang; periksa terhadap sumber.');rawWeight=alternate;weight=parsed;}else if(parsed&&weight.kg!==parsed.kg){weightFlags.push('Dua bacaan berat berbeda: '+rawWeight+' / '+alternate);rawWeight=rawWeight+' / '+alternate;weight=null;}}
   const heading=headers.join(' '),unitCandidate=normalizeUnit(rawUnit)||(/harga\s*\/\s*kg/i.test(heading)?'kg':/harga\s*\/\s*ekor/i.test(heading)?'ekor':'');
   const unit=UNITS.includes(unitCandidate)?unitCandidate:'';
   const condition=readSourceCondition(rawCondition,originalName);
   for(const n of priceColumns){const text=columns.get(n)?.[i]?.text??'',first=readMoneyToken(text,locale),flags=[...weightFlags],box=[table.columns[n]+2,a+1,table.columns[n+1]-2,b-1];let amount=first;
    if(first===null||(columns.get(n)?.[i]?.confidence??0)<85){const retry=crop(image,box,false,dense?6:4),retryData=await read(retry,true),again=readMoneyToken(retryData.text,locale);retry.width=retry.height=1;if(!dense&&(first!==again||first===null))flags.push('Harga perlu diperiksa: '+text+' / '+(again??'kosong'));if((retryData.confidence??0)<85)flags.push('Keyakinan baca harga rendah; cocokkan angka dengan sumber.');amount=reconcilePrice(first,again);}
    if(!product&&!text&&amount===null)flags.push('Baris sumber belum terbaca; isi manual atau baca ulang dengan AI.');if((nameCell?.confidence??0)<85)flags.push('Nama barang perlu diperiksa terhadap sumber.');if(!unit)flags.push(weightColumn>=0?'Kolom Berat bukan satuan harga. Pilih harga per kg/pack/ekor sesuai sumber.':'Satuan belum terbaca');if(rawWeight&&!weight)flags.push('Berat perlu diperiksa: '+rawWeight);if(/fresh/i.test(rawCondition)&&/frozen/i.test(rawCondition))flags.push('Kondisi Fresh/Frozen; pilih kondisi yang sesuai.');
    rows.push({...rawRow({product,raw_product:originalName,sku:columns.get(skuColumn)?.[i].text??'',pack:rawWeight,amount,raw_amount:text,unit,condition,minimum_order:priceColumns.length>1?headers[n]:'',source:name+' · blok '+(done+1)+' baris '+(i+1)+' kolom '+(n+1),flags,notes:'OCR per kolom, disejajarkan ke garis baris sumber. '+heading+' · Satuan sumber: '+rawUnit+(rawWeight?' · Berat sumber: '+rawWeight:'')},name),source_box:[table.columns[nameColumn],a,table.columns[n+1],b]});
   }
  }
  done++;
 }warnings.push('Ditemukan '+tables.length+' blok tabel. Periksa jumlah baris, header, satuan, dan tier terhadap sumber; hasil belum dijamin lengkap.');
 }if(!rows.length){if(c.width*c.height>6000000)throw Error('Susunan tabel belum dikenali dan gambar melebihi 6 MP. Pilih potongan agar OCR tetap ringan.');const data=await read(c,false,'3',true);rows.push(...fallbackRows(data,name,locale));warnings.push('Susunan sel belum dikenali. Metadata dan nomor urut disaring; hasil masih kandidat baris. Periksa kelengkapan terhadap sumber.');return {rows,warnings,rawText:data.text};}
 c.width=c.height=1;return {rows,warnings,rawText:''};
}
export async function localOCR(source,{locale='id-ID',signal,onProgress=()=>{}}={}){
 await load();if(!source.file)throw Error('Pilih kembali file sumber dari perangkat.');onProgress('Menyiapkan OCR lokal…');const worker=await globalThis.Tesseract.createWorker('eng',1,{workerPath:'/vendor/ocr/worker.min.js',corePath:'/vendor/ocr',langPath:'/vendor/ocr',logger:m=>{if(m.status==='recognizing text')onProgress('Membaca bagian aktif… '+Math.round(m.progress*100)+'%');}});const abort=()=>{void worker.terminate();};signal?.addEventListener('abort',abort,{once:true});const results={rows:[],warnings:[],rawText:''};let pdf;
 try{if(source.mime==='application/pdf'){const pdfjs=await import('/vendor/pdf.mjs');pdfjs.GlobalWorkerOptions.workerSrc='/vendor/pdf.worker.mjs';pdf=await pdfjs.getDocument({data:new Uint8Array(await source.file.arrayBuffer()),isEvalSupported:false}).promise;if(pdf.numPages>10)throw Error('PDF maksimum 10 halaman untuk OCR lokal; pisahkan file.');for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n),vp=page.getViewport({scale:1.5});if(vp.width*vp.height>6000000)throw Error('Halaman terlalu besar; gunakan potongan gambar maksimal 6 MP.');const c=canvas(vp.width,vp.height);await page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;const out=await recognizePage(worker,c,source.filename+' halaman '+n,locale,signal,onProgress);results.rows.push(...out.rows);results.warnings.push(...out.warnings);results.rawText+=out.rawText+'\n';c.width=c.height=1;}}
 else{const bitmap=await createImageBitmap(source.file);if(bitmap.width*bitmap.height>12000000){bitmap.close();throw Error('Gambar melebihi 12 MP; pilih potongan tanpa mengurangi keterbacaan.');}source.dimensions={width:bitmap.width,height:bitmap.height};const out=await recognizePage(worker,bitmap,source.filename,locale,signal,onProgress);Object.assign(results,out);bitmap.close();}
 onProgress('OCR selesai · periksa hasil',100);return results;
 }finally{signal?.removeEventListener('abort',abort);await worker.terminate();await pdf?.destroy();}
}
