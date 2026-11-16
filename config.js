/* ARCHIVO: config.js — edita solo acá el correo, el banco y el dominio */
const CONFIG={
  soporte:'soporte@cartita.cl',            /* cámbialo por tu correo real */
  dominio:'cartita.cl',                    /* cámbialo cuando compres el dominio */
  banco:{
    titular:'NOMBRE DEL TITULAR',
    rut:'11.111.111-1',
    banco:'Banco de Chile',
    tipo:'Cuenta RUT',
    numero:'00000000',
    correo:'pagos@cartita.cl'
  },
  flow:{activo:false,apiKey:'',secretKey:''},
  precios:{esencial:2990,completo:4990,premium:9990,extension:1990}
};
document.querySelectorAll('a[href^="mailto:"]').forEach(a=>{
  a.href='mailto:'+CONFIG.soporte;
  if(a.textContent.includes('@'))a.textContent=CONFIG.soporte;
});
