(function(){
'use strict';
var D=window.TRIP_DATA||{days:[],stops:[],routes:[],images:[]};
function $(s,r){return (r||document).querySelector(s);}
function $$(s,r){return [].slice.call((r||document).querySelectorAll(s));}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
var store={get:function(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
var fmt=new Intl.NumberFormat('he-IL',{maximumFractionDigits:0});
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function imgUrl(slug,size){return (window.IMGS&&window.IMGS[slug])||('img/'+slug+(size==='640'?'-640':'')+'.webp');}
$$('img[data-img]').forEach(function(i){if(window.IMGS&&window.IMGS[i.dataset.img])i.src=window.IMGS[i.dataset.img];});
var IMG={};(D.images||[]).forEach(function(i){IMG[i.slug]=i;});
var DAY={};D.days.forEach(function(d){DAY[d.n]=d;});
var GUIDE=(window.TRIP_GUIDE&&window.TRIP_GUIDE.cards)||[],GC={},STOP2G={};
GUIDE.forEach(function(c){GC[c.id]=c;c.stops.forEach(function(x){STOP2G[x]=c.id;});});
var toastT;function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('show');},2400);}
function setRing(el,pct){if(el)el.setAttribute('stroke-dasharray',Math.max(0,Math.min(100,pct))+' 100');}

/* ---------- theme ---------- */
var themeBtn=$('#themeBtn');
function applyTheme(t){document.documentElement.dataset.theme=t;themeBtn.setAttribute('aria-pressed',t==='dark');var m=$('meta[name=theme-color]');if(m)m.content=t==='dark'?'#0d1511':'#1c6b50';if(window.__mapTheme)window.__mapTheme();}
themeBtn.addEventListener('click',function(){var t=document.documentElement.dataset.theme==='dark'?'light':'dark';store.set('ft-theme',t);try{localStorage.setItem('ft-theme',t);}catch(e){}applyTheme(t);});
applyTheme(document.documentElement.dataset.theme||'light');

/* ---------- countdown ---------- */
(function(){
  var box=$('#countdown');if(!box)return;var target=new Date(box.dataset.target).getTime();
  function tick(){
    var ms=target-Date.now();
    if(ms<=0){$('#cdD').textContent='0';$('#cdH').textContent='0';$('#cdM').textContent='0';$('#cdS').textContent='הטיול התחיל! 🎒';return;}
    var d=Math.floor(ms/864e5),h=Math.floor(ms%864e5/36e5),m=Math.floor(ms%36e5/6e4),w=Math.floor(d/7);
    $('#cdD').textContent=fmt.format(d);$('#cdH').textContent=h;$('#cdM').textContent=m;
    $('#cdS').textContent='כ-'+w+' שבועות ו-'+(d%7)+' ימים. שעת הטיסה עדיין חסרה.';
  }
  tick();setInterval(tick,30000);
})();

/* ---------- reveal on scroll ---------- */
(function(){
  var els=$$('.reveal');
  if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in');});return;}
  var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target);}});},{rootMargin:'0px 0px -8% 0px',threshold:.04});
  els.forEach(function(e){io.observe(e);});
  setTimeout(function(){els.forEach(function(e){e.classList.add('in');});},4000);
})();

/* ---------- scroll spy / progress ---------- */
(function(){
  var ids=['summary','maps','itinerary','attractions','skipped','budget','bookings','packing','practical','open','alternatives','credits'];
  var MAIN=['summary','maps','itinerary','budget'];
  var secs=ids.map(function(i){return document.getElementById(i);});
  var top=$('#topnav'),tab=$('#tabbar'),cur=$('#curSec'),bar=$('#scrollBar');
  var current='';
  function set(id){
    if(id===current)return;current=id;
    $$('a',top).forEach(function(a){var on=a.getAttribute('href')==='#'+id;a.classList.toggle('active',on);if(on){a.setAttribute('aria-current','true');if(top.scrollWidth>top.clientWidth)a.scrollIntoView({inline:'center',block:'nearest'});}else a.removeAttribute('aria-current');});
    $$('[data-tab]',tab).forEach(function(a){var t=a.dataset.tab;var on=t===id||(t==='more'&&id&&MAIN.indexOf(id)<0);a.classList.toggle('active',on);});
    var l=top.querySelector('a[href="#'+id+'"]');cur.textContent=l?l.textContent:'';
  }
  function onScroll(){
    var h=document.documentElement.scrollHeight-innerHeight;bar.style.transform='scaleX('+(h>0?Math.min(1,scrollY/h):0)+')';
    var y=innerHeight*0.35,found='';
    secs.forEach(function(s){if(!s)return;var r=s.getBoundingClientRect();if(r.top<=y&&r.bottom>y)found=s.id;});
    set(found);
  }
  var ticking=false;addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(function(){onScroll();ticking=false;});}},{passive:true});
  onScroll();
  var sheet=$('#moreSheet');
  $('#moreBtn').addEventListener('click',function(){if(sheet.showModal)sheet.showModal();});
  $('#moreClose').addEventListener('click',function(){sheet.close();});
  sheet.addEventListener('click',function(e){if(e.target===sheet||e.target.tagName==='A')sheet.close();});
})();

