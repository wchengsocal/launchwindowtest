"use strict";
/* ================= mission state ================= */
let phase="hangar",pt=0,fired=new Set(),M=null,inSpace=false,landing=false,paused=false,debris=[],padSmoke=false,deploy=0;
const rocketVel=new V3(),shipKm=new V3(),S0=new V3(),Pd=new V3();
const D=()=>DEST[M?M.dest:S.dest];
function setPhase(p){phase=p;document.querySelectorAll("[data-cam=ground]").forEach(b=>b.disabled=inSpace||landing||p==="review"||p==="hangar");pt=0;fired=new Set();const d=D();document.body.classList.toggle("hangar",p==="hangar"||p==="review");$("clock").hidden=p==="hangar"||p==="review";$("pauseB").hidden=p==="hangar"||p==="report"||p==="review";
  $("phase").textContent={hangar:"Mission design",review:"Assembly hall",countdown:SITE[S.site].name+" · Countdown",flight:"Flight",failed:"Vehicle lost",cruise:"Cruise to "+nm(d),arrival:d.name+" arrival",landing:"Landing on "+nm(d),ops:"Science at "+nm(d),report:"Mission report"}[p]||p}
function at(t,k,fn){if(pt>=t&&!fired.has(k)){fired.add(k);fn()}}
function toDebris(obj,v,spin,grav){scene.attach(obj);debris.push({obj,vel:v,spin,grav,t:0})}

function startMission(){
  const Dz=design();if(Dz.cost>BUDGET&&!S.sandbox)return;
  audioInit();if(AC&&AC.state==="suspended")AC.resume();
  $("loading").textContent="Generating "+DEST[S.dest].name;$("loading").hidden=false;
  setTimeout(()=>{buildDest(S.dest);$("loading").hidden=true;beginCountdown(Dz)},40);
}
function beginCountdown(Dz){
  const sc=Dz.sc,P=rocketParts(S.rocket);
  M={dest:S.dest,type:S.type,diff:S.diff,sandbox:S.sandbox,design:Dz,sc,cost:Dz.cost,keep:1,bonus:0,log:[],why:[],fail:null,
     scDv:sc.dvCap,capNeed:S.type==="flyby"?0:DEST[S.dest].cap+ORBITS[S.orbit].dv,days:Math.round(DEST[S.dest].days*(S.sc.prop==="ion"?1.3:1)),
     anomalyAt:Math.random()<.03?rand(30,140):-1,obj:S.obj,orbitK:S.orbit,life:S.life,reqList:reqs(sc),pr0:sc.wGen/sc.wNeed,dr0:sc.gen?sc.down/sc.gen:1,team:clone(S.team),stress:0,maxQ:0,landed:null,captured:null,flyby:S.type==="flyby",decisions:[]};
  hallMode(false);if(preview){scene.remove(preview);preview=null}
  probe=makeProbe();rk.userData.slot.add(probe);
  initSim(P,sc.wet);
  focusObj=rk;focusOff.set(0,rk.userData.H*.5,0);eyeObj=rk.userData.eye;cam.dist=rk.userData.H*1.4;
  $("panel").hidden=true;$("feed").innerHTML="";$("report").hidden=true;$("tele").hidden=false;$("ctrl").hidden=false;
  autoCam=true;phase="countdown";setCam("ground");F.auto=S.diff==="easy";updateCtrl();
  if(RVOUT){const o=RVOUT;RVOUT=null;if(o.clean){M.bonus+=5;log("ok","Review","Flight readiness review: every system go. +5 pts.")}else o.risks.forEach(r=>log("warn","Review",`Accepted a risk at the flight readiness review: ${r}.`));M.review=o}
  M.reqOK=M.reqList.every(r=>r[1]);setPhase("countdown");if(S.team.n>1)say(`${who("launch")}, you have the controls for the ascent.`);
}

