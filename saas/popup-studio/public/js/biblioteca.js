// ══════ BIBLIOTECA DE JOGOS ══════
(() => {
  const GAMES = [
    {
      id: 'slot-machine',
      name: 'Slot Machine',
      icon: '🎰',
      category: 'sorte',
      conversion: '28.5%',
      tags: ['Popular', 'Alta Conversão'],
      hot: true,
      bg: 'linear-gradient(135deg, #1a0a2e, #2d1054)',
      desc: 'O clássico de Las Vegas! O cliente gira 3 rolos e precisa tirar 3 itens iguais para ganhar o cupom. Altamente viciante, cria expectativa a cada giro.',
      howItWorks: 'O visitante se cadastra com e-mail e celular. A máquina é liberada com 3 tentativas. Nas duas primeiras ele perde (itens diferentes), na terceira ganha (3 iguais). Cupom é revelado com confetti.',
      bestFor: 'Lojas de moda, calçados, acessórios. Perfeito para Black Friday e campanhas de alto tráfego.',
      metrics: { avgTime: '45s', engRate: '78%', shareRate: '12%' }
    },
    {
      id: 'roleta',
      name: 'Roleta da Sorte',
      icon: '🎡',
      category: 'sorte',
      conversion: '32.1%',
      tags: ['Mais Usado', 'Fácil'],
      hot: true,
      bg: 'linear-gradient(135deg, #0f2027, #203a43)',
      desc: 'Uma roleta colorida com fatias de diferentes prêmios (5% OFF, 10% OFF, Frete Grátis, Sem Sorte). O visitante gira e o ponteiro decide o destino.',
      howItWorks: 'Cadastro por e-mail → roda gira com animação → para num prêmio pré-configurado (você controla qual fatia "ganha"). Pode ter até 8 fatias personalizáveis.',
      bestFor: 'Qualquer e-commerce. Template mais universal e com maior taxa de conversão comprovada.',
      metrics: { avgTime: '30s', engRate: '82%', shareRate: '15%' }
    },
    {
      id: 'raspadinha',
      name: 'Raspadinha Digital',
      icon: '🎫',
      category: 'sorte',
      conversion: '26.3%',
      tags: ['Interativo', 'Mobile'],
      hot: false,
      bg: 'linear-gradient(135deg, #2d1b69, #11998e)',
      desc: 'O visitante "raspa" a tela com o dedo/mouse para revelar se ganhou um prêmio escondido. Experiência tátil que prende a atenção.',
      howItWorks: 'Após cadastro, aparece um cartão com cobertura dourada. O visitante raspa (arrasta o dedo) para revelar o resultado. Área raspada mostra o cupom ou "tente novamente".',
      bestFor: 'Campanhas de Natal, Dia dos Namorados. Excelente em mobile por usar gestos de toque.',
      metrics: { avgTime: '35s', engRate: '71%', shareRate: '9%' }
    },
    {
      id: 'aviator',
      name: 'Aviator',
      icon: '🚀',
      category: 'habilidade',
      conversion: '24.7%',
      tags: ['Trending', 'Viciante'],
      hot: true,
      bg: 'linear-gradient(135deg, #0c0c0c, #1a1a2e)',
      desc: 'Inspirado no jogo viral! Um foguete sobe e o multiplicador de desconto aumenta. O visitante precisa clicar "Resgatar" antes que o foguete exploda.',
      howItWorks: 'Cadastro → foguete decola → multiplicador sobe (1.2x, 1.5x, 2x...) → se clicar a tempo ganha o desconto multiplicado. Se não clicar, o foguete cai e perde. O desconto mínimo é garantido.',
      bestFor: 'Público jovem (18-30). Lojas de eletrônicos, games, streetwear. Gera urgência e FOMO.',
      metrics: { avgTime: '60s', engRate: '85%', shareRate: '22%' }
    },
    {
      id: 'quiz',
      name: 'Quiz de Produtos',
      icon: '❓',
      category: 'quiz',
      conversion: '22.8%',
      tags: ['Educativo', 'Qualifica Lead'],
      hot: false,
      bg: 'linear-gradient(135deg, #1e3c72, #2a5298)',
      desc: 'O visitante responde 3-5 perguntas sobre preferências de produtos. No final, recebe uma recomendação personalizada + cupom de desconto.',
      howItWorks: 'Cadastro → 3 perguntas rápidas (estilo produto, faixa de preço, ocasião) → resultado personalizado com produto recomendado + cupom. Coleta dados valiosos sobre o cliente.',
      bestFor: 'Lojas com catálogo grande. Cosméticos, suplementos, moda. Qualifica o lead com dados de preferência.',
      metrics: { avgTime: '90s', engRate: '65%', shareRate: '18%' }
    },
    {
      id: 'roda-premio',
      name: 'Roda de Prêmios',
      icon: '🏆',
      category: 'sorte',
      conversion: '29.4%',
      tags: ['Premium', 'Customizável'],
      hot: false,
      bg: 'linear-gradient(135deg, #200122, #6f0000)',
      desc: 'Versão premium da roleta com prêmios escalonados. Inclui som, partículas e animação 3D. Fatias com produtos reais da loja como prêmios.',
      howItWorks: 'Cadastro → roda gira com efeito 3D → para em fatia de prêmio (cupom, frete grátis, brinde). Pode incluir imagens de produtos reais nas fatias.',
      bestFor: 'Datas comemorativas. Lojas premium que querem passar sofisticação na experiência.',
      metrics: { avgTime: '40s', engRate: '76%', shareRate: '14%' }
    },
    {
      id: 'caca-niquel',
      name: 'Caça ao Tesouro',
      icon: '🗺️',
      category: 'habilidade',
      conversion: '21.5%',
      tags: ['Criativo', 'Envolvente'],
      hot: false,
      bg: 'linear-gradient(135deg, #3a1c71, #d76d77)',
      desc: 'O visitante tem 3 baús/caixas para abrir. Um deles esconde o cupom de desconto. Cria suspense e sensação de escolha.',
      howItWorks: 'Cadastro → 3 caixas animadas aparecem → visitante escolhe uma → animação de abertura → revela prêmio ou "tente outra". Sempre ganha na 2ª ou 3ª tentativa.',
      bestFor: 'Lojas infantis, geek, presentes. Público que gosta de mistério e descoberta.',
      metrics: { avgTime: '25s', engRate: '70%', shareRate: '8%' }
    },
    {
      id: 'memoria',
      name: 'Jogo da Memória',
      icon: '🧠',
      category: 'habilidade',
      conversion: '19.8%',
      tags: ['Divertido', 'Retenção'],
      hot: false,
      bg: 'linear-gradient(135deg, #0f0c29, #302b63)',
      desc: 'Mini jogo da memória com 6-8 cartas de produtos. O visitante precisa encontrar os pares para desbloquear o cupom. Aumenta tempo no site.',
      howItWorks: 'Cadastro → grade de cartas viradas → clica para revelar → encontra pares de produtos → ao completar, recebe o cupom. Timer opcional para criar urgência.',
      bestFor: 'Lojas que querem aumentar tempo de permanência. Bom para catálogos visuais (joias, decoração).',
      metrics: { avgTime: '120s', engRate: '58%', shareRate: '7%' }
    },
    {
      id: 'countdown',
      name: 'Countdown Mystery',
      icon: '⏰',
      category: 'urgencia',
      conversion: '31.2%',
      tags: ['FOMO', 'Urgência'],
      hot: true,
      bg: 'linear-gradient(135deg, #141e30, #243b55)',
      desc: 'Um countdown regressivo mostra um desconto misterioso que está prestes a expirar. "Cadastre-se nos próximos 2:00 min para revelar seu desconto secreto".',
      howItWorks: 'Timer começa automaticamente ao abrir → visitante vê "??% OFF" piscando → cadastra antes do tempo → revela desconto. Se não cadastrar a tempo, popup some (mas volta menor).',
      bestFor: 'Flash sales, lançamentos. Qualquer loja que queira criar senso de urgência extrema.',
      metrics: { avgTime: '15s', engRate: '88%', shareRate: '5%' }
    },
    {
      id: 'indicacao',
      name: 'Indique & Ganhe',
      icon: '👥',
      category: 'social',
      conversion: '18.4%',
      tags: ['Viral', 'Referral'],
      hot: false,
      bg: 'linear-gradient(135deg, #0b486b, #f56217)',
      desc: 'O visitante se cadastra e ganha um link exclusivo. Para cada amigo que se cadastrar pelo link, ambos ganham um cupom crescente (5%, 10%, 15%).',
      howItWorks: 'Cadastro → recebe link único → compartilha via WhatsApp/redes → cada indicação adiciona % ao cupom de ambos. Gamifica com barra de progresso e metas.',
      bestFor: 'Lojas com ticket médio alto. Estratégia de crescimento orgânico. Funciona bem com WhatsApp no Brasil.',
      metrics: { avgTime: '20s', engRate: '45%', shareRate: '62%' }
    },
    {
      id: 'pachinko',
      name: 'Pachinko Drop',
      icon: '🔵',
      category: 'sorte',
      conversion: '25.1%',
      tags: ['Visual', 'Satisfying'],
      hot: false,
      bg: 'linear-gradient(135deg, #1f1c2c, #928dab)',
      desc: 'Uma bolinha cai por pinos estilo Pachinko/Plinko e aterrissa em uma das caixas de prêmio na parte inferior. Visualmente satisfatório e hipnotizante.',
      howItWorks: 'Cadastro → solta a bolinha → ela quica pelos pinos → cai em uma caixa (5% OFF, 10% OFF, 15% OFF, Frete Grátis). Física realista com gravidade simulada.',
      bestFor: 'Público que gosta de games. Lojas de tech, esportes. Alta retenção visual.',
      metrics: { avgTime: '50s', engRate: '74%', shareRate: '16%' }
    },
    {
      id: 'gift-box',
      name: 'Presente Surpresa',
      icon: '🎁',
      category: 'sorte',
      conversion: '27.9%',
      tags: ['Simples', 'Natalino'],
      hot: false,
      bg: 'linear-gradient(135deg, #2c3e50, #e74c3c)',
      desc: 'Uma caixa de presente animada aparece com laço dourado. O visitante clica para "abrir" e uma animação revela o cupom com partículas saindo da caixa.',
      howItWorks: 'Cadastro → caixa de presente pulsa → clique para abrir → animação de tampa abrindo com partículas → cupom revelado flutuando. Simples mas com alto impacto visual.',
      bestFor: 'Natal, Dia das Mães, aniversários de loja. Extremamente simples de entender, zero fricção.',
      metrics: { avgTime: '20s', engRate: '80%', shareRate: '11%' }
    }
  ];

  // ── Render Grid ──
  function renderGames(filter = 'all', search = '') {
    const grid = document.getElementById('gamesGrid');
    const filtered = GAMES.filter(g => {
      const matchCat = filter === 'all' || g.category === filter;
      const matchSearch = !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.desc.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });

    grid.innerHTML = filtered.map(g => `
      <div class="game-card" data-id="${g.id}">
        <div class="game-card-preview" style="background:${g.bg};">
          <span>${g.icon}</span>
        </div>
        <div class="game-card-body">
          <div class="game-card-name">${g.name}</div>
          <div class="game-card-desc">${g.desc.slice(0, 100)}...</div>
          <div class="game-card-footer">
            <div class="game-card-tags">
              ${g.tags.map(t => `<span class="game-tag ${g.hot ? 'hot' : ''}">${t}</span>`).join('')}
            </div>
            <div class="game-conv">${g.conversion}</div>
          </div>
        </div>
      </div>
    `).join('');

    // Click handlers
    grid.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', () => openGameModal(card.dataset.id));
    });
  }

  // ── Modal ──
  function openGameModal(id) {
    const g = GAMES.find(x => x.id === id);
    if (!g) return;

    const modal = document.getElementById('modalGame');
    const content = document.getElementById('modalGameContent');

    content.innerHTML = `
      <div style="display:flex;gap:16px;align-items:center;margin-bottom:20px;">
        <div style="width:64px;height:64px;background:${g.bg};border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:32px;flex-shrink:0;">${g.icon}</div>
        <div>
          <h2 style="font-size:22px;font-weight:800;">${g.name}</h2>
          <div style="display:flex;gap:6px;margin-top:4px;">
            ${g.tags.map(t => `<span class="game-tag ${g.hot ? 'hot' : ''}">${t}</span>`).join('')}
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;">
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center;">
          <div style="font-size:20px;font-weight:800;color:var(--green);">${g.conversion}</div>
          <div style="font-size:10px;color:var(--text2);margin-top:2px;">Conversão</div>
        </div>
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center;">
          <div style="font-size:20px;font-weight:800;">${g.metrics.avgTime}</div>
          <div style="font-size:10px;color:var(--text2);margin-top:2px;">Tempo Médio</div>
        </div>
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center;">
          <div style="font-size:20px;font-weight:800;color:var(--accent2);">${g.metrics.engRate}</div>
          <div style="font-size:10px;color:var(--text2);margin-top:2px;">Engajamento</div>
        </div>
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center;">
          <div style="font-size:20px;font-weight:800;color:var(--pink);">${g.metrics.shareRate}</div>
          <div style="font-size:10px;color:var(--text2);margin-top:2px;">Compartilham</div>
        </div>
      </div>

      <div style="margin-bottom:20px;">
        <h4 style="font-size:14px;font-weight:700;margin-bottom:6px;">Sobre o Jogo</h4>
        <p style="font-size:13px;color:var(--text2);line-height:1.6;">${g.desc}</p>
      </div>

      <div style="margin-bottom:20px;">
        <h4 style="font-size:14px;font-weight:700;margin-bottom:6px;">Como Funciona</h4>
        <p style="font-size:13px;color:var(--text2);line-height:1.6;">${g.howItWorks}</p>
      </div>

      <div style="margin-bottom:24px;">
        <h4 style="font-size:14px;font-weight:700;margin-bottom:6px;">Ideal Para</h4>
        <p style="font-size:13px;color:var(--text2);line-height:1.6;">${g.bestFor}</p>
      </div>

      <div style="display:flex;gap:10px;">
        <button class="btn-action btn-purple" style="flex:1;" onclick="window.location.href='/oficina?game=${g.id}'">Usar Este Template</button>
        <button class="btn-action btn-outline" onclick="document.getElementById('modalGame').classList.add('hidden')">Fechar</button>
      </div>
    `;

    modal.classList.remove('hidden');
  }

  // ── Filters ──
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderGames(chip.dataset.cat, document.getElementById('searchGames').value);
    });
  });

  // ── Search ──
  document.getElementById('searchGames').addEventListener('input', e => {
    const active = document.querySelector('.filter-chip.active');
    renderGames(active ? active.dataset.cat : 'all', e.target.value);
  });

  // ── Init ──
  renderGames();

  // Close modal on background click
  document.getElementById('modalGame').addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
  });
})();
