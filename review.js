"use strict";
/* ================= integration review (assembly hall) ================= */
let RV=null,RVOUT=null;
const hall=new THREE.Group();hall.visible=false;scene.add(hall);
(function buildHall(){
  const cv=(w,h,f)=>{const c=document.createElement("canvas");c.width=w;c.height=h;f(c.getContext("2d"),w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;return t};
  const W=320,HT=230;
  const ft=cv(512,512,(g,w,h)=>{g.fillStyle="#5d636b";g.fillRect(0,0,w,h);for(let i=0;i<400;i++){g.fillStyle=`rgba(0,0,0,${Math.random()*.05})`;g.fillRect(Math.random()*w,Math.random()*h,8+Math.random()*30,2+Math.random()*6)}
    g.strokeStyle="rgba(0,0,0,.25)";g.lineWidth=2;for(let i=0;i<=w;i+=128){g.beginPath();g.moveTo(i,0);g.lineTo(i,h);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(w,i);g.stroke()}});
  ft.wrapS=ft.wrapT=THREE.RepeatWrapping;ft.repeat.set(10,10);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(W,W),std(0xffffff,.8,.08,{map:ft}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;hall.add(floor);
  const stripe=cv(256,32,(g,w,h)=>{for(let x=-32;x<w;x+=32){g.fillStyle="#d8b02a";g.beginPath();g.moveTo(x,0);g.lineTo(x+16,0);g.lineTo(x+32,h);g.lineTo(x+16,h);g.fill();g.fillStyle="#1d1f22";g.beginPath();g.moveTo(x+16,0);g.lineTo(x+32,0);g.lineTo(x+48,h);g.lineTo(x+32,h);g.fill()}});stripe.wrapS=THREE.RepeatWrapping;
  const ring=new THREE.Mesh(new THREE.RingGeometry(23,25,64),new THREE.MeshBasicMaterial({color:0xd8b02a}));ring.rotation.x=-Math.PI/2;ring.position.y=.05;hall.add(ring);
  const wt=cv(1024,512,(g,w,h)=>{g.fillStyle="#9aa1a8";g.fillRect(0,0,w,h);for(let x=0;x<w;x+=16){g.fillStyle=x%32?"rgba(0,0,0,.06)":"rgba(255,255,255,.05)";g.fillRect(x,0,8,h)}
    g.fillStyle="#6e757c";for(let y=0;y<h;y+=128)g.fillRect(0,y,w,10);g.fillStyle="#3c4249";for(let x=0;x<w;x+=256)g.fillRect(x,0,14,h)});
  wt.wrapS=wt.wrapT=THREE.RepeatWrapping;wt.repeat.set(3,1.5);
  const room=new THREE.Mesh(new THREE.BoxGeometry(W,HT,W),[0,1,2,3,4,5].map(i=>i===3?std(0x2a2e33,.95,0,{side:THREE.BackSide}):i===2?std(0x3a4047,.9,.1,{side:THREE.BackSide}):std(0xffffff,.9,.05,{map:wt,side:THREE.BackSide})));room.position.y=HT/2-.6;hall.add(room);
  const door=cv(512,1024,(g,w,h)=>{g.fillStyle="#7d858d";g.fillRect(0,0,w,h);for(let x=0;x<w;x+=64){g.fillStyle="rgba(0,0,0,.18)";g.fillRect(x,0,3,h)}for(let y=0;y<h;y+=96){g.fillStyle="rgba(255,255,255,.08)";g.fillRect(0,y,w,6)}g.fillStyle="#1d1f22";g.fillRect(w/2-3,0,6,h)});
  const dm=new THREE.Mesh(new THREE.PlaneGeometry(110,200),std(0xffffff,.7,.3,{map:door}));dm.position.set(0,100,-W/2+.6);hall.add(dm);
  const sm=std(0xffffff,.6,.1,{map:stripe});for(const [x,y,w,h,r] of [[-57,100,5,200,1],[57,100,5,200,1],[0,202,119,5,0]]){const t=stripe.clone();t.needsUpdate=true;t.repeat.set(r?1:16,r?24:1);const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),std(0xffffff,.6,.1,{map:t}));m.position.set(x,y,-W/2+.8);hall.add(m)}
  const sign=cv(1024,256,(g,w,h)=>{g.fillStyle="#1e3f52";g.fillRect(0,0,w,h);g.fillStyle="#f2f4f6";g.font="bold 92px Arial,Helvetica,sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText("ASSEMBLY HALL",w/2,h*.4);g.font="44px Arial,Helvetica,sans-serif";g.fillStyle="#c9d6e3";g.fillText("LAUNCH WINDOW · BAY 1",w/2,h*.78)});
  const sg=new THREE.Mesh(new THREE.PlaneGeometry(100,25),std(0xffffff,.8,0,{map:sign}));sg.position.set(-W/2+.7,150,-20);sg.rotation.y=Math.PI/2;hall.add(sg);
  const lm=new THREE.MeshBasicMaterial({color:0xfff6e4});for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++){const l=new THREE.Mesh(new THREE.BoxGeometry(18,.6,4),lm);l.position.set(i*55,HT-1,j*55);hall.add(l)}
  // steel truss towers with catwalks on both sides of the bay
  const steel=std(0x5e6670,.6,.55),yel=std(0xd8b02a,.55,.25),grate=std(0x474d55,.8,.4),box=new THREE.BoxGeometry(1,1,1);
  const parts=[];const P=(x,y,z,sx,sy,sz,ry=0)=>parts.push([x,y,z,sx,sy,sz,ry]);
  for(const sx of [-1,1]){const cx=sx*34,cz=-24;
    for(const [dx,dz] of [[-3,-3],[3,-3],[3,3],[-3,3]])P(cx+dx,95,cz+dz,.7,190,.7);
    for(let y=8;y<190;y+=12){P(cx,y,cz-3,6.7,.45,.45);P(cx,y,cz+3,6.7,.45,.45);P(cx-3,y,cz,.45,.45,6.7);P(cx+3,y,cz,.45,.45,6.7)}
    for(let y=30;y<180;y+=36){const len=16,ax=cx-sx*(3+len/2);P(ax,y,cz,len,.35,4.5);P(ax,y+1.4,cz-2.2,len,.12,.12);P(ax,y+1.4,cz+2.2,len,.12,.12)}}
  const im=new THREE.InstancedMesh(box,steel,parts.length),dum=new THREE.Object3D();
  parts.forEach((p,i)=>{dum.position.set(p[0],p[1],p[2]);dum.scale.set(p[3],p[4],p[5]);dum.rotation.set(0,p[6],0);dum.updateMatrix();im.setMatrixAt(i,dum.matrix)});im.castShadow=true;hall.add(im);
  for(const sx of [-1,1])for(let y=30;y<180;y+=36){const m=new THREE.Mesh(box,yel);m.scale.set(16,.25,.25);m.position.set(sx*34-sx*11,y+1.45,-24+2.25);hall.add(m)}
  // overhead crane
  const cr=new THREE.Mesh(box,yel);cr.scale.set(W-6,5,6);cr.position.set(0,HT-14,-30);hall.add(cr);
  const tr=new THREE.Mesh(box,steel);tr.scale.set(10,6,10);tr.position.set(-20,HT-18,-30);hall.add(tr);
  const cab=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,40,6),steel);cab.position.set(-20,HT-41,-30);hall.add(cab);
  const hook=new THREE.Mesh(box,yel);hook.scale.set(4,2,4);hook.position.set(-20,HT-62,-30);hall.add(hook);
  // stand for the spacecraft, crates and a parts rack
  const ped=new THREE.Mesh(new THREE.CylinderGeometry(5,5.5,3,32),std(0x3d434a,.6,.4));ped.position.set(34,1.5,24);ped.receiveShadow=true;hall.add(ped);
  const pr=new THREE.Mesh(new THREE.RingGeometry(4.3,5,48),new THREE.MeshBasicMaterial({color:0xd8b02a}));pr.rotation.x=-Math.PI/2;pr.position.set(34,3.02,24);hall.add(pr);
  const crate=std(0x8a6a3d,.85,0),crateB=std(0x2f5d6e,.7,.2);
  for(const [x,z,w,h,d,m] of [[-70,60,8,6,8,crate],[-62,60,6,5,6,crate],[-70,60,6,5,6,crate],[95,-60,10,8,10,crateB],[95,-46,10,8,10,crateB],[95,-53,10,8,10,crateB],[-110,-90,14,10,8,crateB]]){const c=new THREE.Mesh(box,m);c.scale.set(w,h,d);c.position.set(x,h/2+(m===crate&&w===6&&x===-70?6:0),z);c.castShadow=true;hall.add(c)}
  for(let i=0;i<3;i++){const rack=new THREE.Mesh(box,steel);rack.scale.set(30,.6,6);rack.position.set(120,6+i*7,40);hall.add(rack)}
  for(const z of [37.5,42.5])for(const x of [106,134]){const post=new THREE.Mesh(box,steel);post.scale.set(.6,22,.6);post.position.set(x,11,z);hall.add(post)}
  for(let i=0;i<5;i++){const tank=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.4,5,16),std(0xdedad2,.5,.1));tank.rotation.z=Math.PI/2;tank.position.set(112+i*4.5,8.8,40);hall.add(tank)}
})();
hall.position.y=9;
function hallMode(on){
  hall.visible=on;padG.visible=!on;sky.visible=!on;starsFg.visible=!on;
  if(on){scene.background=new THREE.Color(0x2a2e33);scene.fog=null;hemi.color.set(0xdfe7f2);hemi.groundColor.set(0x3e4146);hemi.intensity=.62;sun.color.set(0xfff1dc);sun.intensity=1.35;sun.position.set(90,300,140);sun.target.position.set(0,0,0);shadowBox(130,1400)}
  else{scene.background=null;scene.fog=new THREE.Fog(0xd4e3f1,900,14000);applyTheme();sun.position.copy(SUNOFF)}}
