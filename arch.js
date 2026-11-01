import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const $=id=>document.getElementById(id);
const E=p=>p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2, L=(a,b,p)=>a+(b-a)*p, cl=p=>Math.max(0,Math.min(1,p));
const sub=(p,a,b)=>cl((p-a)/(b-a));
// ---------- procedural camera image ----------
const IMG=document.createElement('canvas');IMG.width=256;IMG.height=160;{const g=IMG.getContext('2d');
 const gr=g.createLinearGradient(0,0,0,80);gr.addColorStop(0,'#5aa9e6');gr.addColorStop(1,'#cfe8ff');g.fillStyle=gr;g.fillRect(0,0,256,80);
 g.fillStyle='#3d6b35';g.fillRect(0,80,256,80);g.fillStyle='#555b66';g.beginPath();g.moveTo(100,80);g.lineTo(156,80);g.lineTo(256,160);g.lineTo(0,160);g.fill();
 [[0,30,50,50,'#8d99ae'],[48,45,40,35,'#b08968'],[180,25,40,55,'#6c757d'],[215,40,41,40,'#a3b18a']].forEach(([x,y,w,h,c])=>{g.fillStyle=c;g.fillRect(x,y,w,h)});
 g.fillStyle='#e63946';g.fillRect(140,100,34,20);g.fillStyle='#fff';g.fillRect(126,120,4,14);g.fillRect(127,95,3,8);}
const PIX=IMG.getContext('2d').getImageData(0,0,256,160).data;
const colAt=(u,v)=>{const x=Math.min(255,u*256|0),y=Math.min(159,v*160|0),i=(y*256+x)*4;return new THREE.Color(PIX[i]/255,PIX[i+1]/255,PIX[i+2]/255)};
const depthAt=(u,v)=>v<.5?(u<.2||u>.7?.55:1):(v>.62&&u>.54&&u<.68&&v<.75?.35:L(.9,.05,(v-.5)/.5));// 0..1 개념 depth
const semAt=(u,v)=>v<.5?((u<.35||u>.7)?0x8d99ae:0x5aa9e6):(u>.54&&u<.68&&v>.62&&v<.75?0xe63946:(Math.abs(u-.5)<.5*(v-.5)/.5+.05?0x555b66:0x3d6b35));
const TEX=new THREE.CanvasTexture(IMG);TEX.colorSpace=THREE.SRGBColorSpace;
const DEP=(()=>{const c=document.createElement('canvas');c.width=64;c.height=40;const g=c.getContext('2d');for(let y=0;y<40;y++)for(let x=0;x<64;x++){const d=depthAt(x/64,y/40);g.fillStyle=new THREE.Color().setHSL(.7*d,.9,.5).getStyle();g.fillRect(x,y,1,1)}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t})();
const SEM=(()=>{const c=document.createElement('canvas');c.width=64;c.height=40;const g=c.getContext('2d');for(let y=0;y<40;y++)for(let x=0;x<64;x++){g.fillStyle='#'+semAt(x/64,y/40).toString(16).padStart(6,'0');g.fillRect(x,y,1,1)}const t=new THREE.CanvasTexture(c);return t})();
// ---------- helpers ----------
const mat=(c,o=1)=>new THREE.MeshStandardMaterial({color:c,transparent:true,opacity:o});
const bmat=(c,o=1)=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,side:THREE.DoubleSide});
const box=(w,h,d,c,o=1)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c,o));
const plane=(w,h,m)=>new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);
function label(txt,c='#fff',s=1){const cv=document.createElement('canvas');const g=cv.getContext('2d');g.font='bold 44px sans-serif';const w=g.measureText(txt).width+24;cv.width=w;cv.height=64;
 g.font='bold 44px sans-serif';g.fillStyle='#000a';g.fillRect(0,0,w,64);g.fillStyle=c;g.fillText(txt,12,47);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false}));sp.scale.set(w/64*s,s,1);sp.renderOrder=10;return sp}
function seg(color,o=.8){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));return new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity:o}))}
function setSeg(l,a,b){const p=l.geometry.attributes.position;p.setXYZ(0,a.x,a.y,a.z);p.setXYZ(1,b.x,b.y,b.z);p.needsUpdate=true;l.geometry.computeBoundingSphere()}
function frust(col,len=3,fov=60){const h=Math.tan(fov*Math.PI/360)*len,v=h*.6,P=[[0,0,0],[len,v,h],[len,v,-h],[len,-v,-h],[len,-v,h]].map(a=>new THREE.Vector3(...a));
 return new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([0,1,0,2,0,3,0,4,1,2,2,3,3,4,4,1].map(i=>P[i])),new THREE.LineBasicMaterial({color:col,transparent:true}))}
