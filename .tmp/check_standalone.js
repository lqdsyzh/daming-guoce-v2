const vm=require('vm'),fs=require('fs');
function cls(){const s=new Set();return{add:(...a)=>a.forEach(x=>s.add(x)),remove:(...a)=>a.forEach(x=>s.delete(x)),toggle:(c,f)=>{if(f===undefined){s.has(c)?s.delete(c):s.add(c);}else f?s.add(c):s.delete(c);return s.has(c);},contains:c=>s.has(c),items:()=>[...s]};}
function el(id){return{id,style:{},dataset:{},value:'',cls:cls(),children:[],parentNode:null,_h:'',listeners:{},get innerHTML(){return this._h;},set innerHTML(v){this._h=v;this.children=[];},get classList(){return this.cls;},appendChild(c){if(c){c.parentNode=this;this.children.push(c);}return c;},querySelector(){return null;},querySelectorAll(){return[];},addEventListener(){},removeEventListener(){},getAttribute(){return null;},setAttribute(){},className:'',offsetWidth:0};}
const body=el('body');const els={'body':body,'center-panel':el('center-panel'),'tabs':el('tabs')};
body.appendChild(els['tabs']);body.appendChild(els['center-panel']);
const document={body,getElementById(id){if(!els[id])els[id]=el(id);return els[id];},querySelectorAll(){return[];},createElement(t){return el(t);},addEventListener(){},removeEventListener(){},documentElement:el('html'),head:el('head')};
const sandbox={console,setTimeout:f=>{f();return 1;},clearTimeout:()=>{},setInterval:()=>1,clearInterval:()=>{},Math,JSON,Date,Error,Array,Object,String,Number,Boolean,Map,Set,RegExp,undefined,NaN,Infinity,isNaN,isFinite,parseInt,parseFloat,encodeURI,decodeURI,encodeURIComponent,decodeURIComponent,document,window:{document},localStorage:{_s:{},getItem(k){return this._s[k]||null;},setItem(k,v){this._s[k]=v;},removeItem(k){delete this._s[k];},clear(){this._s={};}},navigator:{userAgent:'node'},location:{},requestAnimationFrame:()=>0,getComputedStyle:()=>({}),performance:{now:()=>0},AudioContext:function(){},webkitAudioContext:null,confirm:()=>true,alert:()=>{},BroadcastChannel:function(){},Image:function(){},HTMLElement:function(){}};
sandbox.window.document=document;vm.createContext(sandbox);
const s=fs.readFileSync('/Coze/Drive/扣子/daming-guoce/index_standalone.html','utf8');
const blocks=[...s.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
let fail=false;
for(let i=0;i<blocks.length;i++){
  try{vm.runInContext(blocks[i],sandbox,{filename:'inline'+i});}catch(e){console.error('INLINE#'+i+' ERROR:',e.message);fail=true;break;}
}
console.log('inline blocks executed:',blocks.length, fail?'FAIL':'OK');
if(!fail){
  const R=c=>vm.runInContext(c,sandbox);
  R(`initGame('chenghua');GameState.stats.treasury=999;GameState.milOps.institute=3;GameState.milOps.firearms=3;GameState.milTech.cd=0;`);
  const r=R('JSON.stringify(mtResearchCav())');
  console.log('standalone milTechResearch cav->',r, '| tech tab present:', (R('renderMilTechTab()')||'').indexOf('军事科技树')>=0);
  for(let i=0;i<50;i++){R('advanceSeason()');if(R('GameState.currentYear')>=4)break;}
  console.log('standalone advanced seasons OK');
}
