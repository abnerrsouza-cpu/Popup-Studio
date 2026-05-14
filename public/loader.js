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
                  '<input class="pus-slot-lock-input" id="pus-slot-name" placeholder="Seu nome" type="text">' +
                '</div>' +
                '<div class="pus-slot-lock-input-wrap">' +
                  '<span class="pus-slot-lock-input-icon">✉️</span>' +
                  '<input class="pus-slot-lock-input" id="pus-slot-email" placeholder="Seu e-mail *" type="email" required>' +
                '</div>' +
                '<div class="pus-slot-lock-input-wrap">' +
                  '<span class="pus-slot-lock-input-icon">📞</span>' +
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
      var email = back.querySelector('#pus-slot-email').value.trim();
      if (!email) {
        back.querySelector('#pus-slot-email').style.borderColor = '#ef4444';
        return;
      }
      var emailInputEl = back.querySelector("#pus-slot-email");
      if (!isValidEmailClient(email)) {
        showEmailError(emailInputEl, "Por favor, insira um e-mail v\u00e1lido.");
        return;
      }
      clearEmailError(emailInputEl);
      var name  = back.querySelector('#pus-slot-name').value.trim();
      var phone = back.querySelector('#pus-slot-phone').value.trim();

      submitLead(popup.id, { email: email, name: name, phone: phone });
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
          '<input class="pus-input" type="email" placeholder="seu@email.com" required>' +
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
      var email = back.querySelector('input[type=email]').value.trim();
      if (!email) return;
      var emailInput = form.querySelector('input[type=email]') || form.querySelector('.pus-input');
      if (emailInput) clearEmailError(emailInput);
      if (!isValidEmailClient(email)) {
        if (emailInput) showEmailError(emailInput, 'Por favor, use um e-mail v\u00e1lido.');
        return;
      }
      trackEvent('play', popup.id);
      if (!isValidEmailClient(email)) {
        var eInput = back.querySelector('input[type=email]') || back.querySelector('.pus-input-email');
        if (eInput) showEmailError(eInput, 'Por favor, use um e-mail v\u00e1lido.');
        return;
      }
      submitLead(popup.id, { email: email, prize: prize });
      trackEvent('win', popup.id, { prize: prize });
      back.querySelector('.pus-modal').innerHTML =
        '<button class="pus-close" aria-label="Fechar">×</button>' +
        '<div class="pus-result">' +
          '<div style="font-size:40px">🎉</div>' +
          '<div class="pus-prize">' + esc(prize) + '</div>' +
          '<p>Use o cupom:</p>' +
          '<div class="pus-coupon">' + esc(prize) + '</div>' +
          '<p style="font-size:12px;color:#666">Enviamos também para seu e-mail.</p>' +
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
          // TODO: showSkatePopup(popup);
          showGenericPopup(popup);
        } else {
          showGenericPopup(popup);
        }
      }, 1500);
    });
  }

  boot();
})();
