"use strict";
/* ================= background music (composed live with Web Audio) ================= */
const MUSIC={CH:[[45,57,60,64,71],[41,53,57,64,67],[48,55,59,62,64],[40,52,55,59,62]],PAT:[0,2,3,4,3,2,1,2,0,2,3,4,1,3,4,2],BELL:[81,84,88,86,79,83,88,91],
  LV:{calm:{pad:1,arp:0,bass:0,bell:1},build:{pad:.95,arp:.45,bass:.15,bell:.7},high:{pad:.85,arp:1,bass:.85,bell:.5}}};
function musBuild(ctx,dest){const m={ctx,step:0,next:ctx.currentTime+.15,sd:60/100/4,mode:"calm"},g=v=>{const n=ctx.createGain();n.gain.value=v;return n};
  m.master=g(.0);const comp=ctx.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=3;m.master.connect(comp);comp.connect(dest);
  m.mix=g(1);const verb=ctx.createConvolver(),n=ctx.sampleRate*3.2,ir=ctx.createBuffer(2,n,ctx.sampleRate);
  for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.6)}verb.buffer=ir;
  const wet=g(.42);m.mix.connect(m.master);m.mix.connect(verb);verb.connect(wet);wet.connect(m.master);
  m.pad=g(1);m.arp=g(0);m.bass=g(0);m.bell=g(1);[m.pad,m.bass,m.bell].forEach(b=>b.connect(m.mix));
  const dl=ctx.createDelay(1),fb=g(.38),dw=g(.45);dl.delayTime.value=m.sd*3;m.arp.connect(m.mix);m.arp.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(dw);dw.connect(m.mix);
  return m}
const mhz=n=>440*Math.pow(2,(n-69)/12);
function musVoice(m,bus,type,f,t,a,hold,rel,vol,cut){const c=m.ctx,o=c.createOscillator(),e=c.createGain();o.type=type;o.frequency.value=f;let out=o;
  if(cut){const lp=c.createBiquadFilter();lp.type="lowpass";lp.frequency.value=cut;lp.Q.value=.6;o.connect(lp);out=lp}
  out.connect(e);e.connect(bus);e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(vol,t+a);e.gain.setValueAtTime(vol,t+a+hold);e.gain.exponentialRampToValueAtTime(.0001,t+a+hold+rel);o.start(t);o.stop(t+a+hold+rel+.05);return o}
function musStep(m,i,t){const sd=m.sd,ci=Math.floor(i/64)%4,ch=MUSIC.CH[ci],k=i%64;
  if(k===0)ch.forEach(n=>{const v=n<50?.05:.032;[-7,7].forEach(dt=>{const o=musVoice(m,m.pad,"sawtooth",mhz(n),t,2.2,sd*64-2.2,2.8,v,n<50?520:900);o.detune.value=dt})});
  const tones=ch.slice(1).map(n=>n+12).concat([ch[1]+24]);
  musVoice(m,m.arp,"square",mhz(tones[MUSIC.PAT[i%16]%tones.length]),t,.004,.02,.22,i%4===0?.05:.034,2400);
  if(i%2===0)musVoice(m,m.bass,"triangle",mhz(ch[0]<44?ch[0]+12:ch[0]),t,.006,sd*1.2,.18,i%8===0?.16:.11,700);
  if((k===24||k===48)&&Math.random()<.75)musVoice(m,m.bell,"sine",mhz(MUSIC.BELL[(i/8+ci*3)%MUSIC.BELL.length|0]),t,.01,.05,3.2,.05)}
function musSet(m,mode,muteNow){const L=MUSIC.LV[mode]||MUSIC.LV.calm,t=m.ctx.currentTime;["pad","arp","bass","bell"].forEach(k=>m[k].gain.setTargetAtTime(L[k],t,1.2));m.mode=mode;
  m.master.gain.setTargetAtTime(muteNow?0:1,t,.6)}
let MUS=null;
function musicStart(){if(MUS)return;audioInit();if(!AC)return;if(AC.state==="suspended")AC.resume();MUS=musBuild(AC,AC.destination);musSet(MUS,"calm",muted);
  setInterval(()=>{if(!MUS)return;const c=AC.currentTime;if(MUS.next<c-.5)MUS.next=c+.05;while(MUS.next<c+.35){musStep(MUS,MUS.step,MUS.next);MUS.next+=MUS.sd;MUS.step++}},90)}
function musicMode(){if(!MUS)return;const ph=phase,mode=INTRO.on?(INTRO.cut?"build":"calm"):(ph==="countdown"||ph==="flight"||ph==="arrival"||ph==="landing")?"high":(ph==="hangar"||ph==="review")?"build":"calm";
  if(mode!==MUS.mode)musSet(MUS,mode,muted)}
addEventListener("pointerdown",()=>musicStart(),{once:true,capture:true});addEventListener("keydown",()=>musicStart(),{once:true,capture:true});
$("mute").addEventListener("click",()=>{if(MUS)MUS.master.gain.setTargetAtTime(muted?0:1,AC.currentTime,.2)});
