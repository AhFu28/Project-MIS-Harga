import {check} from './domain.js';
const te=new TextEncoder();
export const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b)));
export const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
export const random=()=>b64(crypto.getRandomValues(new Uint8Array(32)));
export async function digest(s){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',typeof s==='string'?te.encode(s):s))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function verifier(password,salt=random()){const key=await crypto.subtle.importKey('raw',te.encode(password),'PBKDF2',false,['deriveBits']);const result=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:unb64(salt),iterations:100000},key,256);return salt+':'+b64(result);}
export async function passwordMatches(password,stored){try{const [salt,expected]=stored.split(':');const actual=(await verifier(password,salt)).split(':')[1];const key=await crypto.subtle.importKey('raw',te.encode('mis-harga-constant-time-comparison'),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);const sig=await crypto.subtle.sign('HMAC',key,te.encode(expected));return await crypto.subtle.verify('HMAC',key,sig,te.encode(actual));}catch{return false;}}
async function aes(secret,usage){check(typeof secret==='string','Kunci enkripsi belum diatur.',503);let bytes;try{bytes=unb64(secret);}catch{check(false,'Format kunci enkripsi salah.',503);}check(bytes.length===32,'Kunci enkripsi harus 32 byte base64.',503);return crypto.subtle.importKey('raw',bytes,'AES-GCM',false,usage);}
export async function encrypt(value,secret,provider){const iv=crypto.getRandomValues(new Uint8Array(12));const key=await aes(secret,['encrypt']);const data=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:te.encode('mis-harga:v1:'+provider)},key,te.encode(value));return b64(iv)+'.'+b64(data);}
export async function decrypt(value,secret,provider){const [iv,data]=value.split('.');const key=await aes(secret,['decrypt']);return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(iv),additionalData:te.encode('mis-harga:v1:'+provider)},key,unb64(data)));}
