const tip=d3.select('body').append('div').attr('class','tooltip').style('opacity',0);
const showTip=(e,h)=>tip.style('opacity',1).html(h).style('left',e.clientX+12+'px').style('top',e.clientY+12+'px');
const hideTip=()=>tip.style('opacity',0);
const W=el=>Math.min(document.querySelector(el).clientWidth||900,1100);

// KaTeX (요약 표기)
const K=(id,s)=>katex.render(s,document.getElementById(id),{displayMode:true,throwOnError:false});
K('eq1','\\mathbf{T}_{t,c}=\\mathbf{E}(\\tau_{t,c})\\,\\mathbf{R}_c');
K('eq2','\\mathbf{p}(u)=\\mathbf{R}\\left(\\frac{d(u)}{r_z(u)}\\,\\mathbf{r}(u)\\right)+\\mathbf{t}');
K('eq10','\\hat{C}=\\operatorname{clip}_{[0,1]}\\!\\Big(\\mathbf{M}\\big(C_{\\text{GS}}+(1-A)\\,C_{\\text{sky}}\\big)+\\mathbf{b}\\Big)');

// Attention cost
function attn(){const T=+document.getElementById('tSlider').value;document.getElementById('tVal').textContent=T;
 const C=6,N=37*37,img=C*T*N*N,glob=(C*T*N)**2,view=T*(C*N)**2,time=C*(T*N)**2;
 const fact=img+(view+time)/2;
 const data=[['Global (VGGT)',glob+img],['Factorized (평균)',fact]];
 const el=d3.select('#attnChart');el.selectAll('*').remove();const w=W('#attnChart'),h=150;
 const s=el.append('svg').attr('width',w).attr('height',h);const x=d3.scaleLinear([0,data[0][1]],[0,w-170]);
 s.selectAll('rect').data(data).join('rect').attr('x',140).attr('y',(d,i)=>20+i*55).attr('height',36).attr('rx',5)
  .attr('fill',(d,i)=>i?'#76b900':'#ff6b6b').attr('width',0).transition().attr('width',d=>x(d[1]));
 s.selectAll('text.l').data(data).join('text').attr('x',0).attr('y',(d,i)=>43+i*55).text(d=>d[0]).style('font-size','13px');
 s.append('text').attr('x',140).attr('y',140).style('font-size','12px').attr('fill','#8a96ab').text(`Factorized ≈ Global의 ${(fact/(glob+img)*100).toFixed(1)}% (토큰 쌍 수 기준 개념 계산)`);}
document.getElementById('tSlider').oninput=attn;attn();

// Related work graph
(()=>{const nodes=[{id:'Foundation4D',g:0,t:'기하·의미 인지 + Gaussian 재구성을 한 모델에 통합. ego motion과 camera-to-rig calibration을 명시적으로 추정.'},
{id:'VGGT',g:1,t:'카메라 파라미터와 dense geometry 공동 복원. Foundation4D는 이 구조를 따르되 global attention을 카메라/시간으로 분해.'},
{id:'GeoUP',g:1,t:'가장 가까운 연구. 보정된 멀티카메라 비디오에서 depth·3D 객체·occupancy 예측. 정답 ego pose가 필요하지만 Foundation4D는 이미지에서 직접 예측.'},
{id:'UniAD',g:2,t:'task query로 인지·예측·계획 연결.'},{id:'PARA-Drive',g:2,t:'공유 BEV 특징 위 병렬 태스크 헤드.'},
{id:'DUSt3R/MASt3R',g:1,t:'pointmap·대응점 기반 재구성.'},{id:'VGGT-Long/SLAM',g:1,t:'지역 재구성 정렬 + 전역 최적화 → Foundation4D의 local-to-global 전략의 기반.'},
{id:'PETR',g:3,t:'카메라 frustum position embedding. Foundation4D 검출 query의 기반.'},{id:'DETR3D',g:3,t:'Foundation4D 검출 decoder 구조.'},{id:'RayDN',g:3,t:'ray 방향 hard negative query denoising.'},
{id:'SORT/AB3DMOT',g:3,t:'Kalman+Hungarian 추적. Foundation4D는 offline 2-pass + RTS smoother.'},
{id:'TPVFormer/SurroundOcc',g:4,t:'semantic occupancy 계열.'},{id:'Instant NuRec',g:5,t:'feed-forward Gaussian 주행 장면. Foundation4D가 계층적 장면 표현을 따름.'},
{id:'STORM/DGGT',g:5,t:'feed-forward Gaussian 재구성.'},{id:'3DGUT',g:5,t:'비선형 카메라 투영·rolling shutter 지원.'}];
 const links=nodes.slice(1).map(n=>({source:'Foundation4D',target:n.id}));
 const col=d3.scaleOrdinal([0,1,2,3,4,5],['#76b900','#3ec5ff','#c084fc','#ff9f43','#f472b6','#facc15']);
 const w=W('#relGraph'),h=440,s=d3.select('#relGraph').append('svg').attr('width',w).attr('height',h);
 const sim=d3.forceSimulation(nodes).force('l',d3.forceLink(links).id(d=>d.id).distance(150)).force('c',d3.forceManyBody().strength(-300)).force('m',d3.forceCenter(w/2,h/2)).force('x',d3.forceX(w/2).strength(.05)).force('y',d3.forceY(h/2).strength(.08));
 const l=s.selectAll('line').data(links).join('line').attr('stroke','#1e2738');
 const g=s.selectAll('g').data(nodes).join('g').style('cursor','pointer').call(d3.drag().on('drag',(e,d)=>{d.fx=e.x;d.fy=e.y;sim.alpha(.3).restart()}))
  .on('click',(e,d)=>d3.select('#relInfo').html(`<b>${d.id}</b> — ${d.t}`));
 g.append('circle').attr('r',d=>d.g?9:18).attr('fill',d=>col(d.g));g.append('text').attr('dx',14).attr('dy',4).style('font-size','12px').text(d=>d.id);
 sim.on('tick',()=>{nodes.forEach(n=>{n.x=Math.max(20,Math.min(w-120,n.x));n.y=Math.max(20,Math.min(h-20,n.y))});l.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y);g.attr('transform',d=>`translate(${d.x},${d.y})`)});})();

