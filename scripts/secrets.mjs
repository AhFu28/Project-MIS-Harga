import {verifier,random} from '../src/crypto.js';
import {createInterface} from 'node:readline/promises';
const rl=createInterface({input:process.stdin,output:process.stdout});
console.log('Jalankan hanya di komputer pribadi. Nilai berikut adalah SECRET; jangan commit.');
const password=await rl.question('Password aplikasi (input terlihat pada terminal lokal): ');rl.close();
if(password.length<10)throw Error('Password minimal 10 karakter.');
console.log('APP_PASSWORD_HASH='+await verifier(password));console.log('SETTINGS_ENCRYPTION_KEY='+random());
console.log('Salin ke Cloudflare runtime Secrets. Jangan kirim hasil ini ke chat.');