/* ================= flight physics ================= */
let F=null;const WARPS=[1,2,4,10,50,100,1000];
function initSim(P,payload){
  const site=SITE[S.site];
  F={x:0,y:REm,vx:site.spin,vy:0,t:0,spin:site.spin,payload,fair:true,act:0,thr:1,head:0,cmd:0,sas:"hold",auto:false,lifted:false,released:false,
    st:P.st.map(s=>({eng:s.eng,n:s.n,prop:s.prop,dry:s.dry,lit:false,att:true})),b:P.b?Object.assign({att:true,lit:false},P.b):null,
    area:Math.PI*Math.pow(rk.userData.R,2)+(P.b?P.b.n*Math.PI*Math.pow(P.b.kind==="solid"?SOLIDS[P.b.size].r:rk.userData.R,2):0),
    warp:0,q:0,T:0,m:0,orbit:false,dvBurned:0,needDep:DEST[S.dest].dep,igniteAt:-1,apMode:"ascent",depDone:false,sep:false,el:null,flameMsg:{}};
}
function simMass(){let m=F.payload+(F.fair?FAIRING:0);for(let i=F.act;i<F.st.length;i++)m+=F.st[i].dry+F.st[i].prop;if(F.b&&F.b.att)m+=F.b.dry+F.b.prop;return m}
function frame(){const r=Math.hypot(F.x,F.y),ux=F.x/r,uy=F.y/r;return{r,ux,uy,ex:uy,ey:-ux,h:r-REm}}
function progradeAngle(){const f=frame();let vx=F.vx,vy=F.vy;if(f.h<40000){const s=F.spin*f.r/REm;vx-=f.ex*s;vy-=f.ey*s}const ve=vx*f.ex+vy*f.ey,vu=vx*f.ux+vy*f.uy;return Math.atan2(ve,vu)/DEG}
function simStep(dt){
  const f=frame(),h=f.h,p=h>0?Math.exp(-h/8500):1;let T=0;
  const st=F.st[F.act];
  if(st&&st.att&&st.lit&&st.prop>0&&F.thr>0){const e=st.eng,t=st.n*lerp(e.tvac,e.tsl,p)*1000*F.thr,isp=lerp(e.ivac,e.isl,p);T+=t;st.prop=Math.max(0,st.prop-t/(isp*G0)*dt)}
  const b=F.b;if(b&&b.att&&b.lit&&b.prop>0){const th=b.kind==="solid"?1:F.thr;if(th>0){const t=lerp(b.tvac,b.tsl,p)*th,isp=lerp(b.ivac,b.isl,p);T+=t;b.prop=Math.max(0,b.prop-t/(isp*G0)*dt)}}
  const m=simMass();
  let target=F.sas==="prograde"&&F.lifted?progradeAngle():F.cmd;
  F.head+=clamp(target-F.head,-10*dt,10*dt);
  const a=F.head*DEG,hx=f.ux*Math.cos(a)+f.ex*Math.sin(a),hy=f.uy*Math.cos(a)+f.ey*Math.sin(a),g=MU/(f.r*f.r);
  let ax=-g*f.ux+T/m*hx,ay=-g*f.uy+T/m*hy;
  if(h<140000){const rho=1.225*Math.exp(-Math.max(0,h)/8500),s=F.spin*f.r/REm,rvx=F.vx-f.ex*s,rvy=F.vy-f.ey*s,vr=Math.hypot(rvx,rvy);F.q=.5*rho*vr*vr;if(vr>0){const Dd=F.q*.3*F.area/m;ax-=Dd*rvx/vr;ay-=Dd*rvy/vr}}else F.q=0;
  F.T=T;F.m=m;
  if(!F.lifted){if(F.released&&T/m>g*1.02){F.lifted=true}else{F.vx=f.ex*F.spin;F.vy=f.ey*F.spin;return}}
  F.vx+=ax*dt;F.vy+=ay*dt;F.x+=F.vx*dt;F.y+=F.vy*dt;F.t+=dt;
  if(F.orbit&&T>0)F.dvBurned+=T/m*dt;
  if(Math.hypot(F.x,F.y)<REm-1)F.crash=true;
}
function elements(){
  const r=Math.hypot(F.x,F.y),v2=F.vx*F.vx+F.vy*F.vy,rv=F.x*F.vx+F.y*F.vy,hm=F.x*F.vy-F.y*F.vx,eps=v2/2-MU/r;
  const ex=((v2-MU/r)*F.x-rv*F.vx)/MU,ey=((v2-MU/r)*F.y-rv*F.vy)/MU,e=Math.hypot(ex,ey),p=hm*hm/MU,a=-MU/(2*eps);
  const pe=p/(1+e)-REm,ap=e<1?a*(1+e)-REm:Infinity;let tAp=NaN,period=NaN;
  if(e<1&&e>1e-6){const cosnu=clamp((ex*F.x+ey*F.y)/(e*r),-1,1);let nu=Math.acos(cosnu);if(rv<0)nu=2*Math.PI-nu;const E=2*Math.atan(Math.sqrt((1-e)/(1+e))*Math.tan(nu/2));let Mn=E-e*Math.sin(E);if(Mn<0)Mn+=2*Math.PI;const n=Math.sqrt(MU/(a*a*a));period=2*Math.PI/n;tAp=(Math.PI-Mn)/n;if(tAp<0)tAp+=period}
  return{e,a,p,pe,ap,tAp,period,w:Math.atan2(ey,ex),vr:rv/r,v:Math.sqrt(v2),r,hm}
}
function liveSources(){const out=[];const st=F.st[F.act];if(st&&st.att)out.push(st);return out}
function stageDv(){const st=F.st[F.act];if(!st)return 0;const m0=simMass(),isp=st.eng.ivac;return isp*G0*Math.log(m0/(m0-st.prop))/1000}
function totalDv(){let m=F.payload+(F.fair?FAIRING:0),dv=0;const arr=F.st.slice(F.act);for(let i=arr.length-1;i>=0;i--){const s=arr[i],m0=m+s.dry+s.prop;dv+=s.eng.ivac*G0*Math.log(m0/(m0-s.prop));m=m0}return dv/1000}
function launchNow(){if(phase!=="countdown")return;F.st[0].lit=true;if(F.b)F.b.lit=true;F.released=true;padSmoke=true;say("Liftoff.","ok");setPhase("flight");F.liftT=0}
function stageNext(){
  if(!F.released)return launchNow();
  if(F.depDone||F.sep)return separateSpacecraft();
  if(F.b&&F.b.att){F.b.att=false;rk.userData.boosters.forEach(b=>{const o=b.userData.dir.clone().applyQuaternion(rk.quaternion);toDebris(b,rocketVel.clone().multiplyScalar(.9).addScaledVector(o,7),new V3(o.z*.3,0,-o.x*.3),!inSpace)});
    say(F.b.prop>1?"Boosters dropped with propellant still inside.":"Booster engine cutoff. Booster separation confirmed.",F.b.prop>1?"warn":"ok");return}
  if(F.act<F.st.length-1){const st=F.st[F.act];st.att=false;const sg=rk.userData.stages[F.act].g;toDebris(sg,inSpace?new V3(0,-3,0).applyQuaternion(rk.quaternion):rocketVel.clone().multiplyScalar(.93),new V3(0,0,.12),!inSpace);
    F.act++;F.igniteAt=F.t+.8;const nxt=rk.userData.stages[F.act];focusOff.set(0,(nxt.base+rk.userData.H)/2,0);say(F.act===1?"MECO. Stage separation confirmed.":"Stage separation confirmed.","ok");
    if(!M.staged1){M.staged1=true;if(st.prop>st.dry*.5)why("You dropped a stage that still had propellant in it. Every kilogram you throw away was paid for in fuel.")}return}
  separateSpacecraft();
}
function separateSpacecraft(){
  if(F.sep)return;
  if(!F.orbit){M.fail="sep";say("Spacecraft separated before reaching orbit. It falls back to Earth.","bad");log("bad","Ascent","Released the spacecraft before orbit. It re-entered.");why("A spacecraft needs about 7.8 km/s sideways to stay in low Earth orbit. Separating early means it can't stay up.");setPhase("failed");return}
  F.sep=true;const short=Math.max(0,F.needDep-F.dvBurned/1000);
  if(short>0){M.scDv-=short;say(`The spacecraft burns ${short.toFixed(2)} km/s of its own propellant to finish the departure.`,"warn");log("warn","Departure",`Rocket came up ${short.toFixed(2)} km/s short; the spacecraft covered it from its own tank.`);
    why("Whatever Δv the rocket doesn't deliver, the spacecraft must. That propellant was meant for braking at the destination.")}
  else log("ok","Departure",`Rocket delivered the full ${F.needDep} km/s departure burn.`);
  if(M.scDv<0){M.fail="dep";say("Not enough propellant left to reach "+nm(D())+".","bad");log("bad","Departure","The spacecraft ran out of propellant before reaching a transfer orbit.");setPhase("failed");return}
  toDebris(rk.userData.stages[F.act].g,new V3(-1.4,0,0),new V3(.05,.1,.2),false);F.st[F.act].att=false;F.thr=0;
  focusObj=probe;focusOff.set(0,1.3,0);eyeObj=probe.userData.eye;cam.dist=16;deploy=0;M.deployAt=pt;
  say("Spacecraft separation confirmed.","ok");hint("");
}
function skipMode(){if(!F||!F.lifted||F.sep||!F.el)return null;const el=F.el,f=frame();
  if(F.orbit&&!F.depDone&&F.T>0&&F.thr>0)return "burn";
  if(!F.orbit&&(F.T===0||F.thr===0)&&f.h>70000&&el.e<1&&el.tAp>45)return "ap";return null}
