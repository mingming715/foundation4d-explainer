import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const scenes=[];
function make(id,camPos,auto=false){const el=document.getElementById(id);const r=new THREE.WebGLRenderer({antialias:true,alpha:true});
 r.setPixelRatio(Math.min(devicePixelRatio,2));r.setSize(el.clientWidth,el.clientHeight);el.appendChild(r.domElement);
 const sc=new THREE.Scene();sc.fog=new THREE.Fog(0x05070c,60,260);const cam=new THREE.PerspectiveCamera(50,el.clientWidth/el.clientHeight,.1,1000);cam.position.set(...camPos);
 const c=new OrbitControls(cam,r.domElement);c.enableDamping=true;c.autoRotate=auto;c.autoRotateSpeed=.6;if(id==='hero3d')c.enableZoom=false;
 sc.add(new THREE.AmbientLight(0xffffff,.6));const dl=new THREE.DirectionalLight(0xffffff,1);dl.position.set(20,40,10);sc.add(dl);
 const grid=new THREE.GridHelper(300,60,0x1e2738,0x111827);sc.add(grid);
 const o={el,r,sc,cam,c,upd:[]};scenes.push(o);return o;}
function car(){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(4.6,1.4,2),new THREE.MeshStandardMaterial({color:0x76b900,metalness:.4,roughness:.4}));b.position.y=.9;g.add(b);
 const t=new THREE.Mesh(new THREE.BoxGeometry(2.4,.8,1.8),new THREE.MeshStandardMaterial({color:0x2d3a1a}));t.position.set(-.2,2,0);g.add(t);return g;}
// 6 cameras (yaw deg, fov deg) — 배치는 개념적(논문은 화각이 다른 f-theta 6대라고만 명시)
const CAMS=[[0,60,0x3ec5ff],[0,30,0x7dd3fc],[60,100,0xc084fc],[-60,100,0xc084fc],[150,100,0xf472b6],[-150,100,0xf472b6]];
function frustum(yaw,fov,col,len=14){const h=Math.tan(THREE.MathUtils.degToRad(fov/2))*len,v=h*.56;
 const p=[[0,0,0],[len,v,h],[len,v,-h],[len,-v,-h],[len,-v,h]].map(a=>new THREE.Vector3(...a));
 const geo=new THREE.BufferGeometry().setFromPoints([p[0],p[1],p[0],p[2],p[0],p[3],p[0],p[4],p[1],p[2],p[2],p[3],p[3],p[4],p[4],p[1]]);
 const g=new THREE.Group();g.add(new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:col,transparent:true,opacity:.9})));
 const fg=new THREE.BufferGeometry().setFromPoints([p[0],p[1],p[2],p[0],p[2],p[3],p[0],p[3],p[4],p[0],p[4],p[1]]);fg.computeVertexNormals();
 g.add(new THREE.Mesh(fg,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.07,side:THREE.DoubleSide,depthWrite:false})));
 g.position.y=1.8;g.rotation.y=THREE.MathUtils.degToRad(yaw);return g;}
const rnd=(()=>{let s=3;return()=>(s=(s*16807)%2147483647)/2147483647})();

// HERO
{const o=make('hero3d',[-48,34,48],true);o.sc.add(car());const fr=new THREE.Group();CAMS.forEach(c=>fr.add(frustum(...c)));o.sc.add(fr);
 const N=1500,geo=new THREE.BoxGeometry(.9,.9,.9),mat=new THREE.MeshStandardMaterial({transparent:true,opacity:.85});
 const tok=new THREE.InstancedMesh(geo,mat,N);const m=new THREE.Matrix4(),col=new THREE.Color();const base=[];let k=0;
 const pal={road:0x334155,walk:0x64748b,veg:0x22c55e,bld:0x38bdf8};
 while(k<N){const x=(rnd()-.5)*90,z=(rnd()-.5)*60;const az=Math.abs(z);let y=0,c;
  if(az<7){c=pal.road;y=0}else if(az<10){c=pal.walk;y=.2}else if(rnd()<.5){c=pal.bld;y=Math.floor(rnd()*6)}else{c=pal.veg;y=Math.floor(rnd()*3)}
  if(Math.abs(x)<4&&az<2)continue;m.setPosition(Math.round(x),y+.45,Math.round(z));tok.setMatrixAt(k,m);tok.setColorAt(k,col.set(c));base.push([Math.round(x),y+.45,Math.round(z)]);k++;}
 o.sc.add(tok);
 const boxes=new THREE.Group();const actors=[];[[14,3.5,0xff9f43],[-12,-3.5,0xff9f43],[28,-3.5,0xfacc15],[6,8.5,0xf472b6]].forEach(([x,z,c],i)=>{const s=i==3?[.8,1.8,.8]:[4.4,1.6,2];
  const b=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(...s)),new THREE.LineBasicMaterial({color:c}));b.position.set(x,s[1]/2,z);boxes.add(b);actors.push({b,x,v:i==3?.6:(z>0?-4:5)})});o.sc.add(boxes);
 const ui=id=>document.getElementById(id);ui('tgFrustum').onchange=e=>fr.visible=e.target.checked;ui('tgTokens').onchange=e=>tok.visible=e.target.checked;ui('tgBoxes').onchange=e=>boxes.visible=e.target.checked;
 o.upd.push(t=>{if(!ui('tgTime').checked)return;actors.forEach(a=>{let x=a.x+a.v*(t%10);a.b.position.x=((x+45)%90+90)%90-45})});}