function rvItems(){
  const D=design(),d=DEST[S.dest],c=S.sc,sc=D.sc,bus=BUS[c.bus],sol=SOLAR[c.solar],bat=BAT[c.bat],ant=ANT[c.ant],pr=PROP[c.prop];
  const inst=sc.inst.map(k=>INST[k]),instM=inst.reduce((a,i)=>a+i.mass,0),instC=inst.reduce((a,i)=>a+i.cost,0);
  const mass=[["Bus and structure",bus.mass],["Power",sol.mass+c.rtg*RTG.mass+bat.mass],["Communications",ant.mass],["Propulsion hardware",pr.mass],["Instruments",instM],["Lander",sc.lander],["Propellant",sc.prop]].filter(x=>x[1]>0);
  const loads=[["Bus systems",bus.w],["Antenna",ant.w]].concat(inst.filter(i=>i.w>0).map(i=>[i.name,i.w]));
  const gens=[[`Solar arrays at ${d.name}`,Math.round(sol.kw*1000*d.flux/1361*.8)],["RTGs",c.rtg*RTG.w]].filter(x=>x[1]>0);
  const data=inst.filter(i=>i.data>0).map(i=>[i.name,i.data/1000]).concat(S.type==="lander"?[["Lander",LANDER.data/1000]]:[]);
  const P=rocketParts(S.rocket),cost=[["Launch vehicle",D.rs.cost],["Bus",bus.cost],["Power",sol.cost+c.rtg*RTG.cost+bat.cost],["Communications",ant.cost],["Propulsion",pr.cost],["Instruments",instC],["Lander",S.type==="lander"?LANDER.cost:0],["Operations",25*S.life]].filter(x=>x[1]>0);
  return{D,d,sc,mass,loads,gens,data,cost,P}}
