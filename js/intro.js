"use strict";
/* ================= cinematic intro ================= */
const INTRO={on:false,cut:false,i:-1,t:0,T:0,prevTime:null,a:new V3(),b:new V3(),la:new V3(),lb:new V3()};
const v3=(x,y,z)=>new V3(x,y,z);
function introShots(mode){const H=rk.userData.H,top=PADY+H,mid=PADY+H*.5;
  if(mode==="sandbox")return[
   {d:5,ext:true,time:"night",fov:40,p0:v3(40,320,520),p1:v3(110,70,250),l0:v3(0,PADY,0),l1:v3(0,mid,0),cap:"Sandbox mode. No budget and no rules."},
   {d:4.5,out:true,ext:true,time:"night",fov:58,orbit:{r:H*.38,a0:-.6,a1:.9,y0:2,y1:H*.12},l0:v3(0,top,0),l1:v3(0,top-H*.1,0),cap:"Pick any world, from the Moon to Titan."},
   {d:4.5,inn:true,ext:false,fov:50,p0:v3(4,215,18),p1:v3(8,120,34),l0:v3(0,PADY+H*.25,0),l1:v3(0,PADY+H*.4,0),cap:"Stack any engines and stages you want."},
   {d:5,ext:false,fov:44,p0:v3(16,PADY+3,20),p1:v3(16,PADY+H*.95,20),l0:v3(0,PADY+2,0),l1:v3(0,PADY+H*.98,0),cap:"Build the rocket you always wanted."},
   {d:4.5,out:true,ext:false,fov:46,p0:v3(44,17,36),p1:v3(115,58,150),l0:v3(34,14,24),l1:v3(10,PADY+H*.45,0),cap:"Then find out if it flies."}];
  return[
   {d:5,out:false,ext:true,fov:28,p0:v3(-300,14,420),p1:v3(-150,9,250),l0:v3(0,mid,0),l1:v3(0,mid+4,0),cap:"The next launch window opens in 30 days."},
   {d:5,out:true,ext:true,fov:46,orbit:{r:H*.62,a0:2.5,a1:1.6,y0:3,y1:H*.32},l0:v3(0,PADY+H*.78,0),l1:v3(0,PADY+H*.7,0),cap:"Your job is to put a rocket on this pad."},
   {d:4.5,inn:true,ext:false,fov:46,p0:v3(70,170,150),p1:v3(52,48,104),l0:v3(0,PADY+H*.7,0),l1:v3(0,PADY+H*.45,0),cap:"It gets built here, in the assembly hall."},
   {d:5,ext:false,fov:38,orbit:{c:v3(34,14.4,24),r:15,a0:.2,a1:1.1,y0:20,y1:16.5},l0:v3(34,14.6,24),l1:v3(34,14.4,24),cap:"You have $900 million. Every part you pick adds mass, cost and power needs."},
   {d:4.5,out:true,ext:false,fov:46,p0:v3(28,16,66),p1:v3(85,40,170),l0:v3(0,PADY+H*.55,0),l1:v3(0,PADY+H*.5,0),cap:"Design it. Review it. Then fly it yourself."}]}
function introScene(ext,time){if(ext){if(INTRO.prevTime===null)INTRO.prevTime=S.time;S.time=time||"sunset";hallMode(false);if(preview)preview.visible=false}
  else{if(INTRO.prevTime!==null){S.time=INTRO.prevTime}hallMode(true);applyTheme();if(preview)preview.visible=true}}
function startIntro(){if(INTRO.on||phase!=="hangar"||!rk)return;INTRO.on=true;if(QI<2)setQuality(2);ftAcc=ftN=0;INTRO.cut=false;INTRO.T=0;document.body.classList.add("intro");
  const el=$("intro");el.hidden=false;introScene(true);$("iBlack").style.opacity=1;requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add("on")));
  introDiff(S.diff||"normal");setTimeout(()=>{try{$("iCamp").focus({preventScroll:true})}catch(e){}},600)}
