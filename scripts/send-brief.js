// scripts/send-brief.js — send today's briefing. Uses Resend (RESEND_API_KEY) when present, else SMTP (SMTP_HOST/PORT/USER/PASS). MAIL_TO required.
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const day = process.argv[2] || new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
const out = JSON.parse(execFileSync('node', [path.join(__dirname, 'brief.js'), day]).toString());
const html = fs.readFileSync(out.html, 'utf8'), text = fs.readFileSync(out.text, 'utf8');
const to = process.env.MAIL_TO; if (!to) { console.error('missing env: MAIL_TO'); process.exit(2); }
const fromName = process.env.MAIL_FROM_NAME || 'Flight Deck';
(async () => {
  if (process.env.RESEND_API_KEY) {
    const from = process.env.MAIL_FROM || 'onboarding@resend.dev';
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: `${fromName} <${from}>`, to: [to], subject: out.subject, html, text }) });
    const j = await r.json().catch(() => ({})); if (!r.ok) { console.error('resend failed:', r.status, JSON.stringify(j)); process.exit(1); }
    console.log('sent via resend:', j.id, '|', out.subject); return;
  }
  const { send } = require('./smtp.js'); const need = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS']; const missing = need.filter(k => !process.env[k]); if (missing.length) { console.error('missing env: ' + missing.join(', ')); process.exit(2); }
  const r = await send({ host: process.env.SMTP_HOST, port: +(process.env.SMTP_PORT || 587), user: process.env.SMTP_USER, pass: process.env.SMTP_PASS, from: process.env.SMTP_USER, fromName, to, subject: out.subject, text, html });
  console.log('sent via smtp:', out.subject, '|', r);
})().catch(e => { console.error('send failed:', e.message); process.exit(1); });