function skipAhead(){const m=skipMode();if(!m)return;let n=0;
  if(m==="ap"){while(n++<400000){simStep(.05);if(F.crash)break;const el=elements();if(el.e>=1||el.tAp<=30)break}say("Skipped ahead to 30 s before apoapsis.")}
  else{F.sas="prograde";while(n++<400000){simStep(.05);if(F.igniteAt>0&&F.t>=F.igniteAt){F.st[F.act].lit=true;F.igniteAt=-1}if(F.dvBurned/1000>=F.needDep){F.thr=0;break}const st=F.st[F.act];if(st.prop<=0){if(F.act<F.st.length-1)stageNext();else break}}say("Fast-forwarded the departure burn.")}
  F.el=elements();F.warp=0;updateCtrl()}
function autoOff(){if(F.auto){F.auto=false;updateCtrl();say("Autopilot off. You have control.")}}
function toggleSas(){if(phase!=="flight")return;F.sas=F.sas==="hold"?"prograde":"hold";if(F.sas==="hold")F.cmd=F.head;updateCtrl()}
function toggleAuto(){if(phase!=="flight"&&phase!=="countdown"||S.diff==="hard")return;F.auto=!F.auto;if(F.auto){F.sas="hold";const el=F.el;F.apMode=F.orbit?"depart":el&&el.ap>190e3?"coast":"ascent"}updateCtrl()}
function warpStep(d){if(!F)return;F.warp=clamp(F.warp+d,0,WARPS.length-1);updateCtrl()}
function maxWarp(){const f=frame();if(F.T>0&&F.thr>0)return f.h<70000?2:3;if(f.h<70000)return 2;return WARPS.length-1}
function updateCtrl(){if(!F)return;$("bSas").textContent="SAS: "+(F.sas==="hold"?"hold":"prograde");$("bAuto").setAttribute("aria-pressed",String(F.auto));$("bAuto").disabled=S.diff==="hard";$("bWarp").textContent="Warp ×"+WARPS[F.warp];const sk=skipMode();$("bSkip").hidden=!sk;$("bSkip").textContent=sk==="burn"?"Finish burn":"Skip to apoapsis";$("bStage").textContent=!F.released?"Launch":F.depDone||F.sep?"Separate":F.b&&F.b.att?"Drop boosters":F.act<F.st.length-1?"Stage":"Separate"}

