"use strict";
/* ================= cruise + decisions ================= */
const DECISIONS=[
  {id:"flare",ok:()=>true,title:"Solar flare",text:"A burst of solar particles arrives in six hours. Your instruments are sensitive to radiation.",
    a:["Enter safe mode",()=>{log("ok","Cruise","Rode out a solar flare in safe mode.")}],
    b:["Keep observing",()=>{if(Math.random()<.3){M.keep*=.88;say("Particle hits damaged a detector.","warn");log("warn","Cruise","Kept observing through a solar flare. A detector was damaged.")}else{M.bonus+=6;say("Recorded the flare. Bonus data.","ok");log("ok","Cruise","Recorded a solar flare up close: +6 pts.")}}]},
  {id:"tcm",ok:()=>true,title:"Off course",text:"Tracking shows you'll miss the target by 9,000 km. Correcting now costs 15 m/s. Waiting a month for better tracking costs 40 m/s but might show the error is smaller.",
    a:["Correct now",()=>{M.scDv-=.015;log("ok","Cruise","Corrected course early for 15 m/s.")}],
    b:["Wait for better tracking",()=>{const c=Math.random()<.4?.005:.04;M.scDv-=c;log(c<.01?"ok":"warn","Cruise",`Waited for tracking data. The correction cost ${Math.round(c*1000)} m/s.`)}]},
  {id:"assist",ok:()=>["europa","titan","mercury","ceres"].includes(M.dest),title:"Gravity assist",text:"A flyby of Venus or Earth could bend your path. It adds about a year of cruise but saves 0.5 km/s of braking.",
    a:["Take the flyby",()=>{M.capNeed=Math.max(.2,M.capNeed-.5);M.days+=365;log("ok","Cruise","Used a gravity assist: braking need cut by 0.5 km/s, one more year of cruise.");why("Gravity assists borrow speed from a planet. Galileo, Cassini and Juno all used them to reach the outer planets.")}],
    b:["Fly direct",()=>log("ok","Cruise","Skipped the gravity assist and kept the shorter trip.")]},
  {id:"glitch",ok:()=>true,title:"Computer reset",text:"The flight computer rebooted itself twice today. Engineers can upload a patch now, or spend two weeks testing it on a copy here on Earth first.",
    a:["Test it first",()=>{M.days+=14;log("ok","Cruise","Tested the software patch on the ground before uploading it.")}],
    b:["Upload now",()=>{if(Math.random()<.25){M.keep*=.9;say("The patch had a bug. Two weeks in safe mode.","warn");log("warn","Cruise","Rushed a software patch. It had a bug and cost two weeks.")}else log("ok","Cruise","Uploaded a patch right away. It worked.")}]},
  {id:"heat",ok:()=>["venus","mercury"].includes(M.dest),title:"Running hot",text:"This close to the Sun the spacecraft is heating up. Turning the back toward the Sun cools it, but points the antenna away from Earth for a week.",
    a:["Turn away from the Sun",()=>{log("ok","Cruise","Turned away from the Sun to cool down.")}],
    b:["Keep the antenna on Earth",()=>{if(!S.sc.inst.includes("shade")){M.keep*=.9;log("warn","Cruise","Stayed pointed at Earth and overheated a little.")}else log("ok","Cruise","The sunshade kept the spacecraft cool.")}]}
];
const DIST=420000;
function tickCruise(dt){
  const d=D(),dur=12;
  at(0,"init",()=>{inSpace=true;F.warp=0;debris.forEach(x=>scene.remove(x.obj));debris=[];rk.userData.plumes.forEach(e=>{e.on=false;e.plume.visible=false});$("ctrl").hidden=true;mapOn&&toggleMap();hint("");
    S0.copy(shipKm);Pd.set(S0.x+DIST,S0.y-d.R*1.3,S0.z);destG.position.copy(Pd);destG.visible=true;
    if(giant){giant.position.copy(Pd).add(M.dest==="titan"?new V3(700000,300000,-600000):new V3(560000,240000,-520000));giant.visible=true}
    rk.rotation.z=-Math.PI/2;say(`Cruise: ${transit(M.days)} to ${nm(d)}. Time is compressed.`);
    const pool=DECISIONS.filter(x=>x.ok());M.queue=pool.sort(()=>Math.random()-.5).slice(0,2)});
  if(paused)return;
  M.cruiseT=(M.cruiseT||0)+dt;const u=clamp(M.cruiseT/dur,0,1),e=easeIO(u);
  shipKm.set(S0.x+DIST*e,S0.y,S0.z);bgSun.intensity=lerp(1.6,d.flux>=1361?1.8:clamp(.5+d.flux/1000,.45,1.6),u);
  if(autoCam&&cam.mode==="chase"){cam.theta=lerp(Math.PI/2-.5,-Math.PI/2+.7,easeIO(clamp(u*1.3,0,1)));cam.phi=1.25}
  const qi=M.cruiseT>3&&M.queue.length===2?0:M.cruiseT>7&&M.queue.length===1?0:-1;
  if(qi===0){const q=M.queue.shift();paused=true;showPrompt(q.title,q.text+(S.team.n>1?` Talk it over, then ${who("lead")} makes the call.`:""),{buttons:[{label:q.a[0],fn:()=>{q.a[1]();paused=false}},{label:q.b[0],fn:()=>{q.b[1]();paused=false}}]})}
  if(u>=1)setPhase(M.type==="flyby"?"ops":"arrival");
  $("clock").textContent="DAY "+Math.round(M.days*u);
  teleAcc+=dt;if(teleAcc>.1){const dist=Math.max(0,shipKm.distanceTo(Pd)-d.R);tele([["DISTANCE",Math.round(dist).toLocaleString()+" km"],["DAY",`${Math.round(M.days*u)} of ${M.days}`],["SPACECRAFT Δv",M.scDv.toFixed(2)+" km/s"],["BRAKING NEED",M.capNeed.toFixed(2)+" km/s",M.scDv<M.capNeed?"bad":""],["SUNLIGHT",Math.round(lerp(1361,d.flux,u)).toLocaleString()+" W/m²"]],[Math.round(dist/1000)+"k km","cruise","0.0 g"])}
}