function rvChecks(I){
  const {D,d,sc}=I,c=S.sc,out=[],m=D.rs.dv-D.need,pr=sc.wGen/sc.wNeed,dr=sc.gen?Math.min(1,sc.down/sc.gen):1,rq=reqs(sc),met=rq.filter(r=>r[1]).length,res=BUDGET-D.cost;
  const add=(id,area,role,st,why)=>out.push({id,area,role,st,why});
  add("lv","Launch vehicle","launch",m<0||D.rs.twr0<1?"nogo":m<.3||D.rs.twr0<1.15?"caution":"go",D.rs.twr0<1?`Thrust-to-weight ${D.rs.twr0.toFixed(2)}: it can't lift off.`:m<0?`${(-m).toFixed(2)} km/s short. The spacecraft would burn its own braking propellant.`:`${m.toFixed(2)} km/s of Δv margin, thrust-to-weight ${D.rs.twr0.toFixed(2)}.`);
  add("prop","Spacecraft propulsion","sc",c.margin===0?"caution":"go",c.margin===0?"No propellant margin. Any course correction eats into the braking burn.":`${Math.round(c.margin*100)}% extra propellant: ${sc.dvCap.toFixed(2)} km/s for ${sc.dvNeed.toFixed(2)} km/s needed.`);
  const night=(S.dest==="moon"||S.dest==="mars")&&c.solar!=="none"&&!c.rtg&&(c.bat==="none"||c.bat==="s");
  add("pwr","Power","sc",pr<1?"nogo":pr<1.2||night?"caution":"go",pr<1?`${sc.wGen.toLocaleString()} W for ${sc.wNeed} W of loads.`:night?`${Math.round((pr-1)*100)}% margin, but a small battery for ${S.dest==="moon"?"two-week lunar nights":"Martian dust storms"}.`:`${Math.round((pr-1)*100)}% power margin at ${d.name}.`);
  add("com","Communications","sc",dr<.7?"nogo":dr<.95?"caution":"go",`${Math.round(dr*100)}% of science data reaches Earth (${nf(Math.min(sc.down,sc.gen))} of ${nf(sc.gen)} Gb/day).`);
  const inst=c.inst;let env="go",ew="No special hazards for this destination.";
  if(S.dest==="europa"&&!inst.includes("vault")){env="nogo";ew="Jupiter's radiation will fry unshielded electronics. Add a radiation vault."}
  else if(S.dest==="mercury"&&!inst.includes("shade")){env="nogo";ew="Sunlight 6.7× Earth's. Add a sunshade."}
  else if(S.dest==="venus"&&!inst.includes("shade")){env="caution";ew="Sunlight nearly 2× Earth's. A sunshade would help."}
  else if(S.dest==="titan"&&!c.rtg){env="nogo";ew="Sunlight at Saturn is 1% of Earth's. Solar power won't work."}
  else if(S.dest==="europa")ew="Radiation vault installed.";
  add("env","Environment","sci",env,ew);
  add("sci","Science objective","sci",met<rq.length?"nogo":"go",met<rq.length?`${rq.length-met} of ${rq.length} requirements not met. Check the Mission tab.`:`All ${rq.length} requirements for "${OBJ[S.obj].name}" met.`);
  add("bud","Budget","lead",S.sandbox?"go":res<0?"nogo":res<50?"caution":"go",S.sandbox?"Sandbox mode: no budget cap.":`$${Math.round(res)}M reserve of $${BUDGET}M.`);
  return out}
