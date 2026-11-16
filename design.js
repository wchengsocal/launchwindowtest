"use strict";
/* ================= builder panel ================= */
function opt(name,val,title,sub,type,checked,dis){const id=`o-${name}-${val}`;return `<label class="opt${dis?" off":""}" for="${id}"><input id="${id}" type="${type}" name="${name}" value="${val}" ${checked?"checked":""} ${dis?"disabled":""}><b>${title}</b><small>${sub}</small></label>`}
function renderPanel(){
  const D=design(),d=DEST[S.dest],act=document.activeElement&&document.activeElement.id;let h="";
  document.querySelectorAll(".tab").forEach(t=>{t.setAttribute("aria-selected",String(t.dataset.tab===S.tab));const base={mission:"Mission",rocket:"Rocket",sc:"Spacecraft",set:"Settings"}[t.dataset.tab],ow={mission:"lead",rocket:"launch",sc:"sc"}[t.dataset.tab];t.title=base+(S.team.n>1&&ow?" · "+who(ow):"");t.querySelector("span").textContent=base});
  if(S.tab==="mission"){
    h+=`<div class="pane">${teamHTML()}<h2>Destination</h2>`+(S.campaign?`<p class="note">Campaign mode: this mission goes to Mars. Choose sandbox mode from the main menu to fly anywhere.</p>`:"")+Object.entries(DEST).map(([k,v])=>opt("dest",k,v.name,`${transit(v.days)} · leave Earth orbit ${v.dep.toFixed(2)} km/s, brake ${v.cap.toFixed(2)} km/s · gravity ${v.g} m/s² · sunlight ${v.flux.toLocaleString()} W/m² · ×${v.mult} science`,"radio",S.dest===k,S.campaign&&k!=="mars")).join("");
    h+=`<h2>Objective</h2>`+Object.entries(OBJ).filter(([k,o])=>o.dest.includes(S.dest)).map(([k,o])=>opt("obj",k,o.name,o.sub,"radio",S.obj===k)).join("");
    h+=`<h2>Requirements</h2><ul class="req">`+reqs(D.sc).map(([t,ok])=>`<li class="${ok?"ok":"no"}">${ok?"Met":"Not met"}: ${t}</li>`).join("")+`</ul>`;
    h+=`<h2>Mission type</h2>`+opt("type","flyby","Flyby","Fly past once. Cheap, but only about 30% of the science.","radio",S.type==="flyby")+opt("type","orbiter","Orbiter","Brake into orbit and study it for a year.","radio",S.type==="orbiter")+opt("type","lander","Orbiter + lander",`Adds a lander ($${LANDER.cost}M, about ${scDesign().lander||Math.round(LANDER.dry*Math.exp(d.land*1000/(320*G0))+(d.atm?300:0))} kg here). You fly the landing.`,"radio",S.type==="lander");
    h+=`<h2>Science orbit</h2>`+Object.entries(ORBITS).map(([k,o])=>opt("orbit",k,o.name,o.sub,"radio",S.orbit===k,S.type==="flyby")).join("");
    h+=`<h2>Mission length</h2>`+[1,2,4].map(y=>opt("life",y,y+(y>1?" years":" year"),LIFE[y].sub,"radio",S.life===y)).join("");
    h+=`<h2>Launch site</h2>`+Object.entries(SITE).map(([k,v])=>opt("site",k,v.name,v.sub+` · ${v.leo} km/s to orbit`,"radio",S.site===k)).join("");
    h+=`<h2>Launch time</h2>`+[["auto","Match my theme","Light theme launches by day, dark theme at night. You see it at rollout."],["day","Day",""],["sunset","Sunset",""],["night","Night","Floodlights on the pad."]].map(([k,t,s])=>opt("time",k,t,s,"radio",S.time===k)).join("");
    h+=`<h2>Difficulty</h2>`+[["easy","Easy","Autopilot flies the ascent and stages for you. Wide capture and landing windows."],["normal","Normal","You fly. Autopilot is one button away."],["hard","Hard","No autopilot. Tight windows."]].map(([k,t,s])=>opt("diff",k,t,s,"radio",S.diff===k)).join("")+`</div>`;
  }else if(S.tab==="rocket"){
    const R=S.rocket,P=rocketParts(R);
    h+=`<div class="pane"><h2>Start from a real rocket</h2><div class="presets">`+Object.entries(PRESETS).map(([k,p])=>`<button type="button" data-act="preset" data-v="${k}" aria-pressed="${S.preset===k}">${p.name}</button>`).join("")+`</div>`;
    h+=`<p>Liftoff mass ${(D.rs.mass0/1000).toLocaleString(undefined,{maximumFractionDigits:0})} t. Edit any stage below. Stage 1 fires at liftoff; press Space to drop it and light the next.</p><h2>Stages</h2>`;
    for(let i=R.stages.length-1;i>=0;i--){const s=R.stages[i],e=ENG[s.eng],st=D.rs.stages[i];
      h+=`<div class="stage"><h3>Stage ${i+1}${i===R.stages.length-1&&i>0?" (top)":i===0?" (liftoff)":""}<small>Δv ${st.dv.toFixed(2)} km/s · TWR ${st.twr.toFixed(2)} · ${Math.round(st.burn)} s burn</small></h3>
      <div class="sel"><select id="s${i}eng" data-stage="${i}" data-f="eng" aria-label="Stage ${i+1} engine">${Object.entries(ENG).map(([k,v])=>`<option value="${k}" ${k===s.eng?"selected":""}>${v.vac?`${v.name} · ${v.tvac.toLocaleString()} kN in vacuum · Isp ${v.ivac} s`:`${v.name} · ${v.tsl.toLocaleString()} kN at sea level · Isp ${v.isl}–${v.ivac} s`}</option>`).join("")}</select>
      <select id="s${i}n" data-stage="${i}" data-f="n" aria-label="Stage ${i+1} engine count">${COUNTS.map(n=>`<option value="${n}" ${n===s.n?"selected":""}>× ${n}</option>`).join("")}</select>
      <select id="s${i}t" data-stage="${i}" data-f="tank" aria-label="Stage ${i+1} propellant">${TANKS.map(t=>`<option value="${t}" ${t===s.tank?"selected":""}>${t.toLocaleString()} t</option>`).join("")}</select></div>
      <small class="note">${FUEL[e.fuel].name} · dry ${(P.st[i].dry/1000).toFixed(1)} t · $${Math.round(P.st[i].cost)}M${e.vac&&i===0?" · vacuum engine: weak at sea level":""}</small></div>`}
    h+=`<div class="row2"><button type="button" data-act="addStage" ${R.stages.length>=4?"disabled":""}>Add stage on top</button><button type="button" data-act="rmStage" ${R.stages.length<=1?"disabled":""}>Remove top stage</button></div>`;
    h+=`<h2>Side boosters</h2>`+Object.entries(BOOST).map(([k,b])=>opt("boost",k,b.name,k==="none"?"":b.kind==="solid"?`${SOLIDS[b.size].name}: ${SOLIDS[b.size].tsl.toLocaleString()} kN each, can't be throttled or shut off`:"Burn alongside the core, then drop away","radio",R.boost===k)).join("")+`</div>`;
  }else if(S.tab==="sc"){
    const c=S.sc,sc=D.sc;
    h+=`<div class="pane"><p>Dry ${sc.dry.toLocaleString()} kg${sc.lander?` + lander ${sc.lander.toLocaleString()} kg`:""} + propellant ${sc.prop.toLocaleString()} kg = <b>${sc.wet.toLocaleString()} kg</b> on top of the rocket.</p>`;
    h+=`<h2>Bus</h2>`+Object.entries(BUS).map(([k,b])=>opt("bus",k,b.name,`${b.mass} kg · ${b.slots} instrument slots · ${b.w} W · $${b.cost}M`,"radio",c.bus===k)).join("");
    h+=`<h2>Propulsion</h2>`+Object.entries(PROP).map(([k,p])=>opt("prop",k,p.name,`${p.sub} · ${p.mass} kg · $${p.cost}M`,"radio",c.prop===k)).join("");
    h+=`<h2>Propellant margin</h2>`+MARGINS.map(m=>opt("margin",m,m?`+${m*100}% extra`:"Exactly enough",`${(sc.dvNeed*(1+m)).toFixed(2)} km/s of braking capability`,"radio",c.margin===m)).join("");
    h+=`<h2>Solar arrays</h2>`+Object.entries(SOLAR).map(([k,s])=>opt("solar",k,s.name,s.kw?`${s.kw} kW at Earth → ${Math.round(s.kw*1000*d.flux/1361*.8).toLocaleString()} W at ${nm(d)} · ${s.mass} kg · $${s.cost}M`:"","radio",c.solar===k)).join("");
    h+=`<h2>Nuclear power (RTG)</h2>`+[0,1,2].map(n=>opt("rtg",n,n?`${n} × MMRTG`:"None",n?`${n*RTG.w} W anywhere, day or night · ${n*RTG.mass} kg · $${n*RTG.cost}M`:"","radio",c.rtg===n)).join("");
    h+=`<h2>Battery</h2>`+Object.entries(BAT).map(([k,b])=>opt("bat",k,b.name,b.kwh?`${b.mass} kg · $${b.cost}M · rides out eclipses and dust`:"","radio",c.bat===k)).join("");
    h+=`<h2>Antenna</h2>`+Object.entries(ANT).map(([k,a])=>opt("ant",k,a.name,`${rateTxt(Math.min(a.cap,a.mbps*Math.pow(.7/d.au,2)))} from ${nm(d)} · ${a.w} W · ${a.mass} kg · $${a.cost}M`,"radio",c.ant===k)).join("");
    h+=`<h2>Instruments <small class="note">${sc.slots} of ${sc.maxSlots} slots</small></h2>`+Object.entries(INST).map(([k,i])=>{const ok=instOK(k),on=c.inst.includes(k),full=!on&&sc.slots>=sc.maxSlots&&(i.sci||i.mass);
      const sub=ok!==true?ok:`${i.mass} kg · ${i.w} W · ${i.data?(i.data>=1000?i.data/1000+" Gb/day":i.data+" Mb/day"):"no data"} · $${i.cost}M${i.sci?` · ${i.sci} pts`:""}${i.bonus&&i.bonus[S.dest]?` · ×${i.bonus[S.dest]} at ${nm(d)}`:""}`;
      return opt("inst",k,i.name,sub,"checkbox",on&&ok===true,ok!==true||full)}).join("")+`</div>`;
  }else{
    h+=`<div class="pane"><h2>Mode</h2><p>${S.campaign?"Campaign: a mission to Mars.":"Sandbox: any destination."}</p><div class="row2"><button type="button" data-act="menu">Back to main menu</button><button type="button" data-act="tut">Show tutorial again</button></div><h2>Rules</h2><label class="sand" for="sandbox"><input type="checkbox" id="sandbox" ${S.sandbox?"checked":""}> Sandbox mode (no budget cap)</label><label class="sand" for="autostage"><input type="checkbox" id="autostage" ${S.autoStage?"checked":""}> Stage automatically when a stage runs dry</label>`;
    h+=`<h2>Controls</h2><dl class="keys"><dt>Space</dt><dd>Launch, stage, hold to burn</dd><dt>A / D</dt><dd>Tilt west / east</dd><dt>W / S</dt><dd>Throttle up / down</dd><dt>Z / X</dt><dd>Full throttle / cut</dd><dt>T</dt><dd>SAS: hold angle or follow prograde</dd><dt>P</dt><dd>Autopilot</dd><dt>M</dt><dd>Orbit map</dd><dt>. and ,</dt><dd>Time warp faster / slower</dd><dt>V</dt><dd>Camera</dd><dt>Esc</dt><dd>Pause</dd></dl>`;
    h+=`<h2>About</h2><p>Launch Window was built by William Cheng at Torrey Pines High School for the 2026 NASA Space Apps Challenge (Space Mission Design Game). Planet data comes from NASA's NSSDCA fact sheets; communications figures come from JPL and the Deep Space Network; RTG figures come from NASA's MMRTG fact sheet. Released under the Apache 2.0 license. Uses three.js (MIT license) and the Share Tech Mono font (SIL Open Font License).</p><h2>Share a design</h2><p>Copy this code to send your design to a teammate. Paste a code and press Load to use theirs.</p><textarea id="code" aria-label="Design code">${btoa(JSON.stringify({d:S.dest,t:S.type,s:S.site,r:S.rocket,c:S.sc,o:S.obj,b:S.orbit,l:S.life,m:S.team}))}</textarea><div class="row2"><button type="button" data-act="copy">Copy code</button><button type="button" data-act="load">Load code</button></div><p id="codeMsg"></p></div>`;
  }
  const pn=$("panes"),st=pn.scrollTop;pn.innerHTML=h;pn.scrollTop=st;
  renderSum(D);
  if(act&&$(act))$(act).focus({preventScroll:true});
  if(phase==="hangar")refreshPreview();
}
function teamHTML(){const n=S.team.n;let h=`<h2>Team</h2><p>Up to four players share this screen. Each player owns part of the mission and has a goal. Meet every goal for a team bonus.</p><div class="presets">`+[1,2,3,4].map(k=>`<button type="button" data-act="team" data-v="${k}" aria-pressed="${n===k}">${k===1?"Solo":k+" players"}</button>`).join("")+`</div>`;
  for(let i=0;i<n;i++){const roles=ROLES.filter((r,ri)=>ASSIGN[n][ri]===i);h+=`<div class="stage"><label class="nm" for="pn${i}">Player ${i+1}<input id="pn${i}" data-name="${i}" value="${esc(S.team.names[i])}" maxlength="16"></label>${roles.map(r=>`<small class="note"><b>${r.name}</b> owns ${r.owns}. Goal: ${r.goal}</small>`).join("")}</div>`}
  return h}