// Architecture diagram
(()=>{const M=[
{id:'in',x:0,y:1.5,l:'6 카메라 × T 시점',t:'C대 카메라 × T 시점 이미지. 첫 번째 카메라가 기준 시각, 각 이미지는 자기 촬영 시각 τ를 가짐(비동기 입력 지원).'},
{id:'enc',x:1,y:1.5,l:'DINOv2 ViT-L/14',t:'이미지별 패치 특징, 폭 1024. 1036×1036 → 74×74 격자 → 37×37 bilinear 다운샘플. 원해상도 특징은 FPN에서 사용.'},
{id:'tok',x:2,y:0.4,l:'rig · ego · register×4',t:'rig 토큰: 상대 calibration / ego 토큰: rig 움직임 / register 토큰 4개: 보조.'},
{id:'agg',x:2,y:1.5,l:'Factorized Attention ×16',t:'이미지 내부 attention + (카메라 간 view attention ↔ 시간축 time attention) 교대. 16 레이어(8쌍). 마지막 이미지/시간 블록 출력 concat → 폭 2d 문맥 토큰.'},
{id:'geo',x:3.3,y:0,l:'Geometry 헤드',t:'rig 헤드(첫 시점 rig 토큰) + ego 헤드(기준 카메라 ego 토큰): translation+quaternion 회귀. DPT decoder: z-depth, pointmap, 21클래스 semantic (518×518). 식 (1)(2)(3).'},
{id:'gs',x:3.3,y:1,l:'Gaussian 헤드',t:'픽셀당 Gaussian 1개(중심·RGB·스케일·quaternion·opacity) + 하늘 cubemap + 카메라별 affine 색. 식 (9)(10)(11)(12).'},
{id:'fpn',x:3.3,y:2.2,l:'Shared FPN',t:'고해상도 이미지 특징과 문맥 특징을 top-down으로 결합. Detection·Occupancy가 공유.'},
{id:'det',x:4.5,y:1.8,l:'Detection 헤드',t:'PETR식 query 900개, DETR3D decoder 6층, 폭 256. 클래스·3D 중심·크기·yaw·평면 속도. Hungarian 매칭, focal + L1, DN-DETR denoising, YOLOX 보조 2D 헤드(학습 시만).'},
{id:'occ',x:4.5,y:2.7,l:'Occupancy 헤드',t:'BEV projector(기둥당 ref point 4개, deformable cross-attn) → 2D transposed conv 업샘플 → channel-to-height. 0.2 m voxel. 식 (8).'}];
 const E=[['in','enc'],['enc','agg'],['tok','agg'],['agg','geo'],['agg','gs'],['agg','fpn'],['enc','fpn'],['fpn','det'],['fpn','occ']];
 const w=W('#archDiagram'),h=360,bw=Math.min(150,w/5.6),x=d=>20+d*(w-bw-40)/4.5,y=d=>20+d*110;
 const s=d3.select('#archDiagram').append('svg').attr('width',w).attr('height',h);
 s.append('defs').append('marker').attr('id','ar').attr('viewBox','0 0 10 10').attr('refX',9).attr('refY',5).attr('markerWidth',6).attr('markerHeight',6).attr('orient','auto').append('path').attr('d','M0,0L10,5L0,10z').attr('fill','#3ec5ff');
 const by=Object.fromEntries(M.map(m=>[m.id,m]));
 s.selectAll('path.e').data(E).join('path').attr('fill','none').attr('stroke','#2b3a55').attr('stroke-width',1.6).attr('marker-end','url(#ar)')
  .attr('d',([a,b])=>{const A=by[a],B=by[b];const x1=x(A.x)+bw,y1=y(A.y)+20,x2=x(B.x),y2=y(B.y)+20;return `M${x1},${y1}C${(x1+x2)/2},${y1} ${(x1+x2)/2},${y2} ${x2},${y2}`});
 const g=s.selectAll('g.m').data(M).join('g').attr('transform',d=>`translate(${x(d.x)},${y(d.y)})`).style('cursor','pointer')
  .on('mouseover',(e,d)=>showTip(e,d.l)).on('mouseout',hideTip)
  .on('click',function(e,d){g.select('rect').attr('stroke','#2b3a55');d3.select(this).select('rect').attr('stroke','#76b900');d3.select('#archInfo').html(`<b>${d.l}</b> — ${d.t}`)});
 g.append('rect').attr('width',bw).attr('height',40).attr('rx',8).attr('fill','#0f1420').attr('stroke','#2b3a55').attr('stroke-width',2);
 g.append('text').attr('x',bw/2).attr('y',25).attr('text-anchor','middle').style('font-size','12px').text(d=>d.l);})();