function rvKey(){return JSON.stringify([S.dest,S.type,S.site,S.rocket,S.sc,S.obj,S.orbit,S.life,S.team.n])}
function enterReview(){
  const Dz=design();if(Dz.cost>BUDGET&&!S.sandbox)return;
  fadeThen(()=>{
    const key=rvKey();if(!RV||RV.key!==key)RV={key,signed:{},explode:1,labels:VW>760,k:0,view:"stack"};
    setPhase("review");$("panel").hidden=true;$("review").hidden=false;$("rvLabels").hidden=!RV.labels;
    hallMode(true);if(preview)preview.visible=false;
    if(RV.probe&&RV.probe.parent)RV.probe.parent.remove(RV.probe);RV.probe=makeProbe();rk.userData.slot.add(RV.probe);
    RV.base=rk.userData.stages.map(s=>s.g.position.y);RV.top=rk.userData.top.position.y;RV.bpos=rk.userData.boosters.map(b=>b.position.clone());
    rvFrame();cam.distMul=1;setCam("chase");
    renderReview()})}
function rvFrame(){if(RV.view==="sc"&&RV.probe){RV.explode=1;focusObj=RV.probe;focusOff.set(0,1.4,0);cam.dist=VW>760?15:22;cam.phi=1.2}else{focusObj=rk;focusOff.set(0,rk.userData.H*.66,0);cam.dist=rk.userData.H*(VW>760?2:2.6);cam.phi=1.36}}
function rvRestore(){
  if(!RV)return;RV.k=0;rvPose(0);if(RV.probe&&RV.probe.parent)RV.probe.parent.remove(RV.probe);RV.probe=null;
  if(preview)preview.visible=true;$("review").hidden=true;$("rvLabels").hidden=true}
