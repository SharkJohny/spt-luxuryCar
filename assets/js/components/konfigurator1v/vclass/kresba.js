// Kresba koberca triedy V na plátne: výšková mapa (okraje, zošité diely, prešívanie) a svetlo. Tvary sú schválené Michalom
// 6. 11. 2026 (náhľady v3/navrhy7 a navrhy8). Geometria sa počíta raz na verziu, farba sa len domieša. Kód prenesený z náhľadu,
// preto hustý: pri zmene tvaru najprv upraviť náhľad.
// kresli(canvas, { cast: "predok", s: bezTunela, vzor } | { cast: "zadok", v, d, s: stolček, z: zásuvky, vzor }, šírka, [koža, šitie, podlaha], vzorka)
// vzorka = { w, h, d } pixely vzorky druhej vrstvy: farba aj pásiky sa kreslia zo skutočnej vzorky (Michal 7. 11. 2026), bez nej jednoliata farba.
import { DIELY, DIELY_BEZ } from "./diely.js";

var K=.2164,X0=115,Y0=110,VB={w:1650*K,h:1040*K},AX=981.5,ZAD=false;
function rezim(o){ZAD=o.cast==="zadok";X0=ZAD?0:115;Y0=ZAD?0:110;VB=ZAD?{w:1230*K,h:2160*K}:{w:1650*K,h:1040*K}}
  /* zadná časť: všetko v mm, y od predku. Koľajnice a zásuvky sú z náčrtov, tvar zo šablóny, kufor je samostatný kus. */
var ZG=50;
function mm(x,y){return ((x+170)*.75).toFixed(1)+" "+((y+30)*.75).toFixed(1)}
function poly(P,r0){var n=P.length,t="";P.forEach(function(p,i){var a=P[(i-1+n)%n],b=P[(i+1)%n],r=p[2]==null?r0:p[2],da=Math.hypot(a[0]-p[0],a[1]-p[1]),db=Math.hypot(b[0]-p[0],b[1]-p[1]),q=Math.min(r,da/2,db/2);
  t+=(i?"L":"M")+mm(p[0]+(a[0]-p[0])*q/da,p[1]+(a[1]-p[1])*q/da)+"Q"+mm(p[0],p[1])+" "+mm(p[0]+(b[0]-p[0])*q/db,p[1]+(b[1]-p[1])*q/db)});return t+"Z"}
/* c.r = 4 koľajnice [x0,x1,y0,y1], c.d = zásuvky [x,y] 150 x 130 */
function cfg(o){var X=o.v==="XL",t=o.s,z=o.z,r,d=[];
  if(X){
    if(!t&&z){r=[[85,155,175,2685],[440,510,175,2685],[795,865,175,2685],[1145,1215,175,2685]];d=[[205,580],[205,1750],[945,600],[945,1770]]}
    else if(!t){r=[[85,155,185,2635],[440,510,185,2635],[795,865,185,2635],[1150,1220,185,2635]]}
    else if(z){r=[[85,155,185,2610],[440,570,185,2635],[730,860,185,2635],[1145,1215,185,2610]];d=[[205,580],[205,1510],[940,600],[940,1530]]}
    else{r=[[85,155,185,2625],[440,570,185,2625],[730,860,185,2625],[1145,1215,185,2625]]}
    return{r:r,d:d,L:2770,S:2025}}
  var a=o.v==="M"?2105:2350,b=2050,Dlz=o.v==="M"?2305:2550; /* M nemá náčrt: ako L, kufor kratší o rozdiel dĺžky auta */
  if(!t){r=[[85,155,185,a],[440,510,185,b],[795,865,185,b],[1150,1220,185,a]];if(z)d=[[205,590],[205,1515],[945,590],[945,1515]]}
  else if(z){r=[[85,155,185,a],[435,565,185,b],[725,855,185,b],[1135,1205,185,a]];d=[[205,590],[205,1515],[935,590],[935,1515]]}
  else{r=[[85,155,185,a],[440,570,185,b],[730,860,185,b],[1145,1215,185,a]]}
  return{r:r,d:d,L:Dlz,S:1805}}
