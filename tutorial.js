"use strict";
/* ================= tutorial ================= */
function setTab(t){S.tab=t;renderPanel();$("panes").scrollTop=0;focusForTab()}
const TUTS={
 design:[
  {sel:'.tab[data-tab="mission"]',t:"Mission tab",x:"Start here. Pick your destination, science goal and mission type.",pre:()=>setTab("mission")},
  {sel:'#panes label[for^="o-dest-"]',t:"Destination",x:()=>S.campaign?"Campaign mode flies to Mars. Sandbox mode lets you pick any world.":"Each world needs a different amount of \u0394v and gives a different science bonus."},
  {sel:'.tab[data-tab="rocket"]',t:"Rocket tab",x:"Start from a real rocket like Falcon Heavy, or build your own stage by stage.",pre:()=>setTab("rocket")},
  {sel:'.tab[data-tab="sc"]',t:"Spacecraft tab",x:"Choose the bus, power, antenna and instruments. Every part adds mass, cost and power needs.",pre:()=>setTab("sc")},
  {sel:'#sum .meter',t:"Live budgets",x:"These bars update as you build. A red bar means something needs fixing.",pre:()=>setTab("mission")},
  {sel:'#go',t:"Review the vehicle",x:"When the design checks out, press this to inspect the full stack before launch."},
  {sel:'#tr',t:"Camera and menu",x:"Switch cameras, sound and graphics here. Quit takes you back to the main menu. Drag the 3D view to look around and scroll to zoom."}],
 review:[
  {sel:'#review .rvbar',one:true,t:"Views",x:"Switch between the exploded stack and a spacecraft close-up, and turn part labels on or off."},
  {sel:'#review .frr',one:true,t:"Subsystem checks",x:"Each system gets a go, caution or no-go call. The owner signs off on each one here."},
  {sel:'#rvFoot [data-rv="go"]',t:"Roll out",x:"Once every system is signed off, roll the rocket out to the pad."}],
 flight:[
  {sel:'#bStage',t:"Launch",x:"Press this or Space to light the engines. Press it again to drop a stage when it runs dry."},
  {sel:'#thr',t:"Throttle",x:"W and S change the throttle. Ease off near Max Q so the rocket doesn't break apart."},
  {sel:'[data-hold="left"],[data-hold="right"]',t:"Steering",x:"Climb straight up first. Then tilt east with D to build the sideways speed you need for orbit."},
  {sel:'#bAuto',t:"Autopilot",x:"Stuck? Autopilot can fly the ascent for you.",skip:()=>S.diff==="hard"},
  {sel:'#tl',t:"Mission clock",x:"The countdown runs here. After liftoff, your altitude, speed and apoapsis show below it. You reach orbit when periapsis climbs above the atmosphere."}]};
const TUT={on:false,set:null,i:0,done:{},raf:0,paused:false};
try{Object.assign(TUT.done,JSON.parse(localStorage.getItem("lwTut")||"{}"))}catch(e){}
function tutEls(st){let a=[...document.querySelectorAll(st.sel)].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&!e.closest("[hidden]")});return st.one?a.slice(0,1):a}
function tutRect(e){const q=e.getBoundingClientRect(),sc=e.closest(".panes");let l=q.left,t=q.top,r=q.right,b=q.bottom;
  if(sc){const c=sc.getBoundingClientRect();l=Math.max(l,c.left);t=Math.max(t,c.top);r=Math.min(r,c.right);b=Math.min(b,c.bottom)}return b>t&&r>l?{l,t,r,b}:null}
function startTut(name,force){if(INTRO.on||TUT.on||(!force&&TUT.done[name]))return;TUT.set=TUTS[name];TUT.name=name;TUT.i=-1;TUT.on=true;$("tut").hidden=false;
  if(name==="flight"&&!userPause){userPause=true;TUT.paused=true}tutStep(1)}