/* ================= arrival: capture burn ================= */
let C=null;
function tickArrival(dt){
  const d=D();shipKm.x+=1.5*dt;
  at(0,"flip",()=>say("Turning around to point the engine forward for braking."));
  if(pt<2)rk.rotation.z=-Math.PI/2+Math.PI*easeIO(pt/2);else rk.rotation.z=Math.PI/2;
  at(2.2,"cap",()=>{const need=M.capNeed,scale=need*1.6,tol=need*(M.diff==="easy"?.18:M.diff==="hard"?.06:.1);
    C={need,scale,v:1,lo:1-(need+tol)/scale,hi:1-(need-tol)/scale,floor:Math.max(0,1-Math.max(0,M.scDv)/scale),burned:false,idle:0,on:true};
    $("gZone").style.left=C.lo*100+"%";$("gZone").style.width=(C.hi-C.lo)*100+"%";$("gFloor").style.width=C.floor*100+"%";$("gLabels").innerHTML="<span>Over-braked: crash</span><span>Capture</span><span>Under-braked: flyby</span>";
    showPrompt("Orbit insertion",`${S.team.n>1?who("sc")+", you're on the braking burn. ":""}Hold to fire the engine and brake by ${need.toFixed(2)} km/s. Release with the needle in the band. You carry ${Math.max(0,M.scDv).toFixed(2)} km/s; the hatched area is past your fuel.`,{gauge:true,key:"Hold the button or the Space bar.",buttons:[{label:"Hold to burn",hold:true}]})});
  if(C&&C.on){
    if(act.down&&C.v>C.floor){C.v=Math.max(C.floor,C.v-.16*dt);C.burned=true;C.idle=0;probe.userData.plumes[0].on=true;probe.userData.plumes[0].thr=1;shake=.12}
    else{probe.userData.plumes[0].on=false;shake=0;if(C.burned)C.idle+=dt}
    $("gNeedle").style.left=C.v*100+"%";if((C.burned&&C.idle>1.3)||pt>18)resolveCapture();
  }
  teleAcc+=dt;if(teleAcc>.1){const used=C?(1-C.v)*C.scale:0;tele([["BRAKED",used.toFixed(2)+" km/s"],["NEEDED",M.capNeed.toFixed(2)+" km/s"],["FUEL LEFT",Math.max(0,M.scDv-used).toFixed(2)+" km/s"],["TARGET",d.name]],[Math.round(shipKm.distanceTo(Pd)-d.R)+" km",used.toFixed(2),act.down?"0.3 g":"0.0 g"])}
}
function resolveCapture(){
  const d=D();C.on=false;hidePrompt();probe.userData.plumes[0].on=false;const used=(1-C.v)*C.scale;M.scDv-=used;
  if(C.v>=C.lo&&C.v<=C.hi){M.captured=true;const acc=1-Math.abs(used-C.need)/(C.need*.1+1e-6);if(acc>.6){M.bonus+=5;log("ok","Piloting","Precise braking burn: +5 pts.")}say(`Captured into orbit around ${nm(d)}.`,"ok");log("ok","Arrival",`Braked ${used.toFixed(2)} km/s and entered orbit around ${nm(d)}.`)}
  else if(C.v>C.hi){M.captured=false;M.flyby=true;M.keep*=.3;const fuel=C.v<=C.floor+.001;say(fuel?"Out of propellant before capture. Flyby only.":`Burn too short. The spacecraft flew past ${nm(d)}.`,"bad");
    log("bad","Arrival",fuel?"Ran out of propellant before slowing enough. Only a quick flyby.":"Didn't slow down enough to be captured. Only a quick flyby.");why(fuel?"Braking propellant comes from the spacecraft's tank. Extra mass, a short rocket, or course corrections all eat into it.":"To enter orbit you must slow down by just the right amount. Too little and gravity can't hold you.")}
  else{M.captured=true;M.overBraked=true;M.keep*=.4;say("Over-braked. The orbit dipped too low and the spacecraft clipped the atmosphere.","bad");log("bad","Arrival",`Over-braked into an orbit too low to survive. Some data came back first.${M.type==="lander"?" The lander was lost with it.":""}`);why("Over-braking drops the lowest point of the orbit until it hits the surface or the atmosphere.")}
  setTimeout(()=>{if(phase==="arrival")setPhase(M.type==="lander"&&M.captured&&!M.overBraked&&M.keep>.35?"landing":"ops")},1500);
}

