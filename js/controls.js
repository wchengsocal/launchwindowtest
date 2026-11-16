"use strict";
/* ================= camera ================= */
const cam={mode:"chase",theta:.9,phi:1.36,dist:90,distMul:1,yaw:0,pitch:0};
let focusObj=null,eyeObj=null,autoCam=true,dragging=false,lastX=0,lastY=0,shake=0;
const camS={on:false,f:new V3(),r:0,th:0,ph:0},focusOff=new V3(),tv=new V3(),tq=new THREE.Quaternion(),te=new THREE.Euler();
const Q_EYE=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(new V3(),new V3(1,.35,0).normalize(),new V3(-.35,1,0)));
const cv=$("c");
cv.addEventListener("pointerdown",e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;cv.setPointerCapture(e.pointerId)});
cv.addEventListener("pointermove",e=>{if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;autoCam=false;
  if(cam.mode==="astro"){cam.yaw=clamp(cam.yaw-dx*.004,-.4,.4);cam.pitch=clamp(cam.pitch-dy*.004,-.28,.28)}else{cam.theta-=dx*.006;cam.phi=clamp(cam.phi-dy*.006,.12,2.95)}});
const endDrag=()=>dragging=false;cv.addEventListener("pointerup",endDrag);cv.addEventListener("pointercancel",endDrag);
cv.addEventListener("wheel",e=>{e.preventDefault();cam.distMul=clamp(cam.distMul*Math.exp(e.deltaY*.001),.3,6)},{passive:false});
function setCam(m){if(m==="ground"&&(inSpace||landing||phase==="review"||phase==="hangar"))m="chase";cam.mode=m;cam.yaw=0;cam.pitch=0;
  document.querySelectorAll("[data-cam]").forEach(b=>{b.setAttribute("aria-pressed",String(b.dataset.cam===m));if(b.dataset.cam==="ground")b.disabled=inSpace||landing||phase==="review"||phase==="hangar"});
  $("cockpit").hidden=m!=="astro";document.body.classList.toggle("astro",m==="astro");$("feed").hidden=m==="astro";if(phase!=="hangar"&&phase!=="report"&&phase!=="review")$("tele").hidden=m==="astro"}
document.querySelectorAll("[data-cam]").forEach(b=>b.addEventListener("click",()=>{autoCam=false;setCam(b.dataset.cam)}));
function updateCamera(dt){
  focusObj.updateMatrixWorld(true);const f=focusObj.localToWorld(tv.copy(focusOff));
  if(cam.mode==="astro"&&eyeObj){eyeObj.getWorldPosition(camera.position);eyeObj.getWorldQuaternion(tq);camera.quaternion.copy(tq).multiply(Q_EYE).multiply(new THREE.Quaternion().setFromEuler(te.set(cam.pitch,cam.yaw,0,"YXZ")));camera.fov=60}
  else if(cam.mode==="ground"&&!inSpace&&!landing){camera.position.set(240,8,330);camera.lookAt(f);const d=camera.position.distanceTo(f);camera.fov=clamp(2*Math.atan(rk.userData.H*2.2/d)/DEG,1.5,48)}
  else{let r=cam.dist*cam.distMul,th=cam.theta,ph=cam.phi;
    if(phase==="hangar"||phase==="review"){const k=1-Math.exp(-dt*4.5);if(!camS.on){camS.on=true;camS.f.copy(f);camS.r=r;camS.th=th;camS.ph=ph}
      camS.f.lerp(f,k);camS.r+=(r-camS.r)*k;camS.th+=(th-camS.th)*Math.min(1,k*2.5);camS.ph+=(ph-camS.ph)*Math.min(1,k*2.5);f.copy(camS.f);r=camS.r;th=camS.th;ph=camS.ph}else camS.on=false;
    camera.position.set(f.x+r*Math.sin(ph)*Math.sin(th),f.y+r*Math.cos(ph),f.z+r*Math.sin(ph)*Math.cos(th));
    if(!inSpace&&camera.position.y<2)camera.position.y=2;camera.lookAt(f);camera.fov=50}
  if(shake>0){const s=Math.min(shake,.6),T=performance.now()/1000,k=s*.004*camera.fov/50,n=o=>Math.sin(T*13.1+o)*.5+Math.sin(T*23.7+o*2.1)*.3+Math.sin(T*41.3+o*3.7)*.2;
    camera.rotateX(n(1)*k);camera.rotateY(n(2)*k);if(cam.mode==="astro")camera.rotateZ(n(3)*k*.6)}
  camera.near=inSpace||landing||phase==="hangar"||cam.mode==="astro"?(inSpace||landing?.2:.5):clamp((rk?rk.position.y:0)/400,.5,20);
  camera.updateProjectionMatrix();
}

