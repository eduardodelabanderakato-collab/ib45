// scripts/hologram.js — turn a transparent-background cutout into a point-light hologram (navy field, cyan dots, beams, bits).
// Usage: node scripts/hologram.js <cutout.png> <out.png> [--w 900 --h 1200 --transparent]
'use strict';
const { chromium } = require('playwright'); const fs = require('fs');
const [,, inFile, outFile, ...rest] = process.argv; const opt = k => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : null; };
const W = +(opt('--w') || 900), H = +(opt('--h') || 1200), transparent = rest.includes('--transparent');
const src = 'data:image/png;base64,' + fs.readFileSync(inFile).toString('base64');
const html = `<body style="margin:0;background:transparent"><canvas id="c" width="${W}" height="${H}"></canvas><script>
const W=${W},H=${H}; const img=new Image(); img.onload=()=>{ const c=document.getElementById('c'), x=c.getContext('2d');
 // fit the cutout into the canvas with margins
 const m=Math.min((W*0.78)/img.width,(H*0.86)/img.height); const iw=img.width*m, ih=img.height*m; const ox=(W-iw)/2, oy=(H-ih)/2-20;
 const off=document.createElement('canvas'); off.width=Math.round(iw); off.height=Math.round(ih); const o=off.getContext('2d'); o.drawImage(img,0,0,off.width,off.height); const d=o.getImageData(0,0,off.width,off.height).data;
 if(!${transparent}){ const g=x.createRadialGradient(W/2,H*0.55,40,W/2,H*0.55,H*0.75); g.addColorStop(0,'#0c2d62'); g.addColorStop(1,'#040c22'); x.fillStyle=g; x.fillRect(0,0,W,H);
   x.save(); x.globalAlpha=.16; x.fillStyle='#7fd8ff'; for(let i=0;i<7;i++){ x.beginPath(); x.moveTo(W/2,H*0.98); x.lineTo(W/2-W*0.3+i*W*0.09,0); x.lineTo(W/2-W*0.26+i*W*0.09,0); x.closePath(); x.fill(); } x.restore();
   x.font='600 '+Math.round(W/60)+'px Menlo,monospace'; for(let i=0;i<70;i++){ x.fillStyle='rgba(120,200,255,'+(0.12+Math.random()*0.45)+')'; x.fillText(Math.random()<.5?'0':'1',Math.random()*W,Math.random()*H); }
   for(let i=0;i<40;i++){ x.fillStyle='rgba(140,220,255,'+(0.2+Math.random()*0.6)+')'; x.beginPath(); x.arc(Math.random()*W,Math.random()*H,1+Math.random()*2,0,7); x.fill(); } }
 const step=Math.max(3,Math.round(W/230)); const dots=document.createElement('canvas'); dots.width=W; dots.height=H; const dx=dots.getContext('2d');
 for(let py=0;py<off.height;py+=step) for(let px=0;px<off.width;px+=step){ const i=(py*off.width+px)*4; const a=d[i+3]; if(a<90) continue; const lum=(0.3*d[i]+0.59*d[i+1]+0.11*d[i+2]); const t=Math.min(1,Math.max(0.12,lum/230));
   dx.fillStyle='rgba('+Math.round(110+90*t)+','+Math.round(195+60*t)+',255,'+(0.35+0.65*t)+')'; dx.beginPath(); dx.arc(ox+px,oy+py,step*0.28+step*0.3*t,0,7); dx.fill(); }
 x.filter='blur('+(step*2)+'px)'; x.globalAlpha=.9; x.drawImage(dots,0,0); x.filter='blur('+(step*0.6)+'px)'; x.drawImage(dots,0,0); x.filter='none'; x.globalAlpha=1; x.drawImage(dots,0,0);
 if(!${transparent}){ const fg=x.createRadialGradient(W/2,H*0.95,10,W/2,H*0.95,W*0.35); fg.addColorStop(0,'rgba(120,220,255,.55)'); fg.addColorStop(1,'rgba(120,220,255,0)'); x.fillStyle=fg; x.fillRect(0,H*0.75,W,H*0.25); }
 document.title='done'; }; img.src='${src}';</script></body>`;
(async () => { const b = await chromium.launch({ channel: process.env.CI ? undefined : 'chrome' }); const p = await b.newPage({ viewport: { width: W, height: H } }); p.on('pageerror', e => { console.error('page error:', e.message); }); p.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); }); await p.setContent(html); await p.waitForFunction(() => document.title === 'done'); await p.waitForTimeout(200); await p.screenshot({ path: outFile, omitBackground: transparent }); await b.close(); console.log('wrote', outFile); })();
