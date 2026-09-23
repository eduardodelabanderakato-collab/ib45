// scripts/smtp.js — dependency-free SMTP client. Implicit TLS on 465, STARTTLS on 587 (iCloud: smtp.mail.me.com:587). AUTH LOGIN.
'use strict';
const net = require('net'), tls = require('tls');
function reader(sock) { // resolves one full SMTP reply (handles multi-line "250-..." replies)
  let buf = ''; const waiters = []; let closed = false;
  const pump = () => { while (waiters.length) { const m = buf.match(/^([\s\S]*?)(\d{3}) [^\r\n]*\r\n/); if (!m) return; const end = m.index + m[0].length; const reply = buf.slice(0, end); buf = buf.slice(end); waiters.shift()(reply); } };
  const attach = s => { s.setEncoding('utf8'); s.on('data', d => { buf += d; pump(); }); s.on('close', () => { closed = true; while (waiters.length) waiters.shift()(null); }); };
  attach(sock);
  return { next: () => new Promise(r => { waiters.push(r); pump(); }), attach, isClosed: () => closed };
}
async function send({ host, port = 587, user, pass, from, fromName, to, subject, text, html, dryRun = false }) {
  const b64 = s => Buffer.from(s, 'utf8').toString('base64'); const boundary = 'ib45-' + Date.now().toString(36); const wrap76 = s => s.replace(/(.{76})/g, '$1\r\n');
  const msg = [`From: "${(fromName || 'IB45').replace(/"/g, '')}" <${from}>`, `To: ${to}`, `Subject: =?UTF-8?B?${b64(subject)}?=`, 'MIME-Version: 1.0', `Date: ${new Date().toUTCString()}`, `Message-ID: <${Date.now()}.${Math.random().toString(36).slice(2)}@ib45>`, `Content-Type: multipart/alternative; boundary="${boundary}"`, '', `--${boundary}`, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', wrap76(b64(text)), '', `--${boundary}`, 'Content-Type: text/html; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', wrap76(b64(html)), '', `--${boundary}--`, ''].join('\r\n');
  let sock = port === 465 ? tls.connect({ host, port, servername: host }) : net.connect({ host, port });
  await new Promise((res, rej) => { sock.once(port === 465 ? 'secureConnect' : 'connect', res); sock.once('error', rej); });
  let rd = reader(sock);
  const expect = (reply, code, what) => { if (!reply) throw new Error(`connection closed during ${what}`); const c = +reply.trim().split(/\r\n/).pop().slice(0, 3); if (c !== code) throw new Error(`${what}: expected ${code}, got ${reply.trim().split(/\r\n/).pop()}`); return reply; };
  const cmd = async (line, code, what) => { sock.write(line + '\r\n'); return expect(await rd.next(), code, what || line.split(' ')[0]); };
  expect(await rd.next(), 220, 'greeting');
  await cmd('EHLO ib45.local', 250);
  if (port !== 465) { await cmd('STARTTLS', 220); const plain = sock; plain.removeAllListeners('data'); sock = tls.connect({ socket: plain, servername: host }); await new Promise((res, rej) => { sock.once('secureConnect', res); sock.once('error', rej); }); rd = reader(sock); await cmd('EHLO ib45.local', 250); }
  if (dryRun) { await cmd('QUIT', 221); return 'handshake ok (TLS established, no auth attempted)'; }
  // AUTH PLAIN first (one round trip), fall back to AUTH LOGIN
  try { await cmd('AUTH PLAIN ' + b64('\0' + user + '\0' + pass), 235, 'auth plain'); }
  catch (e) { await cmd('AUTH LOGIN', 334); await cmd(b64(user), 334, 'username'); await cmd(b64(pass), 235, 'password'); }
  await cmd(`MAIL FROM:<${from}>`, 250); await cmd(`RCPT TO:<${to}>`, 250); await cmd('DATA', 354);
  const r = await cmd(msg + '\r\n.', 250, 'message'); await cmd('QUIT', 221); return r.trim();
}
module.exports = { send };
