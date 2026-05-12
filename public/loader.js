(function() {
  "use strict";

  var API_BASE = "https://popup-studio.vercel.app";
  var STORAGE_KEY = "pus_shown_";
  var STORAGE_TTL = 86400000; // 24h

  /* Ã¢ÂÂÃ¢ÂÂ Helpers Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢Â ÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ */

  function getStoreId() {
    // Try LS object first (Nuvemshop global)
    if (typeof LS !== "undefined" && LS && LS.store && LS.store.id) {
      return String(LS.store.id);
    }
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute("src") || "";
      if (src.indexOf("popup-studio") !== -1 || src.indexOf("loader.js") !== -1 || src.indexOf("apps-scripts") !== -1) {
        var match = src.match(/[?&]store_id=([^&]+)/);
        if (match) return match[1];
        // Nuvemshop uses "store" param (without underscore)
        var match2 = src.match(/[?&]store=([^&]+)/);
        if (match2) return match2[1];
        var id = scripts[i].getAttribute("data-store-id");
        if (id) return id;
      }
    }
    return null;
  }

  function wasShownRecently(popupId) {
    try {
      var raw = localStorage.getItem(STORAGE_KEY + popupId);
      if (!raw) return false;
      var ts = parseInt(raw, 10);
      return (Date.now() - ts) < STORAGE_TTL;
    } catch (e) { return false; }
  }

  function markShown(popupId) {
    try { localStorage.setItem(STORAGE_KEY + popupId, String(Date.now())); } catch (e) {}
  }

  function trackEvent(popupId, eventType, data) {
    try {
      var body = { popup_id: popupId, event: eventType };
      if (data) { for (var k in data) { if (data.hasOwnProperty(k)) body[k] = data[k]; } }
      var xhr = new XMLHttpRequest();
      xhr.open("POST", API_BASE + "/api/public/event", true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify(body));
    } catch (e) {}
  }

  function submitLead(popupId, email, name, phone, prize, coupon, cb) {
    try {
      var body = { popup_id: popupId, email: email, name: name || "", phone: phone || "", prize: prize || "", coupon: coupon || "" };
      var xhr = new XMLHttpRequest();
      xhr.open("POST", API_BASE + "/api/public/lead", true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && cb) cb(xhr.status >= 200 && xhr.status < 300);
      };
      xhr.send(JSON.stringify(body));
    } catch (e) { if (cb) cb(false); }
  }

  function fetchConfig(storeId, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", API_BASE + "/api/public/config?store_id=" + encodeURIComponent(storeId), true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { cb(JSON.parse(xhr.responseText)); } catch (e) { cb(null); }
        } else { cb(null); }
      }
    };
    xhr.send();
  }

  /* Ã¢ÂÂÃ¢ÂÂ Inject CSS Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ */

  function injectStyles() {
    var style = document.createElement("style");
    style.id = "pus-styles";
    style.textContent = [
      /* Backdrop */
      ".pus-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;animation:pusFadeIn .25s ease}",
      "@keyframes pusFadeIn{from{opacity:0}to{opacity:1}}",
      "@keyframes pusSlideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}",

      /* Generic modal */
      ".pus-modal{background:#1a1a2e;border-radius:14px;max-width:340px;width:100%;padding:32px 24px;text-align:center;position:relative;animation:pusSlideUp .3s ease;box-shadow:0 12px 48px rgba(0,0,0,.6)}",
      ".pus-modal-close{position:absolute;top:12px;right:14px;background:none;border:none;color:#888;font-size:22px;cursor:pointer;line-height:1;padding:4px}",
      ".pus-modal-close:hover{color:#fff}",
      ".pus-modal-emoji{font-size:40px;margin-bottom:10px}",
      ".pus-modal-title{font-size:18px;font-weight:700;color:#fff;margin-bottom:6px}",
      ".pus-modal-desc{font-size:13px;color:#aaa;margin-bottom:18px;line-height:1.4}",
      ".pus-modal input[type=email],.pus-modal input[type=text],.pus-modal input[type=tel]{width:100%;padding:10px 12px;border-radius:8px;border:1px solid #333;background:#111;color:#fff;font-size:14px;margin-bottom:10px;box-sizing:border-box;outline:none}",
      ".pus-modal input:focus{border-color:#7c5cfc}",
      ".pus-modal-btn{width:100%;padding:12px;border-radius:8px;border:none;background:#7c5cfc;color:#fff;font-size:14px;font-weight:700;cursor:pointer;text-transform:uppercase;letter-spacing:1px}",
      ".pus-modal-btn:hover{background:#9b7fff}",
      ".pus-modal-btn:disabled{opacity:.5;cursor:not-allowed}",
      ".pus-coupon-box{background:#111;border:1px dashed #555;border-radius:8px;padding:14px;margin-top:16px}",
      ".pus-coupon-code{font-size:22px;font-weight:800;color:#fff;letter-spacing:3px;margin-bottom:6px}",
      ".pus-coupon-copy{background:#333;border:none;color:#fff;padding:6px 14px;border-radius:6px;font-size:12px;cursor:pointer;font-weight:600}",
      ".pus-coupon-copy:hover{background:#555}",

      /* Skate popup container */
      ".skate-popup{background:linear-gradient(180deg,#111 0%,#0a0a0a 100%);border-radius:14px;max-width:340px;width:100%;position:relative;animation:pusSlideUp .3s ease;box-shadow:0 12px 48px rgba(0,0,0,.6);overflow:hidden}",
      ".skate-popup-close{position:absolute;top:10px;right:12px;background:none;border:none;color:#666;font-size:20px;cursor:pointer;z-index:5;line-height:1;padding:4px}",
      ".skate-popup-close:hover{color:#fff}",

      /* Header */
      ".skate-popup-header{text-align:center;padding:22px 20px 14px}",
      ".skate-popup-header .emoji{font-size:36px;margin-bottom:6px;display:block}",
      ".skate-popup-header .title{font-size:18px;font-weight:800;color:#fff;letter-spacing:3px;text-transform:uppercase;margin-bottom:4px}",
      ".skate-popup-header .subtitle{font-size:12px;color:#888;line-height:1.3}",

      /* Canvas area */
      ".skate-canvas-wrap{width:310px;height:170px;margin:0 auto;background:#0a0a0a;border-radius:10px;position:relative;cursor:pointer;overflow:hidden}",
      ".skate-canvas-wrap canvas{display:block}",

      /* Score */
      ".skate-score{text-align:center;padding:8px 0 4px;font-size:14px;font-weight:700;color:#fff}",
      ".skate-instruction{text-align:center;font-size:11px;color:#666;padding:0 0 6px}",

      /* Start button */
      ".skate-start-btn{display:block;width:calc(100% - 40px);margin:6px auto 14px;padding:12px;border-radius:8px;border:none;background:#fff;color:#111;font-size:14px;font-weight:700;cursor:pointer;text-transform:uppercase;letter-spacing:1px}",
      ".skate-start-btn:hover{background:#ddd}",
      ".skate-start-btn:disabled{opacity:.4;cursor:not-allowed}",

      /* Lock section (below canvas, NOT overlay) */
      ".skate-lock-section{display:flex;flex-direction:column;align-items:center;padding:16px 24px 20px;border-top:1px solid #222}",
      ".skate-lock-section.hidden{display:none}",
      ".skate-lock-section .lock-icon{font-size:28px;margin-bottom:6px}",
      ".skate-lock-section .lock-title{font-size:13px;font-weight:600;color:#aaa;margin-bottom:12px;text-align:center}",
      ".skate-lock-section input{width:100%;max-width:280px;padding:11px 14px;border-radius:8px;border:1px solid #333;background:#0d0d0d;color:#fff;font-size:13px;margin-bottom:8px;box-sizing:border-box;outline:none}",
      ".skate-lock-section input::placeholder{color:#555}",
      ".skate-lock-section input:focus{border-color:#7c5cfc}",
      ".skate-lock-section .unlock-btn{width:100%;max-width:280px;padding:12px;border-radius:8px;border:2px solid #fff;background:transparent;color:#fff;font-size:14px;font-weight:700;cursor:pointer;text-transform:uppercase;letter-spacing:2px;margin-top:4px;transition:all .2s}",
      ".skate-lock-section .unlock-btn:hover{background:#fff;color:#111}",
      ".skate-lock-section .unlock-btn:disabled{opacity:.5;cursor:not-allowed}",

      /* Victory overlay */
      ".skate-victory{position:absolute;inset:0;background:rgba(0,0,0,.92);display:none;flex-direction:column;align-items:center;justify-content:center;z-index:12;padding:24px;border-radius:14px;text-align:center}",
      ".skate-victory.active{display:flex}",
      ".skate-victory .trophy{font-size:42px;margin-bottom:8px}",
      ".skate-victory .vtitle{font-size:18px;font-weight:800;color:#fff;letter-spacing:2px;margin-bottom:4px}",
      ".skate-victory .vscore{font-size:13px;color:#aaa;margin-bottom:14px}",
      ".skate-victory .vprize{font-size:15px;font-weight:700;color:#fff;margin-bottom:10px}",
      ".skate-victory .coupon-box{background:#111;border:1px dashed #555;border-radius:8px;padding:14px 20px;margin-bottom:12px}",
      ".skate-victory .coupon-code{font-size:22px;font-weight:800;color:#fff;letter-spacing:3px;margin-bottom:6px}",
      ".skate-victory .coupon-copy{background:#333;border:none;color:#fff;padding:6px 14px;border-radius:6px;font-size:12px;cursor:pointer;font-weight:600}",
      ".skate-victory .coupon-copy:hover{background:#555}",
      ".skate-victory .vplay-again{background:none;border:1px solid #444;color:#aaa;padding:8px 20px;border-radius:8px;font-size:12px;cursor:pointer;margin-top:4px}",
      ".skate-victory .vplay-again:hover{border-color:#888;color:#fff}",

      /* Slot Machine popup */
      ".slot-popup{background:linear-gradient(180deg,#0a1f14 0%,#071a0f 100%);border-radius:14px;max-width:360px;width:100%;position:relative;animation:pusSlideUp .3s ease;box-shadow:0 12px 48px rgba(0,0,0,.6);overflow:hidden}",
      ".slot-popup-close{position:absolute;top:10px;right:12px;background:none;border:none;color:#666;font-size:20px;cursor:pointer;z-index:5;line-height:1;padding:4px}",
      ".slot-popup-close:hover{color:#fff}",
      ".slot-popup-header{text-align:center;padding:22px 20px 14px}",
      ".slot-popup-header .emoji{font-size:36px;margin-bottom:6px;display:block}",
      ".slot-popup-header .title{font-size:16px;font-weight:800;color:#fff;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px}",
      ".slot-popup-header .subtitle{font-size:12px;color:#8aab9a;line-height:1.3}",

      /* Reels */
      ".slot-machine-wrap{background:#000;border-radius:12px;margin:0 20px 12px;padding:16px 12px;text-align:center}",
      ".slot-machine-title{font-size:20px;font-weight:900;color:#ffd700;letter-spacing:4px;margin-bottom:12px;text-shadow:0 0 12px rgba(255,215,0,.4)}",
      ".slot-reels{display:flex;justify-content:center;gap:8px;margin-bottom:14px}",
      ".slot-reel{width:72px;height:72px;background:#111;border-radius:10px;border:2px solid #333;display:flex;align-items:center;justify-content:center;font-size:40px;overflow:hidden;position:relative}",
      ".slot-reel.spinning .slot-reel-inner{animation:slotSpin .15s linear infinite}",
      "@keyframes slotSpin{0%{transform:translateY(0)}100%{transform:translateY(-100%)}}",
      ".slot-reel.win{border-color:#ffd700;box-shadow:0 0 12px rgba(255,215,0,.4)}",
      ".slot-spin-btn{width:100%;padding:12px;border-radius:8px;border:2px solid #52b788;background:transparent;color:#52b788;font-size:15px;font-weight:700;cursor:pointer;text-transform:uppercase;letter-spacing:2px;transition:all .2s}",
      ".slot-spin-btn:hover{background:#52b788;color:#fff}",
      ".slot-spin-btn:disabled{opacity:.4;cursor:not-allowed}",

      /* Slot form section */
      ".slot-form-section{display:flex;flex-direction:column;align-items:center;padding:16px 24px 20px;border-top:1px solid #1a3327}",
      ".slot-form-section.hidden{display:none}",
      ".slot-form-section .lock-icon{font-size:28px;margin-bottom:6px}",
      ".slot-form-section .lock-title{font-size:13px;font-weight:600;color:#8aab9a;margin-bottom:12px;text-align:center}",
      ".slot-form-section input{width:100%;max-width:280px;padding:11px 14px;border-radius:8px;border:1px solid #1a3327;background:#071a0f;color:#fff;font-size:13px;margin-bottom:8px;box-sizing:border-box;outline:none}",
      ".slot-form-section input::placeholder{color:#4a6a5a}",
      ".slot-form-section input:focus{border-color:#52b788}",
      ".slot-form-section .unlock-btn{width:100%;max-width:280px;padding:12px;border-radius:8px;border:2px solid #52b788;background:transparent;color:#52b788;font-size:14px;font-weight:700;cursor:pointer;text-transform:uppercase;letter-spacing:2px;margin-top:4px;transition:all .2s}",
      ".slot-form-section .unlock-btn:hover{background:#52b788;color:#fff}",
      ".slot-form-section .unlock-btn:disabled{opacity:.5;cursor:not-allowed}",

      /* Slot result overlay */
      ".slot-result{position:absolute;inset:0;background:rgba(7,26,15,.95);display:none;flex-direction:column;align-items:center;justify-content:center;z-index:12;padding:24px;border-radius:14px;text-align:center}",
      ".slot-result.active{display:flex}",
      ".slot-result .result-emoji{font-size:48px;margin-bottom:10px}",
      ".slot-result .result-title{font-size:20px;font-weight:800;color:#fff;letter-spacing:2px;margin-bottom:6px}",
      ".slot-result .result-desc{font-size:13px;color:#8aab9a;margin-bottom:16px}",
      ".slot-result .coupon-box{background:#0a1f14;border:1px dashed #52b788;border-radius:8px;padding:14px 20px;margin-bottom:12px}",
      ".slot-result .coupon-code{font-size:22px;font-weight:800;color:#ffd700;letter-spacing:3px;margin-bottom:6px}",
      ".slot-result .coupon-copy{background:#1a3327;border:none;color:#52b788;padding:6px 14px;border-radius:6px;font-size:12px;cursor:pointer;font-weight:600}",
      ".slot-result .coupon-copy:hover{background:#2a4337}",
      ".slot-result .try-again-btn{background:none;border:1px solid #1a3327;color:#8aab9a;padding:8px 20px;border-radius:8px;font-size:12px;cursor:pointer;margin-top:4px}",
      ".slot-result .try-again-btn:hover{border-color:#52b788;color:#fff}"
    ].join("\n");
    document.head.appendChild(style);
  }

  /* Ã¢ÂÂÃ¢ÂÂ Generic Popup (email form + coupon) Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ */

  function showGenericPopup(popup) {
    var cfg = popup.config || {};
    var title = cfg.title || "Oferta Especial";
    var desc = cfg.description || cfg.subtitle || "Cadastre-se e ganhe um desconto!";
    var btnText = cfg.btn_text || "PARTICIPAR";
    var emoji = cfg.emoji || "Ã°ÂÂÂ";
    var prize = cfg.prize || "10% OFF";
    var coupon = cfg.coupon || "PROMO10";

    var backdrop = document.createElement("div");
    backdrop.className = "pus-backdrop";
    backdrop.setAttribute("data-pus-popup", popup.id);

    var modal = document.createElement("div");
    modal.className = "pus-modal";
    modal.innerHTML = [
      '<button class="pus-modal-close" data-pus-close>&times;</button>',
      '<div class="pus-modal-emoji">' + emoji + '</div>',
      '<div class="pus-modal-title">' + escHtml(title) + '</div>',
      '<div class="pus-modal-desc">' + escHtml(desc) + '</div>',
      '<div class="pus-generic-form">',
        '<input type="email" placeholder="Seu e-mail" data-pus-email>',
        '<button class="pus-modal-btn" data-pus-submit>' + escHtml(btnText) + '</button>',
      '</div>',
      '<div class="pus-generic-success" style="display:none">',
        '<div class="pus-modal-title" style="margin-bottom:8px">Parab&eacute;ns!</div>',
        '<div class="pus-modal-desc">Voc&ecirc; ganhou ' + escHtml(prize) + '</div>',
        '<div class="pus-coupon-box">',
          '<div class="pus-coupon-code" data-pus-coupon-val>' + escHtml(coupon) + '</div>',
          '<button class="pus-coupon-copy" data-pus-copy>Copiar</button>',
        '</div>',
      '</div>'
    ].join("");

    modal.addEventListener("click", function(e) { e.stopPropagation(); });
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    trackEvent(popup.id, "impression");
    markShown(popup.id);

    /* Close */
    var closeFn = function() {
      trackEvent(popup.id, "close");
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    };
    backdrop.addEventListener("click", closeFn);
    modal.querySelector("[data-pus-close]").addEventListener("click", closeFn);

    /* Submit */
    modal.querySelector("[data-pus-submit]").addEventListener("click", function() {
      var emailInput = modal.querySelector("[data-pus-email]");
      var email = (emailInput.value || "").trim();
      if (!email || email.indexOf("@") === -1) { emailInput.style.borderColor = "#ef4444"; return; }
      var btn = modal.querySelector("[data-pus-submit]");
      btn.disabled = true; btn.textContent = "...";
      submitLead(popup.id, email, "", "", prize, coupon, function() {
        modal.querySelector(".pus-generic-form").style.display = "none";
        modal.querySelector(".pus-generic-success").style.display = "block";
        trackEvent(popup.id, "win", { email: email });
      });
    });

    /* Copy coupon */
    modal.querySelector("[data-pus-copy]").addEventListener("click", function() {
      copyText(coupon, this);
    });
  }

    /* Ã¢ÂÂÃ¢ÂÂ Slot Machine Popup Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ */

  function showSlotMachinePopup(popup) {
    var cfg = popup.config || {};
    var title = cfg.title || "\ud83c\udf81 Jogue e Ganhe!";
    var desc = cfg.description || "Cadastre seu e-mail e jogue para ganhar um cupom especial!";
    var btnText = cfg.button_text || "JOGAR!";
    var prize = cfg.prize || "SLOT10";
    var coupon = cfg.prize || "SLOT10";
    var emoji1 = cfg.slot_emoji1 || "\ud83d\udc55";
    var emoji2 = cfg.slot_emoji2 || "\ud83e\udde2";
    var emoji3 = cfg.slot_emoji3 || "\ud83d\udc5f";
    var machineTitle = cfg.slot_machine_title || "JACKPOT!";
    var winText = cfg.slot_win_text || "\ud83c\udf89 PARAB\u00c9NS! Voc\u00ea ganhou!";
    var loseText = cfg.slot_lose_text || "Que pena! Tente novamente...";
    var bgColor = cfg.background_color || "#0a1f14";
    var btnColor = cfg.button_color || "#52b788";

    var allEmojis = [emoji1, emoji2, emoji3];
    var unlocked = false;

    var backdrop = document.createElement("div");
    backdrop.className = "pus-backdrop";
    backdrop.setAttribute("data-pus-popup", popup.id);

    var box = document.createElement("div");
    box.className = "slot-popup";
    box.style.background = "linear-gradient(180deg," + bgColor + " 0%,#071a0f 100%)";

    box.innerHTML = [
      '<button class="slot-popup-close" data-slot-close>&times;</button>',

      /* Header */
      '<div class="slot-popup-header">',
        '<span class="emoji">' + escHtml(cfg.emoji || "\ud83c\udf81") + '</span>',
        '<div class="title">' + escHtml(title) + '</div>',
        '<div class="subtitle">' + escHtml(desc) + '</div>',
      '</div>',

      /* Slot machine */
      '<div class="slot-machine-wrap">',
        '<div class="slot-machine-title">' + escHtml(machineTitle) + '</div>',
        '<div class="slot-reels">',
          '<div class="slot-reel" data-reel="0"><span class="slot-reel-inner">' + emoji1 + '</span></div>',
          '<div class="slot-reel" data-reel="1"><span class="slot-reel-inner">' + emoji2 + '</span></div>',
          '<div class="slot-reel" data-reel="2"><span class="slot-reel-inner">' + emoji3 + '</span></div>',
        '</div>',
        '<button class="slot-spin-btn" data-slot-spin style="border-color:' + btnColor + ';color:' + btnColor + '" disabled>GIRAR</button>',
      '</div>',

      /* Form section (pre-registration) */
      '<div class="slot-form-section" data-slot-form>',
        '<div class="lock-icon">\ud83d\udd12</div>',
        '<div class="lock-title">Cadastre-se para desbloquear o jogo e ganhar seu desconto!</div>',
        '<input type="text" placeholder="\u2709 Seu nome" data-slot-name>',
        '<input type="email" placeholder="\u2709 Seu e-mail *" data-slot-email>',
        '<input type="tel" placeholder="\ud83d\udcde Seu telefone" data-slot-phone>',
        '<button class="unlock-btn" data-slot-unlock style="border-color:' + btnColor + ';color:' + btnColor + '">' + escHtml(btnText) + '</button>',
      '</div>',

      /* Result overlay */
      '<div class="slot-result" data-slot-result>',
        '<div class="result-emoji" data-slot-result-emoji>\ud83c\udf89</div>',
        '<div class="result-title" data-slot-result-title></div>',
        '<div class="result-desc" data-slot-result-desc></div>',
        '<div class="coupon-box" data-slot-coupon-box style="display:none">',
          '<div class="coupon-code" data-slot-coupon-val></div>',
          '<button class="coupon-copy" data-slot-copy>Copiar</button>',
        '</div>',
        '<button class="try-again-btn" data-slot-retry>Jogar novamente</button>',
      '</div>'
    ].join("");

    box.addEventListener("click", function(e) { e.stopPropagation(); });
    backdrop.appendChild(box);
    document.body.appendChild(backdrop);

    trackEvent(popup.id, "impression");
    markShown(popup.id);

    /* Refs */
    var spinBtn = box.querySelector("[data-slot-spin]");
    var formSection = box.querySelector("[data-slot-form]");
    var unlockBtn = box.querySelector("[data-slot-unlock]");
    var reels = box.querySelectorAll(".slot-reel");
    var resultOverlay = box.querySelector("[data-slot-result]");
    var spinning = false;

    /* Close */
    var closeFn = function() {
      trackEvent(popup.id, "close");
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    };
    backdrop.addEventListener("click", closeFn);
    box.querySelector("[data-slot-close]").addEventListener("click", closeFn);

    /* Unlock (registration) */
    unlockBtn.addEventListener("click", function() {
      var email = (box.querySelector("[data-slot-email]").value || "").trim();
      var name = (box.querySelector("[data-slot-name]").value || "").trim();
      var phone = (box.querySelector("[data-slot-phone]").value || "").trim();
      if (!email || email.indexOf("@") === -1) {
        box.querySelector("[data-slot-email]").style.borderColor = "#ef4444";
        return;
      }
      unlockBtn.disabled = true;
      unlockBtn.textContent = "...";
      submitLead(popup.id, email, name, phone, prize, coupon, function() {
        unlocked = true;
        formSection.style.display = "none";
        spinBtn.disabled = false;
        spinBtn.style.background = btnColor;
        spinBtn.style.color = "#fff";
        trackEvent(popup.id, "unlock", { email: email });
      });
    });

    /* Spin logic */
    spinBtn.addEventListener("click", function() {
      if (spinning || !unlocked) return;
      spinning = true;
      spinBtn.disabled = true;

      /* Start spinning animation */
      var intervals = [];
      for (var r = 0; r < 3; r++) {
        (function(idx) {
          var reel = reels[idx];
          var inner = reel.querySelector(".slot-reel-inner");
          reel.classList.add("spinning");
          var ci = 0;
          intervals[idx] = setInterval(function() {
            ci = (ci + 1) % allEmojis.length;
            inner.textContent = allEmojis[ci];
          }, 100 + idx * 30);
        })(r);
      }

      /* Determine result (70% win rate) */
      var isWin = Math.random() < 0.7;
      var results;
      if (isWin) {
        var winEmoji = allEmojis[Math.floor(Math.random() * allEmojis.length)];
        results = [winEmoji, winEmoji, winEmoji];
      } else {
        results = [];
        for (var j = 0; j < 3; j++) {
          results.push(allEmojis[Math.floor(Math.random() * allEmojis.length)]);
        }
        /* Ensure at least one is different */
        if (results[0] === results[1] && results[1] === results[2]) {
          var diff = (allEmojis.indexOf(results[0]) + 1) % allEmojis.length;
          results[2] = allEmojis[diff];
        }
      }

      /* Stop reels one by one */
      var stopReel = function(idx) {
        setTimeout(function() {
          clearInterval(intervals[idx]);
          reels[idx].classList.remove("spinning");
          reels[idx].querySelector(".slot-reel-inner").textContent = results[idx];
          if (isWin) reels[idx].classList.add("win");

          if (idx === 2) {
            /* All reels stopped */
            setTimeout(function() { showResult(isWin); }, 400);
          }
        }, 800 + idx * 500);
      };
      for (var s = 0; s < 3; s++) stopReel(s);
    });

    /* Show result */
    function showResult(isWin) {
      spinning = false;
      var resultEmoji = box.querySelector("[data-slot-result-emoji]");
      var resultTitle = box.querySelector("[data-slot-result-title]");
      var resultDesc = box.querySelector("[data-slot-result-desc]");
      var couponBox = box.querySelector("[data-slot-coupon-box]");
      var couponVal = box.querySelector("[data-slot-coupon-val]");

      if (isWin) {
        resultEmoji.textContent = "\ud83c\udf89";
        resultTitle.textContent = winText.replace(/\ud83c\udf89\s*/, "");
        resultDesc.textContent = "Use o cupom abaixo na sua pr\u00f3xima compra:";
        couponVal.textContent = coupon;
        couponBox.style.display = "block";
        trackEvent(popup.id, "win");
      } else {
        resultEmoji.textContent = "\ud83d\ude14";
        resultTitle.textContent = loseText;
        resultDesc.textContent = "Tente mais uma vez!";
        couponBox.style.display = "none";
        trackEvent(popup.id, "lose");
      }

      resultOverlay.classList.add("active");
    }

    /* Retry */
    box.querySelector("[data-slot-retry]").addEventListener("click", function() {
      resultOverlay.classList.remove("active");
      for (var r = 0; r < 3; r++) {
        reels[r].classList.remove("win");
        reels[r].querySelector(".slot-reel-inner").textContent = allEmojis[r];
      }
      spinBtn.disabled = false;
    });

    /* Copy coupon */
    box.querySelector("[data-slot-copy]").addEventListener("click", function() {
      copyText(coupon, this);
    });
  }

  /* Ã¢ÂÂÃ¢ÂÂ Skate Grind Popup Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ */

  function showSkatePopup(popup) {
    var cfg = popup.config || {};
    var title = cfg.title || "SKATE GRIND";
    var subtitle = cfg.description || cfg.subtitle || "Pule obst\u00e1culos e ganhe descontos!";
    var btnText = cfg.btn_text || "DESBLOQUEAR";
    var prize = cfg.prize || "10% OFF";
    var coupon = cfg.coupon || "SKATE10";
    var emoji = cfg.emoji || "Ã°ÂÂÂ¹"; // fallback
    var winScore = parseInt(cfg.win_score, 10) || 800;

    /* Game state */
    var GRAVITY = 0.5;
    var JUMP_FORCE = -9;
    var GROUND_Y = 140;
    var SKATER_W = 20, SKATER_H = 26, SKATER_X = 40;
    var W = 310, H = 170;

    var running = false;
    var unlocked = false;
    var score = 0;
    var speed = 3;
    var animId = null;
    var skaterY = GROUND_Y - SKATER_H;
    var skaterVY = 0;
    var onGround = true;
    var grinding = false;
    var obstacles = [];
    var spawnTimer = 0;
    var groundOffset = 0;
    var floatingTexts = [];
    var frameCount = 0;
    var canvas, ctx;

    /* Build DOM */
    var backdrop = document.createElement("div");
    backdrop.className = "pus-backdrop";
    backdrop.setAttribute("data-pus-popup", popup.id);

    var box = document.createElement("div");
    box.className = "skate-popup";

    var isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    var instrText = isMobile ? "Ã°ÂÂÂ Clique na tela para pular" : " \u2328\ufe0f Aperte Espa\u00e7o para pular";

    box.innerHTML = [
      '<button class="skate-popup-close" data-pus-close>&times;</button>',

      /* Header */
      '<div class="skate-popup-header">',
        '<span class="emoji">' + emoji + '</span>',
        '<div class="title">' + escHtml(title) + '</div>',
        '<div class="subtitle">' + escHtml(subtitle) + '</div>',
      '</div>',

      /* Canvas */
      '<div class="skate-canvas-wrap" data-skate-tap>',
        '<canvas width="310" height="170" data-skate-canvas></canvas>',
      '</div>',

      /* Score + instruction */
      '<div class="skate-score"><span data-skate-score>0 / ' + winScore + ' PTS</span></div>',
      '<div class="skate-instruction">' + instrText + '</div>',

      /* Start button */
      '<button class="skate-start-btn" data-skate-start disabled>INICIAR</button>',

      /* Lock overlay */
      '<div class="skate-lock-section" data-skate-lock>',
        '<div class="lock-icon">\ud83d\udd12</div>',
        '<div class="lock-title">Cadastre-se para desbloquear o jogo e ganhar seu desconto!</div>',
        '<input type="email" placeholder="\u2709 Seu e-mail *" data-skate-email>',
        '<input type="text" placeholder="\u2709 Seu nome" data-skate-name>',
        '<input type="tel" placeholder="\ud83d\udcde Seu telefone" data-skate-phone>',
        '<button class="unlock-btn" data-skate-unlock>' + escHtml(btnText) + '</button>',
      '</div>',

      /* Victory overlay */
      '<div class="skate-victory" data-skate-victory>',
        '<div class="trophy">\ud83c\udfc6</div>',
        '<div class="vtitle">PARAB\u00c9NS!</div>',
        '<div class="vscore">Pontua\u00e7\u00e3o: <span data-skate-final-score>0</span></div>',
        '<div class="vprize">' + escHtml(prize) + '</div>',
        '<div class="coupon-box">',
          '<div class="coupon-code" data-skate-coupon-val>' + escHtml(coupon) + '</div>',
          '<button class="coupon-copy" data-skate-copy>Copiar</button>',
        '</div>',
        '<button class="vplay-again" data-skate-replay>Jogar de novo</button>',
      '</div>'
    ].join("");

    box.addEventListener("click", function(e) { e.stopPropagation(); });
    backdrop.appendChild(box);
    document.body.appendChild(backdrop);

    /* Refs */
    canvas = box.querySelector("[data-skate-canvas]");
    ctx = canvas.getContext("2d");
    var scoreEl = box.querySelector("[data-skate-score]");
    var startBtn = box.querySelector("[data-skate-start]");
    var lockOverlay = box.querySelector("[data-skate-lock]");
    var victoryOverlay = box.querySelector("[data-skate-victory]");
    var emailInput = box.querySelector("[data-skate-email]");
    var nameInput = box.querySelector("[data-skate-name]");
    var phoneInput = box.querySelector("[data-skate-phone]");

    trackEvent(popup.id, "impression");
    markShown(popup.id);

    /* Ã¢ÂÂÃ¢ÂÂ Drawing Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ */

    function drawFrame() {
      /* Sky */
      var grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#1a1a1a");
      grad.addColorStop(1, "#0a0a0a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      /* City silhouette (parallax) */
      ctx.fillStyle = "#1a1a1a";
      var blds = [25, 40, 30, 55, 35, 45, 28, 42, 32, 60, 25, 38, 22];
      for (var i = 0; i < blds.length; i++) {
        var bx = i * 26 - (groundOffset * 0.2) % 26;
        ctx.fillRect(bx, GROUND_Y - blds[i], 22, blds[i]);
        ctx.fillStyle = "#333";
        for (var wy = GROUND_Y - blds[i] + 6; wy < GROUND_Y - 4; wy += 8) {
          ctx.fillRect(bx + 4, wy, 3, 3);
          ctx.fillRect(bx + 12, wy, 3, 3);
        }
        ctx.fillStyle = "#1a1a1a";
      }

      /* Ground line */
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, GROUND_Y, W, 1);
      ctx.fillStyle = "#333";
      for (var x = -(groundOffset % 20); x < W; x += 20) {
        ctx.fillRect(x, GROUND_Y + 3, 10, 1);
      }

      /* Obstacles */
      for (var i = 0; i < obstacles.length; i++) {
        drawObstacle(obstacles[i]);
      }

      /* Skater */
      drawSkater(SKATER_X, skaterY);

      /* Floating score texts */
      ctx.font = "bold 12px sans-serif";
      for (var i = floatingTexts.length - 1; i >= 0; i--) {
        var ft = floatingTexts[i];
        ft.y -= 1.2;
        ft.life--;
        ctx.fillStyle = "rgba(255,255,255," + (ft.life / 40) + ")";
        ctx.fillText(ft.text, ft.x, ft.y);
        if (ft.life <= 0) floatingTexts.splice(i, 1);
      }

      /* HUD */
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(score + " / " + winScore + " PTS", 210, 14);

      /* Progress bar */
      var prog = Math.min(score / winScore, 1);
      ctx.fillStyle = "#333";
      ctx.fillRect(210, 18, 90, 4);
      ctx.fillStyle = "#fff";
      ctx.fillRect(210, 18, 90 * prog, 4);
    }

    function drawSkater(x, y) {
      /* Head */
      ctx.fillStyle = "#fff";
      ctx.fillRect(x + 6, y, 8, 8);
      /* Cap */
      ctx.fillStyle = "#888";
      ctx.fillRect(x + 4, y - 2, 12, 3);
      /* Body */
      ctx.fillStyle = "#ddd";
      ctx.fillRect(x + 6, y + 8, 8, 10);
      /* Arms */
      if (grinding) {
        ctx.fillRect(x + 14, y + 8, 6, 3);
        ctx.fillRect(x, y + 6, 6, 3);
      } else {
        ctx.fillRect(x + 2, y + 10, 4, 3);
        ctx.fillRect(x + 14, y + 10, 4, 3);
      }
      /* Legs */
      ctx.fillStyle = "#999";
      ctx.fillRect(x + 5, y + 18, 4, 5);
      ctx.fillRect(x + 11, y + 18, 4, 5);
      /* Skateboard */
      ctx.fillStyle = "#fff";
      ctx.fillRect(x, y + 23, 20, 2);
      /* Wheels */
      ctx.fillStyle = "#666";
      ctx.fillRect(x + 1, y + 25, 3, 2);
      ctx.fillRect(x + 16, y + 25, 3, 2);
      /* Grind sparks */
      if (grinding) {
        ctx.fillStyle = "#fff";
        for (var s = 0; s < 3; s++) {
          var sx = x + 5 + Math.random() * 10;
          var sy = y + 24 + Math.random() * 3;
          ctx.fillRect(sx, sy, 2, 1);
        }
      }
    }

    function drawObstacle(ob) {
      if (ob.type === "hydrant") {
        ctx.fillStyle = "#ccc";
        ctx.fillRect(ob.x + 3, ob.y + 2, 8, 14);
        ctx.fillStyle = "#999";
        ctx.fillRect(ob.x + 1, ob.y + 5, 12, 4);
        ctx.fillStyle = "#fff";
        ctx.fillRect(ob.x + 4, ob.y, 6, 3);
      } else if (ob.type === "rail") {
        ctx.fillStyle = "#888";
        ctx.fillRect(ob.x, ob.y, ob.w, 3);
        ctx.fillRect(ob.x + 5, ob.y, 2, GROUND_Y - ob.y);
        ctx.fillRect(ob.x + ob.w - 7, ob.y, 2, GROUND_Y - ob.y);
        ctx.fillStyle = "#aaa";
        ctx.fillRect(ob.x, ob.y, ob.w, 1);
      } else if (ob.type === "combo") {
        /* Hydrant part */
        ctx.fillStyle = "#ccc";
        ctx.fillRect(ob.x + 3, ob.hy + 2, 8, 14);
        ctx.fillStyle = "#999";
        ctx.fillRect(ob.x + 1, ob.hy + 5, 12, 4);
        ctx.fillStyle = "#fff";
        ctx.fillRect(ob.x + 4, ob.hy, 6, 3);
        /* Rail part */
        var rx = ob.x + 30;
        ctx.fillStyle = "#888";
        ctx.fillRect(rx, ob.ry, ob.rw, 3);
        ctx.fillRect(rx + 5, ob.ry, 2, GROUND_Y - ob.ry);
        ctx.fillRect(rx + ob.rw - 7, ob.ry, 2, GROUND_Y - ob.ry);
        ctx.fillStyle = "#aaa";
        ctx.fillRect(rx, ob.ry, ob.rw, 1);
      }
    }

    /* Ã¢ÂÂÃ¢ÂÂ Game logic Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ */

    function jump() {
      if (!running || !onGround) return;
      skaterVY = JUMP_FORCE;
      onGround = false;
      grinding = false;
    }

    function addPoints(pts, x, y) {
      score += pts;
      floatingTexts.push({ text: "+" + pts, x: x, y: y, life: 40 });
      scoreEl.textContent = score + " / " + winScore + " PTS";
      if (score >= winScore) {
        running = false;
        cancelAnimationFrame(animId);
        trackEvent(popup.id, "win", { score: score });
        setTimeout(showVictory, 400);
      }
    }

    function spawnObstacle() {
      var r = Math.random();
      if (r < 0.4) {
        obstacles.push({ type: "hydrant", x: 320, y: GROUND_Y - 18, w: 14, h: 18, scored: false });
      } else if (r < 0.75) {
        obstacles.push({ type: "rail", x: 320, y: GROUND_Y - 20, w: 70, h: 3, scored: false });
      } else {
        obstacles.push({ type: "combo", x: 320, hy: GROUND_Y - 18, ry: GROUND_Y - 22, rw: 60, w: 90, scored: false });
      }
    }

    function gameLoop() {
      if (!running) return;
      frameCount++;
      groundOffset += speed;

      /* Gravity */
      if (!onGround && !grinding) {
        skaterVY += GRAVITY;
        skaterY += skaterVY;
        if (skaterY >= GROUND_Y - SKATER_H) {
          skaterY = GROUND_Y - SKATER_H;
          skaterVY = 0;
          onGround = true;
        }
      }

      /* Spawn */
      spawnTimer++;
      if (spawnTimer >= 80) {
        spawnTimer = 0;
        spawnObstacle();
      }

      /* Move & collide */
      for (var i = obstacles.length - 1; i >= 0; i--) {
        var ob = obstacles[i];
        ob.x -= speed;
        if (ob.x + (ob.w || 60) < -10) { obstacles.splice(i, 1); continue; }

        if (ob.type === "hydrant") {
          if (!ob.scored && SKATER_X + SKATER_W > ob.x && SKATER_X < ob.x + 14) {
            if (skaterY + SKATER_H <= ob.y + 4) {
              ob.scored = true;
              addPoints(50, ob.x, ob.y - 10);
            } else if (skaterY + SKATER_H > ob.y + 2 && onGround) {
              gameOver();
              return;
            }
          }
        } else if (ob.type === "rail") {
          var railTop = ob.y;
          if (SKATER_X + SKATER_W > ob.x + 5 && SKATER_X < ob.x + ob.w - 5) {
            if (!onGround && skaterVY > 0 && skaterY + SKATER_H >= railTop - 2 && skaterY + SKATER_H <= railTop + 6) {
              skaterY = railTop - SKATER_H;
              skaterVY = 0;
              grinding = true;
              onGround = false;
              if (!ob.scored) { ob.scored = true; addPoints(100, ob.x + 20, ob.y - 15); }
            }
            if (grinding && SKATER_X + SKATER_W > ob.x && SKATER_X < ob.x + ob.w) {
              skaterY = railTop - SKATER_H;
            }
          }
          if (grinding && SKATER_X > ob.x + ob.w) { grinding = false; }
        } else if (ob.type === "combo") {
          /* Hydrant collision */
          if (SKATER_X + SKATER_W > ob.x && SKATER_X < ob.x + 14) {
            if (skaterY + SKATER_H > ob.hy + 2 && onGround) { gameOver(); return; }
          }
          /* Rail part */
          var rx = ob.x + 30;
          if (SKATER_X + SKATER_W > rx + 5 && SKATER_X < rx + ob.rw - 5) {
            if (!onGround && !grinding && skaterVY > 0 && skaterY + SKATER_H >= ob.ry - 2 && skaterY + SKATER_H <= ob.ry + 6) {
              skaterY = ob.ry - SKATER_H;
              skaterVY = 0;
              grinding = true;
              onGround = false;
              if (!ob.scored) { ob.scored = true; addPoints(150, rx + 20, ob.ry - 15); }
            }
            if (grinding) skaterY = ob.ry - SKATER_H;
          }
          if (grinding && SKATER_X > rx + ob.rw) { grinding = false; }
        }
      }

      drawFrame();
      animId = requestAnimationFrame(gameLoop);
    }

    function startRun() {
      if (running) return;
      running = true;
      score = 0;
      speed = 3;
      obstacles = [];
      spawnTimer = 0;
      floatingTexts = [];
      frameCount = 0;
      skaterY = GROUND_Y - SKATER_H;
      skaterVY = 0;
      onGround = true;
      grinding = false;
      groundOffset = 0;
      scoreEl.textContent = "0 / " + winScore + " PTS";
      startBtn.disabled = true;
      victoryOverlay.classList.remove("active");
      trackEvent(popup.id, "play");
      gameLoop();
    }

    function gameOver() {
      running = false;
      cancelAnimationFrame(animId);
      if (ctx) {
        ctx.fillStyle = "rgba(255,0,0,.2)";
        ctx.fillRect(0, 0, W, H);
      }
      startBtn.disabled = false;
      startBtn.textContent = "TENTAR DE NOVO";
    }

    function showVictory() {
      box.querySelector("[data-skate-final-score]").textContent = score;
      victoryOverlay.classList.add("active");
      startBtn.disabled = false;
      startBtn.textContent = "JOGAR DE NOVO";
    }

    function initGame() {
      skaterY = GROUND_Y - SKATER_H;
      obstacles = [];
      score = 0;
      speed = 3;
      spawnTimer = 0;
      skaterVY = 0;
      onGround = true;
      grinding = false;
      groundOffset = 0;
      floatingTexts = [];
      frameCount = 0;
      scoreEl.textContent = "0 / " + winScore + " PTS";
      drawFrame();
    }

    /* Ã¢ÂÂÃ¢ÂÂ Event handlers Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ */

    /* Close */
    var closeFn = function() {
      running = false;
      cancelAnimationFrame(animId);
      trackEvent(popup.id, "close");
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      document.removeEventListener("keydown", keyHandler);
    };
    backdrop.addEventListener("click", closeFn);
    box.querySelector("[data-pus-close]").addEventListener("click", function(e) {
      e.stopPropagation();
      closeFn();
    });

    /* Tap/click to jump */
    box.querySelector("[data-skate-tap]").addEventListener("click", function() {
      jump();
    });

    /* Keyboard */
    var keyHandler = function(e) {
      if (e.code === "Space" || e.key === " " || e.code === "ArrowUp" || e.key === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    document.addEventListener("keydown", keyHandler);

    /* Start button */
    startBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      startRun();
    });

    /* Unlock */
    box.querySelector("[data-skate-unlock]").addEventListener("click", function(e) {
      e.stopPropagation();
      var email = (emailInput.value || "").trim();
      if (!email || email.indexOf("@") === -1) {
        emailInput.style.borderColor = "#ef4444";
        return;
      }
      var btn = box.querySelector("[data-skate-unlock]");
      btn.disabled = true;
      btn.textContent = "...";
      var name = (nameInput.value || "").trim();
      var phone = (phoneInput.value || "").trim();
      submitLead(popup.id, email, name, phone, prize, coupon, function(ok) {
        unlocked = true;
        lockOverlay.classList.add("hidden");
        startBtn.disabled = false;
        initGame();
      });
    });

    /* Copy coupon */
    box.querySelector("[data-skate-copy]").addEventListener("click", function(e) {
      e.stopPropagation();
      copyText(coupon, this);
    });

    /* Replay from victory */
    box.querySelector("[data-skate-replay]").addEventListener("click", function(e) {
      e.stopPropagation();
      victoryOverlay.classList.remove("active");
      startRun();
    });

    /* Initial draw */
    initGame();
  }

  /* Ã¢ÂÂÃ¢ÂÂ Utilities Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ */

  function escHtml(s) {
    var d = document.createElement("div");
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  }

  function copyText(text, btn) {
    var done = function() {
      if (btn) {
        var orig = btn.textContent;
        btn.textContent = "Copiado!";
        setTimeout(function() { btn.textContent = orig; }, 1500);
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function() {
        fallbackCopy(text);
        done();
      });
    } else {
      fallbackCopy(text);
      done();
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* Ã¢ÂÂÃ¢ÂÂ Boot Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ */

  function boot() {
    var storeId = getStoreId();
    if (!storeId) return;

    injectStyles();

    fetchConfig(storeId, function(data) {
      if (!data || !data.popups || !data.popups.length) return;

      for (var i = 0; i < data.popups.length; i++) {
        var popup = data.popups[i];
        if (!popup || !popup.id) continue;
        if (wasShownRecently(popup.id)) continue;

        if (popup.game_type === "skate_grind") {
          showSkatePopup(popup);
        } else {
          showGenericPopup(popup);
        }
        break; // Show one popup at a time
      }
    });
  }

  /* Wait for DOM */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();
(function() {
  "use strict";

  var API_BASE = "https://popup-studio.vercel.app";
  var STORAGE_KEY = "pus_shown_";
  var STORAGE_TTL = 86400000; // 24h

  /* Ã¢ÂÂÃ¢ÂÂ Helpers Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ */

  function getStoreId() {
    // Try LS object first (Nuvemshop global)
    if (typeof LS !== "undefined" && LS && LS.store && LS.store.id) {
      return String(LS.store.id);
    }
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute("src") || "";
      if (src.indexOf("popup-studio") !== -1 || src.indexOf("loader.js") !== -1 || src.indexOf("apps-scripts") !== -1) {
        var match = src.match(/[?&]store_id=([^&]+)/);
        if (match) return match[1];
        // Nuvemshop uses "store" param (without underscore)
        var match2 = src.match(/[?&]store=([^&]+)/);
        if (match2) return match2[1];
        var id = scripts[i].getAttribute("data-store-id");
        if (id) return id;
      }
    }
    return null;
  }

  function wasShownRecently(popupId) {
    try {
      var raw = localStorage.getItem(STORAGE_KEY + popupId);
      if (!raw) return false;
      var ts = parseInt(raw, 10);
      return (Date.now() - ts) < STORAGE_TTL;
    } catch (e) { return false; }
  }

  function markShown(popupId) {
    try { localStorage.setItem(STORAGE_KEY + popupId, String(Date.now())); } catch (e) {}
  }

  function trackEvent(popupId, eventType, data) {
    try {
      var body = { popup_id: popupId, event: eventType };
      if (data) { for (var k in data) { if (data.hasOwnProperty(k)) body[k] = data[k]; } }
      var xhr = new XMLHttpRequest();
      xhr.open("POST", API_BASE + "/api/public/event", true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify(body));
    } catch (e) {}
  }

  function submitLead(popupId, email, name, phone, prize, coupon, cb) {
    try {
      var body = { popup_id: popupId, email: email, name: name || "", phone: phone || "", prize: prize || "", coupon: coupon || "" };
      var xhr = new XMLHttpRequest();
      xhr.open("POST", API_BASE + "/api/public/lead", true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && cb) cb(xhr.status >= 200 && xhr.status < 300);
      };
      xhr.send(JSON.stringify(body));
    } catch (e) { if (cb) cb(false); }
  }

  function fetchConfig(storeId, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", API_BASE + "/api/public/config?store_id=" + encodeURIComponent(storeId), true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { cb(JSON.parse(xhr.responseText)); } catch (e) { cb(null); }
        } else { cb(null); }
      }
    };
    xhr.send();
  }

  /* Ã¢ÂÂÃ¢ÂÂ Inject CSS Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ */

  function injectStyles() {
    var style = document.createElement("style");
    style.id = "pus-styles";
    style.textContent = [
      /* Backdrop */
      ".pus-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;animation:pusFadeIn .25s ease}",
      "@keyframes pusFadeIn{from{opacity:0}to{opacity:1}}",
      "@keyframes pusSlideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}",

      /* Generic modal */
      ".pus-modal{background:#1a1a2e;border-radius:14px;max-width:340px;width:100%;padding:32px 24px;text-align:center;position:relative;animation:pusSlideUp .3s ease;box-shadow:0 12px 48px rgba(0,0,0,.6)}",
      ".pus-modal-close{position:absolute;top:12px;right:14px;background:none;border:none;color:#888;font-size:22px;cursor:pointer;line-height:1;padding:4px}",
      ".pus-modal-close:hover{color:#fff}",
      ".pus-modal-emoji{font-size:40px;margin-bottom:10px}",
      ".pus-modal-title{font-size:18px;font-weight:700;color:#fff;margin-bottom:6px}",
      ".pus-modal-desc{font-size:13px;color:#aaa;margin-bottom:18px;line-height:1.4}",
      ".pus-modal input[type=email],.pus-modal input[type=text],.pus-modal input[type=tel]{width:100%;padding:10px 12px;border-radius:8px;border:1px solid #333;background:#111;color:#fff;font-size:14px;margin-bottom:10px;box-sizing:border-box;outline:none}",
      ".pus-modal input:focus{border-color:#7c5cfc}",
      ".pus-modal-btn{width:100%;padding:12px;border-radius:8px;border:none;background:#7c5cfc;color:#fff;font-size:14px;font-weight:700;cursor:pointer;text-transform:uppercase;letter-spacing:1px}",
      ".pus-modal-btn:hover{background:#9b7fff}",
      ".pus-modal-btn:disabled{opacity:.5;cursor:not-allowed}",
      ".pus-coupon-box{background:#111;border:1px dashed #555;border-radius:8px;padding:14px;margin-top:16px}",
      ".pus-coupon-code{font-size:22px;font-weight:800;color:#fff;letter-spacing:3px;margin-bottom:6px}",
      ".pus-coupon-copy{background:#333;border:none;color:#fff;padding:6px 14px;border-radius:6px;font-size:12px;cursor:pointer;font-weight:600}",
      ".pus-coupon-copy:hover{background:#555}",

      /* Skate popup container */
      ".skate-popup{background:linear-gradient(180deg,#111 0%,#0a0a0a 100%);border-radius:14px;max-width:340px;width:100%;position:relative;animation:pusSlideUp .3s ease;box-shadow:0 12px 48px rgba(0,0,0,.6);overflow:hidden}",
      ".skate-popup-close{position:absolute;top:10px;right:12px;background:none;border:none;color:#666;font-size:20px;cursor:pointer;z-index:5;line-height:1;padding:4px}",
      ".skate-popup-close:hover{color:#fff}",

      /* Header */
      ".skate-popup-header{text-align:center;padding:22px 20px 14px}",
      ".skate-popup-header .emoji{font-size:36px;margin-bottom:6px;display:block}",
      ".skate-popup-header .title{font-size:18px;font-weight:800;color:#fff;letter-spacing:3px;text-transform:uppercase;margin-bottom:4px}",
      ".skate-popup-header .subtitle{font-size:12px;color:#888;line-height:1.3}",

      /* Canvas area */
      ".skate-canvas-wrap{width:310px;height:170px;margin:0 auto;background:#0a0a0a;border-radius:10px;position:relative;cursor:pointer;overflow:hidden}",
      ".skate-canvas-wrap canvas{display:block}",

      /* Score */
      ".skate-score{text-align:center;padding:8px 0 4px;font-size:14px;font-weight:700;color:#fff}",
      ".skate-instruction{text-align:center;font-size:11px;color:#666;padding:0 0 6px}",

      /* Start button */
      ".skate-start-btn{display:block;width:calc(100% - 40px);margin:6px auto 14px;padding:12px;border-radius:8px;border:none;background:#fff;color:#111;font-size:14px;font-weight:700;cursor:pointer;text-transform:uppercase;letter-spacing:1px}",
      ".skate-start-btn:hover{background:#ddd}",
      ".skate-start-btn:disabled{opacity:.4;cursor:not-allowed}",

      /* Lock overlay */
      ".skate-lock-overlay{position:absolute;inset:0;background:rgba(0,0,0,.88);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:10;padding:24px;border-radius:14px}",
      ".skate-lock-overlay.hidden{display:none}",
      ".skate-lock-overlay .lock-icon{font-size:32px;margin-bottom:10px}",
      ".skate-lock-overlay .lock-title{font-size:16px;font-weight:700;color:#fff;margin-bottom:4px;text-align:center}",
      ".skate-lock-overlay .lock-desc{font-size:12px;color:#888;margin-bottom:14px;text-align:center;line-height:1.3}",
      ".skate-lock-overlay input{width:100%;max-width:260px;padding:10px 12px;border-radius:8px;border:1px solid #333;background:#111;color:#fff;font-size:13px;margin-bottom:8px;box-sizing:border-box;outline:none}",
      ".skate-lock-overlay input:focus{border-color:#7c5cfc}",
      ".skate-lock-overlay .unlock-btn{width:100%;max-width:260px;padding:11px;border-radius:8px;border:none;background:#fff;color:#111;font-size:13px;font-weight:700;cursor:pointer;text-transform:uppercase;letter-spacing:1px;margin-top:4px}",
      ".skate-lock-overlay .unlock-btn:hover{background:#ddd}",
      ".skate-lock-overlay .unlock-btn:disabled{opacity:.5;cursor:not-allowed}",

      /* Victory overlay */
      ".skate-victory{position:absolute;inset:0;background:rgba(0,0,0,.92);display:none;flex-direction:column;align-items:center;justify-content:center;z-index:12;padding:24px;border-radius:14px;text-align:center}",
      ".skate-victory.active{display:flex}",
      ".skate-victory .trophy{font-size:42px;margin-bottom:8px}",
      ".skate-victory .vtitle{font-size:18px;font-weight:800;color:#fff;letter-spacing:2px;margin-bottom:4px}",
      ".skate-victory .vscore{font-size:13px;color:#aaa;margin-bottom:14px}",
      ".skate-victory .vprize{font-size:15px;font-weight:700;color:#fff;margin-bottom:10px}",
      ".skate-victory .coupon-box{background:#111;border:1px dashed #555;border-radius:8px;padding:14px 20px;margin-bottom:12px}",
      ".skate-victory .coupon-code{font-size:22px;font-weight:800;color:#fff;letter-spacing:3px;margin-bottom:6px}",
      ".skate-victory .coupon-copy{background:#333;border:none;color:#fff;padding:6px 14px;border-radius:6px;font-size:12px;cursor:pointer;font-weight:600}",
      ".skate-victory .coupon-copy:hover{background:#555}",
      ".skate-victory .vplay-again{background:none;border:1px solid #444;color:#aaa;padding:8px 20px;border-radius:8px;font-size:12px;cursor:pointer;margin-top:4px}",
      ".skate-victory .vplay-again:hover{border-color:#888;color:#fff}"
    ].join("\n");
    document.head.appendChild(style);
  }

  /* Ã¢ÂÂÃ¢ÂÂ Generic Popup (email form + coupon) Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ */

  function showGenericPopup(popup) {
    var cfg = popup.config || {};
    var title = cfg.title || "Oferta Especial";
    var desc = cfg.description || cfg.subtitle || "Cadastre-se e ganhe um desconto!";
    var btnText = cfg.btn_text || "PARTICIPAR";
    var emoji = cfg.emoji || "Ã°ÂÂÂ";
    var prize = cfg.prize || "10% OFF";
    var coupon = cfg.coupon || "PROMO10";

    var backdrop = document.createElement("div");
    backdrop.className = "pus-backdrop";
    backdrop.setAttribute("data-pus-popup", popup.id);

    var modal = document.createElement("div");
    modal.className = "pus-modal";
    modal.innerHTML = [
      '<button class="pus-modal-close" data-pus-close>&times;</button>',
      '<div class="pus-modal-emoji">' + emoji + '</div>',
      '<div class="pus-modal-title">' + escHtml(title) + '</div>',
      '<div class="pus-modal-desc">' + escHtml(desc) + '</div>',
      '<div class="pus-generic-form">',
        '<input type="email" placeholder="Seu e-mail" data-pus-email>',
        '<button class="pus-modal-btn" data-pus-submit>' + escHtml(btnText) + '</button>',
      '</div>',
      '<div class="pus-generic-success" style="display:none">',
        '<div class="pus-modal-title" style="margin-bottom:8px">Parab&eacute;ns!</div>',
        '<div class="pus-modal-desc">Voc&ecirc; ganhou ' + escHtml(prize) + '</div>',
        '<div class="pus-coupon-box">',
          '<div class="pus-coupon-code" data-pus-coupon-val>' + escHtml(coupon) + '</div>',
          '<button class="pus-coupon-copy" data-pus-copy>Copiar</button>',
        '</div>',
      '</div>'
    ].join("");

    modal.addEventListener("click", function(e) { e.stopPropagation(); });
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    trackEvent(popup.id, "impression");
    markShown(popup.id);

    /* Close */
    var closeFn = function() {
      trackEvent(popup.id, "close");
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    };
    backdrop.addEventListener("click", closeFn);
    modal.querySelector("[data-pus-close]").addEventListener("click", closeFn);

    /* Submit */
    modal.querySelector("[data-pus-submit]").addEventListener("click", function() {
      var emailInput = modal.querySelector("[data-pus-email]");
      var email = (emailInput.value || "").trim();
      if (!email || email.indexOf("@") === -1) { emailInput.style.borderColor = "#ef4444"; return; }
      var btn = modal.querySelector("[data-pus-submit]");
      btn.disabled = true; btn.textContent = "...";
      submitLead(popup.id, email, "", "", prize, coupon, function() {
        modal.querySelector(".pus-generic-form").style.display = "none";
        modal.querySelector(".pus-generic-success").style.display = "block";
        trackEvent(popup.id, "win", { email: email });
      });
    });

    /* Copy coupon */
    modal.querySelector("[data-pus-copy]").addEventListener("click", function() {
      copyText(coupon, this);
    });
  }

  /* Ã¢ÂÂÃ¢ÂÂ Skate Grind Popup Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ */

  function showSkatePopup(popup) {
    var cfg = popup.config || {};
    var title = cfg.title || "SKATE GRIND";
    var subtitle = cfg.description || cfg.subtitle || "Pule obstÃÂ¡culos e ganhe descontos!";
    var btnText = cfg.btn_text || "DESBLOQUEAR";
    var prize = cfg.prize || "10% OFF";
    var coupon = cfg.coupon || "SKATE10";
    var emoji = cfg.emoji || "Ã°ÂÂÂ¹"; // fallback
    var winScore = parseInt(cfg.win_score, 10) || 800;

    /* Game state */
    var GRAVITY = 0.5;
    var JUMP_FORCE = -9;
    var GROUND_Y = 140;
    var SKATER_W = 20, SKATER_H = 26, SKATER_X = 40;
    var W = 310, H = 170;

    var running = false;
    var unlocked = false;
    var score = 0;
    var speed = 3;
    var animId = null;
    var skaterY = GROUND_Y - SKATER_H;
    var skaterVY = 0;
    var onGround = true;
    var grinding = false;
    var obstacles = [];
    var spawnTimer = 0;
    var groundOffset = 0;
    var floatingTexts = [];
    var frameCount = 0;
    var canvas, ctx;

    /* Build DOM */
    var backdrop = document.createElement("div");
    backdrop.className = "pus-backdrop";
    backdrop.setAttribute("data-pus-popup", popup.id);

    var box = document.createElement("div");
    box.className = "skate-popup";

    var isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    var instrText = isMobile ? "Ã°ÂÂÂ Clique na tela para pular" : "Ã¢ÂÂ¨Ã¯Â¸Â Aperte EspaÃÂ§o para pular";

    box.innerHTML = [
      '<button class="skate-popup-close" data-pus-close>&times;</button>',

      /* Header */
      '<div class="skate-popup-header">',
        '<span class="emoji">' + emoji + '</span>',
        '<div class="title">' + escHtml(title) + '</div>',
        '<div class="subtitle">' + escHtml(subtitle) + '</div>',
      '</div>',

      /* Canvas */
      '<div class="skate-canvas-wrap" data-skate-tap>',
        '<canvas width="310" height="170" data-skate-canvas></canvas>',
      '</div>',

      /* Score + instruction */
      '<div class="skate-score">Score: <span data-skate-score>0 / ' + winScore + '</span></div>',
      '<div class="skate-instruction">' + instrText + '</div>',

      /* Start button */
      '<button class="skate-start-btn" data-skate-start disabled>INICIAR</button>',

      /* Lock overlay */
      '<div class="skate-lock-overlay" data-skate-lock>',
        '<div class="lock-icon">Ã°ÂÂÂ</div>',
        '<div class="lock-title">Cadastre-se para jogar</div>',
        '<div class="lock-desc">Insira seus dados para desbloquear o jogo e concorrer a ' + escHtml(prize) + '</div>',
        '<input type="email" placeholder="Seu e-mail *" data-skate-email>',
        '<input type="text" placeholder="Seu nome" data-skate-name>',
        '<input type="tel" placeholder="Telefone" data-skate-phone>',
        '<button class="unlock-btn" data-skate-unlock>' + escHtml(btnText) + '</button>',
      '</div>',

      /* Victory overlay */
      '<div class="skate-victory" data-skate-victory>',
        '<div class="trophy">Ã°ÂÂÂ</div>',
        '<div class="vtitle">PARABÃÂNS!</div>',
        '<div class="vscore">PontuaÃÂ§ÃÂ£o: <span data-skate-final-score>0</span></div>',
        '<div class="vprize">' + escHtml(prize) + '</div>',
        '<div class="coupon-box">',
          '<div class="coupon-code" data-skate-coupon-val>' + escHtml(coupon) + '</div>',
          '<button class="coupon-copy" data-skate-copy>Copiar</button>',
        '</div>',
        '<button class="vplay-again" data-skate-replay>Jogar de novo</button>',
      '</div>'
    ].join("");

    box.addEventListener("click", function(e) { e.stopPropagation(); });
    backdrop.appendChild(box);
    document.body.appendChild(backdrop);

    /* Refs */
    canvas = box.querySelector("[data-skate-canvas]");
    ctx = canvas.getContext("2d");
    var scoreEl = box.querySelector("[data-skate-score]");
    var startBtn = box.querySelector("[data-skate-start]");
    var lockOverlay = box.querySelector("[data-skate-lock]");
    var victoryOverlay = box.querySelector("[data-skate-victory]");
    var emailInput = box.querySelector("[data-skate-email]");
    var nameInput = box.querySelector("[data-skate-name]");
    var phoneInput = box.querySelector("[data-skate-phone]");

    trackEvent(popup.id, "impression");
    markShown(popup.id);

    /* Ã¢ÂÂÃ¢ÂÂ Drawing Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ */

    function drawFrame() {
      /* Sky */
      var grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#1a1a1a");
      grad.addColorStop(1, "#0a0a0a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      /* City silhouette (parallax) */
      ctx.fillStyle = "#1a1a1a";
      var blds = [25, 40, 30, 55, 35, 45, 28, 42, 32, 60, 25, 38, 22];
      for (var i = 0; i < blds.length; i++) {
        var bx = i * 26 - (groundOffset * 0.2) % 26;
        ctx.fillRect(bx, GROUND_Y - blds[i], 22, blds[i]);
        ctx.fillStyle = "#333";
        for (var wy = GROUND_Y - blds[i] + 6; wy < GROUND_Y - 4; wy += 8) {
          ctx.fillRect(bx + 4, wy, 3, 3);
          ctx.fillRect(bx + 12, wy, 3, 3);
        }
        ctx.fillStyle = "#1a1a1a";
      }

      /* Ground line */
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, GROUND_Y, W, 1);
      ctx.fillStyle = "#333";
      for (var x = -(groundOffset % 20); x < W; x += 20) {
        ctx.fillRect(x, GROUND_Y + 3, 10, 1);
      }

      /* Obstacles */
      for (var i = 0; i < obstacles.length; i++) {
        drawObstacle(obstacles[i]);
      }

      /* Skater */
      drawSkater(SKATER_X, skaterY);

      /* Floating score texts */
      ctx.font = "bold 12px sans-serif";
      for (var i = floatingTexts.length - 1; i >= 0; i--) {
        var ft = floatingTexts[i];
        ft.y -= 1.2;
        ft.life--;
        ctx.fillStyle = "rgba(255,255,255," + (ft.life / 40) + ")";
        ctx.fillText(ft.text, ft.x, ft.y);
        if (ft.life <= 0) floatingTexts.splice(i, 1);
      }

      /* HUD */
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(score + " / " + winScore + " PTS", 210, 14);

      /* Progress bar */
      var prog = Math.min(score / winScore, 1);
      ctx.fillStyle = "#333";
      ctx.fillRect(210, 18, 90, 4);
      ctx.fillStyle = "#fff";
      ctx.fillRect(210, 18, 90 * prog, 4);
    }

    function drawSkater(x, y) {
      /* Head */
      ctx.fillStyle = "#fff";
      ctx.fillRect(x + 6, y, 8, 8);
      /* Cap */
      ctx.fillStyle = "#888";
      ctx.fillRect(x + 4, y - 2, 12, 3);
      /* Body */
      ctx.fillStyle = "#ddd";
      ctx.fillRect(x + 6, y + 8, 8, 10);
      /* Arms */
      if (grinding) {
        ctx.fillRect(x + 14, y + 8, 6, 3);
        ctx.fillRect(x, y + 6, 6, 3);
      } else {
        ctx.fillRect(x + 2, y + 10, 4, 3);
        ctx.fillRect(x + 14, y + 10, 4, 3);
      }
      /* Legs */
      ctx.fillStyle = "#999";
      ctx.fillRect(x + 5, y + 18, 4, 5);
      ctx.fillRect(x + 11, y + 18, 4, 5);
      /* Skateboard */
      ctx.fillStyle = "#fff";
      ctx.fillRect(x, y + 23, 20, 2);
      /* Wheels */
      ctx.fillStyle = "#666";
      ctx.fillRect(x + 1, y + 25, 3, 2);
      ctx.fillRect(x + 16, y + 25, 3, 2);
      /* Grind sparks */
      if (grinding) {
        ctx.fillStyle = "#fff";
        for (var s = 0; s < 3; s++) {
          var sx = x + 5 + Math.random() * 10;
          var sy = y + 24 + Math.random() * 3;
          ctx.fillRect(sx, sy, 2, 1);
        }
      }
    }

    function drawObstacle(ob) {
      if (ob.type === "hydrant") {
        ctx.fillStyle = "#ccc";
        ctx.fillRect(ob.x + 3, ob.y + 2, 8, 14);
        ctx.fillStyle = "#999";
        ctx.fillRect(ob.x + 1, ob.y + 5, 12, 4);
        ctx.fillStyle = "#fff";
        ctx.fillRect(ob.x + 4, ob.y, 6, 3);
      } else if (ob.type === "rail") {
        ctx.fillStyle = "#888";
        ctx.fillRect(ob.x, ob.y, ob.w, 3);
        ctx.fillRect(ob.x + 5, ob.y, 2, GROUND_Y - ob.y);
        ctx.fillRect(ob.x + ob.w - 7, ob.y, 2, GROUND_Y - ob.y);
        ctx.fillStyle = "#aaa";
        ctx.fillRect(ob.x, ob.y, ob.w, 1);
      } else if (ob.type === "combo") {
        /* Hydrant part */
        ctx.fillStyle = "#ccc";
        ctx.fillRect(ob.x + 3, ob.hy + 2, 8, 14);
        ctx.fillStyle = "#999";
        ctx.fillRect(ob.x + 1, ob.hy + 5, 12, 4);
        ctx.fillStyle = "#fff";
        ctx.fillRect(ob.x + 4, ob.hy, 6, 3);
        /* Rail part */
        var rx = ob.x + 30;
        ctx.fillStyle = "#888";
        ctx.fillRect(rx, ob.ry, ob.rw, 3);
        ctx.fillRect(rx + 5, ob.ry, 2, GROUND_Y - ob.ry);
        ctx.fillRect(rx + ob.rw - 7, ob.ry, 2, GROUND_Y - ob.ry);
        ctx.fillStyle = "#aaa";
        ctx.fillRect(rx, ob.ry, ob.rw, 1);
      }
    }

    /* Ã¢ÂÂÃ¢ÂÂ Game logic Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ */

    function jump() {
      if (!running || !onGround) return;
      skaterVY = JUMP_FORCE;
      onGround = false;
      grinding = false;
    }

    function addPoints(pts, x, y) {
      score += pts;
      floatingTexts.push({ text: "+" + pts, x: x, y: y, life: 40 });
      scoreEl.textContent = score + " / " + winScore;
      if (score >= winScore) {
        running = false;
        cancelAnimationFrame(animId);
        trackEvent(popup.id, "win", { score: score });
        setTimeout(showVictory, 400);
      }
    }

    function spawnObstacle() {
      var r = Math.random();
      if (r < 0.4) {
        obstacles.push({ type: "hydrant", x: 320, y: GROUND_Y - 18, w: 14, h: 18, scored: false });
      } else if (r < 0.75) {
        obstacles.push({ type: "rail", x: 320, y: GROUND_Y - 20, w: 70, h: 3, scored: false });
      } else {
        obstacles.push({ type: "combo", x: 320, hy: GROUND_Y - 18, ry: GROUND_Y - 22, rw: 60, w: 90, scored: false });
      }
    }

    function gameLoop() {
      if (!running) return;
      frameCount++;
      groundOffset += speed;

      /* Gravity */
      if (!onGround && !grinding) {
        skaterVY += GRAVITY;
        skaterY += skaterVY;
        if (skaterY >= GROUND_Y - SKATER_H) {
          skaterY = GROUND_Y - SKATER_H;
          skaterVY = 0;
          onGround = true;
        }
      }

      /* Spawn */
      spawnTimer++;
      if (spawnTimer >= 80) {
        spawnTimer = 0;
        spawnObstacle();
      }

      /* Move & collide */
      for (var i = obstacles.length - 1; i >= 0; i--) {
        var ob = obstacles[i];
        ob.x -= speed;
        if (ob.x + (ob.w || 60) < -10) { obstacles.splice(i, 1); continue; }

        if (ob.type === "hydrant") {
          if (!ob.scored && SKATER_X + SKATER_W > ob.x && SKATER_X < ob.x + 14) {
            if (skaterY + SKATER_H <= ob.y + 4) {
              ob.scored = true;
              addPoints(50, ob.x, ob.y - 10);
            } else if (skaterY + SKATER_H > ob.y + 2 && onGround) {
              gameOver();
              return;
            }
          }
        } else if (ob.type === "rail") {
          var railTop = ob.y;
          if (SKATER_X + SKATER_W > ob.x + 5 && SKATER_X < ob.x + ob.w - 5) {
            if (!onGround && skaterVY > 0 && skaterY + SKATER_H >= railTop - 2 && skaterY + SKATER_H <= railTop + 6) {
              skaterY = railTop - SKATER_H;
              skaterVY = 0;
              grinding = true;
              onGround = false;
              if (!ob.scored) { ob.scored = true; addPoints(100, ob.x + 20, ob.y - 15); }
            }
            if (grinding && SKATER_X + SKATER_W > ob.x && SKATER_X < ob.x + ob.w) {
              skaterY = railTop - SKATER_H;
            }
          }
          if (grinding && SKATER_X > ob.x + ob.w) { grinding = false; }
        } else if (ob.type === "combo") {
          /* Hydrant collision */
          if (SKATER_X + SKATER_W > ob.x && SKATER_X < ob.x + 14) {
            if (skaterY + SKATER_H > ob.hy + 2 && onGround) { gameOver(); return; }
          }
          /* Rail part */
          var rx = ob.x + 30;
          if (SKATER_X + SKATER_W > rx + 5 && SKATER_X < rx + ob.rw - 5) {
            if (!onGround && !grinding && skaterVY > 0 && skaterY + SKATER_H >= ob.ry - 2 && skaterY + SKATER_H <= ob.ry + 6) {
              skaterY = ob.ry - SKATER_H;
              skaterVY = 0;
              grinding = true;
              onGround = false;
              if (!ob.scored) { ob.scored = true; addPoints(150, rx + 20, ob.ry - 15); }
            }
            if (grinding) skaterY = ob.ry - SKATER_H;
          }
          if (grinding && SKATER_X > rx + ob.rw) { grinding = false; }
        }
      }

      drawFrame();
      animId = requestAnimationFrame(gameLoop);
    }

    function startRun() {
      if (running) return;
      running = true;
      score = 0;
      speed = 3;
      obstacles = [];
      spawnTimer = 0;
      floatingTexts = [];
      frameCount = 0;
      skaterY = GROUND_Y - SKATER_H;
      skaterVY = 0;
      onGround = true;
      grinding = false;
      groundOffset = 0;
      scoreEl.textContent = "0 / " + winScore;
      startBtn.disabled = true;
      victoryOverlay.classList.remove("active");
      trackEvent(popup.id, "play");
      gameLoop();
    }

    function gameOver() {
      running = false;
      cancelAnimationFrame(animId);
      if (ctx) {
        ctx.fillStyle = "rgba(255,0,0,.2)";
        ctx.fillRect(0, 0, W, H);
      }
      startBtn.disabled = false;
      startBtn.textContent = "TENTAR DE NOVO";
    }

    function showVictory() {
      box.querySelector("[data-skate-final-score]").textContent = score;
      victoryOverlay.classList.add("active");
      startBtn.disabled = false;
      startBtn.textContent = "JOGAR DE NOVO";
    }

    function initGame() {
      skaterY = GROUND_Y - SKATER_H;
      obstacles = [];
      score = 0;
      speed = 3;
      spawnTimer = 0;
      skaterVY = 0;
      onGround = true;
      grinding = false;
      groundOffset = 0;
      floatingTexts = [];
      frameCount = 0;
      scoreEl.textContent = "0 / " + winScore;
      drawFrame();
    }

    /* Ã¢ÂÂÃ¢ÂÂ Event handlers Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ */

    /* Close */
    var closeFn = function() {
      running = false;
      cancelAnimationFrame(animId);
      trackEvent(popup.id, "close");
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      document.removeEventListener("keydown", keyHandler);
    };
    backdrop.addEventListener("click", closeFn);
    box.querySelector("[data-pus-close]").addEventListener("click", function(e) {
      e.stopPropagation();
      closeFn();
    });

    /* Tap/click to jump */
    box.querySelector("[data-skate-tap]").addEventListener("click", function() {
      jump();
    });

    /* Keyboard */
    var keyHandler = function(e) {
      if (e.code === "Space" || e.key === " " || e.code === "ArrowUp" || e.key === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    document.addEventListener("keydown", keyHandler);

    /* Start button */
    startBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      startRun();
    });

    /* Unlock */
    box.querySelector("[data-skate-unlock]").addEventListener("click", function(e) {
      e.stopPropagation();
      var email = (emailInput.value || "").trim();
      if (!email || email.indexOf("@") === -1) {
        emailInput.style.borderColor = "#ef4444";
        return;
      }
      var btn = box.querySelector("[data-skate-unlock]");
      btn.disabled = true;
      btn.textContent = "...";
      var name = (nameInput.value || "").trim();
      var phone = (phoneInput.value || "").trim();
      submitLead(popup.id, email, name, phone, prize, coupon, function(ok) {
        unlocked = true;
        lockOverlay.classList.add("hidden");
        startBtn.disabled = false;
        initGame();
      });
    });

    /* Copy coupon */
    box.querySelector("[data-skate-copy]").addEventListener("click", function(e) {
      e.stopPropagation();
      copyText(coupon, this);
    });

    /* Replay from victory */
    box.querySelector("[data-skate-replay]").addEventListener("click", function(e) {
      e.stopPropagation();
      victoryOverlay.classList.remove("active");
      startRun();
    });

    /* Initial draw */
    initGame();
  }

  /* Ã¢ÂÂÃ¢ÂÂ Utilities Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ */

  function escHtml(s) {
    var d = document.createElement("div");
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  }

  function copyText(text, btn) {
    var done = function() {
      if (btn) {
        var orig = btn.textContent;
        btn.textContent = "Copiado!";
        setTimeout(function() { btn.textContent = orig; }, 1500);
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function() {
        fallbackCopy(text);
        done();
      });
    } else {
      fallbackCopy(text);
      done();
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* Ã¢ÂÂÃ¢ÂÂ Boot Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ */

  function boot() {
    var storeId = getStoreId();
    if (!storeId) return;

    injectStyles();

    fetchConfig(storeId, function(data) {
      if (!data || !data.popups || !data.popups.length) return;

      for (var i = 0; i < data.popups.length; i++) {
        var popup = data.popups[i];
        if (!popup || !popup.id) continue;
        if (wasShownRecently(popup.id)) continue;

        if (popup.game_type === "skate_grind") {
          showSkatePopup(popup);
        } else if (popup.game_type === "slot_machine") {
          showSlotMachinePopup(popup);
        } else {
          showGenericPopup(popup);
        }
        break; // Show one popup at a time
      }
    });
  }

  /* Wait for DOM */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();