/* ---------- itinerary ---------- */
var state={rain:false,perDay:{},sel:'all'};
var days=$$('details.day');
function dayRain(n){return state.perDay[n]!==undefined?state.perDay[n]:state.rain;}
function applyRain(){
  days.forEach(function(d){
    var n=+d.dataset.day,r=dayRain(n);d.dataset.rain=r?'1':'0';
    $$('[data-rain-set]',d).forEach(function(b){b.setAttribute('aria-pressed',String((b.dataset.rainSet==='1')===r));});
  });
  $('#rainAll').checked=state.rain;$('#mapRain').checked=state.rain;
  if(window.__mapRefresh)window.__mapRefresh();
}
$$('[data-rain-set]').forEach(function(b){b.addEventListener('click',function(){var n=+b.closest('details.day').dataset.day;state.perDay[n]=b.dataset.rainSet==='1';applyRain();});});
function setRainAll(v){state.rain=v;state.perDay={};applyRain();}
$('#rainAll').addEventListener('change',function(e){setRainAll(e.target.checked);});
$('#mapRain').addEventListener('change',function(e){setRainAll(e.target.checked);});
function setAll(v){days.forEach(function(d){d.open=v;});}
$('#expandAll').addEventListener('click',function(){setAll(true);});
$('#collapseAll').addEventListener('click',function(){setAll(false);});
var before=[];
addEventListener('beforeprint',function(){before=days.map(function(d){return d.open;});setAll(true);});
addEventListener('afterprint',function(){days.forEach(function(d,i){d.open=before[i];});});
$('#printBtn').addEventListener('click',function(){window.print();});
$('#shareBtn').addEventListener('click',function(){
  var url=location.href.split('#')[0],data={title:document.title,text:'תוכנית הטיול המשפחתי 18–27.8.2027 · מסלול A2',url:url};
  if(navigator.share){navigator.share(data).catch(function(){});}
  else if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(function(){toast('הקישור הועתק');},function(){toast(url);});}
  else toast(url);
});
applyRain();

