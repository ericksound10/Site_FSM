document.addEventListener('DOMContentLoaded', () => {

  /* 1. SEU MENU HAMBÚRGUER ORIGINAL */
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

  /* 2. AUTOMAÇÃO DO CARROSSEL (COM BARRA DE PROGRESSO E CONTROLES) */
  const slides = document.querySelectorAll('.slide');
  const indicadores = document.querySelectorAll('.indicador');
  const barraProgresso = document.querySelector('.barra-progresso');
  let slideAtual = 0;
  let tempoSlide;

  function alternarSlide(index) {
    // Desativa slide e indicador anterior
    slides[slideAtual].classList.remove('ativo');
    indicadores[slideAtual].classList.remove('ativo');

    // Atualiza índice
    slideAtual = index;

    // Ativa novo slide e indicador
    slides[slideAtual].classList.add('ativo');
    indicadores[slideAtual].classList.add('ativo');

    // Reinicia animação da barra
    reiniciarBarraProgresso();
  }

  function proximoSlide() {
    let proximo = (slideAtual + 1) % slides.length;
    alternarSlide(proximo);
  }

  function reiniciarBarraProgresso() {
    clearInterval(tempoSlide);
    // Remove transições para resetar a barra instantaneamente para 0%
    barraProgresso.style.transition = 'none';
    barraProgresso.style.width = '0%';

    // Força o navegador a computar o reset antes de iniciar a nova animação
    setTimeout(() => {
      barraProgresso.style.transition = 'width 5s linear';
      barraProgresso.style.width = '100%';
    }, 50);

    // Define o temporizador para mudar o slide após 5 segundos
    tempoSlide = setInterval(proximoSlide, 5000);
  }

  // Adiciona evento de clique/toque nas bolinhas indicadoras
  indicadores.forEach((indicador, idx) => {
    indicador.addEventListener('click', () => {
      if (idx !== slideAtual) alternarSlide(idx);
    });
  });

  // Inicializa o progresso do primeiro slide
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

  /* ----------------------------------------------------
     4. CONTROLE DO POP-UP DE IMAGENS COM SUPORTE A ZOOM
     ---------------------------------------------------- */
  const modal = document.getElementById('modal-imagem');
  const modalImg = document.getElementById('img-ampliada');
  const legendaTexto = document.getElementById('modal-legenda');
  const botaoFechar = document.querySelector('.botao-fechar-modal');

  // Seleciona todas as imagens dentro do texto completo das notícias
  const imagensNoticias = document.querySelectorAll('.texto-completo img');

  imagensNoticias.forEach(img => {
    img.addEventListener('click', () => {
      modal.style.display = "block";
      modalImg.src = img.src;
      legendaTexto.innerHTML = img.alt; // Usa o texto alternativo como legenda
      document.body.style.overflow = 'hidden'; // Trava o scroll da página de fundo
    });
  });

  // Função para fechar o pop-up
  function fecharOModal() {
    modal.style.display = "none";
    document.body.style.overflow = 'auto'; // Libera o scroll da página
  }

  if (botaoFechar) {
    botaoFechar.addEventListener('click', fecharOModal);
  }

  // Também fecha se o morador clicar em qualquer parte escura do fundo
  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal || event.target.classList.contains('modal-conteudo-wrapper')) {
        fecharOModal();
      }
    });
  }

  /* ----------------------------------------------------
     5. ENVIO DO FORMULÁRIO FALE CONOSCO (DIAGNÓSTICO)
     ---------------------------------------------------- */
  const form = document.getElementById('fale-conosco-form');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    // formData.append("access_key", "e13d012a-01ba-46f6-ab74-e596e49392d4");

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
        console.log("Erro detalhado da Web3Forms:", data);
        alert("Error: " + data.message);
      }

    } catch (error) {
      console.error("Erro ao enviar o formulário:", error);
      alert("Algo deu errado. Por favor, tente novamente.");
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }

  });

});