/* ================= landing ================= */
let L=null;
function tickLanding(dt){
  const d=D();
  at(0,"init",()=>fadeThen(()=>{
    landing=true;inSpace=false;buildSurface(M.dest);surfG.visible=true;padG.visible=false;sky.visible=false;starsFg.visible=d.atm===0;starsFg.material.opacity=d.atm===0?.9:0;
    scene.background=new THREE.Color(SKY[M.dest]);scene.fog=d.atm?new THREE.Fog(SKY[M.dest],400,6000):null;
    sun.position.set(-300,260,200);sun.target.position.set(0,0,0);sun.intensity=clamp(.6+d.flux/1361,.5,2.2);shadowBox(60,1200);hemi.color.set(SKY[M.dest]||0x222222);hemi.groundColor.set(0x222222);hemi.intensity=.35;
    debris.forEach(x=>scene.remove(x.obj));debris=[];flame.clear();smoke.clear();rk.visible=false;
    const ld=probe.userData.lander;scene.attach(ld);ld.position.set(0,d.atm===2?1200:2500,0);ld.rotation.set(0,0,0);ld.scale.setScalar(1);
    const pl=[];addPlume(pl,ld,.3,.45,"vac","ld");ld.userData.pl=pl;
    const thick=d.atm===2,g=d.g;L={h:thick?160:2500,v:thick?-14:-d.v0,fuel:thick?0:1.6*(d.v0+g*18),fuel0:0,a:2.8*g+3,g,thick,done:false,ld};L.fuel0=L.fuel;
    focusObj=ld;focusOff.set(0,1,0);cam.dist=24;cam.phi=1.35;cam.theta=.6;eyeObj=ld;setCam(cam.mode==="astro"?"astro":"chase");camera.near=.2;camera.far=20000;
    if(!thick)showPrompt("Landing",`${S.team.n>1?who("sci")+" flies the landing. ":""}Hold to fire the descent engine. Touch down slower than ${M.diff==="easy"?5:3} m/s. Gravity here is ${d.g} m/s². Fuel is limited, so don't start too early: start when the braking distance on the left nearly equals your altitude.`,{key:"Hold the button or the Space bar.",buttons:[{label:"Hold to fire",hold:true}]});
    else say(`Parachute descent through ${nm(d)}'s thick atmosphere.`);
  }));
  if(!L||L.done)return;
  const want=L.fuel>0&&!L.thick?(L.hold!=null?L.hold:act.down?1:0):0;L.thr=(L.thr||0)+(want-(L.thr||0))*Math.min(1,dt*10);if(L.fuel<=0)L.thr=0;
  const burning=L.thr>.04;let a=-L.g;if(burning){a+=L.a*L.thr;L.fuel=Math.max(0,L.fuel-L.a*L.thr*dt)}
  if(L.thick){L.v=L.h>25?-14:-D().v0}else L.v+=a*dt;
  L.h+=L.v*dt;L.ld.position.y=Math.max(0,L.h);
  L.ld.userData.pl[0].on=burning;L.ld.userData.pl[0].thr=L.thr;emitPlumes(L.ld.userData.pl,dt,true);
  if(burning&&L.h<60){const nd=Math.round(3*L.thr*clamp((60-L.h)/40,0,1)+.4);for(let k=0;k<nd;k++){const [R,G,B]=SURF[M.dest];smoke.emit(rand(-3,3),.5,rand(-3,3),rand(-30,30),rand(1,4),rand(-30,30),rand(2,4),4,10,R/255,G/255,B/255,.5)}}
  shake=.03*L.thr;rumble(.25*L.thr);
  if(L.h<=0){L.done=true;hidePrompt();const v=Math.abs(L.v),good=M.diff==="easy"?5:3,hard=M.diff==="easy"?10:7;
    if(L.thick){M.landed=1;say("Touchdown on "+nm(D())+".","ok");log("ok","Landing",`Parachuted to the surface at ${D().v0} m/s.`)}
    else if(v<=good){M.landed=1;M.bonus+=10;say(`Touchdown at ${v.toFixed(1)} m/s. Perfect landing.`,"ok");log("ok","Landing",`Soft touchdown at ${v.toFixed(1)} m/s: +10 pts.`)}
    else if(v<=hard){M.landed=.6;say(`Hard landing at ${v.toFixed(1)} m/s. Some instruments damaged.`,"warn");log("warn","Landing",`Hard landing at ${v.toFixed(1)} m/s. Surface instruments at 60%.`)}
    else{M.landed=0;const p=L.ld.position;for(let i=0;i<200;i++){flame.emit(p.x,1,p.z,rand(-20,20),rand(0,25),rand(-20,20),rand(.5,1.2),rand(3,6),8,1,.8,.45,.8)}L.ld.visible=false;say(`Impact at ${v.toFixed(0)} m/s. Lander lost.`,"bad");log("bad","Landing",`Hit the surface at ${v.toFixed(0)} m/s. Lander lost; the orbiter keeps working.`);why("Landing means braking off almost all your speed right before touchdown. Start the burn too late and you can't stop; too early and you run out of fuel.")}
    L.ld.position.y=0;setTimeout(()=>setPhase("ops"),1800)}
  $("clock").textContent="DAY "+M.days;
  teleAcc+=dt;if(teleAcc>.1)tele([["ALTITUDE",Math.max(0,Math.round(L.h)).toLocaleString()+" m"],["BRAKING DISTANCE",L.thick?"–":Math.round(L.v<0?L.v*L.v/(2*(L.a-L.g)):0).toLocaleString()+" m",!L.thick&&L.v<0&&L.v*L.v/(2*(L.a-L.g))>L.h?"bad":""],["DESCENT",Math.abs(L.v).toFixed(1)+" m/s",Math.abs(L.v)>(M.diff==="easy"?5:3)&&L.h<200?"bad":""],["FUEL",L.thick?"parachute":Math.round(L.fuel/L.fuel0*100)+"%"],["GRAVITY",D().g+" m/s²"]],[Math.round(L.h)+" m",Math.abs(L.v).toFixed(1),(burning?L.a*L.thr/9.81:0).toFixed(1)+" g"]);
}

