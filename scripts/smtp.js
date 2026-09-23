// scripts/smtp.js — dependency-free SMTP over TLS (port 465) with AUTH LOGIN. Sends a multipart/alternative (text + html) message.
'use strict';
const tls = require('tls');
function send({ host, port = 465, user, pass, from, fromName, to, subject, text, html }) {
  return new Promise((resolve, reject) => {
    const sock = tls.connect({ host, port, servername: host }, () => {});
    let buf = ''; const queue = []; let step = 0; let done = false;
    const b64 = s => Buffer.from(s, 'utf8').toString('base64');
    const boundary = 'ib45-' + Date.now().toString(36);
    const wrap76 = s => s.replace(/(.{76})/g, '$1\r\n');
    const msg = [
      `From: "${(fromName || 'IB45').replace(/"/g, '')}" <${from}>`, `To: ${to}`, `Subject: =?UTF-8?B?${b64(subject)}?=`, `MIME-Version: 1.0`, `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${Date.now()}.${Math.random().toString(36).slice(2)}@ib45>`, `Content-Type: multipart/alternative; boundary="${boundary}"`, '',
      `--${boundary}`, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', wrap76(b64(text)), '',
      `--${boundary}`, 'Content-Type: text/html; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', wrap76(b64(html)), '', `--${boundary}--`, ''
    ].join('\r\n');
    const steps = [
      { expect: 220, send: `EHLO ib45.local` }, { expect: 250, send: `AUTH LOGIN` }, { expect: 334, send: b64(user) }, { expect: 334, send: b64(pass) },
      { expect: 235, send: `MAIL FROM:<${from}>` }, { expect: 250, send: `RCPT TO:<${to}>` }, { expect: 250, send: `DATA` }, { expect: 354, send: msg + '\r\n.' }, { expect: 250, send: `QUIT` }, { expect: 221, send: null }
    ];
    sock.setEncoding('utf8');
    sock.on('data', d => { buf += d; const lines = buf.split('\r\n'); buf = lines.pop(); for (const line of lines) { if (/^\d{3} /.test(line)) { const code = +line.slice(0, 3); const s = steps[step]; if (!s) return; if (code !== s.expect) { done = true; sock.end(); return reject(new Error(`SMTP step ${step} expected ${s.expect}, got: ${line}`)); } step++; if (s.send === null) { done = true; sock.end(); return resolve(line); } sock.write(s.send + '\r\n'); } } });
    sock.on('error', e => { if (!done) reject(e); }); sock.on('close', () => { if (!done) reject(new Error('SMTP connection closed early')); });
  });
}
module.exports = { send };
