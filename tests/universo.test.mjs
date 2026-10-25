import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {parseHTML} from 'linkedom';
import * as Three from 'three';
const read = name => fs.readFileSync(new URL('../'+name, import.meta.url),'utf8');
const html = read('index.html');
const controls = html.match(/<script id="universe-controls">([\s\S]*?)<\/script>/)[1];

function harness({mobile=false, reduced=false}={}) {
  const {window} = parseHTML(html), document = window.document;
  let now=100, hidden=false, frameNumber=0, renders=0, renderPR=1, renderPixels=0;
  const queue = new Map(), warnings=[];
  const ctx2d = new Proxy({}, {get:(t,k)=>t[k]??(()=>{}),set:(t,k,v)=>(t[k]=v,true)});
  window.HTMLCanvasElement.prototype.getContext=()=>ctx2d;
  window.HTMLElement.prototype.getBoundingClientRect=()=>({left:mobile?0:1000,width:100,height:30,top:0});
  Object.defineProperty(document,'hidden',{get:()=>hidden});
  let mainScene;
  class Renderer {
    capabilities={isWebGL2:true,getMaxAnisotropy:()=>4};extensions={has:()=>true};
    setPixelRatio(pr){renderPR=pr;}setClearColor(){}setSize(w,h){renderPixels=w*h*renderPR*renderPR;}setRenderTarget(){}
    render(scene){renders++;if(scene.children.length>2)mainScene=scene;}
  }
  const env={window,document,console:{...console,warn:(...args)=>warnings.push(args)},
    location:{search:'',hash:''},innerWidth:mobile?390:1440,innerHeight:mobile?844:900,
    scrollY:0,devicePixelRatio:2,performance:{now:()=>now},
    matchMedia:q=>({matches:/reduced-motion/.test(q)?reduced:mobile&&/max-width|coarse/.test(q),addEventListener(){}}),
    scrollTo:({top})=>{env.scrollY=top;},scrollBy:({top})=>{env.scrollY+=top;},
    requestAnimationFrame:f=>{const id=++frameNumber;queue.set(id,f);return id;},
    cancelAnimationFrame:id=>queue.delete(id),addEventListener:window.addEventListener.bind(window),
    Event:window.Event,CustomEvent:window.CustomEvent,MutationObserver:window.MutationObserver,
    THREE_MOCK:{...Three,WebGLRenderer:Renderer},setTimeout,clearTimeout};
  vm.createContext(env);vm.runInContext(read('universo-dados.js'),env);window.U.lang='pt';
  vm.runInContext(controls,env);
  const tick=(count=1)=>{for(let i=0;i<count;i++){now+=50;const callbacks=[...queue.values()];queue.clear();callbacks.forEach(f=>f(now));}};
  const fire=(target,type,props={})=>{const e=new window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,props);target.dispatchEvent(e);};
  const hide=value=>{hidden=value;fire(document,'visibilitychange');};
  const loadLite=()=>vm.runInContext(read('universo-leve.js'),env);
  const loadPortal=()=>vm.runInContext(read('portal.js'),env);
  const load3D=async()=>{
    const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace("await import('./assets/vendor/three/three.module.min.js')",'THREE_MOCK');
    await vm.runInContext('(async()=>{'+script+'})()',env);tick(3);
  };
  const planetPositions=()=>{const positions=[];mainScene?.traverse(o=>{if(o.isMesh&&o.material.uniforms?.uSeed)positions.push(o.position.toArray());});return JSON.stringify(positions);};
  return {window,document,U:window.U,env,tick,fire,hide,loadLite,loadPortal,load3D,warnings,planetPositions,
    pending:()=>queue.size,renders:()=>renders,pixels:()=>renderPixels,$:s=>document.querySelector(s)};
}

test('Home directly clears inconsistent exploration/drag/panel state, without optional scripts',()=>{
  const h=harness();
  for(let i=0;i<15;i++){
    h.$('#explorar').click();assert.equal(h.U.explorar,true);
    h.document.body.classList.add('universe-dragging');h.$('#painel').classList.add('aberto');
    h.$('#painel').setAttribute('aria-hidden','false');h.$('#universo').classList.add('arrastando');
    h.U.explorar=false; // Reproduce an inconsistent renderer/UI state.
    h.$('#nav a[href="#inicio"]').click();
    assert(!h.document.body.classList.contains('explorando'));
    assert(!h.document.body.classList.contains('universe-dragging'));
    assert.equal(h.$('#painel').getAttribute('aria-hidden'),'true');
    assert(!h.$('#universo').classList.contains('arrastando'));
    assert.equal(h.$('#explorar').getAttribute('aria-expanded'),'false');
    assert.equal(h.env.scrollY,0);
  }
});