function car(){const g=new THREE.Group();const b=box(2.3,.7,1,0x76b900);b.position.y=.45;g.add(b);const t=box(1.2,.4,.9,0x2d3a1a);t.position.set(-.1,1,0);g.add(t);return g}
const fade=(o,a)=>{o.traverse(m=>{if(m.material){m.material.transparent=true;m.material.opacity=a*(m.userData.o??1)}});o.visible=a>.01};
const CAMYAW=[0,0,60,-60,150,-150],CAMCOL=[0x3ec5ff,0x7dd3fc,0xc084fc,0xc084fc,0xf472b6,0xf472b6];
// ---------- modules ----------
const MODS=[
{id:'in',l:'6 카메라 × T 시점',s:'멀티카메라 비디오',cam:[0,6,24],tg:[0,4,0],build(R){
 const c=car();R.add(c);const fr=CAMYAW.map((y,i)=>{const f=frust(CAMCOL[i],2.5,i==1?30:70);f.position.y=1.2;f.rotation.y=y*Math.PI/180;R.add(f);return f});
 const imgs=[];for(let ci=0;ci<6;ci++)for(let t=0;t<4;t++){const m=plane(2.6,1.6,new THREE.MeshBasicMaterial({map:TEX,transparent:true}));R.add(m);imgs.push({m,ci,t})}
 const lt=[0,1,2,3].map(t=>{const s=label('t'+(t+1),'#76b900',.6);s.position.set(-4.2+t*2.9,10.6,0);R.add(s);return s});
 const lc=[0,1,2,3,4,5].map(i=>{const s=label('cam'+(i+1),'#3ec5ff',.5);s.position.set(-7.2,9.3-i*1.85,0);R.add(s);return s});
 const tau=imgs.map(o=>{const s=label(`τ${o.t+1},${o.ci+1}`,'#ffd166',.38);R.add(s);return s});
 const gp=(o,off=0)=>new THREE.Vector3(-4.2+o.t*2.9+off,9.3-o.ci*1.85,0);
 const src=o=>{const a=CAMYAW[o.ci]*Math.PI/180;return new THREE.Vector3(Math.cos(a)*2.5,1.2,-Math.sin(a)*2.5)};
 return[{c:'자차 rig에 장착된 카메라 6대가 주변을 촬영합니다. 논문: 화각이 서로 다른 polynomial f‑theta 카메라 6대, 30 FPS. (카메라 배치는 개념도)',u:p=>{fr.forEach(f=>fade(f,p));imgs.forEach(o=>fade(o.m,0));[...lt,...lc,...tau].forEach(s=>fade(s,0))}},
 {c:'시점 t1에 6장의 이미지가 동시에(대략) 찍혀 입력 격자의 한 열이 됩니다.',u:p=>{imgs.forEach(o=>{if(o.t==0){fade(o.m,1);o.m.position.lerpVectors(src(o),gp(o),E(p));o.m.scale.setScalar(L(.2,1,p))}});lc.forEach(s=>fade(s,p));fade(lt[0],p)}},
 {c:'시간이 흐르며 T개 시점이 쌓여 C×T 이미지(여기선 6×4)가 하나의 입력 윈도우가 됩니다. 학습 1단계는 카메라당 4시점, 2단계는 8시점.',u:p=>{imgs.forEach(o=>{if(o.t>0){const q=sub(p,(o.t-1)/3*.6,(o.t-1)/3*.6+.4);fade(o.m,q);o.m.position.lerpVectors(src(o),gp(o),E(q));o.m.scale.setScalar(L(.2,1,q))}});lt.slice(1).forEach((s,i)=>fade(s,sub(p,i*.25,i*.25+.4)))}},
 {c:'첫 번째 카메라가 기준 시각을 정하고, 각 이미지는 자기 촬영 시각 τ(t,c)를 따로 가집니다 → 카메라 간 비동기 입력도 처리 (오프셋 크기는 과장된 개념도).',u:p=>{imgs.forEach((o,i)=>{const off=o.ci?Math.sin(o.ci*1.7)*.35*p:0;o.m.position.copy(gp(o,off));tau[i].position.copy(gp(o,off)).add(new THREE.Vector3(0,-.55,.1));fade(tau[i],p)})}}]}},
{id:'enc',l:'DINOv2 ViT-L/14',s:'패치 인코더',cam:[0,1,15],tg:[0,0,0],build(R){
 const N=8,S=7,ps=S/N,P=[];for(let y=0;y<N;y++)for(let x=0;x<N;x++){const u=(x+.5)/N,v=(y+.5)/N;const m=plane(ps*.98,ps*.98,bmat(colAt(u,v)));const bar=box(ps*.6,ps*.6,1,colAt(u,v).clone().lerp(new THREE.Color(0x3ec5ff),.5));R.add(m,bar);P.push({m,bar,x,y,base:new THREE.Vector3(-S/2+(x+.5)*ps,S/2*.62-(y+.5)*ps*.62,0)})}
 const full=plane(S,S*.62,new THREE.MeshBasicMaterial({map:TEX,transparent:true}));R.add(full);
 const merged=[];for(let y=0;y<N/2;y++)for(let x=0;x<N/2;x++){const b=box(ps*1.3,ps*1.3*.62,1.4,0x76b900);R.add(b);merged.push({b,x,y})}
 const fl=label('원해상도 특징 → Shared FPN','#ff9f43',.5);R.add(fl);const al=label('aggregator 입력 (토큰 1/4)','#76b900',.5);R.add(al);
 return[{c:'입력 이미지(논문: 1036×1036). ViT‑L/14는 이미지를 14×14 픽셀 패치로 자릅니다.',u:p=>{fade(full,1);P.forEach(o=>{fade(o.m,0);fade(o.bar,0)});merged.forEach(o=>fade(o.b,0));fade(fl,0);fade(al,0)}},
 {c:'1036/14 = 74 → 74×74 패치 격자가 됩니다. (화면은 8×8로 축소)',u:p=>{fade(full,1-p);P.forEach(o=>{fade(o.m,p);o.m.position.copy(o.base).multiplyScalar(L(1,1.12,p))})}},
 {c:'DINOv2 encoder가 각 패치를 폭 1024의 특징 토큰(막대)으로 바꿉니다. 공유 backbone은 VGGT를 따릅니다.',u:p=>{P.forEach(o=>{o.m.position.copy(o.base).multiplyScalar(1.12);fade(o.bar,p);o.bar.position.copy(o.m.position).add(new THREE.Vector3(0,0,-.5*p));o.bar.scale.z=L(.05,1,p);fade(o.m,1-.6*p)})}},
 {c:'74×74 격자를 37×37로 bilinear 다운샘플 → aggregator는 공간 토큰의 1/4만 처리해 attention 비용을 줄입니다.',u:p=>{P.forEach(o=>{o.bar.position.x=o.m.position.x-3.6*p;fade(o.bar,1-p*.7);fade(o.m,.4*(1-p))});merged.forEach(o=>{fade(o.b,p);o.b.position.set(-2.4*1.12+(o.x+.5)*1.75*.7,1.4-(o.y+.5)*1.1*.7,-.7)});fade(al,p);al.position.set(0,-2.3,0)}},
 {c:'원래 해상도 특징은 버리지 않고 Detection·Occupancy용 feature pyramid(Shared FPN)로 따로 전달됩니다.',u:p=>{P.forEach(o=>{o.bar.position.set(o.m.position.x*.5-5.2*p,o.m.position.y*.5,-.5);o.bar.scale.setScalar(.5);o.bar.scale.z=.5;fade(o.bar,.3+.7*p);fade(o.m,0)});fade(fl,p);fl.position.set(-5.2,-2.3,0);merged.forEach(o=>o.b.position.x+=0);}}]}},
{id:'tok',l:'rig · ego · register×4',s:'특수 토큰',cam:[0,3,15],tg:[0,0,0],build(R){
 const pat=[...Array(10)].map((_,i)=>{const b=box(.7,.7,.7,0x3ec5ff);b.position.set(-1+i*.9,0,0);R.add(b);return b});
 const rig=box(.7,.7,.7,0xc084fc),ego=box(.7,.7,.7,0xff9f43),reg=[0,1,2,3].map(()=>box(.7,.7,.7,0x9ca3af));R.add(rig,ego,...reg);
 const lr=label('rig','#c084fc',.45),le=label('ego','#ff9f43',.45),lg=label('register ×4','#9ca3af',.45),lp=label('패치 토큰 (1개 이미지)','#3ec5ff',.45);R.add(lr,le,lg,lp);
 const rows=[];for(let r=1;r<6;r++){const g=new THREE.Group();for(let i=0;i<16;i++){const b=box(.7,.7,.7,i==0?0xc084fc:i==1?0xff9f43:i<6?0x9ca3af:0x3ec5ff);b.position.x=-6.4+i*.9;g.add(b)}g.position.y=-r*1.0;R.add(g);rows.push(g)}
 const slot=i=>new THREE.Vector3(-6.4+i*.9,0,0);
 return[{c:'한 이미지의 패치 토큰 시퀀스입니다 (여기선 10개로 축소).',u:p=>{pat.forEach((b,i)=>{b.position.lerpVectors(new THREE.Vector3(-1+i*.9,0,0),new THREE.Vector3(-1+i*.9,0,0),1);fade(b,p)});[rig,ego,...reg,lr,le,lg].forEach(o=>fade(o,0));rows.forEach(g=>fade(g,0));fade(lp,p);lp.position.set(3,1,0)}},
 {c:'rig 토큰을 앞에 붙입니다 → 카메라 간 상대 calibration(camera‑to‑rig)을 담당. Geometry의 rig 헤드가 읽습니다.',u:p=>{pat.forEach((b,i)=>b.position.lerpVectors(new THREE.Vector3(-1+i*.9,0,0),slot(i+6),E(p)));fade(rig,p);rig.position.lerpVectors(new THREE.Vector3(-6.4,3,0),slot(0),E(p));fade(lr,p);lr.position.copy(slot(0)).add(new THREE.Vector3(0,1,0))}},
 {c:'ego 토큰: rig 전체의 움직임(ego motion)을 담당. Geometry의 ego 헤드가 기준 카메라의 ego 토큰을 시간축으로 읽습니다.',u:p=>{fade(ego,p);ego.position.lerpVectors(new THREE.Vector3(-5.5,3,0),slot(1),E(p));fade(le,p);le.position.copy(slot(1)).add(new THREE.Vector3(0,-1,0))}},
 {c:'보조 register 토큰 4개를 더합니다 (VGGT 방식, 특정 출력 없음).',u:p=>{reg.forEach((b,i)=>{const q=sub(p,i*.15,i*.15+.55);fade(b,q);b.position.lerpVectors(new THREE.Vector3(-3+i,3,0),slot(2+i),E(q))});fade(lg,p);lg.position.copy(slot(3.5)).add(new THREE.Vector3(0,1,0))}},
 {c:'모든 카메라·시점의 이미지 시퀀스에 같은 구조로 붙어 factorized aggregator로 들어갑니다.',u:p=>{rows.forEach((g,i)=>{fade(g,sub(p,i*.12,i*.12+.4))})}}]}},
{id:'agg',l:'Factorized Attention ×16',s:'image · view · time',cam:[0,1,17],tg:[0,0,0],build(R){
 let lays=[],lastK=-1;const C=6,T=4,blk=[];for(let c=0;c<C;c++)for(let t=0;t<T;t++){const g=new THREE.Group();const cells=[];for(let i=0;i<9;i++){const b=box(.42,.42,.42,0x1f3b5a);b.position.set((i%3-1)*.5,(1-(i/3|0))*.5,0);g.add(b);cells.push(b)}
  g.position.set(-4.5+t*3,4.2-c*1.7,0);R.add(g);blk.push({g,c,t,cells})}
 const lines=[];for(let i=0;i<60;i++){const l=seg(0x76b900,.7);R.add(l);lines.push(l)}
 const lay=label('layer 1 / 16','#fff',.6);lay.position.set(0,6,0);R.add(lay);const md=label('','#76b900',.6);R.add(md);
 const cen=b=>b.g.position;const SEL=[2,1];const hide=()=>lines.forEach(l=>l.visible=false);
 const paint=f=>blk.forEach(b=>b.cells.forEach((m,i)=>m.material.color.set(f(b,i))));
 function link(pairs){hide();pairs.slice(0,60).forEach(([a,b],i)=>{lines[i].visible=true;setSeg(lines[i],a,b)})}
 const sel=blk.find(b=>b.c==SEL[0]&&b.t==SEL[1]);
 const view=s=>blk.filter(b=>b.t==s.t&&b!==s).map(b=>[cen(s),cen(b)]),time=s=>blk.filter(b=>b.c==s.c&&b!==s).map(b=>[cen(s),cen(b)]);
 return[{c:'입력 격자: 6 카메라(행) × 4 시점(열), 각 블록은 한 이미지의 토큰들(축소). ',u:p=>{hide();paint(()=>0x1f3b5a);fade(lay,0);fade(md,0)}},
 {c:'① 이미지 내부(frame) attention: 같은 이미지의 패치끼리만 정보를 교환합니다.',u:p=>{paint((b,i)=>b===sel?(Math.sin(p*20+i)>0?0x76b900:0x3ec5ff):0x1f3b5a);const a=sel.cells.map(m=>m.getWorldPosition(new THREE.Vector3()));link(a.flatMap((x,i)=>a.slice(i+1).map(y=>[x,y])).filter((_,i)=>i%2==0))}},
 {c:'② View attention: 같은 시점의 카메라 6대끼리 (열 방향). 서로 다른 화각을 연결해 공간 정합.',u:p=>{paint(b=>b===sel?0x76b900:b.t==sel.t?0x3ec5ff:0x1f3b5a);link(view(sel))}},
 {c:'③ Time attention: 같은 카메라의 시점들끼리 (행 방향). 움직임과 ego motion 단서.',u:p=>{paint(b=>b===sel?0x76b900:b.c==sel.c?0xff9f43:0x1f3b5a);link(time(sel))}},
 {c:'각 레이어는 [이미지 내부 → view] 와 [이미지 내부 → time] 그룹을 번갈아 적용, 총 16개 aggregation 레이어 (8쌍).',u:p=>{const k=Math.min(15,p*16|0),v=k%2==0;fade(lay,0);if(k===lastK)return;lastK=k;const nl=label(`layer ${k+1} / 16 · ${v?'view':'time'}`,v?'#3ec5ff':'#ff9f43',.6);nl.position.set(0,6,0);R.add(nl);lays.push(nl);while(lays.length>1){const o=lays.shift();R.remove(o);o.material.map.dispose();}
   const s=blk[(k*7)%24];paint(b=>b===s?0x76b900:(v?b.t==s.t:b.c==s.c)?(v?0x3ec5ff:0xff9f43):0x1f3b5a);link(v?view(s):time(s))}},
 {c:'비교: VGGT global attention은 모든 이미지의 모든 토큰이 서로 연결 → 비용이 전체 토큰 수의 제곱. Factorized는 이를 카메라/시간으로 분해해 줄입니다.',u:p=>{lays.forEach(l=>R.remove(l));lays.length=0;lastK=-1;paint(()=>0xff6b6b);const pr=[];blk.forEach((a,i)=>blk.forEach((b,j)=>{if(j>i&&(i+j)%3==0)pr.push([cen(a),cen(b)])}));link(pr)}},
 {c:'마지막 이미지 내부 블록과 시간 블록의 출력을 채널 방향으로 이어 붙여 폭 2d의 문맥 토큰을 만들고 헤드들로 보냅니다.',u:p=>{hide();paint(()=>0x76b900);blk.forEach(b=>b.cells.forEach(m=>m.scale.set(1,1,L(1,2.2,p))))}}];}},
{id:'geo',l:'Geometry 헤드',s:'포즈 · depth · pointmap',cam:[-9,9,14],tg:[2,0,0],build(R){
 const c=car();R.add(c);const rt=CAMYAW.map((_,i)=>{const b=box(.4,.4,.4,0xc084fc);R.add(b);return b});
 const fr=CAMYAW.map((y,i)=>{const f=frust(CAMCOL[i],1.6,70);R.add(f);return f});
 const traj=[...Array(4)].map((_,t)=>new THREE.Vector3(t*2.2,0,Math.sin(t*.6)*.8));const et=traj.map(()=>{const b=box(.4,.4,.4,0xff9f43);R.add(b);return b});
 const tl=new THREE.Line(new THREE.BufferGeometry().setFromPoints(traj),new THREE.LineDashedMaterial({color:0xff9f43,dashSize:.3,gapSize:.2,transparent:true}));tl.computeLineDistances();R.add(tl);
 const ghosts=traj.map(p=>{const g=car();g.position.copy(p);R.add(g);g.traverse(m=>m.userData.o=.35);return g});
 const ip=new THREE.Group();const im=plane(3.2,2,new THREE.MeshBasicMaterial({map:TEX,transparent:true})),dm=plane(3.2,2,new THREE.MeshBasicMaterial({map:DEP,transparent:true})),sm=plane(3.2,2,new THREE.MeshBasicMaterial({map:SEM,transparent:true}));
 dm.position.x=3.4;sm.position.x=6.8;ip.add(im,dm,sm);ip.position.set(-1.5,5,0);R.add(ip);
 const lab=[label('RGB','#fff',.4),label('z-depth','#fff',.4),label('semantic 21cls','#fff',.4)];lab.forEach((l,i)=>{l.position.set(-1.5+i*3.4,6.3,0);R.add(l)});
 const NP=900,pg=new THREE.BufferGeometry(),pa=new Float32Array(NP*3),pc=new Float32Array(NP*3),from=[],to=[];
 for(let i=0;i<NP;i++){const u=Math.random(),v=Math.random(),d=depthAt(u,v);from.push(new THREE.Vector3(1.9+(u-.5)*3.2,5+(.5-v)*2,0));
  const ray=new THREE.Vector3(1,(.5-v)*.9,-(u-.5)*1.6).normalize();to.push(ray.multiplyScalar(2+d*12).add(new THREE.Vector3(0,1.2,0)));const cc=colAt(u,v);pc.set([cc.r,cc.g,cc.b],i*3)}
 pg.setAttribute('position',new THREE.BufferAttribute(pa,3));pg.setAttribute('color',new THREE.BufferAttribute(pc,3));const pts=new THREE.Points(pg,new THREE.PointsMaterial({size:.12,vertexColors:true,transparent:true}));R.add(pts);
 const rigPos=i=>{const a=CAMYAW[i]*Math.PI/180;return new THREE.Vector3(Math.cos(a)*1.1,1.2,-Math.sin(a)*.6)};
 return[{c:'rig 헤드: 첫 시점 그룹의 6개 카메라 rig 토큰(보라)을 읽어 각 카메라의 camera‑to‑rig translation + quaternion을 회귀 (VGGT camera head 구조).',u:p=>{[...et,tl,...ghosts,ip,...lab,pts].forEach(o=>fade(o,0));rt.forEach((b,i)=>{fade(b,1-p*.8);b.position.lerpVectors(new THREE.Vector3(-6,4-i*.6,0),rigPos(i),E(p))});fr.forEach((f,i)=>{fade(f,p);f.position.copy(rigPos(i));f.rotation.set(0,CAMYAW[i]*Math.PI/180,0)})}},
 {c:'ego 헤드: 기준 카메라의 ego 토큰(주황)을 시간축으로 읽어 시점별 rig 궤적(ego motion)을 회귀합니다.',u:p=>{rt.forEach(b=>fade(b,0));et.forEach((b,t)=>{const q=sub(p,t*.15,t*.15+.5);fade(b,q*(1-sub(p,.8,1)));b.position.lerpVectors(new THREE.Vector3(-6,-1-t*.6,0),traj[t].clone().setY(.2),E(q))});fade(tl,p);ghosts.forEach((g,t)=>fade(g,sub(p,.5+t*.1,.7+t*.1)))}},
 {c:'식(1): 카메라 포즈 = 촬영 시각 τ(t,c)에서 보간한 ego 궤적 × 카메라별 고정 rig 변환. 위치는 선형, 회전은 최단호 slerp 보간.',u:p=>{const s=p*3,t=Math.min(2,s|0),f=s-t;const P=traj[t].clone().lerp(traj[t+1],f);c.position.copy(P);fr.forEach((fz,i)=>fz.position.copy(rigPos(i)).add(P))}},
 {c:'Dense 예측: 독립된 DPT decoder들이 문맥 특징 → camera z‑depth, 보조 pointmap, semantic logit(21 클래스), 출력 518×518 + confidence 맵.',u:p=>{c.position.set(0,0,0);fr.forEach((fz,i)=>fz.position.copy(rigPos(i)));ghosts.forEach(g=>fade(g,0));fade(tl,0);fade(ip,1);fade(im,1);fade(dm,sub(p,.1,.5));fade(sm,sub(p,.5,.9));lab.forEach((l,i)=>fade(l,i==0?1:sub(p,.1+i*.4-.4,.5+i*.4-.4)))}},
 {c:'식(2): 각 픽셀 depth d를 ray 방향 r의 z성분으로 나눠 ray 거리로 바꾸고, 예측 포즈(R,t)로 3D 점으로 역투영 → 최종 pointmap.',u:p=>{fade(pts,1);for(let i=0;i<NP;i++){const q=E(sub(p,(i%30)/60,(i%30)/60+.5));const v=from[i].clone().lerp(to[i],q);pa.set([v.x,v.y,v.z],i*3)}pg.attributes.position.needsUpdate=true;pg.computeBoundingSphere()}}]}},
{id:'gs',l:'Gaussian 헤드',s:'3DGS 재구성',cam:[-8,7,13],tg:[4,1,0],build(R){
 const N=500,G=[],sg=new THREE.SphereGeometry(1,8,6);for(let i=0;i<N;i++){const u=Math.random(),v=Math.random(),d=depthAt(u,v),sky=v<.5&&!(u<.35||u>.7),act=u>.54&&u<.68&&v>.62&&v<.75;
  const m=new THREE.Mesh(sg,new THREE.MeshStandardMaterial({color:colAt(u,v),transparent:true}));const ray=new THREE.Vector3(1,(.5-v)*.9,-(u-.5)*1.6).normalize();
  m.userData={from:new THREE.Vector3(-2,3+(.5-v)*2,(u-.5)*3),to:ray.multiplyScalar(2+d*12).add(new THREE.Vector3(0,1.2,0)),sky,act,s:new THREE.Vector3(.1+Math.random()*.25,.06+Math.random()*.15,.1+Math.random()*.25)};
  m.quaternion.setFromEuler(new THREE.Euler(Math.random()*3,Math.random()*3,0));R.add(m);G.push(m)}
 const dome=new THREE.Mesh(new THREE.SphereGeometry(30,24,12,0,Math.PI*2,0,Math.PI/2),new THREE.MeshBasicMaterial({color:0x5aa9e6,side:THREE.BackSide,transparent:true,wireframe:true}));R.add(dome);
 const cf=frust(0xffffff,2,60);cf.position.set(-1,1.5,3);cf.rotation.y=-.3;R.add(cf);const out=plane(3.2,2,new THREE.MeshBasicMaterial({map:TEX,transparent:true}));out.position.set(-4,4.5,2);R.add(out);
 const traj=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(2,0,-.6),new THREE.Vector3(4,0,-.6),new THREE.Vector3(6,0,0)]);
 return[{c:'디코더 출력 격자의 픽셀마다 Gaussian 1개: 중심·RGB 색·스케일·quaternion·opacity. 중심은 식(9)로 예측 depth를 ray 따라 역투영 (예측 rig 궤적의 포즈 사용).',u:p=>{fade(dome,0);fade(cf,0);fade(out,0);G.forEach((m,i)=>{const q=E(sub(p,(i%20)/40,(i%20)/40+.5));m.position.lerpVectors(m.userData.from,m.userData.to,q);m.scale.copy(m.userData.s).multiplyScalar(L(.3,1,q));m.material.opacity=.8;m.visible=true})}},
 {c:'하늘·자차·unknown 영역의 Gaussian은 geometry branch의 semantic 마스크로 opacity를 줄이고, 하늘은 별도 cubemap으로 표현합니다.',u:p=>{G.forEach(m=>{if(m.userData.sky)m.material.opacity=.8*(1-p)});fade(dome,.5*p)}},
 {c:'장면 = 정적 Gaussian + actor Gaussian(Instant NuRec 방식). 렌더링 때 actor Gaussian은 예측 궤적을 보간해 강체 변환, 정적 Gaussian은 고정. (궤적은 개념도)',u:p=>{const o=traj.getPoint(p).sub(traj.getPoint(0));G.forEach(m=>{if(m.userData.act){m.position.copy(m.userData.to).add(o);m.material.emissive=new THREE.Color(0x553300)}})}},
 {c:'식(10): splatting 누적 색 + (1−누적 opacity)×하늘 색 → 카메라별 affine 색 변환(3×3 M, bias b) → [0,1] clip. 학습은 context에 없는 시각의 렌더링으로 지도.',u:p=>{fade(cf,1);fade(out,p);out.material.color.setRGB(1,L(.85,1,p),L(.7,1,p))}}]}},
{id:'fpn',l:'Shared FPN',s:'다중 스케일 결합',cam:[-6,4,13],tg:[0,1,0],build(R){
 const lv=[4.8,3.6,2.4,1.4].map((s,i)=>{const m=plane(s,s*.62,new THREE.MeshBasicMaterial({map:TEX,transparent:true,side:THREE.DoubleSide}));m.position.set(0,i*1.6-1.2,0);m.rotation.x=-1.1;R.add(m);return m});
 const ctx=box(1.4,.3,1,0x76b900);R.add(ctx);const lc=label('문맥 토큰 (폭 2d)','#76b900',.45);R.add(lc);const li=label('원해상도 이미지 특징','#3ec5ff',.45);li.position.set(-4.2,-1.2,0);R.add(li);
 const parts=[...Array(40)].map(()=>{const b=box(.12,.12,.12,0xffd166);R.add(b);return b});
 const od=label('→ Detection','#ff9f43',.5),oo=label('→ Occupancy','#f472b6',.5);od.position.set(4,1,0);oo.position.set(4,-.5,0);R.add(od,oo);
 return[{c:'DINOv2의 고해상도 이미지 특징으로 다중 스케일 피라미드를 만듭니다 (단계 수는 개념도).',u:p=>{lv.forEach((m,i)=>fade(m,sub(p,i*.2,i*.2+.4)));fade(li,p);[ctx,lc,od,oo].forEach(o=>fade(o,0));parts.forEach(b=>fade(b,0))}},
 {c:'aggregator의 시공간 문맥 특징이 피라미드 꼭대기로 들어옵니다.',u:p=>{fade(ctx,p);ctx.position.set(0,L(6,4,E(p)),0);fade(lc,p);lc.position.set(0,5,0)}},
 {c:'top‑down 경로로 문맥 특징을 단계별로 업샘플하며 고해상도 이미지 특징과 합칩니다.',u:p=>{parts.forEach((b,i)=>{const q=(p*2+i/40)%1;fade(b,1);b.position.set(Math.sin(i)*q*1.5,L(3.6,-1.2,q),Math.cos(i)*q*.8)});lv.forEach((m,i)=>m.material.color.setHSL(.25,.6,.5+.5*sub(p,(3-i)*.22,(3-i)*.22+.3)))}},
 {c:'이 feature pyramid는 Detection 헤드와 Occupancy 헤드가 공유합니다.',u:p=>{parts.forEach(b=>fade(b,0));fade(od,p);fade(oo,p)}}]}},
{id:'det',l:'Detection 헤드',s:'PETR query · DETR3D',cam:[-12,12,16],tg:[4,0,0],build(R){
 const c=car();R.add(c);const Q=60,qs=[],tgt=[[6,0,-1.5],[10,0,1.5],[3,0,3],[13,0,-2]].map(a=>new THREE.Vector3(...a));
 for(let i=0;i<Q;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.12),mat(0x3ec5ff));m.userData.r=new THREE.Vector3(-6+Math.random()*22,.6+Math.random()*1.5,-6+Math.random()*12);m.userData.t=i<12?tgt[i%4].clone().add(new THREE.Vector3(Math.random()*.6-.3,.8,Math.random()*.6-.3)):null;R.add(m);qs.push(m)}
 const offs=[];qs.slice(0,15).forEach(q=>{for(let k=0;k<4;k++){const l=seg(0xffd166,.7);l.userData={q,d:new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).multiplyScalar(1.6)};R.add(l);offs.push(l)}});
 const img=plane(3.2,2,new THREE.MeshBasicMaterial({map:TEX,transparent:true}));img.position.set(1,4.5,0);img.lookAt(-12,12,16);R.add(img);
 const proj=offs.slice(0,30).map(()=>{const l=seg(0xf472b6,.5);R.add(l);return l});
 const boxes=tgt.map((t,i)=>{const b=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(i==2?.8:2.2,1.5,i==2?.8:1)),new THREE.LineBasicMaterial({color:0xff9f43,transparent:true}));b.position.copy(t).setY(.75);R.add(b);
  const a=new THREE.ArrowHelper(new THREE.Vector3(1,0,0),t.clone().setY(1.6),i==2?.6:1.8,0x76b900);R.add(a);return{b,a}});
 let lys=[],dk=-1;
 return[{c:'학습된 3D reference point에 고정된 object query들 (PETR 방식). 실제는 query 900개, 화면은 60개. 영역: 전후 −108~150 m, 좌우 ±108 m, 높이 −3~5 m.',u:p=>{qs.forEach((m,i)=>{fade(m,sub(p,(i%10)/20,(i%10)/20+.5));m.position.copy(m.userData.r)});offs.forEach(l=>l.visible=false);proj.forEach(l=>l.visible=false);fade(img,0);boxes.forEach(o=>{fade(o.b,0);o.a.visible=false})}},
 {c:'Multi‑scale deformable cross‑attention: 각 query가 reference point 주변의 3D sampling offset을 예측합니다 (노랑).',u:p=>{offs.forEach(l=>{l.visible=true;const a=l.userData.q.position;setSeg(l,a,a.clone().add(l.userData.d.clone().multiplyScalar(p)))})}},
 {c:'샘플 위치를 intrinsics·렌즈 모델·extrinsics로 각 카메라 뷰에 투영해 Shared FPN 특징을 샘플링합니다 (분홍 선).',u:p=>{fade(img,1);proj.forEach((l,i)=>{l.visible=true;const a=offs[i].userData.q.position.clone().add(offs[i].userData.d);const b=img.position.clone().add(new THREE.Vector3((i%6-2.5)*.4,(i%4-1.5)*.35,0));setSeg(l,a,a.clone().lerp(b,p))})}},
 {c:'decoder 6층(폭 256): query self‑attention → deformable cross‑attention → FFN을 반복하며 query가 객체 쪽으로 정제됩니다.',u:p=>{offs.forEach(l=>l.visible=false);proj.forEach(l=>l.visible=false);const k=Math.min(5,p*6|0);if(k!==dk){dk=k;lys.forEach(s=>R.remove(s));const s=label(`decoder layer ${k+1}/6`,'#fff',.6);s.position.set(4,5,0);R.add(s);lys=[s];}
   qs.forEach(m=>{if(m.userData.t)m.position.lerpVectors(m.userData.r,m.userData.t,E(p));else fade(m,1-.8*p)})}},
 {c:'출력: 클래스 점수·3D 중심·크기·yaw·평면 속도(초록 화살표). 학습은 Hungarian 1:1 매칭 + focal/L1 손실, DN‑DETR denoising과 YOLOX식 보조 2D 헤드는 학습 시에만.',u:p=>{lys.forEach(s=>R.remove(s));lys=[];dk=-1;boxes.forEach(o=>{fade(o.b,p);o.a.visible=p>.3});qs.forEach(m=>{if(m.userData.t)fade(m,1-p)})}}]}},
{id:'occ',l:'Occupancy 헤드',s:'BEV → 3D voxel',cam:[-10,13,15],tg:[3,0,0],build(R){
 const c=car();R.add(c);const NX=12,NY=8,cs=1.2,cells=[];for(let x=0;x<NX;x++)for(let y=0;y<NY;y++){const m=plane(cs*.95,cs*.95,bmat(0x1f3b5a,.6));m.rotation.x=-Math.PI/2;m.position.set(-2+x*cs,.01,(y-NY/2+.5)*cs);R.add(m);cells.push({m,x,y})}
 const refs=[];[[3,2],[6,5],[9,3],[5,1]].forEach(([x,y])=>{for(let k=0;k<4;k++){const s=new THREE.Mesh(new THREE.SphereGeometry(.1),mat(0xffd166));s.position.set(-2+x*cs,.5+k*1.3,(y-NY/2+.5)*cs);R.add(s);refs.push(s)}});
 const img=plane(3.2,2,new THREE.MeshBasicMaterial({map:TEX,transparent:true}));img.position.set(4,6,-5);R.add(img);const ls=refs.map(()=>{const l=seg(0xf472b6,.5);R.add(l);return l});
 const fine=[];for(let x=0;x<NX*2;x++)for(let y=0;y<NY*2;y++){const m=plane(cs/2*.9,cs/2*.9,bmat(0x2b4f75,.7));m.rotation.x=-Math.PI/2;m.position.set(-2-cs/4+x*cs/2,.02,(y-NY+.5)*cs/2);R.add(m);fine.push({m,x,y})}
 const vox=[];fine.forEach(({x,y})=>{const u=x/(NX*2),w=y/(NY*2);let h=0,col=0x555b66;if(w<.2||w>.8){h=1+((x*7+y*3)%4);col=w<.2?0x8d99ae:0x22c55e}else if(Math.abs(w-.6)<.06&&x>9&&x<13){h=2;col=0xe63946}
  for(let k=0;k<Math.max(1,h);k++){const b=box(cs/2*.9,cs/2*.9,cs/2*.9,col);b.position.set(-2-cs/4+x*cs/2,cs/4+k*cs/2,(y-NY+.5)*cs/2);b.userData.k=k;R.add(b);vox.push(b)}});
 return[{c:'rig 좌표계의 BEV 격자. 메모리를 아끼려 중간 특징은 BEV로 유지하고 높이는 출력에서야 도입. rig 좌표에서 정의되므로 ego motion 추정 불필요.',u:p=>{cells.forEach(o=>fade(o.m,sub(p,o.x/24,o.x/24+.5)*.6));[...refs,img].forEach(o=>fade(o,0));ls.forEach(l=>l.visible=false);fine.forEach(o=>fade(o.m,0));vox.forEach(b=>fade(b,0))}},
 {c:'각 BEV 셀의 수직 기둥에 균등 간격 reference point 4개를 둡니다 (Deformable DETR에서 영감 받은 BEV projector).',u:p=>refs.forEach((s,i)=>fade(s,sub(p,(i%4)*.15,(i%4)*.15+.4)))},
 {c:'deformable cross‑attention으로 reference point를 카메라에 투영해 멀티스케일 이미지 특징(Shared FPN)을 모읍니다.',u:p=>{fade(img,1);ls.forEach((l,i)=>{l.visible=true;const a=refs[i].position,b=img.position.clone().add(new THREE.Vector3((i%4-1.5)*.6,(i%3-1)*.5,0));setSeg(l,a,a.clone().lerp(b,p))})}},
 {c:'2D transposed convolution으로 BEV 특징을 업샘플합니다 (배율은 개념도).',u:p=>{ls.forEach(l=>l.visible=false);fade(img,0);refs.forEach(s=>fade(s,0));cells.forEach(o=>fade(o.m,.6*(1-p)));fine.forEach(o=>fade(o.m,p))}},
 {c:'channel‑to‑height 변환으로 binary 점유 logit + semantic logit 생성 → 0.2 m voxel (전후 −20~100 m, 좌우 ±30 m, 높이 −3~5 m). 추론 시 점유 확률 임계값 후 최고 점수 클래스 부여.',u:p=>{vox.forEach(b=>{const q=sub(p,b.userData.k*.15,b.userData.k*.15+.4);fade(b,q);b.scale.y=Math.max(.01,q)})}}]}}];
