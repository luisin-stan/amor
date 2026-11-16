/* ARCHIVO: editor.js */
const PLANES={
  esencial:{n:'Esencial',p:2990,fotos:3,musica:0,voz:0,video:false,cierres:['sobre','nota'],modos:['abierta']},
  completo:{n:'Completo',p:4990,fotos:15,musica:1,voz:1,video:false,cierres:['sobre','nota','polaroid','caja'],modos:['abierta','clave']},
  premium:{n:'Premium',p:9990,fotos:30,musica:2,voz:2,video:true,cierres:['sobre','nota','polaroid','caja','frasco','vinilo','pelicula','avion'],modos:['abierta','clave','programada']}
};
const CIERRES=[['sobre','Sobre con lacre'],['nota','Nota doblada'],['polaroid','Polaroid'],['caja','Caja de regalo'],['frasco','Frasco'],['vinilo','Vinilo'],['pelicula','Película'],['avion','Avión']];
const MODOS=[['abierta','Abierta'],['clave','Con clave'],['programada','Programada']];
const q=new URLSearchParams(location.search);
const plan=PLANES[q.get('plan')]||PLANES.completo;
const $=id=>document.getElementById(id);
const CLAVE='cartita_borrador';
const campos=['de','para','fecha','mensaje','clave','instruccion','pista','apertura','hora','video'];
let fotos=[];

function guardar(){
  const d={fotos:fotos.slice(0,6)};
  campos.forEach(c=>d[c]=$(c).value);
  d.modo=(document.querySelector('input[name=modo]:checked')||{}).value;
  d.cierre=(document.querySelector('input[name=cierre]:checked')||{}).value;
  try{localStorage.setItem(CLAVE,JSON.stringify(d));}catch(e){}
}
function cargar(){
  let d;try{d=JSON.parse(localStorage.getItem(CLAVE)||'null');}catch(e){return;}
  if(!d)return;
  campos.forEach(c=>{if(d[c])$(c).value=d[c];});
  if(d.fotos&&d.fotos.length){fotos=d.fotos;pintarFotos();}
  if(d.modo){const r=document.querySelector('input[name=modo][value="'+d.modo+'"]');if(r&&!r.disabled){r.checked=true;r.dispatchEvent(new Event('change'));}}
  if(d.cierre){const r=document.querySelector('input[name=cierre][value="'+d.cierre+'"]');if(r&&!r.disabled)r.checked=true;}
  $('cuentaTxt').textContent=$('mensaje').value.length;
}

