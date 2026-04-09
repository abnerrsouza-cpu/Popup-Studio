// ══════ OFICINA DE TEMPLATES ══════
(() => {
  // ── State ──
  const S = {
    bg1: '#1a0a2e', bg2: '#0a0416',
    btnColor1: '#ffd700', btnColor2: '#ff2d2d',
    titleColor: '#ffd700', badgeColor: '#ff2d2d', borderColor: '#ffd700',
    badge: 'Exclusivo', title: 'Jogue & Ganhe!',
    subtitle: 'Cadastre-se e gire a slot machine para ganhar um desconto!',
    emailPh: 'Seu e-mail', phonePh: '(11) 99999-9999',
    btnText: 'Cadastrar & Jogar', lockText: 'Cadastre-se para jogar',
    consent: 'Ao continuar, você aceita receber ofertas exclusivas.',
    couponCode: 'GANHEI15', discountType: 'percent', discountValue: '15',
    winTitle: 'Você Ganhou!', winMsg: 'Parabéns! Aqui está seu cupom exclusivo:',
    lose1: 'Quase! Tente novamente...', lose2: 'Não foi dessa vez... Última chance!',
    logoData: null, logoName: '', showLogo: false,
    emoji1: '👟', emoji2: '👕', emoji3: '🧢',
  };

  // ── Tabs ──
  document.querySelectorAll('.ed-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.ed-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.ed-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    });
  });

  // ── Color sync ──
  document.querySelectorAll('input[type="color"]').forEach(p => {
    p.addEventListener('input', () => {
      S[p.dataset.key] = p.value;
      p.closest('.color-swatch').style.backgroundColor = p.value;
      const hex = p.closest('.color-row').querySelector('.color-hex');
      if (hex) hex.value = p.value;
      render();
    });
  });
  document.querySelectorAll('.color-hex').forEach(h => {
    h.addEventListener('input', () => {
      if (/^#[0-9a-fA-F]{6}$/.test(h.value)) {
        S[h.dataset.key] = h.value;
        const swatch = h.closest('.color-row').querySelector('input[type="color"]');
        if (swatch) { swatch.value = h.value; swatch.closest('.color-swatch').style.backgroundColor = h.value; }
        render();
      }
    });
  });

  // Init swatches
  document.querySelectorAll('.color-swatch').forEach(s => {
    const inp = s.querySelector('input[type="color"]');
    if (inp) s.style.backgroundColor = inp.value;
  });

  // ── Text sync ──
  document.querySelectorAll('[data-text]').forEach(el => {
    el.addEventListener('input', () => { S[el.dataset.text] = el.value; render(); });
  });

  // ── Discount type ──
  document.getElementById('discountType').addEventListener('change', e => {
    S.discountType = e.target.value;
    document.getElementById('discountValueField').classList.toggle('hidden', e.target.value === 'frete');
    render();
  });

  // ── Logo ──
  document.getElementById('logoFile').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('Arquivo muito grande (max 2MB)'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      S.logoData = ev.target.result;
      S.logoName = file.name;
      S.showLogo = true;
      document.getElementById('showLogo').value = 'yes';
      document.getElementById('logoDrop').classList.add('hidden');
      document.getElementById('logoLoaded').classList.remove('hidden');
      document.getElementById('logoThumb').src = S.logoData;
      document.getElementById('logoName').textContent = file.name;
      render();
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('btnRemoveLogo').addEventListener('click', () => {
    S.logoData = null; S.logoName = ''; S.showLogo = false;
    document.getElementById('showLogo').value = 'no';
    document.getElementById('logoDrop').classList.remove('hidden');
    document.getElementById('logoLoaded').classList.add('hidden');
    document.getElementById('logoFile').value = '';
    render();
  });

  document.getElementById('showLogo').addEventListener('change', e => {
    S.showLogo = e.target.value === 'yes';
    render();
  });

  // ── Helpers ──
  function hexRgba(hex, a) {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  }
  function darker(hex, pct) {
    let r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    r = Math.max(0, Math.round(r*(1+pct))); g = Math.max(0, Math.round(g*(1+pct))); b = Math.max(0, Math.round(b*(1+pct)));
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  }
  function isLight(hex) {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return (r*299+g*587+b*114)/1000 > 128;
  }
  function discText() {
    if (S.discountType === 'percent') return `${S.discountValue}% de desconto em todo o site`;
    if (S.discountType === 'fixed') return `R$${S.discountValue} de desconto em todo o site`;
    return 'Frete grátis em todo o site';
  }

  // ── Render Preview ──
  function render() {
    const c = document.getElementById('previewContainer');
    const logoHtml = S.showLogo && S.logoData
      ? `<img src="${S.logoData}" style="width:46px;height:46px;object-fit:contain;border-radius:10px;margin-bottom:6px;">`
      : '';

    c.innerHTML = `
      <div style="font-family:Poppins,sans-serif;position:relative;border-radius:24px;border:2px solid ${hexRgba(S.borderColor,.2)};overflow:hidden;background:linear-gradient(170deg,${S.bg1},${S.bg2});box-shadow:0 0 60px ${hexRgba(S.borderColor,.08)};">
        <div style="position:absolute;top:12px;right:14px;width:28px;height:28px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:50%;color:rgba(255,255,255,.4);font-size:16px;display:flex;align-items:center;justify-content:center;">&times;</div>

        <div style="text-align:center;padding:20px 18px 10px;">
          ${logoHtml}
          <div style="display:inline-block;background:${S.badgeColor};color:#fff;font-size:8px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:3px 10px;border-radius:14px;margin-bottom:6px;">${S.badge.toUpperCase()}</div><br>
          <span style="font-size:22px;font-weight:900;background:linear-gradient(135deg,${S.titleColor},${darker(S.titleColor,-.15)});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">${S.title}</span>
          <p style="color:rgba(255,255,255,.5);font-size:11px;margin-top:2px;">${S.subtitle}</p>
        </div>

        <div style="padding:10px 18px 0;display:flex;gap:6px;">
          <input disabled placeholder="${S.emailPh}" style="flex:1;background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.1);border-radius:9px;padding:9px 10px;color:#fff;font-family:Poppins;font-size:11px;">
          <input disabled placeholder="${S.phonePh}" style="flex:1;background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.1);border-radius:9px;padding:9px 10px;color:#fff;font-family:Poppins;font-size:11px;">
        </div>

        <div style="padding:12px 18px 4px;">
          <div style="display:flex;justify-content:center;gap:7px;margin-bottom:8px;">
            ${Array(11).fill(0).map((_,i) => `<div style="width:5px;height:5px;border-radius:50%;background:${i%2===0?'#ffd700':'#ff2d2d'};opacity:.6;"></div>`).join('')}
          </div>

          <div style="border:3px solid ${hexRgba(S.borderColor,.25)};border-radius:16px;padding:12px 10px 8px;position:relative;">
            <div style="position:absolute;inset:0;background:rgba(10,4,22,.55);backdrop-filter:blur(2px);border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:3;">
              <div style="font-size:26px;margin-bottom:3px;">&#128274;</div>
              <div style="color:rgba(255,255,255,.7);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">${S.lockText}</div>
            </div>
            <div style="display:flex;gap:7px;justify-content:center;">
              ${[S.emoji1, S.emoji2, S.emoji3].map(e => `
                <div style="width:72px;height:80px;background:linear-gradient(180deg,#0d0618,#150b28,#0d0618);border:2px solid ${hexRgba(S.borderColor,.15)};border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:38px;">${e}</div>
              `).join('')}
            </div>
            <div style="display:flex;justify-content:center;gap:5px;margin-top:6px;">
              <div style="width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.12);"></div>
              <div style="width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.12);"></div>
              <div style="width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.12);"></div>
            </div>
          </div>
        </div>

        <div style="padding:8px 18px 16px;">
          <div style="width:100%;padding:11px;border:none;border-radius:10px;font-family:Poppins;font-size:12px;font-weight:800;color:${isLight(S.btnColor1)?'#1a0a2e':'#fff'};text-transform:uppercase;letter-spacing:1.5px;text-align:center;background:linear-gradient(135deg,${S.btnColor1},${darker(S.btnColor1,-.1)});">${S.btnText.toUpperCase()}</div>
          <p style="text-align:center;color:rgba(255,255,255,.2);font-size:8px;margin-top:6px;">${S.consent}</p>
        </div>
      </div>
    `;
  }

  // ── Save ──
  document.getElementById('btnSave').addEventListener('click', async () => {
    await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(S)
    });
    showToast('Template salvo com sucesso!');
  });

  // ── Preview fullscreen ──
  document.getElementById('btnPreview').addEventListener('click', () => {
    const w = window.open('', '_blank', 'width=500,height=700');
    w.document.write(generateEmbed());
    w.document.close();
  });

  // ── Embed ──
  document.getElementById('btnEmbed').addEventListener('click', () => {
    document.getElementById('embedCode').textContent = generateEmbed();
    document.getElementById('modalEmbed').classList.remove('hidden');
  });

  document.getElementById('btnCopyEmbed').addEventListener('click', () => {
    navigator.clipboard.writeText(document.getElementById('embedCode').textContent);
    showToast('Código copiado!');
  });

  document.getElementById('modalEmbed').addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
  });

  function generateEmbed() {
    return `<!-- PopUp Studio - Slot Machine -->
<div id="psOverlay" style="position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:99999;font-family:Poppins,sans-serif;">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<div id="psBox" style="position:relative;width:440px;max-width:95vw;max-height:96vh;overflow-y:auto;background:linear-gradient(170deg,${S.bg1},${S.bg2});border-radius:28px;border:2px solid ${hexRgba(S.borderColor,.2)};">
<button onclick="document.getElementById('psOverlay').style.display='none'" style="position:absolute;top:14px;right:16px;width:34px;height:34px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:50%;color:rgba(255,255,255,.45);font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;">&times;</button>
<div style="text-align:center;padding:22px 20px 12px;">
${S.showLogo && S.logoData ? `<img src="${S.logoData}" style="width:50px;height:50px;object-fit:contain;border-radius:10px;margin-bottom:8px;">` : ''}
<div style="display:inline-block;background:${S.badgeColor};color:#fff;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:3px 12px;border-radius:16px;margin-bottom:8px;">${S.badge.toUpperCase()}</div><br>
<span style="font-size:24px;font-weight:900;background:linear-gradient(135deg,${S.titleColor},${darker(S.titleColor,-.15)});-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${S.title}</span>
<p style="color:rgba(255,255,255,.5);font-size:12px;margin-top:3px;">${S.subtitle}</p>
</div>
<div id="psForm" style="padding:12px 20px 0;display:flex;gap:8px;">
<input type="email" id="psEmail" placeholder="${S.emailPh}" style="flex:1;background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 12px;color:#fff;font-family:Poppins;font-size:12px;outline:none;">
<input type="tel" id="psPhone" placeholder="${S.phonePh}" style="flex:1;background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 12px;color:#fff;font-family:Poppins;font-size:12px;outline:none;">
</div>
<div style="padding:14px 20px 4px;">
<div id="psMachine" style="border:3px solid ${hexRgba(S.borderColor,.25)};border-radius:18px;padding:14px 12px 10px;position:relative;">
<div id="psLock" style="position:absolute;inset:0;background:rgba(10,4,22,.6);backdrop-filter:blur(2px);border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:3;"><div style="font-size:30px;margin-bottom:4px;">&#128274;</div><div style="color:rgba(255,255,255,.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">${S.lockText}</div></div>
<div style="display:flex;gap:8px;justify-content:center;" id="psReels">
<div class="psReel" style="width:80px;height:90px;background:linear-gradient(180deg,#0d0618,#150b28,#0d0618);border:2px solid ${hexRgba(S.borderColor,.15)};border-radius:14px;overflow:hidden;"><div class="psStrip" style="display:flex;flex-direction:column;align-items:center;"></div></div>
<div class="psReel" style="width:80px;height:90px;background:linear-gradient(180deg,#0d0618,#150b28,#0d0618);border:2px solid ${hexRgba(S.borderColor,.15)};border-radius:14px;overflow:hidden;"><div class="psStrip" style="display:flex;flex-direction:column;align-items:center;"></div></div>
<div class="psReel" style="width:80px;height:90px;background:linear-gradient(180deg,#0d0618,#150b28,#0d0618);border:2px solid ${hexRgba(S.borderColor,.15)};border-radius:14px;overflow:hidden;"><div class="psStrip" style="display:flex;flex-direction:column;align-items:center;"></div></div>
</div>
<div style="display:flex;justify-content:center;gap:6px;margin-top:8px;" id="psDots"><div class="psDot" style="width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.1);border:1.5px solid rgba(255,255,255,.15);"></div><div class="psDot" style="width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.1);border:1.5px solid rgba(255,255,255,.15);"></div><div class="psDot" style="width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.1);border:1.5px solid rgba(255,255,255,.15);"></div></div>
</div>
<div id="psResult" style="text-align:center;min-height:20px;margin-top:8px;font-size:13px;"></div>
</div>
<div style="padding:10px 20px 18px;">
<button id="psRegBtn" onclick="psRegister()" style="width:100%;padding:13px;border:none;border-radius:12px;font-family:Poppins;font-size:14px;font-weight:800;color:${isLight(S.btnColor1)?'#1a0a2e':'#fff'};text-transform:uppercase;letter-spacing:1.5px;cursor:pointer;background:linear-gradient(135deg,${S.btnColor1},${darker(S.btnColor1,-.1)});">${S.btnText.toUpperCase()}</button>
<button id="psSpinBtn" onclick="psSpin()" style="display:none;width:100%;padding:13px;border:none;border-radius:12px;font-family:Poppins;font-size:14px;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:1.5px;cursor:pointer;background:linear-gradient(135deg,${S.btnColor2},${darker(S.btnColor2,-.1)});">GIRAR!</button>
<div id="psSpinInfo" style="display:none;text-align:center;color:rgba(255,255,255,.4);font-size:11px;margin-top:8px;font-weight:600;">Tentativas: <span id="psAtt" style="color:${S.titleColor};">3</span></div>
<p style="text-align:center;color:rgba(255,255,255,.25);font-size:9px;margin-top:7px;" id="psConsent">${S.consent}</p>
</div></div></div>
<script>
(function(){var ITEMS=['${S.emoji1}','${S.emoji2}','${S.emoji3}'],LOSE=[['${S.emoji1}','${S.emoji2}','${S.emoji3}'],['${S.emoji3}','${S.emoji1}','${S.emoji2}']],WIN=['${S.emoji1}','${S.emoji1}','${S.emoji1}'],att=0,spin=false;var strips=document.querySelectorAll('.psStrip'),dots=document.querySelectorAll('.psDot');function init(){strips.forEach(function(s){s.innerHTML='';for(var j=0;j<20;j++){var d=document.createElement('div');d.style.cssText='width:80px;height:90px;display:flex;align-items:center;justify-content:center;font-size:44px;flex-shrink:0;';d.textContent=ITEMS[j%3];s.appendChild(d);}s.style.transform='translateY(0)';});}init();document.getElementById('psPhone').addEventListener('input',function(e){var v=e.target.value.replace(/\\D/g,'');if(v.length>11)v=v.slice(0,11);if(v.length>7)v='('+v.slice(0,2)+') '+v.slice(2,7)+'-'+v.slice(7);else if(v.length>2)v='('+v.slice(0,2)+') '+v.slice(2);else if(v.length>0)v='('+v;e.target.value=v;});window.psRegister=function(){var em=document.getElementById('psEmail').value.trim(),ph=document.getElementById('psPhone').value.trim();if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(em)){document.getElementById('psEmail').style.borderColor='#ff4444';return;}if(ph.replace(/\\D/g,'').length<10){document.getElementById('psPhone').style.borderColor='#ff4444';return;}document.getElementById('psForm').style.display='none';document.getElementById('psConsent').style.display='none';document.getElementById('psLock').style.opacity='0';document.getElementById('psLock').style.pointerEvents='none';document.getElementById('psRegBtn').style.display='none';document.getElementById('psSpinBtn').style.display='block';document.getElementById('psSpinInfo').style.display='block';init();};window.psSpin=function(){if(spin||att>=3)return;spin=true;document.getElementById('psSpinBtn').disabled=true;document.getElementById('psResult').textContent='';var isWin=att===2,combo=isWin?WIN:LOSE[att],targets=combo.map(function(s){return ITEMS.indexOf(s);}),dur=[1600,2100,2600],cyc=[5,7,9];strips.forEach(function(s,i){var h=90,total=cyc[i]*3+targets[i],fy=-(total*h);s.style.transition='none';s.style.transform='translateY(0)';s.innerHTML='';for(var j=0;j<total+5;j++){var d=document.createElement('div');d.style.cssText='width:80px;height:90px;display:flex;align-items:center;justify-content:center;font-size:44px;flex-shrink:0;';d.textContent=ITEMS[j%3];s.appendChild(d);}s.offsetHeight;s.style.transition='transform '+dur[i]+'ms cubic-bezier(.12,.84,.35,1)';s.style.transform='translateY('+fy+'px)';});setTimeout(function(){att++;dots[att-1].style.background=isWin?'#00e676':'#ff4444';dots[att-1].style.borderColor=isWin?'#00e676':'#ff4444';document.getElementById('psAtt').textContent=3-att;if(isWin){document.getElementById('psResult').innerHTML='\\u{1F389} VOC\\u00CA GANHOU! \\u{1F389}';document.getElementById('psResult').style.color='#00e676';document.getElementById('psResult').style.fontWeight='800';setTimeout(function(){var b=document.getElementById('psBox'),o=document.createElement('div');o.style.cssText='position:absolute;inset:0;background:rgba(10,4,22,.92);backdrop-filter:blur(6px);border-radius:28px;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:20;padding:30px;';o.innerHTML='<div style="font-size:60px;margin-bottom:10px;">\\u{1F3C6}</div><h2 style="font-size:28px;font-weight:900;color:#00e676;">${S.winTitle}</h2><p style="color:rgba(255,255,255,.55);font-size:13px;margin-bottom:22px;">${S.winMsg}</p><div style="background:rgba(255,215,0,.1);border:2px dashed rgba(255,215,0,.45);border-radius:18px;padding:22px 30px;text-align:center;width:100%;max-width:300px;margin-bottom:22px;"><div style="font-size:10px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:2px;font-weight:600;margin-bottom:8px;">Seu Cupom</div><div style="font-size:34px;font-weight:900;color:#ffd700;letter-spacing:4px;margin-bottom:6px;">${S.couponCode.toUpperCase()}</div><div style="font-size:13px;color:rgba(255,255,255,.6);font-weight:600;">${discText()}</div></div><button onclick="navigator.clipboard.writeText(\\'${S.couponCode.toUpperCase()}\\');this.textContent=\\'Copiado!\\'" style="width:100%;max-width:300px;padding:14px;background:linear-gradient(135deg,#00e676,#059669);border:none;border-radius:14px;color:#fff;font-family:Poppins;font-size:14px;font-weight:700;cursor:pointer;text-transform:uppercase;letter-spacing:1px;">COPIAR CUPOM</button>';b.appendChild(o);},1200);}else{document.getElementById('psResult').textContent=att===1?'${S.lose1}':'${S.lose2}';document.getElementById('psResult').style.color='#ff6b6b';spin=false;document.getElementById('psSpinBtn').disabled=false;}},2800);};})();
<\/script>`;
  }

  // Init
  render();
})();