function zStred(o){var c=cfg(o),R=c.r,S=c.S,a=R[3][1],b=R[0][0],P=[[a+121,0,8],[a+121,37,6],[a+60,43,6],[a+60,159,6],[a+97,165,6],[a+103,1153,10],[a+170,1257,12],[a+66,1519,12],[a+65,S,8],[a,S,8]];
  [3,2,1,0].forEach(function(i){var q=R[i];if(i<3)P.push([q[1],S,8]);P.push([q[1],q[2],12],[q[0],q[2],12]);if(i)P.push([q[0],S,8])});
  if(o.d===2)P.push([b,S,8],[b-65,S,8],[b-66,1519,12],[b-170,1257,12],[b-103,1153,10],[b-97,165,6],[b-60,159,6],[b-60,43,6],[b-121,37,6],[b-121,0,8]);
  else P.push([b,1531,6],[b-24,1549,8],[b-48,1501,10],[b-183,1263,14],[b-183,165,8],[b-73,165,6],[b-61,146,6],[b-61,55,6],[b-122,43,6],[b-122,0,8]);
  var t=poly(P,8);c.d.forEach(function(h){t+=poly([[h[0],h[1]],[h[0]+150,h[1]],[h[0]+150,h[1]+130],[h[0],h[1]+130]],10)});return t}
function zKufor(o){var c=cfg(o),R=c.r,G=ZG,T=c.S+G,E=c.L+G,xr=R[3][1]+65,e0=R[0][3]+15+G,P=[[R[0][1],T,10]];
  [1,2,3].forEach(function(i){var q=R[i];P.push([q[0],T,10],[q[0],q[3]+G,14],[q[1],q[3]+G,14],[q[1],T,i===3?8:10])});
  P.push([xr,T,8],[xr,E-28,22],[1007,E-19,120],[650,E,120],[293,E-19,120],[R[0][0]-15,E-28,22],[R[0][0]-15,e0,14],[R[0][1],e0,14]);
  return poly(P,10)}
/* koberček: rovný, zrkadlený; XS = hrana schodu pri tuneli od stredu */
/* KOBS = šev na jednovrstvových: oblúk podlahy, rovnaké šitie ako medzi dielmi (Michal 7. 11. 2026, červená čiara na fotke) */
var KOB="M1222 900L1222 386C1222 319 1277 264 1344 264L1443 264C1510 264 1565 319 1565 386L1565 478L1790 478L1790 900Z",KOBS="M1222 900L1222 386C1222 319 1277 264 1344 264L1443 264C1510 264 1565 319 1565 386L1565 478",XS=240.5,XW=20;
var ZP={hlavnyP:[0,0],obdlP:[.3,-14],klinE:[1.2,10],dielF:[.9,-12],dielG:[1.2,6],hlavnyP2:[0,0],obdlP2:[.3,14],klinE2:[1.2,-10],dielF2:[.9,12],dielG2:[1.2,-6],stred:[.2,0]};
function s3(t){t=t<0?0:t>1?1:t;return t*t*(3-2*t)}
function cv(W,H){var c=document.createElement("canvas");c.width=W;c.height=H;return c}
function P2(d,S){var p=new Path2D(),a=K*S;p.addPath(new Path2D(d),new DOMMatrix([a,0,0,a,-X0*a,-Y0*a]));return p}
function alfa(x,W,H){var d=x.getImageData(0,0,W,H).data,a=new Float32Array(W*H),i;for(i=0;i<a.length;i++)a[i]=d[i*4+3]/255;return a}
function edt(M,W,H){
  var n=W*H,D=new Float64Array(n),I=1e12,i,x,y,mx=Math.max(W,H),f=new Float64Array(mx),dd=new Float64Array(mx),v=new Int32Array(mx),z=new Float64Array(mx+1);
  for(i=0;i<n;i++)D[i]=M[i]?I:0;
  function t1(N){var k=0,q,s;v[0]=0;z[0]=-1e20;z[1]=1e20;
    for(q=1;q<N;q++){for(;;){s=((f[q]+q*q)-(f[v[k]]+v[k]*v[k]))/(2*q-2*v[k]);if(s<=z[k])k--;else break}
      k++;v[k]=q;z[k]=s;z[k+1]=1e20}
    k=0;for(q=0;q<N;q++){while(z[k+1]<q)k++;dd[q]=(q-v[k])*(q-v[k])+f[v[k]]}}
  for(x=0;x<W;x++){for(y=0;y<H;y++)f[y]=D[y*W+x];t1(H);for(y=0;y<H;y++)D[y*W+x]=dd[y]}
  for(y=0;y<H;y++){var o=y*W;for(x=0;x<W;x++)f[x]=D[o+x];t1(W);for(x=0;x<W;x++)D[o+x]=dd[x]}
  var R=new Float32Array(n);for(i=0;i<n;i++)R[i]=Math.sqrt(D[i]);return R}