function tutStep(d){let i=TUT.i;const L=TUT.set;
  for(;;){i+=d;if(i>=L.length)return endTut();const st=L[i];if(st.skip&&st.skip())continue;if(st.pre)st.pre();const el=tutEls(st);if(el.length){const sc=el[0].closest(".panes");if(sc){const c=sc.getBoundingClientRect(),q=el[0].getBoundingClientRect();if(q.top<c.top||q.top>c.bottom-60)sc.scrollTop+=q.top-c.top-34}break}}
  TUT.i=i;const st=L[i];const shown=L.filter(x=>!(x.skip&&x.skip())),k=shown.indexOf(st)+1;
  $("tN").textContent=`Tutorial \u00b7 ${k} of ${shown.length}`;$("tT").textContent=st.t;$("tX").textContent=typeof st.x==="function"?st.x():st.x;
  $("tNext").textContent=k===shown.length?"Got it":"Next";cancelAnimationFrame(TUT.raf);tutPlace();try{$("tNext").focus({preventScroll:true})}catch(e){}}
function endTut(){TUT.on=false;$("tut").hidden=true;cancelAnimationFrame(TUT.raf);TUT.done[TUT.name]=true;try{localStorage.setItem("lwTut",JSON.stringify(TUT.done))}catch(e){}
  if(TUT.paused){userPause=false;TUT.paused=false}if(TUT.name==="design")setTab("mission")}
function tutPlace(){if(!TUT.on)return;const st=TUT.set[TUT.i],els=tutEls(st);if(!els.length){return tutStep(1)}
  let l=1e9,t=1e9,r=-1e9,b=-1e9;els.forEach(e=>{const q=tutRect(e);if(!q)return;l=Math.min(l,q.l);t=Math.min(t,q.t);r=Math.max(r,q.r);b=Math.max(b,q.b)});if(r<l){TUT.raf=requestAnimationFrame(tutPlace);return}
  const pad=6,W=innerWidth,H=innerHeight;l=Math.max(4,l-pad);t=Math.max(4,t-pad);r=Math.min(W-4,r+pad);b=Math.min(H-4,b+pad);
  const h=$("tHole");h.style.left=l+"px";h.style.top=t+"px";h.style.width=(r-l)+"px";h.style.height=(b-t)+"px";
  const bub=$("tBub"),bw=bub.offsetWidth,bh=bub.offsetHeight,A=58,gap=8,arw=$("tArw");let side,bx,by,ax,ay,rot;
  const cx=(l+r)/2,cy=(t+b)/2;
  if(l-A-gap*2-bw>8)side="left";else if(W-r-A-gap*2-bw>8)side="right";else if(H-b-A-gap*2-bh>8)side="below";else side="above";
  if(side==="left"){ax=l-A-gap;ay=clamp(cy-A/2,8,H-A-8);bx=ax-gap-bw;by=clamp(cy-bh/2,8,H-bh-8);rot=0}
  else if(side==="right"){ax=r+gap;ay=clamp(cy-A/2,8,H-A-8);bx=ax+A+gap;by=clamp(cy-bh/2,8,H-bh-8);rot=180}
  else if(side==="below"){ay=b+gap;ax=clamp(cx-A/2,8,W-A-8);by=ay+A+gap;bx=clamp(cx-bw/2,8,W-bw-8);rot=270}
  else{ay=t-A-gap;ax=clamp(cx-A/2,8,W-A-8);by=ay-gap-bh;bx=clamp(cx-bw/2,8,W-bw-8);rot=90}
  by=clamp(by,8,H-bh-8);bub.style.left=bx+"px";bub.style.top=by+"px";arw.style.left=ax+"px";arw.style.top=ay+"px";arw.style.transform=`rotate(${rot}deg)`;
  const m={left:[8,0],right:[-8,0],below:[0,-8],above:[0,8]}[side];arw.style.setProperty("--bx",(-m[0])+"px");arw.style.setProperty("--by",(-m[1])+"px");
  TUT.raf=requestAnimationFrame(tutPlace)}
$("tNext").addEventListener("click",()=>tutStep(1));$("tSkip").addEventListener("click",endTut);
addEventListener("keydown",e=>{if(!TUT.on)return;if(e.code==="Escape"){endTut()}else if(e.code==="Enter"||e.code==="ArrowRight"){tutStep(1)}else return;e.preventDefault();e.stopImmediatePropagation()},true);
{const _er=enterReview;enterReview=function(){_er();setTimeout(()=>startTut("review"),1300)}}
{const _bc=beginCountdown;beginCountdown=function(Dz){_bc(Dz);setTimeout(()=>{if(phase==="countdown")startTut("flight")},700)}}
