// scripts/send-brief.js — send today's briefing over SMTP. Env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_TO, MAIL_FROM_NAME
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const nodemailer = require('nodemailer');
const day = process.argv[2] || new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
const out = JSON.parse(execFileSync('node', [path.join(__dirname, 'brief.js'), day]).toString());
const need = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'MAIL_TO']; const missing = need.filter(k => !process.env[k]); if (missing.length) { console.error('missing env: ' + missing.join(', ')); process.exit(2); }
const port = +(process.env.SMTP_PORT || 465);
const t = nodemailer.createTransport({ host: process.env.SMTP_HOST, port, secure: port === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
t.sendMail({ from: `"${process.env.MAIL_FROM_NAME || 'IB45 Morning Briefing'}" <${process.env.SMTP_USER}>`, to: process.env.MAIL_TO, subject: out.subject, text: fs.readFileSync(out.text, 'utf8'), html: fs.readFileSync(out.html, 'utf8') })
  .then(i => console.log('sent', i.messageId, out.subject)).catch(e => { console.error('send failed', e.message); process.exit(1); });