// Attention grid
(()=>{const C=6,T=4,cell=46,el=d3.select('#attnGrid');let mode='view',sel=[2,1];
 const s=el.append('svg').attr('width',70+T*cell+10).attr('height',30+C*cell);
 for(let t=0;t<T;t++)s.append('text').attr('x',70+t*cell+cell/2).attr('y',16).attr('text-anchor','middle').style('font-size','12px').text('t'+(t+1));
 for(let c=0;c<C;c++)s.append('text').attr('x',0).attr('y',30+c*cell+cell/2+4).style('font-size','12px').text('cam '+(c+1));
 const d=d3.cross(d3.range(C),d3.range(T));
 const r=s.selectAll('rect').data(d).join('rect').attr('x',v=>70+v[1]*cell).attr('y',v=>24+v[0]*cell).attr('width',cell-4).attr('height',cell-4).attr('rx',6).style('cursor','pointer').on('click',(e,v)=>{sel=v;draw()});
 function draw(){r.attr('fill',v=>{if(v[0]==sel[0]&&v[1]==sel[1])return'#76b900';const on=mode=='global'||(mode=='view'&&v[1]==sel[1])||(mode=='time'&&v[0]==sel[0]);return on?'#1f6f8b':'#141b29'})}
 d3.selectAll('#attnModes button').on('click',function(){mode=this.dataset.m;d3.selectAll('#attnModes button').classed('on',false);d3.select(this).classed('on',true);draw()});draw();})();

// geometry loss weights
(()=>{const d=[['depth',1],['pointmap',1],['rig',10],['ego',10],['상대움직임',1],['semantic',1]];
 const w=W('#lossChart'),h=170,s=d3.select('#lossChart').append('svg').attr('width',w).attr('height',h);
 const x=d3.scaleBand(d.map(v=>v[0]),[40,w-10]).padding(.3),y=d3.scaleLinear([0,10],[h-30,10]);
 s.selectAll('rect').data(d).join('rect').attr('x',v=>x(v[0])).attr('width',x.bandwidth()).attr('y',v=>y(v[1])).attr('height',v=>h-30-y(v[1])).attr('fill','#3ec5ff').attr('rx',4).on('mousemove',(e,v)=>showTip(e,`${v[0]}: λ=${v[1]}`)).on('mouseout',hideTip);
 s.append('g').attr('transform',`translate(0,${h-30})`).call(d3.axisBottom(x));s.append('g').attr('transform','translate(40,0)').call(d3.axisLeft(y).ticks(5));})();

