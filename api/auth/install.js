// /api/auth/install
// Redireciona o lojista para a pÃ¡gina de autorizaÃ§Ã£o da Nuvemshop.
// Usado pelo botÃ£o "Instalar app" do nosso site (quando o lojista chega pela pÃ¡gina).
// Obs.: instalaÃ§Ãµes vindas da App Store da Nuvemshop jÃ¡ caem direto em /api/auth/callback com code.

export default function handler(req, res) {
  const clientId = process.env.NUVEMSHOP_CLIENT_ID;
  if (!clientId) {
    res.status(500).json({ error: 'NUVEMSHOP_CLIENT_ID nÃ£o configurado' });
    return;
  }

  // URL oficial de autorizaÃ§Ã£o: o lojista escolhe a loja e autoriza.
  // ApÃ³s autorizar, a Nuvemshop redireciona para a Redirect URI configurada no painel do app,
  // que deve apontar para /api/auth/callback.
  const authUrl = `https://www.tiendanube.com/apps/${clientId}/authorize`;

  res.writeHead(302, { Location: authUrl });
  res.end();
}