function exitReview(go){
  fadeThen(()=>{rvRestore();
    if(go){hallMode(false);const cks=rvChecks(rvItems());RVOUT={clean:cks.every(c=>c.st==="go"),risks:cks.filter(c=>c.st!=="go").map(c=>`${c.area.toLowerCase()} (${c.st==="nogo"?"no-go":"caution"}): ${c.why.replace(/\.$/,"")}`)};setPhase("hangar");startMission()}
    else{setPhase("hangar");$("panel").hidden=false;renderPanel();focusForTab()}})}
function rvPose(k){
  const u=rk.userData,H=u.H,n=u.stages.length,gap=H*.13;
  u.stages.forEach((s,i)=>{s.g.position.y=RV.base[i]+k*gap*i});
  u.top.position.y=RV.top+k*gap*n;
  u.halves.forEach(h=>{h.position.x=h.userData.sign*k*u.Rf*3.4;h.rotation.z=-h.userData.sign*k*.12});
  u.slot.position.y=.3+k*(u.Rf*2.5+12);
  u.boosters.forEach((b,i)=>{b.position.copy(RV.bpos[i]).addScaledVector(b.userData.dir,k*(u.R*2.4+3))});
  if(RV.probe)RV.probe.userData.dep.forEach(p=>setDep(p,.03+.97*k))}