// Table 1
(()=>{const cats=['Urban','Residential','Highway','Rural','Other'],kor={Urban:'도심',Residential:'주거지',Highway:'고속도로',Rural:'교외',Other:'기타'};
 const D=[{n:'NRE',clips:67970,v:[16.5,9.1,64.5,7.6,2.3]},{n:'PlanNet',clips:75921,v:[42.5,17.3,20.8,16.5,2.9]},{n:'MLMCF',clips:59999,v:[36.5,10.9,42.9,6.9,2.8]}];
 const col=d3.scaleOrdinal(cats,['#3ec5ff','#c084fc','#76b900','#facc15','#64748b']);
 const w=W('#tab1Chart'),h=230,s=d3.select('#tab1Chart').append('svg').attr('width',w).attr('height',h);
 const x=d3.scaleLinear([0,100],[150,w-20]);
 D.forEach((r,i)=>{let acc=0;s.append('text').attr('x',0).attr('y',40+i*60).style('font-size','14px').html(`${r.n} <tspan fill="#8a96ab" font-size="12">${r.clips.toLocaleString()} clips</tspan>`);
  r.v.forEach((v,j)=>{s.append('rect').attr('x',x(acc)).attr('y',20+i*60).attr('height',32).attr('width',x(v)-x(0)).attr('fill',col(cats[j])).attr('stroke','#07090f')
   .on('mousemove',e=>showTip(e,`${r.n} · ${kor[cats[j]]} ${v}%`)).on('mouseout',hideTip);
   if(v>8)s.append('text').attr('x',x(acc+v/2)).attr('y',41+i*60).attr('text-anchor','middle').style('font-size','11px').style('pointer-events','none').text(v+'%');acc+=v;});});
 cats.forEach((c,j)=>{s.append('rect').attr('x',150+j*100).attr('y',200).attr('width',12).attr('height',12).attr('fill',col(c));s.append('text').attr('x',166+j*100).attr('y',211).style('font-size','12px').text(kor[c])});})();

// Stages
(()=>{const S=[{n:'1단계',u:170000,t:'짧은 윈도우: 카메라당 4시점, 최대 stride 8, 약 17만 업데이트. encoder·aggregator·geometry·detection·occupancy 공동학습. AdamW lr 3×10⁻⁴, wd 0.01.'},
{n:'2단계',u:45000,t:'윈도우 확장: 8시점, 최대 stride 16, 4만5천 업데이트. image encoder 고정. 포즈·움직임 추정에 시간 문맥 추가.'},
{n:'3단계 (Gaussian)',u:10000,t:'기존 모델 고정 후 Gaussian 헤드 warm-up → aggregator + 4개 헤드 1만 업데이트 결합 fine-tuning, lr 10⁻⁵. 가중치 geo 1 / det 0.1 / occ 0.2 / GS 4.'}];
 const w=W('#stageChart'),h=90,s=d3.select('#stageChart').append('svg').attr('width',w).attr('height',h);const tot=d3.sum(S,d=>d.u),x=d3.scaleLinear([0,tot],[0,w]);let acc=0;
 S.forEach((d,i)=>{const g=s.append('g').style('cursor','pointer').on('click',()=>d3.select('#stageInfo').html(`<b>${d.n}</b> — ${d.t}`));
  g.append('rect').attr('x',x(acc)).attr('y',10).attr('width',Math.max(x(d.u)-2,60)).attr('height',50).attr('rx',6).attr('fill',['#1f6f8b','#3a7d2c','#b45309'][i]);
  g.append('text').attr('x',x(acc)+8).attr('y',32).style('font-size','12px').text(d.n);g.append('text').attr('x',x(acc)+8).attr('y',50).style('font-size','11px').text(d.u.toLocaleString()+' upd');acc+=d.u;});
 s.append('text').attr('x',0).attr('y',82).attr('fill','#8a96ab').style('font-size','11px').text('막대 길이 = 업데이트 수 비례 (3단계는 warm-up 제외 결합 업데이트)');})();

// PGO concept animation
(()=>{const w=W('#pgoChart'),h=260,s=d3.select('#pgoChart').append('svg').attr('width',w).attr('height',h);const N=40;
 const gt=d3.range(N).map(i=>[40+i*(w-80)/(N-1),h/2+60*Math.sin(i/7)]);
 const rnd=d3.randomNormal.source(d3.randomLcg(7))(0,1);const drift=[];let a=0;for(let i=0;i<N;i++){a+=0.004*rnd()+0.0025;drift.push(a)}
 const stitched=gt.map((p,i)=>{const dx=p[0]-gt[0][0];return[p[0],p[1]+dx*drift[i]*1.2]});
 const pgo=gt.map((p,i)=>[p[0],p[1]+3*rnd()]);
 const line=d3.line().curve(d3.curveCatmullRom);
 s.append('path').attr('d',line(gt)).attr('stroke','#64748b').attr('stroke-dasharray','5 5').attr('fill','none');
 s.append('text').attr('x',10).attr('y',20).attr('fill','#8a96ab').style('font-size','12px').text('점선: 실제 궤적(개념) · 실선: 추정 궤적');
 const p=s.append('path').attr('stroke','#76b900').attr('stroke-width',3).attr('fill','none');
 const dots=s.selectAll('circle').data(gt).join('circle').attr('r',3).attr('fill','#3ec5ff');
 function show(m){const d=m=='stitch'?stitched:pgo;p.transition().duration(900).attr('d',line(d)).attr('stroke',m=='stitch'?'#ff6b6b':'#76b900');dots.data(d).transition().duration(900).attr('cx',v=>v[0]).attr('cy',v=>v[1]);}
 d3.selectAll('#pgoModes button').on('click',function(){d3.selectAll('#pgoModes button').classed('on',false);d3.select(this).classed('on',true);show(this.dataset.m)});show('stitch');})();

