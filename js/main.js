"use strict";
/* ================= boot ================= */
buildCockpit();setPhase("hangar");buildRocket();applyTheme();hallMode(true);setQuality(2);setCam("chase");renderPanel();
requestAnimationFrame(loop);
buildEarth(()=>{$("loading").hidden=true;qReady=performance.now()+3000;startIntro()});