function roz(a,W,H,r,p){
  r=Math.max(1,Math.round(r));var n=W*H,A=Float32Array.from(a),B=new Float32Array(n),k=2*r+1,x,y,s,o,q;
  for(q=0;q<(p||1);q++){
    for(y=0;y<H;y++){o=y*W;s=A[o]*(r+1);for(x=1;x<=r;x++)s+=A[o+Math.min(x,W-1)];
      for(x=0;x<W;x++){B[o+x]=s/k;s+=A[o+Math.min(x+r+1,W-1)]-A[o+Math.max(x-r,0)]}}
    for(x=0;x<W;x++){s=B[x]*(r+1);for(y=1;y<=r;y++)s+=B[Math.min(y,H-1)*W+x];
      for(y=0;y<H;y++){A[y*W+x]=s/k;s+=B[Math.min(y+r+1,H-1)*W+x]-B[Math.max(y-r,0)*W+x]}}}
  return A}
function zony(In,W,H){var n=W*H,Z=new Int32Array(n),st=new Int32Array(n),nz=0,i;
  for(i=0;i<n;i++)if(In[i]&&!Z[i]){nz++;var t=0;st[t++]=i;Z[i]=nz;
    while(t){var p=st[--t],x=p%W;
      if(x>0&&In[p-1]&&!Z[p-1]){Z[p-1]=nz;st[t++]=p-1}
      if(x<W-1&&In[p+1]&&!Z[p+1]){Z[p+1]=nz;st[t++]=p+1}
      if(p>=W&&In[p-W]&&!Z[p-W]){Z[p-W]=nz;st[t++]=p-W}
      if(p<n-W&&In[p+W]&&!Z[p+W]){Z[p+W]=nz;st[t++]=p+W}}}
  return{Z:Z,nz:nz}}

