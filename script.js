/* ==========================================================================
   REGISTRO DO SERVICE WORKER (PWA)
   ========================================================================== */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('PWA ativo com sucesso!', reg.scope))
      .catch(err => console.log('Erro ao registrar PWA:', err));
  });
}

document.addEventListener('DOMContentLoaded', () => {

  const URL_API = 'https://script.google.com/macros/s/AKfycbw9GP_gDhlXbhiZzYrjsnu72kJfvi1TaORanwsiV03DwHUqfTrS1PRsjobJXsOtzV_V/exec';


  /* ==========================================================================
    PROMPT DE INSTALAÇÃO SELETIVO (PWA ANDROID / IOS)
    ========================================================================== */

  // Função auxiliar para detectar se o dispositivo é iOS (iPhone, iPad, iPod)
  const ehIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
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

      // Só mostra se o morador não tiver recusado o banner do Android
      if (localStorage.getItem('pwa-banner-recusado') !== 'sim') {
        if (bannerAndroid) bannerAndroid.style.display = 'flex';
      }
    });

    if (btnInstalarAndroid) {
      btnInstalarAndroid.addEventListener('click', async () => {
        if (!gatilhoInstalacao) return;
        gatilhoInstalacao.prompt();
        const { outcome } = await gatilhoInstalacao.userChoice;
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

  // Garante que os banners sumam se o app for aberto diretamente após instalado
  window.addEventListener('appinstalled', () => {
    if (bannerAndroid) bannerAndroid.style.display = 'none';
    if (bannerIOS) bannerIOS.style.display = 'none';
    gatilhoInstalacao = null;
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
          titulo,
          subtitulo,
          botaoTexto,
          linkDestino,
          imagemUrl
        } = item;

        const novoSlide = document.createElement('div');
        novoSlide.className = 'slide';
        novoSlide.dataset.dinamico = 'true';

        const fundo = document.createElement('div');
        fundo.className = 'slide-background';

        if (imagemUrl) {
          const img = document.createElement('img');
          img.src = ajustarLinkImagem(imagemUrl);
          img.alt = titulo;
          fundo.appendChild(img);
        }

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

        const destinoOriginal = String(
          item.linkDestino || item.link_destino || ''
        ).trim();

        const destino = destinoOriginal
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        console.log('Destino do banner:', {
          titulo: item.titulo,
          destinoOriginal: destinoOriginal,
          destinoFinal: destino
        });

        link.href = destino
          ? `noticias.html#${encodeURIComponent(destino)}`
          : 'noticias.html';

        link.textContent = (botaoTexto || '') + ' ';

        const icone = document.createElement('i');
        icone.className = 'fa fa-arrow-right';
        link.appendChild(icone);

        conteudo.append(etiqueta, tituloEl, subtituloEl, link);
        novoSlide.append(fundo, conteudo);

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


  /* ==========================================================================
   3. SISTEMA DE MURAL DE NOTÍCIAS
   ========================================================================== */
  async function carregarMuralNoticias() {
    const containerHomeResumo = document.getElementById('noticias-resumo-home');
    const containerMuralCompleto = document.getElementById('mural-noticias-completo');

    if (!containerHomeResumo && !containerMuralCompleto) return;

    try {
      const dados = await consultarAPI('noticias');

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
            console.log('URL da imagem:', imagemUrl);
            const img = document.createElement('img');
            img.src = ajustarLinkImagem(imagemUrl);
            img.alt = titulo;
            img.className = 'imagem-noticia';

            img.onerror = () => {
              console.error('Não foi possível carregar a imagem:', img.src);
              img.alt = 'Imagem indisponível';
            };

            img.addEventListener('click', () => {
              const modal = document.getElementById('modal-imagem');
              const modalImg = document.getElementById('img-ampliada');
              const legenda = document.getElementById('modal-legenda');

              if (modal && modalImg && legenda) {
                modal.style.display = 'block';
                modalImg.src = img.src;
                legenda.textContent = img.alt;
                document.body.style.overflow = 'hidden';
              }
            });

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
  function reiniciarLogicaCarrossel() {
    const slides = document.querySelectorAll('.slide');
    const indicadores = document.querySelectorAll('.indicador');
    const barraProgresso = document.querySelector('.barra-progresso');
    if (slides.length === 0) return;
    slides[0].classList.add('ativo');
    if (indicadores[0]) indicadores[0].classList.add('ativo');
    function alternarSlide(index) {
      if (!slides[slideAtual] || !slides[index]) return;
      slides[slideAtual].classList.remove('ativo');
      if (indicadores[slideAtual]) indicadores[slideAtual].classList.remove('ativo');
      slideAtual = index;
      slides[slideAtual].classList.add('ativo');
      if (indicadores[slideAtual]) indicadores[slideAtual].classList.add('ativo');
      reiniciarBarraProgresso();
    }
    function proximoSlide() {
      let proximo = (slideAtual + 1) % slides.length;
      alternarSlide(proximo);
    }
    function reiniciarBarraProgresso() {
      if (!barraProgresso) return;
      clearTimeout(tempoSlide);
      barraProgresso.style.transition = 'none';
      barraProgresso.style.width = '0%';
      barraProgresso.offsetHeight;
      barraProgresso.style.transition = 'width 6s linear';
      barraProgresso.style.width = '100%';
      tempoSlide = setTimeout(proximoSlide, 6000);
    }
    indicadores.forEach((indicador, idx) => {
      indicador.addEventListener('click', () => {
        if (idx !== slideAtual) alternarSlide(idx);
      });
    });
    reiniciarBarraProgresso();
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
  const modal = document.getElementById('modal-imagem');
  const modalImg = document.getElementById('img-ampliada');
  const legendaTexto = document.getElementById('modal-legenda');
  const botaoFechar = document.querySelector('.botao-fechar-modal');
  const imagensNoticias = document.querySelectorAll('.texto-completo img');

  imagensNoticias.forEach(img => {
    img.addEventListener('click', () => {
      if (modal && modalImg && legendaTexto) {
        modal.style.display = "block";
        modalImg.src = img.src;
        legendaTexto.innerHTML = img.alt;
        document.body.style.overflow = 'hidden';
      }
    });
  });

  function fecharOModal() {
    if (modal) {
      modal.style.display = "none";
      document.body.style.overflow = 'auto';
    }
  }

  if (botaoFechar) botaoFechar.addEventListener('click', fecharOModal);

  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal || event.target.classList.contains('modal-conteudo-wrapper')) {
        fecharOModal();
      }
    });
  }

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
        const response = await fetch("https://web3forms.com", {
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

  // Inicializa as chamadas das APIs das planilhas
  carregarBannersDinamicos();
  carregarMuralNoticias();

}); 