function autopilot(dt,el){
  const f=frame(),h=f.h,TARGET=200e3;
  if(F.apMode==="ascent"){
    let p=h<900?0:Math.min(90,90*Math.sqrt((h-900)/66000));
    if(h>30000&&!isNaN(el.tAp)&&el.tAp<55&&el.vr>=0)p=Math.max(15,p-(55-el.tAp)*1.2);
    if(h>30000&&el.vr<0)p=clamp(90+el.vr/8,10,90);
    F.cmd=p;const qw=clamp(1-(F.q-24000)/14000,.5,1),aw=el.ap>TARGET*.85?clamp((TARGET*1.04-el.ap)/(TARGET*.19),.25,1):1;F.thr+=(Math.min(qw,aw)-F.thr)*Math.min(1,dt*1.5);
    if(el.ap>=TARGET*1.03){F.thr=0;F.apMode="coast";say("Engine cutoff. Coasting up to apoapsis.")}
  }else if(F.apMode==="coast"){
    F.cmd=90;F.thr=0;const st=F.st[F.act];const Tv=st?st.eng.tvac*1000*st.n:1;const vAp=Math.abs(el.hm)/(el.ap+REm),dv=Math.sqrt(MU/(el.ap+REm))-vAp,bt=dv*simMass()/Tv;
    if(h>120000&&(el.tAp<bt/2+2||el.vr<0)){F.apMode="circ";F.thr=1}
    if(el.ap<TARGET*.7&&h<100000)F.apMode="ascent";
  }else if(F.apMode==="circ"){
    F.cmd=el.vr<0?clamp(90+el.vr/12,40,90):el.vr>60?96:90;F.thr=1;
    if(F.orbit||el.pe>=125e3){F.thr=0;F.apMode="orbit"}
  }else if(F.apMode==="orbit"){F.thr=0;if(F.orbit)F.apMode="depart"}
  else if(F.apMode==="depart"){F.sas="prograde";F.thr=1;if(F.dvBurned/1000>=F.needDep){F.thr=0;F.apMode="done";updateCtrl()}}
  else if(F.apMode==="done"){F.thr=0;if(!F.sep&&pt-(M.doneT||(M.doneT=pt))>1)separateSpacecraft()}
  if(F.orbit&&(F.apMode==="ascent"||F.apMode==="coast"||F.apMode==="circ")){F.thr=0;F.apMode="orbit"}
  if(F.apMode!=="depart"&&F.apMode!=="done")F.sas="hold";
  const want=F.apMode==="ascent"?(h<60000?1:2):F.apMode==="coast"?(el.tAp>240?4:el.tAp>90?3:1):F.apMode==="circ"?1:F.apMode==="depart"?3:0;
  if(F.warp!==Math.min(want,maxWarp())){F.warp=Math.min(want,maxWarp());updateCtrl()}
  const st=F.st[F.act];if(st&&st.prop<=0&&F.act<F.st.length-1&&F.t>F.igniteAt+.5)stageNext();
  if(F.b&&F.b.att&&F.b.prop<=0)stageNext();
  const cur=F.st[F.act];if(F.apMode==="depart"&&cur&&cur.prop<=0&&F.act===F.st.length-1&&F.igniteAt<0&&!F.sep)separateSpacecraft();
}
function tickCountdown(dt){
  const T=5-pt;$("clock").textContent="T-"+fmt(T);
  at(0,"a",()=>say("Launch director: go/no-go poll. All stations go."));
  at(1.2,"arm",()=>say("Crew access arm retracting."));
  if(pt>1.2&&tower){tower.userData.arm.rotation.y=-1.25*easeIO(Math.min(1,(pt-1.2)/2.5))}
  at(3.2,"ign",()=>{F.st[0].lit=true;if(F.b&&F.b.kind==="liquid")F.b.lit=true;padSmoke=true;say("Ignition.","hot")});
  teleAcc+=dt;if(teleAcc>.2){const r=M.design.rs;tele([["STATUS",pt<3.2?"Go for launch":"Engines lit"],["LIFTOFF MASS",Math.round(r.mass0/1000).toLocaleString()+" t"],["THRUST-TO-WEIGHT",r.twr0.toFixed(2)],["Δv ON BOARD",r.dv.toFixed(2)+" km/s"],["DESTINATION",DEST[M.dest].name]],["0 km","0 m/s","1.0 g"])}
  hint(F.auto?"Autopilot will fly the ascent. Watch, or press P to take over.":"Press Space to launch early. After liftoff, fly straight up, then tilt east with D.");
  if(pt>=5||act.pressed)launchNow();
  F.thr=1;
  for(let i=0;i<10;i++)simStep(dt/10);
  vis3D(dt);
}
let mapOn=false;
function toggleMap(){mapOn=!mapOn;$("map").hidden=!mapOn;$("bMap").setAttribute("aria-pressed",String(mapOn));if(mapOn)sizeMap()}
function sizeMap(){const c=$("map"),dpr=Math.min(devicePixelRatio,2);c.width=VW*dpr;c.height=VH*dpr}
function drawMap(el){
  const c=$("map"),g=c.getContext("2d"),W=c.width,H=c.height,dpr=c.width/VW,cs=getComputedStyle(document.documentElement);
  const ink=cs.getPropertyValue("--ink").trim(),mute=cs.getPropertyValue("--mute").trim(),acc=cs.getPropertyValue("--accent").trim(),line=cs.getPropertyValue("--line").trim(),bgc=cs.getPropertyValue("--bg").trim();
  g.fillStyle=bgc;g.fillRect(0,0,W,H);
  const far=el.e<1?Math.min(el.ap+REm,40*REm):8*REm,maxR=Math.max(far,Math.hypot(F.x,F.y),1.35*REm),sc=Math.min(W,H)*.42/maxR,cx=W/2,cy=H/2;
  const P=(x,y)=>[cx+x*sc,cy-y*sc];
  g.fillStyle="#1d5c9a";g.beginPath();g.arc(cx,cy,REm*sc,0,7);g.fill();
  g.strokeStyle=line;g.lineWidth=1*dpr;g.setLineDash([4*dpr,4*dpr]);g.beginPath();g.arc(cx,cy,(REm+1e5)*sc,0,7);g.stroke();g.setLineDash([]);
  g.strokeStyle=acc;g.lineWidth=2*dpr;g.beginPath();const lim=el.e<1?Math.PI:Math.acos(-1/el.e)*.98;let first=true;
  for(let i=0;i<=360;i++){const nu=-lim+2*lim*i/360,r=el.p/(1+el.e*Math.cos(nu));if(r<0||r>60*REm)continue;const th=el.w+nu,[X,Y]=P(r*Math.cos(th),r*Math.sin(th));if(first){g.moveTo(X,Y);first=false}else g.lineTo(X,Y)}g.stroke();
  g.font=`${14*dpr}px Arial,Helvetica,sans-serif`;g.fillStyle=ink;
  const mark=(nu,label)=>{const r=el.p/(1+el.e*Math.cos(nu)),th=el.w+nu,[X,Y]=P(r*Math.cos(th),r*Math.sin(th));g.beginPath();g.arc(X,Y,4*dpr,0,7);g.fill();const dx=X-cx,dy=Y-cy,dl=Math.hypot(dx,dy)||1;g.textAlign=dx<0?"right":"left";g.fillText(label,X+dx/dl*12*dpr,Y+dy/dl*12*dpr+5*dpr);g.textAlign="left"};
  mark(0,"Pe "+(el.pe<0?"below surface":km(el.pe)));if(el.e<1)mark(Math.PI,"Ap "+km(el.ap));
  const [sx,sy]=P(F.x,F.y);g.fillStyle=acc;g.beginPath();g.arc(sx,sy,6*dpr,0,7);g.fill();
  g.fillStyle=mute;g.textAlign="right";g.fillText("Orbit map · M to close",W-16*dpr,(VW>760?110:150)*dpr);g.fillText("Dashed line: edge of space (100 km)",W-16*dpr,(VW>760?132:172)*dpr);g.textAlign="left";
}
function vis3D(dt){
  const f=frame(),el=F.el;
  if(!inSpace){const s=REm*(Math.atan2(F.x,F.y)-F.spin/REm*F.t);rk.position.set(s,PADY+Math.max(0,f.h),0);rk.rotation.z=-F.head*DEG;
    const sp=F.spin*f.r/REm,rvx=F.vx-f.ex*sp,rvy=F.vy-f.ey*sp;rocketVel.set(rvx*f.ex+rvy*f.ey,rvx*f.ux+rvy*f.uy,0);
    const sx=clamp(f.h/26000,0,1);skyU.space.value=sx;starsFg.material.opacity=Math.max(TH.stars,sx*sx);scene.fog.color.setRGB(lerp(TH.fog[0],0,sx),lerp(TH.fog[1],0,sx),lerp(TH.fog[2],.02,sx));scene.fog.far=Math.min(30000,14000+f.h*2);
    sun.target.position.copy(rk.position);sun.position.copy(rk.position).add(SUNOFF);
    if(padSmoke&&f.h<150)padBillow(dt);const base=rk.localToWorld(tv.set(0,-4,0));engineLight.position.copy(base);engineLight.intensity=(F.T>0?1:0)*TH.eng*(.85+Math.random()*.3)*(f.h<400?1:0)}
  else{const a=F.head*DEG,hx=f.ux*Math.cos(a)+f.ex*Math.sin(a),hy=f.uy*Math.cos(a)+f.ey*Math.sin(a);if(!F.sep)rk.rotation.z=-Math.atan2(hx,hy);rocketVel.set(0,0,0);shipKm.set(F.x/1000,F.y/1000,0)}
  // plume visibility from sim
  const p=f.h>0?Math.exp(-f.h/8500):1;
  for(const e of rk.userData.plumes){let on=false,th=0;
    if(e.src==="b"){on=F.b&&F.b.att&&F.b.lit&&F.b.prop>0;th=F.b&&F.b.kind==="solid"?1:F.thr}
    else{const i=+e.src.slice(1),st=F.st[i];on=st&&st.att&&st.lit&&st.prop>0&&i===F.act&&F.thr>0;th=F.thr}
    e.on=on;e.thr=th;}
}
function emitPlumes(list,dt,space){
  for(const e of list){const live=e.on&&e.obj.parent!==null;e.plume.visible=!!live;if(!live)continue;
    const fl=.96+.04*Math.sin(plumeT.value*23+e.r*7)+.02*Math.sin(plumeT.value*41),th=e.thr;e.plume.scale.set(fl*(space?1.3:1),(.55+.45*th)*fl*(space?1.5:1),fl*(space?1.3:1));
    e.obj.localToWorld(ew.copy(e.pos));e.obj.getWorldQuaternion(eq);ed.set(0,-1,0).applyQuaternion(eq);
    const big=e.kind==="srb"?1.6:1,n=Math.ceil(e.r*(space?1.5:4)*th*dt*60*big*QP);
    for(let k=0;k<n;k++){const sp=e.r*.5;const bk=Math.random()*dt;flame.emit(ew.x+rand(-sp,sp)-rocketVel.x*bk,ew.y+rand(-sp,sp)-rocketVel.y*bk,ew.z+rand(-sp,sp)-rocketVel.z*bk,ed.x*60+rocketVel.x+rand(-5,5),ed.y*60+rocketVel.y+rand(-5,5),ed.z*60+rocketVel.z+rand(-5,5),rand(.2,.4),e.r*2.4,e.r*(space?9:6),1,.86,.56,e.kind==="h2"||e.kind==="vac"||e.kind==="metha"?.28:.55)}
    if(!space&&e.kind!=="vac"&&rk.position.y<14000){const m=Math.max(1,Math.round((e.kind==="srb"?3:e.kind==="h2"?1:2)*QP));for(let k=0;k<m;k++){const o=e.r*rand(3,6),c=e.kind==="h2"?.95:.84;
      const bk=Math.random()*dt;smoke.emit(ew.x+ed.x*o-rocketVel.x*bk,ew.y+ed.y*o-rocketVel.y*bk,ew.z+ed.z*o-rocketVel.z*bk,rocketVel.x*.04+rand(-3,3),rocketVel.y*.04+rand(-2,4),rand(-3,3),rand(7,10),e.r*3,e.r*(e.kind==="srb"?9:6),c,c*.98,c*.95,e.kind==="h2"?.25:.4)}}
  }
}
const ew=new V3(),ed=new V3(),eq=new THREE.Quaternion();
function padBillow(dt){for(let k=0;k<Math.ceil(3*dt*60*QP);k++){const s=Math.random()<.5?-1:1;smoke.emit(rand(-6,6),4,s*rand(8,20),rand(-12,12),rand(3,10),s*rand(25,60),rand(6,10),9,16,TH.billow[0],TH.billow[1],TH.billow[2],.5)}}
function explode(){const p=focusObj.localToWorld(tv.copy(focusOff));
  for(let i=0;i<500;i++){const d=new V3(rand(-1,1),rand(-1,1),rand(-1,1)).normalize().multiplyScalar(rand(15,90));flame.emit(p.x,p.y,p.z,d.x+rocketVel.x*.3,d.y+rocketVel.y*.3,d.z,rand(.6,1.8),rand(6,14),18,1,.8,.45,.8)}
  for(let i=0;i<220;i++){const d=new V3(rand(-1,1),rand(-1,1),rand(-1,1)).normalize().multiplyScalar(rand(5,35));smoke.emit(p.x+d.x,p.y+d.y,p.z+d.z,d.x+rocketVel.x*.2,d.y+rocketVel.y*.2,d.z,rand(8,14),rand(10,20),14,.32,.3,.3,.7)}
  rk.visible=false;engineLight.intensity=40;shake=.6;rumble(1)}