/* ================= audio ================= */
let AC=null,rum=null,muted=false;
function audioInit(){if(AC)return;try{AC=new(window.AudioContext||window.webkitAudioContext)();const n=AC.sampleRate*2,buf=AC.createBuffer(1,n,AC.sampleRate),d=buf.getChannelData(0);let l=0;for(let i=0;i<n;i++){l=(l+.02*(Math.random()*2-1))/1.02;d[i]=l*3.5}
  const src=AC.createBufferSource();src.buffer=buf;src.loop=true;const lp=AC.createBiquadFilter();lp.type="lowpass";lp.frequency.value=300;const g=AC.createGain();g.gain.value=0;src.connect(lp);lp.connect(g);g.connect(AC.destination);src.start();rum={g,lp}}catch(e){AC=null}}
function rumble(x){if(!rum)return;rum.g.gain.setTargetAtTime(muted?0:x*.9,AC.currentTime,.15);rum.lp.frequency.setTargetAtTime(180+x*520,AC.currentTime,.2)}
$("mute").addEventListener("click",()=>{muted=!muted;$("mute").textContent=muted?"Sound off":"Sound on";$("mute").setAttribute("aria-pressed",String(muted))});

/* ================= input + HUD helpers ================= */
const keys={},hold={left:0,right:0,thrUp:0,thrDn:0};const act={down:false,pressed:false};
addEventListener("keydown",e=>{if(e.target.matches("input,select,textarea"))return;keys[e.code]=true;
  if(e.code==="Space"&&phase!=="hangar"&&phase!=="report"&&phase!=="review"){e.preventDefault();if(!e.repeat){act.pressed=true}act.down=true}
  if(e.repeat)return;
  if(e.code==="Escape"&&phase!=="hangar"&&phase!=="report"&&phase!=="review"){togglePause();return}
  if(e.code==="KeyV"&&phase!=="report"){autoCam=false;const o=inSpace||landing?["chase","astro"]:["chase","astro","ground"];setCam(o[(o.indexOf(cam.mode)+1)%o.length])}
  if(phase==="flight"){if(e.code==="KeyZ"){F.thr=1;autoOff()}if(e.code==="KeyX"){F.thr=0;autoOff()}if(e.code==="KeyT")toggleSas();if(e.code==="KeyP")toggleAuto();if(e.code==="KeyM")toggleMap();if(e.code==="Period")warpStep(1);if(e.code==="Comma")warpStep(-1)}
  if(e.code==="KeyM"&&phase!=="flight"&&!$("map").hidden)toggleMap();
});
addEventListener("keyup",e=>{keys[e.code]=false;if(e.code==="Space")act.down=false});
document.querySelectorAll("[data-hold]").forEach(b=>{const k=b.dataset.hold,on=e=>{e.preventDefault();hold[k]=1;b.classList.add("held")},off=()=>{hold[k]=0;b.classList.remove("held")};b.addEventListener("pointerdown",on);["pointerup","pointercancel","pointerleave"].forEach(ev=>b.addEventListener(ev,off))});
$("bStage").addEventListener("click",()=>{if(phase==="flight")stageNext();else if(phase==="countdown")launchNow()});
$("bSkip").addEventListener("click",()=>skipAhead());$("bSas").addEventListener("click",()=>toggleSas());$("bAuto").addEventListener("click",()=>toggleAuto());$("bMap").addEventListener("click",()=>toggleMap());$("bWarp").addEventListener("click",()=>warpStep(1));
/* ---- capsule interior: narrow window, panels, live screens ---- */
function buildCockpit(){
  const W=[],t=(x,y,sz,txt,fill,an="start",id="",cls="")=>W.push(`<text ${id?`id="${id}"`:""} ${cls?`class="${cls}"`:""} x="${x}" y="${y}" font-size="${sz}" fill="${fill}" text-anchor="${an}">${txt}</text>`);
  const WIN="M486 64 H1114 Q1158 64 1164 108 L1190 420 Q1194 464 1150 464 H450 Q406 464 410 420 L436 108 Q442 64 486 64Z";
  const CON="M-1200 1600 V900 H236 L292 604 Q300 556 352 552 L800 540 L1248 552 Q1300 556 1308 604 L1364 900 H2800 V1600Z";
  W.push(`<defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4149"/><stop offset=".6" stop-color="#262b31"/><stop offset="1" stop-color="#15181c"/></linearGradient>
    <linearGradient id="con" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b434b"/><stop offset=".25" stop-color="#2a3036"/><stop offset="1" stop-color="#14171b"/></linearGradient>
    <linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".09"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f5fae"/><stop offset="1" stop-color="#6aa6e6"/></linearGradient>
    <linearGradient id="gnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a6634"/><stop offset="1" stop-color="#4f3218"/></linearGradient>
    <radialGradient id="ballsh" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>
    <radialGradient id="vg" cx=".5" cy=".3" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient>
    <clipPath id="ball"><circle cx="800" cy="716" r="104"/></clipPath></defs>`);
  // walls with the window cut out, soft ribs, window frame
  W.push(`<path fill="url(#wall)" fill-rule="evenodd" d="M-1200 -700H2800V1600H-1200Z ${WIN}"/>`);
  for(const x of [250,1350])W.push(`<path d="M${x} -700 V560" stroke="#1a1d21" stroke-width="10"/><path d="M${x+6} -700 V560" stroke="#4a525b" stroke-width="2"/>`);
  for(const [x,y,w,h] of [[40,120,170,300],[1390,120,170,300]])W.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#2c3238" stroke="#1b1e22" stroke-width="3"/><rect x="${x+12}" y="${y+12}" width="${w-24}" height="${h-24}" rx="12" fill="none" stroke="#3d454e" stroke-width="2"/>`);
  W.push(`<path d="${WIN}" fill="url(#gl)"/><path d="${WIN}" fill="none" stroke="#14171a" stroke-width="30"/><path d="${WIN}" fill="none" stroke="#525c66" stroke-width="18"/><path d="${WIN}" fill="none" stroke="#6d7782" stroke-width="2" transform="translate(0 -2)"/>`);
  for(const [x,y] of [[460,90],[1140,90],[430,440],[1170,440],[800,58],[800,470]])W.push(`<circle cx="${x}" cy="${y}" r="5" fill="#2a3036" stroke="#7a848e" stroke-width="1.5"/>`);
  // message strip under the window
  W.push(`<rect x="560" y="482" width="480" height="34" rx="17" fill="#0b0e11" stroke="#38414a" stroke-width="2"/>`);t(800,505,15,"","#9fe870","middle","ckMsg","scr");
  // console
  W.push(`<path d="${CON}" fill="url(#con)"/><path d="M236 900 L292 604 Q300 556 352 552 L800 540 L1248 552 Q1300 556 1308 604 L1364 900" fill="none" stroke="#5d6772" stroke-width="3"/>`);
  // status lights
  [["ckL0","PROGRADE",608],["ckL1","AUTOPILOT",718],["ckL2","ENGINE",882],["ckL3","MAX-Q",992]].forEach(([id,l,x])=>{W.push(`<rect id="${id}" x="${x-50}" y="566" width="100" height="28" rx="14" fill="#1a1e22" stroke="#3a424a" stroke-width="2"/>`);t(x,585,12,l,"#6c7782","middle",id+"t")});
  // screens
  const scr=(x,y,title,rows)=>{W.push(`<rect x="${x}" y="${y}" width="300" height="214" rx="16" fill="#1b1f24" stroke="#0e1013" stroke-width="3"/><rect x="${x+10}" y="${y+10}" width="280" height="194" rx="10" fill="#05080a" stroke="#2c3a33" stroke-width="2"/>`);
    t(x+26,y+40,14,title,"#5f8a6c","start","","scr");rows.forEach(([l,id],i)=>{t(x+26,y+80+i*36,13,l,"#5f8a6c","start","","scr");t(x+274,y+82+i*36,24,"–","#b6f28c","end",id,"scr")})};
  scr(318,612,"FLIGHT",[["ALTITUDE","ckAlt"],["SPEED","ckVel"],["G-LOAD","ckG"],["PRESSURE Q","ckQ"]]);
  scr(982,612,"ORBIT",[["APOAPSIS","ckAp"],["PERIAPSIS","ckPe"],["STAGE","ckStage"],["MISSION TIME","ckTime"]]);
  // navball
  let lad=`<rect x="680" y="-600" width="240" height="1316" fill="url(#sky)"/><rect x="680" y="716" width="240" height="1316" fill="url(#gnd)"/><line x1="680" y1="716" x2="920" y2="716" stroke="#f4f6f8" stroke-width="3"/>`;
  for(let p=-80;p<=80;p+=10){if(!p)continue;const y=716-p*2.4,w=p%30===0?60:36;lad+=`<line x1="${800-w}" y1="${y}" x2="${800+w}" y2="${y}" stroke="#f4f6f8" stroke-opacity=".8" stroke-width="2"/>`;if(p%30===0)lad+=`<text x="${800+w+8}" y="${y+5}" font-size="13" fill="#f4f6f8" class="scr">${Math.abs(p)}</text>`}
  W.push(`<circle cx="800" cy="716" r="122" fill="#14171a"/><g clip-path="url(#ball)"><g id="ckHz">${lad}</g><circle cx="800" cy="716" r="104" fill="url(#ballsh)"/></g>`);
  W.push(`<circle cx="800" cy="716" r="113" fill="none" stroke="#6b7580" stroke-width="16"/><circle cx="800" cy="716" r="121" fill="none" stroke="#2a3036" stroke-width="2"/>`);
  for(let i=0;i<36;i++){const a=i*Math.PI/18,r1=i%9===0?100:106,r2=120;W.push(`<line x1="${800+Math.sin(a)*r1}" y1="${716-Math.cos(a)*r1}" x2="${800+Math.sin(a)*r2}" y2="${716-Math.cos(a)*r2}" stroke="${i%9===0?"#f2f4f6":"#a7b0b9"}" stroke-width="${i%9===0?3:1.5}"/>`)}
  W.push(`<path d="M748 716 h30 l22 16 l22 -16 h30" fill="none" stroke="#ffc400" stroke-width="5" stroke-linejoin="round"/><circle cx="800" cy="716" r="4" fill="#ffc400"/>`);
  W.push(`<rect x="740" y="836" width="120" height="30" rx="15" fill="#0b0e11" stroke="#38414a" stroke-width="2"/>`);t(800,857,16,"PITCH –","#b6f28c","middle","ckPitch","scr");
  // throttle and stage fuel gauges either side of the navball
  for(const [x,id,l,col] of [[652,"ckThr","THR","#ffc400"],[920,"ckFuel","FUEL","#8fd65a"]]){W.push(`<rect x="${x}" y="622" width="28" height="200" rx="14" fill="#0b0e11" stroke="#38414a" stroke-width="2"/><rect id="${id}" x="${x+5}" y="817" width="18" height="0" rx="9" fill="${col}"/>`);t(x+14,846,12,l,"#8b96a1","middle")}
  W.push(`<rect x="-1200" y="-700" width="4000" height="2300" fill="url(#vg)" pointer-events="none"/>`);
  $("ckSvg").innerHTML=W.join("");
}
function ckX(o,thr,fuel,head,alarm,met){for(const k in o){const e=$("ck"+k);if(e)e.textContent=o[k]}
  const th=$("ckThr"),fu=$("ckFuel"),hz=$("ckHz"),tm=$("ckTime");
  const bar=(el,v)=>{if(!el)return;const h=190*clamp(v,0,1);el.setAttribute("height",h.toFixed(1));el.setAttribute("y",(817-h).toFixed(1))};bar(th,thr);bar(fu,fuel);
  if(hz)hz.setAttribute("transform",`translate(0 ${clamp((90-head)*2.4,-190,190).toFixed(1)})`);
  const lit=[F&&F.sas==="prograde",F&&F.auto,F&&F.T>0&&F.thr>0,alarm&&Math.floor(performance.now()/350)%2],col=["#8fd65a","#5fb8e6","#ffc400","#ff6b4a"];
  lit.forEach((on,i)=>{const r=$("ckL"+i),x=$("ckL"+i+"t");if(r){r.setAttribute("fill",on?col[i]:"#1a1e22");r.setAttribute("stroke",on?col[i]:"#3a424a")}if(x)x.setAttribute("fill",on?"#111417":"#6c7782")});
  if(tm&&met!==undefined)tm.textContent=met}
