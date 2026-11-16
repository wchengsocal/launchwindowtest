"use strict";
/* ================= report ================= */
function report(){
  hidePrompt();rumble(0);shake=0;hint("");$("ctrl").hidden=true;mapOn&&toggleMap();
  const d=DEST[M.dest],sc=M.sc,inst=sc.inst,failed=!!M.fail;
  let orbitS=0,surfS=0;inst.forEach(k=>{const i=INST[k],v=i.sci*((i.bonus&&i.bonus[M.dest])||1);if(i.at==="surface")surfS+=v;else orbitS+=v});
  if(M.type==="lander")surfS+=LANDER.sci;
  const orbitPart=orbitS*(M.flyby?.3:1),surfPart=M.landed?surfS*M.landed:0;
  const pr=M.pr||1,dr=M.dr||1,orb=M.flyby?1:ORBITS[M.orbitK].sci,lf=M.flyby?1:LIFE[M.life].mult,base=failed?0:Math.round((orbitPart+surfPart)*d.mult*M.keep*pr*(.4+.6*dr)*orb*lf);
  const objMet=M.reqOK&&!failed&&!M.flyby&&M.keep>=.5,objB=objMet?20:0;
  const G=[["lead",!M.sandbox&&BUDGET-M.cost>=50],["launch",!!M.orbitOK&&M.maxQ<40000],["sc",M.pr0>=1.2&&M.dr0>=.8&&M.captured!==false&&!M.flyby&&!failed],["sci",objMet]],teamB=G.filter(g=>g[1]).length*10+(G.every(g=>g[1])?15:0);
  const bonus=failed?0:Math.round(M.bonus),eff=(!failed&&!M.sandbox&&base>0)?Math.round(Math.max(0,BUDGET-M.cost)/10):0,total=base+bonus+eff+objB+teamB;
  const tb=failed?0:Math.min(sc.gen,sc.down)*365*M.life/1000*(M.flyby?.01:1);
  let best=0;try{best=+localStorage.getItem("lw-best")||0;if(total>best)localStorage.setItem("lw-best",total)}catch(e){}
  $("rKick").textContent=`Mission report · ${S.campaign?"Campaign":"Sandbox"} · ${nm(d)} · ${S.preset?PRESETS[S.preset].name:"custom rocket"} · ${{easy:"Easy",normal:"Normal",hard:"Hard"}[S.diff]||"Normal"}`;
  $("rScore").textContent=total+" pts";
  $("rRating").textContent=(failed?"Mission lost. Rework the design and try again.":total>=200?"Amazing!":total>=110?"Great job!":total>0?"Good effort.":"No science returned.");$("rBest").textContent=total>best&&best?`New personal best. Previous best: ${best} pts.`:best?`Personal best: ${best} pts.`:"";
  const row=(a,b)=>`<li><span>${a}</span><b>${b}</b></li>`;
  $("rBreak").innerHTML=failed?row("Science","0"):[row("Orbital instruments",Math.round(orbitPart)+" pts"+(M.flyby?" (flyby: 30%)":"")),row("Surface science",M.type==="lander"?Math.round(surfPart)+" pts":"no lander"),row(`× ${nm(d)} multiplier`,"×"+d.mult),row("× Spacecraft health",Math.round(M.keep*100)+"%"),row("× Power available",Math.round(pr*100)+"%"),row("× Data sent home",Math.round(dr*100)+"% (counts 60%)"),row("× Science orbit",M.flyby?"flyby":ORBITS[M.orbitK].name+" ×"+orb),row("× Mission length",M.life+(M.life>1?" years":" year")+" ×"+lf),row("= Science",base+" pts"),row("Objective: "+OBJ[M.obj].name,objMet?"met, +20":"not met"),row(M.team.n>1?"Team goals":"Mission goals","+"+teamB+(G.every(g=>g[1])?" (all met, includes +15)":"")),row("Data returned",tb>=1?tb.toFixed(1)+" Tb":Math.round(tb*1000)+" Gb"),row("Piloting and decisions","+"+bonus),row("Budget left over","+"+eff+(M.sandbox?" (sandbox)":"")),row("Total",total+" pts")].join("");
  $("rTeamH").textContent=M.team.n>1?"Team goals":"Mission goals";
  $("rTeam").innerHTML=G.map(([id,ok],i)=>{const r=ROLES[i];return `<li class="${ok?"ok":"warn"}"><b>${r.name}${M.team.n>1?" · "+esc(M.team.names[ASSIGN[M.team.n][i]]):""}</b>${ok?"Met":"Missed"}: ${r.goal}</li>`}).join("");
  if(!objMet){const miss=M.reqList.filter(r=>!r[1]).map(r=>r[0].split(":")[0].toLowerCase());M.why.unshift(miss.length?`The objective missed these requirements at design time: ${miss.join(", ")}. Check them on the Mission tab before launch.`:"The design met every requirement, but the mission didn't survive in good enough shape to complete the objective.")}
  $("rLog").innerHTML=M.log.map(l=>`<li class="${l.cls}"><b>${l.ph}</b>${l.text}</li>`).join("");
  const W=M.why.slice();W.push(`Your rocket had ${M.design.rs.dv.toFixed(2)} km/s of Δv against ${M.design.need.toFixed(2)} needed to reach orbit and leave for ${nm(d)}. Δv comes from the rocket equation: engine efficiency (Isp) times how much of the rocket is propellant.`);
  if(!failed&&!M.flyby)W.push("NASA's Deep Space Network talks to your spacecraft from three sites about 120° apart: Goldstone in California, Madrid and Canberra. As Earth turns, one of them always faces the spacecraft.");
  if(S.sc.rtg)W.push("The RTG turns heat from decaying plutonium into electricity. It works in darkness, dust and deep space, but costs far more than solar panels.");
  $("rWhy").innerHTML=W.map(t=>`<li>${t}</li>`).join("");
  setPhase("report");$("report").hidden=false;$("report").scrollTop=0;$("again").focus({preventScroll:true});
}
function resetToPad(){
  inSpace=false;landing=false;paused=false;if(userPause)togglePause();debris.forEach(d=>scene.remove(d.obj));debris=[];flame.clear();smoke.clear();padSmoke=false;
  surfG.visible=false;scene.background=null;padG.visible=true;sky.visible=true;starsFg.visible=true;skyU.space.value=0;scene.fog=new THREE.Fog(0xd4e3f1,900,14000);
  sun.target.position.set(0,0,0);shadowBox(130,1400);engineLight.intensity=0;applyTheme();sun.position.copy(SUNOFF);
  camera.near=.5;camera.far=60000;if(destG)destG.visible=false;if(giant)giant.visible=false;bgSun.intensity=1.6;fxT={dust:0,sun:null};
  if(M&&M.rover)scene.remove(M.rover);if(M&&M.heli)scene.remove(M.heli);if(probe&&probe.userData.lander)scene.remove(probe.userData.lander);
  probe=null;C=null;L=null;F=null;deploy=0;rocketVel.set(0,0,0);shake=0;$("ctrl").hidden=true;hint("");mapOn&&toggleMap();
  RV=null;RVOUT=null;setPhase("hangar");buildRocket();rk.visible=true;cam.theta=.9;cam.phi=1.36;cam.distMul=1;setCam("chase");
  $("report").hidden=true;$("feed").innerHTML="";$("panel").hidden=false;$("tele").hidden=true;hallMode(true);renderPanel();focusForTab();
}
$("again").addEventListener("click",()=>{resetToPad();startMission()});
$("redesign").addEventListener("click",resetToPad);
