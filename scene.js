"use strict";
/* ================= noise + procedural textures ================= */
let _s=90210;const srand=()=>(_s=(_s*16807)%2147483647)/2147483647;
const PERM=new Uint8Array(512);(()=>{const p=[...Array(256).keys()];for(let i=255;i>0;i--){const j=Math.floor(srand()*(i+1));[p[i],p[j]]=[p[j],p[i]]}for(let i=0;i<512;i++)PERM[i]=p[i&255]})();
function vn(x,y,z){const X=Math.floor(x),Y=Math.floor(y),Z=Math.floor(z),fx=x-X,fy=y-Y,fz=z-Z,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),w=fz*fz*(3-2*fz),xi=X&255,yi=Y&255,zi=Z&255;
  const A=PERM[xi]+yi,AA=PERM[A]+zi,AB=PERM[A+1]+zi,B=PERM[xi+1]+yi,BA=PERM[B]+zi,BB=PERM[B+1]+zi;
  const x1=PERM[AA]+(PERM[BA]-PERM[AA])*u,x2=PERM[AB]+(PERM[BB]-PERM[AB])*u,x3=PERM[AA+1]+(PERM[BA+1]-PERM[AA+1])*u,x4=PERM[AB+1]+(PERM[BB+1]-PERM[AB+1])*u;
  const y1=x1+(x2-x1)*v,y2=x3+(x4-x3)*v;return(y1+(y2-y1)*w)/255}
function fbm(x,y,z,o){let a=.5,f=1,s=0,n=0;for(let i=0;i<o;i++){s+=a*vn(x*f,y*f,z*f);n+=a;f*=2.03;a*=.5}return s/n}
function planetTex(w,h,fn){const c=document.createElement("canvas");c.width=w;c.height=h;const g=c.getContext("2d"),img=g.createImageData(w,h),d=img.data;
  for(let j=0;j<h;j++){const lat=(.5-j/h)*Math.PI,y=Math.sin(lat),cl=Math.cos(lat);for(let i=0;i<w;i++){const lon=i/w*Math.PI*2;fn(cl*Math.cos(lon),y,cl*Math.sin(lon),d,(j*w+i)*4)}}
  g.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.anisotropy=4;t.encoding=THREE.sRGBEncoding;return t}
const px=(d,o,r,g,b,a=255)=>{d[o]=r;d[o+1]=g;d[o+2]=b;d[o+3]=a};
const TEXGEN={
  earth:()=>planetTex(1024,512,(x,y,z,d,o)=>{const n=fbm(x*1.8+5,y*1.8+5,z*1.8+5,6),m=fbm(x*6+1,y*6,z*6,3),al=Math.abs(y);let r,g,b;
    if(n>.53){const t=Math.min(1,(n-.53)*7),dry=fbm(x*2.5+9,y*2.5,z*2.5,3)+(al<.5?.12:-.1);if(dry>.62){r=176+t*28;g=150+t*20;b=100}else{r=46+t*55+m*30;g=92+t*38;b=42+t*18}}
    else{const t=clamp((n-.4)/.13,0,1);r=6+t*22;g=28+t*62;b=66+t*84}if(al>.9-m*.08){r=g=b=238}px(d,o,r,g,b)}),
  clouds:()=>planetTex(1024,512,(x,y,z,d,o)=>{const n=fbm(x*3+20,y*5+3,z*3,5),a=clamp((n-.57)*3.4,0,1);px(d,o,255,255,255,a*190)}),
  moon:()=>planetTex(1024,512,(x,y,z,d,o)=>{let v=105+fbm(x*3,y*3,z*3,5)*95;if(fbm(x*1.4+7,y*1.4,z*1.4,3)>.56)v*=.6;const c=vn(x*16,y*16,z*16);if(c>.83)v*=.78;else if(c>.79)v*=1.15;px(d,o,v,v*.98,v*.95)}),
  mercury:()=>planetTex(1024,512,(x,y,z,d,o)=>{let v=95+fbm(x*3+3,y*3,z*3,5)*80;const c=vn(x*20,y*20,z*20);if(c>.84)v*=.72;else if(c>.8)v*=1.2;px(d,o,v*1.02,v*.95,v*.88)}),
  venus:()=>planetTex(1024,512,(x,y,z,d,o)=>{const n=fbm(x*2,y*7,z*2,5);px(d,o,214+n*34,184+n*30,120+n*40)}),
  mars:()=>planetTex(1024,512,(x,y,z,d,o)=>{const n=fbm(x*2.5,y*2.5,z*2.5,5);let r=176+n*55,g=88+n*32,b=52+n*20;if(fbm(x*1.7+3,y*1.7,z*1.7,4)>.56){r*=.62;g*=.6;b*=.66}if(Math.abs(y)>.92+(n-.5)*.1){r=g=b=236}px(d,o,r,g,b)}),
  dust:()=>planetTex(512,256,(x,y,z,d,o)=>{const n=fbm(x*3+4,y*3,z*3,4);px(d,o,200,128,74,clamp(.55+(n-.5)*1.6,0,1)*255)}),
  ceres:()=>planetTex(1024,512,(x,y,z,d,o)=>{let v=70+fbm(x*3+8,y*3,z*3,5)*60;const c=vn(x*14,y*14,z*14);if(c>.84)v*=.75;if(vn(x*9+5,y*9,z*9)>.93)v=225;px(d,o,v,v,v*1.02)}),
  europa:()=>planetTex(1024,512,(x,y,z,d,o)=>{const b0=fbm(x*3,y*3,z*3,4);let r=222+b0*28,g=208+b0*26,b=180+b0*26;const l1=Math.abs(fbm(x*4+11,y*4,z*4,4)-.5),l2=Math.abs(fbm(x*7+3,y*7+5,z*7,3)-.5);if(l1<.016||l2<.011){r=150;g=96;b=62}px(d,o,r,g,b)}),
  titan:()=>planetTex(1024,512,(x,y,z,d,o)=>{const n=fbm(x*2,y*4,z*2,4);px(d,o,206+n*30,140+n*24,58+n*18)}),
  jupiter:()=>planetTex(512,256,(x,y,z,d,o)=>{const t=y*9+(fbm(x*3,y*14,z*3,4)-.5)*1.6,k=Math.sin(t*Math.PI),n=fbm(x*8,y*30,z*8,3);px(d,o,205+k*32+n*12,172+k*34+n*10,132+k*40)}),
  saturn:()=>planetTex(512,256,(x,y,z,d,o)=>{const t=y*7+(fbm(x*3,y*10,z*3,3)-.5)*.8,k=Math.sin(t*Math.PI);px(d,o,222+k*18,196+k*20,140+k*22)})
};
const TEX={};const tex=k=>TEX[k]||(TEX[k]=TEXGEN[k]());
function soft(stops){const c=document.createElement("canvas");c.width=c.height=64;const g=c.getContext("2d"),r=g.createRadialGradient(32,32,0,32,32,32);stops.forEach(s=>r.addColorStop(s[0],s[1]));g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)}
const glowTex=soft([[0,"rgba(255,255,255,1)"],[.3,"rgba(255,255,255,.6)"],[1,"rgba(255,255,255,0)"]]);
const smokeTex=soft([[0,"rgba(255,255,255,.9)"],[.5,"rgba(255,255,255,.5)"],[1,"rgba(255,255,255,0)"]]);

/* ================= renderer, scenes ================= */
const renderer=new THREE.WebGLRenderer({canvas:$("c"),antialias:true,logarithmicDepthBuffer:true});
renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.autoClear=false;
const scene=new THREE.Scene(),bg=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(50,1,.5,60000),bgCam=new THREE.PerspectiveCamera(50,1,10,4e6);
let VW=1,VH=1;
function resize(){VW=innerWidth;VH=innerHeight;{const a=VW/VH;$("ckSvg").setAttribute("preserveAspectRatio",a>=1.7||a<1.1?"xMidYMid slice":"xMidYMid meet")}renderer.setSize(VW,VH,false);camera.aspect=bgCam.aspect=VW/VH;camera.updateProjectionMatrix();bgCam.updateProjectionMatrix();if(!$("map").hidden)sizeMap()}
addEventListener("resize",resize);
const hemi=new THREE.HemisphereLight(0xbcd6ff,0x5a4a3a,.6);scene.add(hemi);
const SUN_PAD=new V3(240,380,260);
const sun=new THREE.DirectionalLight(0xfff0dd,2);sun.position.copy(SUN_PAD);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.bias=-.0005;sun.shadow.normalBias=.05;scene.add(sun);scene.add(sun.target);
function shadowBox(s,far){const c=sun.shadow.camera;c.left=-s;c.right=s;c.top=s;c.bottom=-s;c.near=1;c.far=far;c.updateProjectionMatrix()}
shadowBox(130,1400);
const engineLight=new THREE.PointLight(0xff9a4a,0,500,1.5);scene.add(engineLight);
const QUAL=[{name:"Low",pr:.75,sh:false,pm:.35},{name:"Medium",pr:1,sh:true,pm:.65},{name:"High",pr:Math.min(devicePixelRatio,1.5),sh:true,pm:1}];
let QI=2,QP=1,qAuto=true,ftAcc=0,ftN=0,qReady=0;
function setQuality(i){QI=i;const q=QUAL[i];QP=q.pm;renderer.setPixelRatio(q.pr);resize();sun.castShadow=q.sh;$("gfx").innerHTML='<span class="gfxw">Graphics: </span>'+q.name+(qAuto?" (auto)":"")}
$("gfx").addEventListener("click",()=>{if(qAuto){qAuto=false;setQuality(2)}else if(QI>0)setQuality(QI-1);else{qAuto=true;setQuality(2)}ftAcc=ftN=0});

