/*!
 * PopUp Studio - Loader v3.0
 * Este script é injetado automaticamente nas lojas Nuvemshop que instalaram o app.
 * Responsabilidade: buscar a config dos pop-ups publicados e exibi-los na vitrine.
 */
(function () {
  if (window.__PopUpStudioLoaderRan) return;
  window.__PopUpStudioLoaderRan = true;

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
  if (!storeId) { console.warn('[PopUpStudio] store_id não encontrado.'); return; }

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

  // ---- Detectar uso real de cupom na thank you page (Nuvemshop) ----
  // Robusto: funciona mesmo se localStorage foi limpo ou compra foi em outro dispositivo
  var _pusCouponTracked = {};
  function detectCouponUsage() {
    if (!window.LS || !window.LS.order) return;
    var order = window.LS.order;
    var coupons = order.coupon || order.discount_coupon || [];
    if (!Array.isArray(coupons)) coupons = [coupons];
    coupons.forEach(function(c) {
      var code = (typeof c === 'object' && c !== null) ? (c.code || c.name || String(c)) : String(c);
      if (!code || code === 'undefined' || code === 'null') return;
      code = code.toUpperCase().trim();
      if (_pusCouponTracked[code]) return;
      _pusCouponTracked[code] = true;
      var saved = null;
      try { saved = JSON.parse(localStorage.getItem('pus_coupon_' + code)); } catch(e) {}
      var popupId = saved ? saved.popup_id : null;
      trackEvent('coupon_used', popupId, { coupon: code, order_id: order.id || null, order_total: order.total || null });
      if (saved) { try { localStorage.removeItem('pus_coupon_' + code); } catch(e) {} }
    });
  }
  // Try immediately and also after a delay (LS.order may load late)
  detectCouponUsage();
  setTimeout(detectCouponUsage, 2000);
  setTimeout(detectCouponUsage, 5000);

    function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  // ---- Client-side Email Validation ----
  var VALID_EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  var DISPOSABLE_DOMAINS = ['mailinator.com','guerrillamail.com','tempmail.com','throwaway.email','temp-mail.org','fakeinbox.com','sharklasers.com','yopmail.com','dispostable.com','trashmail.com','trashmail.me','10minutemail.com','tempail.com','tempr.email','discard.email','discardmail.com','emailondeck.com','maildrop.cc','mailnesia.com','mailsac.com','mohmal.com','getnada.com','spamgourmet.com','guerrillamail.net','guerrillamailblock.com','grr.la','trashymail.com','10minutemail.net','mailcatch.com','mailnull.com','mytemp.email','filzmail.com','incognitomail.org','tempinbox.com','emailfake.com','crazymailing.com','armyspy.com','dayrep.com','rhyta.com','superrito.com','teleworm.us'];
  function isValidEmailClient(em) {
    if (!em) return false;
    var tr = em.trim().toLowerCase();
    if (tr.length > 254 || !VALID_EMAIL_RE.test(tr)) return false;
    var dom = tr.split('@')[1];
    if (!dom || dom.indexOf('.') === -1) return false;
    if (DISPOSABLE_DOMAINS.indexOf(dom) !== -1) return false;
    var tld = dom.split('.').pop();
    return tld && tld.length >= 2;
  }
  function showEmailError(el, msg) {
    clearEmailError(el);
    el.style.borderColor = '#ef4444';
    var d = document.createElement('div');
    d.className = 'pus-email-error';
    d.style.cssText = 'color:#ef4444;font-size:12px;margin:-6px 0 6px;';
    d.textContent = msg;
    el.parentNode.insertBefore(d, el.nextSibling);
  }
  function clearEmailError(el) {
    el.style.borderColor = '';
    var p = el.parentNode.querySelector('.pus-email-error');
    if (p) p.remove();
  }

  // ---- Client-side Phone Validation ----
  function isValidPhoneClient(ph) {
    if (!ph) return false;
    var digits = ph.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
  }

  // ---- Generic Field Error (for name, phone) ----
  function showFieldError(el, msg) {
    clearFieldError(el);
    el.style.borderColor = '#ef4444';
    var d = document.createElement('div');
    d.className = 'pus-field-error';
    d.style.cssText = 'color:#ef4444;font-size:12px;margin:-6px 0 6px;';
    d.textContent = msg;
    if (el.parentNode) el.parentNode.insertBefore(d, el.nextSibling);
  }
  function clearFieldError(el) {
    el.style.borderColor = '';
    var wrap = el.parentNode;
    if (wrap) { var p = wrap.querySelector('.pus-field-error'); if (p) p.remove(); }
  }


  // ---- Regras de exibição (cooldown 24h por pop-up) ----
  function shouldShow(popup) {
    try {
      var last = parseInt(localStorage.getItem('pus_shown_' + popup.id) || '0', 10);
      if (last && Date.now() - last < 24 * 3600 * 1000) return false;
    } catch (e) {}
    return true;
  }

  // ═══════════════════════════════════════════════════════════
  // SLOT MACHINE POPUP — Idêntico ao editor do Pop Up Studio
  // ═══════════════════════════════════════════════════════════
  function showSlotMachinePopup(popup) {
    var cfg = popup.config || {};
    var emoji1     = cfg.slot_emoji1 || '👕';
    var emoji2     = cfg.slot_emoji2 || '🧢';
    var emoji3     = cfg.slot_emoji3 || '👟';
    var emojis     = [emoji1, emoji2, emoji3];
    var winEmoji   = emoji3;
    var title      = cfg.title || '🎁 JOGUE E GANHE UM DESCONTO EXCLUSIVO!';
    var subtitle   = cfg.description || 'Cadastre seu e-mail e jogue para ganhar um cupom especial!';
    var machTitle  = cfg.slot_machine_title || 'JACKPOT!';
    var btnColor   = cfg.button_color || '#52b788';
    var btnText    = cfg.button_text || 'Quero jogar!';
    var bgColor    = cfg.background_color || '#0a1f14';
    var textColor  = cfg.text_color || '#ffffff';
    var prize      = cfg.prize || 'DESCONTO10';
    var loseText   = cfg.slot_lose_text || 'Que pena! Tente novamente...';
    var winText    = cfg.slot_win_text || '🎉 PARABÉNS! Você ganhou!';
    var headerEmoji = cfg.emoji || '🎁';

    var slotAttempt = 0;
    var slotSpinning = false;

    // ── Inject CSS ──
    var styleId = 'pus-slot-css';
    if (!document.getElementById(styleId)) {
      var css = document.createElement('style');
      css.id = styleId;
      css.textContent = '\
.pus-slot-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:999998;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .3s ease;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}\
.pus-slot-backdrop.open{opacity:1}\
.pus-slot-popup{position:relative;max-width:340px;width:92%;border-radius:16px;overflow:visible;box-shadow:0 20px 60px rgba(0,0,0,.5);transform:translateY(10px) scale(.97);transition:transform .3s ease}\
.pus-slot-backdrop.open .pus-slot-popup{transform:translateY(0) scale(1)}\
.pus-slot-header{text-align:center;padding:14px 14px 8px;background:linear-gradient(180deg,rgba(0,0,0,.5) 0%,transparent 100%);border-radius:16px 16px 0 0}\
.pus-slot-header-emoji{font-size:28px;margin-bottom:4px}\
.pus-slot-header-title{font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}\
.pus-slot-header-sub{font-size:11px;opacity:.7;font-weight:500}\
.pus-slot-close{position:absolute;top:10px;right:10px;width:28px;height:28px;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.15);border-radius:50%;color:rgba(255,255,255,.7);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;z-index:30}\
.pus-slot-close:hover{background:rgba(255,255,255,.15);color:#fff}\
.pus-slot-machine{background:linear-gradient(180deg,#3a1078 0%,#2a0a5e 40%,#1a0640 100%);border-radius:20px;max-width:320px;width:100%;margin:0 auto;box-shadow:0 10px 50px rgba(0,0,0,.7),inset 0 2px 0 rgba(255,255,255,.1),0 0 30px rgba(255,215,0,.12);position:relative;overflow:visible;border:3px solid rgba(255,215,0,.3)}\
.pus-slot-jackpot{background:linear-gradient(180deg,#1a0640 0%,#2a0a5e 100%);border-radius:16px 16px 0 0;padding:8px 12px 6px;text-align:center;position:relative;overflow:hidden;border-bottom:3px solid #d4a017}\
.pus-slot-jackpot-text{font-size:22px;font-weight:900;color:#f1c40f;text-shadow:0 0 10px rgba(241,196,15,.6),0 0 20px rgba(241,196,15,.3),0 2px 0 #b8860b;letter-spacing:4px;text-transform:uppercase}\
.pus-slot-bulbs{display:flex;justify-content:center;gap:8px;margin-top:4px}\
.pus-slot-bulb{width:8px;height:8px;border-radius:50%;animation:pusBulbBlink 1.2s ease infinite}\
.pus-slot-bulb:nth-child(odd){animation-delay:0s}\
.pus-slot-bulb:nth-child(even){animation-delay:.6s}\
@keyframes pusBulbBlink{0%,100%{opacity:1;box-shadow:0 0 6px currentColor}50%{opacity:.3;box-shadow:none}}\
.pus-slot-body{padding:10px 10px 6px;position:relative;background:linear-gradient(180deg,rgba(255,255,255,.03) 0%,transparent 100%)}\
.pus-slot-screen{background:linear-gradient(180deg,#0a0a18 0%,#050510 100%);border-radius:14px;padding:8px;box-shadow:inset 0 4px 16px rgba(0,0,0,.8),0 2px 0 rgba(255,215,0,.15);border:3px solid #333;position:relative;overflow:hidden}\
.pus-slot-screen::after{content:"";position:absolute;left:8px;right:8px;top:50%;height:2px;background:linear-gradient(90deg,rgba(255,215,0,.4),rgba(255,215,0,.1),rgba(255,215,0,.4));transform:translateY(-50%);z-index:2;pointer-events:none}\
.pus-slot-grid{display:flex;gap:6px;justify-content:center;position:relative}\
.pus-slot-column{display:flex;flex-direction:column;gap:4px;position:relative}\
.pus-slot-cell{width:64px;height:48px;background:linear-gradient(180deg,rgba(255,255,255,.06) 0%,rgba(255,255,255,.02) 50%,rgba(255,255,255,.06) 100%);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:28px;border:1px solid rgba(255,255,255,.08);transition:transform .1s}\
.pus-slot-cell.payline{border-color:rgba(255,215,0,.25);background:linear-gradient(180deg,rgba(255,215,0,.06) 0%,rgba(255,215,0,.02) 50%,rgba(255,215,0,.06) 100%)}\
.pus-slot-cell.spinning{animation:pusCellSpin .12s linear infinite}\
@keyframes pusCellSpin{0%{transform:translateY(-4px)}50%{transform:translateY(4px)}100%{transform:translateY(-4px)}}\
.pus-slot-cell.winner{animation:pusCellWin .5s ease infinite;border-color:#f1c40f;box-shadow:0 0 12px rgba(241,196,15,.5)}\
@keyframes pusCellWin{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}\
.pus-slot-payline-arrow{position:absolute;top:50%;transform:translateY(-50%);font-size:14px;color:#f1c40f;text-shadow:0 0 8px rgba(241,196,15,.5);z-index:3}\
.pus-slot-payline-left{left:-2px}\
.pus-slot-payline-right{right:-2px}\
.pus-slot-attempts{text-align:center;margin-top:8px;font-size:11px;font-weight:600;color:rgba(255,255,255,.6);letter-spacing:.5px}\
.pus-slot-btn-panel{display:flex;gap:6px;margin-top:8px}\
.pus-slot-play-btn{flex:2;background:linear-gradient(180deg,#22c55e,#16a34a);color:#fff;border:2px solid #15803d;border-radius:8px;padding:10px 8px;font-size:13px;font-weight:900;cursor:pointer;text-transform:uppercase;letter-spacing:1px;transition:all .15s;box-shadow:0 3px 12px rgba(34,197,94,.3)}\
.pus-slot-play-btn:hover{transform:translateY(-1px);box-shadow:0 5px 18px rgba(34,197,94,.4)}\
.pus-slot-play-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}\
.pus-slot-coin-tray{background:linear-gradient(180deg,#222,#1a1a1a);border-radius:0 0 16px 16px;padding:8px 16px 10px;border-top:3px solid #d4a017;display:flex;align-items:center;justify-content:center;gap:4px;position:relative;overflow:hidden}\
.pus-slot-coin-tray::before{content:"";position:absolute;top:0;left:10%;right:10%;height:6px;background:linear-gradient(180deg,rgba(212,160,23,.3),transparent);border-radius:0 0 50% 50%}\
.pus-slot-coin{font-size:16px;opacity:.5;animation:pusCoinShine 2s ease infinite}\
.pus-slot-coin:nth-child(odd){animation-delay:.5s}\
@keyframes pusCoinShine{0%,100%{opacity:.4}50%{opacity:.7}}\
.pus-slot-lever{position:absolute;right:-34px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;cursor:pointer;z-index:5}\
.pus-slot-lever-track{width:10px;height:65px;background:linear-gradient(90deg,#999,#ccc,#999);border-radius:5px;position:relative;box-shadow:inset 0 1px 3px rgba(0,0,0,.4),0 1px 0 rgba(255,255,255,.2)}\
.pus-slot-lever-ball{width:24px;height:24px;background:radial-gradient(circle at 35% 35%,#ff6b6b,#c0392b,#8B0000);border-radius:50%;position:absolute;top:-8px;left:50%;transform:translateX(-50%);box-shadow:0 3px 10px rgba(0,0,0,.5),inset 0 -2px 4px rgba(0,0,0,.3),inset 0 2px 4px rgba(255,255,255,.2);transition:top .3s cubic-bezier(.68,-.55,.27,1.55)}\
.pus-slot-lever.pulled .pus-slot-lever-ball{top:44px}\
.pus-slot-lever-base{width:16px;height:8px;background:linear-gradient(180deg,#aaa,#666);border-radius:0 0 6px 6px;margin-top:-1px}\
.pus-slot-coupon-banner{display:flex;align-items:center;justify-content:center;gap:8px;padding:8px 12px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:#f1c40f;border-top:2px solid #f1c40f;border-bottom:2px solid #f1c40f}\
.pus-slot-coupon-banner::before,.pus-slot-coupon-banner::after{content:"◆";font-size:6px;opacity:.6}\
.pus-slot-lock-overlay{position:relative;display:flex;flex-direction:column;align-items:center;z-index:20;background:linear-gradient(180deg,rgba(0,0,0,.4) 0%,rgba(0,0,0,.7) 100%);padding:12px 14px 14px;transition:opacity .5s ease,max-height .5s ease;overflow:hidden}\
.pus-slot-lock-overlay.hidden{opacity:0;max-height:0;padding:0 16px;pointer-events:none}\
.pus-slot-lock-subtitle{font-size:10px;color:rgba(255,255,255,.6);text-align:center;margin-bottom:10px;display:flex;align-items:center;gap:6px}\
.pus-slot-lock-subtitle::before{content:"🔒";font-size:11px}\
.pus-slot-lock-form{display:flex;flex-direction:column;gap:8px;width:100%;max-width:260px}\
.pus-slot-lock-input-wrap{position:relative;display:flex;align-items:center}\
.pus-slot-lock-input-icon{position:absolute;left:12px;font-size:14px;color:rgba(255,255,255,.35);pointer-events:none;z-index:2}\
.pus-slot-lock-input{width:100%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:10px 12px 10px 36px;color:#fff;font-size:13px;outline:none;text-align:left;transition:border-color .2s,background .2s;box-sizing:border-box}\
.pus-slot-lock-input::placeholder{color:rgba(255,255,255,.35)}\
.pus-slot-lock-input:focus{border-color:#22c55e;background:rgba(255,255,255,.12)}\
.pus-slot-lock-btn{background:linear-gradient(180deg,#22c55e,#16a34a);color:#fff;border:2px solid #16a34a;border-radius:10px;padding:11px;font-size:13px;font-weight:900;cursor:pointer;text-transform:uppercase;letter-spacing:2px;box-shadow:0 4px 20px rgba(34,197,94,.35),inset 0 1px 0 rgba(255,255,255,.15);transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px}\
.pus-slot-lock-btn:hover{transform:translateY(-2px);box-shadow:0 6px 25px rgba(34,197,94,.45)}\
.pus-slot-lock-btn::after{content:"→";font-size:16px;font-weight:400}\
.pus-slot-locked .pus-slot-btn-panel{display:none}\
.pus-slot-locked .pus-slot-attempts{display:none}\
.pus-slot-victory{position:absolute;inset:0;background:rgba(0,0,0,.88);display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:16px;z-index:10;animation:pusVictoryIn .4s ease}\
@keyframes pusVictoryIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}\
.pus-slot-victory-emoji{font-size:36px;animation:pusVicBounce .6s ease infinite}\
@keyframes pusVicBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}\
.pus-slot-victory-text{font-size:20px;font-weight:900;color:#f1c40f;margin:6px 0 2px;text-transform:uppercase;text-shadow:0 0 10px rgba(241,196,15,.5)}\
.pus-slot-victory-sub{font-size:11px;color:rgba(255,255,255,.7);margin-bottom:6px}\
.pus-slot-coupon-box{background:linear-gradient(135deg,#f1c40f 0%,#e67e22 100%);color:#1a0640;padding:12px 28px;border-radius:10px;font-size:22px;font-weight:900;letter-spacing:3px;border:2px dashed rgba(26,6,64,.4);margin-top:4px;box-shadow:0 4px 16px rgba(241,196,15,.3)}\
.pus-slot-copy-btn{animation:pusCopyPulse 1.5s ease infinite;flex:none!important;width:auto!important}\
@keyframes pusCopyPulse{0%,100%{box-shadow:0 4px 20px rgba(34,197,94,.35)}50%{box-shadow:0 4px 30px rgba(34,197,94,.6),0 0 15px rgba(34,197,94,.3)}}\
.pus-slot-confetti{position:absolute;width:8px;height:8px;border-radius:2px;animation:pusConfetti 1.5s ease-out forwards;z-index:11;pointer-events:none}\
@keyframes pusConfetti{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(200px) rotate(720deg);opacity:0}}\
@media(max-width:400px){.pus-slot-popup{width:96%}.pus-slot-cell{width:52px;height:40px;font-size:22px}}\
';
      document.documentElement.appendChild(css);
    }

    // ── Build HTML ──
    var back = document.createElement('div');
    back.className = 'pus-slot-backdrop';
    back.innerHTML =
      '<div class="pus-slot-popup" style="background:' + esc(bgColor) + ';color:' + esc(textColor) + ';">' +
        '<button class="pus-slot-close" aria-label="Fechar">✕</button>' +
        // Header
        '<div class="pus-slot-header">' +
          '<div class="pus-slot-header-emoji">' + esc(headerEmoji) + '</div>' +
          '<div class="pus-slot-header-title">' + esc(title) + '</div>' +
          '<div class="pus-slot-header-sub">' + esc(subtitle) + '</div>' +
        '</div>' +
        // Slot Machine
        '<div style="padding:10px 10px 0;">' +
          '<div class="pus-slot-machine pus-slot-locked" id="pus-slot-machine">' +
            // Jackpot Header
            '<div class="pus-slot-jackpot">' +
              '<div class="pus-slot-jackpot-text">' + esc(machTitle) + '</div>' +
              '<div class="pus-slot-bulbs">' +
                '<span class="pus-slot-bulb" style="color:#f1c40f;background:#f1c40f"></span>' +
                '<span class="pus-slot-bulb" style="color:#e74c3c;background:#e74c3c"></span>' +
                '<span class="pus-slot-bulb" style="color:#3498db;background:#3498db"></span>' +
                '<span class="pus-slot-bulb" style="color:#f1c40f;background:#f1c40f"></span>' +
                '<span class="pus-slot-bulb" style="color:#2ecc71;background:#2ecc71"></span>' +
                '<span class="pus-slot-bulb" style="color:#e74c3c;background:#e74c3c"></span>' +
                '<span class="pus-slot-bulb" style="color:#3498db;background:#3498db"></span>' +
              '</div>' +
            '</div>' +
            // Body
            '<div class="pus-slot-body">' +
              '<div class="pus-slot-screen">' +
                '<div class="pus-slot-payline-arrow pus-slot-payline-left">▶</div>' +
                '<div class="pus-slot-payline-arrow pus-slot-payline-right">◀</div>' +
                '<div class="pus-slot-grid">' +
                  '<div class="pus-slot-column">' +
                    '<div class="pus-slot-cell" data-c="1" data-r="1">' + emoji1 + '</div>' +
                    '<div class="pus-slot-cell payline" data-c="1" data-r="2">' + emoji1 + '</div>' +
                    '<div class="pus-slot-cell" data-c="1" data-r="3">' + emoji2 + '</div>' +
                  '</div>' +
                  '<div class="pus-slot-column">' +
                    '<div class="pus-slot-cell" data-c="2" data-r="1">' + emoji3 + '</div>' +
                    '<div class="pus-slot-cell payline" data-c="2" data-r="2">' + emoji2 + '</div>' +
                    '<div class="pus-slot-cell" data-c="2" data-r="3">' + emoji1 + '</div>' +
                  '</div>' +
                  '<div class="pus-slot-column">' +
                    '<div class="pus-slot-cell" data-c="3" data-r="1">' + emoji2 + '</div>' +
                    '<div class="pus-slot-cell payline" data-c="3" data-r="2">' + emoji3 + '</div>' +
                    '<div class="pus-slot-cell" data-c="3" data-r="3">' + emoji1 + '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="pus-slot-attempts" id="pus-slot-attempts">Tentativa 1 de 3</div>' +
              '<div class="pus-slot-btn-panel">' +
                '<button class="pus-slot-play-btn" id="pus-slot-play-btn">🎰 JOGAR</button>' +
              '</div>' +
            '</div>' +
            // Coupon Banner
            '<div class="pus-slot-coupon-banner">🎁 CUPOM SURPRESA DE DESCONTO</div>' +
            // Lock Overlay (registration form)
            '<div class="pus-slot-lock-overlay" id="pus-slot-lock">' +
              '<div class="pus-slot-lock-form">' +
                '<div class="pus-slot-lock-input-wrap">' +
                  '<span class="pus-slot-lock-input-icon">👤</span>' +
                  '<input class="pus-slot-lock-input" id="pus-slot-name" placeholder="Seu nome *" type="text">' +
                '</div>' +
                '<div class="pus-slot-lock-input-wrap">' +
                  '<span class="pus-slot-lock-input-icon">✉️</span>' +
                  '<input class="pus-slot-lock-input" id="pus-slot-email" placeholder="Seu e-mail *" type="email" required>' +
                '</div>' +
                '<div class="pus-slot-lock-input-wrap">' +
                  '<span class="pus-slot-lock-input-icon">📞</span>' +
                  '<input class="pus-slot-lock-input" id="pus-slot-phone" placeholder="Seu telefone *" type="tel">' +
                '</div>' +
                '<div class="pus-slot-lock-subtitle">Cadastre-se para desbloquear o jogo e ganhar seu desconto!</div>' +
                '<button class="pus-slot-lock-btn" id="pus-slot-unlock-btn">' + esc(btnText).toUpperCase() + '</button>' +
              '</div>' +
            '</div>' +
            // Lever
            '<div class="pus-slot-lever" id="pus-slot-lever">' +
              '<div class="pus-slot-lever-track"><div class="pus-slot-lever-ball"></div></div>' +
              '<div class="pus-slot-lever-base"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(back);
    requestAnimationFrame(function () { back.classList.add('open'); });
    trackEvent('impression', popup.id);

    var machine = back.querySelector('#pus-slot-machine');
    var playBtn = back.querySelector('#pus-slot-play-btn');
    var attEl   = back.querySelector('#pus-slot-attempts');
    var lever   = back.querySelector('#pus-slot-lever');
    var lockOverlay = back.querySelector('#pus-slot-lock');
    var unlockBtn = back.querySelector('#pus-slot-unlock-btn');

    // Helper: get cell by col, row
    function getCell(c, r) {
      return machine.querySelector('.pus-slot-cell[data-c="' + c + '"][data-r="' + r + '"]');
    }

    // ── Close ──
    function closePopup() {
      trackEvent('close', popup.id);
      back.classList.remove('open');
      setTimeout(function () { back.remove(); }, 300);
      try { localStorage.setItem('pus_shown_' + popup.id, String(Date.now())); } catch (e) {}
    }
    back.querySelector('.pus-slot-close').addEventListener('click', closePopup);
    back.addEventListener('click', function (e) { if (e.target === back) closePopup(); });

    // ── Unlock (registration) ──
    unlockBtn.addEventListener('click', function () {
      var nameEl = back.querySelector('#pus-slot-name');
      var emailEl = back.querySelector('#pus-slot-email');
      var phoneEl = back.querySelector('#pus-slot-phone');
      var nm = nameEl.value.trim();
      var email = emailEl.value.trim();
      var phone = phoneEl.value.trim();
      var hasErr = false;

      // Validate name
      clearFieldError(nameEl);
      if (!nm) { showFieldError(nameEl, 'Por favor, insira seu nome.'); hasErr = true; }

      // Validate email
      clearEmailError(emailEl);
      if (!email) { showFieldError(emailEl, 'Por favor, insira seu e-mail.'); hasErr = true; }
      else if (!isValidEmailClient(email)) { showEmailError(emailEl, 'Por favor, insira um e-mail v\u00e1lido.'); hasErr = true; }

      // Validate phone
      clearFieldError(phoneEl);
      if (!phone) { showFieldError(phoneEl, 'Por favor, insira seu telefone.'); hasErr = true; }
      else if (!isValidPhoneClient(phone)) { showFieldError(phoneEl, 'Telefone inv\u00e1lido. Use DDD + n\u00famero.'); hasErr = true; }

      if (hasErr) return;

      submitLead(popup.id, { email: email, name: nm, phone: phone });
      trackEvent('register', popup.id, { email: email });

      // Unlock machine
      machine.classList.remove('pus-slot-locked');
      lockOverlay.classList.add('hidden');
      playBtn.disabled = false;
    });

    // ── Play (pull lever / spin) ──
    function pullLever() {
      if (slotSpinning || slotAttempt >= 3) return;
      slotSpinning = true;
      slotAttempt++;

      playBtn.disabled = true;
      playBtn.textContent = '⏳ GIRANDO...';
      attEl.textContent = 'Tentativa ' + slotAttempt + ' de 3';

      trackEvent('play', popup.id, { attempt: slotAttempt });

      // Lever animation
      if (lever) lever.classList.add('pulled');
      setTimeout(function () { if (lever) lever.classList.remove('pulled'); }, 600);

      // Start spinning all 9 cells
      for (var cc = 1; cc <= 3; cc++) {
        for (var rr = 1; rr <= 3; rr++) {
          var cell = getCell(cc, rr);
          if (cell) cell.classList.add('spinning');
        }
      }

      var spinInterval = setInterval(function () {
        for (var cc = 1; cc <= 3; cc++) {
          for (var rr = 1; rr <= 3; rr++) {
            var cell = getCell(cc, rr);
            if (cell && cell.classList.contains('spinning')) {
              cell.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            }
          }
        }
      }, 80);

      var isWin = slotAttempt === 3;

      // Stop column 1 after 800ms
      setTimeout(function () {
        for (var rr = 1; rr <= 3; rr++) {
          var cell = getCell(1, rr);
          if (cell) {
            cell.classList.remove('spinning');
            cell.textContent = (rr === 2 && isWin) ? winEmoji : (rr === 2 ? emojis[Math.floor(Math.random() * 2)] : emojis[Math.floor(Math.random() * emojis.length)]);
          }
        }
      }, 800);

      // Stop column 2 after 1400ms
      setTimeout(function () {
        for (var rr = 1; rr <= 3; rr++) {
          var cell = getCell(2, rr);
          if (cell) {
            cell.classList.remove('spinning');
            cell.textContent = (rr === 2 && isWin) ? winEmoji : emojis[Math.floor(Math.random() * emojis.length)];
          }
        }
      }, 1400);

      // Stop column 3 after 2000ms — resolve win/loss
      setTimeout(function () {
        clearInterval(spinInterval);
        for (var rr = 1; rr <= 3; rr++) {
          var cell = getCell(3, rr);
          if (cell) {
            cell.classList.remove('spinning');
            if (rr === 2) {
              if (isWin) {
                cell.textContent = winEmoji;
              } else {
                // Ensure payline does NOT match (force loss)
                var p1 = getCell(1, 2).textContent;
                var p2 = getCell(2, 2).textContent;
                if (p1 === p2) {
                  cell.textContent = emojis.filter(function (e) { return e !== p1; })[0] || emojis[0];
                } else {
                  cell.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                }
              }
            } else {
              cell.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            }
          }
        }

        slotSpinning = false;

        if (isWin) {
          // Winner! Highlight payline cells
          for (var cc = 1; cc <= 3; cc++) {
            getCell(cc, 2).classList.add('winner');
          }
          playBtn.textContent = '🎉 JACKPOT!';
          playBtn.disabled = true;
          trackEvent('win', popup.id, { prize: prize });
          setTimeout(function () { showVictory(); }, 800);
        } else {
          playBtn.disabled = false;
          playBtn.textContent = '🎰 JOGAR (' + (3 - slotAttempt) + ')';
          trackEvent('lose', popup.id, { attempt: slotAttempt });
        }
      }, 2000);
    }

    playBtn.addEventListener('click', pullLever);
    lever.addEventListener('click', pullLever);

    // ── Victory overlay with confetti ──
    function showVictory() {
      var colors = ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#e67e22', '#1abc9c', '#ec4899'];
      for (var i = 0; i < 40; i++) {
        var conf = document.createElement('div');
        conf.className = 'pus-slot-confetti';
        conf.style.left = Math.random() * 100 + '%';
        conf.style.top = '-10px';
        conf.style.background = colors[Math.floor(Math.random() * colors.length)];
        conf.style.animationDelay = (Math.random() * 0.8) + 's';
        conf.style.animationDuration = (1 + Math.random() * 1) + 's';
        conf.style.width = (4 + Math.random() * 6) + 'px';
        conf.style.height = (4 + Math.random() * 6) + 'px';
        machine.appendChild(conf);
      }
      var victory = document.createElement('div');
      victory.className = 'pus-slot-victory';
      victory.innerHTML =
        '<div class="pus-slot-victory-emoji">' + winEmoji + '</div>' +
        '<div class="pus-slot-victory-text">JACKPOT!</div>' +
        '<div class="pus-slot-victory-sub">Seu cupom de desconto:</div>' +
        '<div class="pus-slot-coupon-box" id="pus-coupon-code">' + esc(prize) + '</div>' +
        '<button class="pus-slot-play-btn pus-slot-copy-btn" style="margin-top:12px;width:auto;padding:10px 24px;font-size:12px;letter-spacing:1px;" id="pus-copy-btn">' +
        '🎉 USAR MEU CUPOM AGORA</button>' +
        '<div id="pus-copy-feedback" style="opacity:0;font-size:11px;color:#22c55e;margin-top:6px;transition:opacity .3s;">✅ Cupom copiado! Cole no checkout.</div>';
      machine.appendChild(victory);

      // Salvar cupom ganho no localStorage para rastrear uso real no checkout
      try { localStorage.setItem('pus_coupon_' + prize.toUpperCase().trim(), JSON.stringify({ popup_id: popup.id, coupon: prize, won_at: Date.now() })); } catch(e) {}

      // Copy coupon
      victory.querySelector('#pus-copy-btn').addEventListener('click', function () {
          try {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(prize);
          } else {
            var ta = document.createElement('textarea');
            ta.value = prize;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
          }
          var fb = victory.querySelector('#pus-copy-feedback');
          fb.style.opacity = '1';
          setTimeout(function () { fb.style.opacity = '0'; }, 3000);
        } catch (e) {}
      });
    }
  }

  // ═══════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════
  // SKATE GRIND POPUP — Canvas game with obstacles and grinding
  // ═══════════════════════════════════════════════════════════
  function showSkateGrindPopup(popup) {
    var cfg = popup.config || {};
    var title = cfg.title || 'SKATE GRIND';
    var subtitle = cfg.description || 'Pule obstáculos e ganhe descontos!';
    var btnColor = cfg.button_color || '#22c55e';
    var bgColor = cfg.background_color || '#111111';
    var textColor = cfg.text_color || '#ffffff';
    var btnText = cfg.button_text || 'Desbloquear';
    var prize = cfg.prize || 'SKATE10';
    var headerEmoji = cfg.emoji || '🛩';

    var WIN_SCORE = 800;
    var GROUND_Y = 140, SKATER_W = 20, SKATER_H = 26, SKATER_X = 40;
    var GRAVITY = 0.5, JUMP_FORCE = -9;
    var running = false, unlocked = false, score = 0, speed = 3;
    var animId = null, skaterY = GROUND_Y - SKATER_H, skaterVY = 0, onGround = true, grinding = false;
    var obstacles = [], floatingTexts = [], stars = [];
    var frameCount = 0, combo = 0, lastGrind = 0;
    var canvas, ctx, scoreEl, startBtn;
    var CW = 320, CH = 180;

    // Generate stars
    for (var si = 0; si < 40; si++) {
      stars.push({ x: Math.random() * CW, y: Math.random() * (GROUND_Y * 0.6), s: 0.5 + Math.random() * 1.5, b: Math.random() });
    }

    // --- CSS ---
    if (!document.getElementById('pus-skate-css')) {
      var css = document.createElement('style');
      css.id = 'pus-skate-css';
      css.textContent = '\
.pus-skate-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:999999;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .3s}\
.pus-skate-backdrop.open{opacity:1}\
.pus-skate-popup{position:relative;width:92%;max-width:380px;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.6);transform:translateY(30px) scale(.95);transition:transform .35s cubic-bezier(.4,0,.2,1)}\
.pus-skate-backdrop.open .pus-skate-popup{transform:translateY(0) scale(1)}\
.pus-skate-close{position:absolute;top:10px;right:10px;width:28px;height:28px;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.15);border-radius:50%;color:rgba(255,255,255,.7);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:30}\
.pus-skate-header{text-align:center;padding:14px 14px 8px;background:rgba(0,0,0,.4);border-bottom:1px solid rgba(255,255,255,.06)}\
.pus-skate-header-icon{font-size:28px;display:block;margin-bottom:4px}\
.pus-skate-header-title{font-size:16px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin:0}\
.pus-skate-header-sub{font-size:11px;opacity:.6;margin:4px 0 0}\
.pus-skate-canvas-wrap{position:relative;width:100%;background:#000}\
.pus-skate-canvas-wrap canvas{display:block;width:100%;height:auto}\
.pus-skate-score{text-align:center;padding:6px;font-size:13px;font-weight:700;letter-spacing:1px}\
.pus-skate-instruction{text-align:center;padding:4px;font-size:10px;opacity:.5}\
.pus-skate-start{display:block;width:80%;margin:8px auto 12px;padding:10px;border:none;border-radius:8px;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:1px;cursor:pointer}\
.pus-skate-lock{position:absolute;inset:0;background:rgba(0,0,0,.85);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:10;padding:16px;border-radius:0 0 14px 14px}\
.pus-skate-lock h4{margin:0 0 10px;font-size:15px;font-weight:800}\
.pus-skate-lock .pus-form{width:100%;max-width:260px}\
.pus-skate-lock .pus-form input{width:100%;padding:8px 10px;margin:4px 0;border:1px solid rgba(255,255,255,.15);border-radius:6px;background:rgba(255,255,255,.08);color:#fff;font-size:13px;box-sizing:border-box}\
.pus-skate-lock .pus-form input::placeholder{color:rgba(255,255,255,.35)}\
.pus-skate-lock .pus-form button{width:100%;padding:10px;margin-top:8px;border:none;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer;text-transform:uppercase;letter-spacing:1px}\
.pus-skate-victory{position:absolute;inset:0;background:rgba(0,0,0,.95);display:none;flex-direction:column;align-items:center;justify-content:center;z-index:15;padding:18px;border-radius:14px;text-align:center}\
.pus-skate-victory.active{display:flex}\
.pus-skate-victory .trophy{font-size:40px}\
.pus-skate-victory h4{color:#fff;margin:8px 0 4px;font-size:16px;font-weight:900;letter-spacing:2px}\
.pus-skate-victory .prize-text{font-size:24px;font-weight:900;margin:4px 0}\
.pus-skate-victory .coupon-box{background:rgba(255,255,255,.1);border-radius:8px;padding:8px 16px;margin:10px 0}\
.pus-skate-victory .coupon-box code{font-size:16px;font-weight:800;letter-spacing:2px}\
.pus-skate-victory .coupon-box button{background:#fff;border:none;color:#111;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:11px;font-weight:700}\
';
      document.documentElement.appendChild(css);
    }

    // --- HTML ---
    var back = document.createElement('div');
    back.className = 'pus-skate-backdrop';
    back.innerHTML = '<div class="pus-skate-popup" style="background:' + bgColor + ';color:' + textColor + '">' +
      '<button class="pus-skate-close" aria-label="Fechar">×</button>' +
      '<div class="pus-skate-header">' +
        '<span class="pus-skate-header-icon">' + headerEmoji + '</span>' +
        '<h3 class="pus-skate-header-title" style="color:' + textColor + '">' + esc(title) + '</h3>' +
        '<p class="pus-skate-header-sub">' + esc(subtitle) + '</p>' +
      '</div>' +
      '<div class="pus-skate-canvas-wrap">' +
        '<canvas width="' + CW + '" height="' + CH + '"></canvas>' +
        '<div class="pus-skate-victory" id="pus-skate-victory">' +
          '<div class="trophy">🏆</div>' +
          '<h4>PARABÉNS!</h4>' +
          '<p class="prize-text" style="color:' + btnColor + '">Pontuação: <span id="pus-skate-final">0</span></p>' +
          '<div class="coupon-box">' +
            '<p style="font-size:11px;opacity:.6;margin:0 0 4px">Seu cupom:</p>' +
            '<code id="pus-skate-coupon" style="color:' + btnColor + '">' + esc(prize) + '</code><br>' +
            '<button id="pus-skate-copy" style="margin-top:6px">COPIAR CUPOM</button>' +
          '</div>' +
        '</div>' +
        '<div class="pus-skate-lock" id="pus-skate-lock" style="display:flex">' +
          '<h4 style="color:' + textColor + '">🔒 Cadastre-se para jogar</h4>' +
          '<form class="pus-form">' +
            '<input type="text" id="pus-gen-name" placeholder="Seu nome" required>' +
            '<input type="email" id="pus-gen-email" placeholder="Seu e-mail" required>' +
            '<input type="tel" id="pus-gen-phone" placeholder="Seu telefone" required>' +
            '<button type="submit" style="background:' + btnColor + ';color:' + bgColor + '">' + esc(btnText) + '</button>' +
          '</form>' +
        '</div>' +
      '</div>' +
      '<div class="pus-skate-score" id="pus-skate-score" style="color:' + textColor + '">0 / ' + WIN_SCORE + '</div>' +
      '<p class="pus-skate-instruction">Toque ou pressione ESPAÇO para pular</p>' +
      '<button class="pus-skate-start" id="pus-skate-start" style="background:' + btnColor + ';color:' + bgColor + '" disabled>JOGAR</button>' +
    '</div>';

    document.body.appendChild(back);
    trackEvent('impression', popup.id);
    requestAnimationFrame(function () { back.classList.add('open'); });

    canvas = back.querySelector('canvas');
    ctx = canvas.getContext('2d');
    scoreEl = back.querySelector('#pus-skate-score');
    startBtn = back.querySelector('#pus-skate-start');
    var lockEl = back.querySelector('#pus-skate-lock');

    // --- Drawing ---
    function drawFrame() {
      ctx.clearRect(0, 0, CW, CH);
      var skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      skyGrad.addColorStop(0, '#1a1a2e');
      skyGrad.addColorStop(1, '#16213e');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CW, GROUND_Y);

      for (var si = 0; si < stars.length; si++) {
        var st = stars[si];
        var twinkle = 0.5 + 0.5 * Math.sin(frameCount * 0.03 + st.b * 10);
        ctx.globalAlpha = twinkle * 0.8;
        ctx.fillStyle = '#fff';
        ctx.fillRect(st.x, st.y, st.s, st.s);
        if (running) { st.x -= speed * 0.2; if (st.x < 0) st.x = CW; }
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = '#0f0f23';
      for (var bi = 0; bi < 8; bi++) {
        var bx = ((bi * 50 - (running ? frameCount * 0.5 : 0)) % (CW + 50) + CW + 50) % (CW + 50) - 25;
        var bh = 20 + (bi * 17) % 35;
        ctx.fillRect(bx, GROUND_Y - bh, 30, bh);
        ctx.fillStyle = '#1a1a3e';
        for (var wy = GROUND_Y - bh + 4; wy < GROUND_Y - 4; wy += 8) {
          for (var wx = bx + 4; wx < bx + 26; wx += 8) {
            ctx.fillRect(wx, wy, 3, 4);
          }
        }
        ctx.fillStyle = '#0f0f23';
      }

      ctx.fillStyle = '#333';
      ctx.fillRect(0, GROUND_Y, CW, CH - GROUND_Y);
      ctx.fillStyle = '#444';
      ctx.fillRect(0, GROUND_Y, CW, 2);
      ctx.fillStyle = 'rgba(34,197,94,0.08)';
      ctx.fillRect(0, GROUND_Y + 2, CW, 6);

      for (var oi = 0; oi < obstacles.length; oi++) { drawObs(obstacles[oi]); }
      drawSkater();

      for (var fi = floatingTexts.length - 1; fi >= 0; fi--) {
        var ft = floatingTexts[fi];
        ctx.globalAlpha = ft.life / 40;
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(ft.text, ft.x, ft.y);
        ft.y -= 0.8; ft.life--;
        if (ft.life <= 0) floatingTexts.splice(fi, 1);
      }
      ctx.globalAlpha = 1;

      if (running) {
        var prog = Math.min(score / WIN_SCORE, 1);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(10, 6, CW - 20, 5);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(10, 6, (CW - 20) * prog, 5);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(score + ' / ' + WIN_SCORE, CW - 70, 22);
      }
    }

    function drawSkater() {
      var x = SKATER_X, y = skaterY;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x - 2, GROUND_Y - 2, SKATER_W + 4, 3);
      if (!onGround) {
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(x + 2, y + SKATER_H, 6, GROUND_Y - y - SKATER_H);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = '#888';
      ctx.fillRect(x + 4, y, 12, 4);
      ctx.fillRect(x + 12, y + 1, 4, 3);
      ctx.fillStyle = '#ffd5a0';
      ctx.fillRect(x + 6, y + 4, 8, 6);
      ctx.fillStyle = '#111';
      ctx.fillRect(x + 9, y + 6, 2, 2);
      ctx.fillRect(x + 13, y + 6, 2, 2);
      ctx.fillStyle = '#ddd';
      ctx.fillRect(x + 5, y + 10, 10, 8);
      if (!onGround) {
        ctx.fillRect(x + 1, y + 10, 4, 3);
        ctx.fillRect(x + 15, y + 10, 4, 3);
      } else if (grinding) {
        ctx.fillRect(x + 1, y + 12, 4, 3);
        ctx.fillRect(x + 15, y + 8, 4, 3);
      } else {
        ctx.fillRect(x + 2, y + 11, 3, 3);
        ctx.fillRect(x + 15, y + 11, 3, 3);
      }
      ctx.fillStyle = '#999';
      ctx.fillRect(x + 5, y + 18, 4, 5);
      ctx.fillRect(x + 11, y + 18, 4, 5);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(x + 2, y + 23, 16, 3);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 3, y + 25, 3, 2);
      ctx.fillRect(x + 14, y + 25, 3, 2);
      if (grinding && running) {
        ctx.fillStyle = '#fbbf24';
        for (var sp = 0; sp < 4; sp++) {
          var sx = x + 2 + Math.random() * 16;
          var sy = y + 24 + Math.random() * 3;
          ctx.fillRect(sx, sy, 2, 1);
        }
      }
    }

    function drawObs(o) {
      if (o.type === 'hydrant') {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(o.x + 2, GROUND_Y - 18, 12, 18);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(o.x, GROUND_Y - 14, 16, 4);
        ctx.fillStyle = '#fca5a5';
        ctx.fillRect(o.x + 4, GROUND_Y - 16, 3, 2);
      } else if (o.type === 'rail') {
        ctx.fillStyle = '#888';
        ctx.fillRect(o.x, GROUND_Y - 22, 2, 22);
        ctx.fillRect(o.x + o.w - 2, GROUND_Y - 22, 2, 22);
        ctx.fillStyle = '#aaa';
        ctx.fillRect(o.x, GROUND_Y - 22, o.w, 3);
        ctx.fillStyle = 'rgba(168,168,168,0.15)';
        ctx.fillRect(o.x, GROUND_Y - 25, o.w, 2);
      } else if (o.type === 'combo') {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(o.x + 2, GROUND_Y - 18, 12, 18);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(o.x, GROUND_Y - 14, 16, 4);
        ctx.fillStyle = '#888';
        ctx.fillRect(o.x + 20, GROUND_Y - 22, 2, 22);
        ctx.fillRect(o.x + 20 + o.w - 22, GROUND_Y - 22, 2, 22);
        ctx.fillStyle = '#aaa';
        ctx.fillRect(o.x + 20, GROUND_Y - 22, o.w - 20, 3);
      }
    }

    function jump() {
      if (onGround || grinding) { skaterVY = JUMP_FORCE; onGround = false; grinding = false; }
    }

    function addPts(pts, label) {
      score += pts;
      if (scoreEl) scoreEl.textContent = score + ' / ' + WIN_SCORE;
      floatingTexts.push({ text: '+' + pts + (label ? ' ' + label : ''), x: SKATER_X + 20, y: skaterY - 5, life: 40 });
      try { localStorage.setItem('pus_coupon', prize); localStorage.setItem('pus_coupon_popup', String(popup.id)); } catch (e) {}
    }

    function spawnObs() {
      var r = Math.random();
      if (r < 0.4) { obstacles.push({ type: 'hydrant', x: CW + 10, w: 16, h: 18 }); }
      else if (r < 0.75) { var rw = 50 + Math.random() * 30; obstacles.push({ type: 'rail', x: CW + 10, w: rw, h: 22 }); }
      else { var cw = 70 + Math.random() * 20; obstacles.push({ type: 'combo', x: CW + 10, w: cw, h: 22 }); }
    }

    function gameLoop() {
      if (!running) return;
      frameCount++;
      skaterVY += GRAVITY; skaterY += skaterVY; grinding = false;
      if (skaterY >= GROUND_Y - SKATER_H) { skaterY = GROUND_Y - SKATER_H; skaterVY = 0; onGround = true; }
      speed = 3 + score * 0.003;
      if (frameCount % Math.max(40, 70 - Math.floor(score / 50)) === 0) { spawnObs(); }

      for (var i = obstacles.length - 1; i >= 0; i--) {
        var o = obstacles[i]; o.x -= speed;
        if (o.x + o.w < -10) { obstacles.splice(i, 1); continue; }
        var skL = SKATER_X + 3, skR = SKATER_X + SKATER_W - 3;
        var skT = skaterY + 4, skB = skaterY + SKATER_H;

        if (o.type === 'hydrant') {
          var oL = o.x, oR = o.x + 16, oT = GROUND_Y - 18;
          if (skR > oL && skL < oR && skB > oT && skT < GROUND_Y) { gameOver(); return; }
        } else if (o.type === 'rail') {
          var railTop = GROUND_Y - 22;
          if (skR > o.x && skL < o.x + o.w) {
            if (skB >= railTop && skB <= railTop + 8 && skaterVY >= 0) {
              skaterY = railTop - SKATER_H; skaterVY = 0; onGround = false; grinding = true;
              if (frameCount - lastGrind > 5) { combo++; var pts = 10 * combo; addPts(pts, combo > 1 ? 'x' + combo : 'GRIND'); lastGrind = frameCount; }
            } else if (skR > o.x + 2 && skL < o.x + o.w - 2 && skT < GROUND_Y && skB > railTop + 8) { gameOver(); return; }
          }
        } else if (o.type === 'combo') {
          var hL = o.x, hR = o.x + 16, hT = GROUND_Y - 18;
          if (skR > hL && skL < hR && skB > hT && skT < GROUND_Y) { gameOver(); return; }
          var rStart = o.x + 20, rEnd = o.x + o.w, rTop = GROUND_Y - 22;
          if (skR > rStart && skL < rEnd) {
            if (skB >= rTop && skB <= rTop + 8 && skaterVY >= 0) {
              skaterY = rTop - SKATER_H; skaterVY = 0; onGround = false; grinding = true;
              if (frameCount - lastGrind > 5) { combo++; var pts2 = 15 * combo; addPts(pts2, 'COMBO x' + combo); lastGrind = frameCount; }
            } else if (skR > rStart + 2 && skL < rEnd - 2 && skT < GROUND_Y && skB > rTop + 8) { gameOver(); return; }
          }
        }
      }

      if (frameCount % 10 === 0) { addPts(1, ''); }
      if (score >= WIN_SCORE) { running = false; cancelAnimationFrame(animId); trackEvent('win', popup.id, { prize: prize }); showVictory(); return; }
      drawFrame();
      animId = requestAnimationFrame(gameLoop);
    }

    function gameOver() {
      running = false; cancelAnimationFrame(animId);
      ctx.fillStyle = 'rgba(239,68,68,0.4)'; ctx.fillRect(0, 0, CW, CH);
      score = Math.max(0, score - 50); combo = 0;
      if (scoreEl) scoreEl.textContent = score + ' / ' + WIN_SCORE;
      startBtn.disabled = false; startBtn.textContent = 'TENTAR DE NOVO';
    }

    function startRun() {
      if (!unlocked) return;
      running = true; obstacles = []; floatingTexts = []; frameCount = 0; combo = 0; speed = 3;
      skaterY = GROUND_Y - SKATER_H; skaterVY = 0; onGround = true; grinding = false;
      startBtn.disabled = true; startBtn.textContent = 'JOGANDO...';
      back.querySelector('#pus-skate-victory').classList.remove('active');
      if (scoreEl) scoreEl.textContent = score + ' / ' + WIN_SCORE;
      trackEvent('play', popup.id); gameLoop();
    }

    function showVictory() {
      back.querySelector('#pus-skate-final').textContent = score;
      back.querySelector('#pus-skate-coupon').textContent = prize;
      back.querySelector('#pus-skate-victory').classList.add('active');
      startBtn.disabled = false; startBtn.textContent = 'JOGAR DE NOVO';
    }

    function closePopup() {
      trackEvent('close', popup.id); running = false;
      if (animId) cancelAnimationFrame(animId);
      back.classList.remove('open');
      setTimeout(function () { back.remove(); }, 250);
      try { localStorage.setItem('pus_shown_' + popup.id, String(Date.now())); } catch (e) {}
    }

    back.querySelector('.pus-skate-close').addEventListener('click', closePopup);
    back.addEventListener('click', function (e) { if (e.target === back) closePopup(); });

    back.querySelector('.pus-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var nameEl = back.querySelector('#pus-gen-name');
      var emailEl = back.querySelector('#pus-gen-email');
      var phoneEl = back.querySelector('#pus-gen-phone');
      var nm = nameEl ? nameEl.value.trim() : '';
      var email = emailEl ? emailEl.value.trim() : '';
      var phone = phoneEl ? phoneEl.value.trim() : '';
      var hasErr = false;

      if (nameEl) { clearFieldError(nameEl); if (!nm) { showFieldError(nameEl, 'Por favor, insira seu nome.'); hasErr = true; } }
      if (emailEl) { clearEmailError(emailEl); clearFieldError(emailEl);
        if (!email) { showFieldError(emailEl, 'Por favor, insira seu e-mail.'); hasErr = true; }
        else if (!isValidEmailClient(email)) { showEmailError(emailEl, 'Por favor, use um e-mail válido.'); hasErr = true; }
      }
      if (phoneEl) { clearFieldError(phoneEl);
        if (!phone) { showFieldError(phoneEl, 'Por favor, insira seu telefone.'); hasErr = true; }
        else if (!isValidPhoneClient(phone)) { showFieldError(phoneEl, 'Telefone inválido. Use DDD + número.'); hasErr = true; }
      }
      if (hasErr) return;

      submitLead(popup.id, { email: email, name: nm, phone: phone, prize: prize });
      trackEvent('register', popup.id);
      unlocked = true; lockEl.style.display = 'none'; startBtn.disabled = false;
    });

    startBtn.addEventListener('click', function () { if (running) return; startRun(); });

    document.addEventListener('keydown', function (e) {
      if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); if (!running) return; jump(); }
    });

    canvas.addEventListener('click', function () { if (running) jump(); });
    canvas.addEventListener('touchstart', function (e) { e.preventDefault(); if (running) jump(); });

    var copyBtn = back.querySelector('#pus-skate-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        try {
          navigator.clipboard.writeText(prize);
          copyBtn.textContent = 'COPIADO!';
          setTimeout(function () { copyBtn.textContent = 'COPIAR CUPOM'; }, 2000);
        } catch (err) {
          var inp = document.createElement('input'); inp.value = prize;
          document.body.appendChild(inp); inp.select(); document.execCommand('copy');
          document.body.removeChild(inp);
          copyBtn.textContent = 'COPIADO!';
          setTimeout(function () { copyBtn.textContent = 'COPIAR CUPOM'; }, 2000);
        }
      });
    }

    drawFrame();
  }

  // GENERIC POPUP — Email capture simples
  // ═══════════════════════════════════════════════════════════
  function showGenericPopup(popup) {
    var cfg = popup.config || {};
    var title    = cfg.title    || 'Ganhe um cupom!';
    var subtitle = cfg.description || cfg.subtitle || 'Deixe seu e-mail para jogar.';
    var btn      = cfg.button_text || cfg.btn_text || 'Jogar agora';
    var prize    = cfg.prize    || '10% OFF';

    // Inject generic CSS
    if (!document.getElementById('pus-generic-css')) {
      var css = document.createElement('style');
      css.id = 'pus-generic-css';
      css.textContent = '\
.pus-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:999998;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .25s ease}\
.pus-backdrop.open{opacity:1}\
.pus-modal{background:#fff;border-radius:14px;max-width:420px;width:92%;padding:26px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.35);transform:translateY(10px) scale(.98);transition:transform .25s ease}\
.pus-backdrop.open .pus-modal{transform:translateY(0) scale(1)}\
.pus-close{position:absolute;top:10px;right:12px;background:transparent;border:0;font-size:22px;cursor:pointer;color:#888}\
.pus-title{font-size:22px;font-weight:700;margin:0 0 6px;color:#111}\
.pus-sub{font-size:14px;color:#555;margin:0 0 16px}\
.pus-input{width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;font-size:14px;margin-bottom:10px;box-sizing:border-box}\
.pus-btn{width:100%;padding:13px;border-radius:8px;border:0;background:#111;color:#fff;font-weight:600;cursor:pointer;font-size:15px}\
.pus-btn:hover{opacity:.9}\
.pus-result{text-align:center;padding:20px 0}\
.pus-prize{font-size:24px;font-weight:800;color:#d97706;margin:8px 0}\
.pus-coupon{display:inline-block;padding:8px 14px;background:#fef3c7;border:2px dashed #d97706;border-radius:6px;font-family:monospace;font-weight:700;color:#92400e;margin:10px 0}\
';
      document.documentElement.appendChild(css);
    }

    var back = document.createElement('div');
    back.className = 'pus-backdrop';
    back.innerHTML =
      '<div class="pus-modal" role="dialog" aria-modal="true">' +
        '<button class="pus-close" aria-label="Fechar">×</button>' +
        '<h3 class="pus-title">' + esc(title) + '</h3>' +
        '<p class="pus-sub">' + esc(subtitle) + '</p>' +
        '<form class="pus-form">' +
      '<input class="pus-input" type="text" placeholder="Seu nome *" id="pus-gen-name" required>' +
      '<input class="pus-input" type="email" placeholder="Seu e-mail *" id="pus-gen-email" required>' +
      '<input class="pus-input" type="tel" placeholder="Seu telefone *" id="pus-gen-phone" required>' +
      '<button type="submit" class="pus-btn">' + esc(btn) + '</button>' +
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
      var nameEl = back.querySelector('#pus-gen-name');
      var emailEl = back.querySelector('#pus-gen-email');
      var phoneEl = back.querySelector('#pus-gen-phone');
      var nm = nameEl ? nameEl.value.trim() : '';
      var email = emailEl ? emailEl.value.trim() : '';
      var phone = phoneEl ? phoneEl.value.trim() : '';
      var hasErr = false;

      // Validate name
      if (nameEl) { clearFieldError(nameEl); if (!nm) { showFieldError(nameEl, 'Por favor, insira seu nome.'); hasErr = true; } }

      // Validate email
      if (emailEl) { clearEmailError(emailEl); clearFieldError(emailEl);
        if (!email) { showFieldError(emailEl, 'Por favor, insira seu e-mail.'); hasErr = true; }
        else if (!isValidEmailClient(email)) { showEmailError(emailEl, 'Por favor, use um e-mail v\u00e1lido.'); hasErr = true; }
      }

      // Validate phone
      if (phoneEl) { clearFieldError(phoneEl); if (!phone) { showFieldError(phoneEl, 'Por favor, insira seu telefone.'); hasErr = true; }
        else if (!isValidPhoneClient(phone)) { showFieldError(phoneEl, 'Telefone inv\u00e1lido. Use DDD + n\u00famero.'); hasErr = true; }
      }

      if (hasErr) return;

      trackEvent('play', popup.id);
      submitLead(popup.id, { email: email, name: nm, phone: phone, prize: prize });
      trackEvent('win', popup.id, { prize: prize });
      back.querySelector('.pus-modal').innerHTML =
        '<button class="pus-close" aria-label="Fechar">\u00d7</button>' +
        '<div class="pus-result">' +
          '<div style="font-size:40px">\ud83c\udf89</div>' +
          '<div class="pus-prize">' + esc(prize) + '</div>' +
          '<p>Use o cupom:</p>' +
          '<div class="pus-coupon">' + esc(prize) + '</div>' +
          '<p style="font-size:12px;color:#666">Enviamos tamb\u00e9m para seu e-mail.</p>' +
        '</div>';
      back.querySelector('.pus-close').addEventListener('click', close);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // BOOT — Fetch config and route to correct popup renderer
  // ═══════════════════════════════════════════════════════════
  function boot() {
    xhr('GET', API + '/api/public/config?store_id=' + encodeURIComponent(storeId), null, function (err, data) {
      if (err || !data || !Array.isArray(data.popups) || data.popups.length === 0) return;
      var list = data.popups.filter(shouldShow);
      if (!list.length) return;

      var popup = list[0];
      setTimeout(function () {
        if (popup.game_type === 'slot_machine') {
          showSlotMachinePopup(popup);
        } else if (popup.game_type === 'skate_grind') {
          showSkateGrindPopup(popup);
        } else {
          showGenericPopup(popup);
        }
      }, 1500);
    });
  }

  boot();
})();
