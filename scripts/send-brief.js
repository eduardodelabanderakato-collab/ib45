// scripts/send-brief.js — send today's briefing over SMTP (no dependencies). Env: SMTP_HOST, SMTP_PORT(465), SMTP_USER, SMTP_PASS, MAIL_TO, MAIL_FROM_NAME
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { send } = require('./smtp.js');
const day = process.argv[2] || new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
const out = JSON.parse(execFileSync('node', [path.join(__dirname, 'brief.js'), day]).toString());
const need = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'MAIL_TO']; const missing = need.filter(k => !process.env[k]); if (missing.length) { console.error('missing env: ' + missing.join(', ')); process.exit(2); }
send({ host: process.env.SMTP_HOST, port: +(process.env.SMTP_PORT || 465), user: process.env.SMTP_USER, pass: process.env.SMTP_PASS, from: process.env.SMTP_USER, fromName: process.env.MAIL_FROM_NAME || 'IB45 Morning Briefing', to: process.env.MAIL_TO, subject: out.subject, text: fs.readFileSync(out.text, 'utf8'), html: fs.readFileSync(out.html, 'utf8') })
  .then(r => console.log('sent:', out.subject, '|', r)).catch(e => { console.error('send failed:', e.message); process.exit(1); });
