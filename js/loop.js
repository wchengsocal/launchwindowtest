"use strict";
/* ================= loop ================= */
let last=performance.now();
function tick(dt){
  pt+=dt;plumeT.value+=dt;
  if(phase==="countdown")tickCountdown(dt);else if(phase==="flight")tickFlight(dt);else if(phase==="failed")tickFailed(dt);
  else if(phase==="review")tickReview(dt);else if(phase==="cruise")tickCruise(dt);else if(phase==="arrival")tickArrival(dt);else if(phase==="landing")tickLanding(dt);else if(phase==="ops")tickOps(dt);
  act.pressed=false;
  if(rk&&rk.userData.plumes&&(phase==="countdown"||phase==="flight"))emitPlumes(rk.userData.plumes,dt,inSpace);
  if(probe&&(phase==="arrival"))emitPlumes(probe.userData.plumes,dt,true);
  for(const d of debris){d.t+=dt;if(d.grav)d.vel.y-=9.8*dt;d.obj.position.addScaledVector(d.vel,dt);d.obj.rotation.x+=d.spin.x*dt;d.obj.rotation.y+=d.spin.y*dt;d.obj.rotation.z+=d.spin.z*dt}
  if(inSpace&&debris.some(d=>d.t>25))debris=debris.filter(d=>{if(d.t>25){scene.remove(d.obj);return false}return true});
  flame.update(dt,1.2,0,null);smoke.update(dt,.35,1.2,inSpace?null:landing?.3:3.2);
  if(tower&&phase==="hangar")tower.userData.arm.rotation.y=0;if(phase==="review"&&RV)rvLabels();
  
  if(clouds)clouds.rotation.y+=dt*.004;if(seaMat&&seaMat.normalMap&&padG.visible){seaMat.normalMap.offset.x+=dt*.006;seaMat.normalMap.offset.y+=dt*.0035}
  if(INTRO.on)introTick(dt);else if(focusObj)updateCamera(dt);musicMode();
}
function render(){
  const ps=renderer.domElement.height/(2*Math.tan(camera.fov*DEG/2));smoke.mat.uniforms.scale.value=ps;flame.mat.uniforms.scale.value=ps;
  if((phase==="hangar"&&!INTRO.on)||phase==="review"){const wide=VW>760;camera.setViewOffset(VW,VH,wide?Math.min(210,VW*.16):0,wide?0:VH*.27,VW,VH)}else camera.clearViewOffset();
  sky.position.copy(camera.position);starsFg.position.copy(camera.position);
  renderer.clear();
  if(inSpace){bgCam.position.copy(shipKm).addScaledVector(camera.position,.001);bgCam.quaternion.copy(camera.quaternion);bgCam.fov=camera.fov;bgCam.updateProjectionMatrix();
    starsBg.position.copy(bgCam.position);sunSprite.position.copy(bgCam.position).addScaledVector(SUN_DIR,1.5e6);sunCore.position.copy(sunSprite.position);renderer.render(bg,bgCam);renderer.clearDepth()}
  renderer.render(scene,camera);
}
let userPause=false;
try{new ResizeObserver(()=>document.documentElement.style.setProperty("--ctrlH",($("ctrl").offsetHeight||46)+"px")).observe($("ctrl"))}catch(e){}
function togglePause(){userPause=!userPause;$("pauseB").textContent=userPause?"Resume":"Pause";$("pauseB").setAttribute("aria-pressed",String(userPause));if(userPause){rumble(0);hint("Paused. Press Esc or Resume to continue.")}else hint("")}
$("pauseB").addEventListener("click",togglePause);
function loop(now){requestAnimationFrame(loop);const raw=now-last,dt=Math.min(.05,raw/1000)*(window.__lwSpeed||1);last=now;
  if(qAuto&&qReady&&now>qReady&&!document.hidden&&raw<250&&!INTRO.on){ftAcc+=raw;ftN++;if(ftAcc>2000){const avg=ftAcc/ftN;ftAcc=ftN=0;if(avg>24&&QI>0){setQuality(QI-1);if(phase!=="hangar"&&phase!=="report")say(`Graphics lowered to ${QUAL[QI].name} to keep the frame rate up.`)}}}
  if(!userPause)tick(dt);if(!mapOn)render()}
