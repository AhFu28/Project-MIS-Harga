// One serial worker; a failed/cancelled run is never reused.
export function createOCRSession(factory,{idleMs=60000}={}){
 let worker=null,busy=false,timer=null,progress=()=>{};
 const dispose=async()=>{clearTimeout(timer);timer=null;const old=worker;worker=null;if(old)try{await old.terminate();}catch{}};
 return {dispose,async run(operation,{signal,onProgress=()=>{}}={}){
  if(busy)throw Error('Satu OCR berjalan pada satu waktu.');busy=true;clearTimeout(timer);progress=onProgress;let cancelled=signal?.aborted??false;
  const abort=()=>{cancelled=true;void dispose();};signal?.addEventListener('abort',abort,{once:true});
  try{
   if(cancelled)throw Error('OCR dibatalkan.');
   if(!worker){const created=await factory(message=>progress(message));if(cancelled){await created.terminate();throw Error('OCR dibatalkan.');}worker=created;}
   const result=await operation(worker);if(cancelled)throw Error('OCR dibatalkan.');return result;
  }catch(error){await dispose();throw error;}
  finally{signal?.removeEventListener('abort',abort);busy=false;progress=()=>{};if(worker)timer=setTimeout(()=>{void dispose();},idleMs);}
 }};
}