const skyU={top:{value:new THREE.Color(0x2c5fae)},hor:{value:new THREE.Color(0xd4e3f1)},sunDir:{value:SUN_PAD.clone().normalize()},space:{value:0},glow:{value:new THREE.Color(1,.85,.6)}};
const sky=new THREE.Mesh(new THREE.SphereGeometry(40000,32,16),new THREE.ShaderMaterial({uniforms:skyU,side:THREE.BackSide,depthWrite:false,
  vertexShader:`#include <common>
#include <logdepthbuf_pars_vertex>
varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;
#include <logdepthbuf_vertex>
}`,
  fragmentShader:`#include <logdepthbuf_pars_fragment>
uniform vec3 top,hor,sunDir,glow;uniform float space;varying vec3 vW;void main(){
#include <logdepthbuf_fragment>
vec3 d=normalize(vW-cameraPosition);float h=max(d.y,0.);vec3 c=mix(hor,top,pow(h,.45));float sd=max(dot(d,sunDir),0.);c+=glow*(pow(sd,400.)*3.+pow(sd,10.)*.3*(1.-space));c=mix(c,vec3(.004,.007,.018),space);if(d.y<0.)c=mix(c,hor*.5*(1.-space),clamp(-d.y*10.,0.,1.)*(1.-space));gl_FragColor=vec4(c,1.);}`}));
sky.frustumCulled=false;sky.renderOrder=-1;scene.add(sky);
scene.fog=new THREE.Fog(0xd4e3f1,900,14000);
const starGeo=(()=>{const n=6000,p=new Float32Array(n*3),c=new Float32Array(n*3);for(let i=0;i<n;i++){const u=Math.random()*2-1,a=Math.random()*Math.PI*2,r=Math.sqrt(1-u*u);p[i*3]=r*Math.cos(a);p[i*3+1]=u;p[i*3+2]=r*Math.sin(a);const t=Math.random();c[i*3]=.8+t*.2;c[i*3+1]=.85+t*.1;c[i*3+2]=1}const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(p,3));g.setAttribute("color",new THREE.BufferAttribute(c,3));return g})();
const starsFg=new THREE.Points(starGeo,new THREE.PointsMaterial({size:1.6,sizeAttenuation:false,vertexColors:true,transparent:true,opacity:0,depthWrite:false,fog:false}));starsFg.scale.setScalar(35000);starsFg.frustumCulled=false;scene.add(starsFg);
const starsBg=new THREE.Points(starGeo,new THREE.PointsMaterial({size:1.7,sizeAttenuation:false,vertexColors:true,depthWrite:false}));starsBg.scale.setScalar(3e6);starsBg.frustumCulled=false;bg.add(starsBg);

/* ================= materials, particles, plumes ================= */
const foilTex=(()=>{const c=document.createElement("canvas");c.width=c.height=128;const g=c.getContext("2d");g.fillStyle="#c9a24a";g.fillRect(0,0,128,128);
  for(let i=0;i<300;i++){const x=Math.random()*128,y=Math.random()*128,w=6+Math.random()*24,h=4+Math.random()*16,l=Math.random()>.5;g.fillStyle=l?`rgba(255,232,160,${.1+Math.random()*.2})`:`rgba(90,58,16,${.08+Math.random()*.16})`;g.beginPath();g.moveTo(x,y);g.lineTo(x+w,y+Math.random()*h);g.lineTo(x+Math.random()*w,y+h);g.fill()}
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t})();
function std(c,r,m,o){return new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:r,metalness:m},o||{}))}
const MAT={white:std(0xe9e9e4,.42,.05),whiteDS:std(0xe9e9e4,.42,.05,{side:THREE.DoubleSide}),black:std(0x17181b,.55,.2),orange:std(0xc8742e,.78,0),steel:std(0xc7ccd2,.28,.85),
  grey:std(0x7d8187,.45,.5),dark:std(0x2a2b2f,.3,.85),gold:std(0xffffff,.48,.35,{map:foilTex}),panel:std(0x1b2b5c,.28,.55),tower:std(0x3b4047,.7,.4),
  concrete:std(0x9c9a93,.95,0),silver:std(0xb9bec6,.3,.8),rtg:std(0x34373c,.55,.6,{emissive:0x3a0f00,emissiveIntensity:.6}),dish:std(0xf2f2ee,.5,.1,{side:THREE.DoubleSide})};
function mesh(geo,mat,x=0,y=0,z=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;return m}
function cyl(r1,r2,h,mat,y,seg=40,ts=0,tl=Math.PI*2,open=false){return mesh(new THREE.CylinderGeometry(r1,r2,h,seg,1,open,ts,tl),mat,0,y+h/2,0)}
function nose(r,h,mat,y,ps=0,pl=Math.PI*2){const pts=[];for(let i=0;i<=20;i++){const t=i/20;pts.push(new THREE.Vector2(Math.max(.001,r*Math.pow(1-t,.55)),t*h))}return mesh(new THREE.LatheGeometry(pts,40,ps,pl),mat,0,y,0)}
class PS{
  constructor(n,blend,tex){this.n=n;this.i=0;this.add=blend===THREE.AdditiveBlending;
    this.p=new Float32Array(n*3);this.c=new Float32Array(n*3);this.s=new Float32Array(n);this.a=new Float32Array(n);this.v=new Float32Array(n*3);this.l=new Float32Array(n);this.m=new Float32Array(n);this.g=new Float32Array(n);this.k=new Float32Array(n);
    const G=new THREE.BufferGeometry();G.setAttribute("position",new THREE.BufferAttribute(this.p,3));G.setAttribute("pcol",new THREE.BufferAttribute(this.c,3));G.setAttribute("psize",new THREE.BufferAttribute(this.s,1));G.setAttribute("palpha",new THREE.BufferAttribute(this.a,1));
    this.mat=new THREE.ShaderMaterial({uniforms:{map:{value:tex},scale:{value:500},tint:{value:new THREE.Color(1,1,1)}},transparent:true,depthWrite:false,blending:blend,
      vertexShader:`#include <common>
#include <logdepthbuf_pars_vertex>
attribute vec3 pcol;attribute float psize;attribute float palpha;varying vec3 vC;varying float vA;uniform float scale;void main(){vC=pcol;vA=palpha;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=min(psize*scale/max(-mv.z,.1),320.);gl_Position=projectionMatrix*mv;
#include <logdepthbuf_vertex>
}`,
      fragmentShader:`#include <logdepthbuf_pars_fragment>
uniform sampler2D map;uniform vec3 tint;varying vec3 vC;varying float vA;void main(){
#include <logdepthbuf_fragment>
vec4 t=texture2D(map,gl_PointCoord);float a=t.a*vA;if(a<.004)discard;gl_FragColor=vec4(vC*t.rgb*tint,a);}`});
    this.pts=new THREE.Points(G,this.mat);this.pts.frustumCulled=false}
  emit(x,y,z,vx,vy,vz,life,size,grow,r,g,b,alpha){const i=this.i,j=i*3;this.i=(i+1)%this.n;this.p[j]=x;this.p[j+1]=y;this.p[j+2]=z;this.v[j]=vx;this.v[j+1]=vy;this.v[j+2]=vz;this.l[i]=life;this.m[i]=life;this.s[i]=size;this.g[i]=grow;this.c[j]=r;this.c[j+1]=g;this.c[j+2]=b;this.k[i]=alpha}
  update(dt,drag,buoy,floor){const dd=Math.exp(-drag*dt);
    for(let i=0;i<this.n;i++){if(this.l[i]<=0){this.a[i]=0;this.s[i]=0;continue}this.l[i]-=dt;const j=i*3,f=Math.max(0,this.l[i]/this.m[i]);
      this.v[j]*=dd;this.v[j+1]=this.v[j+1]*dd+buoy*dt;this.v[j+2]*=dd;this.p[j]+=this.v[j]*dt;this.p[j+1]+=this.v[j+1]*dt;this.p[j+2]+=this.v[j+2]*dt;
      if(floor!==null&&this.p[j+1]<floor){this.p[j+1]=floor;this.v[j+1]=Math.abs(this.v[j+1])*.15}this.s[i]+=this.g[i]*dt;
      if(this.add){this.a[i]=f*this.k[i];this.c[j+1]*=1-dt*2.4;this.c[j+2]*=1-dt*4.5}else this.a[i]=this.k[i]*Math.min(1,(1-f)*6)*f}
    const A=this.pts.geometry.attributes;A.position.needsUpdate=A.psize.needsUpdate=A.palpha.needsUpdate=A.pcol.needsUpdate=true}
  clear(){this.l.fill(0);this.a.fill(0);this.s.fill(0)}
}
const smoke=new PS(2400,THREE.NormalBlending,smokeTex),flame=new PS(1800,THREE.AdditiveBlending,glowTex);scene.add(smoke.pts);scene.add(flame.pts);
const plumeT={value:0};
function plumeMat(c1,c2,a){return new THREE.ShaderMaterial({uniforms:{t:plumeT,c1:{value:new THREE.Color(c1)},c2:{value:new THREE.Color(c2)},a:{value:a}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  vertexShader:`#include <common>
#include <logdepthbuf_pars_vertex>
varying vec2 vU;varying vec3 vN;varying vec3 vP;void main(){vU=uv;vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vP=mv.xyz;gl_Position=projectionMatrix*mv;
#include <logdepthbuf_vertex>
}`,
  fragmentShader:`#include <logdepthbuf_pars_fragment>
uniform float t,a;uniform vec3 c1,c2;varying vec2 vU;varying vec3 vN;varying vec3 vP;void main(){
#include <logdepthbuf_fragment>
float v=vU.y;float f=pow(v,1.7);float dia=.8+.2*sin(v*40.-t*48.);float fl=.86+.14*sin(t*73.+vU.x*21.);float fr=pow(abs(dot(normalize(vN),normalize(-vP))),1.4);vec3 c=mix(c2,c1,pow(v,3.));gl_FragColor=vec4(c*f*dia*fl*fr*a,1.);}`})}
const PLUME={kero:{c1:0xfff0c8,c2:0xff6a12,a:1.1,len:16,spread:1.7},metha:{c1:0xdfe8ff,c2:0x6a7dff,a:.8,len:14,spread:1.6},h2:{c1:0xe8f0ff,c2:0xff9a5a,a:.55,len:13,spread:1.6},srb:{c1:0xfffbea,c2:0xffa040,a:1.5,len:22,spread:2},vac:{c1:0xd8e6ff,c2:0xff8a4a,a:.45,len:12,spread:4.5}};
function addPlume(list,obj,y,r,kind,src){const P=PLUME[kind],L=r*P.len,geo=new THREE.CylinderGeometry(r*.85,r*P.spread,L,24,1,true);geo.translate(0,-L/2,0);
  const pl=new THREE.Mesh(geo,plumeMat(P.c1,P.c2,P.a));pl.position.set(0,y,0);pl.visible=false;obj.add(pl);list.push({obj,pos:new V3(0,y,0),r,kind,src,plume:pl,thr:0})}

/* ================= launch pad ================= */
const padG=new THREE.Group();scene.add(padG);let groundMat,seaMat,cityLit=null;
/* coastline runs north-south; ocean to the east (+x), like Cape Canaveral */
const coastX=z=>950+240*Math.sin(z/2300+.7)+160*Math.sin(z/870+2.1)+80*Math.sin(z/410);
const landD=(x,z)=>coastX(z)-x;
function landY(x,z){const d=landD(x,z);if(d>=60)return 0;if(d>=0)return -1+d/60;return -1-8*Math.min(1,Math.pow(-d/140,.8))}
const mix3=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)],sm=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const URB=[.16,.16,.15],SCRUB=[.11,.17,.065],DRY=[.25,.22,.12],SAND=[.78,.66,.44],WET=[.4,.33,.22],DEEP=[.08,.13,.14];
function landCol(x,z){const d=landD(x,z),n=fbm(x/1700+3,z/1700,1.1,3);let c=mix3(SCRUB,DRY,sm(.4,.65,n));const u=Math.max(1-Math.hypot((x+6200)/2900,(z+2600)/2500),z<-3400&&z>-12800&&d<760?.6:0);if(u>0)c=mix3(c,URB,sm(0,.3,u));
  if(d<150)c=mix3(SAND,c,sm(70,150,d));if(d<10)c=mix3(WET,SAND,sm(-20,10,d));if(d<-20)c=mix3(DEEP,WET,sm(-120,-20,d));return c}