/* ---------- map ---------- */
var NOTILE=D.notile||[];
var map=null,M={},routeLayer=null,markerLayer=null,mapReady=false,selStop=null;
var chipsBox=$('#dayChips');
function chipLabel(d){return d.wd+' '+d.date;}
function buildChips(){
  var h='<button type="button" class="chip active" data-day="all" aria-pressed="true">הכול</button>';
  D.days.forEach(function(d){h+='<button type="button" class="chip" data-day="'+d.n+'" aria-pressed="false" style="--dc:'+d.color+'" title="'+esc(d.title)+'"><i class="dot"></i>'+esc(chipLabel(d))+'</button>';});
  h+='<button type="button" class="chip" data-day="opt" aria-pressed="false">★ אופציונלי</button>';
  chipsBox.innerHTML=h;
}
buildChips();
chipsBox.addEventListener('click',function(e){var b=e.target.closest('.chip');if(!b)return;selectDay(b.dataset.day==='all'||b.dataset.day==='opt'?b.dataset.day:+b.dataset.day,true);});
function effRain(){return state.sel!=='all'&&state.sel!=='opt'?dayRain(state.sel):state.rain;}
function refDay(s){return (typeof state.sel==='number'&&s.days.indexOf(state.sel)>=0)?state.sel:s.days[0];}
function stopVisible(s){
  if(s.kind==='base')return true;
  if(state.sel==='all')return true;
  if(state.sel==='opt')return !!s.opt;
  return s.days.indexOf(state.sel)>=0;
}
function mkIcon(s){
  var rd=refDay(s),col=s.kind==='base'?'#14201a':DAY[rd].color,cls='pin '+(s.kind==='base'?'base':s.kind==='walk'?'walk':'');
  if(s.opt)cls+=' opt';if(s.rain)cls+=' rainalt';
  var r=effRain();
  if((s.rain&&!r)||(NOTILE.indexOf(s.id)>=0&&r&&s.kind!=='base'))cls+=' dim';
  if(selStop===s.id)cls+=' sel';
  var lab=s.kind==='base'?'🏠':s.kind==='air'?'✈':s.kind==='park'?'P':s.kind==='walk'?'':s.opt?'★':s.rain?'🌧':String(rd);
  var size=s.kind==='base'?[38,38]:s.kind==='walk'?[24,24]:[34,34];
  var anchor=s.kind==='base'?[19,19]:s.kind==='walk'?[12,12]:[17,34];
  return L.divIcon({className:cls,html:'<div class="p" style="--c:'+col+'"><span>'+lab+'</span></div>',iconSize:size,iconAnchor:anchor,popupAnchor:[0,-size[1]+4]});
}
function popupHtml(s){
  var im=s.img&&IMG[s.img]?'<img src="'+esc(imgUrl(s.img,'640'))+'" alt="'+esc(IMG[s.img].alt)+'" loading="lazy">':'';
  var dd=s.days.map(function(n){return '<i style="--c:'+DAY[n].color+'">'+esc(chipLabel(DAY[n]))+'</i>';}).join('');
  var cert=s.cert==='exact'?'<span class="badge v">מדויק</span>':'<span class="badge c">משוער</span>';
  var tags=(s.opt?'<span class="badge e">אופציונלי</span> ':'')+(s.rain?'<span class="badge e">חלופת גשם</span> ':'');
  return '<div class="pop" style="--c:'+(s.kind==='base'?'#14201a':DAY[s.days[0]].color)+'">'+im+'<div class="pop-b"><h4>'+esc(s.name)+'</h4><div class="en">'+esc(s.en)+'</div><div class="dd">'+dd+'</div><p>'+tags+cert+' <small>'+esc(s.cn)+'</small></p><p>'+esc(s.note)+'</p><p class="drv">🚗 '+esc(s.drive)+'</p><div class="acts"><a target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination='+s.lat+','+s.lng+'&travelmode=driving">ניווט ב-Google Maps</a><button type="button" data-goto-day="'+s.days[0]+'">פרטי היום</button>'+(STOP2G[s.id]?'<button type="button" class="pg" data-guide="'+STOP2G[s.id]+'">מדריך האטרקציה</button>':'')+'</div></div></div>';
}
function showNotice(t){var n=$('#mapNotice');n.textContent=t;n.hidden=false;}
function initMap(){
  if(map||typeof L==='undefined'){if(typeof L==='undefined'){showNotice('ספריית המפה לא נטענה. רשימת התחנות מימין/למטה עדיין זמינה.');$('#mapSkel').hidden=true;}return;}
  map=L.map('leafletMap',{zoomControl:true,scrollWheelZoom:false,tap:true,minZoom:5,maxZoom:18,worldCopyJump:false});
  map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
  var loaded=0,errs=0,fb=false;
  var osm=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'});
  var carto=L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',{maxZoom:19,subdomains:'abcd',attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>'});
  function hook(layer,isFirst){
    layer.on('tileload',function(){loaded++;$('#mapNotice').hidden=true;});
    layer.on('tileerror',function(){errs++;
      if(!loaded&&errs>=4){
        if(isFirst&&!fb){fb=true;errs=0;map.removeLayer(osm);carto.addTo(map);}
        else if(!isFirst){showNotice('אריחי המפה לא נטענו (ייתכן שאין חיבור לאינטרנט). הסימונים, הקווים והרשימה ממשיכים לעבוד.');}
      }
    });
  }
  hook(osm,true);hook(carto,false);osm.addTo(map);
  if(navigator.onLine===false)showNotice('אין חיבור לאינטרנט: רקע המפה לא ייטען, אבל הסימונים והקווים מוצגים.');
  addEventListener('offline',function(){showNotice('אין חיבור לאינטרנט: רקע המפה לא ייטען.');});
  markerLayer=L.layerGroup().addTo(map);routeLayer=L.layerGroup().addTo(map);
  D.stops.forEach(function(s){
    var m=L.marker([s.lat,s.lng],{icon:mkIcon(s),keyboard:true,title:s.name,alt:s.name,riseOnHover:true});
    m.bindPopup(popupHtml(s),{maxWidth:300,minWidth:260,maxHeight:360,autoPanPaddingTopLeft:[20,24],autoPanPaddingBottomRight:[20,24]});
    m.on('click',function(){selStop=s.id;});
    M[s.id]={s:s,m:m};
  });
  map.on('click',function(){map.scrollWheelZoom.enable();});
  map.getContainer().addEventListener('mouseleave',function(){map.scrollWheelZoom.disable();});
  map.on('popupopen',function(e){
    var el=e.popup.getElement();var b=el&&el.querySelector('[data-goto-day]');
    if(b)b.addEventListener('click',function(){gotoDay(+b.dataset.gotoDay);});
    var g=el&&el.querySelector('[data-guide]');
    if(g)g.addEventListener('click',function(){openGuide(g.dataset.guide);});
  });
  map.on('popupclose',function(){selStop=null;paintIcons();});
  mapReady=true;$('#mapSkel').hidden=true;
  var all=D.stops.map(function(s){return [s.lat,s.lng];});
  map.fitBounds(all,{padding:[30,30]});
  refresh();
  setTimeout(function(){map.invalidateSize();},300);
  window.__mapTheme=function(){};
}
function paintIcons(){Object.keys(M).forEach(function(k){M[k].m.setIcon(mkIcon(M[k].s));});}
function drawRoutes(){
  routeLayer.clearLayers();
  if(!$('#mapRoutes').checked)return;
  var r=effRain();
  D.routes.forEach(function(rt){
    var ds=Array.isArray(rt.day)?rt.day:[rt.day];
    var show=state.sel==='all'||(state.sel==='opt'?rt.kind==='opt':ds.indexOf(state.sel)>=0);
    if(!show)return;
    var d0=(typeof state.sel==='number'&&ds.indexOf(state.sel)>=0)?state.sel:ds[0];
    var col=DAY[d0].color;
    var dayHasRain=D.routes.some(function(x){return x.kind==='rain'&&(Array.isArray(x.day)?x.day:[x.day]).indexOf(ds[0])>=0;});
    var faded=(rt.kind==='rain'&&!r)||(rt.kind==='main'&&dayHasRain&&r);
    var dash=rt.kind==='main'&&!faded?null:(rt.kind==='opt'?'10 9':'3 10');
    var op=faded?.5:.92;
    L.polyline(rt.pts,{color:'#ffffff',weight:faded?5:9,opacity:faded?.35:.75,lineCap:'round',interactive:false}).addTo(routeLayer);
    var line=L.polyline(rt.pts,{color:col,weight:faded?3:5,opacity:op,dashArray:dash,lineCap:'round'}).addTo(routeLayer);
    line.bindTooltip(rt.label,{sticky:true,direction:'top'});
  });
  if(state.sel==='all'||state.sel===8){
    L.polyline(D.boat,{color:'#3a86ff',weight:4,dashArray:'2 8',opacity:.9,lineCap:'round'}).addTo(routeLayer).bindTooltip('שייט ל-St. Bartholomä (קו ישר להמחשה)',{sticky:true});
  }
}
function visibleStops(){return D.stops.filter(stopVisible);}
function refresh(){
  buildList();
  if(!mapReady)return;
  markerLayer.clearLayers();
  D.stops.forEach(function(s){var o=M[s.id];if(stopVisible(s)){o.m.setIcon(mkIcon(s));o.m.addTo(markerLayer);}});
  drawRoutes();
}
function buildList(){
  var ol=$('#stopList'),h='',t=$('#stopTitle');
  function item(s){
    var rd=refDay(s),col=s.kind==='base'?'#14201a':DAY[rd].color;
    var lab=s.kind==='base'?'🏠':s.kind==='air'?'✈':s.kind==='park'?'P':s.opt?'★':s.rain?'🌧':s.kind==='walk'?'•':rd;
    return '<li><button type="button" class="stop-btn'+(s.opt?' opt':'')+'" data-stop="'+s.id+'" style="--dc:'+col+'"><span class="n" aria-hidden="true">'+lab+'</span><span><b>'+esc(s.name)+'</b><small>'+(s.cert==='exact'?'מדויק':'משוער')+' · '+esc(s.drive)+'</small></span></button></li>';
  }
  if(state.sel==='all'){
    t.textContent='כל התחנות';
    var bases=D.stops.filter(function(s){return s.kind==='base';});
    h+='<li class="dg"><i style="--dc:#14201a"></i>לינה</li>'+bases.map(item).join('');
    D.days.forEach(function(d){
      var st=D.stops.filter(function(s){return s.kind!=='base'&&s.days[0]===d.n;});
      if(!st.length)return;
      h+='<li class="dg"><i style="--dc:'+d.color+'"></i>'+esc(chipLabel(d))+' · '+esc(d.title)+'</li>'+st.map(item).join('');
    });
  }else if(state.sel==='opt'){
    t.textContent='תחנות אופציונליות';h=D.stops.filter(function(s){return s.opt;}).map(item).join('');
  }else{
    var d=DAY[state.sel];t.textContent=chipLabel(d)+' · '+d.title;
    h='<li class="dg"><i style="--dc:'+d.color+'"></i>'+esc(d.drive)+'</li>'+D.stops.filter(function(s){return stopVisible(s);}).map(item).join('');
  }
  ol.innerHTML=h;
}
$('#stopList').addEventListener('click',function(e){var b=e.target.closest('[data-stop]');if(b)focusStop(b.dataset.stop,false);});
function selectDay(v,fit){
  state.sel=v;
  $$('.chip',chipsBox).forEach(function(c){var on=String(c.dataset.day)===String(v);c.classList.toggle('active',on);c.setAttribute('aria-pressed',on);if(on&&chipsBox.scrollWidth>chipsBox.clientWidth)c.scrollIntoView({inline:'center',block:'nearest'});});
  if(map)map.closePopup();
  refresh();
  if(fit!==false)fitDay();
}
function fitDay(){
  if(!mapReady){initMap();if(!mapReady)return;}
  var pts=[];
  if(state.sel==='all'){pts=D.stops.map(function(s){return [s.lat,s.lng];});}
  else{
    D.stops.forEach(function(s){if(s.kind==='base'&&(typeof state.sel!=='number'||s.days.indexOf(state.sel)<0))return;if(s.kind==='base'&&state.sel==='opt')return;if(stopVisible(s))pts.push([s.lat,s.lng]);});
  }
  if(!pts.length)return;
  var b=L.latLngBounds(pts);
  if(!reduce&&map.flyToBounds)map.flyToBounds(b,{padding:[48,48],maxZoom:14,duration:.8});else map.fitBounds(b,{padding:[48,48],maxZoom:14});
}
function focusStop(id,scroll){
  if(!mapReady)initMap();
  var o=M[id];if(!o)return;
  if(state.sel!=='all'&&!stopVisible(o.s))selectDay(o.s.days[0],false);
  if(scroll!==false)$('#maps').scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
  selStop=id;
  setTimeout(function(){if(!map)return;map.setView([o.s.lat,o.s.lng],Math.max(map.getZoom(),13),{animate:false});if(!markerLayer.hasLayer(o.m))o.m.addTo(markerLayer);o.m.setIcon(mkIcon(o.s));o.m.openPopup();},scroll===false?0:400);
}
function gotoDay(n){var d=document.getElementById('day-'+n);if(!d)return;d.open=true;d.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});}
$('#fitDay').addEventListener('click',function(){fitDay();});
$('#mapRoutes').addEventListener('change',function(){if(mapReady)drawRoutes();});
window.__mapRefresh=function(){if($('#stopList')){refresh();}};
$$('[data-show-day]').forEach(function(b){b.addEventListener('click',function(){initMap();selectDay(+b.dataset.showDay,true);$('#maps').scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});});});
$$('[data-map-stop]').forEach(function(b){b.addEventListener('click',function(){focusStop(b.dataset.mapStop,true);});});
(function(){
  var sec=$('#maps');
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(en){if(en[0].isIntersecting){initMap();io.disconnect();}},{rootMargin:'700px 0px'});io.observe(sec);}
  else initMap();
  addEventListener('resize',function(){if(map)map.invalidateSize();});
  buildList();
})();