function geometria(o,W){
  rezim(o);var H=Math.round(W*VB.h/VB.w),S=W/VB.w,n=W*H,c=cv(W,H),x=c.getContext("2d",{willReadFrequently:true}),i,X,Y;
  var Dl=ZAD?[]:o.s?DIELY_BEZ:DIELY,zP=Dl.map(function(z){return P2(z.d,S)}),inP=ZAD?[P2(zStred(o),S),P2(zKufor(o),S)]:[];
  x.fillStyle="#fff";x.strokeStyle="#fff";x.lineJoin="round";x.lineWidth=1.1*S;
  zP.forEach(function(p){x.fill(p);x.stroke(p)});inP.forEach(function(p){x.fill(p,"evenodd")});
  var A=alfa(x,W,H);
  var bw=1.9*S,g=bw/2+.8*S,tw=Math.max(1,.42*S),dash=[1.5*S,.9*S];
  var kSev=null,Bk=null;if(!ZAD&&o.bez2){var aS=K*S;kSev=new Path2D();kSev.addPath(new Path2D(KOBS),new DOMMatrix([aS,0,0,aS,-X0*aS,-Y0*aS]));kSev.addPath(new Path2D(KOBS),new DOMMatrix([-aS,0,0,aS,(2*AX-X0)*aS,-Y0*aS]))}
  x.clearRect(0,0,W,H);x.lineCap="butt";x.lineWidth=bw;zP.forEach(function(p){x.stroke(p)});
  var Bd=alfa(x,W,H);
  if(kSev){x.clearRect(0,0,W,H);x.stroke(kSev);Bk=alfa(x,W,H)}
  x.clearRect(0,0,W,H);x.setLineDash(dash);x.lineWidth=2*g+tw;zP.forEach(function(p){x.save();x.clip(p);x.stroke(p);x.restore()});
  x.setLineDash([]);x.globalCompositeOperation="destination-out";x.lineWidth=2*g-tw;zP.forEach(function(p){x.stroke(p)});x.globalCompositeOperation="source-over";
  var Sv=alfa(x,W,H),Sk=null;
  if(kSev){x.clearRect(0,0,W,H);x.setLineDash(dash);x.lineWidth=2*g+tw;x.stroke(kSev);x.setLineDash([]);x.globalCompositeOperation="destination-out";x.lineWidth=2*g-tw;x.stroke(kSev);x.globalCompositeOperation="source-over";Sk=alfa(x,W,H)}
  var lem=1.2*S,er=lem+.75*S,vse=zP.concat(inP);
  x.clearRect(0,0,W,H);x.setLineDash(dash);x.lineWidth=2*er+tw;vse.forEach(function(p){x.stroke(p)});
  x.setLineDash([]);x.globalCompositeOperation="destination-out";x.lineWidth=2*er-tw;vse.forEach(function(p){x.stroke(p)});x.globalCompositeOperation="source-over";
  var Se=alfa(x,W,H);
  x.clearRect(0,0,W,H);var a0=K*S,pk=new Path2D();pk.addPath(new Path2D(KOB),new DOMMatrix([a0,0,0,a0,-X0*a0,-Y0*a0]));pk.addPath(new Path2D(KOB),new DOMMatrix([-a0,0,0,a0,(2*AX-X0)*a0,-Y0*a0]));if(!ZAD&&!o.bez2)x.fill(pk);
  var Ka=alfa(x,W,H),Mk=new Uint8Array(n);for(i=0;i<n;i++)Mk[i]=Ka[i]>.5?1:0;
  var M=new Uint8Array(n),In=new Uint8Array(n),Ho=new Uint8Array(n);
  for(i=0;i<n;i++){M[i]=A[i]>.5?1:0;Ho[i]=M[i]?0:1}
  var hz=zony(Ho,W,H),pl=new Int32Array(hz.nz+1);for(i=0;i<n;i++)pl[hz.Z[i]]++;
  for(i=0;i<n;i++)if(hz.Z[i]&&pl[hz.Z[i]]<40*S*S){M[i]=1;A[i]=1;Bd[i]=1}
  var dO=edt(M,W,H);for(i=0;i<n;i++)if(!M[i])Mk[i]=0;var dC=edt(Mk,W,H);
  /* šev je len medzi dielmi, nie po obvode */
  for(i=0;i<n;i++)In[i]=(M[i]&&Bd[i]<.35)?1:0;
  var zz=zony(In,W,H),Z=zz.Z,nz=zz.nz,pz=new Int32Array(nz+1);for(i=0;i<n;i++)pz[Z[i]]++;
  for(i=0;i<n;i++)if(Z[i]&&pz[Z[i]]<30*S*S){Z[i]=0;In[i]=0;Bd[i]=1}
  /* šev podlahy až po zónach: prešívanie cezeň pokračuje, nerozdelí diel; ide len po hlavnom diele, bočné diely neprechádza */
  if(Bk){var a2=K*S,zh=[];Dl.forEach(function(z){if(/^hlavnyP/.test(z.n))zh.push(Z[Math.round((z.c[1]-Y0)*a2)*W+Math.round((z.c[0]-X0)*a2)])});
    for(i=0;i<n;i++)if(Z[i]&&zh.indexOf(Z[i])>=0){if(Bk[i]>Bd[i])Bd[i]=Bk[i];if(Sk[i]>Sv[i])Sv[i]=Sk[i]}}
  var dP=edt(In,W,H);for(i=0;i<n;i++)if(dO[i]<1.5*S||Mk[i])Bd[i]=0;var Mb=new Uint8Array(n);for(i=0;i<n;i++)Mb[i]=Bd[i]>.35?0:1;var dS=edt(Mb,W,H);
  var hl=new Float32Array(nz+1),uh=new Float32Array(nz+1),lb={};
  Dl.forEach(function(z){var a=K*S,px=Math.round((z.c[0]-X0)*a),py=Math.round((z.c[1]-Y0)*a),l=Z[py*W+px];if(l){hl[l]=ZP[z.n][0];uh[l]=ZP[z.n][1];lb[z.n]=l}});
  /* ľavá polovica berie kosoštvorce zrkadlovo z pravej, stred je súmerný okolo osi */
  var dvo=new Int32Array(nz+1),axP=(AX-X0)*K*S,lSt=lb.stred||0;for(var nm in lb)if(/2$/.test(nm)&&lb[nm.slice(0,-1)])dvo[lb[nm]]=lb[nm.slice(0,-1)];
  var ax=13*S,ay=16*S,m=new Float32Array((nz+1)*4),lu=new Float32Array(nz+1),lv=new Float32Array(nz+1),Nu=new Float32Array(nz+1),Nv=new Float32Array(nz+1),per=dash[0]+dash[1];
  for(i=1;i<=nz;i++){var t=uh[i]*Math.PI/180,co=Math.cos(t),si=Math.sin(t),a=co/ax-si/ay,b1=si/ax+co/ay,c1=co/ax+si/ay,d1=si/ax-co/ay;
    m[i*4]=a;m[i*4+1]=b1;m[i*4+2]=c1;m[i*4+3]=d1;lu[i]=1/Math.hypot(a,b1);lv[i]=1/Math.hypot(c1,d1);
    Nu[i]=Math.max(3,Math.round(lv[i]*1.45/per));Nv[i]=Math.max(3,Math.round(lu[i]*1.45/per))}
  var Dp=new Float32Array(n),Wg=new Float32Array(n);
  for(i=0;i<n;i++){if(Z[i]){Dp[i]=hl[Z[i]];Wg[i]=1}}
  var bD=roz(Dp,W,H,6.5*S,3),bW=roz(Wg,W,H,6.5*S,3),bS=roz(Bd,W,H,.28*S,1),bC=roz(Bd,W,H,1.5*S,2);
  var h=new Float32Array(n),Qa=new Float32Array(n),St=new Float32Array(n),Kp=new Float32Array(n),Dn=new Float32Array(n),u,v,fu,fv,kS=K*S,sch=(o.s||ZAD||o.bez2)?0:8*S;
  var vz=o.vzor||"diamond",sw=13*S,hr=9.5*S,rimA=1*S,stepA=9*S,dishR=9*S,dishA=2.4*S,rollA=1.2*S,creA=1.5*S,qa=2.3*S,pi=Math.PI,tw2=tw*.62;
  for(Y=0;Y<H;Y++)for(X=0;X<W;X++){i=Y*W+X;if(!M[i]){h[i]=-1.2*S;continue}
    var dd=dO[i],zl=Z[i],q1=dd<lem?Math.sqrt(Math.max(0,1-(1-dd/lem)*(1-dd/lem))):1;
    var dn=bW[i]>.001?bD[i]/bW[i]:0;Dn[i]=dn;var hh=rimA*q1+dn*stepA;
    var ds=1-s3(dS[i]/dishR);hh+=dishA*ds*ds+rollA*bS[i]-creA*bC[i]*(1-bS[i]);
    var kp=0,ry=Y/kS+Y0,rx=X/kS+X0;
    /* schod: vedľa tunela je plocha o 4 až 5 cm vyššie ako podlaha */
    if(ry<1140)hh+=sch*s3((XS-Math.abs(rx-AX))/(XW+Math.max(0,390-ry)*1.2));
    if(Mk[i]){kp=s3(dC[i]/(.5*S));Kp[i]=kp;hh=hh*(1-kp)+.9*S*kp;var ri=Math.abs(dC[i]-.25*S)/(.9*S);if(ri<1)hh+=.9*S*(1-ri*ri)}
    h[i]=hh;
    if(zl&&vz!=="diamond"){var Xv=dvo[zl]?2*axP-X:X,qv=(1-bS[i])*s3((dd-lem)/(1*S))*(1-kp);
      if(vz==="stripe"){var fs=Xv/sw;fs-=Math.floor(fs);Qa[i]=qv*Math.sqrt(Math.sin(pi*fs));var ds2=Math.min(fs,1-fs)*sw;St[i]=qv*(1-s3((ds2-tw2*.55)/tw2))*(((Y/per+.5)%1)<.64?1:0)}
      else{var hq=(Xv*.57735-Y*.33333)/hr,hs=Y*.66667/hr,c1q=hq,c1s=hs,c1t=-hq-hs,rq=Math.round(c1q),rs=Math.round(c1s),rt=Math.round(c1t),eq=Math.abs(rq-c1q),es=Math.abs(rs-c1s),et=Math.abs(rt-c1t);
        if(eq>es&&eq>et)rq=-rs-rt;else if(es>et)rs=-rq-rt;
        var hx0=hr*1.73205*(rq+rs/2),hy0=hr*1.5*rs,adx=Math.abs(Xv-hx0),ady=Math.abs(Y-hy0),hd=Math.max(adx,adx*.5+ady*.86603),ha=hr*.86603,eg=ha-hd;
        Qa[i]=qv*Math.sqrt(Math.max(0,eg/ha));St[i]=qv*(1-s3((eg-tw2*.55)/tw2))*((((Xv+Y)/per+.5)%1)<.64?1:0)}}
    else if(zl){var zq=dvo[zl]||zl,Xq=dvo[zl]?2*axP-X:X,ph=zq*.618,ph2=ph*1.7;if(zl===lSt){Xq=X-axP;ph=0;ph2=0}
      u=m[zq*4]*Xq+m[zq*4+1]*Y+ph;v=m[zq*4+2]*Xq+m[zq*4+3]*Y+ph2;
      fu=u-Math.floor(u);fv=v-Math.floor(v);
      var qf=(1-bS[i])*s3((dd-lem)/(1*S))*(1-kp);
      Qa[i]=qf*Math.sqrt(Math.sin(pi*fu)*Math.sin(pi*fv));
      var du=Math.min(fu,1-fu)*lu[zq],dv=Math.min(fv,1-fv)*lv[zq];
      var s1=1-s3((du-tw2*.55)/tw2),s2=1-s3((dv-tw2*.55)/tw2);
      var on1=((fv*Nu[zq]+.5)%1)<.64?1:0,on2=((fu*Nv[zq]+.5)%1)<.64?1:0,kn=1-s3((Math.sqrt(du*du+dv*dv)-tw*.7)/tw);
      St[i]=qf*Math.max(s1*on1,s2*on2,kn)}
    St[i]=Math.max(St[i],Se[i]*(1-s3(Math.abs(dd-er)/(1.3*tw))),Sv[i]*s3((dd-er-.6*S)/(.6*S)))*(1-kp)}
  h=roz(h,W,H,Math.max(1,.2*S),1);
  var Ao3=roz(h,W,H,5.5*S,2),zr=new Float32Array(n),sd=7;for(i=0;i<n;i++){sd=(sd*16807)%2147483647;zr[i]=sd/2147483647-.5}
  var zr2=roz(zr,W,H,Math.max(1,.2*S),1);
  for(i=0;i<n;i++)h[i]+=Qa[i]*qa+zr2[i]*.14*S*(1-Kp[i])+Kp[i]*zr2[i]*.05*S;
  var Ao=roz(h,W,H,2.3*S,2),Ao2=roz(h,W,H,.8*S,1);
  var L=new Float32Array(n),G=new Float32Array(n),Df=new Float32Array(n);
  var lx=0,ly=-.66,lz=.75,hzv=lz+1,hn=Math.hypot(lx,ly,hzv),hxv=lx/hn,hyv=ly/hn;hzv/=hn;
  var lx2=0,ly2=.5,lz2=.87;
  for(Y=1;Y<H-1;Y++)for(X=1;X<W-1;X++){i=Y*W+X;if(A[i]<=0)continue;
    var hx=(h[i+1]-h[i-1])*.5,hy=(h[i+W]-h[i-W])*.5,nl=1/Math.sqrt(hx*hx+hy*hy+1),nx=-hx*nl,ny=-hy*nl,nzz=nl;
    var di=Math.max(0,nx*lx+ny*ly+nzz*lz),di2=Math.max(0,nx*lx2+ny*ly2+nzz*lz2),nh=Math.max(0,nx*hxv+ny*hyv+nzz*hzv);
    var ao=(1-Math.min(.6,Math.max(0,(Ao[i]-h[i])/(5.2*S))*1.05)-Math.min(.36,Math.max(0,(Ao2[i]-h[i])/(1.1*S))*.5))*(1-Math.min(.45,Math.max(0,(Ao3[i]-h[i])/(9*S))));
    var nh2=nh*nh,nh4=nh2*nh2,nh8=nh4*nh4,nh16=nh8*nh8,nh32=nh16*nh16,d3=di*di*di;
    Df[i]=di;L[i]=(.3+1.05*di+.16*di2)*ao*(1+.2*Dn[i]*(1-Kp[i]));
    G[i]=(.04*nh8+.17*nh32*nh16+.05*di2*di2+.2*d3*d3)*ao*(1-.98*Kp[i])}
  var Sh=roz(A,W,H,1.8*S,2),So=new Float32Array(n),ofx=0,ofy=Math.round(1.4*S);
  for(Y=0;Y<H-ofy;Y++)for(X=0;X<W-ofx;X++)So[(Y+ofy)*W+X+ofx]=Sh[Y*W+X];
  return{W:W,H:H,A:A,L:L,G:G,St:St,Sh:So,Df:Df,Kp:Kp}}