function gridGeo(x0,x1,z0,z1,nx,nz,hf,cf,tile){const g=new THREE.BufferGeometry(),P=[],U=[],Cc=[],I=[];
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=lerp(x0,x1,i/nx),z=lerp(z0,z1,j/nz),c=cf(x,z);P.push(x,hf(x,z),z);U.push(x/tile,z/tile);Cc.push(c[0],c[1],c[2])}
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;I.push(a,c,b,b,c,d)}
  g.setAttribute("position",new THREE.Float32BufferAttribute(P,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(U,2));g.setAttribute("color",new THREE.Float32BufferAttribute(Cc,3));g.setIndex(I);g.computeVertexNormals();return g}
function waveTex(){const N=128,c=document.createElement("canvas");c.width=c.height=N;const g=c.getContext("2d"),img=g.createImageData(N,N),W=[[1,2,.3],[3,1,1.7],[2,5,4.1],[5,3,2.2],[7,2,.9],[4,7,5.3],[9,5,3.3],[11,8,1.1]];
  const H=(u,v)=>W.reduce((a,[kx,ky,ph],i)=>a+Math.sin(2*Math.PI*(kx*u+ky*v)+ph)/(1+i*.6),0);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const u=i/N,v=j/N,e=1/N,dx=H(u+e,v)-H(u-e,v),dy=H(u,v+e)-H(u,v-e),nx=-dx*.9,ny=-dy*.9,l=Math.hypot(nx,ny,1);px(img.data,(j*N+i)*4,(nx/l*.5+.5)*255,(ny/l*.5+.5)*255,(1/l*.5+.5)*255)}
  g.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t}
function facadeTex(lit){const c=document.createElement("canvas");c.width=c.height=128;const g=c.getContext("2d");g.fillStyle=lit?"#000":"#d6d6d6";g.fillRect(0,0,128,128);
  for(let j=0;j<8;j++)for(let i=0;i<8;i++){g.fillStyle=lit?(Math.random()<.42?`hsl(${36+Math.random()*14},85%,${58+Math.random()*28}%)`:"#000"):(Math.random()<.15?"#3a4756":"#232b35");g.fillRect(3+i*16,4+j*16,10,9)}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t}
function glassTex(){const c=document.createElement("canvas");c.width=c.height=128;const g=c.getContext("2d");g.fillStyle="#d3dde6";g.fillRect(0,0,128,128);
  for(let j=0;j<8;j++){g.fillStyle="#4a6585";g.fillRect(0,3+j*16,128,11)}g.fillStyle="#c9d3dd";for(let i=0;i<8;i++)g.fillRect(i*16,0,1,128);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t}
