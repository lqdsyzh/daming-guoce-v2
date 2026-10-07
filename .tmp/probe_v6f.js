const vm=require('vm'),fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,"..");
function mkCls(){const s=new Set();return{add:(...a)=>a.forEach(x=>s.add(x)),remove:(...a)=>a.forEach(x=>s.delete(x)),toggle:(c,f)=>{if(f===undefined){s.has(c)?s.delete(c):s.add(c);}else f?s.add(c):s.delete(c);return s.has(c);},contains:c=>s.has(c),items:()=>[...s]};}
function mkEl(id){return{id,style:{},dataset:{},value:'',textContent:'',_h:'',children:[],cls:mkCls(),parentNode:null,get innerHTML(){return this._h;},set innerHTML(v){this._h=v;},get classList(){return this.cls;},appendChild(c){if(c){c.parentNode=this;this.children.push(c);}return c;},querySelector(){return null;},querySelectorAll(){return[];},addEventListener(){},removeEventListener(){},getAttribute(){return null;},setAttribute(){},className:'',offsetWidth:0};}
function mkD(){const tabs=mkEl('tabs'),body=mkEl('body');const els={};const doc={__c:0,addEventListener(){},removeEventListener(){},dispatchEvent(){},body,getElementById(id){if(!els[id])els[id]=mkEl(id);return els[id];},createElement(t){const e=mkEl('d'+(++doc.__c));return e;},documentElement:mkEl('html'),head:mkEl('head')};
  Object.defineProperty(doc.body,'innerHTML',{get(){return this._h;},set(v){this._h=v;}});
  body.appendChild(tabs);body.appendChild(mkEl('center-panel'));return{ave:doc,els};}
const {ave:document}=mkD();
const sandbox={console,setTimeout:(f)=>{f();return 1;},clearTimeout:()=>{},setInterval:()=>1,clearInterval:()=>{},Math,JSON,Date,Error,Array,Object,String,Number,Boolean,Map,Set,RegExp,undefined,NaN,Infinity,isNaN,isFinite,parseInt,parseFloat,encodeURI,decodeURI,encodeURIComponent,decodeURIComponent,document,window:{document},localStorage:{_s:{},getItem(k){return this._s[k]||null;},setItem(k,v){this._s[k]=v;},removeItem(k){delete this._s[k];},clear(){this._s={};}},navigator:{userAgent:'node'},location:{href:'',hostname:'localhost'},requestAnimationFrame:()=>0,getComputedStyle:()=>({}),performance:{now:()=>0},AudioContext:function(){},webkitAudioContext:null,confirm:()=>true,alert:()=>{},BroadcastChannel:function(){},Image:function(){},HTMLElement:function(){}};
sandbox.window.document=document;vm.createContext(sandbox);
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const files=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]);
for(const f of files)vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),sandbox,{filename:f});
const R=c=>vm.runInContext(c,sandbox);
R(`initGame('chenghua');`);
function result(code){try{return vm.runInContext(code,sandbox);}catch(e){return 'THROW:'+e.message;}}
// give money
R(`GameState.stats.treasury=500;GameState.milOps.institute=3;GameState.milOps.firearms=3;`);
console.log('power before', R(`milOpsPowerMod()`));
// cav line to L4
let r=result(`JSON.stringify(GameState.milTech.cd=0,mtResearchCav())`); console.log('cav->1',r,R(`GameState.milTech.cav`));
r=result(`JSON.stringify(GameState.milTech.cd=0,mtResearchCav())`); console.log('cav->2',r,R(`GameState.milTech.cav`));
r=result(`JSON.stringify(GameState.milTech.cd=0,mtResearchCav())`); console.log('cav->3',r,R(`GameState.milTech.cav`));
console.log('tactic qichong?', R(`GameState.milTech.tactics.qichong`), 'BF has mt_qichong?', R(`!!BF_TACTICS.mt_qichong`));
console.log('damingcav in player types', R(`!!BF_PLAYER_TYPES.mt_damingcav`));
console.log('power after cav', R(`milOpsPowerMod()`));
// navy
r=result(`JSON.stringify(GameState.milTech.cd=0,mtResearchNavy())`); console.log('nav->1',r,R(`GameState.milTech.navy`));
r=result(`JSON.stringify(GameState.milTech.cd=0,mtResearchNavy())`); console.log('nav->2',r,R(`GameState.milTech.navy`));
r=result(`JSON.stringify(GameState.milTech.cd=0,mtResearchNavy())`); console.log('nav->3',r,R(`GameState.milTech.navy`));
r=result(`JSON.stringify(GameState.milTech.cd=0,mtResearchNavy())`); console.log('nav->4',r,R(`GameState.milTech.navy`),'huogong',R(`GameState.milTech.tactics.huogong`),'BF mt_huogong',R(`!!BF_TACTICS.mt_huogong`));
// branches
r=result(`JSON.stringify(GameState.milTech.cd=0,mtResearchHuochong())`); console.log('huochong',r,R(`GameState.milTech.huochong`));
r=result(`JSON.stringify(GameState.milTech.cd=0,mtResearchFort())`); console.log('fort',r,R(`GameState.milTech.fort`));
console.log('power after all', R(`milOpsPowerMod()`));
// gating test: fresh game low treasury, no fire
R(`initGame('chenghua');GameState.stats.treasury=0;GameState.milOps.institute=0;GameState.milOps.firearms=0;`);
console.log('gate cav no money', result(`JSON.stringify(GameState.milTech.cd=0,mtResearchCav())`));
R(`GameState.milOps.firearms=1;GameState.stats.treasury=999;`);
console.log('gate huochong need fa2', result(`JSON.stringify(GameState.milTech.cd=0,mtResearchHuochong())`));
// cd gating
R(`GameState.milTech.cd=1;`);
console.log('cd blocks', result(`JSON.stringify(GameState.milTech.cd=0,mtResearchFort())`));
// simulate battle with new units
R(`initGame('chenghua');GameState.stats.treasury=999;GameState.milOps.institute=3;GameState.milOps.firearms=3;`);
R(`GameState.milTech.cd=0,mtResearchCav();GameState.milTech.cd=0,mtResearchCav();GameState.milTech.cd=0,mtResearchCav();`); // cav=3
const br=result(`(()=>{var r=bfStart({kind:'beilu',mode:'pacify',troops:80}); if(!r.ok)return JSON.stringify(r); bfAppendExtraUnits(); return 'units='+GameState.battlefield.player.units.map(u=>u.type).join(',');})()`);
console.log('battle units after cav3:', br);
console.log('DONE');
