import {detectGridTables} from './ocr.js';
self.onmessage=e=>{try{self.postMessage({tables:detectGridTables(e.data)});}catch{self.postMessage({error:'Deteksi tabel gagal. Pilih potongan lebih kecil.'});}};