function hex(s){return[parseInt(s.slice(1,3),16),parseInt(s.slice(3,5),16),parseInt(s.slice(5,7),16)]}
var CACHE={};
var PORADIE=[];
function geo(o,W){var k=[o.cast,o.vzor,o.v,o.d,+!!o.s,+!!o.z,+!!o.bez2,W].join("-");if(CACHE[k])return CACHE[k];if(PORADIE.length>=10)delete CACHE[PORADIE.shift()];PORADIE.push(k);return CACHE[k]=geometria(o,W)}
/* plocha druhej vrstvy v súradniciach kresby: štvorcový výrez vzorky cez celý koberček, ľavý je zrkadlo pravého */
function vzorkaPx(t,X,Y,kS,v){var rx=X/kS+X0,ry=Y/kS+Y0;if(rx<AX)rx=2*AX-rx;
  var u=(rx-1188)/636*(t.w-1),q=(ry-264)/636*(t.h-1),x0=u<0?0:u>t.w-2?t.w-2:u|0,y0=q<0?0:q>t.h-2?t.h-2:q|0,fx=Math.min(1,Math.max(0,u-x0)),fy=Math.min(1,Math.max(0,q-y0)),d=t.d,a=(y0*t.w+x0)*4,b=a+4,c=a+t.w*4,e=c+4,k;
  for(k=0;k<3;k++)v[k]=(d[a+k]*(1-fx)+d[b+k]*fx)*(1-fy)+(d[c+k]*(1-fx)+d[e+k]*fx)*fy}