$('planInfo').innerHTML='<b>'+plan.n+'</b>'+plan.p.toLocaleString('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0});
$('total').innerHTML='<small>Total</small>'+plan.p.toLocaleString('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0});
$('totalPrev').textContent=plan.p.toLocaleString('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0});

CIERRES.forEach(([v,t])=>{
  const l=document.createElement('label');
  if(!plan.cierres.includes(v))l.className='bloq';
  l.innerHTML='<input type="radio" name="cierre" value="'+v+'"'+(plan.cierres.includes(v)?'':' disabled')+(v==='sobre'?' checked':'')+'>'+t;
  $('opCierre').appendChild(l);
});
MODOS.forEach(([v,t])=>{
  const l=document.createElement('label');
  if(!plan.modos.includes(v))l.className='bloq';
  l.innerHTML='<input type="radio" name="modo" value="'+v+'"'+(plan.modos.includes(v)?'':' disabled')+(v==='abierta'?' checked':'')+'>'+t;
  $('opModo').appendChild(l);
});
$('ayudaModo').textContent=plan.modos.length===1?'Tu plan permite solo apertura inmediata. Con el Completo puedes poner clave y con el Premium programar la fecha.':'Elige cómo la va a abrir.';

document.querySelectorAll('input[name=modo]').forEach(r=>r.addEventListener('change',()=>{
  $('zonaClave').style.display=r.value==='clave'&&r.checked?'block':'none';
  $('zonaProg').style.display=r.value==='programada'&&r.checked?'block':'none';
}));

/* fotos */
$('inputFotos').addEventListener('change',async e=>{
  const files=[...e.target.files].slice(0,plan.fotos-fotos.length);
  for(const f of files)fotos.push(await achicar(f));
  pintarFotos();e.target.value='';
});
function achicar(file){
  return new Promise(res=>{
    const img=new Image(),r=new FileReader();
    r.onload=()=>img.src=r.result;
    img.onload=()=>{
      const max=1200,esc=Math.min(1,max/Math.max(img.width,img.height));
      const c=document.createElement('canvas');
      c.width=img.width*esc;c.height=img.height*esc;
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      res(c.toDataURL('image/webp',.78));
    };
    r.readAsDataURL(file);
  });
}
function pintarFotos(){
  $('zonaFotos').innerHTML='';
  fotos.forEach((src,i)=>{
    const d=document.createElement('div');d.className='f';
    d.innerHTML='<img src="'+src+'" alt=""><button aria-label="Quitar">✕</button>';
    d.querySelector('button').onclick=()=>{fotos.splice(i,1);pintarFotos();};
    $('zonaFotos').appendChild(d);
  });
  $('cuentaFotos').textContent=fotos.length+' de '+plan.fotos+' fotos';
  guardar();
}

/* musica y voz */
function bloqueAudio(id,etiqueta){
  const w=document.createElement('div');
  w.innerHTML='<label>'+etiqueta+'</label><input type="text" placeholder="https://youtu.be/...">';
  $(id).appendChild(w);
}
if(plan.musica>0){for(let i=1;i<=plan.musica;i++)bloqueAudio('zonaMusica','Canción '+i);}
else $('secMusica').style.display='none';

if(plan.voz>0){
  for(let i=1;i<=plan.voz;i++){
    const w=document.createElement('div');
    w.innerHTML='<div class="grabar"><button type="button">● Grabar</button><span class="est"></span></div><audio controls style="display:none"></audio>';
    const b=w.querySelector('button'),au=w.querySelector('audio'),est=w.querySelector('.est');
    let rec=null,trozos=[];
    b.onclick=async()=>{
      if(rec&&rec.state==='recording'){rec.stop();return;}
      try{
        const st=await navigator.mediaDevices.getUserMedia({audio:true});
        rec=new MediaRecorder(st);trozos=[];
        rec.ondataavailable=e=>trozos.push(e.data);
        rec.onstop=()=>{
          st.getTracks().forEach(t=>t.stop());
          au.src=URL.createObjectURL(new Blob(trozos));
          au.style.display='block';b.textContent='● Grabar de nuevo';b.classList.remove('grabando');est.textContent='Grabado';
        };
        rec.start();b.textContent='■ Detener';b.classList.add('grabando');est.textContent='Grabando…';
        setTimeout(()=>{if(rec.state==='recording')rec.stop();},60000);
      }catch(err){est.textContent='Sin permiso de micrófono. Sube un archivo.';}
    };
    $('zonaVoz').appendChild(w);
  }
}else $('secVoz').style.display='none';

if(!plan.video)$('secVideo').style.display='none';

$('mensaje').addEventListener('input',e=>$('cuentaTxt').textContent=e.target.value.length);

/* vista previa */
$('btnPrev').addEventListener('click',()=>{
  const de=$('de').value||'Alguien',para=$('para').value||'ti',msg=$('mensaje').value;
  const modo=document.querySelector('input[name=modo]:checked').value;
  const cierre=document.querySelector('input[name=cierre]:checked').value;
  let cab='<p style="font-family:var(--sans);font-size:.8rem;color:var(--gris);margin:0 0 6px">'+cierre+' · '+modo+'</p>';
  if(modo==='clave')cab+='<p style="font-family:var(--sans);font-size:.85rem;background:#F2EDE3;padding:8px 12px;border-radius:6px">'+($('instruccion').value||'Escribe la fecha')+'</p>';
  if(modo==='programada')cab+='<p style="font-family:var(--sans);font-size:.85rem;background:#F2EDE3;padding:8px 12px;border-radius:6px">Se abre el '+($('apertura').value||'—')+' a las '+($('hora').value||'20:00')+'</p>';
  $('prevCarta').innerHTML=cab+'<p style="font-family:var(--sans);color:var(--gris)">de '+de+' · Para '+para+'</p><h3>'+(msg.split('\n')[0]||'Tu carta')+'</h3>'+
    msg.split('\n').slice(1).map(l=>'<p>'+l+'</p>').join('')+
    '<div class="pg">'+fotos.map(f=>'<img src="'+f+'" alt="">').join('')+'</div>';
  $('prev').classList.add('visible');window.scrollTo(0,0);
});
$('cerrarPrev').addEventListener('click',()=>$('prev').classList.remove('visible'));

/* guardado automático y restauración */
document.querySelectorAll('input,textarea,select').forEach(el=>{
  el.addEventListener('change',guardar);
  if(el.tagName==='TEXTAREA'||el.type==='text')el.addEventListener('input',guardar);
});
cargar();

$('btnPagar').addEventListener('click',()=>{guardar();location.href='pagar.html?plan='+(q.get('plan')||'completo');});