function cityGeo(vf){const g=new THREE.BoxGeometry(1,1,1);g.translate(0,.5,0);const uv=g.attributes.uv;for(const f of [0,1,4,5])for(let k=0;k<4;k++){const i=f*4+k;uv.setXY(i,uv.getX(i),uv.getY(i)*vf)}return g}
function buildCity(){
  const side=std(0xffffff,.8,.05,{map:facadeTex(false),emissive:0xffffff,emissiveMap:facadeTex(true),emissiveIntensity:0}),glass=std(0xffffff,.3,.45,{map:glassTex(),emissive:0xffffff,emissiveMap:facadeTex(true),emissiveIntensity:0}),roof=std(0x9a9a96,.92,0);cityLit=[side,glass];
  const PALS=[[0xe3a17f,0xeabb91,0x8cc5bc,0xa8d0c2,0xe5d18c,0xd9c19c,0xf1e4cc,0xc98c76,0xb9cfe0],[0x9a4a36,0xb3664b,0xc8a97e,0xd6c09c,0x8e8d88,0xaaa298,0xc6ad88,0x7f8a7a],[0x86a6c4,0x6f8fae,0xa3bdd4,0x8d98a3,0xb09674,0xb9cad8,0x8fb0b4]].map(p=>p.map(c=>new THREE.Color(c).convertSRGBToLinear()));
  const lists=[[],[],[]],add=(x,z,w,d,h,ro)=>lists[h<20?0:h<60?1:2].push([x,z,w,d,h,ro]);
  const CX=-6200,CZ=-2600,ROT=.22,cs=Math.cos(ROT),sn=Math.sin(ROT),VAB=[-1900,2600];
  const segD=(x,z,ax,az,bx,bz)=>{const vx=bx-ax,vz=bz-az,t=clamp(((x-ax)*vx+(z-az)*vz)/(vx*vx+vz*vz),0,1);return Math.hypot(x-ax-vx*t,z-az-vz*t)};
  const HX1=coastX(-4800)-60;
  const nearRoad=(x,z,m)=>(Math.abs(z)<m&&x<-60&&x>-3420)||(Math.abs(x+3400)<m&&z<0&&z>-4810)||(Math.abs(z+4800)<m&&x<HX1&&x>-12000)||segD(x,z,-47,65,VAB[0]+80,VAB[1]-110)<m+14;
  const toW=(lx,lz)=>[CX+lx*cs+lz*sn,CZ-lx*sn+lz*cs];
  for(let a=-46;a<=46;a++)for(let b=-34;b<=34;b++){
    if(a%5===0||b%5===0)continue;
    const [x,z]=toW(a*85+rand(-6,6),b*85+rand(-6,6)),r=Math.hypot((x-CX)/2800,(z-CZ)/2300),n=fbm(x/900+5,z/900,2.2,3);
    if(r>1.05||nearRoad(x,z,40)||landD(x,z)<120)continue;
    if(r>.55){if(Math.random()>.85)continue;const k=2+((Math.random()*3)|0);for(let q=0;q<k;q++){const [hx,hz]=toW(a*85+rand(-26,26),b*85+rand(-26,26));add(hx,hz,rand(9,16),rand(9,15),rand(4,8),ROT+rand(-.04,.04))}continue}
    if(Math.random()>.95-r*.3)continue;
    const core=Math.max(0,1-r/.35),hb=core>0?50+core*95:14+n*44;add(x,z,rand(22,46),rand(22,46),hb*(.55+Math.random()*.9),ROT+rand(-.025,.025))}
  for(let z=-12500;z<-3600;z+=70){const ang=Math.atan((coastX(z+10)-coastX(z-10))/20);for(let dx=110;dx<700;dx+=70){const x=coastX(z)-dx+rand(-6,6),zz=z+rand(-6,6);if(Math.random()>.55||nearRoad(x,zz,35))continue;const condo=dx<240&&Math.random()<.35;add(x,zz,rand(18,34),rand(18,40),condo?24+Math.random()*24:6+Math.random()*9,ang)}}
  const dum=new THREE.Object3D();
  [[.5],[1.5],[4]].forEach(([vf],k)=>{const L=lists[k];if(!L.length)return;const f=k===2?glass:side,im=new THREE.InstancedMesh(cityGeo(vf),[f,f,roof,roof,f,f],L.length),PAL=PALS[k];
    L.forEach(([x,z,w,d,h,ro],i)=>{dum.position.set(x,0,z);dum.rotation.set(0,ro||0,0);dum.scale.set(w,h,d);dum.updateMatrix();im.setMatrixAt(i,dum.matrix);im.setColorAt(i,PAL[(Math.random()*PAL.length)|0])});
    im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;padG.add(im)});
  /* roads: each class at its own height so crossings never share a surface */
  const asph=std(0x111214,.95,0),gravel=std(0x2b2a26,1,0);
  const slab=(x,z,lx,lz,h,ro,m)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(lx,h,lz),m||asph);b.position.set(x,h/2,z);b.rotation.y=ro||0;b.receiveShadow=true;padG.add(b)};
  slab(-1740,0,3360,10,.30);slab(-3400,-2405,12,4810,.32);slab((-12000+HX1)/2,-4800,HX1+12000,22,.34);
  for(let a=-30;a<=30;a+=5){const [x,z]=toW(a*85,0);slab(x,z,13,Math.max(800,4300*Math.sqrt(Math.max(0,1-Math.pow(a*85/2800,2)))),.26,ROT)}
  for(let b=-25;b<=25;b+=5){const [x,z]=toW(0,b*85);slab(x,z,Math.max(800,5200*Math.sqrt(Math.max(0,1-Math.pow(b*85/2300,2)))),13,.28,ROT)}
  const cdx=VAB[0]+80+47,cdz=VAB[1]-110-65,cl=Math.hypot(cdx,cdz),phi=Math.atan2(cdx,cdz);
  for(const o of [-7.5,7.5])slab(-47+cdx/2+Math.cos(phi)*o,65+cdz/2-Math.sin(phi)*o,12,cl,.22,phi,gravel);
  /* pad support: propellant spheres, service buildings, perimeter fence */
  const sph=[[-150,-130,11],[160,-170,9]];for(const [x,z,r] of sph){padG.add(mesh(new THREE.SphereGeometry(r,32,20),MAT.white,x,r+4,z));for(let i=0;i<6;i++){const a=i/6*Math.PI*2;padG.add(mesh(new THREE.CylinderGeometry(.45,.45,r+4,8),MAT.grey,x+Math.cos(a)*r*.72,(r+4)/2,z+Math.sin(a)*r*.72))}}
  const bld=[[-120,40,30,12,20],[130,40,24,8,16],[90,-115,18,10,14],[-60,-150,40,7,12]];for(const [x,z,w,h,d] of bld)padG.add(mesh(new THREE.BoxGeometry(w,h,d),std(0xb8b6ae,.9,0),x,h/2,z));
  const fm=std(0x6c7077,.6,.6);for(let i=0;i<8;i++){const a=(i+.5)/8*Math.PI*2;if(Math.abs(Math.cos(a)+1)<.15)continue;const L=2*125*Math.tan(Math.PI/8),b=new THREE.Mesh(new THREE.BoxGeometry(L,2.2,.15),fm);b.position.set(Math.cos(a)*125,1.1,Math.sin(a)*125);b.rotation.y=-a+Math.PI/2;padG.add(b)}
  /* vegetation: pines and scrub inland, palms near the beach */
  const merge=geos=>{const P=[],N=[],U=[],I=[];let o=0;for(const g of geos){const gi=g.index?g:g.toNonIndexed();const pa=gi.attributes.position,na=gi.attributes.normal,ua=gi.attributes.uv;for(let i=0;i<pa.count;i++){P.push(pa.getX(i),pa.getY(i),pa.getZ(i));N.push(na.getX(i),na.getY(i),na.getZ(i));U.push(ua?ua.getX(i):0,ua?ua.getY(i):0)}if(gi.index)for(let i=0;i<gi.index.count;i++)I.push(gi.index.getX(i)+o);else for(let i=0;i<pa.count;i++)I.push(i+o);o+=pa.count}
    const m=new THREE.BufferGeometry();m.setAttribute("position",new THREE.Float32BufferAttribute(P,3));m.setAttribute("normal",new THREE.Float32BufferAttribute(N,3));m.setAttribute("uv",new THREE.Float32BufferAttribute(U,2));m.setIndex(I);return m};
  const pineG=new THREE.ConeGeometry(1,1,7);pineG.translate(0,.5,0);
  const bushG=new THREE.IcosahedronGeometry(1,0);bushG.translate(0,.45,0);
  const trunk=new THREE.CylinderGeometry(.18,.28,1,6);trunk.translate(0,.5,0);
  const fr=[];for(let i=0;i<7;i++){const b=new THREE.BoxGeometry(.18,.04,2.4);b.translate(0,0,1.1);b.rotateX(.35);b.rotateY(i/7*Math.PI*2);b.translate(0,1,0);fr.push(b)}const crownG=merge(fr);
  const NP=1700,NB=2400,NT=500,pines=new THREE.InstancedMesh(pineG,std(0xffffff,.95,0),NP),bush=new THREE.InstancedMesh(bushG,std(0xffffff,.95,0),NB),tr=new THREE.InstancedMesh(trunk,std(0x3a2c1d,.95,0),NT),cr=new THREE.InstancedMesh(crownG,std(0xffffff,.9,0,{side:THREE.DoubleSide}),NT);
  const PC=[0x0f210c,0x16300f,0x0c1a09].map(c=>new THREE.Color(c)),BC=[0x1d2a12,0x26331a,0x2f3a1a,0x1a2410].map(c=>new THREE.Color(c)),CC=[0x1c3a12,0x24451a,0x2d4a1c].map(c=>new THREE.Color(c));
  const blocked=(x,z,d)=>d<90||Math.hypot(x,z)<140||nearRoad(x,z,18)||(Math.abs(x-VAB[0])<130&&Math.abs(z-VAB[1])<150)||(Math.abs(x+1650)<50&&Math.abs(z-2850)<40)||Math.hypot((x-CX)/2900,(z-CZ)/2500)<1||Math.hypot(x+140,z-120)<14||Math.hypot(x-240,z-330)<70||segD(x,z,0,0,240,330)<50||sph.some(([sx,sz,r])=>Math.hypot(x-sx,z-sz)<r+14)||bld.some(([bx,bz,w,h,dd])=>Math.abs(x-bx)<w/2+8&&Math.abs(z-bz)<dd/2+8);
  let np=0,nb=0,nt=0;
  for(let k=0;k<30000&&(np<NP||nb<NB);k++){const x=rand(-5600,1400),z=rand(-6500,6500),d=landD(x,z);if(blocked(x,z,d)||(z<-3400&&d<780))continue;
    if(Math.random()<.42&&np<NP){const h=rand(6,13);dum.position.set(x,0,z);dum.rotation.set(0,0,0);dum.scale.set(h*.3,h,h*.3);dum.updateMatrix();pines.setMatrixAt(np,dum.matrix);pines.setColorAt(np,PC[(Math.random()*3)|0]);np++}
    else if(nb<NB){const h=rand(1.5,4);dum.position.set(x,0,z);dum.rotation.set(0,Math.random()*6.3,0);dum.scale.set(h*rand(.9,1.6),h*.6,h*rand(.9,1.6));dum.updateMatrix();bush.setMatrixAt(nb,dum.matrix);bush.setColorAt(nb,BC[(Math.random()*4)|0]);nb++}}
  for(let k=0;k<8000&&nt<NT;k++){const z=rand(-12800,6000),x=coastX(z)-rand(95,420),d=landD(x,z);if(blocked(x,z,d))continue;
    const h=rand(7,13);dum.position.set(x,0,z);dum.rotation.set(rand(-.06,.06),Math.random()*6.3,rand(-.06,.06));dum.scale.set(1,h,1);dum.updateMatrix();tr.setMatrixAt(nt,dum.matrix);
    dum.position.set(x,h-1,z);dum.scale.set(1.2,1.2,1.2);dum.updateMatrix();cr.setMatrixAt(nt,dum.matrix);cr.setColorAt(nt,CC[(Math.random()*3)|0]);nt++}
  for(const [im,n] of [[pines,np],[bush,nb],[tr,nt],[cr,nt]]){im.count=n;im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;padG.add(im)}
}
(()=>{const c=document.createElement("canvas");c.width=c.height=256;const g=c.getContext("2d"),img=g.createImageData(256,256);
  for(let j=0;j<256;j++)for(let i=0;i<256;i++){const n=fbm(i/40,j/40,3.3,4),o=(j*256+i)*4,v=196+n*58;px(img.data,o,v,v,v)}
  g.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=renderer.capabilities.getMaxAnisotropy();
  groundMat=std(0xffffff,1,0,{map:t,vertexColors:true});
  const strip=new THREE.Mesh(gridGeo(-500,3400,-60000,60000,95,480,landY,landCol,200),groundMat);strip.receiveShadow=true;padG.add(strip);
  const inland=new THREE.Mesh(gridGeo(-60000,-500,-60000,60000,60,120,()=>0,landCol,200),groundMat);inland.receiveShadow=true;padG.add(inland);
  seaMat=std(0x1b4a70,.16,.1,{normalMap:waveTex(),normalScale:new THREE.Vector2(.45,.45)});const sea=new THREE.Mesh(gridGeo(300,62000,-60000,60000,1,1,()=>-1,()=>[1,1,1],70),seaMat);padG.add(sea);
  buildCity();
  padG.add(mesh(new THREE.CylinderGeometry(70,76,3,56),MAT.concrete,0,1.5,0));padG.add(mesh(new THREE.BoxGeometry(12,.1,130),std(0x1c1b1a,1,0),0,3.15,0));padG.add(mesh(new THREE.BoxGeometry(18,6,18),MAT.concrete,0,6,0));
  for(const [x,z] of [[70,-60],[-70,-60],[0,85]])padG.add(mesh(new THREE.CylinderGeometry(.5,.8,130,8),MAT.grey,x,65,z));
  padG.add(mesh(new THREE.CylinderGeometry(1.6,1.6,48,12),MAT.grey,-140,24,120));padG.add(mesh(new THREE.SphereGeometry(8,24,16),MAT.white,-140,52,120));
  padG.add(mesh(new THREE.BoxGeometry(160,160,210),std(0xd6d6cf,.9,0),-1900,80,2600));padG.add(mesh(new THREE.BoxGeometry(60,30,40),std(0xcfcfc8,.9,0),-1650,15,2850));
  padG.add(mesh(new THREE.CylinderGeometry(3,3,2.4,24),MAT.concrete,38,1.2,34));
})();
const floods=[],floodLamps=new THREE.Group();padG.add(floodLamps);
for(const [x,z] of [[62,52],[-62,52],[62,-48],[-62,-48]]){
  if(z>0){const l=new THREE.SpotLight(0xfff0d2,0,460,.4,.6,1.2);l.position.set(x,46,z);l.target.position.set(0,46,0);padG.add(l);padG.add(l.target);floods.push(l)}
  floodLamps.add(mesh(new THREE.CylinderGeometry(.4,.5,46,8),MAT.grey,x,23,z));const lamp=new THREE.Mesh(new THREE.BoxGeometry(3.4,1.8,.6),new THREE.MeshBasicMaterial({color:0xfff6e2}));lamp.position.set(x,47,z);lamp.lookAt(0,46,0);floodLamps.add(lamp)}
