"use strict";
/* ================= state ================= */
const clone=o=>JSON.parse(JSON.stringify(o));
const S={dest:"mars",type:"orbiter",site:"cape",time:"auto",diff:"normal",sandbox:false,campaign:false,autoStage:false,tab:"mission",preset:"fh",obj:"water",orbit:"polar",life:2,team:{n:1,names:["William","Player 2","Player 3","Player 4"]},
  rocket:clone(PRESETS.fh),sc:{bus:"medium",prop:"chem",margin:.1,solar:"m",rtg:0,bat:"s",ant:"hga",inst:["cam","spec","radar"]}};

const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const who=id=>S.team.names[ASSIGN[S.team.n][ROLES.findIndex(r=>r.id===id)]];
function fixObj(){if(!OBJ[S.obj].dest.includes(S.dest))S.obj=Object.keys(OBJ).find(k=>OBJ[k].dest.includes(S.dest))}
function reqs(sc){const o=OBJ[S.obj],d=DEST[S.dest],have=o.need[0].filter(k=>sc.inst.includes(k)).length;
  return[[`Instruments: at least ${o.need[1]} of ${o.need[0].map(k=>INST[k].name.toLowerCase()).join(", ")}`,have>=o.need[1]],
    [`Science orbit: ${o.orbit.map(k=>ORBITS[k].name.toLowerCase()).join(" or ")} (not a flyby)`,S.type!=="flyby"&&o.orbit.includes(S.orbit)],
    [`Power at ${d.the||d.name}: at least 100% of what the spacecraft needs`,sc.wGen>=sc.wNeed],
    ["Data: at least 70% sent home",!sc.gen||sc.down/sc.gen>=.7],
    [`Mission length: at least ${o.years} year${o.years>1?"s":""}`,S.life>=o.years]]}
function instOK(k){const i=INST[k];if(i.only&&!i.only.includes(S.dest))return "Only at "+i.only.map(x=>DEST[x].name).join(" or ");if(i.at==="surface"&&S.type!=="lander")return "Needs a lander mission";return true}
function rocketParts(cfg){
  const st=cfg.stages.map(s=>{const e=ENG[s.eng],f=FUEL[e.fuel];return{eng:e,key:s.eng,n:s.n,tank:s.tank,prop:s.tank*1000,dry:s.tank*1000*f.dry+e.mass*1000*s.n,cost:e.cost*s.n+s.tank*f.cost}});
  const bo=BOOST[cfg.boost];let b=null;
  if(bo.kind==="solid"){const k=SOLIDS[bo.size];b={kind:"solid",size:bo.size,n:bo.n,prop:k.prop*1000*bo.n,dry:k.dry*1000*bo.n,tsl:k.tsl*1000*bo.n,tvac:k.tvac*1000*bo.n,isl:k.isl,ivac:k.ivac,cost:k.cost*bo.n}}
  else if(bo.kind==="liquid"){const s=st[0],e=s.eng;b={kind:"liquid",n:2,prop:s.prop*2,dry:s.dry*2,tsl:e.tsl*1000*s.n*2,tvac:e.tvac*1000*s.n*2,isl:e.isl,ivac:e.ivac,cost:s.cost*2,eng:e,en:s.n}}
  return{st,b,cost:26+st.reduce((a,s)=>a+s.cost,0)+(b?b.cost:0)};
}
const FAIRING=2000;
function rocketStats(cfg,payload){
  const P=rocketParts(cfg),out=[];
  const above=i=>payload+P.st.slice(i+1).reduce((a,s)=>a+s.dry+s.prop,0);
  let total=0,twr0=0;const bm=P.b?P.b.dry+P.b.prop:0;
  const mass0=above(-1)+FAIRING+bm;
  P.st.forEach((s,i)=>{
    const e=s.eng,Tv=e.tvac*1000*s.n,isp=i===0?e.isl*.3+e.ivac*.7:e.ivac,md=Tv/(e.ivac*G0);
    const m0=above(i)+s.dry+s.prop+(i===0?FAIRING:0);let dv,twr;
    if(i===0){twr=(e.tsl*1000*s.n+(P.b?P.b.tsl:0))/((m0+bm)*G0);twr0=twr;
      if(P.b){const b=P.b,bisp=b.isl*.3+b.ivac*.7,bmd=b.tvac/(b.ivac*G0),tb=b.prop/bmd,used=Math.min(s.prop,md*tb),mA0=m0+bm,mA1=mA0-b.prop-used;
        const ispEff=(Tv+b.tvac)/((Tv/isp)+(b.tvac/bisp));dv=ispEff*G0*Math.log(mA0/mA1);const mB0=mA1-b.dry;dv+=isp*G0*Math.log(mB0/(mB0-(s.prop-used)))}
      else dv=isp*G0*Math.log(m0/(m0-s.prop));
    }else{twr=Tv/(m0*G0);dv=isp*G0*Math.log(m0/(m0-s.prop))}
    out.push({dv:dv/1000,twr,burn:s.prop/md});total+=dv/1000;
  });
  return{stages:out,dv:total,twr0,mass0,cost:P.cost};
}
function scDesign(){
  const d=DEST[S.dest],c=S.sc,bus=BUS[c.bus],ant=ANT[c.ant],sol=SOLAR[c.solar],bat=BAT[c.bat],pr=PROP[c.prop];
  let dry=bus.mass+sol.mass+c.rtg*RTG.mass+bat.mass+ant.mass+pr.mass,cost=bus.cost+sol.cost+c.rtg*RTG.cost+bat.cost+ant.cost+pr.cost,wNeed=bus.w+ant.w,gen=0;
  const inst=c.inst.filter(k=>INST[k]&&instOK(k)===true);
  for(const k of inst){const i=INST[k];dry+=i.mass;cost+=i.cost;wNeed+=i.w;gen+=i.data}
  let lander=0;if(S.type==="lander"){lander=Math.round(LANDER.dry*Math.exp(d.land*1000/(320*G0))+(d.atm?300:0));cost+=LANDER.cost;gen+=LANDER.data}
  const dvNeed=S.type==="flyby"?.1:d.cap+ORBITS[S.orbit].dv+.1,dvCap=dvNeed*(1+c.margin);
  const propM=(dry+lander)*(Math.exp(dvCap*1000/(pr.isp*G0))-1);
  const wGen=sol.kw*1000*d.flux/1361*.8+c.rtg*RTG.w;
  const rate=Math.min(ant.cap,ant.mbps*Math.pow(.7/d.au,2));
  return{dry:Math.round(dry),lander,prop:Math.round(propM),wet:Math.round(dry+lander+propM),cost,wNeed,wGen:Math.round(wGen),gen:gen/1000,down:rate*8*3600/1000,rate,dvNeed,dvCap,inst,slots:inst.filter(k=>INST[k].sci||INST[k].mass).length,maxSlots:bus.slots};
}
function design(){const sc=scDesign(),d=DEST[S.dest],rs=rocketStats(S.rocket,sc.wet),need=SITE[S.site].leo+d.dep;return{sc,rs,need,cost:rs.cost+sc.cost+25*S.life,d}}