/* ================= operations ================= */
let EV=[],fxT={dust:0,sun:null};
function backToOrbit(){landing=false;inSpace=true;surfG.visible=false;scene.background=null;scene.fog=null;starsFg.visible=false;rk.visible=true;if(dust)dust.material.opacity=0;
  sun.position.copy(SUN_DIR).multiplyScalar(300);sun.target.position.set(0,0,0);sun.intensity=2.2;shadowBox(40,800);hemi.color.set(0x0b0f1a);hemi.groundColor.set(0x3a5a8a);hemi.intensity=.55;
  focusObj=probe;focusOff.set(0,1.3,0);eyeObj=probe.userData.eye;cam.dist=16;cam.phi=1.25;camera.near=.2;camera.far=6000;setCam(cam.mode)}
function tickOps(dt){
  if(landing&&!M.landed)at(0,"orb",()=>fadeThen(backToOrbit));
  const d=D(),sc=M.sc,surf=landing;
  if(!surf)shipKm.x+=1.5*dt;
  at(0,"init",()=>{EV=[];const roll=p=>Math.random()<p,c=S.sc,inst=sc.inst;
    const pr=Math.min(1,sc.wGen/sc.wNeed),dr=sc.gen?Math.min(1,sc.down/sc.gen):1;M.pr=pr;M.dr=dr;
    if(M.flyby)EV.push({c:"warn",p:"Flyby",t:`Grabbed a few hours of observations of ${nm(d)} while passing.`});
    EV.push({c:pr<1?"warn":"ok",p:"Power",t:pr<1?`${sc.wGen.toLocaleString()} W available, ${sc.wNeed} W needed. Instruments take turns and run ${Math.round(pr*100)}% of the time.`:`${sc.wGen.toLocaleString()} W available for ${sc.wNeed} W of equipment.`});
    if(pr<1)why(`Sunlight at ${nm(d)} is ${d.flux.toLocaleString()} W/m² versus 1,361 at Earth. Solar arrays shrink in output with distance squared; an RTG doesn't.`);
    EV.push({c:dr<.6?"warn":"ok",p:"Data",t:`Instruments make ${nf(sc.gen)} Gb/day. The ${ANT[c.ant].name} can send ${nf(sc.down)} Gb/day from ${d.au<.01?"the Moon":d.au+" AU away"}${dr<1?`, so ${Math.round((1-dr)*100)}% stays on board`:""}.`});
    if(dr<.6)why("Radio signals weaken with the square of distance. A bigger dish or fewer data-hungry instruments fixes a data bottleneck. NASA's Mars Reconnaissance Orbiter uses a 3 m dish to reach 6 Mbps.");
    if(!M.flyby){
      if(M.dest==="moon"&&c.solar!=="none"&&!c.rtg&&roll(.6)){const m=c.bat==="l"?.8:.6;M.keep*=m;EV.push({c:"warn",p:"Lunar night",t:`About 15 Earth days of darkness.${c.bat==="l"?" The big battery kept the heaters on.":" The batteries ran down."}`,fx:"night"});why("Night on the Moon lasts about 15 Earth days, since a full lunar day is 708.7 hours. Solar power drops to zero for all of it.")}
      if(M.dest==="mars"&&c.solar!=="none"&&!c.rtg&&roll(.35)){M.keep*=c.bat==="none"||c.bat==="s"?.5:.75;EV.push({c:"warn",p:"Dust storm",t:"A global dust storm blocked the sun. A storm like this ended Opportunity in 2018.",fx:"dust"});why("A global dust storm on Mars can last for weeks. That's one reason Curiosity and Perseverance carry RTGs instead of solar panels.")}
      if(M.dest==="europa"){if(!inst.includes("vault")&&roll(.7)){M.keep*=.3;EV.push({c:"bad",p:"Radiation",t:"Jupiter's radiation belts fried the unshielded electronics.",fx:"rad"});why("Juno keeps its flight computer inside a titanium vault. Without shielding, Jupiter's radiation wrecks electronics in months.")}else if(inst.includes("vault"))EV.push({c:"ok",p:"Radiation",t:"The radiation vault protected the flight computer.",fx:"rad"})}
      if((M.dest==="mercury"||M.dest==="venus")&&!inst.includes("shade")){M.keep*=M.dest==="mercury"?.45:.75;EV.push({c:"warn",p:"Heat",t:`Sunlight at ${nm(d)} is ${(d.flux/1361).toFixed(1)}× Earth's. Without a sunshade, instruments overheated.`});why("MESSENGER survived Mercury behind a ceramic-cloth sunshade. Sunlight there is up to about 7 times stronger than at Earth.")}
      if(M.dest==="titan"&&!c.rtg)EV.push({c:"bad",p:"Power",t:"At Saturn, sunlight is 1% of Earth's. Without an RTG the spacecraft barely runs."});
      if(inst.includes("mag")&&M.dest==="europa")EV.push({c:"ok",p:"Discovery",t:"The magnetometer detected an induced magnetic field. That points to a salty ocean under the ice."});
      if(inst.includes("radar")&&["mars","moon","europa"].includes(M.dest))EV.push({c:"ok",p:"Radar",t:`Radar mapped ice beneath the surface of ${nm(d)}.`});
      if(inst.includes("gamma")&&M.dest==="ceres")EV.push({c:"ok",p:"Discovery",t:"Bright spots in Occator crater turn out to be salt deposits left by briny water."});
      if(inst.includes("massspec")&&M.dest==="titan")EV.push({c:"ok",p:"Discovery",t:"The mass spectrometer measured complex organic molecules in Titan's haze."});
      if(inst.includes("probe"))EV.push({c:"ok",p:"Entry probe",t:`The probe parachuted through ${nm(d)}'s atmosphere, measuring it all the way down.`});
      if(M.landed!==null&&M.landed>0){
        if(M.dest==="venus")EV.push({c:"warn",p:"Surface",t:"The lander survived about two hours at 464 °C. Venera 13 lasted 127 minutes."});
        if(inst.includes("rover"))EV.push({c:"ok",p:"Rover",t:"The rover drove off the lander and started exploring.",fx:"rover"});
        if(inst.includes("heli"))EV.push({c:"ok",p:"Helicopter",t:M.dest==="titan"?"The helicopter flew easily in Titan's thick air and low gravity, like NASA's Dragonfly will.":"The helicopter flew in the thin Martian air, like Ingenuity did 72 times.",fx:"heli"});
        if(inst.includes("seis"))EV.push({c:"ok",p:"Seismometer",t:`Recorded ${M.dest==="mars"?"marsquakes":"quakes"} that reveal the interior.`});
        if(inst.includes("drill"))EV.push({c:"ok",p:"Drill",t:"Drilled below the surface and analyzed the sample."});
      }
      for(let y=2;y<=M.life;y++)if(roll(.14)){M.keep*=.9;EV.push({c:"warn",p:"Year "+y,t:"A reaction wheel wore out. Pointing is slower, so observations take longer."})}
      if(M.life>1)EV.push({c:"ok",p:"Mission length",t:`Operated for ${M.life} years at ${nm(d)}.`});
      if(M.keep>.5&&roll(.2)){M.keep*=1.2;EV.push({c:"ok",p:"Extended mission",t:"NASA approved an extended mission."})}
    }
    EV.push({c:"ok",p:"Downlink",t:"Science data received by the Deep Space Network's dishes in California, Spain and Australia."});
  });
  EV.forEach((e,i)=>at(1+i*2.6,"ev"+i,()=>{say(e.p+": "+e.t,e.c);log(e.c,e.p,e.t);
    if(e.fx==="dust")fxT.dust=.85;if(e.fx==="night")fxT.sun=.03;
    if(e.fx==="rad"){const f=$("fx");f.className="";void f.offsetWidth;f.className="rad";shake=e.c==="bad"?.5:.25;setTimeout(()=>shake=0,1500)}
    if(e.fx==="rover"&&probe.userData.lander&&probe.userData.lander.userData.rover){M.rover=probe.userData.lander.userData.rover;scene.attach(M.rover)}
    if(e.fx==="heli"&&probe.userData.lander&&probe.userData.lander.userData.heli){M.heli=probe.userData.lander.userData.heli;scene.attach(M.heli)}}));
  if(M.rover&&M.rover.position.y>.01){M.rover.position.y=Math.max(0,M.rover.position.y-dt*.8)}else if(M.rover){M.rover.position.x+=dt*1.2;M.rover.position.z+=dt*.4}
  if(M.heli){M.heli.position.y=4+Math.sin(pt*.8)*3;M.heli.children.forEach((c,i)=>{if(i)c.rotation.y+=dt*40})}
  if(dust)dust.material.opacity+=(fxT.dust-dust.material.opacity)*Math.min(1,dt);
  if(fxT.sun!==null){bgSun.intensity+=(fxT.sun-bgSun.intensity)*Math.min(1,dt);sun.intensity+=(.25-sun.intensity)*Math.min(1,dt)}
  at(1+EV.length*2.6+2,"done",()=>fadeThen(report));
  $("clock").textContent="DAY "+(M.days+Math.round(pt*14));
  teleAcc+=dt;if(teleAcc>.1)tele([["MISSION",M.flyby?"Flyby":M.landed?"Orbiter + lander":"Orbiter"],["HEALTH",Math.round(M.keep*100)+"%"],["POWER",Math.round((M.pr||1)*100)+"%"],["DATA HOME",Math.round((M.dr||1)*100)+"%"]],["–","–","–"]);
}