// RANGES
{const o=make('range3d',[-160,140,170]);o.sc.fog=null;o.sc.add(car());
 const bx=(x0,x1,y0,y1,z0,z1,c)=>{const g=new THREE.BoxGeometry(x1-x0,z1-z0,y1-y0);const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.08,depthWrite:false}));
  const e=new THREE.LineSegments(new THREE.EdgesGeometry(g),new THREE.LineBasicMaterial({color:c}));const grp=new THREE.Group();grp.add(m,e);grp.position.set((x0+x1)/2,(z0+z1)/2,-(y0+y1)/2);return grp};
 o.sc.add(bx(-108,150,-108,108,-3,5,0x3ec5ff));o.sc.add(bx(-20,100,-30,30,-3,5,0x76b900));
 const ax=new THREE.ArrowHelper(new THREE.Vector3(1,0,0),new THREE.Vector3(0,.1,0),30,0xffffff);o.sc.add(ax);}

// GAUSSIANS
{const o=make('gauss3d',[-30,22,30]);const N=1800;const geo=new THREE.SphereGeometry(1,8,6);
 const st=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({transparent:true,opacity:.55}),N);const m=new THREE.Matrix4(),q=new THREE.Quaternion(),c=new THREE.Color();
 for(let i=0;i<N;i++){const x=(rnd()-.5)*70,z=(rnd()-.5)*40,side=Math.abs(z)>8;const y=side?rnd()*6:0;
  q.setFromEuler(new THREE.Euler(rnd()*3,rnd()*3,rnd()*3));m.compose(new THREE.Vector3(x,y,z),q,new THREE.Vector3(.3+rnd()*.9,.15+rnd()*.4,.3+rnd()*.9));st.setMatrixAt(i,m);
  st.setColorAt(i,c.setHSL(side?.55+rnd()*.1:.6,.2,.3+rnd()*.3));}
 o.sc.add(st);const actor=new THREE.Group();for(let i=0;i<160;i++){const s=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL(.07+rnd()*.04,.9,.5),transparent:true,opacity:.75}));
  s.position.set((rnd()-.5)*4.4,rnd()*1.6+.2,(rnd()-.5)*2);s.scale.setScalar(.2+rnd()*.3);actor.add(s)}o.sc.add(actor);
 const pts=[];for(let i=0;i<=60;i++){const t=i/60;pts.push(new THREE.Vector3(-30+60*t,.05,3.5+2*Math.sin(t*6)))}const curve=new THREE.CatmullRomCurve3(pts);
 o.sc.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(100)),new THREE.LineBasicMaterial({color:0xff9f43})));
 o.upd.push(t=>{const u=(t*.08)%1;actor.position.copy(curve.getPoint(u));actor.lookAt(curve.getPoint(Math.min(u+.01,1)));actor.rotateY(-Math.PI/2)});}

// LIDAR
{const o=make('lidar3d',[-40,30,40]);o.sc.add(car());const N=12000,pos=new Float32Array(N*3),col=new Float32Array(N*3);
 for(let i=0;i<N;i++){const x=(rnd()-.5)*120,z=(rnd()-.5)*60,az=Math.abs(z);const y=az>10?rnd()*8:0;pos.set([x,y,z],i*3);const g=.35+.4*rnd();col.set(az>10?[.3,.6*g+.2,1]:[g,g,g],i*3)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));
 o.sc.add(new THREE.Points(g,new THREE.PointsMaterial({size:.25,vertexColors:true})));
 const scans=[];for(let k=0;k<10;k++){const n=250,p=new Float32Array(n*3);for(let i=0;i<n;i++)p.set([(rnd()-.5)*4.4,rnd()*1.6,(rnd()-.5)*2],i*3);
  const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.BufferAttribute(p,3));const pt=new THREE.Points(gg,new THREE.PointsMaterial({size:.18,color:0xff9f43,transparent:true,opacity:.15+k*.085}));pt.userData.k=k;o.sc.add(pt);scans.push(pt)}
 const box=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(4.4,1.6,2)),new THREE.LineBasicMaterial({color:0xff9f43}));box.position.set(15,.8,4);o.sc.add(box);
 o.upd.push(t=>{const w=(Math.sin(t*.6)+1)/2;scans.forEach(s=>{const k=s.userData.k;s.position.set(15-(9-k)*2.2*(1-w),0,4)})});}

const clock=new THREE.Clock();
function loop(){const t=clock.getElapsedTime();scenes.forEach(o=>{o.upd.forEach(f=>f(t));o.c.update();o.r.render(o.sc,o.cam)});requestAnimationFrame(loop)}loop();
addEventListener('resize',()=>scenes.forEach(o=>{const w=o.el.clientWidth,h=o.el.clientHeight;o.r.setSize(w,h);o.cam.aspect=w/h;o.cam.updateProjectionMatrix()}));