let tower=null;
function buildTower(H,R){
  if(tower)padG.remove(tower);tower=new THREE.Group();padG.add(tower);
  const w=9,tz=-(R+8.5),top=H+21,beams=[],C=[[-w/2,-w/2],[w/2,-w/2],[w/2,w/2],[-w/2,w/2]],UP=new V3(0,1,0),dum=new THREE.Object3D();
  for(const c of C)beams.push([new V3(c[0],0,c[1]),new V3(c[0],top,c[1]),.7]);
  for(let y=0;y<top-1;y+=6)for(let i=0;i<4;i++){const a=C[i],b=C[(i+1)%4],y2=Math.min(y+6,top);beams.push([new V3(a[0],y,a[1]),new V3(b[0],y,b[1]),.4]);beams.push([new V3(a[0],y,a[1]),new V3(b[0],y2,b[1]),.25]);beams.push([new V3(b[0],y,b[1]),new V3(a[0],y2,a[1]),.25])}
  const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),MAT.tower,beams.length);im.castShadow=im.receiveShadow=true;
  beams.forEach(([a,b,t],i)=>{const d=b.clone().sub(a),L=d.length();dum.position.copy(a).add(b).multiplyScalar(.5);dum.quaternion.setFromUnitVectors(UP,d.normalize());dum.scale.set(t,L,t);dum.updateMatrix();im.setMatrixAt(i,dum.matrix)});
  im.position.set(0,3,tz);tower.add(im);
  const armLen=Math.max(1,-tz-w/2-R-.4),pivot=new THREE.Group();pivot.position.set(0,PADY+H-15,tz+w/2);pivot.add(mesh(new THREE.BoxGeometry(2.4,2.6,armLen),MAT.tower,0,0,armLen/2));tower.add(pivot);tower.userData.arm=pivot;
}

/* ================= themes / launch time ================= */
const THEMES={
  day:{top:0x2c5fae,hor:0xd4e3f1,fog:[.83,.89,.95],sunCol:0xfff0dd,sunI:2,sunPos:[240,380,260],hemiSky:0xbcd6ff,hemiGround:0x5a4a3a,hemiI:.6,ground:0xffffff,sea:0x1b4a70,stars:0,flood:0,smoke:[1,1,1],glow:[1,.85,.6],billow:[.88,.86,.83],eng:3,city:0},
  sunset:{top:0x23365f,hor:0xf2a36a,fog:[.9,.62,.46],sunCol:0xffa060,sunI:1.6,sunPos:[-420,70,160],hemiSky:0xffc29a,hemiGround:0x3a2a2a,hemiI:.5,ground:0xc9a98e,sea:0x2a3a5a,stars:.12,flood:.6,smoke:[1,.86,.76],glow:[1,.55,.25],billow:[.95,.8,.7],eng:4,city:.7},
  night:{top:0x01040b,hor:0x142038,fog:[.06,.08,.14],sunCol:0xa8bce4,sunI:.38,sunPos:[240,380,260],hemiSky:0x2a3a5c,hemiGround:0x0b0c11,hemiI:.32,ground:0x4a5560,sea:0x08182a,stars:.9,flood:1.5,smoke:[.36,.37,.45],glow:[.7,.8,1],billow:[.78,.6,.5],eng:6,city:1.5}
};
let TH=THEMES.day;const SUNOFF=new V3().copy(SUN_PAD);
function isDark(){const t=document.documentElement.getAttribute("data-theme");return t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches}
function applyTheme(){
  TH=S.time==="auto"?(isDark()?THEMES.night:THEMES.day):THEMES[S.time];if(inSpace||landing||hall.visible)return;
  skyU.top.value.set(TH.top);skyU.hor.value.set(TH.hor);skyU.glow.value.setRGB(...TH.glow);SUNOFF.set(...TH.sunPos);skyU.sunDir.value.copy(SUNOFF).normalize();
  if(scene.fog)scene.fog.color.setRGB(...TH.fog);sun.color.set(TH.sunCol);sun.intensity=TH.sunI;if(phase==="hangar")sun.position.copy(SUNOFF);
  hemi.color.set(TH.hemiSky);hemi.groundColor.set(TH.hemiGround);hemi.intensity=TH.hemiI;groundMat.color.set(TH.ground);seaMat.color.set(TH.sea);
  floods.forEach(l=>l.intensity=TH.flood);if(cityLit)cityLit.forEach(m=>m.emissiveIntensity=TH.city);floodLamps.visible=TH.flood>0;starsFg.material.opacity=TH.stars;smoke.mat.uniforms.tint.value.setRGB(...TH.smoke);
}
matchMedia("(prefers-color-scheme: dark)").addEventListener("change",applyTheme);
new MutationObserver(applyTheme).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});

/* ================= rocket model from parts ================= */
function livery(r,len,kind,label,flag){
  const cw=512,ch=clamp(Math.round(512*len/(2*Math.PI*r)),64,4096),c=document.createElement("canvas");c.width=cw;c.height=ch;const g=c.getContext("2d");
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;let seed=r*97+len*13;const rr=()=>((seed=(seed*16807+11)%2147483647)/2147483647);
  t.lwDraw=soot=>{seed=r*97+len*13;
    g.fillStyle=kind==="orange"?"#c06a28":kind==="steel"?"#c3c8ce":"#ecebe6";g.fillRect(0,0,cw,ch);
    if(kind==="orange")for(let i=0;i<900;i++){g.fillStyle=`rgba(${rr()<.5?90:230},${rr()<.5?40:120},20,${rr()*.08})`;g.beginPath();g.arc(rr()*cw,rr()*ch,2+rr()*10,0,7);g.fill()}
    g.strokeStyle=kind==="steel"?"rgba(60,64,70,.35)":"rgba(0,0,0,.10)";g.lineWidth=kind==="steel"?3:2;const ring=Math.max(28,ch/14);
    for(let y=ring;y<ch;y+=ring){g.beginPath();g.moveTo(0,y);g.lineTo(cw,y);g.stroke()}for(let x=0;x<cw;x+=cw/8){g.beginPath();g.moveTo(x,0);g.lineTo(x,ch);g.stroke()}
    for(let i=0;i<40;i++){g.fillStyle=`rgba(70,62,52,${rr()*.05})`;g.fillRect(rr()*cw,rr()*ch,2+rr()*5,ch*rr()*.25)}
    if(kind==="white"){g.fillStyle="#17181b";g.fillRect(0,ch*.035,cw,Math.max(4,ch*.01))}
    if(label){g.save();g.translate(cw*.13,ch*.5);g.rotate(-Math.PI/2);g.fillStyle=kind==="orange"?"#2a1206":"#1a1c21";g.font=`bold ${Math.round(cw*.058)}px Arial,Helvetica,sans-serif`;g.textAlign="center";g.textBaseline="middle";g.fillText(label,0,0);g.restore()}
    if(flag&&false){const fw=cw*.075,fh=fw*1.9,fx=cw*.095,fy=ch*.12;for(let i=0;i<13;i++){g.fillStyle=i%2?"#f4f4f4":"#b22234";g.fillRect(fx+i*fw/13,fy,fw/13+.5,fh)}g.fillStyle="#3c3b6e";g.fillRect(fx,fy,fw*.54,fh*.4)}
    if(soot>0){const gr=g.createLinearGradient(0,ch,0,ch*(1-.5*soot));gr.addColorStop(0,`rgba(22,19,16,${.75*soot})`);gr.addColorStop(1,"rgba(22,19,16,0)");g.fillStyle=gr;g.fillRect(0,0,cw,ch)}
    t.needsUpdate=true};
  t.lwDraw(0);return t}