function tickReview(dt){if(!RV||!RV.base)return;const t=RV.explode;RV.k+=(t-RV.k)*Math.min(1,dt*2.5);if(Math.abs(t-RV.k)<.001)RV.k=t;rvPose(RV.k)}
const rvTmp=new V3();
function rvLabels(){
  const box=$("rvLabels");if(!RV.labels||!RV.base){box.hidden=true;return}box.hidden=false;
  if(RV.lab&&RV.labView!==RV.view)RV.lab=null;
  if(!RV.lab&&RV.view==="sc"&&RV.probe){RV.labView="sc";RV.lab=[];const c=S.sc,sc=scDesign(),d=DEST[S.dest],sz=c.bus==="small"?1.6:c.bus==="large"?2.8:2.2,pb=RV.probe,A=ANT[c.ant];
    RV.lab.push({obj:pb,off:new V3(sz/2,sz*.35,sz/2),t:BUS[c.bus].name,d:`${BUS[c.bus].mass} kg · ${BUS[c.bus].slots} instrument slots`});
    if(c.solar!=="none"){const L=3+SOLAR[c.solar].kw*.55;RV.lab.push({obj:pb,off:new V3(0,sz*.65,sz/2+L*.7),t:SOLAR[c.solar].name,d:`${SOLAR[c.solar].kw} kW at Earth → ${Math.round(SOLAR[c.solar].kw*1000*d.flux/1361*.8).toLocaleString()} W at ${d.name}`})}
    if(c.rtg)RV.lab.push({obj:pb,off:new V3(0,.4,-sz/2-2.8),t:`${c.rtg}× MMRTG`,d:`${c.rtg*RTG.w} W, day or night`});
    RV.lab.push({obj:pb,off:new V3(-sz/2-.3,sz*.65,0),t:A.name,d:`${rateTxt(sc.rate)} from ${nm(d)}`});
    RV.lab.push({obj:pb,off:new V3(0,-.7,0),t:PROP[c.prop].name,d:`${sc.prop.toLocaleString()} kg propellant · ${sc.dvCap.toFixed(2)} km/s`});
    if(sc.lander)RV.lab.push({obj:pb,off:new V3(1.2,sz*1.2+2,0),t:"Lander",d:`${sc.lander.toLocaleString()} kg · ${sc.inst.filter(k=>INST[k].at==="surface").map(k=>INST[k].name.toLowerCase()).join(", ")||"no surface instruments"}`});
    const oi=sc.inst.filter(k=>INST[k].at!=="surface");if(oi.length)RV.lab.push({obj:pb,off:new V3(0,sz*1.2+.3,sz/2-.4),t:"Instrument deck",d:oi.map(k=>INST[k].name).join(", ")});
    box.innerHTML=RV.lab.map(()=>"<div><span></span></div>").join("");RV.lab.forEach((l,i)=>{const el=box.children[i];el.firstChild.innerHTML=`<b>${esc(l.t)}</b>${esc(l.d)}`;l.el=el})}
  if(!RV.lab){RV.labView="stack";RV.lab=[];const u=rk.userData,P=rocketParts(S.rocket),sc=scDesign();
    u.stages.forEach((s,i)=>{const p=P.st[i];RV.lab.push({obj:s.g,off:new V3(s.r,s.len*.45,0),t:`Stage ${i+1}`,d:`${p.n}× ${p.eng.name} · ${p.tank.toLocaleString()} t ${FUEL[p.eng.fuel].name}`})});
    if(u.boosters.length&&P.b){const b=u.boosters[0];RV.lab.push({obj:b,off:new V3(0,12,0),t:"Side boosters",d:`${P.b.n}× ${P.b.kind==="solid"?SOLIDS[P.b.size].name:P.b.eng.name+" cores"}`})}
    RV.lab.push({obj:u.halves[0],off:new V3(u.Rf,1,0),t:"Payload fairing",d:"Opens above 100 km"});
    RV.lab.push({obj:u.slot,off:new V3(2,4,0),t:"Spacecraft",d:`${sc.wet.toLocaleString()} kg · ${BUS[S.sc.bus].name.toLowerCase()} · ${sc.inst.length} instruments`});
    box.innerHTML=RV.lab.map(()=>"<div><span></span></div>").join("");RV.lab.forEach((l,i)=>{const el=box.children[i];el.firstChild.innerHTML=`<b>${esc(l.t)}</b>${esc(l.d)}`;l.el=el})}
  for(const l of RV.lab){l.obj.localToWorld(rvTmp.copy(l.off));rvTmp.project(camera);const vis=rvTmp.z<1&&Math.abs(rvTmp.x)<1.05&&Math.abs(rvTmp.y)<1.05;l.el.style.display=vis?"flex":"none";
    if(vis){let x=(rvTmp.x+1)/2*VW;const w=l.el.offsetWidth,lim=VW>760?VW-Math.min(420,VW)-8:VW-8;if(x+w>lim)x=Math.max(8,lim-w);l.el.style.left=x.toFixed(0)+"px";l.el.style.top=((1-rvTmp.y)/2*VH).toFixed(0)+"px"}}}
