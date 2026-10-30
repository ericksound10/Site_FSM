/* ==========================================================================
   REGISTRO DO SERVICE WORKER (PWA)
   ========================================================================== */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('PWA ativo com sucesso!', reg.scope))
      .catch(err => console.log('Erro ao registrar PWA:', err));
  });
}

document.addEventListener('DOMContentLoaded', () => {

  const URL_API = 'https://script.google.com/macros/s/AKfycbw9GP_gDhlXbhiZzYrjsnu72kJfvi1TaORanwsiV03DwHUqfTrS1PRsjobJXsOtzV_V/exec';


  /* ==========================================================================
  PROMPT DE INSTALAÇÃO SELETIVO (PWA ANDROID / IOS)
  ========================================================================== */

  // 1. Detecção moderna de iOS (inclui iPhones e iPads atualizados)
  const ehIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // Verifica se o site já está rodando instalado ("standalone")
  const jaEstaInstalado = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  // Elementos do Android
  let gatilhoInstalacao = null;
  const bannerAndroid = document.getElementById('pwa-install-banner');
  const btnInstalarAndroid = document.getElementById('btn-pwa-instalar');
  const btnFecharAndroid = document.getElementById('btn-pwa-fechar');

  // Elementos do iOS
  const bannerIOS = document.getElementById('pwa-ios-banner');
  const btnFecharIOS = document.getElementById('btn-ios-fechar');

  /* --- LOGICA PARA ANDROID / PC --- */
  if (!ehIOS) {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      gatilhoInstalacao = e;

      // Só mostra se o morador não tiver recusado o banner do Android e o app não estiver instalado
      if (localStorage.getItem('pwa-banner-recusado') !== 'sim' && !jaEstaInstalado) {
        if (bannerAndroid) bannerAndroid.style.display = 'flex';
      }
    });

    // Proteção: Garante que o evento só roda se o botão realmente existir na página HTML
    if (btnInstalarAndroid) {
      btnInstalarAndroid.addEventListener('click', async () => {
        if (!gatilhoInstalacao) return;
        gatilhoInstalacao.prompt();
        const { outcome } = await gatilhoInstalacao.userChoice;
        console.log(`Usuário escolheu instalação: ${outcome}`);
        gatilhoInstalacao = null;
        if (bannerAndroid) bannerAndroid.style.display = 'none';
      });
    }

    if (btnFecharAndroid) {
      btnFecharAndroid.addEventListener('click', () => {
        if (bannerAndroid) bannerAndroid.style.display = 'none';
        localStorage.setItem('pwa-banner-recusado', 'sim');
      });
    }
  }

  /* --- LÓGICA PARA IPHONE / IOS --- */
  if (ehIOS && !jaEstaInstalado) {
    // Só exibe o passo a passo se o morador não tiver fechado ele antes
    if (localStorage.getItem('pwa-ios-recusado') !== 'sim') {
      if (bannerIOS) bannerIOS.style.display = 'flex';
    }

    if (btnFecharIOS) {
      btnFecharIOS.addEventListener('click', () => {
        if (bannerIOS) bannerIOS.style.display = 'none';
        localStorage.setItem('pwa-ios-recusado', 'sim');
      });
    }
  }

  // Garante que os banners sumam e limpa o localStorage se o app for instalado
  window.addEventListener('appinstalled', () => {
    if (bannerAndroid) bannerAndroid.style.display = 'none';
    if (bannerIOS) bannerIOS.style.display = 'none';
    gatilhoInstalacao = null;
    // Reseta as recusas caso o usuário limpe o app e volte ao site futuramente
    localStorage.removeItem('pwa-banner-recusado');
    localStorage.removeItem('pwa-ios-recusado');
  });

  /* 1. MENU HAMBÚRGUER (MOBILE) */
  const burgerBtn = document.getElementById('burger-btn');
  const mobileNav = document.getElementById('mobile-nav');

  if (burgerBtn && mobileNav) {
    burgerBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      mobileNav.classList.toggle('hidden');
    });

    const mobileLinks = mobileNav.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.add('hidden');
      });
    });

    document.addEventListener('click', (event) => {
      if (!mobileNav.contains(event.target) && !burgerBtn.contains(event.target)) {
        mobileNav.classList.add('hidden');
      }
    });
  }

  /* ==========================================================================
      2. FUNÇÃO PARA CONSULTAR A API (GOOGLE SHEETS)
      ========================================================================== */

  function consultarAPI(tipo) {
    return new Promise((resolve, reject) => {
      const separador = URL_API.includes('?') ? '&' : '?';
      const urlCompleta = `${URL_API}${separador}tipo=${encodeURIComponent(tipo)}&_=${Date.now()}`;

      // Configura um tempo limite de 15 segundos para a requisição
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      fetch(urlCompleta, { signal: controller.signal })
        .then(resposta => {
          clearTimeout(timeoutId);
          if (!resposta.ok) {
            throw new Error('Erro na resposta do servidor.');
          }
          return resposta.json();
        })
        .then(respostaJSON => {
          if (!respostaJSON || respostaJSON.sucesso !== true) {
            reject(new Error(respostaJSON?.erro || 'Resposta inválida da API.'));
            return;
          }
          resolve(respostaJSON.dados);
        })
        .catch(erro => {
          clearTimeout(timeoutId);
          console.error('Erro na requisição da API:', tipo, erro);
          reject(new Error('Não foi possível carregar a API.'));
        });
    });
  }

  function ajustarLinkImagem(url) {
    if (!url || typeof url !== 'string') {
      return '';
    }

    const link = url.trim();

    // Identifica links de arquivos do Google Drive
    const driveMatch = link.match(
      /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?.*?id=|thumbnail\?id=)([^/&?]+)/
    );

    if (driveMatch) {
      const idArquivo = driveMatch[1];

      return `https://drive.google.com/thumbnail?id=${idArquivo}&sz=w1000`;
    }

    // Mantém URLs de imagens hospedadas em outros serviços
    return link;
  }


  /* SISTEMA DE BANNERS DINÂMICOS — GOOGLE SHEETS */
  async function carregarBannersDinamicos() {
    const carrosselContainer = document.querySelector('.carrossel-container');
    if (!carrosselContainer) return;

    const indicadoresContainer = document.querySelector('.carrossel-indicadores');

    try {
      const dados = await consultarAPI('banners');

      // Limpa os banners dinâmicos anteriores
      carrosselContainer
        .querySelectorAll('.slide[data-dinamico="true"]')
        .forEach(slide => slide.remove());

      // LIMPA COMPLETAMENTE AS BOLINHAS ANTERIORES PARA RECONSTRUIR DO ZERO
      if (indicadoresContainer) {
        indicadoresContainer.innerHTML = '';

        // Cria a bolinha para o slide FIXO de Boas-Vindas que já está no HTML
        const bolinhaFixa = document.createElement('div');
        bolinhaFixa.className = 'indicador ativo'; // Começa ativa porque o slide de boas-vindas é o primeiro
        indicadoresContainer.appendChild(bolinhaFixa);
      }

      dados.forEach(item => {
        const {
          data,
          data_expiracao,
          somente_imagem,
          titulo,
          subtitulo,
          botaoTexto,
          linkDestino,
          imagemUrl
        } = item;

        const novoSlide = document.createElement('div');
        novoSlide.className = 'slide';
        novoSlide.dataset.dinamico = 'true';

        // Torna o banner inteiro clicável
        const destinoOriginal = String(
          item.linkDestino || item.link_destino || ''
        ).trim();

        if (destinoOriginal) {
          novoSlide.style.cursor = 'pointer';

          novoSlide.addEventListener('click', (evento) => {

            // Não interfere no clique do botão interno
            if (evento.target.closest('a, button')) return;

            const destino = destinoOriginal
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '');

            window.location.href = destino
              ? `noticias.html#${encodeURIComponent(destino)}`
              : 'noticias.html';
          });
        }

        const fundo = document.createElement('div');
        fundo.className = 'slide-background';

        if (imagemUrl) {
          const img = document.createElement('img');

          img.src = ajustarLinkImagem(imagemUrl);
          img.alt = titulo || "Banner Condomínio";
          img.style.cursor = 'zoom-in';

          fundo.appendChild(img);
        }
        novoSlide.appendChild(fundo);

        // LÓGICA DO "SOMENTE IMAGEM": Só gera o texto se o campo não indicar que é apenas imagem
        const condicoesImagem = ['sim', 'true', 'x', 's'];
        const ehSomenteImagem = condicoesImagem.includes(somente_imagem);

        // SE FOR APENAS IMAGEM, ADICIONA UMA CLASSE EXCLUSIVA DE ESTILO
        if (ehSomenteImagem) {
          novoSlide.classList.add('slide-somente-imagem');
        }

        if (!ehSomenteImagem) {
          const conteudo = document.createElement('div');
          conteudo.className = 'slide-conteudo';

          const etiqueta = document.createElement('small');
          etiqueta.className = 'tag-financeiro';
          etiqueta.textContent = data;

          const tituloEl = document.createElement('h2');
          tituloEl.textContent = titulo;

          const subtituloEl = document.createElement('p');
          subtituloEl.textContent = subtitulo;

          const link = document.createElement('a');
          link.className = 'btn-slide-noticia';



          link.textContent = (botaoTexto || 'Saiba Mais') + ' ';

          const icone = document.createElement('i');
          icone.className = 'fa fa-arrow-right';
          link.appendChild(icone);

          conteudo.append(etiqueta, tituloEl, subtituloEl, link);
          novoSlide.appendChild(conteudo);
        }

        const elementoAlvo =
          carrosselContainer.querySelector('.carrossel-progresso') ||
          carrosselContainer.querySelector('.barra-progresso');

        if (elementoAlvo && elementoAlvo.parentNode === carrosselContainer) {
          carrosselContainer.insertBefore(novoSlide, elementoAlvo);
        } else {
          carrosselContainer.appendChild(novoSlide);
        }

        if (indicadoresContainer) {
          const bolinha = document.createElement('div');
          bolinha.className = 'indicador';
          bolinha.dataset.dinamico = 'true';
          indicadoresContainer.appendChild(bolinha);
        }
      });

      reiniciarLogicaCarrossel();

    } catch (erro) {
      console.error('Erro ao carregar banners dinâmicos:', erro);
      reiniciarLogicaCarrossel();
    }
  }

  function criarModalZoom() {
    let modal = document.getElementById('modal-imagem');

    // Se já existir no HTML, reutiliza
    if (modal) return modal;

    // Cria o modal automaticamente
    modal = document.createElement('div');
    modal.id = 'modal-imagem';
    modal.className = 'modal-imagem';

    const fechar = document.createElement('span');
    fechar.className = 'botao-fechar-modal';
    fechar.innerHTML = '&times;';

    const wrapper = document.createElement('div');
    wrapper.className = 'modal-conteudo-wrapper';

    const img = document.createElement('img');
    img.id = 'img-ampliada';

    const legenda = document.createElement('div');
    legenda.id = 'modal-legenda';

    wrapper.append(img, legenda);
    modal.append(fechar, wrapper);

    document.body.appendChild(modal);

    return modal;
  }


  // Abre o modal com a imagem selecionada
  function abrirModalZoom(img) {
    const modal = criarModalZoom();

    const modalImg = modal.querySelector('#img-ampliada');
    const legendaTexto = modal.querySelector('#modal-legenda');

    modalImg.src = img.src;
    modalImg.alt = img.alt;
    legendaTexto.textContent = img.alt;

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }


  // Fecha o modal
  function fecharOModal() {
    const modal = document.getElementById('modal-imagem');

    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }

  /* ==========================================================================
   3. SISTEMA DE MURAL DE NOTÍCIAS
   ========================================================================== */
  async function carregarMuralNoticias() {
    const containerHomeResumo = document.getElementById('noticias-resumo-home');
    const containerMuralCompleto = document.getElementById('mural-noticias-completo');

    if (!containerHomeResumo && !containerMuralCompleto) return;

    try {
      let dados = await consultarAPI('noticias');

      // Ordena de forma inteligente: da data mais recente para a mais antiga
      dados.sort((a, b) => {
        // Função interna para transformar DD/MM/AAAA em um objeto Date comparável
        const converterData = (stringData) => {
          if (!stringData) return new Date(0);
          const partes = stringData.split('/');
          return new Date(partes[2], partes[1] - 1, partes[0]);
        };

        return converterData(b.data) - converterData(a.data);
      });

      console.log('NOTÍCIAS RECEBIDAS:', dados);
      console.log('CONTÊINER DOS CARDS:', containerHomeResumo);

      if (containerHomeResumo) {
        containerHomeResumo.innerHTML = '';
      }

      if (containerMuralCompleto) {
        containerMuralCompleto.innerHTML = '';
      }

      dados.forEach(item => {
        const {
          data,
          categoria,
          titulo,
          textoCompleto,
          linkDestino,
          imagemUrl
        } = item;

        const destinoOriginal = String(item.linkDestino || item.link_destino || '').trim();
        const destino = destinoOriginal
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        if (containerHomeResumo) {
          const card = document.createElement('div');
          card.className = 'card revelar-ao-scroll';

          const badge = document.createElement('span');
          badge.className = 'badge-categoria';
          badge.textContent = categoria;

          const tituloEl = document.createElement('h3');
          tituloEl.textContent = titulo;

          const dataEl = document.createElement('div');
          dataEl.className = 'data-publicacao';

          const iconeData = document.createElement('i');
          iconeData.className = 'fa fa-calendar';

          dataEl.append(iconeData, document.createTextNode(' Postado em ' + data));

          const resumo = document.createElement('p');
          resumo.textContent = textoCompleto.length > 130
            ? textoCompleto.substring(0, 130) + '...'
            : textoCompleto;

          const link = document.createElement('a');
          link.href = destino ? `noticias.html#${encodeURIComponent(destino)}` : 'noticias.html';
          link.className = 'btn-acao';
          link.textContent = 'Leia a matéria completa';

          card.append(badge, tituloEl, dataEl, resumo, link);
          containerHomeResumo.appendChild(card);
        }

        if (containerMuralCompleto) {
          const artigo = document.createElement('article');
          artigo.className = 'card-noticia-longa revelar-ao-scroll';
          artigo.id = destino;

          console.log('Notícia criada:', { titulo: item.titulo, destinoOriginal, idFinal: artigo.id, linkDestino });

          const meta = document.createElement('div');
          meta.className = 'meta-noticia';

          const badge = document.createElement('span');
          badge.className = 'badge-categoria';
          badge.textContent = categoria;

          const dataEl = document.createElement('div');
          dataEl.className = 'data-publicacao';

          const iconeData = document.createElement('i');
          iconeData.className = 'fa fa-calendar';

          dataEl.append(iconeData, document.createTextNode(' ' + data));
          meta.append(badge, dataEl);

          const tituloEl = document.createElement('h3');
          tituloEl.textContent = titulo;

          const texto = document.createElement('div');
          texto.className = 'texto-completo';

          const paragrafo = document.createElement('p');
          paragrafo.textContent = textoCompleto;
          texto.appendChild(paragrafo);

          if (imagemUrl) {
            const img = document.createElement('img');

            img.src = ajustarLinkImagem(imagemUrl);
            img.alt = titulo || "Imagem da notícia";
            img.style.cursor = 'zoom-in';

            texto.appendChild(img);
          }

          artigo.append(meta, tituloEl, texto);
          containerMuralCompleto.appendChild(artigo);
        }
      });

      document.dispatchEvent(new Event('noticiasCarregadas'));

      if (typeof revinculacaoScrollReveal === 'function') {
        revinculacaoScrollReveal();
      }

      if (typeof vincularModalZoomNoticias === 'function') {
        vincularModalZoomNoticias();
      }

      navegarAteNoticia();

    } catch (erro) {
      console.error('Erro ao carregar mural de notícias:', erro);
    }
  }

  function navegarAteNoticia() {
    function obterIdDaUrl() {
      try {
        return decodeURIComponent(
          window.location.hash.slice(1)
        ).trim();
      } catch {
        return window.location.hash.slice(1).trim();
      }
    }

    function localizarNoticia() {
      const idNoticia = obterIdDaUrl();

      if (!idNoticia) return false;

      const noticia = document.getElementById(idNoticia);

      if (!noticia) return false;

      noticia.scrollIntoView({
        behavior: 'auto',
        block: 'start'
      });

      return true;
    }

    // Tenta encontrar a notícia imediatamente.
    if (localizarNoticia()) return;

    // Se a API ainda não terminou, aguarda o evento.
    document.addEventListener(
      'noticiasCarregadas',
      () => {
        // Aguarda o navegador atualizar o DOM.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!localizarNoticia()) {
              console.warn(
                'Notícia não encontrada para o link:',
                window.location.hash
              );
            }
          });
        });
      },
      { once: true }
    );
  }

  function revinculacaoScrollReveal() {
    const elementos = document.querySelectorAll(
      '.revelar-ao-scroll:not(.visivel)'
    );

    if (!('IntersectionObserver' in window)) {
      elementos.forEach(elemento => {
        elemento.classList.add('visivel');
      });
      return;
    }

    const observer = new IntersectionObserver((entradas, observador) => {
      entradas.forEach(entrada => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('visivel');
          observador.unobserve(entrada.target);
        }
      });
    }, {
      threshold: 0.1
    });

    elementos.forEach(elemento => observer.observe(elemento));
  }

  /* ==========================================================================
   REINICIALIZADORES AUXILIARES DO CARROSSEL
  ========================================================================== */
  let slideAtual = 0;
  let tempoSlide = null;

  let carrosselPausado = false;
  let inicioContagem = 0;
  let tempoRestante = 6000;

  function reiniciarLogicaCarrossel() {
    const carrossel = document.querySelector('.carrossel-container');
    if (!carrossel) return;

    const slides = carrossel.querySelectorAll('.slide');
    const indicadores = document.querySelectorAll('.carrossel-indicadores .indicador');
    const barraProgresso = carrossel.querySelector('.barra-progresso');

    if (slides.length === 0) return;

    clearTimeout(tempoSlide);

    slideAtual = Math.min(slideAtual, slides.length - 1);
    carrosselPausado = false;
    tempoRestante = 6000;

    function mostrarSlide(index) {
      slides.forEach(slide => slide.classList.remove('ativo'));
      indicadores.forEach(ind => ind.classList.remove('ativo'));

      slideAtual = index;

      slides[slideAtual].classList.add('ativo');

      if (indicadores[slideAtual]) {
        indicadores[slideAtual].classList.add('ativo');
      }

      tempoRestante = 6000;
      iniciarContagem();
    }

    function proximoSlide() {
      const proximo = (slideAtual + 1) % slides.length;
      mostrarSlide(proximo);
    }

    function iniciarContagem() {
      clearTimeout(tempoSlide);

      if (carrosselPausado) return;

      if (barraProgresso) {
        barraProgresso.style.transition = 'none';

        const larguraAtual = 100 * (1 - tempoRestante / 6000);
        barraProgresso.style.width = larguraAtual + '%';

        barraProgresso.offsetHeight;

        barraProgresso.style.transition =
          `width ${tempoRestante}ms linear`;

        barraProgresso.style.width = '100%';
      }

      inicioContagem = Date.now();

      tempoSlide = setTimeout(proximoSlide, tempoRestante);
    }

    function pausarCarrossel() {
      if (carrosselPausado) return;

      carrosselPausado = true;

      const decorrido = Date.now() - inicioContagem;
      tempoRestante = Math.max(0, tempoRestante - decorrido);

      clearTimeout(tempoSlide);

      if (barraProgresso) {
        const largura = getComputedStyle(barraProgresso).width;
        barraProgresso.style.transition = 'none';
        barraProgresso.style.width = largura;
      }
    }

    function retomarCarrossel() {
      if (!carrosselPausado) return;

      carrosselPausado = false;

      if (tempoRestante <= 0) {
        proximoSlide();
      } else {
        iniciarContagem();
      }
    }

    // Indicadores de navegação manual
    indicadores.forEach((indicador, index) => {
      indicador.onclick = () => {
        if (index !== slideAtual) {
          mostrarSlide(index);
        }
      };
    });

    // Desktop: pausa ao passar o mouse
    // Evita registrar os mesmos eventos novamente
    if (!carrossel.dataset.eventosPausa) {

      carrossel.addEventListener('mouseenter', pausarCarrossel);
      carrossel.addEventListener('mouseleave', retomarCarrossel);

      // Celular: pausa enquanto mantém o dedo pressionado
      carrossel.addEventListener('touchstart', pausarCarrossel, {
        passive: true
      });

      document.addEventListener('touchend', retomarCarrossel, {
        passive: true
      });

      document.addEventListener('touchcancel', retomarCarrossel, {
        passive: true
      });

      carrossel.dataset.eventosPausa = 'true';
    }

    mostrarSlide(slideAtual);
  }

  /* 3. EFEITOS DE ROLAGEM (SCROLL REVEAL) */
  const opcoesEfeito = {
    root: null,
    threshold: 0.12,
    rootMargin: "0px 0px -50px 0px"
  };

  const observadorDeScroll = new IntersectionObserver((entradas, observador) => {
    entradas.forEach(entrada => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('visivel');
        observador.unobserve(entrada.target);
      }
    });
  }, opcoesEfeito);

  const elementosParaRevelar = document.querySelectorAll('.revelar-ao-scroll');
  elementosParaRevelar.forEach(elemento => {
    observadorDeScroll.observe(elemento);
  });

  /* 4. MODAL DE ZOOM PARA IMAGENS DAS NOTÍCIAS */
  document.addEventListener('click', (evento) => {

    // Clique no botão de fechar
    if (evento.target.closest('.botao-fechar-modal')) {
      fecharOModal();
      return;
    }

    // Verifica se clicou em uma imagem ampliável
    const img = evento.target.closest(
      '.texto-completo img, .slide[data-dinamico="true"] .slide-background img'
    );

    if (img) {
      evento.preventDefault();
      evento.stopPropagation();

      abrirModalZoom(img);
      return;
    }

    // Fecha ao clicar no fundo escuro
    const modal = document.getElementById('modal-imagem');

    if (modal && evento.target === modal) {
      fecharOModal();
    }
  });

  // Fecha com a tecla ESC
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
      fecharOModal();
    }
  });

  /* 5. MODAL DE INSTRUÇÕES (KIT DE BOAS-VINDAS) */
  const modalInstrucoes = document.getElementById('modal-instrucoes');
  const btnAbrirInstrucoes = document.getElementById('btn-abrir-instrucoes');
  const btnFecharInstrucoes = document.querySelector('.botao-fechar-instrucoes');

  if (btnAbrirInstrucoes && modalInstrucoes) {
    btnAbrirInstrucoes.addEventListener('click', () => {
      modalInstrucoes.showModal();
      document.body.style.overflow = 'hidden';
    });

    const fecharInstrucoes = () => {
      modalInstrucoes.close();
      document.body.style.overflow = 'auto';
    };

    if (btnFecharInstrucoes) btnFecharInstrucoes.addEventListener('click', fecharInstrucoes);

    modalInstrucoes.addEventListener('click', (event) => {
      if (event.target === modalInstrucoes) fecharInstrucoes();
    });
  }

  /* 5.2. MODAL DE ENCOMENDAS */
  const modalEncomendas = document.getElementById('modal-encomendas');
  const btnAbrirEncomendas = document.getElementById('btn-abrir-encomendas');
  const btnsFecharEncomendas = document.querySelectorAll('.botao-fechar-encomendas');

  if (btnAbrirEncomendas && modalEncomendas) {
    // Abre o modal de encomendas
    btnAbrirEncomendas.addEventListener('click', () => {
      modalEncomendas.showModal();
      document.body.style.overflow = 'hidden'; // Trava o scroll da página
    });

    // Função para fechar o modal
    const fecharEncomendas = () => {
      modalEncomendas.close();
      document.body.style.overflow = 'auto'; // Libera o scroll da página
    };

    // Vincula o evento a todos os botões com a classe fechar (o 'X' e o botão do footer)
    btnsFecharEncomendas.forEach(btn => {
      btn.addEventListener('click', fecharEncomendas);
    });

    // Fecha se o morador clicar na parte escura (fora do modal)
    modalEncomendas.addEventListener('click', (event) => {
      if (event.target === modalEncomendas) {
        fecharEncomendas();
      }
    });
  }

  /* 6. ENVIO DO FORMULÁRIO FALE CONOSCO */
  const form = document.getElementById('fale-conosco-form');
  if (form) {
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const originalText = submitBtn.textContent;

      submitBtn.textContent = "Enviando...";
      submitBtn.disabled = true;

      try {
        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          body: formData
        });
        const data = await response.json();

        if (response.ok) {
          alert("Sucesso! Sua mensagem foi enviada.");
          form.reset();
        } else {
          alert("Erro: " + data.message);
        }
      } catch (error) {
        alert("Algo deu errado. Por favor, tente novamente.");
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  /* 7. MODO ESCURO (DARK MODE) */
  const btnDarkDesktop = document.getElementById('btn-dark-desktop');
  const btnDarkMobile = document.getElementById('btn-dark-mobile');

  function alternarModoEscuro() {
    const estaNoModoEscuro = document.body.classList.toggle('dark-mode');
    localStorage.setItem('modo-escuro', estaNoModoEscuro ? 'ativado' : 'desativado');
    atualizarInterfaceDark(estaNoModoEscuro);
  }

  function atualizarInterfaceDark(ativo) {
    [btnDarkDesktop, btnDarkMobile].forEach(btn => {
      if (btn) {
        const icone = btn.querySelector('i');
        if (icone) {
          icone.className = ativo ? 'fa fa-sun-o' : 'fa fa-moon-o';
        }
      }
    });
  }

  if (btnDarkDesktop) btnDarkDesktop.addEventListener('click', alternarModoEscuro);
  if (btnDarkMobile) btnDarkMobile.addEventListener('click', alternarModoEscuro);

  // Carrega a preferência salva do usuário
  if (localStorage.getItem('modo-escuro') === 'ativado') {
    document.body.classList.add('dark-mode');
    atualizarInterfaceDark(true);
  }

  /* 8. CONTROLE DA BARRA INFERIOR (MOBILE APP) AO ROLARA TELA */
  const barraInferior = document.querySelector('.barra-inferior-app');

  if (barraInferior) {
    const verificarTopo = () => {
      if (window.scrollY === 0) {
        barraInferior.classList.add('no-topo');
      } else {
        barraInferior.classList.remove('no-topo');
      }
    };

    window.addEventListener('scroll', verificarTopo);
    verificarTopo();
  }

  /* 9. PROTEÇÃO DE DOCUMENTOS POR SENHA GLOBAL */
  // Senha de acesso para os moradores do condomínio 
  const SENHA_CONDOMINIO = "Morador2026!";

  // Seleciona todos os links ou botões que possuem o atributo de proteção 
  const documentosProtegidos = document.querySelectorAll('[data-protegido="true"]');

  documentosProtegidos.forEach(botao => {
    botao.addEventListener('click', (event) => {
      // 1. Interrompe o download imediato do PDF
      event.preventDefault();

      const urlDocumento = botao.getAttribute('href');

      const senhaDigitada = prompt("Aviso de Segurança:\nEste documento é confidencial para moradores.\n\nPor favor, digite a senha do condomínio para baixar:");

      // 3. Validação da senha
      if (senhaDigitada === null) {
        return;
      }

      if (senhaDigitada === SENHA_CONDOMINIO) {
        //alert("Senha correta! O download do seu documento começará agora.");

        // Abre o documento
        window.open(urlDocumento, botao.getAttribute('target') || '_self');
      } else {
        alert("Senha incorreta! Acesso negado aos documentos internos.");
      }
    });
  });

  /* ==========================================================================
     10. SOLICITAÇÃO DE PERMISSÃO PARA NOTIFICAÇÕES (PWA)
     ========================================================================== */
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log('O morador aceitou receber notificações!');
      }
    });
  }

  /* ==========================================================================
     11. SISTEMA DE BUSCA DINÂMICA NO MURAL DE NOTÍCIAS
     ========================================================================== */
  const inputBusca = document.getElementById('input-busca-noticias');

  if (inputBusca) {
    inputBusca.addEventListener('input', () => {

      const termoBusca = inputBusca.value.toLowerCase().trim();
      const cardsNoticias = document.querySelectorAll('#mural-noticias-completo .card-noticia-longa');

      cardsNoticias.forEach(card => {
        // Captura os textos internos do card para pesquisa
        const titulo = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const texto = card.querySelector('.texto-completo')?.textContent.toLowerCase() || '';
        const categoria = card.querySelector('.badge-categoria')?.textContent.toLowerCase() || '';

        // Se o termo estiver no título, no texto ou na categoria, mantém visível
        if (titulo.includes(termoBusca) || texto.includes(termoBusca) || categoria.includes(termoBusca)) {
          card.style.display = 'block'; // Mostra o card
        } else {
          card.style.display = 'none';  // Esconde o card
        }
      });
    });
  }

  /* ==========================================================================
   12. SISTEMA DE BUSCA DINÂMICA NO REGIMENTO INTERNO
   ========================================================================== */

  const inputBuscaRegras = document.getElementById('input-busca-regras');

  if (inputBuscaRegras) {

    const removerAcentos = (texto) =>
      texto.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    // Guarda o HTML original sem perder a estrutura
    const elementosOriginais = new WeakMap();

    function salvarOriginal(elemento) {
      if (!elementosOriginais.has(elemento)) {
        elementosOriginais.set(elemento, elemento.cloneNode(true));
      }
    }

    // Restaura o conteúdo original
    function restaurarOriginal(elemento) {
      const original = elementosOriginais.get(elemento);

      if (original) {
        elemento.replaceChildren(
          ...Array.from(original.cloneNode(true).childNodes)
        );
      }
    }

    // Destaca somente os nós de texto, preservando HTML e ícones
    function destacarTexto(elemento, termo) {

      const walker = document.createTreeWalker(
        elemento,
        NodeFilter.SHOW_TEXT
      );

      const nos = [];

      while (walker.nextNode()) {
        nos.push(walker.currentNode);
      }

      const termoNormalizado = removerAcentos(termo);

      nos.forEach(no => {

        const texto = no.nodeValue;
        const textoNormalizado = removerAcentos(texto);

        if (!textoNormalizado.includes(termoNormalizado)) return;

        const fragmento = document.createDocumentFragment();

        let inicio = 0;

        while (inicio < texto.length) {

          let posicao = -1;
          let fim = -1;

          for (let i = inicio; i < texto.length; i++) {

            for (let j = i + 1; j <= texto.length; j++) {

              if (
                removerAcentos(texto.slice(i, j)) ===
                termoNormalizado
              ) {
                posicao = i;
                fim = j;
                break;
              }
            }

            if (posicao !== -1) break;
          }

          if (posicao === -1) {
            fragmento.appendChild(
              document.createTextNode(texto.slice(inicio))
            );
            break;
          }

          fragmento.appendChild(
            document.createTextNode(texto.slice(inicio, posicao))
          );

          const marca = document.createElement('mark');
          marca.className = 'foco-busca';
          marca.textContent = texto.slice(posicao, fim);

          fragmento.appendChild(marca);

          inicio = fim;
        }

        no.parentNode.replaceChild(fragmento, no);
      });
    }

    inputBuscaRegras.addEventListener('input', () => {

      const termoBusca = inputBuscaRegras.value.trim();
      const termoNormalizado = removerAcentos(termoBusca);

      const cardsRegras = document.querySelectorAll(
        '.grid-cards-regras > .card-texto-longo'
      );

      cardsRegras.forEach(card => {

        const elementosTexto = card.querySelectorAll(
          'h3, h4, p, li, span, strong'
        );

        let encontrouNoCard = false;

        elementosTexto.forEach(elemento => {

          salvarOriginal(elemento);
          restaurarOriginal(elemento);

          const texto = removerAcentos(elemento.textContent);

          if (termoNormalizado === '') return;

          if (texto.includes(termoNormalizado)) {

            encontrouNoCard = true;

            destacarTexto(elemento, termoBusca);
          }
        });

        card.style.display =
          termoNormalizado === '' || encontrouNoCard
            ? ''
            : 'none';
      });

    });
  }

  const inputBuscaBairro = document.getElementById('input-busca-bairro');

  if (inputBuscaBairro) {

    const removerAcentos = (texto) =>
      texto.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    // Guarda o conteúdo original de cada elemento
    const elementosOriginais = new WeakMap();

    function salvarOriginal(elemento) {
      if (!elementosOriginais.has(elemento)) {
        elementosOriginais.set(elemento, elemento.cloneNode(true));
      }
    }

    // Restaura o HTML original sem perder atributos
    function restaurarOriginal(elemento) {
      const original = elementosOriginais.get(elemento);

      if (original) {
        elemento.replaceChildren(
          ...Array.from(original.cloneNode(true).childNodes)
        );
      }
    }

    // Destaca apenas textos, preservando tags e ícones
    function destacarTexto(elemento, termo) {

      const walker = document.createTreeWalker(
        elemento,
        NodeFilter.SHOW_TEXT
      );

      const nos = [];

      while (walker.nextNode()) {
        nos.push(walker.currentNode);
      }

      nos.forEach(no => {

        const texto = no.nodeValue;
        const textoNormalizado = removerAcentos(texto);
        const termoNormalizado = removerAcentos(termo);

        if (!textoNormalizado.includes(termoNormalizado)) return;

        const fragmento = document.createDocumentFragment();

        let inicio = 0;

        // Localiza as ocorrências preservando os acentos originais
        while (inicio < texto.length) {

          let posicao = -1;
          let fim = -1;

          for (let i = inicio; i < texto.length; i++) {

            for (let j = i + 1; j <= texto.length; j++) {

              if (
                removerAcentos(texto.slice(i, j)) ===
                termoNormalizado
              ) {
                posicao = i;
                fim = j;
                break;
              }
            }

            if (posicao !== -1) break;
          }

          if (posicao === -1) {
            fragmento.appendChild(
              document.createTextNode(texto.slice(inicio))
            );
            break;
          }

          fragmento.appendChild(
            document.createTextNode(texto.slice(inicio, posicao))
          );

          const marca = document.createElement('mark');
          marca.className = 'foco-busca';
          marca.textContent = texto.slice(posicao, fim);

          fragmento.appendChild(marca);

          inicio = fim;
        }

        no.parentNode.replaceChild(fragmento, no);
      });
    }

    inputBuscaBairro.addEventListener('input', () => {

      const termoBusca = inputBuscaBairro.value.trim();
      const termoNormalizado = removerAcentos(termoBusca);

      const cardsLocais = document.querySelectorAll(
        'main div, article div, main section, .card, .local'
      );

      cardsLocais.forEach(card => {

        const tituloLocal = card.querySelector('h3, h4');
        if (!tituloLocal) return;

        const elementosTexto = card.querySelectorAll(
          'h3, h4, p, span, li'
        );

        let encontrouNoCard = false;

        elementosTexto.forEach(elemento => {

          salvarOriginal(elemento);
          restaurarOriginal(elemento);

          const textoPuro = removerAcentos(
            elemento.textContent
          );

          if (termoNormalizado === '') return;

          if (textoPuro.includes(termoNormalizado)) {

            encontrouNoCard = true;

            destacarTexto(elemento, termoBusca);
          }
        });

        if (
          termoNormalizado === '' ||
          encontrouNoCard
        ) {
          card.style.display = '';
          card.classList.add('local-visivel-busca');
        } else {
          card.style.display = 'none';
          card.classList.remove('local-visivel-busca');
        }
      });

      // Controle dos títulos das categorias
      const titulosCategorias = document.querySelectorAll(
        '.titulo-categoria'
      );
      titulosCategorias.forEach(categoria => {

        if (termoNormalizado === '') {
          categoria.style.display = '';
          return;
        }

        let proximoElemento = categoria.nextElementSibling;
        let temLocaisVisiveis = false;

        while (
          proximoElemento &&
          !proximoElemento.classList.contains('titulo-categoria') &&
          proximoElemento.tagName !== 'FOOTER'
        ) {

          if (
            proximoElemento.classList.contains('local-visivel-busca') ||
            proximoElemento.querySelector('.local-visivel-busca')
          ) {
            temLocaisVisiveis = true;
            break;
          }

          proximoElemento = proximoElemento.nextElementSibling;
        }

        categoria.style.display = temLocaisVisiveis ? '' : 'none';

      });
      document.querySelectorAll('.local-visivel-busca')
        .forEach(el => el.classList.remove('local-visivel-busca'));

    });
  }


  carregarBannersDinamicos();
  carregarMuralNoticias();

}); 