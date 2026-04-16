// /api/auth/logout
// Limpa o cookie de sessÃ£o e redireciona pra home.

import { sessionCookie } from '../../lib/session.js';

export default function handler(req, res) {
  res.setHeader('Set-Cookie', sessionCookie('', { clear: true }));
  res.writeHead(302, { Location: '/' });
  res.end();
}