function say(text,cls=""){const li=document.createElement("li");li.textContent=text;if(cls)li.className=cls;const f=$("feed");f.appendChild(li);while(f.children.length>4)f.firstChild.remove();$("ckMsg").textContent=text.toUpperCase().slice(0,52)}
function log(cls,ph,text){M.log.push({cls,ph,text})}
function why(t){if(!M.why.includes(t))M.why.push(t)}
function hint(t){const h=$("hint");if(!t){h.hidden=true;return}if(h.textContent!==t)h.textContent=t;h.hidden=false}
let pHold=null;
function showPrompt(t,s,opts={}){$("pT").textContent=t;$("pS").textContent=s;$("gWrap").hidden=!opts.gauge;$("pK").textContent=opts.key||"";const pb=$("pBtns");pb.innerHTML="";
  (opts.buttons||[]).forEach((b,i)=>{const el=document.createElement("button");el.type="button";el.className="big"+(i?" alt":"");el.textContent=b.label;
    if(b.hold){el.addEventListener("pointerdown",e=>{e.preventDefault();act.down=true;act.pressed=true;el.classList.add("held")});["pointerup","pointercancel","pointerleave"].forEach(ev=>el.addEventListener(ev,()=>{act.down=false;el.classList.remove("held")}))}
    else el.addEventListener("click",()=>{hidePrompt();b.fn()});pb.appendChild(el)});
  $("prompt").hidden=false;const first=pb.querySelector("button");if(first&&!opts.gauge)first.focus()}
function hidePrompt(){$("prompt").hidden=true;act.down=false}
let teleAcc=0;
function tele(rows,ck){teleAcc=0;$("tele").innerHTML=rows.map(r=>`<div><span>${r[0]}</span><b class="${r[2]||""}">${r[1]}</b></div>`).join("");if(ck){$("ckAlt").textContent=ck[0];$("ckVel").textContent=ck[1];$("ckG").textContent=ck[2]}}
function fadeThen(fn){$("fade").classList.add("on");setTimeout(()=>{fn();setTimeout(()=>$("fade").classList.remove("on"),120)},520)}