function introGo(mode){if(!INTRO.on||INTRO.cut)return;INTRO.cut=true;INTRO.shots=introShots(mode);$("intro").classList.add("cut");introShot(0);try{audioInit()}catch(e){}}
function introShot(i){INTRO.i=i;INTRO.t=0;const s=INTRO.shots[i];introScene(s.ext,s.time);const c=$("iCap");clearTimeout(INTRO.capT);c.style.transition="none";c.classList.remove("show");void c.offsetWidth;c.style.transition="";c.textContent=s.cap;INTRO.capT=setTimeout(()=>c.classList.add("show"),300)}
function introEnd(){if(!INTRO.on)return;INTRO.on=false;INTRO.cut=false;$("intro").classList.remove("on","cut");$("intro").hidden=true;$("iCap").classList.remove("show");
  introScene(false);INTRO.prevTime=null;document.body.classList.remove("intro");cam.theta=.9;cam.phi=1.36;cam.distMul=1;focusForTab();camS.on=false;
  const f=$("fade");f.style.transition="none";f.classList.add("on");void f.offsetWidth;f.style.transition="";requestAnimationFrame(()=>f.classList.remove("on"));setTimeout(()=>startTut("design"),900)}
function introTick(dt){INTRO.T+=dt;const H=rk.userData.H,ease=x=>x*x*(3-2*x),b=$("iBlack");let s,u,op=0;
  if(!INTRO.cut){const a=.35+INTRO.T*.035;camera.position.set(Math.sin(a)*260,22,Math.cos(a)*260);camera.lookAt(0,PADY+H*.5,0);camera.fov=34;op=Math.max(0,1-INTRO.T/1.6)}
  else{INTRO.t+=dt;s=INTRO.shots[INTRO.i];if(INTRO.t>=s.d){if(INTRO.i<INTRO.shots.length-1){introShot(INTRO.i+1);s=INTRO.shots[INTRO.i]}else{introEnd();return}}
    u=ease(clamp(INTRO.t/s.d,0,1));
    if(s.orbit){const o=s.orbit,c=o.c||v3(0,0,0),a=o.a0+(o.a1-o.a0)*u;camera.position.set(c.x+Math.sin(a)*o.r,(o.c?0:PADY)+o.y0+(o.y1-o.y0)*u,c.z+Math.cos(a)*o.r)}
    else camera.position.lerpVectors(s.p0,s.p1,u);
    INTRO.la.lerpVectors(s.l0,s.l1,u);camera.lookAt(INTRO.la);camera.fov=s.fov;
    if(s.inn||INTRO.i===0)op=Math.max(op,clamp(1-INTRO.t/.6,0,1));if(s.out)op=Math.max(op,clamp((INTRO.t-(s.d-.6))/.6,0,1))}
  b.style.opacity=op;camera.near=.5;camera.updateProjectionMatrix()}
const DIFF_SUB={easy:"Autopilot flies the ascent and stages for you. Wide capture and landing windows.",normal:"You fly. Autopilot is one button away.",hard:"No autopilot. Tight windows."};
function introDiff(k){S.diff=k;document.querySelectorAll("#iTitle [data-diff]").forEach(b=>b.setAttribute("aria-checked",String(b.dataset.diff===k)));$("iDsub").textContent=DIFF_SUB[k]}
document.querySelectorAll("#iTitle [data-diff]").forEach(b=>b.addEventListener("click",()=>introDiff(b.dataset.diff)));
$("iCamp").addEventListener("click",()=>{S.campaign=true;S.sandbox=false;S.dest="mars";fixObj();S.tab="mission";renderPanel();introGo("campaign")});
$("iSand").addEventListener("click",()=>{S.campaign=false;S.sandbox=true;S.tab="mission";renderPanel();introGo("sandbox")});
$("iSkip").addEventListener("click",introEnd);
addEventListener("keydown",e=>{if(!INTRO.on)return;if(e.code==="Escape")introEnd();else if(e.code==="Space"||e.code==="Enter"){if(!INTRO.cut)return}else return;
  e.preventDefault();e.stopImmediatePropagation()},true);