function tankDims(prop,fuel){const vol=prop/FUEL[fuel].dens,r=vol<30?1.2:vol<600?1.85:vol<1050?2.6:vol<3000?4.2:5.1;return{r,len:Math.max(3,vol/(Math.PI*r*r)*1.15)}}
function bellLayout(n,r){if(n===1)return[[0,0]];const out=[];const ring=n>=5&&n%2===1?n-1:n;if(ring!==n)out.push([0,0]);for(let i=0;i<ring;i++){const a=i/ring*Math.PI*2;out.push([Math.sin(a)*r*.62,Math.cos(a)*r*.62])}return out}
let rk=null,PADY=9;
function makeRocket(cfg){
  const g=new THREE.Group(),plumes=[],stages=[],boosters=[],halves=[];let y=0,maxR=0,foot=0;
  cfg.stages.forEach((s,i)=>{
    const e=ENG[s.eng],{r,len}=tankDims(s.tank,e.fuel),sg=new THREE.Group();sg.position.y=y;g.add(sg);maxR=Math.max(maxR,r);
    const kind=e.fuel==="methalox"?"steel":e.fuel==="hydrolox"&&r>=4?"orange":"white",lv=livery(r,len,kind,i===0?"LAUNCH WINDOW":i===cfg.stages.length-1&&i>0?"TORREY PINES":"",i===0&&kind!=="orange");
    const mat=kind==="steel"?std(0xffffff,.3,.85,{map:lv}):kind==="orange"?std(0xffffff,.78,0,{map:lv}):std(0xffffff,.42,.05,{map:lv});sg.userData.livery=lv;
    const bandH=Math.min(2.5,len*.1);sg.add(cyl(r*1.01,r*1.01,bandH,i===0?MAT.black:MAT.dark,0));sg.add(cyl(r,r,len-bandH,mat,bandH));
    const bl=e.vac?Math.min(r*.75,1.1):Math.min(.5*Math.sqrt(e.tvac/914),r*(s.n>1?.32:.6)),bh=e.vac?bl*2.6:bl*2.4;
    bellLayout(s.n,r).forEach(([x,z])=>sg.add(mesh(new THREE.CylinderGeometry(bl*.42,bl,bh,16),MAT.dark,x,-bh/2,z)));if(i===0)foot=Math.max(foot,bh);
    addPlume(plumes,sg,-bh,Math.min(r*.9,bl*Math.sqrt(s.n)*.9),e.plume,"s"+i);
    const next=cfg.stages[i+1];let top=len;
    if(next){const nr=tankDims(next.tank,ENG[next.eng].fuel).r,ih=Math.max(2,nr<r?3:2.5);sg.add(mesh(new THREE.CylinderGeometry(nr,r,ih,40),i===0?MAT.black:MAT.dark,0,len+ih/2,0));top+=ih;
      if(ENG[next.eng].vac)top+=0;}
    stages.push({g:sg,r,len:top,base:y,lv:sg.userData.livery});y+=top;
  });
  const bo=BOOST[cfg.boost],s0=stages[0];
  if(bo.kind){const n=bo.n;for(let k=0;k<n;k++){
    const bg=new THREE.Group(),a=n===2?(k?Math.PI:0):k*Math.PI/2;let br,bl;
    if(bo.kind==="solid"){const S=SOLIDS[bo.size];br=S.r;bl=S.len;bg.add(cyl(br,br*1.3,3,MAT.white,0));bg.add(cyl(br,br,bl-3,MAT.white,3));bg.add(nose(br,br*3,MAT.white,bl));bg.add(mesh(new THREE.CylinderGeometry(br*.4,br*.85,2,16),MAT.dark,0,-1,0));foot=Math.max(foot,2);addPlume(plumes,bg,-2,br*.95,"srb","b")}
    else{const s=cfg.stages[0],e=ENG[s.eng];const d=tankDims(s.tank,e.fuel);br=d.r;bl=d.len;const blv=livery(br,bl,"white","",false);bg.userData.livery=blv;bg.add(cyl(br*1.01,br*1.01,2.5,MAT.black,0));bg.add(cyl(br,br,bl-2.5,std(0xffffff,.42,.05,{map:blv}),2.5));bg.add(cyl(br,br,2,MAT.black,bl));bg.add(nose(br,br*2.7,MAT.white,bl+2));
      const bb=Math.min(.5*Math.sqrt(e.tvac/914),br*(s.n>1?.32:.6));bellLayout(s.n,br).forEach(([x,z])=>bg.add(mesh(new THREE.CylinderGeometry(bb*.42,bb,bb*2.4,16),MAT.dark,x,-bb*1.2,z)));foot=Math.max(foot,bb*2.4);addPlume(plumes,bg,-bb*2.4,Math.min(br*.9,bb*Math.sqrt(s.n)*.9),ENG[s.eng].plume,"b")}
    const d=s0.r+br+.15;bg.position.set(Math.cos(a)*d,0,Math.sin(a)*d);bg.userData.dir=new V3(Math.cos(a),0,Math.sin(a));g.add(bg);boosters.push(bg)}}
  const topS=stages[stages.length-1],Rf=Math.max(2.6,topS.r),fb=y,top=new THREE.Group();top.position.y=fb;g.add(top);
  const btH=Rf>topS.r?1.8:.01,fH=8,nH=Rf*2.5;
  for(let k=0;k<2;k++){const h=new THREE.Group(),ts=k*Math.PI;h.userData.sign=k?-1:1;h.add(cyl(Rf,topS.r,btH,MAT.whiteDS,0,40,ts,Math.PI,true));h.add(cyl(Rf,Rf,fH,MAT.whiteDS,btH,40,ts,Math.PI,true));h.add(nose(Rf,nH,MAT.whiteDS,btH+fH,ts,Math.PI));top.add(h);halves.push(h)}
  const slot=new THREE.Object3D();slot.position.y=.3;top.add(slot);
  const eye=new THREE.Object3D();eye.position.set(Rf+.55,btH+fH-2,0);top.add(eye);
  const H=fb+btH+fH+nH;
  g.userData={H,R:maxR,Rf,stages,boosters,halves,top,slot,eye,plumes,foot};
  return g;
}
function buildRocket(){
  if(rk)scene.remove(rk);rk=makeRocket(S.rocket);PADY=9+rk.userData.foot+.05;rk.position.set(0,PADY,0);scene.add(rk);buildTower(rk.userData.H,Math.max(rk.userData.Rf,rk.userData.R));
  if(phase==="hangar"){focusObj=rk;focusOff.set(0,rk.userData.H*.5,0);eyeObj=rk.userData.eye;if(S.tab!=="sc")cam.dist=rk.userData.H*1.4}
}

