/*!
 * PopUp Studio - Loader
 * Este script Ã© injetado automaticamente nas lojas Nuvemshop que instalaram o app.
 * Responsabilidade: buscar a config dos pop-ups publicados e exibi-los na vitrine.
 */
(function () {
  if (window.__PopUpStudioLoaded) return;
  window.__PopUpStudioLoaded = true;

  // ---- Descoberta do store_id ----
  var scriptEl = document.currentScript || (function () {
    var s = document.getElementsByTagName('script');
    for (var i = s.length - 1; i >= 0; i--) if ((s[i].src || '').indexOf('/loader.js') >= 0) return s[i];
    return null;
  })();

  var storeId = null;
  if (scriptEl && scriptEl.src) {
    try { storeId = new URL(scriptEl.src).searchParams.get('store_id'); } catch (e) {}
  }
  if (!storeId && window.LS && window.LS.store && window.LS.store.id) storeId = window.LS.store.id;
  if (!storeId) { console.warn('[PopUpStudio] store_id nÃ£o encontrado.'); return; }

  var API = (scriptEl && scriptEl.src ? new URL(scriptEl.src).origin : 'https://popup-studio.vercel.app');

  // ---- Util ----
  function xhr(method, url, body, cb) {
    var r = new XMLHttpRequest();
    r.open(method, url, true);
    r.setRequestHeader('Content-Type', 'application/json');
    r.onload = function () { try { cb(null, JSON.parse(r.responseText || '{}')); } catch (e) { cb(null, {}); } };
    r.onerror = function () { cb(new Error('network')); };
    r.send(body ? JSON.stringify(body) : null);
  }
  function trackEvent(type, popupId, payload) {
    xhr('POST', API + '/api/public/event', {
      store_id: storeId, popup_id: popupId || null, event_type: type, payload: payload || {}
    }, function () {});
  }
  function submitLead(popupId, data) {
    xhr('POST', API + '/api/public/lead',
      Object.assign({ store_id: storeId, popup_id: popupId }, data), function () {});
  }

  // ---- CSS base ----
  var style = document.createElement('style');
  style.textContent = [
    '.pus-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:999998;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .25s ease}',
    '.pus-backdrop.open{opacity:1}',
    '.pus-modal{background:#fff;border-radius:14px;max-width:420px;width:92%;padding:26px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.35);transform:translateY(10px) scale(.98);transition:transform .25s ease}',
    '.pus-backdrop.open .pus-modal{transform:translateY(0) scale(1)}',
    '.pus-close{position:absolute;top:10px;right:12px;background:transparent;border:0;font-size:22px;cursor:pointer;color:#888}',
    '.pus-title{font-size:22px;font-weight:700;margin:0 0 6px;color:#111}',
    '.pus-sub{font-size:14px;color:#555;margin:0 0 16px}',
    '.pus-input{width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;font-size:14px;margin-bottom:10px;box-sizing:border-box}',
    '.pus-btn{width:100%;padding:13px;border-radius:8px;border:0;background:#111;color:#fff;font-weight:600;cursor:pointer;font-size:15px}',
    '.pus-btn:hover{opacity:.9}',
    '.pus-result{text-align:center;padding:20px 0}',
    '.pus-prize{font-size:24px;font-weight:800;color:#d97706;margin:8px 0}',
    '.pus-coupon{display:inline-block;padding:8px 14px;background:#fef3c7;border:2px dashed #d97706;border-radius:6px;font-family:monospace;font-weight:700;color:#92400e;margin:10px 0}'
  ].join('');
  document.documentElement.appendChild(style);

  // ---- Render pop-up simples (email capture + prÃªmio) ----
  function openPopup(popup) {
    var cfg = popup.config || {};
    var title    = cfg.title    || 'Ganhe um cupom!';
    var subtitle = cfg.subtitle || 'Deixe seu e-mail para jogar.';
    var btn      = cfg.btn_text || 'Jogar agora';
    var prize    = cfg.prize    || '10% OFF';
    var coupon   = cfg.coupon   || 'BEMVINDO10';

    var back = document.createElement('div');
    back.className = 'pus-backdrop';
    back.innerHTML =
      '<div class="pus-modal" role="dialog" aria-modal="true">' +
        '<button class="pus-close" aria-label="Fechar">Ã</button>' +
        '<h3 class="pus-title">' + escapeHtml(title) + '</h3>' +
        '<p class="pus-sub">' + escapeHtml(subtitle) + '</p>' +
        '<form class="pus-form">' +
          '<input class="pus-input" type="email" placeholder="seu@email.com" required>' +
          '<button type="submit" class="pus-btn">' + escapeHtml(btn) + '</button>' +
        '</form>' +
      '</div>';
    document.body.appendChild(back);
    requestAnimationFrame(function () { back.classList.add('open'); });

    trackEvent('impression', popup.id);

    function close() {
      trackEvent('close', popup.id);
      back.classList.remove('open');
      setTimeout(function () { back.remove(); }, 250);
      try { localStorage.setItem('pus_shown_' + popup.id, String(Date.now())); } catch (e) {}
    }
    back.querySelector('.pus-close').addEventListener('click', close);
    back.addEventListener('click', function (e) { if (e.target === back) close(); });

    back.querySelector('.pus-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var email = back.querySelector('input[type=email]').value.trim();
      if (!email) return;
      trackEvent('play', popup.id);
      submitLead(popup.id, { email: email, prize: prize, coupon: coupon });
      trackEvent('win',  popup.id, { prize: prize, coupon: coupon });
      back.querySelector('.pus-modal').innerHTML =
        '<button class="pus-close" aria-label="Fechar">Ã</button>' +
        '<div class="pus-result">' +
          '<div style="font-size:40px">ð</div>' +
          '<div class="pus-prize">' + escapeHtml(prize) + '</div>' +
          '<p>Use o cupom:</p>' +
          '<div class="pus-coupon">' + escapeHtml(coupon) + '</div>' +
          '<p style="font-size:12px;color:#666">Enviamos tambÃ©m para seu e-mail.</p>' +
        '</div>';
      back.querySelector('.pus-close').addEventListener('click', close);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  // ---- Regras de exibiÃ§Ã£o (cooldown 24h por pop-up) ----
  function shouldShow(popup) {
    try {
      var last = parseInt(localStorage.getItem('pus_shown_' + popup.id) || '0', 10);
      if (last && Date.now() - last < 24 * 3600 * 1000) return false;
    } catch (e) {}
    return true;
  }

  // ---- Busca config e exibe ----
  xhr('GET', API + '/api/public/config?store_id=' + encodeURIComponent(storeId), null, function (err, data) {
    if (err || !data || !Array.isArray(data.popups) || data.popups.length === 0) return;
    var list = data.popups.filter(shouldShow);
    if (!list.length) return;
    setTimeout(function () { openPopup(list[0]); }, 1500);
  });
})();