/* ---------- attractions filter ---------- */
(function(){
  var cards=$$('.attr'),q='',kid='all',fl={};
  function flat(o){if(o==null)return '';if(typeof o==='string')return o.replace(/\[(v|e|c|m|w|i)\]/g,' ').replace(/\{\{(?:g:[a-z0-9-]+|https?:[^|}]+)\|([^}]*)\}\}/g,'$1').replace(/\*\*/g,'');if(Array.isArray(o))return o.map(flat).join(' ');if(typeof o==='object')return Object.keys(o).map(function(k){return k==='stops'||k==='imgs'||k==='days'?'':flat(o[k]);}).join(' ');return '';}
  cards.forEach(function(c){var g=GC[c.dataset.guideId];if(g)c.dataset.text=(c.dataset.text+' '+flat(g)).toLowerCase();});
  function apply(){
    var n=0;
    cards.forEach(function(c){
      var ok=(!q||c.dataset.text.indexOf(q)>=0)&&(!fl.stroller||c.dataset.stroller==='1')&&(!fl.free||c.dataset.free==='1')&&(!fl.rain||c.dataset.rain==='1')&&(!fl.opt||c.dataset.opt==='1');
      c.hidden=!ok;if(ok)n++;
    });
    $('#attrCount').textContent='מוצגות '+n+' מתוך '+cards.length+' אטרקציות';
    $('#attrEmpty').hidden=n>0;
    if(kid==='all')delete document.body.dataset.kid;else document.body.dataset.kid=kid;
  }
  $('#attrSearch').addEventListener('input',function(e){q=e.target.value.trim().toLowerCase();apply();});
  $('#kidChips').addEventListener('click',function(e){var b=e.target.closest('.chip');if(!b)return;kid=b.dataset.kid;$$('.chip',$('#kidChips')).forEach(function(c){var on=c===b;c.classList.toggle('active',on);c.setAttribute('aria-checked',on);});apply();});
  $('#attrFilters').addEventListener('click',function(e){var b=e.target.closest('.chip');if(!b)return;var on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on);fl[b.dataset.f]=on;apply();});
  apply();
})();