/* ================= spacecraft model ================= */
let probe=null,preview=null;
const setDep=(p,v)=>p.userData.axis==="all"?p.scale.setScalar(v):p.scale[p.userData.axis]=v;
function makeProbe(){
  const g=new THREE.Group(),dep=[],d=DEST[S.dest],c=S.sc,bus=BUS[c.bus],sz=c.bus==="small"?1.6:c.bus==="large"?2.8:2.2,inst=scDesign().inst;
  g.add(mesh(new THREE.BoxGeometry(sz,sz*1.2,sz),MAT.gold,0,sz*.6,0));
  g.add(mesh(new THREE.CylinderGeometry(.28,c.prop==="ion"?.5:.62,.9,20),c.prop==="ion"?MAT.grey:MAT.dark,0,-.45,0));
  const A=ANT[c.ant],dr=c.ant==="hga"?1.5:c.ant==="mga"?.6:.12;
  const dish=mesh(new THREE.LatheGeometry([...Array(9)].map((_,i)=>new THREE.Vector2(Math.max(.01,i/8*dr),(i/8)*(i/8)*dr*.3)),32),MAT.dish,-sz/2-.2,sz*.65,0);dish.rotation.z=Math.PI/2;g.add(dish);
  if(c.solar!=="none"){const L=3+SOLAR[c.solar].kw*.55;for(const s of [-1,1]){const pv=new THREE.Group();pv.position.set(0,sz*.65,s*(sz/2+.02));pv.userData.axis="z";const segs=Math.max(2,Math.round(L/2.2));
    for(let i=0;i<segs;i++)pv.add(mesh(new THREE.BoxGeometry(1.9,.06,L/segs-.12),MAT.panel,0,0,s*((i+.5)*L/segs)));pv.add(mesh(new THREE.BoxGeometry(.12,.12,L),MAT.silver,0,0,s*L/2));g.add(pv);dep.push(pv)}}
  for(let n=0;n<c.rtg;n++){const pv=new THREE.Group();pv.position.set(n?.5:-.5,.4,-sz/2);pv.userData.axis="z";pv.add(mesh(new THREE.CylinderGeometry(.05,.05,2.6,8),MAT.silver,0,0,-1.3).rotateX(Math.PI/2));
    const r=mesh(new THREE.CylinderGeometry(.26,.26,1.1,16),MAT.rtg,0,0,-2.8);r.rotation.x=Math.PI/2;pv.add(r);for(let i=0;i<6;i++){const f=mesh(new THREE.BoxGeometry(.04,.9,1.1),MAT.rtg,0,0,-2.8);f.rotation.z=i*Math.PI/6;pv.add(f)}g.add(pv);dep.push(pv)}
  const topY=sz*1.2;let slotX=-sz/2+.35,slotZ=sz/2-.4;
  const box=(w,h,dd,m)=>{if(slotX+w>sz/2){slotX=-sz/2+.35;slotZ-=.8}const b=mesh(new THREE.BoxGeometry(w,h,dd),m,slotX+w/2,topY+h/2,slotZ);slotX+=w+.15;g.add(b)};
  if(inst.includes("cam"))box(.45,.45,.45,MAT.black);if(inst.includes("hires"))box(.6,.9,.6,MAT.black);if(inst.includes("spec"))box(.55,.4,.6,MAT.grey);if(inst.includes("alt"))box(.35,.35,.35,MAT.dark);
  if(inst.includes("gamma"))box(.4,.6,.4,MAT.silver);if(inst.includes("massspec"))box(.5,.5,.5,MAT.grey);
  if(inst.includes("radar"))for(const s of [-1,1]){const pv=new THREE.Group();pv.position.set(sz/2-.2,0,s*sz*.4);pv.userData.axis="y";pv.add(mesh(new THREE.CylinderGeometry(.06,.06,8,6),MAT.silver,0,-4,0));pv.rotation.x=s*-.6;g.add(pv);dep.push(pv)}
  if(inst.includes("mag")){const pv=new THREE.Group();pv.position.set(.4,sz*.9,sz/2);pv.rotation.x=Math.PI/2-.3;pv.userData.axis="y";pv.add(mesh(new THREE.CylinderGeometry(.07,.07,5,6),MAT.silver,0,2.5,0));pv.add(mesh(new THREE.BoxGeometry(.3,.3,.3),MAT.black,0,5,0));g.add(pv);dep.push(pv)}
  if(inst.includes("vault"))g.add(mesh(new THREE.BoxGeometry(sz*.5,sz*.45,.25),MAT.silver,0,sz*.6,sz/2+.1));
  if(inst.includes("shade")){const pv=new THREE.Group();pv.position.set(sz/2+.6,sz*.6,0);pv.userData.axis="all";pv.add(mesh(new THREE.BoxGeometry(.08,sz*1.8,sz*1.8),MAT.white));g.add(pv);dep.push(pv)}
  if(inst.includes("probe")){const p=mesh(new THREE.SphereGeometry(.6,24,12,0,Math.PI*2,0,Math.PI/2),MAT.silver,-sz*.15,topY,-sz*.1);g.add(p)}
  let lander=null;
  if(S.type==="lander"){lander=new THREE.Group();lander.position.y=topY+(inst.length?.9:0);
    lander.add(mesh(new THREE.CylinderGeometry(1.1,1.35,.9,8),MAT.silver,0,1.05,0));lander.add(mesh(new THREE.CylinderGeometry(.35,.5,.3,12),MAT.dark,0,.45,0));
    for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4,sa=Math.sin(a),ca=Math.cos(a),top=new THREE.Vector3(sa*1.15,.85,ca*1.15),foot=new THREE.Vector3(sa*1.75,.08,ca*1.75),d=top.clone().sub(foot),l=mesh(new THREE.CylinderGeometry(.06,.06,d.length(),6),MAT.grey,0,0,0);
      l.position.copy(top).add(foot).multiplyScalar(.5);l.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());lander.add(l);
      const st=new THREE.Vector3(sa*1.2,.62,ca*1.2),sd=st.clone().sub(foot),s2=mesh(new THREE.CylinderGeometry(.035,.035,sd.length(),6),MAT.grey,0,0,0);s2.position.copy(st).add(foot).multiplyScalar(.5);s2.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),sd.normalize());s2.rotateY(.5);lander.add(s2);
      lander.add(mesh(new THREE.CylinderGeometry(.2,.24,.08,12),MAT.grey,sa*1.75,.04,ca*1.75))}
    if(inst.includes("drill"))lander.add(mesh(new THREE.CylinderGeometry(.06,.06,1.6,6),MAT.dark,.6,1.9,0));
    if(inst.includes("seis"))lander.add(mesh(new THREE.CylinderGeometry(.25,.3,.3,12),MAT.gold,-.5,1.65,.3));
    if(inst.includes("rover")){const rv=new THREE.Group();rv.add(mesh(new THREE.BoxGeometry(1.2,.4,.9),MAT.white,0,.45,0));for(const [x,z] of [[-.5,-.5],[0,-.5],[.5,-.5],[-.5,.5],[0,.5],[.5,.5]])rv.add(mesh(new THREE.CylinderGeometry(.2,.2,.15,12),MAT.dark,x,.2,z).rotateX(Math.PI/2));rv.add(mesh(new THREE.CylinderGeometry(.04,.04,.7,6),MAT.grey,.4,.95,0));rv.position.set(0,1.5,0);lander.add(rv);lander.userData.rover=rv}
    if(inst.includes("heli")){const hl=new THREE.Group();hl.add(mesh(new THREE.BoxGeometry(.2,.2,.2),MAT.grey,0,.3,0));for(const s of [0,1]){const b=mesh(new THREE.BoxGeometry(1.2,.02,.08),MAT.dark,0,.5+s*.12,0);b.rotation.y=s*Math.PI/2;hl.add(b)}hl.position.set(-.5,1.5,-.4);lander.add(hl);lander.userData.heli=hl}
    g.add(lander);
    const ly=lander.position.y+.6,ring=mesh(new THREE.TorusGeometry(.95,.07,8,24),MAT.grey,0,ly,0);ring.rotation.x=Math.PI/2;g.add(ring);
    for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4,b0=new THREE.Vector3(Math.sin(a)*sz*.58,topY,Math.cos(a)*sz*.58),b1=new THREE.Vector3(Math.sin(a)*.95,ly,Math.cos(a)*.95),dv=b1.clone().sub(b0),st=mesh(new THREE.CylinderGeometry(.05,.05,dv.length(),6),MAT.grey,0,0,0);
      st.position.copy(b0).add(b1).multiplyScalar(.5);st.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dv.normalize());g.add(st)}}
  dep.forEach(p=>setDep(p,.03));
  const eye=new THREE.Object3D();eye.position.set(sz/2+1.2,sz*.9,0);g.add(eye);
  const pl=[];addPlume(pl,g,-.9,.45,"vac","sc");
  g.userData={dep,eye,lander,plumes:pl,size:sz};
  return g;
}
function refreshPreview(){if(preview)scene.remove(preview);preview=makeProbe();preview.userData.dep.forEach(p=>setDep(p,1));{const bs=S.sc.bus==="small"?1.6:S.sc.bus==="large"?2.8:2.2,ad=mesh(new THREE.CylinderGeometry(bs*.42,1.6,1.05,32,1,true),std(0x9aa1a8,.5,.6,{side:THREE.DoubleSide}),0,-.52,0);preview.add(ad);
  const rg=mesh(new THREE.TorusGeometry(bs*.42,.06,8,32),MAT.grey,0,0,0);rg.rotation.x=Math.PI/2;preview.add(rg)}
  preview.position.set(34,13.05,24);preview.rotation.y=.6;scene.add(preview);if(S.tab==="sc"){focusObj=preview;focusOff.set(0,1.5,0);cam.dist=14}}
function focusForTab(){if(phase!=="hangar")return;if(S.tab==="sc"&&preview){focusObj=preview;focusOff.set(0,1.5,0);cam.dist=14}else{focusObj=rk;focusOff.set(0,rk.userData.H*.5,0);cam.dist=rk.userData.H*1.4}}

