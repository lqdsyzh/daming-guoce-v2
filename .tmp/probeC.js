const vm=require('vm');const fs=require('fs');const path=require('path');const ROOT="/Coze/Drive/扣子/daming-guoce";
function cls(){const s=new Set();return{add:(...a)=>a.forEach(x=>s.add(x)),remove:(...a)=>a.forEach(x=>s.delete(x)),toggle:(c,f)=>{if(f===undefined){s.has(c)?s.delete(c):s.add(c);}else f?s.add(c):s.delete(c);return s.has(c);},contains:c=>s.has(c),items:()=>[...s]};}
function makeEl(id){const el={id,style:{},dataset:{},value:'',textContent:'',_html:'',children:[],_cls:cls(),parentNode:null,get innerHTML(){return el._html;},set innerHTML(v){el._html=v;},get className(){return el._cls.items().join(' ');},set className(v){el._cls=cls();String(v||'').split(/\s+/).forEach(c=>{if(c)el._cls.add(c);});},get classList(){return el._cls;},appendChild(c){if(c){c.parentNode=el;el.children.push(c);}return c;},insertBefore(c){if(c){c.parentNode=el;el.children.push(c);}return c;},removeChild(c){el.children=el.children.filter(x=>x!==c);return c;},querySelector(){return null;},querySelectorAll(){return[];},addEventListener(){},removeEventListener(){},getAttribute(){return'';},setAttribute(){},offsetWidth:0};return el;}
function mkTab(els,id){if(!els[id])els[id]=makeEl(id);return els[id];}
const body=makeEl('body');const tabs=makeEl('tabs');const els={body,tabs,'center-panel':makeEl('center-panel')};
const doc={__c:0,body,getElementById(id){if(!els[id])els[id]=makeEl(id);return els[id];},querySelectorAll(){return[];},querySelector(){return null;},createElement(tag){const el=makeEl('dyn_'+(++doc.__c));el.__tag=tag||'div';return el;},addEventListener(){},removeEventListener(){},documentElement:makeEl('html'),head:makeEl('head')};
const document=doc;
const sandbox={console,setTimeout:(f)=>{f();return 1;},clearTimeout:()=>{},setInterval:()=>1,clearInterval:()=>{},Math,JSON,Date,Error,Array,Object,String,Number,Boolean,Map,Set,RegExp,undefined,NaN,Infinity,isNaN,isFinite,parseInt,parseFloat,encodeURI,decodeURI,encodeURIComponent,decodeURIComponent,document,
window:{document},localStorage:{_s:{},getItem(k){return this._s[k]||null;},setItem(k,v){this._s[k]=v;},removeItem(k){delete this._s[k];},clear(){this._s={};}},navigator:{userAgent:'node'},location:{href:'',hostname:'localhost'},requestAnimationFrame:()=>0,getComputedStyle:()=>({}),performance:{now:()=>0},AudioContext:function(){},webkitAudioContext:null,confirm:()=>true,alert:()=>{},BroadcastChannel:function(){},Image:function(){},HTMLElement:function(){}};
sandbox.window.document=document;vm.createContext(sandbox);
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const scriptFiles=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]);
for(const f of scriptFiles) vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),sandbox,{filename:f});
function R(c){try{return vm.runInContext(c,sandbox);}catch(e){console.log('ERR',e.message);}}
R(`initGame('chenghua');`);
console.log('provinces:', R('Object.keys(GameState.province.prov).length'));
console.log('nanzhili wealth', R('GameState.province.prov.nanzhili.wealth'),'shanxi',R('GameState.province.prov.shanxi.wealth'));
console.log('shaanxi arms', R('GameState.province.prov.shaanxi.arms'),'henan arms', R('GameState.province.prov.henan.arms'));
console.log('yunnan traits', R('JSON.stringify(PV_PROVINCES.yunnan.traits)'));
console.log('kuangke yunnan lock:', R('pvBranchLocked("yunnan","kuangke")'));
console.log('kuangke henan lock:', R('pvBranchLocked("henan","kuangke")'));
// 执行 kelian
const tr0=R('GameState.stats.treasury');
R('GameState.province.prov.yunnan.wealth=50;GameState.province.prov.yunnan.probity=50;GameState.province.prov.yunnan.disaffect=20;');
R(`pvBranch('yunnan','kelian');`);
console.log('kelian: treasury',R('GameState.stats.treasury'),'exp',tr0-150, 'wealth',R('GameState.province.prov.yunnan.wealth'),'probity',R('GameState.province.prov.yunnan.probity'),'disaffect',R('GameState.province.prov.yunnan.disaffect'));
// 互斥: 再开 zheyin 同finance
console.log('zheyin after kelian lock:', R('pvBranchLocked("yunnan","zheyin")'));
// 不同维叠加
R('GameState.province.prov.yunnan.arms=40;GameState.province.prov.yunnan.disaffect=10;');
R(`pvBranch('yunnan','muyong');`);
console.log('muyong arms', R('GameState.province.prov.yunnan.arms'),'disaffect',R('GameState.province.prov.yunnan.disaffect'),'treasury',R('GameState.stats.treasury'));
// 后果链
R(`fresh2 = null;`); 
// 重置到干净，用 henan（chenghua status=0）
R(`initGame('chenghua'); GameState.province.prov.henan.probity=30; GameState.province.prov.henan.wealth=60; GameState.province.lastTick=-1;`);
R('pvProvinceTick();');
console.log('erosion wealth', R('GameState.province.prov.henan.wealth'));
R(`initGame('chenghua'); GameState.mapData.status.henan=0; GameState.province.prov.henan.disaffect=80; GameState.province.lastTick=-1;`);
const st0=R('GameState.stats.stability');
R('pvProvinceTick();');
console.log('minbian status',R('GameState.mapData.status.henan'),'stability',R('GameState.stats.stability'),'exp',st0-1,'disaffect',R('GameState.province.prov.henan.disaffect'));
R(`initGame('chenghua'); GameState.mapData.status.henan=2; GameState.province.prov.henan.arms=80; GameState.province.lastTick=-1;`);
R('pvProvinceTick();');
console.log('arms suppress status', R('GameState.mapData.status.henan'));
// tax
R(`initGame('chenghua'); const t0=GameState.stats.treasury; GameState.province.prov.nanzhili.wealth=99; GameState.province.lastTick=-1; pvProvinceTick();`);
console.log('tax treasury', R('GameState.province.prov.nanzhili.wealth'), R('Math.round(t0)'), R('GameState.stats.treasury'));
// delay kentian
R(`initGame('chenghua'); GameState.province.prov.yunnan.grain=50;GameState.province.prov.yunnan.people=50;GameState.province.prov.yunnan.disaffect=40;GameState.province.prov.yunnan.arms=40;GameState.stats.treasury=1000;`);
R(`pvBranch('yunnan','kentian');`);
console.log('kentian immediate grain', R('GameState.province.prov.yunnan.grain'),'arms(side)',R('GameState.province.prov.yunnan.arms'),'pending', R('GameState.province.pending.length'));
R('GameState.province.lastTick=-1; GameState.currentMonth=(GameState.currentMonth+1)%3; pvProvinceTick();');
console.log('kentian after season grain', R('GameState.province.prov.yunnan.grain'),'people',R('GameState.province.prov.yunnan.people'),'pending', R('GameState.province.pending.length'));
// render
console.log('renderMapProvinceTab contains:', R('renderMapProvinceTab().indexOf("省治总览")>=0'));
R(`window._mapCurrentKey='yunnan'; renderMapCellActions();`);
console.log('pv-zone innerHTML has 省治:', R('document.getElementById("pv-zone").innerHTML.indexOf("省治")>=0'));
// 存档往返
R(`initGame('chenghua'); GameState.province.prov.yunnan.wealth=77; saveGame(); GameState.province.prov.yunnan.wealth=1; loadGame();`);
console.log('roundtrip wealth', R('GameState.province.prov.yunnan.wealth'));