test('Every lightweight planet is clickable from the hero and across repeated entry/Home cycles',()=>{
  const h=harness();h.loadLite();
  assert.equal(h.$('.universe-lite').hasAttribute('inert'),false);
  assert.equal(h.document.querySelectorAll('.lite-satellite').length,10);
  for(let round=0;round<3;round++){
    for(const button of h.document.querySelectorAll('.lite-satellite')){
      button.click();
      assert.equal(h.$('#painelCorpo h3').textContent,h.U.repos[button.dataset.planet].nome);
      assert.equal(h.U.explorar,true);
      h.$('#nav a[href="#inicio"]').click();assert.equal(h.U.explorar,false);
      assert.equal(h.$('#painel').getAttribute('aria-hidden'),'true');
    }
    for(const button of h.document.querySelectorAll('.lite-planet')){
      button.click();assert.equal(h.$('#painelCorpo h3').textContent,h.U.grupos[button.dataset.group].pt);
      h.$('#nav a[href="#inicio"]').click();assert.equal(h.U.explorar,false);
    }
  }
});

test('Lightweight orbits move, pause when hidden and resume on return, with one animation loop',()=>{
  const h=harness();h.loadLite();
  const button=h.$('.lite-satellite'), position=()=>button.style.left+button.style.top;
  const first=position();h.tick(20);assert.notEqual(position(),first);
  h.hide(true);const paused=position();h.tick(20);assert.equal(position(),paused);assert.equal(h.pending(),0);
  h.hide(false);h.tick(20);assert.notEqual(position(),paused);
  for(let i=0;i<10;i++){h.fire(h.window,'pageshow');h.fire(h.window,'focus');assert.equal(h.pending(),1);}
  const before=position();h.tick(20);assert.notEqual(position(),before);
});

test('Reduced motion keeps the light map clickable without automatic orbit animation',()=>{
  const h=harness({reduced:true});h.loadLite();assert.equal(h.pending(),0);
  h.$('.lite-satellite').click();assert.equal(h.U.explorar,true);
});

for(const mobile of [false,true]) test(`3D lifecycle: movement, focus, Home, visibility and context recovery (${mobile?'touch':'desktop'})`,async()=>{
  const h=harness({mobile});await h.load3D();assert.equal(h.U.cenaPronta,true);
  const first=h.planetPositions();h.tick(20);assert.notEqual(h.planetPositions(),first);
  for(let i=0;i<10;i++){
    h.fire(h.document,'foca',{detail:6});h.tick(3);assert.equal(h.U.explorar,true);
    h.$('#nav a[href="#inicio"]').click();h.tick(3);assert.equal(h.U.explorar,false);
    assert.equal(h.$('#painel').getAttribute('aria-hidden'),'true');assert.equal(h.pending(),1);
  }
  h.hide(true);const paused=h.renders();h.tick(5);assert.equal(h.renders(),paused);
  h.hide(false);h.tick(5);assert(h.renders()>paused);
  h.fire(h.$('#universo'),'webglcontextlost');h.tick(3);assert.equal(h.U.cenaFalhou,true);assert.equal(h.pending(),0);
  h.fire(h.$('#universo'),'webglcontextrestored');h.tick(5);
  assert.equal(h.U.cenaFalhou,false);assert.equal(h.U.cenaPronta,true);assert.equal(h.pending(),1);
  assert.equal(h.warnings.length,1); // Only the deliberate context-loss event.
});

test('Wheel exits the universe, panel scrolling stays inside it, Escape and Home always exit',()=>{
  const h=harness();h.loadLite();h.loadPortal();
  h.$('#explorar').click();h.fire(h.$('#universo'),'wheel',{deltaY:100,deltaMode:0});assert.equal(h.U.explorar,false);
  assert.equal(h.env.scrollY,100);
  h.$('.lite-satellite').click();h.fire(h.$('#painelCorpo'),'wheel',{deltaY:100,deltaMode:0});assert.equal(h.U.explorar,true);
  h.fire(h.document,'keydown',{key:'Escape'});assert.equal(h.U.explorar,false);
  h.$('#explorar').click();h.$('#nav a[href="#inicio"]').click();assert.equal(h.U.explorar,false);
});

test('3D drawing buffer stays bounded after a large desktop display or phone resize',async()=>{
  for(const mobile of [false,true]){
    const h=harness({mobile});await h.load3D();
    h.env.innerWidth=3840;h.env.innerHeight=2160;h.env.devicePixelRatio=2;
    h.fire(h.window,'resize');h.tick(3);
    assert(h.pixels() <= (mobile?1500000:3000000)+1);
    assert.equal(h.U.cenaPronta,true);assert.equal(h.warnings.length,0);
  }
});