export function kresli(cnv,o,W,far,vzorka){
  var g=geo(o,W),w=g.W,h=g.H,n=w*h,B=hex(far[0]),C=hex(far[1]),Kc=hex(far[2]||"#131315"),im=new ImageData(w,h),d=im.data,i,j,
    /* slabe = časť, ktorá nie je vo výbere: "cele", "zadok" (2. a 3. rad) alebo "kufor" */
    sl=o.slabe,rez=sl?Math.round((cfg(o).S+ZG/2+30)*.75*W/1230):0,f;
  var lum=(B[0]*.3+B[1]*.59+B[2]*.11)/255,gk=255*(1.05-.65*lum),bB=[Math.max(B[0],26),Math.max(B[1],26),Math.max(B[2],28)],Kv=[0,0,0],kSk=0;
  rezim(o);kSk=K*w/VB.w;var tx=vzorka&&vzorka.d&&o.cast==="predok"?vzorka:null;
  for(i=0;i<n;i++){j=i*4;var a=g.A[i];
    f=1;if(sl){var yy=i/w|0;if(sl==="cele"||(sl==="kufor"&&yy>=rez)||(sl==="zadok"&&yy<rez))f=.13}
    if(a<=0){d[j+3]=g.Sh[i]*130*f;continue}
    var l=g.L[i],sp=g.G[i]*gk,st=g.St[i],di=.62+.62*g.Df[i],kp=g.Kp[i],Kx=Kc;if(tx&&kp>0){vzorkaPx(tx,i%w,i/w|0,kSk,Kv);Kx=Kv}var r=(bB[0]+(Kx[0]-bB[0])*kp)*l+sp,gg=(bB[1]+(Kx[1]-bB[1])*kp)*l+sp,b=(bB[2]+(Kx[2]-bB[2])*kp)*l+sp;
    r+=(C[0]*di-r)*st;gg+=(C[1]*di-gg)*st;b+=(C[2]*di-b)*st;
    d[j]=r;d[j+1]=gg;d[j+2]=b;d[j+3]=Math.max(a*255,g.Sh[i]*130)*f}
  cnv.width=w;cnv.height=h;cnv.getContext("2d").putImageData(im,0,0)}
export { cfg as rozmery };