R('initGame("chenghua");');
console.log('beizhili caoyunx lock:', R('pvBranchLocked("beizhili","caoyunx")'));
console.log('yunnan caoyunx lock:', R('pvBranchLocked("yunnan","caoyunx")'));
console.log('btnHtml kelian exists:', R('typeof pvBranchBtnHtml'));
console.log('muyong debug:');
R('initGame("chenghua"); GameState.province.prov.yunnan.arms=40;GameState.province.prov.yunnan.disaffect=10;');
const tr=R('GameState.stats.treasury'), mp=R('GameState.stats.militaryPower');
console.log('  bases treasury',tr,'mp',mp);
const lock=R('pvBranchLocked("yunnan","muyong")'); console.log('  mucho lock:',lock);
R('pvBranch("yunnan","muyong");');
console.log('  arms',R('GameState.province.prov.yunnan.arms'),'dis',R('GameState.province.prov.yunnan.disaffect'),'treasury',R('GameState.stats.treasury'),'exp',tr-600,'mp',R('GameState.stats.militaryPower'));

R('initGame("chenghua");');
console.log('VBODY:', R('var __b=PV_BRANCHES.kelian;
var __res=\'typeofRES=\'+(typeof RESOURCES)+\' bname=\'+__b.name;
var __cost=null;try{__cost=Object.keys(__b.cost).map(function(c){return (RESOURCES[c]?RESOURCES[c].name:c)+\' \'+__b.cost[c]}).join(\' \');}catch(e){__res+=\' costERR:\'+e.message;}
var __eff=null;try{__eff=Object.keys(__b.eff).filter(function(k){return PV_FIELDS.indexOf(k)>=0||k===\'treasury\'||k===\'stability\'||k===\'militaryPower\'||k===\'navyPower\'||k===\'grain\';}).map(function(k){return k+(__b.eff[k]>0?\'+\':\'\')+__b.eff[k]}).join(\' \');}catch(e){__res+=\' effERR:\'+e.message;}
__res+=\' COST=\'+__cost+\' EFF=\'+__eff;
__res;'));