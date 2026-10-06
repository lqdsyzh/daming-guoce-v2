const vm=require('vm'),fs=require('fs'),path=require('path');
function mkCls(){const s=new Set();return{add:(...a)=>a.forEach(x=>s.add(x)),remove:(...a)=>a.forEach(x=>s.delete(x)),toggle:(c,f)=>{if(f===undefined){s.has(c)?s.delete(c):s.add(c);}else f?s.add(c):s.delete(c);return s.has(c);},contains:c=>s.has(c),items:()=>[...s]};}
function mkEl(id){return{id,style:{},dataset:{},value:'',textContent:'',_h:'',children:[],cls:mkCls(),parentNode:null,get innerHTML(){return this._h;},set innerHTML(v){this._h=v;},get classList(){return this.cls;},appendChild(c){if(c){c.parentNode=this;this.children.push(c);}return c;},querySelector(){return null;},querySelectorAll(){return[];},addEventListener(){},removeEventListener(){},getAttribute(){return null;},setAttribute(){},className:'',offsetWidth:0};}
function mkD(){const body=mkEl('body'),tabs=mkEl('tabs'),els={body,tabs,'center-panel':mkEl('center-panel')};const doc={__c:0,body,getElementById(id){if(!els[id])els[id]=mkEl(id);return els[id];},querySelectorAll(){return[];},createElement(t){const e=mkEl('d'+(++doc.__c));return e;},addEventListener(){},removeEventListener(){},documentElement:mkEl('html'),head:mkEl('head')};body.appendChild(tabs);body.appendChild(mkEl('center-panel'));return doc;}
const document=mkD();
const sandbox={console,setTimeout:f=>{f();return 1;},clearTimeout:()=>{},setInterval:()=>1,clearInterval:()=>{},Math,JSON,Date,Error,Array,Object,String,Number,Boolean,Map,Set,RegExp,undefined,NaN,Infinity,isNaN,isFinite,parseInt,parseFloat,encodeURI,decodeURI,encodeURIComponent,decodeURIComponent,document,window:{document},localStorage:{_s:{},getItem(k){return this._s[k]||null;},setItem(k,v){this._s[k]=v;},removeItem(k){delete this._s[k];},clear(){this._s={};}},navigator:{userAgent:'node'},location:{},requestAnimationFrame:()=>0,getComputedStyle:()=>({}),performance:{now:()=>0},AudioContext:function(){},webkitAudioContext:null,confirm:()=>true,alert:()=>{},BroadcastChannel:function(){},Image:function(){},HTMLElement:function(){}};
sandbox.window.document=document;vm.createContext(sandbox);
const html=fs.readFileSync('/Coze/Drive/扣子/daming-guoce/index.html','utf8');
const files=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]);
for(const f of files)vm.runInContext(fs.readFileSync('/Coze/Drive/扣子/daming-guoce/'+f,'utf8'),sandbox,{filename:f});
const R=c=>vm.runInContext(c,sandbox);
R(`initGame('chenghua');`);
console.log('season/year before', R('GameState.currentSeason'), R('GameState.currentYear'));
let a=R('advanceSeason();');
console.log('advanceSeason returns:', a, '| after', R('GameState.currentSeason'), R('GameState.currentYear'));
// water line step by step
R(`GameState.stats.treasury=999;`);R(`GameState.milOps.institute=3;`);R(`GameState.milOps.firearms=0;`);R(`GameState.milTech=initMilTechState();`);
for(let i=0;i<5;i++){R('GameState.milTech.cd=0;');let r=vm.runInContext('JSON.stringify(mtResearchNavy())',sandbox);console.log('nav call',i,'->',r,'navy=',R('GameState.milTech.navy'));}
