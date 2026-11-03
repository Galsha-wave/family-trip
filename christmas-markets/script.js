(function(){
  'use strict';
  var root=document.documentElement, KEY='xmas-theme-v1';
  function apply(t){root.setAttribute('data-theme',t);var m=document.querySelector('meta[name=theme-color]');if(m)m.content=t==='dark'?'#0d1512':'#0f3d2e';}
  var saved=null;try{saved=localStorage.getItem(KEY);}catch(e){}
  apply(saved||(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));
  var btn=document.getElementById('themeBtn');
  if(btn)btn.addEventListener('click',function(){var t=root.getAttribute('data-theme')==='dark'?'light':'dark';apply(t);try{localStorage.setItem(KEY,t);}catch(e){}});

  // all external links open in a new tab
  document.querySelectorAll('a[href^="http"]').forEach(function(a){a.target='_blank';a.rel='noopener noreferrer';});

  // active nav item
  var links=[].slice.call(document.querySelectorAll('.nav a'));
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){links.forEach(function(l){l.classList.toggle('active',l.getAttribute('href')==='#'+e.target.id);});}});},{rootMargin:'-40% 0px -55% 0px'});
    links.forEach(function(l){var s=document.querySelector(l.getAttribute('href'));if(s)io.observe(s);});
  }

  // Map: coordinates from OpenStreetMap Nominatim (3.11.2026), looked up by place name.
  var C={m:'#c8102e',h:'#0f5a3f',c:'#7a4cc2',w:'#2f6fc4'};
  var P={
    budapest:{center:[47.505,19.07],zoom:12,pts:[
      ['m',47.4963706,19.0504065,'Vörösmarty Classic Xmas','שוק'],
      ['m',47.5007766,19.0539650,'Advent Bazilika','שוק'],
      ['h',47.4935567,19.0583972,'Exe Budapest Center','מלון מרכזי · ביטול חינם עד 1.12'],
      ['h',47.5136737,19.1373090,'Hotel Amadeus','מלון חסכוני · ביטול חינם עד 28.11'],
      ['w',47.5857799,19.0489509,'Csodák Palotája','ליום קר'],
      ['c',47.4977596,19.0391711,'Sikló','רכבל'],
      ['c',47.5023053,19.0346998,'מבצר הדייגים',''],
      ['c',47.4954582,19.0404987,'מוזיאון הטירה',''],
      ['c',47.4962283,19.0397733,'הגלריה הלאומית','רמפה לבניין B · בית קפה'],
      ['c',47.5070496,19.0459186,'הפרלמנט',''],
      ['c',47.5153549,19.0818753,'טירת Vajdahunyad','']]},
    vienna:{center:[48.207,16.35],zoom:14,pts:[
      ['m',48.2106192,16.3586917,'Christkindlmarkt Rathausplatz','שוק'],
      ['h',48.2035605,16.3414688,'The Weekend Hotel','ביטול חינם עד 26.11']]},
    prague:{center:[50.0885,14.4235],zoom:15,pts:[
      ['m',50.0874453,14.4209714,'כיכר העיר העתיקה','שוק'],
      ['h',50.0905916,14.4268625,'Residence BENE','מלון']]}
  };
  var el=document.getElementById('map');
  if(el&&window.L){
    var map=L.map(el,{scrollWheelZoom:false,tap:true});
    map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer">Leaflet</a>');
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'}).addTo(map);
    var layer=L.layerGroup().addTo(map);
    function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
    function show(city){
      var d=P[city];layer.clearLayers();var b=[];
      d.pts.forEach(function(p){
        var icon=L.divIcon({className:'',html:'<div class="pin" style="background:'+C[p[0]]+'"></div>',iconSize:[18,18],iconAnchor:[9,9]});
        L.marker([p[1],p[2]],{icon:icon,title:p[3],alt:p[3]}).bindPopup('<strong>'+esc(p[3])+'</strong>'+(p[4]?'<br>'+esc(p[4]):'')).addTo(layer);b.push([p[1],p[2]]);
      });
      if(b.length>1)map.fitBounds(b,{padding:[30,30],maxZoom:16});else map.setView(d.center,d.zoom);
      document.querySelectorAll('.seg button').forEach(function(x){x.setAttribute('aria-pressed',String(x.dataset.city===city));});
    }
    document.querySelectorAll('.seg button').forEach(function(x){x.addEventListener('click',function(){show(x.dataset.city);});});
    show('budapest');
  }
})();