function renderSum(D){
  D=D||design();const sc=D.sc,iss=[];
  const rOK=D.rs.dv>=D.need,sOK=true,over=D.cost>BUDGET&&!S.sandbox,pr=sc.wGen/sc.wNeed,dr=sc.gen?sc.down/sc.gen:1;
  if(!rOK)iss.push(`Rocket is ${(D.need-D.rs.dv).toFixed(2)} km/s short. The spacecraft will have to make up the rest from its own tank.`);
  if(D.rs.twr0<1)iss.push(`Liftoff thrust-to-weight is ${D.rs.twr0.toFixed(2)}. Below 1.0 the rocket can't leave the pad.`);
  if(pr<1)iss.push(`Power: ${sc.wGen.toLocaleString()} W at ${D.d.name}, but the spacecraft needs ${sc.wNeed} W.`);
  if(dr<.7&&sc.gen)iss.push(`The antenna can only send ${Math.round(dr*100)}% of the data home.`);
  const rq=reqs(sc),rm=rq.filter(r=>r[1]).length;if(rm<rq.length)iss.push(`Objective at risk: ${rq.length-rm} requirement${rq.length-rm>1?"s":""} not met. See the Mission tab.`);
  if(over)iss.push(`Over budget by $${(D.cost-BUDGET).toLocaleString()}M.`);
  if(!iss.length)iss.push("Design checks out. Next: the integration review.");
  $("sum").innerHTML=`
  <div class="meter"><div class="row"><span>Rocket Δv</span><span>${D.rs.dv.toFixed(2)} / ${D.need.toFixed(2)} km/s</span></div><div class="bar"><i class="${rOK?"":"over"}" style="width:${Math.min(100,D.rs.dv/D.need*100)}%"></i></div></div>
  <div class="meter"><div class="row"><span>Liftoff thrust-to-weight</span><span>${D.rs.twr0.toFixed(2)} / 1.20</span></div><div class="bar"><i class="${D.rs.twr0<1?"over":""}" style="width:${Math.min(100,D.rs.twr0/1.2*100)}%"></i></div></div>
  <div class="meter"><div class="row"><span>Power at ${D.d.name}</span><span>${sc.wGen.toLocaleString()} / ${sc.wNeed} W</span></div><div class="bar"><i class="${pr<1?"over":""}" style="width:${Math.min(100,pr*100)}%"></i></div></div>
  <div class="meter"><div class="row"><span>Data sent home</span><span>${nf(Math.min(sc.down,sc.gen))} / ${nf(sc.gen)} Gb/day</span></div><div class="bar"><i class="${dr<.7?"over":""}" style="width:${Math.min(100,dr*100)}%"></i></div></div>
  <div class="meter"><div class="row"><span>Requirements</span><span>${rm} of ${rq.length} met</span></div><div class="bar"><i class="${rm<rq.length?"over":""}" style="width:${rm/rq.length*100}%"></i></div></div>
  <div class="meter"><div class="row"><span>Cost</span><span>$${Math.round(D.cost).toLocaleString()}M / $${BUDGET}M</span></div><div class="bar"><i class="${over?"over":""}" style="width:${Math.min(100,D.cost/BUDGET*100)}%"></i></div></div>
  <ul id="issues">${iss.map(t=>`<li class="${t.startsWith("Design")?"ok":""}">${t}</li>`).join("")}</ul>
  <button id="go" class="big" type="button" ${over?"disabled":""}>${over?"Over budget":"Review the vehicle"}</button>`;
  $("go").onclick=enterReview;
}
const BUDGET=900;
document.querySelector(".tabs").addEventListener("click",e=>{const t=e.target.closest(".tab");if(!t)return;S.tab=t.dataset.tab;renderPanel();$("panes").scrollTop=0;focusForTab()});
$("panel").addEventListener("change",e=>{
  const t=e.target,v=t.value;
  if(t.dataset.name!==undefined){S.team.names[+t.dataset.name]=v.trim().slice(0,16)||("Player "+(+t.dataset.name+1));return renderPanel()}
  if(t.name==="life"){S.life=+v;return renderPanel()}
  if(t.id==="sandbox"){S.sandbox=t.checked;if(t.checked)S.campaign=false;return renderPanel()}
  if(t.id==="autostage"){S.autoStage=t.checked;return}
  if(t.dataset.stage!==undefined){const s=S.rocket.stages[+t.dataset.stage];s[t.dataset.f]=t.dataset.f==="eng"?v:+v;S.preset="";renderPanel();buildRocket();return}
  if(t.name==="inst"){const a=S.sc.inst;t.checked?a.includes(v)||a.push(v):a.splice(a.indexOf(v),1);return renderPanel()}
  if(["bus","prop","solar","bat","ant"].includes(t.name)){S.sc[t.name]=v;return renderPanel()}
  if(t.name==="rtg"||t.name==="margin"){S.sc[t.name]=+v;return renderPanel()}
  if(t.name==="boost"){S.rocket.boost=v;S.preset="";renderPanel();return buildRocket()}
  if(["dest","type","site","time","diff","obj","orbit"].includes(t.name)){S[t.name]=v;if(t.name==="dest")fixObj();if(t.name==="time")applyTheme();renderPanel()}
});
$("panel").addEventListener("click",e=>{
  const b=e.target.closest("[data-act]");if(!b)return;const a=b.dataset.act;
  if(a==="team"){S.team.n=+b.dataset.v;return renderPanel()}
  if(a==="menu"){return startIntro()}
  if(a==="tut"){TUT.done={};return startTut("design",true)}
  if(a==="preset"){S.preset=b.dataset.v;S.rocket=clone(PRESETS[S.preset]);renderPanel();buildRocket()}
  if(a==="addStage"){S.rocket.stages.push({eng:"rl10",n:1,tank:25});S.preset="";renderPanel();buildRocket()}
  if(a==="rmStage"){S.rocket.stages.pop();S.preset="";renderPanel();buildRocket()}
  if(a==="copy"){const ta=$("code");try{navigator.clipboard.writeText(ta.value).then(()=>$("codeMsg").textContent="Copied.",()=>{ta.select();$("codeMsg").textContent="Selected. Press Ctrl+C or ⌘C to copy."})}catch(err){ta.select()}}
  if(a==="load"){try{const o=JSON.parse(atob($("code").value.trim()));if(!DEST[o.d]||!o.r||!o.c)throw 0;S.dest=S.campaign?"mars":o.d;fixObj();S.type=o.t;S.site=o.s;S.rocket=o.r;S.sc=o.c;S.preset="";if(o.b&&ORBITS[o.b])S.orbit=o.b;if(LIFE[o.l])S.life=o.l;if(o.o&&OBJ[o.o]&&OBJ[o.o].dest.includes(S.dest))S.obj=o.o;if(o.m&&o.m.names)S.team=o.m;renderPanel();buildRocket();$("codeMsg").textContent="Design loaded."}catch(err){$("codeMsg").textContent="That code didn't work. Check it was copied whole."}}
});
