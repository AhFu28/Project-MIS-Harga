import {normalizeUnit} from './lib/standards.js';
import {norm,signature,suggestions,parseMoney,parseDelimited} from './lib/rules.js';
export {norm};export const sig=signature,proposeItems=(product,items,row)=>suggestions({...row,product},items),money=parseMoney;
export const columns=['product','amount','unit','condition','pack','channel','region','basis','source','item_id','notes'];
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const parseCSV=s=>parseDelimited(s);
export function excelDate(v){if(v instanceof Date)return v.toISOString().slice(0,10);if(!v)return '';const s=String(v).trim();if(/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s))&&new Date(s+'T00:00Z').toISOString().slice(0,10)===s)return s;return '';}
export function filenameMetadata(filename){
 const name=String(filename).trim().toLowerCase(),out={},supplier=name.match(/^(wahana|ciomas|chikin|sulaiman|belsmart|berdikari)\b/);
 if(supplier)out.supplier=supplier[1][0].toUpperCase()+supplier[1].slice(1);
 const months=['januari','februari','maret','april','mei','juni','juli','agustus','september','oktober','november','desember'],month='('+months.join('|')+')',make=(d,m,y)=>excelDate(y+'-'+String(months.indexOf(m)+1).padStart(2,'0')+'-'+d.padStart(2,'0'));
 const cross=name.match(new RegExp('(\\d{1,2})\\s+'+month+'(?:\\s+(\\d{4}))?\\s*[-–]\\s*(\\d{1,2})\\s+'+month+'\\s+(\\d{4})'));
 if(cross){const [,d1,m1,y1,d2,m2,y2]=cross,year=y1??(months.indexOf(m1)>months.indexOf(m2)?String(Number(y2)-1):y2),from=make(d1,m1,year),to=make(d2,m2,y2);if(from&&to&&from<=to)Object.assign(out,{valid_from:from,valid_to:to});return out;}
 const same=name.match(new RegExp('(\\d{1,2})(?:\\s*[-–]\\s*(\\d{1,2}))?\\s+'+month+'\\s+(\\d{4})'));
 if(same){const [,d1,d2,m,y]=same,from=make(d1,m,y),to=d2?make(d2,m,y):'';if(from&&(!d2||to&&from<=to))Object.assign(out,{valid_from:from,...(to?{valid_to:to}:{})});}
 return out;
}
export function guessHeader(headers,candidates){return headers.findIndex(h=>candidates.includes(norm(h)));}
export function tsvSafe(v){const s=String(v??'');return (/^[=+@-]/.test(s)?"'"+s:s).replace(/[\t\r\n]/g,' ');}
export function rawRow(r,source,locale='en-US'){return {product:String(r.product??''),raw_product:String(r.raw_product??r.product??''),raw_amount:String(r.raw_amount??r.amount??''),amount:money(r.amount,typeof r.amount==='number'?'en-US':locale),unit:normalizeUnit(r.unit),condition:['fresh','frozen','lainnya'].includes(r.condition)?r.condition:'lainnya',pack:String(r.pack??''),size:String(r.size??''),cut:String(r.cut??''),sku:String(r.sku??''),channel:String(r.channel??''),region:String(r.region??''),basis:String(r.basis??'belum diketahui'),minimum_order:String(r.minimum_order??''),source:String(r.source??source??''),notes:String(r.notes??''),valid_from:excelDate(r.valid_from),valid_to:excelDate(r.valid_to),source_row:r.source_row,category_origin:r.category_origin??null,category_id:r.category_id??null,item_id:r.item_id??null,in_comparison:r.in_comparison??Boolean(r.item_id||r.category_id),flags:Array.isArray(r.flags)?r.flags.map(String):[],reviewed:r.reviewed===true,source_hash:String(r.source_hash??''),source_box:r.source_box??null,item_snapshot:r.item_snapshot??null,conversion:r.conversion??null};}
export function parseAIExtraction(text){
 const parsed=JSON.parse(text.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));
 if(!Array.isArray(parsed.rows)||parsed.rows.length===0||parsed.rows.length>500||!parsed.rows.every(r=>r&&typeof r.product==='string'&&r.product.trim()&&(r.amount===null||typeof r.amount==='number'&&money(r.amount)!==null)&&typeof r.unit==='string'))throw Error('Tabel AI tidak valid atau kosong. Tabel lama dipertahankan; gunakan potongan lebih kecil atau isi manual.');
 if(parsed.warnings!==undefined&&(!Array.isArray(parsed.warnings)||!parsed.warnings.every(x=>typeof x==='string')))throw Error('Format peringatan AI tidak valid.');
 return parsed;
}

export function weeksInRange(from,to,points){if(!excelDate(from)||!excelDate(to)||from>to)throw Error('Rentang tanggal tidak valid.');if((new Date(to)-new Date(from))/86400000>3650)throw Error('Pilih rentang maksimal 10 tahun.');const start=new Date(from+'T00:00Z');start.setUTCDate(start.getUTCDate()-(start.getUTCDay()+6)%7);const out=[];for(let n=0;start.toISOString().slice(0,10)<=to&&n<530;n++,start.setUTCDate(start.getUTCDate()+7)){const week=start.toISOString().slice(0,10);out.push(points.find(p=>p.week===week)??{week,amount:null,count:0,missing:true});}return out;}