function enterSpace(){
  inSpace=true;padG.visible=false;sky.visible=false;starsFg.visible=false;scene.fog=null;smoke.mat.uniforms.tint.value.setRGB(1,1,1);
  debris.forEach(d=>scene.remove(d.obj));debris=[];flame.clear();smoke.clear();
  rk.position.set(0,0,0);sun.position.copy(SUN_DIR).multiplyScalar(300);sun.target.position.set(0,0,0);sun.intensity=2.2;sun.color.set(0xfff4e6);shadowBox(40,800);
  hemi.color.set(0x0b0f1a);hemi.groundColor.set(0x3a5a8a);hemi.intensity=.55;engineLight.intensity=0;camera.near=.2;camera.far=6000;
  cam.theta=-Math.PI/2+.7;cam.phi=1.2;cam.distMul=1;cam.dist=Math.max(30,rk.userData.H*.8);setCam(cam.mode==="ground"?"chase":cam.mode);
  say("Leaving the atmosphere.");
}
function tickFlight(dt){
  if(F.warp>maxWarp()){F.warp=maxWarp();updateCtrl()}
  const w=WARPS[F.warp],simT=dt*w,n=Math.min(4000,Math.ceil(simT/.02));
  // manual controls
  if(!F.auto){const tilt=(keys.KeyD||keys.ArrowRight||hold.right?1:0)-(keys.KeyA||keys.ArrowLeft||hold.left?1:0);if(tilt){F.cmd=clamp(F.cmd+tilt*20*dt,-30,180);if(F.sas==="prograde"){F.sas="hold";updateCtrl()}}
    const tu=(keys.KeyW||keys.ShiftLeft||keys.ShiftRight||keys.ArrowUp||hold.thrUp?1:0)-(keys.KeyS||keys.ControlLeft||keys.ControlRight||keys.ArrowDown||hold.thrDn?1:0);if(tu)F.thr=clamp(F.thr+tu*.8*dt,0,1)}
  else if(keys.KeyD||keys.KeyA||hold.left||hold.right||keys.KeyW||keys.KeyS||hold.thrUp||hold.thrDn)autoOff();
  if(act.pressed)stageNext();
  if(F.igniteAt>0&&F.t>=F.igniteAt){const st=F.st[F.act];if(st&&st.att){st.lit=true;say(F.act===1?"Second engine start.":"Stage "+(F.act+1)+" ignition.","hot")}F.igniteAt=-1}
  {const st=F.st[F.act],sg=rk.userData.stages[F.act];if(st&&sg&&sg.lv&&!inSpace){st.p0=st.p0||st.prop+1;const lvl=Math.min(3,Math.floor((1-st.prop/st.p0)*4));if(lvl>(st.soot||0)){st.soot=lvl;sg.lv.lwDraw(lvl/3)}}
   if(F.b&&F.b.att&&F.b.kind==="liquid"&&!inSpace){F.b.p0=F.b.p0||F.b.prop+1;const lvl=Math.min(3,Math.floor((1-F.b.prop/F.b.p0)*4));if(lvl>(F.b.soot||0)){F.b.soot=lvl;rk.userData.boosters.forEach(b=>b.userData.livery&&b.userData.livery.lwDraw(lvl/3))}}}
  const el=F.el=elements();
  if(F.auto)autopilot(dt,el);
  if(!F.auto&&(S.autoStage||S.diff==="easy")){const st=F.st[F.act];if(F.b&&F.b.att&&F.b.prop<=0)stageNext();else if(st&&st.prop<=0&&F.act<F.st.length-1&&F.t>F.igniteAt+.5&&F.lifted)stageNext()}
  for(let i=0;i<n;i++){simStep(simT/n);if(F.crash)break}
  const f=frame();
  // events
  if(F.lifted&&!M.liftLogged){M.liftLogged=true;log("ok","Launch",`${S.preset?PRESETS[S.preset].name:"Your custom rocket"} cleared the tower.`)}
  if(F.released&&!F.lifted&&pt>6&&!M.fail){M.fail="twr";say("Not enough thrust to lift off. Engines shut down.","bad");log("bad","Launch","Thrust-to-weight was below 1. The rocket never left the pad.");why("Thrust-to-weight ratio must be above 1.0 at liftoff, or the rocket can't overcome its own weight. Real rockets launch at about 1.2 to 1.5.");return setPhase("failed")}
  if(F.q>M.maxQ)M.maxQ=F.q;
  if(F.lifted&&!M.cTower&&frame().h>rk.userData.H+40){M.cTower=1;say("Tower cleared.")}
  if(!M.cMach&&F.lifted&&!inSpace&&rocketVel.length()>343&&frame().h<25000){M.cMach=1;say("Vehicle is supersonic.")}
  if(!M.cMaxQ&&M.maxQ>15000&&F.q<M.maxQ*.9&&frame().h<30000){M.cMaxQ=1;say(`Max-Q, ${Math.round(M.maxQ/1000)} kilopascals.`)}
  if(F.q>40000){M.stress+=(F.q-40000)/20000*(simT);if(!fired.has("qwarn")){fired.add("qwarn");say("Max-Q warning: aerodynamic pressure too high. Throttle down.","warn")}}
  if(M.stress>2.5&&!M.qDamage){M.qDamage=true;M.keep*=.85;log("warn","Max-Q",`Peak pressure hit ${Math.round(M.maxQ/1000)} kPa. The structure was overstressed.`);why("Rockets ease off the throttle around Max-Q, about a minute after launch. Push through it at full power and the air loads can bend the airframe.")}
  if(F.q>75000&&!M.fail){M.fail="breakup";explode();say("Structural failure at Max-Q.","bad");log("bad","Ascent",`Aerodynamic pressure reached ${Math.round(F.q/1000)} kPa and tore the rocket apart.`);why("Flying fast in thick air builds enormous pressure. Tilt gently and throttle down low in the atmosphere.");return setPhase("failed")}
  if(M.anomalyAt>0&&F.t>M.anomalyAt&&!M.fail&&!F.orbit){M.fail="anomaly";explode();say("Vehicle anomaly. Loss of signal.","bad");log("bad","Ascent","An engine failure destroyed the vehicle. About 3% of launches fail. Your design didn't cause this one.");return setPhase("failed")}
  if(F.crash&&!M.fail){M.fail="crash";if(!inSpace)explode();say("The rocket hit the ground.","bad");log("bad","Ascent","The rocket came back down before reaching orbit.");why("To reach orbit, you need to go sideways fast enough that you keep missing the ground. Pitch east gradually and keep the engines burning.");return setPhase("failed")}
  if(F.fair&&f.h>100000){F.fair=false;rk.userData.halves.forEach(h=>{const o=new V3(h.userData.sign,0,0).applyQuaternion(rk.quaternion);toDebris(h,o.multiplyScalar(4).add(rocketVel.clone().multiplyScalar(inSpace?0:.9)),new V3(0,h.userData.sign*.25,h.userData.sign*.5),false)});say("Fairing separation confirmed.")}
  if(!inSpace&&f.h>26000&&!fired.has("space"))fired.add("space"),fadeThen(enterSpace);
  if(!F.orbit&&el.pe>120000&&el.e<1){F.orbit=true;M.orbitOK=true;F.dvBurned=0;const prec=Math.abs(el.ap-el.pe)/1000;M.orbitPrec=prec;say(`Orbit confirmed: ${km(el.pe)} by ${km(el.ap)}.`,"ok");log("ok","Orbit",`Reached orbit at ${km(el.pe)} × ${km(el.ap)}.`);if(prec<60){M.bonus+=5;log("ok","Piloting","Near-circular orbit: +5 pts.")}if(M.maxQ<40000&&!M.qBonus){M.qBonus=true;M.bonus+=5;log("ok","Max-Q",`Peak pressure stayed at ${Math.round(M.maxQ/1000)} kPa: +5 pts.`)}}
  const allEmpty=F.st.slice(F.act).every(s=>s.prop<=0)&&(!F.b||!F.b.att||F.b.prop<=0);
  if(!F.orbit&&allEmpty&&el.vr<0&&f.h<60000&&!M.fail){M.fail="fuel";say("Out of propellant before orbit.","bad");log("bad","Ascent",`Ran dry at ${km(f.h)} going ${Math.round(el.v)} m/s. Orbit needs about 7,800 m/s.`);why("Rocket Δv has to cover about 9.4 km/s to reach low Earth orbit, including losses to gravity and drag. Check the Rocket tab before launch.");return setPhase("failed")}
  if(F.orbit&&!F.depDone&&F.dvBurned/1000>=F.needDep){F.depDone=true;say(`Departure burn complete: on course for ${nm(D())}.`,"ok");F.thr=F.auto?0:F.thr}
  // deployment then cruise
  if(F.sep){const u=(pt-M.deployAt)/2.4;if(u<=1.05){deploy=Math.min(1,u);const e=easeOut(deploy);probe.userData.dep.forEach(p=>setDep(p,.03+.97*e))}if(pt-M.deployAt>4)return setPhase("cruise")}
  vis3D(dt);
  const st=F.st[F.act],emptyNow=st&&st.prop<=0;
  // hints
  if(!F.auto&&!F.sep){
    if(!F.lifted)hint("Engines lighting up.");
    else if(!F.orbit){
      if(F.q>36000)hint("Max-Q: throttle down with S until the pressure (Q) drops below 35 kPa.");
      else if(emptyNow||(F.b&&F.b.att&&F.b.prop<=0))hint("This stage is empty. Press Space to stage.");
      else if(f.h<1000)hint("Climb straight up. At about 1 km, start tilting east by holding D.");
      else if(el.ap<180e3&&F.thr>0)hint(`Keep tilting east as you climb. Aim for apoapsis 200 km (now ${km(Math.max(0,el.ap))}). Pitch now ${Math.round(90-F.head)}°.`);
      else if(el.ap>=180e3&&F.thr>0&&f.h<120000)hint("Apoapsis is high enough. Cut the throttle with X and coast.");
      else hint(`Coast to apoapsis (in ${fmt(el.tAp||0)}). Press Skip to apoapsis or . to warp. About 30 s before it, press T for prograde and burn until periapsis passes 120 km.`);
    }else if(!F.depDone)hint(`In orbit. Burn prograde (T) for ${F.needDep.toFixed(2)} km/s to head for ${nm(D())}: ${(F.dvBurned/1000).toFixed(2)} km/s so far.${emptyNow?" Stage empty: press Space.":""}`);
    else hint("Departure burn done. Cut throttle (X) and press Space to separate the spacecraft.");
  }else if(F.auto&&!F.sep)hint(`Autopilot: ${{ascent:"gravity turn",coast:"coasting to apoapsis",circ:"circularizing",orbit:"orbit reached",depart:"departure burn",done:"separating"}[F.apMode]}. Press P or any flight key to take over.`);
  // HUD
  const thrV=F.thr*100;$("thrBar").firstElementChild.style.width=thrV+"%";
  teleAcc+=dt;if(teleAcc>.1){const g=!F.lifted?1:F.m?F.T/F.m/G0:0,sp=F.spin*f.r/REm,vs=f.h<70000?Math.hypot(F.vx-f.ex*sp,F.vy-f.ey*sp):el.v,vTxt=Math.round(vs).toLocaleString()+" m/s";
    tele([["ALT",alt(Math.max(0,f.h))],[f.h<70000?"SURFACE SPEED":"ORBITAL SPEED",vTxt],["APOAPSIS",el.e<1?alt(Math.max(0,el.ap)):"escape"],["PERIAPSIS",el.pe<-1e6?"suborbital":km(el.pe),el.pe<0?"bad":""],["TO APOAPSIS",isNaN(el.tAp)?"–":fmt(el.tAp)],["PRESSURE Q",(F.q/1000).toFixed(1)+" kPa",F.q>36000?"bad":""],["PITCH",Math.round(90-F.head)+"°"+(F.sas==="prograde"?" (prograde)":"")],["THROTTLE",Math.round(thrV)+"%"],["STAGE",`${F.act+1} of ${F.st.length}${F.b&&F.b.att?" + boosters":""}`],["STAGE Δv",stageDv().toFixed(2)+" km/s"],["TOTAL Δv",totalDv().toFixed(2)+" km/s"]].concat(F.orbit?[["DEPARTURE",`${(F.dvBurned/1000).toFixed(2)} / ${F.needDep.toFixed(2)} km/s`]]:[]),
      [alt(Math.max(0,f.h)),vTxt,g.toFixed(1)+" g"]);updateCtrl();
    const stg=F.st[F.act];ckX({Q:(F.q/1000).toFixed(1)+" kPa",Ap:el.e<1?km(el.ap):"escape",Pe:el.pe<-1e6?"suborbital":km(el.pe),Stage:`${F.act+1} of ${F.st.length}`,Pitch:"PITCH "+Math.round(90-F.head)+"°"},F.thr,stg?stg.prop/Math.max(1,stg.prop+stg.dry*0+(stg.prop0||(stg.prop0=stg.prop))-stg.prop):0,F.head,F.q>36000,fmt(F.t))}
  $("clock").textContent="T+"+fmt(F.t);
  shake=F.T>0?(inSpace?.1:(.2+.4*clamp(F.q/40000,0,1))*Math.max(.3,F.thr)):0;
  rumble(F.T>0?(inSpace?.15:clamp(.3+F.thr*.5,0,1)):0);
  if(mapOn)drawMap(el);
}
function tickFailed(dt){engineLight.intensity*=Math.exp(-dt*2);shake*=Math.exp(-dt*1.5);rumble(Math.max(0,.6-pt*.2));hint("");at(4,"r",()=>fadeThen(report))}