/* ================= space backdrop (km) ================= */
const RE=6378,SUN_DIR=new V3(-.35,.6,.72).normalize();
const bgSun=new THREE.DirectionalLight(0xfff4e6,1.6);bgSun.position.copy(SUN_DIR);bg.add(bgSun);bg.add(new THREE.AmbientLight(0x223044,.12));
function atmo(R,col,k){return new THREE.Mesh(new THREE.SphereGeometry(R,64,32),new THREE.ShaderMaterial({uniforms:{col:{value:new THREE.Color(col)},sunDir:{value:SUN_DIR},k:{value:k}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:`#include <common>
#include <logdepthbuf_pars_vertex>
varying vec3 vN;varying vec3 vP;varying vec3 vW;void main(){vN=normalize(normalMatrix*normal);vW=normalize(mat3(modelMatrix)*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vP=mv.xyz;gl_Position=projectionMatrix*mv;
#include <logdepthbuf_vertex>
}`,
  fragmentShader:`#include <logdepthbuf_pars_fragment>
uniform vec3 col,sunDir;uniform float k;varying vec3 vN;varying vec3 vP;varying vec3 vW;void main(){
#include <logdepthbuf_fragment>
float r=1.-abs(dot(vN,normalize(-vP)));float i=pow(r,5.)*k;float lit=clamp(dot(vW,sunDir)*.9+.3,0.,1.);gl_FragColor=vec4(col*i*lit,1.);}`}))}
const earthG=new THREE.Group();earthG.rotation.x=-Math.PI/2;bg.add(earthG);
let clouds=null,destG=null,dust=null,giant=null;const sunSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xffe6c0,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));sunSprite.scale.setScalar(1.6e5);bg.add(sunSprite);
const sunCore=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xffffff,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));sunCore.scale.setScalar(3.5e4);bg.add(sunCore);
const detailTex=(()=>{const N=256,c=document.createElement("canvas");c.width=c.height=N;const g=c.getContext("2d"),img=g.createImageData(N,N),acc=new Float32Array(N*N);let amp=1,tot=0;
  for(const cell of [4,8,16,32,64,128]){const G=new Float32Array(cell*cell).map(()=>Math.random());const sc=N/cell;
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const gx=x/sc,gy=y/sc,x0=Math.floor(gx),y0=Math.floor(gy),fx=gx-x0,fy=gy-y0,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),
      a=G[(y0%cell)*cell+x0%cell],b=G[(y0%cell)*cell+(x0+1)%cell],c2=G[((y0+1)%cell)*cell+x0%cell],d=G[((y0+1)%cell)*cell+(x0+1)%cell];acc[y*N+x]+=amp*((a*(1-sx)+b*sx)*(1-sy)+(c2*(1-sx)+d*sx)*sy)}tot+=amp;amp*=.55}
  for(let i=0;i<N*N;i++){const v=Math.round(acc[i]/tot*255);img.data[i*4]=img.data[i*4+1]=img.data[i*4+2]=v;img.data[i*4+3]=255}g.putImageData(img,0,0);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t})();
function addDetail(mat,cloud){mat.onBeforeCompile=sh=>{sh.uniforms.detailMap={value:detailTex};
  sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nuniform sampler2D detailMap;");
  if(cloud)sh.fragmentShader=sh.fragmentShader.replace("#include <alphamap_fragment>",`#include <alphamap_fragment>
  {float fd=1.-smoothstep(900.,6000.,length(vViewPosition));float n=texture2D(detailMap,vUv*vec2(260.,130.)).r;n=clamp((n-.5)*1.8+.5,0.,1.);float edge=1.-smoothstep(.45,.9,diffuseColor.a);diffuseColor.a*=mix(1.,.55+.9*n,fd*.6*edge);}`);
  else sh.fragmentShader=sh.fragmentShader.replace("#include <map_fragment>",`#include <map_fragment>
  {float fd=1.-smoothstep(1500.,8000.,length(vViewPosition));
   float n1=texture2D(detailMap,vUv*vec2(160.,80.)).r,n2=texture2D(detailMap,vUv*vec2(900.,450.)+.37).r,n3=texture2D(detailMap,vUv*vec2(5000.,2500.)+.71).r;
   n1=clamp((n1-.5)*3.2+.5,0.,1.);n2=clamp((n2-.5)*3.+.5,0.,1.);n3=clamp((n3-.5)*2.6+.5,0.,1.);
   float land=smoothstep(.55,.8,texture2D(roughnessMap,vUv).g);
   vec3 c=diffuseColor.rgb;float lum=dot(c,vec3(.3,.59,.11));float green=clamp((c.g-max(c.r,c.b))*6.,0.,1.);
   float det=(.72+.56*n1)*(.78+.44*n2)*(.88+.24*n3);
   vec3 tint=mix(vec3(1.),mix(vec3(1.06,1.,.9),vec3(.85,1.05,.8),green),(n2-.5)*1.4+.5);
   vec3 land_c=c*det*tint;vec3 sea_c=c*(.93+.14*n2);
   diffuseColor.rgb=mix(c,mix(sea_c,land_c,land),fd);}`)};mat.needsUpdate=true}
function buildEarth(done){
  const ld=new THREE.TextureLoader(),T={};let left=3,fail=false;
  const fin=()=>{if(--left)return;
    const sph=new THREE.Mesh(new THREE.SphereGeometry(RE,160,80),fail?std(0xffffff,.85,0,{map:tex("earth")}):(()=>{const m=std(0xffffff,1,0,{map:T.day,roughnessMap:T.rough});addDetail(m,false);return m})());sph.rotation.y=-.1745;earthG.add(sph);
    clouds=new THREE.Mesh(new THREE.SphereGeometry(RE*1.004,128,64),fail?std(0xffffff,1,0,{map:tex("clouds"),transparent:true,depthWrite:false}):(()=>{const m=std(0xffffff,1,0,{alphaMap:T.clouds,transparent:true,depthWrite:false,opacity:.92});addDetail(m,true);return m})());clouds.rotation.y=-.1745;earthG.add(clouds);
    earthG.add(atmo(RE*1.012,0x4f8cff,.9));done&&done()};
  for(const k of ["day","clouds","rough"])ld.load(EARTH_IMG[k],t=>{if(k==="day")t.encoding=THREE.sRGBEncoding;t.anisotropy=renderer.capabilities.getMaxAnisotropy();T[k]=t;fin()},undefined,()=>{fail=true;fin()});
}
const ATMO={venus:[0xf0d8a0,1.4],mars:[0xff9a6a,.9],titan:[0xd89a40,1.8]};
function buildDest(k){
  if(destG)bg.remove(destG);if(giant){bg.remove(giant);giant=null}dust=null;
  const d=DEST[k];destG=new THREE.Group();destG.rotation.x=Math.PI/2;destG.add(new THREE.Mesh(new THREE.SphereGeometry(d.R,96,48),std(0xffffff,.95,0,{map:tex(k)})));
  if(ATMO[k])destG.add(atmo(d.R*1.03,ATMO[k][0],ATMO[k][1]));
  if(k==="mars"){dust=new THREE.Mesh(new THREE.SphereGeometry(d.R*1.012,64,32),std(0xffffff,1,0,{map:tex("dust"),transparent:true,opacity:0,depthWrite:false}));destG.add(dust)}
  destG.visible=false;bg.add(destG);
  if(k==="europa"){giant=new THREE.Mesh(new THREE.SphereGeometry(71492,96,48),std(0xffffff,.9,0,{map:tex("jupiter")}));giant.visible=false;bg.add(giant)}
  if(k==="titan"){giant=new THREE.Group();giant.add(new THREE.Mesh(new THREE.SphereGeometry(60268,96,48),std(0xffffff,.9,0,{map:tex("saturn")})));
    const rg=new THREE.RingGeometry(74500,136800,128,1),c=document.createElement("canvas");c.width=256;c.height=1;const gg=c.getContext("2d");for(let i=0;i<256;i++){const a=.25+.55*fbm(i/18,.5,.5,3)*(i>150&&i<165?.1:1);gg.fillStyle=`rgba(220,200,160,${a})`;gg.fillRect(i,0,1,1)}
    const rt=new THREE.CanvasTexture(c),pos=rg.attributes.position,uv=rg.attributes.uv;for(let i=0;i<pos.count;i++){const r=Math.hypot(pos.getX(i),pos.getY(i));uv.setXY(i,(r-74500)/(136800-74500),.5)}
    const ring=new THREE.Mesh(rg,new THREE.MeshBasicMaterial({map:rt,transparent:true,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=Math.PI/2-.47;giant.add(ring);giant.visible=false;bg.add(giant)}
}

/* ================= landing surface ================= */
const surfG=new THREE.Group();surfG.visible=false;scene.add(surfG);let surfMat=null;
const SURF={moon:[150,150,146],mercury:[120,112,104],mars:[176,96,58],ceres:[86,86,90],europa:[226,214,190],venus:[120,84,50],titan:[150,104,54]};
const SKY={moon:0x000000,mercury:0x000000,ceres:0x000000,europa:0x02030a,mars:0xc9a27e,venus:0xc99a4a,titan:0xc98a3a};
function buildSurface(k){
  surfG.clear();const c=document.createElement("canvas");c.width=c.height=256;const g=c.getContext("2d"),img=g.createImageData(256,256),[R,G,B]=SURF[k];
  for(let j=0;j<256;j++)for(let i=0;i<256;i++){let n=fbm(i/32,j/32,7.7,5);const cr=vn(i/14,j/14,1.3);if(cr>.82)n*=.8;else if(cr>.78)n*=1.15;const o=(j*256+i)*4;px(img.data,o,R*(.7+n*.6),G*(.7+n*.6),B*(.7+n*.6))}
  g.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(160,160);t.encoding=THREE.sRGBEncoding;
  surfMat=std(0xffffff,1,0,{map:t});const p=new THREE.Mesh(new THREE.PlaneGeometry(40000,40000),surfMat);p.rotation.x=-Math.PI/2;p.receiveShadow=true;surfG.add(p);
  for(let i=0;i<40;i++){const r=rand(1,6),b=mesh(new THREE.DodecahedronGeometry(r,0),surfMat,rand(-300,300),r*.3,rand(-300,300));surfG.add(b)}
}