// ---------- stage ----------
const host=$('stage3d');const R0=new THREE.WebGLRenderer({antialias:devicePixelRatio<2,alpha:true});R0.setPixelRatio(Math.min(devicePixelRatio,1.75));host.appendChild(R0.domElement);
const scene=new THREE.Scene();scene.add(new THREE.AmbientLight(0xffffff,.7));const dl=new THREE.DirectionalLight(0xffffff,.9);dl.position.set(5,10,7);scene.add(dl);
const GRID=new THREE.GridHelper(60,30,0x1e2738,0x101622);scene.add(GRID);const cam=new THREE.PerspectiveCamera(50,1,.1,500);const ctl=new OrbitControls(cam,R0.domElement);ctl.enableDamping=true;
let root=null,cur=-1,steps=[],si=0,t0=0,el=0,last=0,playing=true,all=false;const DUR=3200;
function size(){const w=host.clientWidth,h=host.clientHeight;R0.setSize(w,h);cam.aspect=w/h;cam.updateProjectionMatrix()}size();addEventListener('resize',size);
function dispose(o){o.traverse(m=>{m.geometry?.dispose();if(m.material){m.material.map&&m.material.map!==TEX&&m.material.map!==DEP&&m.material.map!==SEM&&m.material.map.dispose();m.material.dispose()}})}
function load(i,k=0){if(root){scene.remove(root);dispose(root)}cur=i;const M=MODS[i];root=new THREE.Group();scene.add(root);steps=M.build(root);
 GRID.visible=!['enc','tok','agg','fpn'].includes(M.id);const nar=host.clientWidth<500?(GRID.visible?1.1:1.3):1;cam.position.set(...M.cam).multiplyScalar(nar);ctl.target.set(...M.tg);
 document.querySelectorAll('.mod').forEach(b=>b.classList.toggle('on',b.dataset.i==i));$('stageTitle').textContent=`${M.l} — ${M.s}`;
 $('stageDots').innerHTML=steps.map((_,j)=>`<span data-j="${j}"></span>`).join('');$('stageDots').querySelectorAll('span').forEach(s=>s.onclick=()=>go(+s.dataset.j));go(k)}
