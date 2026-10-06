const vm=require('vm'),fs=require('fs'),path=require('path');const ROOT=__dirname;
function cls(){const s=new Set();return{add:(...a)=>a.forEach(x=>s.add(x)),remove:(...a)=>a.forEach(x=>s.delete(x)),toggle:(c,f)=>{if(f==undefined)s.has(c)?s.delete(c):s.add(c);else f?s.add(c):s.delete(c);return s.has(c)},contains:c=>s.has(c),items:()=>[...s]};}
function el(id){const e={id,style:{},dataset:{},value:'',textContent:'',_html:'',children:[],_cls:cls(),parentNode:null,get innerHTML(){return e._html},set innerHTML(v){e._html=v},get className(){return e._cls.items().join(' ')},set className(v){e._cls=cls();String(v||'').split(/\s+/).forEach(c=>{if(c)e._cls.add(c)})},get classList(){return e._cls},appendChild(c){if(c){c.parentNode=e;e.children.push(c)}return c},insertBefore(c){if(c){c.parentNode=e;e.children.push(c)}return c},removeChild(c){e.children=e.children.filter(x=>x!==c);return c},querySelector(){return null},querySelectorAll(){return[]},addEventListener(){},removeEventListener(){},getAttribute(){return''},setAttribute(){},offsetWidth:0};return e;}
function ms(el,s){if(!s)return false;s=String(s).trim();if(s[0]=='.')return el._cls.contains(s.slice(1));return el.id===s.slice(1)||el.tagName===s.toUpperCase();}
function ha(el,s,doc){let p=el.parentNode;while(p){if(ms(p,s))return true;p=p.parentNode}return false;}
function seed(){const es={};function mk(id){if(!es[id])es[id]=el(id);return es[id]}
const body=el('document.body');body.__tag='body';mk('center-panel');const tabs=mk('menu-tabs');
['overview','politics','govern','military','map','finance'].forEach(p=>{const t=el('mt_'+p);t.__tag='div';t.dataset.tab=p;t._cls.add('menu-tab');t.textContent=p;tabs.appendChild(t);es['mt_'+p]=t;});
['edict-from','edict-title','edict-content','season-banner','resource-list','faction-list'].forEach(mk);
const doc={body,_els:es,__c:0,getElementById(id){if(!es[id])es[id]=el(id);return es[id]},querySelector(s){for(const k in es)if(ms(es[k],s))return es[k];return null},querySelectorAll(s){let o=[];if(String(s).indexOf(' ')>0){const p=String(s).trim().split(/\s+/);const l=p[p.length-1],a=p.slice(0,-1);for(const k in es)if(ms(es[k],l)&&a.every(x=>ha(es[k],x,doc)))o.push(es[k]);return o}for(const k in es)if(ms(es[k],s))o.push(es[k]);return o},createElement(t){const x=el('dyn_'+(++doc.__c));x.__tag=t||'div';return x},addEventListener(){},documentElement:el('html'),head:el('head'),readyState:'loading'};
body.appendChild(tabs);body.appendChild(mk('center-panel'));return{doc,es};}
const sd=seed();const document=sd.doc;
const sb={console,setTimeout:f=>{f();return 1},clearTimeout:()=>{},setInterval:()=>1,clearInterval:(){},Math,JSON,Date,Error,Array,Object,String,Number,Boolean,Map,Set,RegExp,undefined,NaN,Infinity,isNaN,isFinite,parseInt,parseFloat,encodeURI,decodeURI,encodeURIComponent,decodeURIComponent,document,window:{document},localStorage:{_s:{},getItem(k){return this._s[k]||null},setItem(k,v){this._s[k]=v},removeItem(k){delete this._s[k]},clear(){}},navigator:{userAgent:'node'},location:{href:'',hostname:''},requestAnimationFrame:()=>0,getComputedStyle:()=>({}),performance:{now:()=>0},AudioContext:function(){},webkitAudioContext:null,confirm:()=>true,alert:()=>{},BroadcastChannel:function(){},Image:function(){},HTMLElement:function(){}};
sb.window.document=document;vm.createContext(sb);
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const files=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]);
for(const f of files)vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),sb,{filename:f});
const R=c=>vm.runInContext(c,sb);
R("initGame('chenghua')");
R("GameState.warDef.threats.tusi.active=true; GameState.mapData.status.guizhou=1; GameState.stats.militaryPower=8000; GameState.stats.treasury=50000; GameState.stats.militaryFood=5000; GameState.warDef.levyPool=100; GameState.warDef.threats.tusi.active=true;");
console.log('strike:',R("wrStrikeThreat('tusi')"));
console.log('phase:',R("GameState.battlefield.phase"),'active:',R("GameState.battlefield.active"));
R("GameState.battlefield.player.morale=95; GameState.battlefield.enemy.morale=1;");
console.log('turn1:',R("bfRunTurn('attack')"));
console.log('after phase:',R("GameState.battlefield.phase"),'result:',R("GameState.battlefield.result"),'pMor:',R("GameState.battlefield.player.morale"),'eMor:',R("GameState.battlefield.enemy.morale"));
console.log('threat active:',R("GameState.warDef.threats.tusi.active"),'guizhou status:',R("GameState.mapData.status.guizhou"),'merit:',R("GameState.warDef.merit"));