d3.select('#trackFlow').selectAll('div').data(['클립 전체 3D 검출 수집','ego 궤적으로 world 좌표 변환','등속 Kalman (위치+속도 측정)','Hungarian 할당 (거리 gate)','1차: 짧은 수명 보수적 트랙','보간·평활화','2차: 긴 수명으로 조각 연결','RTS 역방향 smoother','높이·yaw 평활 / 크기 중앙값']).join('div').html((d,i)=>`<b style="color:#76b900">${i+1}</b> ${d}`);

// PAI pipeline
(()=>{const S=[{l:'입력',t:'LiDAR, 포즈, cuboid 트랙, 트랙 연결 instance 마스크(SAM 2, 투영 cuboid 박스 프롬프트).',x:0,y:1},
{l:'동적 점 추출·캐시',t:'평활 cuboid 궤적으로 정적/동적 분류. 동적 트랙은 여유 crop 안 점을 추출, 최대 10 스캔 지역 윈도우에서 목표 시각 actor 포즈로 warp.',x:1,y:0.4},
{l:'정적 점 누적',t:'클립 전체에서 ego motion 보상해 world 좌표로 누적. 국소 밀도 필터(여러 스캔이 지지하는 희소 평면은 보존). 신뢰도 높은 지면은 정적으로 복원.',x:1,y:1.6},
{l:'Depth 렌더링',t:'rolling shutter 노출 중 카메라 움직임 고려. 정적=가장 가까운 보이는 LiDAR 점, 동적=고정 반경 Gaussian splat + occlusion 검사. 동적 마스크 내 결측 → invalid. 결측/하늘/자차 = 0.',x:2,y:0.4},
{l:'Semantic voting·voxel화',t:'여러 카메라·프레임 semantic segmentation의 depth 일치 투표(가까운 관측 가중↑), 정적 cuboid 클래스로 보완. 동적 점은 트랙 클래스 상속. 신호등·표지판은 3D 연결 점으로 전파.',x:2,y:1.6},
{l:'출력 Depth',t:'정적 depth + 동적 depth 합성.',x:3,y:0.4},
{l:'출력 Occupancy',t:'0.1 m voxel. 겹치면 동적 우선(도로·보도·지형 등 정적 예외). voxel별 m/s 3D 속도.',x:3,y:1.6}];
 const E=[[0,1],[0,2],[1,3],[2,3],[1,4],[2,4],[3,5],[4,6]];
 const w=W('#paiDiagram'),h=260,bw=Math.min(170,w/4.6),x=v=>10+v*(w-bw-20)/3,y=v=>v*120+10;
 const s=d3.select('#paiDiagram').append('svg').attr('width',w).attr('height',h);
 s.selectAll('line').data(E).join('line').attr('x1',d=>x(S[d[0]].x)+bw).attr('y1',d=>y(S[d[0]].y)+20).attr('x2',d=>x(S[d[1]].x)).attr('y2',d=>y(S[d[1]].y)+20).attr('stroke','#2b3a55').attr('stroke-width',1.6);
 const g=s.selectAll('g').data(S).join('g').attr('transform',d=>`translate(${x(d.x)},${y(d.y)})`).style('cursor','pointer').on('click',function(e,d){g.select('rect').attr('stroke','#2b3a55');d3.select(this).select('rect').attr('stroke','#76b900');d3.select('#paiInfo').html(`<b>${d.l}</b> — ${d.t}`)});
 g.append('rect').attr('width',bw).attr('height',40).attr('rx',8).attr('fill','#0f1420').attr('stroke','#2b3a55').attr('stroke-width',2);
 g.append('text').attr('x',bw/2).attr('y',25).attr('text-anchor','middle').style('font-size','12px').text(d=>d.l);})();