function go(k){if(k<si||k===0){const i=cur;if(root){scene.remove(root);dispose(root)}root=new THREE.Group();scene.add(root);steps=MODS[i].build(root);}
 for(let j=0;j<k;j++){steps[j].u(0.001);steps[j].u(1)}si=k;el=0;steps[k].u(0);$('stageCap').innerHTML=`<b>${k+1}/${steps.length}</b> ${steps[k].c}`;
 $('stageDots').querySelectorAll('span').forEach((s,j)=>s.classList.toggle('on',j<=k))}
function next(){if(si<steps.length-1)go(si+1);else if(all&&cur<MODS.length-1)load(cur+1);else{playing=false;all=false;$('sPlay').textContent='↻ 다시';}}
$('sNext').onclick=()=>{steps[si].u(1);next()};$('sPrev').onclick=()=>go(Math.max(0,si-1));
$('sPlay').onclick=()=>{if(!playing&&si==steps.length-1&&el>=DUR){go(0)}playing=!playing;$('sPlay').textContent=playing?'⏸ 일시정지':'▶ 재생'};
$('sAll').onclick=()=>{all=true;playing=true;$('sPlay').textContent='⏸ 일시정지';load(0)};
// selector
const cols=[[0],[1],[2],[3],[4,5,6,7,8]];const pipe=document.getElementById('archDiagram');
cols.forEach(cs=>{const d=document.createElement('div');d.className='col';cs.forEach(i=>{const b=document.createElement('button');b.className='mod'+(i>=7?' sub':'');b.dataset.i=i;b.innerHTML=`${i>=7?'↳ ':''}${MODS[i].l}<small>${MODS[i].s}</small>`;b.onclick=()=>{all=false;playing=true;$('sPlay').textContent='⏸ 일시정지';load(i);if(innerWidth<800)host.scrollIntoView({behavior:'smooth',block:'center'})};d.appendChild(b)});pipe.appendChild(d)});
// loop, pause offscreen
let vis=false;new IntersectionObserver(e=>{vis=e[0].isIntersecting;if(vis){last=0;requestAnimationFrame(loop)}}).observe(host);
function loop(now){if(!vis)return;const dt=last?Math.min(100,now-last):0;last=now;if(playing){el+=dt;const p=Math.min(1,el/DUR);steps[si].u(p);if(el>DUR+900)next()}
 ctl.update();R0.render(scene,cam);requestAnimationFrame(loop)}
load(0);playing=true;