function stackHTML(items,unit,fmtv){const tot=items.reduce((a,x)=>a+x[1],0)||1,op=[1,.8,.62,.48,.36,.26,.18,.12];
  return `<div class="stack">${items.map((x,i)=>`<i style="width:${(x[1]/tot*100).toFixed(2)}%;background:var(--accent);opacity:${op[i%op.length]}"></i>`).join("")}</div><ul class="leg">${items.map((x,i)=>`<li><span class="sw" style="background:var(--accent);opacity:${op[i%op.length]}"></span><span>${esc(x[0])}</span><span>${Math.round(x[1]/tot*100)}%</span><span>${fmtv(x[1])}${unit}</span></li>`).join("")}</ul>`}
function renderReview(){
  const I=rvItems(),{D,d,sc}=I,cks=rvChecks(I),team=S.team.n>1,P=rocketParts(S.rocket);RV.lab=null;
  $("rvSub").textContent=`${d.name} · ${{flyby:"Flyby",orbiter:"Orbiter",lander:"Orbiter + lander"}[S.type]} · ${S.preset?PRESETS[S.preset].name:"Custom rocket"} · ${OBJ[S.obj].name}`;
  let h=`<p>Every subsystem is on the stand. Check the budgets, then each owner signs off before rollout.</p><div class="rvbar"><button type="button" data-rv="explode" aria-pressed="${RV.explode===1}">Exploded view</button><button type="button" data-rv="labels" aria-pressed="${RV.labels}">Part labels</button><button type="button" data-rv="view" aria-pressed="${RV.view==="sc"}">Close-up: spacecraft</button></div>`;
  const kg=v=>Math.round(v).toLocaleString();
  h+=`<h2>Spacecraft mass <small>${kg(sc.wet)} kg wet</small></h2>`+stackHTML(I.mass," kg",kg);
  h+=`<h2>Launch stack <small>${kg(D.rs.mass0/1000)} t at liftoff</small></h2>`+stackHTML(P.st.map((s,i)=>[`Stage ${i+1}`,(s.dry+s.prop)/1000]).concat(P.b?[["Side boosters",(P.b.dry+P.b.prop)/1000]]:[]).concat([["Fairing",FAIRING/1000],["Spacecraft",sc.wet/1000]])," t",v=>v>=10?Math.round(v).toLocaleString():v.toFixed(1));
  const gen=I.gens.reduce((a,x)=>a+x[1],0),need=I.loads.reduce((a,x)=>a+x[1],0);
  h+=`<h2>Power at ${esc(d.name)} <small>${kg(gen)} W made · ${kg(need)} W used</small></h2>`+stackHTML(I.loads," W",kg)+`<div class="vs"><div class="row"><span>Generation</span><span>${I.gens.map(g=>`${esc(g[0])} ${kg(g[1])} W`).join(" + ")||"none"}</span></div><div class="row"><span>Margin</span><span>${need?Math.round((gen/need-1)*100):0}%</span></div></div>`;
  const dt=I.data.reduce((a,x)=>a+x[1],0);
  h+=`<h2>Data <small>${nf(dt)} Gb/day made · ${nf(sc.down)} Gb/day downlink</small></h2>`+(I.data.length?stackHTML(I.data," Gb/day",nf):"<p>No instruments produce data.</p>")+`<div class="vs"><div class="row"><span>${esc(ANT[S.sc.ant].name)} from ${esc(nm(d))}</span><span>${rateTxt(sc.rate)}, 8 h/day of Deep Space Network time</span></div></div>`;
  h+=`<h2>Δv budget</h2><div class="vs"><div class="row"><span>Rocket: reach orbit from ${esc(SITE[S.site].name)}</span><span>${SITE[S.site].leo.toFixed(2)} km/s</span></div><div class="row"><span>Rocket: leave Earth for ${esc(d.name)}</span><span>${d.dep.toFixed(2)} km/s</span></div><div class="row"><span>Rocket delivers</span><span>${D.rs.dv.toFixed(2)} km/s (${D.rs.dv>=D.need?"+":""}${(D.rs.dv-D.need).toFixed(2)})</span></div><div class="row"><span>Spacecraft: brake into ${esc(ORBITS[S.orbit].name.toLowerCase())} orbit</span><span>${sc.dvNeed.toFixed(2)} km/s</span></div><div class="row"><span>Spacecraft carries</span><span>${sc.dvCap.toFixed(2)} km/s</span></div></div>`;
  h+=`<h2>Cost <small>$${kg(D.cost)}M of $${BUDGET}M</small></h2>`+stackHTML(I.cost.concat(S.sandbox||D.cost>=BUDGET?[]:[["Reserve",BUDGET-D.cost]]),"M",v=>"$"+kg(v));
  const signedAll=cks.every(c=>RV.signed[c.id]);
  h+=`<h2>Flight readiness review <small>${cks.filter(c=>RV.signed[c.id]).length} of ${cks.length} signed</small></h2><ul class="frr">`+cks.map(c=>{const r=ROLES.find(x=>x.id===c.role),own=team?esc(who(c.role)):r.name;const lab=c.st==="nogo"?"Accept risk":"Sign off";
    return `<li><span class="st ${c.st}">${c.st==="go"?"GO":c.st==="caution"?"CAUTION":"NO-GO"}</span><b>${esc(c.area)}</b><button type="button" data-rv="sign" data-id="${c.id}" aria-pressed="${!!RV.signed[c.id]}">${RV.signed[c.id]?"Signed":lab}</button><small>${esc(c.why)} Owner: ${own}.</small></li>`}).join("")+`</ul>`;
  if(!team)h+=`<div class="rvbar"><button type="button" data-rv="signall">Sign off everything</button></div>`;
  $("rvPanes").innerHTML=h;
  const ng=cks.filter(c=>c.st==="nogo").length,ca=cks.filter(c=>c.st==="caution").length;
  $("rvFoot").innerHTML=`<p class="note" style="margin:0">${ng?`${ng} no-go item${ng>1?"s":""}. You can fix ${ng>1?"them":"it"} in the design or accept the risk.`:ca?`${ca} caution item${ca>1?"s":""}. Clean reviews (all go) earn 5 points.`:"Every system is go. A clean review earns 5 points."}</p><div class="row2"><button type="button" class="big alt" data-rv="back">Back to design</button><button type="button" class="big" data-rv="go" ${signedAll?"":"disabled"}>${signedAll?"Roll out to pad":"Sign-offs needed"}</button></div>`}
document.addEventListener("click",e=>{const b=e.target.closest("[data-rv]");if(!b||phase!=="review"||!RV)return;const a=b.dataset.rv;
  if(a==="explode"){RV.explode=RV.explode?0:1;b.setAttribute("aria-pressed",String(!!RV.explode));return}
  if(a==="labels"){RV.labels=!RV.labels;b.setAttribute("aria-pressed",String(RV.labels));return}
  if(a==="view"){RV.view=RV.view==="sc"?"stack":"sc";b.setAttribute("aria-pressed",String(RV.view==="sc"));rvFrame();return}
  if(a==="sign"){const id=b.dataset.id;RV.signed[id]=!RV.signed[id];renderReview();return}
  if(a==="signall"){rvChecks(rvItems()).forEach(c=>RV.signed[c.id]=true);renderReview();return}
  if(a==="back")exitReview(false);if(a==="go")exitReview(true)});
