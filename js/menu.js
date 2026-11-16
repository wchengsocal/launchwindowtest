"use strict";
/* ================= quit to main menu ================= */
let quitPaused=false;
function openQuit(){if(INTRO.on)return;if(TUT.on)endTut();const design=phase==="hangar";$("qTxt").textContent=design?"Your design stays as it is.":"This flight will end. Your design stays as it is.";
  if(!design&&!userPause){userPause=true;quitPaused=true}$("quitDlg").hidden=false;try{$("qNo").focus({preventScroll:true})}catch(e){}}
function closeQuit(){$("quitDlg").hidden=true;if(quitPaused){userPause=false;quitPaused=false}}
function quitToMenu(){$("quitDlg").hidden=true;quitPaused=false;try{rumble(0)}catch(e){}fadeThen(()=>{
  if(phase!=="hangar"){if(userPause)togglePause();hidePrompt();$("review").hidden=true;$("rvLabels").hidden=true;resetToPad()}
  startIntro()})}
$("quitB").addEventListener("click",openQuit);$("qNo").addEventListener("click",closeQuit);$("qYes").addEventListener("click",quitToMenu);
addEventListener("keydown",e=>{if($("quitDlg").hidden)return;if(e.code==="Escape"){closeQuit();e.preventDefault();e.stopImmediatePropagation()}},true);
