const form=document.querySelector('#entry-form');
const message=document.querySelector('#entry-error');
form.addEventListener('submit',async event=>{
 event.preventDefault();const button=form.querySelector('button');button.disabled=true;message.textContent='';
 try{
  const response=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:form.elements.username.value,password:form.elements.password.value})});
  const result=await response.json();
  if(!response.ok)throw Error(result.error??'Tidak dapat masuk. Coba lagi.');
  form.reset();window.location.replace('/');
 }catch(error){message.textContent=error.message;}finally{button.disabled=false;}
});