/* ---------- attraction guide (modal / bottom sheet) ---------- */
var BL={v:'מאומת',e:'הערכה',c:'לבדוק',m:'חסר',w:'מהרשת',i:'רעיון'};
var BT={v:'מחירון או אתר רשמי לפי קובצי המקור',e:'הערכה',c:'צריך לוודא לפני הנסיעה',m:'אין מידע בחומר שנאסף',w:'נוסף מהרשת ב-18.10.2026, לא אומת לאוגוסט 2027',i:'רעיון, לא עובדה מהמקורות'};
function tok(s){
  var h=esc(s);
  h=h.replace(/\[(v|e|c|m|w|i)\]/g,function(_,k){return '<span class="badge '+k+'" title="'+BT[k]+'">'+BL[k]+'</span>';});
  h=h.replace(/\{\{g:([a-z0-9-]+)\|([^}]*)\}\}/g,function(_,id,t){return '<button type="button" class="glink" data-guide="'+id+'">'+t+'</button>';});
  h=h.replace(/\{\{(https?:[^|}]+)\|([^}]*)\}\}/g,function(_,u,t){return '<a href="'+u+'" target="_blank" rel="noopener">'+t+'</a>';});
  h=h.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
  return h;
}
function gli(a,tag){return '<'+tag+'>'+a.map(function(x){return '<li>'+tok(x)+'</li>';}).join('')+'</'+tag+'>';}
function gsec(ic,t,body){return '<section class="gd-sec"><h4><span aria-hidden="true">'+ic+'</span> '+t+'</h4>'+body+'</section>';}
function gdHtml(c){
  var im=(c.imgs||[]).filter(function(x){return IMG[x];}),h='';
  if(im.length){
    h+='<div class="gd-imgs n'+im.length+'">'+im.map(function(x){var m=IMG[x];
      return '<figure><img src="'+esc(imgUrl(x,'640'))+'" width="'+m.w+'" height="'+m.h+'" alt="'+esc(m.alt)+'" decoding="async"><figcaption>'+'<bdi>'+esc(m.place)+'</bdi> · צילום: <bdi>'+esc(m.author)+'</bdi> · <a href="'+esc(m.license_url)+'" target="_blank" rel="noopener">'+esc(m.license)+'</a> · <a href="'+esc(m.page)+'" target="_blank" rel="noopener">Commons</a></figcaption></figure>';}).join('')+'</div>';
  }else h+='<div class="gd-noimg"><span aria-hidden="true">🌲</span> אין תמונה מתאימה <span class="badge m">חסר</span></div>';
  h+='<div class="gd-head"><h3 id="gdTitle">'+esc(c.name)+'</h3><div class="en ltr">'+esc(c.en)+'</div><p class="gd-pills"><span>'+esc(c.when)+'</span><span>'+esc(c.kind)+'</span>'+(c.opt?'<span class="o">★ אופציונלי בתוכנית</span>':'')+(c.rainy?'<span class="r">🌧️ חלופת גשם</span>':'')+'</p></div>';
  var f=c.facts||{},st=f.stroller||['unk',''];
  h+='<div class="gd-facts"><div class="f"><b>⏱ משך</b>'+tok(f.dur||'')+'</div><div class="f"><b>💶 מחיר</b>'+tok(f.price||'')+'</div><div class="f s-'+st[0]+'"><b>🚼 עגלה / מנשא</b>'+tok(st[1])+'</div><div class="f"><b>🌧️ בגשם</b>'+tok(f.rain||'')+'</div></div>';
  if(c.other)h+='<section class="gd-alert" role="note"><h4>ℹ️ לא במסלול A2</h4><p>'+esc(c.other)+' המדריך נשאר לעיון בלבד.</p></section>';
  if(c.a2)h+='<section class="gd-sec gd-a2"><h4><span aria-hidden="true">🗺️</span> במסלול A2</h4><p>'+tok(c.a2)+'</p></section>';
  if(c.alert)h+='<section class="gd-alert" role="note"><h4>⚠️ '+esc(c.alert.title)+' '+'<span class="badge c" title="'+BT.c+'">לבדוק</span></h4>'+gli(c.alert.items,'ul')+'</section>';
  h+=gsec('✨','מה זה ומה מעניין','<p>'+tok(c.what)+'</p>'+gli(c.interesting,'ul'));
  h+=gsec('👨‍👧‍👦','מה עושים עם הילדים (סדר מוצע '+tok('[i]')+')',gli(c.do,'ol'));
  h+=gsec('🕒','משך ושעה מומלצת','<p><b>משך:</b> '+tok(c.dur)+'</p><p><b>שעה מומלצת:</b> '+tok(c.best)+'</p>');
  h+=gsec('🚼','עגלה / מנשא',gli(c.stroller,'ul'));
  h+=gsec('💶','מחיר',gli(c.price,'ul'));
  h+=gsec('🎒','מה להביא','<p>'+tok(c.bring)+'</p>');
  h+=gsec('🌧️','בגשם','<p>'+tok(c.rain)+'</p>');
  h+='<div class="gd-tips"><div class="tip"><h4>🧒 טיפ לבן (6) '+tok('[i]')+'</h4><p>'+tok(c.tip6)+'</p></div><div class="tip"><h4>👧 טיפ לבת (3) '+tok('[i]')+'</h4><p>'+tok(c.tip3)+'</p></div></div>';
  if(c.extra)h+=gsec('➕',esc(c.extra.title),gli(c.extra.items,'ul'));
  return h;
}
var gdDlg=$('#guideDlg'),gdBody=$('#gdBody'),gdFoot=$('#gdFoot'),gdCur=null;
function stopOf(id){for(var i=0;i<D.stops.length;i++)if(D.stops[i].id===id)return D.stops[i];return null;}
function openGuide(id,noHash){
  var c=GC[id];if(!c||!gdDlg)return;gdCur=id;
  gdBody.innerHTML=gdHtml(c);
  var i=GUIDE.indexOf(c),st=stopOf(c.stops[0]),hasDay=c.days&&c.days.length;
  $('#gdPos').textContent='אטרקציה '+c.no+' מתוך '+GUIDE.length;
  gdFoot.innerHTML=(st?'<button type="button" class="btn primary" data-gd-map="'+esc(c.stops[0])+'"><svg class="ic"><use href="#i-pin"/></svg> במפה</button>':'')+
    (st?'<a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination='+st.lat+','+st.lng+'&travelmode=driving"><svg class="ic"><use href="#i-nav"/></svg> ניווט</a>':'')+
    (hasDay?'<button type="button" class="btn" data-gd-day="'+c.days[0]+'"><svg class="ic"><use href="#i-cal"/></svg> ליום במסלול</button>':'<a class="btn" href="#other-options">אפשרויות נוספות</a>');
  if(!gdDlg.open){if(gdDlg.showModal)gdDlg.showModal();else gdDlg.setAttribute('open','');document.documentElement.classList.add('gd-open');}
  gdBody.scrollTop=0;try{gdBody.focus({preventScroll:true});}catch(e){}
  if(!noHash){try{history.replaceState(null,'','#a-'+id);}catch(e){}}
}
function closeGuide(){if(gdDlg&&gdDlg.open)gdDlg.close();}
function stepGuide(d){if(!gdCur)return;var i=GUIDE.indexOf(GC[gdCur]);openGuide(GUIDE[(i+d+GUIDE.length)%GUIDE.length].id);}
if(gdDlg){
  gdDlg.addEventListener('close',function(){document.documentElement.classList.remove('gd-open');gdCur=null;if(/^#a-/.test(location.hash)){try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}}});
  gdDlg.addEventListener('click',function(e){if(e.target===gdDlg)closeGuide();});
  $('#gdClose').addEventListener('click',closeGuide);
  $('#gdNext').addEventListener('click',function(){stepGuide(1);});
  $('#gdPrev').addEventListener('click',function(){stepGuide(-1);});
  gdDlg.addEventListener('keydown',function(e){if(e.target.closest&&e.target.closest('a,input'))return;if(e.key==='ArrowLeft'){stepGuide(1);e.preventDefault();}if(e.key==='ArrowRight'){stepGuide(-1);e.preventDefault();}});
  gdFoot.addEventListener('click',function(e){
    var m=e.target.closest('[data-gd-map]'),dd=e.target.closest('[data-gd-day]');
    if(m){var id=m.dataset.gdMap;closeGuide();focusStop(id,true);}
    if(dd){var n=+dd.dataset.gdDay;closeGuide();gotoDay(n);}
  });
  document.addEventListener('click',function(e){var b=e.target.closest('[data-guide]');if(b&&!b.closest('.leaflet-popup')){e.preventDefault();openGuide(b.dataset.guide);}});
  addEventListener('hashchange',function(){if(/^#a-/.test(location.hash))openGuide(location.hash.slice(3),true);});
}

/* ---------- lightbox ---------- */
(function(){
  var dlg=$('#lightbox'),img=$('#lbImg'),cap=$('#lbCap');
  var list=$$('#gallery [data-lb]').map(function(b){return b.dataset.lb;}),idx=0;
  function show(i){
    idx=(i+list.length)%list.length;var s=list[idx],m=IMG[s];if(!m)return;
    img.src=imgUrl(s,'');img.alt=m.alt;img.width=m.w;img.height=m.h;
    cap.innerHTML='<b>'+esc(m.place)+'</b><br>'+esc(m.alt)+'<br><small>צילום: '+esc(m.author)+' · <a href="'+esc(m.license_url)+'" target="_blank" rel="noopener">'+esc(m.license)+'</a> · <a href="'+esc(m.page)+'" target="_blank" rel="noopener">Wikimedia Commons</a></small>';
    [1,-1].forEach(function(d){var p=new Image();p.src=imgUrl(list[(idx+d+list.length)%list.length],'');});
  }
  function open(s){var i=list.indexOf(s);if(i<0)return;show(i);if(dlg.showModal&&!dlg.open)dlg.showModal();}
  document.addEventListener('click',function(e){var b=e.target.closest('[data-lb]');if(b){e.preventDefault();open(b.dataset.lb);}});
  $('#lbNext').addEventListener('click',function(){show(idx+1);});
  $('#lbPrev').addEventListener('click',function(){show(idx-1);});
  $('#lbClose').addEventListener('click',function(){dlg.close();});
  dlg.addEventListener('click',function(e){if(e.target===dlg)dlg.close();});
  dlg.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'){show(idx+1);e.preventDefault();}if(e.key==='ArrowRight'){show(idx-1);e.preventDefault();}});
  var sx=null;dlg.addEventListener('pointerdown',function(e){sx=e.clientX;});
  dlg.addEventListener('pointerup',function(e){if(sx==null)return;var dx=e.clientX-sx;sx=null;if(Math.abs(dx)>60&&e.target.tagName==='IMG'){show(idx+(dx<0?1:-1));}});
})();

/* ---------- budget (route A2, final_routes_A2_B.md §4) ---------- */
(function(){
  var KEY='ft-budget-a2-v1',CAP=30000;
  var BASE={lego:920,cp:1270,abt:528,van:1113,fuel:193,food:1050,tix:414,misc:50};
  var EST={lego:920,cp:1125,abt:528,van:1113,food:1050};   /* part that gets the multiplier; CP live-price delta (+145) is added without one, as in the source */
  var MULT={lego:1.4,cp:1.4,abt:1.4,van:1.3,food:1.2};
  var CHEAP={lego:600,food:950};
  var LAB={lego:'Legoland Feriendorf + כרטיסים',cp:'Center Parcs (מחיר חי + מס + מצעים)',abt:'Abtenau (Wieser, 4 לילות)',van:'ואן, מושבים, גבול, ויניטה',fuel:'דלק',food:'אוכל',tix:'כרטיסים + חניות',misc:'שונות',flights:'טיסות',opts:'תוספות / חיסכון'};
  var COL={lego:'#e76f51',cp:'#7b5ea7',abt:'#1c6b50',van:'#0e8f8a',fuel:'#6d4c41',food:'#e9a100',tix:'#d6336c',misc:'#8a8f8c',flights:'#3a86ff',opts:'#c2410c'};
  var PRE={base40:{rate:4.0,exp:false,cheap:false,fl:7035},base35:{rate:3.5,exp:false,cheap:false,fl:7035},cheap:{rate:4.0,exp:false,cheap:true,fl:7035},exp:{rate:4.0,exp:true,cheap:false,fl:7035},worst:{rate:4.0,exp:true,cheap:false,fl:9500}};
  var st=store.get(KEY,null)||{rate:4.0,exp:false,cheap:false,fl:7035,opts:{}};
  var rate=$('#rate'),out=$('#rateOut');
  function optIls(el){return el.dataset.ils?+el.dataset.ils:(+el.dataset.eur)*st.rate;}
  function compute(){
    var items=[],tot=0;
    Object.keys(BASE).forEach(function(k){var eur=BASE[k];
      if(st.cheap&&CHEAP[k]!=null)eur=CHEAP[k];
      if(st.exp&&MULT[k])eur=eur+EST[k]*(MULT[k]-1);
      var ils=eur*st.rate;items.push({k:k,v:ils,eur:eur});tot+=ils;});
    items.push({k:'flights',v:st.fl});tot+=st.fl;
    var o=0;$$('#optList [data-opt]').forEach(function(c){if(st.opts[c.dataset.opt])o+=optIls(c);});
    if(o){items.push({k:'opts',v:o});tot+=o;}
    return {items:items,total:tot};
  }
  function render(){
    out.textContent=st.rate.toFixed(2);rate.value=st.rate;
    $('#expMode').checked=!!st.exp;$('#cheapMode').checked=!!st.cheap;
    $$('input[name=fl]').forEach(function(r){r.checked=+r.value===st.fl;});
    $$('#optList [data-opt]').forEach(function(c){c.checked=!!st.opts[c.dataset.opt];var a=c.closest('label').querySelector('[data-amt]'),v=optIls(c);a.textContent=(v<0?'−':'+')+fmt.format(Math.abs(v))+' ₪';});
    var c=compute(),tot=c.total,pct=Math.min(100,tot/CAP*100);
    $('#calcTotal').textContent=fmt.format(tot);
    var fg=$('#gFg');fg.setAttribute('stroke-dasharray',pct+' 100');
    var cls=tot>CAP?'bad':tot>CAP*.9?'mid':'ok';fg.style.stroke='var(--'+cls+')';
    var s=$('#calcStatus');s.className='gauge-s '+cls;
    s.textContent=tot>CAP?('חריגה של '+fmt.format(tot-CAP)+' ₪ מעל התקרה'):((tot>CAP*.9?'קרוב לתקרה: נשארו ':'מתחת לתקרה: נשארו ')+fmt.format(CAP-tot)+' ₪');
    $('#gaugeSvg').setAttribute('aria-label','מד תקציב: '+fmt.format(tot)+' ₪ מתוך 30,000');
    var pos=c.items.filter(function(i){return i.v>0;}),sum=pos.reduce(function(a,i){return a+i.v;},0);
    var scale=Math.max(sum,CAP)*1.03,stack=$('#stack'),h='';
    pos.forEach(function(i){h+='<i class="seg-i" style="width:'+(i.v/scale*100)+'%;background:'+COL[i.k]+'" title="'+esc(LAB[i.k])+'"></i>';});
    stack.querySelectorAll('.seg-i').forEach(function(n){n.remove();});stack.insertAdjacentHTML('afterbegin',h);
    $('#capMark').style.insetInlineStart=(CAP/scale*100)+'%';
    $('#breakList').innerHTML=c.items.map(function(i){return '<li><i style="--c:'+COL[i.k]+'"></i><span>'+esc(LAB[i.k])+(i.eur?' <em>(€'+fmt.format(i.eur)+')</em>':'')+'</span><b>'+(i.v<0?'−':'')+fmt.format(Math.abs(i.v))+' ₪</b></li>';}).join('');
    var noopt=!Object.keys(st.opts).some(function(k){return st.opts[k];});
    $$('[data-preset]').forEach(function(b){var p=PRE[b.dataset.preset];b.setAttribute('aria-pressed',String(noopt&&Math.abs(p.rate-st.rate)<.001&&p.exp===!!st.exp&&p.cheap===!!st.cheap&&p.fl===st.fl));});
    store.set(KEY,st);
  }
  rate.addEventListener('input',function(){st.rate=+rate.value;render();});
  $('#expMode').addEventListener('change',function(e){st.exp=e.target.checked;if(st.exp)st.cheap=false;render();});
  $('#cheapMode').addEventListener('change',function(e){st.cheap=e.target.checked;if(st.cheap)st.exp=false;render();});
  $$('input[name=fl]').forEach(function(r){r.addEventListener('change',function(){st.fl=+r.value;render();});});
  $$('#optList [data-opt]').forEach(function(c){c.addEventListener('change',function(){st.opts[c.dataset.opt]=c.checked;render();});});
  $$('[data-preset]').forEach(function(b){b.addEventListener('click',function(){var p=PRE[b.dataset.preset];st.rate=p.rate;st.exp=p.exp;st.cheap=p.cheap;st.fl=p.fl;st.opts={};render();});});
  render();
})();

/* ---------- packing (same storage key as v1) ---------- */
(function(){
  var KEY='family-trip-2027-packing-v1',boxes=$$('input[data-id]'),s=store.get(KEY,{})||{};
  function render(){var d=0;boxes.forEach(function(b){b.checked=!!s[b.dataset.id];b.closest('label').classList.toggle('done',b.checked);if(b.checked)d++;});
    $('#packProgress').textContent=d+' / '+boxes.length+' נארזו';setRing($('#packRing'),d/boxes.length*100);}
  boxes.forEach(function(b){b.addEventListener('change',function(){if(b.checked)s[b.dataset.id]=1;else delete s[b.dataset.id];store.set(KEY,s);render();});});
  $('#packReset').addEventListener('click',function(){if(confirm('לאפס את כל הסימונים?')){s={};store.set(KEY,s);render();}});
  render();
})();
/* ---------- bookings tracker ---------- */
(function(){
  var KEY='ft-bookings-a2-v1',s=store.get(KEY,{})||{},sels=$$('[data-bk-sel]');
  function render(){var d=0;sels.forEach(function(x){var v=+(s[x.dataset.bkSel]||0);x.value=v;var li=x.closest('.bk');li.dataset.s=v;li.parentNode.classList.toggle('done',false);li.classList.toggle('done',v===2);if(v===2)d++;});
    $('#bkProg').textContent=d+' מתוך '+sels.length+' הוזמנו';setRing($('#bkRing'),d/sels.length*100);}
  sels.forEach(function(x){x.addEventListener('change',function(){s[x.dataset.bkSel]=+x.value;store.set(KEY,s);render();});});
  render();
})();
/* ---------- open questions ---------- */
(function(){
  var KEY='ft-oq-a2-v1',s=store.get(KEY,{})||{},boxes=$$('input[data-oq]');
  function render(){var d=0;boxes.forEach(function(b){b.checked=!!s[b.dataset.oq];b.closest('label').classList.toggle('done',b.checked);if(b.checked)d++;});
    $('#oqProg').textContent=d+' מתוך '+boxes.length+' נסגרו';setRing($('#oqRing'),d/boxes.length*100);}
  boxes.forEach(function(b){b.addEventListener('change',function(){if(b.checked)s[b.dataset.oq]=1;else delete s[b.dataset.oq];store.set(KEY,s);render();});});
  render();
})();

/* ---------- hash deep link ---------- */
if(/^#a-/.test(location.hash)){openGuide(location.hash.slice(3),true);}
else if(location.hash){var t=null;try{t=$(location.hash);}catch(e){}if(t&&t.tagName==='DETAILS')t.open=true;}
})();
