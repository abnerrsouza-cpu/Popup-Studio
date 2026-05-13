/*!
 * PopUp Studio - Loader v3.0
 * Este script Ã© injetado automaticamente nas lojas Nuvemshop que instalaram o app.
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
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  // ---- ValidaÃ§Ã£o de e-mail rigorosa (client-side) ----
  var VALID_EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  var DISPOSABLE_DOMAINS = [
    'mailinator.com','guerrillamail.com','tempmail.com','throwaway.email','temp-mail.org',
    'fakeinbox.com','sharklasers.com','yopmail.com','yopmail.fr','trashmail.com',
    'trashmail.me','trashmail.net','10minutemail.com','discard.email','discardmail.com',
    'emailondeck.com','maildrop.cc','mailnesia.com','getnada.com','mohmal.com',
    'mailsac.com','mailcatch.com','spamgourmet.com','mytemp.email','tempinbox.com',
    'tempmailaddress.com','emailfake.com','crazymailing.com','armyspy.com','dayrep.com',
    'einrot.com','fleckens.hu','gustr.com','jourrapide.com','rhyta.com','superrito.com',
    'teleworm.us','fidamul.com','aosod.com','cool.fr.nf','grr.la','guerrillamailblock.com'
  ];
  function isValidEmailClient(email) {
    if (!email || typeof email !== 'string') return false;
    var e = email.trim().toLowerCase();
    if (e.length > 254 || e.length < 5) return false;
    if (!VALID_EMAIL_RE.test(e)) return false;
    var domain = e.split('@')[1];
    if (!domain || !domain.includes('.')) return false;
    for (var i = 0; i < DISPOSABLE_DOMAINS.length; i++) {
      if (domain === DISPOSABLE_DOMAINS[i]) return false;
    }
    return true;
  }
  function showEmailError(inputEl, msg) {
    inputEl.style.borderColor = '#ef4444';
    var existing = inputEl.parentNode.querySelector('.pus-email-error');
    if (existing) existing.remove();
    var errDiv = document.createElement('div');
    errDiv.className = 'pus-email-error';
    errDiv.style.cssText = 'color:#ef4444;font-size:11px;margin-top:3px;text-align:left;';
    errDiv.textContent = msg;
    inputEl.parentNode.insertBefore(errDiv, inputEl.nextSibling);
  }
  function clearEmailError(inputEl) {
    inputEl.style.borderColor = '';
    var existing = inputEl.parentNode.querySelector('.pus-email-error');
    if (existing) existing.remove();
  }

  // ---- Regras de exibiÃ§Ã£o (cooldown 24h por pop-up) ----
  function shouldShow(popup) {
    try {
      var last = parseInt(localStorage.getItem('pus_shown_' + popup.id) || '0', 10);
      if (last && Date.now() - last < 24 * 3600 * 1000) return false;
    } catch (e) {}
    return true;
  }

  // âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  // SLOT MACHINE POPUP â IdÃªntico ao editor do Pop Up Studio
  // âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  function showSlotMachinePopup(popup) {
    var cfg = popup.config || {};
    var emoji1     = cfg.slot_emoji1 || 'ð';
    var emoji2     = cfg.slot_emoji2 || 'ð§¢';
    var emoji3     = cfg.slot_emoji3 || 'ð';
    var emojis     = [emoji1, emoji2, emoji3];
    var winEmoji   = emoji3;
    var title      = cfg.title || 'ð JOGUE E GANHE UM DESCONTO EXCLUSIVO!';
    var subtitle   = cfg.description || 'Cadastre seu e-mail e jogue para ganhar um cupom especial!';
    var machTitle  = cfg.slot_machine_title || 'JACKPOT!';
    var btnColor   = cfg.button_color || '#52b788';
    var btnText    = cfg.button_text || 'Quero jogar!';
    var bgColor    = cfg.background_color || '#0a1f14';
    var textColor  = cfg.text_color || '#ffffff';
    var prize      = cfg.prize || 'DESCONTO10';
    var loseText   = cfg.slot_lose_text || 'Que pena! Tente novamente...';
    var winText    = cfg.slot_win_text || 'ð PARABÃNS! VocÃª ganhou!';
    var headerEmoji = cfg.emoji || 'ð';

    var slotAttempt = 0;
    var slotSpinning = false;

    // ââ Inject CSS ââ
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
.pus-slot-coupon-banner::before,.pus-slot-coupon-banner::after{content:"â";font-size:6px;opacity:.6}\
.pus-slot-lock-overlay{position:relative;display:flex;flex-direction:column;align-items:center;z-index:20;background:linear-gradient(180deg,rgba(0,0,0,.4) 0%,rgba(0,0,0,.7) 100%);padding:12px 14px 14px;transition:opacity .5s ease,max-height .5s ease;overflow:hidden}\
.pus-slot-lock-overlay.hidden{opacity:0;max-height:0;padding:0 16px;pointer-events:none}\
.pus-slot-lock-subtitle{font-size:10px;color:rgba(255,255,255,.6);text-align:center;margin-bottom:10px;display:flex;align-items:center;gap:6px}\
.pus-slot-lock-subtitle::before{content:"ð";font-size:11px}\
.pus-slot-lock-form{display:flex;flex-direction:column;gap:8px;width:100%;max-width:260px}\
.pus-slot-lock-input-wrap{position:relative;display:flex;align-items:center}\
.pus-slot-lock-input-icon{position:absolute;left:12px;font-size:14px;color:rgba(255,255,255,.35);pointer-events:none;z-index:2}\
.pus-slot-lock-input{width:100%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:10px 12px 10px 36px;color:#fff;font-size:13px;outline:none;text-align:left;transition:border-color .2s,background .2s;box-sizing:border-box}\
.pus-slot-lock-input::placeholder{color:rgba(255,255,255,.35)}\
.pus-slot-lock-input:focus{border-color:#22c55e;background:rgba(255,255,255,.12)}\
.pus-slot-lock-btn{background:linear-gradient(180deg,#22c55e,#16a34a);color:#fff;border:2px solid #16a34a;border-radius:10px;padding:11px;font-size:13px;font-weight:900;cursor:pointer;text-transform:uppercase;letter-spacing:2px;box-shadow:0 4px 20px rgba(34,197,94,.35),inset 0 1px 0 rgba(255,255,255,.15);transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px}\
.pus-slot-lock-btn:hover{transform:translateY(-2px);box-shadow:0 6px 25px rgba(34,197,94,.45)}\
.pus-slot-lock-btn::after{content:"â";font-size:16px;font-weight:400}\
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

    // ââ Build HTML ââ
    var back = document.createElement('div');
    back.className = 'pus-slot-backdrop';
    back.innerHTML =
      '<div class="pus-slot-popup" style="background:' + esc(bgColor) + ';color:' + esc(textColor) + ';">' +
        '<button class="pus-slot-close" aria-label="Fechar">â</button>' +
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
                '<div class="pus-slot-payline-arrow pus-slot-payline-left">â¶</div>' +
                '<div class="pus-slot-payline-arrow pus-slot-payline-right">â</div>' +
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
                '<button class="pus-slot-play-btn" id="pus-slot-play-btn">ð° JOGAR</button>' +
              '</div>' +
            '</div>' +
            // Coupon Banner
            '<div class="pus-slot-coupon-banner">ð CUPOM SURPRESA DE DESCONTO</div>' +
            // Lock Overlay (registration form)
            '<div class="pus-slot-lock-overlay" id="pus-slot-lock">' +
              '<div class="pus-slot-lock-form">' +
                '<div class="pus-slot-lock-input-wrap">' +
                  '<span class="pus-slot-lock-input-icon">ð¤</span>' +
                  '<input class="pus-slot-lock-input" id="pus-slot-name" placeholder="Seu nome" type="text">' +
                '</div>' +
                '<div class="pus-slot-lock-input-wrap">' +
                  '<span class="pus-slot-lock-input-icon">âï¸</span>' +
                  '<input class="pus-slot-lock-input" id="pus-slot-email" placeholder="Seu e-mail *" type="email" required>' +
                '</div>' +
                '<div class="pus-slot-lock-input-wrap">' +
                  '<span class="pus-slot-lock-input-icon">ð</span>' +
                  '<input class="pus-slot-lock-input" id="pus-slot-phone" placeholder="Seu telefone" type="tel">' +
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

    // ââ Close ââ
    function closePopup() {
      trackEvent('close', popup.id);
      back.classList.remove('open');
      setTimeout(function () { back.remove(); }, 300);
      try { localStorage.setItem('pus_shown_' + popup.id, String(Date.now())); } catch (e) {}
    }
    back.querySelector('.pus-slot-close').addEventListener('click', closePopup);
    back.addEventListener('click', function (e) { if (e.target === back) closePopup(); });

    // ââ Clear email error on input ââ
    back.querySelector('#pus-slot-email').addEventListener('input', function () {
      clearEmailError(this);
    });

    // ââ Unlock (registration) ââ
    unlockBtn.addEventListener('click', function () {
      var emailInput = back.querySelector('#pus-slot-email');
      var email = emailInput.value.trim();
      if (!email) {
        showEmailError(emailInput, 'Digite seu e-mail.');
        return;
      }
      if (!isValidEmailClient(email)) {
        showEmailError(emailInput, 'Digite um e-mail vÃ¡lido. Ex: nome@gmail.com');
        return;
      }
      clearEmailError(emailInput);
      var name  = back.querySelector('#pus-slot-name').value.trim();
      var phone = back.querySelector('#pus-slot-phone').value.trim();

      submitLead(popup.id, { email: email, name: name, phone: phone });
      trackEvent('register', popup.id, { email: email });

      // Unlock machine
      machine.classList.remove('pus-slot-locked');
ØÚÓÝ\^KÛ\ÜÓ\ÝY
	ÚY[ÊNÂ^P\ØXYH[ÙNÂJNÂËÈ8¥ 8¥ ^H
[]\ÈÜ[H8¥ 8¥ [Ý[Û[]\
HÂY
ÛÝÜ[[ÈÛÝ][\HÊH]\ÂÛÝÜ[[ÈHYNÂÛÝ][\
ÊÎÂ^P\ØXYHYNÂ^P^ÛÛ[H	ø£ìÈÒTSËÎÂ][^ÛÛ[H	Õ[]]H	È
ÈÛÝ][\
È	ÈHÉÎÂXÚÑ][
	Ü^IËÜ\YÈ][\ÛÝ][\JNÂËÈ]\[[X][ÛY
]\H]\Û\ÜÓ\ÝY
	Ü[Y	ÊNÂÙ][Y[Ý]
[Ý[Û

HÈY
]\H]\Û\ÜÓ\Ý[[ÝJ	Ü[Y	ÊNÈK

NÂËÈÝ\Ü[[È[HÙ[ÂÜ
\ØÈHNÈØÈHÎÈØÊÊÊHÂÜ
\HNÈHÎÈÊÊHÂ\Ù[HÙ]Ù[
ØËNÂY
Ù[
HÙ[Û\ÜÓ\ÝY
	ÜÜ[[ÉÊNÂBB\Ü[[\[HÙ][\[
[Ý[Û

HÂÜ
\ØÈHNÈØÈHÎÈØÊÊÊHÂÜ
\HNÈHÎÈÊÊHÂ\Ù[HÙ]Ù[
ØËNÂY
Ù[	Ù[Û\ÜÓ\ÝÛÛZ[Ê	ÜÜ[[ÉÊJHÂÙ[^ÛÛ[H[[Ú\ÖÓX]ÛÜX][ÛJ
H
[[Ú\Ë[Ý
WNÂBBBK
NÂ\\ÕÚ[HÛÝ][\OOHÎÂËÈÝÜÛÛ[[HY\\ÂÙ][Y[Ý]
[Ý[Û

HÂÜ
\HNÈHÎÈÊÊHÂ\Ù[HÙ]Ù[
KNÂY
Ù[
HÂÙ[Û\ÜÓ\Ý[[ÝJ	ÜÜ[[ÉÊNÂÙ[^ÛÛ[H
OOH	\ÕÚ[HÈÚ[[[ÚH
OOHÈ[[Ú\ÖÓX]ÛÜX][ÛJ
H
WH[[Ú\ÖÓX]ÛÜX][ÛJ
H
[[Ú\Ë[Ý
WJNÂBBK
NÂËÈÝÜÛÛ[[Y\M\ÂÙ][Y[Ý]
[Ý[Û

HÂÜ
\HNÈHÎÈÊÊHÂ\Ù[HÙ]Ù[
NÂY
Ù[
HÂÙ[Û\ÜÓ\Ý[[ÝJ	ÜÜ[[ÉÊNÂÙ[^ÛÛ[H
OOH	\ÕÚ[HÈÚ[[[ÚH[[Ú\ÖÓX]ÛÜX][ÛJ
H
[[Ú\Ë[Ý
WNÂBBKM
NÂËÈÝÜÛÛ[[ÈY\\È8 %\ÛÛHÚ[ÛÜÜÂÙ][Y[Ý]
[Ý[Û

HÂÛX\[\[
Ü[[\[
NÂÜ
\HNÈHÎÈÊÊHÂ\Ù[HÙ]Ù[
ËNÂY
Ù[
HÂÙ[Û\ÜÓ\Ý[[ÝJ	ÜÜ[[ÉÊNÂY
OOHHÂY
\ÕÚ[HÂÙ[^ÛÛ[HÚ[[[ÚNÂH[ÙHÂËÈ[Ý\H^[[HÙ\ÈÕX]Ú
ÜÙHÜÜÊB\HHÙ]Ù[
KK^ÛÛ[Â\HÙ]Ù[
K^ÛÛ[ÂY
HOOHHÂÙ[^ÛÛ[H[[Ú\Ë[\[Ý[Û
JHÈ]\HOOHNÈJVÌH[[Ú\ÖÌNÂH[ÙHÂÙ[^ÛÛ[H[[Ú\ÖÓX]ÛÜX][ÛJ
H
[[Ú\Ë[Ý
WNÂBBH[ÙHÂÙ[^ÛÛ[H[[Ú\ÖÓX]ÛÜX][ÛJ
H
[[Ú\Ë[Ý
WNÂBBBÛÝÜ[[ÈH[ÙNÂY
\ÕÚ[HÂËÈÚ[\HYÚYÚ^[[HÙ[ÂÜ
\ØÈHNÈØÈHÎÈØÊÊÊHÂÙ]Ù[
ØËKÛ\ÜÓ\ÝY
	ÝÚ[\ÊNÂB^P^ÛÛ[H	ü'ã¢HPÒÔÕIÎÂ^P\ØXYHYNÂXÚÑ][
	ÝÚ[ËÜ\YÈ^N^HJNÂÙ][Y[Ý]
[Ý[Û

HÈÚÝÕXÝÜJ
NÈK
NÂH[ÙHÂ^P\ØXYH[ÙNÂ^P^ÛÛ[H	ü'ã¬ÑÐT
	È
È
ÈHÛÝ][\
H
È	ÊIÎÂXÚÑ][
	ÛÜÙIËÜ\YÈ][\ÛÝ][\JNÂBK
NÂB^PY][\Ý[\	ØÛXÚÉË[]\NÂ]\Y][\Ý[\	ØÛXÚÉË[]\NÂËÈ8¥ 8¥ XÝÜHÝ\^HÚ]ÛÛ]H8¥ 8¥ [Ý[ÛÚÝÕXÝÜJ
HÂ\ÛÛÜÈHÉÈÙXÍË	ÈÙMÍÌØÉË	ÈÌÍNË	ÈÌXØÍÌIË	ÈÎXNXË	ÈÙMÙLË	ÈÌXXÎXÉË	ÈÙXÍNI×NÂÜ
\HHÈH
ÈJÊÊHÂ\ÛÛHØÝ[Y[ÜX]Q[[Y[
	Ù]ÊNÂÛÛÛ\ÜÓ[YHH	Ü\Ë\ÛÝXÛÛ]IÎÂÛÛÝ[KYHX][ÛJ
H
L
È	ÉIÎÂÛÛÝ[KÜH	ËLL	ÎÂÛÛÝ[KXÚÙÜÝ[HÛÛÜÖÓX]ÛÜX][ÛJ
H
ÛÛÜË[Ý
WNÂÛÛÝ[K[[X][Û[^HH
X][ÛJ
H

H
È	ÜÉÎÂÛÛÝ[K[[X][Û\][ÛH
H
ÈX][ÛJ
H
JH
È	ÜÉÎÂÛÛÝ[KÚYH


ÈX][ÛJ
H

H
È	Ü	ÎÂÛÛÝ[KZYÚH


ÈX][ÛJ
H

H
È	Ü	ÎÂXXÚ[K\[Ú[
ÛÛNÂB\XÝÜHHØÝ[Y[ÜX]Q[[Y[
	Ù]ÊNÂXÝÜKÛ\ÜÓ[YHH	Ü\Ë\ÛÝ]XÝÜIÎÂXÝÜK[\SB	Ï]Û\ÜÏH\Ë\ÛÝ]XÝÜKY[[ÚHÈ
ÈÚ[[[ÚH
È	ÏÙ]È
Â	Ï]Û\ÜÏH\Ë\ÛÝ]XÝÜK]^PÒÔÕOÙ]È
Â	Ï]Û\ÜÏH\Ë\ÛÝ]XÝÜK\ÝXÙ]HÝ\ÛHH\ØÛÛÎÙ]È
Â	Ï]Û\ÜÏH\Ë\ÛÝXÛÝ\ÛXÞYH\ËXÛÝ\ÛXÛÙHÈ
È\ØÊ^JH
È	ÏÙ]È
Â	Ï]ÛÛ\ÜÏH\Ë\ÛÝ\^KX\Ë\ÛÝXÛÜKXÝ[OHX\Ú[]ÜLÝÚY]]ÎÜY[ÎLÙÛ\Ú^NLÛ]\\ÜXÚ[Î\ÈYH\ËXÛÜKXÈ
Â	ü'ã¢HTÐTQUHÕTÓHQÓÔOØ]ÛÈ
Â	Ï]YH\ËXÛÜKYYYXÚÈÝ[OHÜXÚ]NÙÛ\Ú^NL\ØÛÛÜÌÍMYNÛX\Ú[]ÜÝ[Ú][ÛÜXÚ]HÜÎÈ¸§!HÝ\ÛHÛÜXYÈHÛÛHÈÚXÚÛÝ]Ù]ÎÂXXÚ[K\[Ú[
XÝÜJNÂËÈÛÜHÛÝ\ÛXÝÜK]Y\TÙ[XÝÜ	ÈÜ\ËXÛÜKXÊKY][\Ý[\	ØÛXÚÉË[Ý[Û

HÂHÂY
]YØ]ÜÛ\Ø\
HÂ]YØ]ÜÛ\Ø\Ü]U^
^JNÂH[ÙHÂ\HHØÝ[Y[ÜX]Q[[Y[
	Ý^\XIÊNÂK[YHH^NÂØÝ[Y[ÙK\[Ú[
JNÂKÙ[XÝ

NÂØÝ[Y[^XÐÛÛ[X[
	ØÛÜIÊNÂØÝ[Y[ÙK[[ÝPÚ[
JNÂB\HXÝÜK]Y\TÙ[XÝÜ	ÈÜ\ËXÛÜKYYYXÚÉÊNÂÝ[KÜXÚ]HH	ÌIÎÂÙ][Y[Ý]
[Ý[Û

HÈÝ[KÜXÚ]HH	Ì	ÎÈKÌ
NÂHØ]Ú
JHßBJNÂBBËÈ8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥dËÈÑSTPÈÔT8 %[XZ[Ø\\HÚ[\\ÂËÈ8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d[Ý[ÛÚÝÑÙ[\XÔÜ\
Ü\
HÂ\ÙÈHÜ\ÛÛYÈßNÂ\]HHÙË]H	ÑØ[H[HÝ\ÛHIÎÂ\ÝX]HHÙË\ØÜ\[ÛÙËÝX]H	ÑZ^HÙ]HK[XZ[\HÙØ\ÎÂ\HÙË]ÛÝ^ÙËÝ^	ÒÙØ\YÛÜIÎÂ\^HHÙË^H	ÌL	HÑÎÂËÈ[XÝÙ[\XÈÔÔÂY
YØÝ[Y[Ù][[Y[RY
	Ü\ËYÙ[\XËXÜÜÉÊJHÂ\ÜÜÈHØÝ[Y[ÜX]Q[[Y[
	ÜÝ[IÊNÂÜÜËYH	Ü\ËYÙ[\XËXÜÜÉÎÂÜÜË^ÛÛ[H	×\ËXXÚÙÜÜÜÚ][Û^YÚ[Ù]ØXÚÙÜÝ[ØJNÞZ[^NNNNNÙ\Ü^N^Ø[YÛZ][\ÎÙ[\Ú\ÝYKXÛÛ[Ù[\ÛÜXÚ]NÝ[Ú][ÛÜXÚ]H\ÈX\Ù_W\ËXXÚÙÜÜ[ÛÜXÚ]N_W\Ë[[Ù[ØXÚÙÜÝ[ÙØÜ\\Y]\ÎMÛX^]ÚYÝÚYLNÜY[ÎÜÜÚ][Û[]]NØÞ\ÚYÝÎ
ØJÍJNÝ[ÙÜN[Û]VJL
HØØ[JN
NÝ[Ú][Û[ÙÜH\ÈX\Ù_W\ËXXÚÙÜÜ[\Ë[[Ù[Ý[ÙÜN[Û]VJ
HØØ[JJ_W\ËXÛÜÙ^ÜÜÚ][ÛXÛÛ]NÝÜLÜYÚLØXÚÙÜÝ[[Ü\[ØÜ\ÙÛ\Ú^NØÝ\ÛÜÚ[\ØÛÛÜÎW\Ë]]^ÙÛ\Ú^NÙÛ]ÙZYÚÌÛX\Ú[
ØÛÛÜÌLL_W\Ë\ÝXÙÛ\Ú^NMØÛÛÜÍMMNÛX\Ú[MW\ËZ[]ÝÚYL	NÜY[ÎLØÜ\\ÛÛYÙØÜ\\Y]\ÎÙÛ\Ú^NMÛX\Ú[XÝÛNLØÞ\Ú^[ÎÜ\XÞW\ËXÝÚYL	NÜY[ÎLÜØÜ\\Y]\ÎØÜ\ØXÚÙÜÝ[ÌLLNØÛÛÜÙÙÛ]ÙZYÚØÝ\ÛÜÚ[\ÙÛ\Ú^NM\W\ËXÝ\ÛÜXÚ]N_W\Ë\\Ý[Ý^X[YÛÙ[\ÜY[ÎW\Ë\^^ÙÛ\Ú^NÙÛ]ÙZYÚØÛÛÜÙMÍÌ
ÛX\Ú[W\ËXÛÝ\ÛÙ\Ü^N[[KXØÚÎÜY[ÎMØXÚÙÜÝ[ÙYØÍÎØÜ\\ÚYÙMÍÌ
ØÜ\\Y]\ÎÙÛY[Z[N[ÛÜÜXÙNÙÛ]ÙZYÚÌØÛÛÜÎLNÛX\Ú[LWÎÂØÝ[Y[ØÝ[Y[[[Y[\[Ú[
ÜÜÊNÂB\XÚÈHØÝ[Y[ÜX]Q[[Y[
	Ù]ÊNÂXÚËÛ\ÜÓ[YHH	Ü\ËXXÚÙÜ	ÎÂXÚË[\SB	Ï]Û\ÜÏH\Ë[[Ù[ÛOHX[ÙÈ\XK[[Ù[HYHÈ
Â	Ï]ÛÛ\ÜÏH\ËXÛÜÙH\XK[X[HXÚ\°åÏØ]ÛÈ
Â	ÏÈÛ\ÜÏH\Ë]]HÈ
È\ØÊ]JH
È	ÏÚÏÈ
Â	ÏÛ\ÜÏH\Ë\ÝXÈ
È\ØÊÝX]JH
È	ÏÜÈ
Â	ÏÜHÛ\ÜÏH\ËYÜHÈ
Â	Ï[]Û\ÜÏH\ËZ[]\OH[XZ[XÙZÛ\HÙ]P[XZ[ÛÛH\]Z\YÈ
Â	Ï]Û\OHÝXZ]Û\ÜÏH\ËXÈ
È\ØÊH
È	ÏØ]ÛÈ
Â	ÏÙÜOÈ
Â	ÏÙ]ÎÂØÝ[Y[ÙK\[Ú[
XÚÊNÂ\]Y\Ý[[X][Û[YJ[Ý[Û

HÈXÚËÛ\ÜÓ\ÝY
	ÛÜ[ÊNÈJNÂXÚÑ][
	Ú[\\ÜÚ[ÛËÜ\Y
NÂ[Ý[ÛÛÜÙJ
HÂXÚÑ][
	ØÛÜÙIËÜ\Y
NÂXÚËÛ\ÜÓ\Ý[[ÝJ	ÛÜ[ÊNÂÙ][Y[Ý]
[Ý[Û

HÈXÚË[[ÝJ
NÈKL
NÂHÈØØ[ÝÜYÙKÙ]][J	Ü\×ÜÚÝÛÉÈ
ÈÜ\YÝ[Ê]KÝÊ
JJNÈHØ]Ú
JHßBBXÚË]Y\TÙ[XÝÜ	Ë\ËXÛÜÙIÊKY][\Ý[\	ØÛXÚÉËÛÜÙJNÂXÚËY][\Ý[\	ØÛXÚÉË[Ý[Û
JHÈY
K\Ù]OOHXÚÊHÛÜÙJ
NÈJNÂXÚË]Y\TÙ[XÝÜ	Ë\ËYÜIÊKY][\Ý[\	ÜÝXZ]	Ë[Ý[Û
JHÂK][Y][

NÂ\[XZ[[]HXÚË]Y\TÙ[XÝÜ	Ú[]Ý\OY[XZ[IÊNÂ\[XZ[H[XZ[[][YK[J
NÂY
Y[XZ[
HÈÚÝÑ[XZ[\Ü[XZ[[]	ÑYÚ]HÙ]HK[XZ[ÊNÈ]\ÈBY
Z\Õ[Y[XZ[ÛY[
[XZ[
JHÈÚÝÑ[XZ[\Ü[XZ[[]	ÑYÚ]H[HK[XZ[°è[YË^ÛYPÛXZ[ÛÛIÊNÈ]\ÈBÛX\[XZ[\Ü[XZ[[]
NÂXÚÑ][
	Ü^IËÜ\Y
NÂÝXZ]XY
Ü\YÈ[XZ[[XZ[^N^HJNÂXÚÑ][
	ÝÚ[ËÜ\YÈ^N^HJNÂXÚË]Y\TÙ[XÝÜ	Ë\Ë[[Ù[	ÊK[\SB	Ï]ÛÛ\ÜÏH\ËXÛÜÙH\XK[X[HXÚ\°åÏØ]ÛÈ
Â	Ï]Û\ÜÏH\Ë\\Ý[È
Â	Ï]Ý[OHÛ\Ú^N¼'ã¢OÙ]È
Â	Ï]Û\ÜÏH\Ë\^HÈ
È\ØÊ^JH
È	ÏÙ]È
Â	Ï\ÙHÈÝ\ÛNÜÈ
Â	Ï]Û\ÜÏH\ËXÛÝ\ÛÈ
È\ØÊ^JH
È	ÏÙ]È
Â	ÏÝ[OHÛ\Ú^NLØÛÛÜÍ[X[[ÜÈ[X°ê[H\HÙ]HK[XZ[ÜÈ
Â	ÏÙ]ÎÂXÚË]Y\TÙ[XÝÜ	Ë\ËXÛÜÙIÊKY][\Ý[\	ØÛXÚÉËÛÜÙJNÂJNÂBËÈ8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥dËÈÓÕ8 %]ÚÛÛYÈ[Ý]HÈÛÜXÝÜ\[\\ËÈ8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d8¥d[Ý[ÛÛÝ

HÂ	ÑÑU	ËTH
È	ËØ\KÜXXËØÛÛYÏÜÝÜWÚYIÈ
È[ÛÙUTPÛÛ\Û[
ÝÜRY
K[[Ý[Û
\]JHÂY
\Y]HP\^K\Ð\^J]KÜ\ÊH]KÜ\Ë[ÝOOH
H]\Â\\ÝH]KÜ\Ë[\ÚÝ[ÚÝÊNÂY
[\Ý[Ý
H]\Â\Ü\H\ÝÌNÂÙ][Y[Ý]
[Ý[Û

HÂY
Ü\Ø[YWÝ\HOOH	ÜÛÝÛXXÚ[IÊHÂÚÝÔÛÝXXÚ[TÜ\
Ü\
NÂH[ÙHY
Ü\Ø[YWÝ\HOOH	ÜÚØ]WÙÜ[	ÊHÂËÈÑÎÚÝÔÚØ]TÜ\
Ü\
NÂÚÝÑÙ[\XÔÜ\
Ü\
NÂH[ÙHÂÚÝÑÙ[\XÔÜ\
Ü\
NÂBKML
NÂJNÂBÛÝ

NÂJJ
NÂ
