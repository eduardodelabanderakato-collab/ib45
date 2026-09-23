// scripts/hologram2.js — wireframe-mesh hologram from a cutout's silhouette (no photo texture): contour glow + grid mesh + rim light.
'use strict';
const { chromium } = require('playwright'); const fs = require('fs');
const [,, inFile, outFile, ...rest] = process.argv; const opt = k => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : null; };
const W = +(opt('--w') || 900), H = +(opt('--h') || 1200), transparent = rest.includes('--transparent');
const src = 'data:image/png;base64,' + fs.readFileSync(inFile).toString('base64');
const html = `<body style="margin:0;background:transparent"><canvas id="c" width="${W}" height="${H}"></canvas><script>
const W=${W},H=${H},TR=${transparent}; const img=new Image(); img.onload=()=>{ const c=document.getElementById('c'), x=c.getContext('2d');
 const m=Math.min((W*0.62)/img.width,(H*0.84)/img.height); const iw=Math.round(img.width*m), ih=Math.round(img.height*m); const ox=Math.round((W-iw)/2), oy=Math.round((H-ih)/2-10);
 const off=document.createElement('canvas'); off.width=iw; off.height=ih; const o=off.getContext('2d'); o.drawImage(img,0,0,iw,ih); const d=o.getImageData(0,0,iw,ih).data;
 const A=(px,py)=> (px<0||py<0||px>=iw||py>=ih)?0:d[(py*iw+px)*4+3];
 if(!TR){ const g=x.createRadialGradient(W/2,H*0.5,40,W/2,H*0.5,H*0.8); g.addColorStop(0,'#0d2f66'); g.addColorStop(1,'#03091c'); x.fillStyle=g; x.fillRect(0,0,W,H);
   x.save(); x.globalAlpha=.14; x.fillStyle='#7fd8ff'; for(let i=0;i<7;i++){ x.beginPath(); x.moveTo(W/2,H*0.97); x.lineTo(W/2-W*0.3+i*W*0.09,0); x.lineTo(W/2-W*0.26+i*W*0.09,0); x.closePath(); x.fill(); } x.restore();
   x.font='600 '+Math.round(W/60)+'px Menlo,monospace'; for(let i=0;i<60;i++){ x.fillStyle='rgba(120,200,255,'+(0.1+Math.random()*0.4)+')'; x.fillText(Math.random()<.5?'0':'1',Math.random()*W,Math.random()*H); }
   for(let i=0;i<40;i++){ x.fillStyle='rgba(140,220,255,'+(0.2+Math.random()*0.6)+')'; x.beginPath(); x.arc(Math.random()*W,Math.random()*H,1+Math.random()*2,0,7); x.fill(); } }
 // layer 1: body fill (soft translucent blue, brighter toward the edges = rim light)
 const body=document.createElement('canvas'); body.width=W; body.height=H; const bx=body.getContext('2d'); const bd=bx.createImageData(W,H); const p=bd.data;
 const dist=(px,py)=>{ // distance to nearest transparent pixel (rim), capped
   for(let r=1;r<=14;r++){ if(A(px-r,py)<80||A(px+r,py)<80||A(px,py-r)<80||A(px,py+r)<80||A(px-r,py-r)<80||A(px+r,py+r)<80) return r; } return 15; };
 for(let py=0;py<ih;py++) for(let px=0;px<iw;px++){ if(A(px,py)<80) continue; const r=dist(px,py); const rim=Math.max(0,1-r/14); const k=((oy+py)*W+(ox+px))*4; const lum=d[(py*iw+px)*4]*0.3+d[(py*iw+px)*4+1]*0.59+d[(py*iw+px)*4+2]*0.11; const shade=0.25+0.35*(lum/255);
   p[k]=Math.round(60+150*rim); p[k+1]=Math.round(150+100*rim); p[k+2]=255; p[k+3]=Math.round(255*(shade*0.55+0.45*rim)); }
 bx.putImageData(bd,0,0);
 // layer 2: mesh grid clipped to the silhouette (horizontal contour lines follow a slight sine wave for volume)
 const mesh=document.createElement('canvas'); mesh.width=W; mesh.height=H; const mx=mesh.getContext('2d'); mx.strokeStyle='rgba(190,240,255,.55)'; mx.lineWidth=1;
 const gap=Math.max(6,Math.round(H/110));
 for(let py=0;py<ih;py+=gap){ let on=false; mx.beginPath(); for(let px=0;px<=iw;px++){ const inside=A(px,py)>=80; const yy=oy+py+Math.sin(px/18)*1.2; if(inside&&!on){ mx.moveTo(ox+px,yy); on=true; } else if(inside){ mx.lineTo(ox+px,yy); } else if(on){ on=false; } } mx.stroke(); }
 for(let px=0;px<iw;px+=gap){ let on=false; mx.beginPath(); for(let py=0;py<=ih;py++){ const inside=A(px,py)>=80; if(inside&&!on){ mx.moveTo(ox+px,oy+py); on=true; } else if(inside){ mx.lineTo(ox+px,oy+py); } else if(on){ on=false; } } mx.stroke(); }
 // composite: glow of body, body, mesh, then a second wide glow
 x.filter='blur('+Math.round(W/45)+'px)'; x.globalAlpha=.8; x.drawImage(body,0,0); x.filter='none'; x.globalAlpha=1; x.drawImage(body,0,0);
 x.globalAlpha=.9; x.drawImage(mesh,0,0); x.filter='blur(2px)'; x.globalAlpha=.6; x.drawImage(mesh,0,0); x.filter='none'; x.globalAlpha=1;
 if(!TR){ const fg=x.createRadialGradient(W/2,oy+ih,10,W/2,oy+ih,W*0.32); fg.addColorStop(0,'rgba(120,220,255,.6)'); fg.addColorStop(1,'rgba(120,220,255,0)'); x.fillStyle=fg; x.fillRect(0,oy+ih-60,W,H-(oy+ih-60)); }
 document.title='done'; }; img.src='${src}';</script></body>`;
(async () => { const b = await chromium.launch({ channel: process.env.CI ? undefined : 'chrome' }); const p = await b.newPage({ viewport: { width: W, height: H } }); p.on('pageerror', e => console.error('page error:', e.message)); await p.setContent(html); await p.waitForFunction(() => document.title === 'done', null, { timeout: 120000 }); await p.waitForTimeout(200); await p.screenshot({ path: outFile, omitBackground: transparent }); await b.close(); console.log('wrote', outFile); })();
