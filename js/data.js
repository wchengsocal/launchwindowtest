"use strict";
/* ================= game data ================= */
const DEST={
  moon:{name:"Moon",the:"the Moon",au:.00257,flux:1361,g:1.6,R:1737.5,dep:3.15,cap:.8,land:1.9,days:3,mult:1,atm:0,v0:110},
  venus:{name:"Venus",au:.7,flux:2601,g:8.9,R:6051.8,dep:3.5,cap:1.5,land:.1,days:150,mult:1.4,atm:2,v0:8},
  mercury:{name:"Mercury",au:1,flux:9083,g:3.7,R:2439.5,dep:5.5,cap:2.5,land:3,days:2400,mult:1.8,atm:0,v0:120},
  mars:{name:"Mars",au:1.5,flux:586,g:3.7,R:3396.2,dep:3.6,cap:1,land:.6,days:210,mult:1.6,atm:1,v0:80},
  ceres:{name:"Ceres",au:2.8,flux:177,g:.28,R:469.7,dep:4.9,cap:4,land:.3,days:1300,mult:2,atm:0,v0:45},
  europa:{name:"Europa",au:5.2,flux:50,g:1.3,R:1560.8,dep:6.3,cap:2,land:1.5,days:2000,mult:2.5,atm:0,v0:100},
  titan:{name:"Titan",au:9.5,flux:15,g:1.35,R:2574.7,dep:7.3,cap:.7,land:.05,days:2550,mult:2.8,atm:2,v0:5}
};
const nm=d=>d.the||d.name;
const transit=d=>d<30?d+" days":d<700?Math.round(d/30)+" months":(d/365).toFixed(1)+" years";
const SITE={
  cape:{name:"Cape Canaveral",sub:"28.5° N · Earth's spin adds 408 m/s",spin:408,leo:9.4},
  kourou:{name:"Kourou",sub:"5.2° N · near the equator, spin adds 463 m/s",spin:463,leo:9.35},
  vandenberg:{name:"Vandenberg",sub:"Polar orbit · Earth's spin doesn't help",spin:0,leo:9.8}
};
const FUEL={kerolox:{name:"kerosene + LOX",dry:.055,cost:.06,dens:1.03},methalox:{name:"methane + LOX",dry:.06,cost:.05,dens:.83},hydrolox:{name:"hydrogen + LOX",dry:.09,cost:.3,dens:.36},hypergolic:{name:"hypergolic",dry:.07,cost:.12,dens:1.2}};
const ENG={
  merlin:{name:"Merlin 1D",fuel:"kerolox",tsl:845,tvac:914,isl:282,ivac:311,mass:.47,cost:1,plume:"kero"},
  mvac:{name:"Merlin Vacuum",fuel:"kerolox",tsl:420,tvac:981,isl:150,ivac:348,mass:.49,cost:2,plume:"vac",vac:1},
  rd180:{name:"RD-180",fuel:"kerolox",tsl:3830,tvac:4150,isl:311,ivac:338,mass:5.4,cost:25,plume:"kero"},
  f1:{name:"F-1",fuel:"kerolox",tsl:6770,tvac:7770,isl:263,ivac:304,mass:8.4,cost:90,plume:"kero"},
  raptor:{name:"Raptor 2",fuel:"methalox",tsl:2256,tvac:2450,isl:327,ivac:347,mass:1.6,cost:2,plume:"metha"},
  rs25:{name:"RS-25",fuel:"hydrolox",tsl:1860,tvac:2279,isl:366,ivac:452,mass:3.53,cost:100,plume:"h2"},
  j2:{name:"J-2",fuel:"hydrolox",tsl:486,tvac:1033,isl:200,ivac:421,mass:1.6,cost:20,plume:"vac",vac:1},
  rl10:{name:"RL10",fuel:"hydrolox",tsl:40,tvac:110,isl:200,ivac:465,mass:.3,cost:15,plume:"vac",vac:1},
  aj10:{name:"AJ10",fuel:"hypergolic",tsl:20,tvac:43,isl:150,ivac:319,mass:.1,cost:3,plume:"vac",vac:1}
};
const COUNTS=[1,2,3,4,5,7,9], TANKS=[5,25,50,100,250,400,1000,2000];
const SOLIDS={small:{name:"GEM 63-class",tsl:1660,tvac:1750,isl:245,ivac:275,prop:44,dry:5,cost:8,r:.8,len:20},large:{name:"5-segment",tsl:16000,tvac:16700,isl:237,ivac:269,prop:630,dry:100,cost:100,r:1.85,len:54}};
const BOOST={none:{name:"None"},solid2:{name:"2 small solid boosters",kind:"solid",size:"small",n:2},solid4:{name:"4 small solid boosters",kind:"solid",size:"small",n:4},large2:{name:"2 large 5-segment solids",kind:"solid",size:"large",n:2},liquid2:{name:"2 copies of stage 1 (like Falcon Heavy)",kind:"liquid",n:2}};
const PRESETS={
  f9:{name:"Falcon 9",stages:[{eng:"merlin",n:9,tank:400},{eng:"mvac",n:1,tank:100}],boost:"none"},
  fh:{name:"Falcon Heavy",stages:[{eng:"merlin",n:9,tank:400},{eng:"mvac",n:1,tank:100}],boost:"liquid2"},
  atlas:{name:"Atlas V 541",stages:[{eng:"rd180",n:1,tank:250},{eng:"rl10",n:1,tank:25}],boost:"solid4"},
  sls:{name:"SLS Block 1",stages:[{eng:"rs25",n:4,tank:1000},{eng:"rl10",n:1,tank:25}],boost:"large2"},
  saturn:{name:"Saturn V",stages:[{eng:"f1",n:5,tank:2000},{eng:"j2",n:5,tank:400},{eng:"j2",n:1,tank:100}],boost:"none"}
};
const BUS={small:{name:"Small bus",mass:300,cost:120,slots:3,w:80},medium:{name:"Medium bus",mass:700,cost:200,slots:5,w:150},large:{name:"Large bus",mass:1500,cost:320,slots:8,w:250}};
const SOLAR={none:{name:"No solar arrays",kw:0,mass:0,cost:0},s:{name:"Small arrays",kw:2,mass:50,cost:10},m:{name:"Medium arrays",kw:6,mass:150,cost:30},l:{name:"Large arrays (Juno-size)",kw:14,mass:350,cost:70}};
const RTG={mass:45,w:110,cost:110};
const BAT={none:{name:"No battery",kwh:0,mass:0,cost:0},s:{name:"1 kWh",kwh:1,mass:10,cost:2},m:{name:"5 kWh",kwh:5,mass:45,cost:8},l:{name:"20 kWh",kwh:20,mass:170,cost:25}};
const ANT={lga:{name:"Low-gain antenna",mass:2,cost:2,w:10,mbps:.01,cap:.2},mga:{name:"1 m dish",mass:15,cost:12,w:40,mbps:.6,cap:20},hga:{name:"3 m dish (MRO-class)",mass:60,cost:35,w:100,mbps:6,cap:100}};
const PROP={chem:{name:"Chemical engine",sub:"Isp 320 s · strong and quick",isp:320,mass:60,cost:15},ion:{name:"Ion engine",sub:"Isp 3,000 s · sips fuel, +30% cruise time",isp:3000,mass:180,cost:80}};
const MARGINS=[0,.1,.25,.5];
const INST={
  cam:{name:"Imaging camera",mass:40,w:20,data:4000,cost:30,sci:10,at:"orbit"},
  hires:{name:"High-resolution camera",mass:65,w:60,data:30000,cost:70,sci:18,at:"orbit",bonus:{mars:1.3,moon:1.2}},
  spec:{name:"IR spectrometer",mass:30,w:25,data:3000,cost:45,sci:15,at:"orbit",bonus:{mars:1.2,ceres:1.4}},
  radar:{name:"Ice-penetrating radar",mass:65,w:90,data:2000,cost:70,sci:20,at:"orbit",bonus:{mars:1.5,europa:1.5,moon:1.2}},
  mag:{name:"Magnetometer",mass:10,w:5,data:50,cost:15,sci:8,at:"orbit",bonus:{europa:2,mercury:1.6}},
  alt:{name:"Laser altimeter",mass:20,w:30,data:500,cost:25,sci:10,at:"orbit",bonus:{mercury:1.3,moon:1.2}},
  gamma:{name:"Gamma-ray spectrometer",mass:25,w:20,data:300,cost:35,sci:12,at:"orbit",bonus:{ceres:1.4,mercury:1.3}},
  massspec:{name:"Mass spectrometer",mass:25,w:40,data:200,cost:50,sci:14,at:"orbit",bonus:{titan:1.6,venus:1.5}},
  probe:{name:"Atmospheric entry probe",mass:340,w:0,data:50,cost:120,sci:30,at:"orbit",only:["venus","titan"]},
  vault:{name:"Radiation vault",mass:150,w:0,data:0,cost:40,sci:0,at:"orbit"},
  shade:{name:"Sunshade",mass:40,w:0,data:0,cost:20,sci:0,at:"orbit"},
  seis:{name:"Seismometer",mass:30,w:10,data:100,cost:40,sci:15,at:"surface",bonus:{mars:1.4,moon:1.3}},
  drill:{name:"Ice drill",mass:60,w:120,data:200,cost:60,sci:20,at:"surface",bonus:{europa:1.8,moon:1.3,mars:1.3,ceres:1.3}},
  rover:{name:"Rover",mass:900,w:0,data:1000,cost:300,sci:40,at:"surface",bonus:{mars:1.3,moon:1.1},only:["moon","mars","mercury","ceres","europa"]},
  heli:{name:"Helicopter scout",mass:2,w:0,data:100,cost:85,sci:12,at:"surface",only:["mars","titan"],bonus:{titan:2.5}}
};
const LANDER={cost:260,dry:600,sci:30,data:300};
const ORBITS={low:{name:"Low circular",sub:"Closest view and sharpest data. Costs 0.3 km/s more braking.",dv:.3,sci:1.2},polar:{name:"Polar",sub:"Passes over every latitude for full coverage. Costs 0.15 km/s more.",dv:.15,sci:1.1},ellip:{name:"High elliptical",sub:"Cheapest to reach. Farther away, so less detail.",dv:0,sci:.85}};
const LIFE={1:{mult:1,sub:"$25M of operations"},2:{mult:1.6,sub:"$50M of operations · 60% more science"},4:{mult:2.4,sub:"$100M · 2.4× science, more time for parts to wear out"}};
const OBJ={
  water:{name:"Find water ice",sub:"Map where ice hides: a resource for future explorers.",dest:["moon","mercury","mars","ceres","europa"],need:[["radar","spec","gamma","drill"],1],orbit:["low","polar"],years:1},
  map:{name:"Map the whole surface",sub:"Photograph and measure every latitude.",dest:["moon","mercury","venus","mars","ceres","europa","titan"],need:[["cam","hires","alt","radar"],2],orbit:["polar"],years:2},
  atmo:{name:"Study the atmosphere",sub:"Sample the air and track its weather.",dest:["venus","mars","titan"],need:[["massspec","probe","spec"],2],orbit:["ellip","low"],years:1},
  interior:{name:"Look inside the world",sub:"Measure the core, crust and any hidden ocean.",dest:["moon","mercury","mars","europa"],need:[["mag","seis","gamma","alt"],2],orbit:["low","polar"],years:2},
  life:{name:"Search for habitable places",sub:"Find water, energy and organic chemistry together.",dest:["mars","ceres","europa","titan"],need:[["massspec","drill","spec","mag"],2],orbit:["low","polar","ellip"],years:2}
};
const ROLES=[{id:"lead",name:"Mission Lead",owns:"the budget and cruise decisions",goal:"Finish with at least $50M of the budget unspent."},
  {id:"launch",name:"Launch Engineer",owns:"the rocket and the ascent",goal:"Reach orbit with Max-Q under 40 kPa."},
  {id:"sc",name:"Spacecraft Engineer",owns:"the spacecraft and the braking burn",goal:"Arrive with 120% of needed power and at least 80% of data sent home."},
  {id:"sci",name:"Science Lead",owns:"the objective, instruments and landing",goal:"Complete the objective: every requirement met and the spacecraft still healthy at the end."}];
const ASSIGN={1:[0,0,0,0],2:[0,1,1,0],3:[0,1,2,0],4:[0,1,2,3]};
