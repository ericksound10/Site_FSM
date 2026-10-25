document.addEventListener('DOMContentLoaded', () => {

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

  /* 2. CARROSSEL SINCRONIZADO (COM BARRA DE PROGRESSO) */
  const slides = document.querySelectorAll('.slide');
  const indicadores = document.querySelectorAll('.indicador');
  const barraProgresso = document.querySelector('.barra-progresso');
  let slideAtual = 0;
  let tempoSlide = null;

  function alternarSlide(index) {
    slides[slideAtual].classList.remove('ativo');
    indicadores[slideAtual].classList.remove('ativo');

    slideAtual = index;

    slides[slideAtual].classList.add('ativo');
    indicadores[slideAtual].classList.add('ativo');

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

    // Força o reflow para o navegador registrar o reset instantâneo
    barraProgresso.offsetHeight; 

    // 6 segundos total (5s de exibição estável + 1s do efeito fade do CSS)
    barraProgresso.style.transition = 'width 6s linear';
    barraProgresso.style.width = '100%';

    tempoSlide = setTimeout(proximoSlide, 6000);
  }

  indicadores.forEach((indicador, idx) => {
    indicador.addEventListener('click', () => {
      if (idx !== slideAtual) alternarSlide(idx);
    });
  });

  if (slides.length > 0) {
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
  

});