// document.addEventListener('DOMContentLoaded', () => {

//   /* 1. SEU MENU HAMBÚRGUER ORIGINAL */
//   const burgerBtn = document.getElementById('burger-btn');
//   const mobileNav = document.getElementById('mobile-nav');

//   if (burgerBtn && mobileNav) {
//     burgerBtn.addEventListener('click', (event) => {
//       event.stopPropagation();
//       mobileNav.classList.toggle('hidden');
//     });

//     const mobileLinks = mobileNav.querySelectorAll('a');
//     mobileLinks.forEach(link => {
//       link.addEventListener('click', () => {
//         mobileNav.classList.add('hidden');
//       });
//     });

//     document.addEventListener('click', (event) => {
//       if (!mobileNav.contains(event.target) && !burgerBtn.contains(event.target)) {
//         mobileNav.classList.add('hidden');
//       }
//     });
//   }

//   /* 2. AUTOMAÇÃO DO CARROSSEL (COM BARRA DE PROGRESSO E CONTROLES) */
//   const slides = document.querySelectorAll('.slide');
//   const indicadores = document.querySelectorAll('.indicador');
//   const barraProgresso = document.querySelector('.barra-progresso');
//   let slideAtual = 0;
//   let tempoSlide;

//   function alternarSlide(index) {
//     // Desativa slide e indicador anterior
//     slides[slideAtual].classList.remove('ativo');
//     indicadores[slideAtual].classList.remove('ativo');

//     // Atualiza índice
//     slideAtual = index;

//     // Ativa novo slide e indicador
//     slides[slideAtual].classList.add('ativo');
//     indicadores[slideAtual].classList.add('ativo');

//     // Reinicia animação da barra
//     reiniciarBarraProgresso();
//   }

//   function proximoSlide() {
//     let proximo = (slideAtual + 1) % slides.length;
//     alternarSlide(proximo);
//   }

//   function reiniciarBarraProgresso() {
//     clearInterval(tempoSlide);
//     // Remove transições para resetar a barra instantaneamente para 0%
//     barraProgresso.style.transition = 'none';
//     barraProgresso.style.width = '0%';

//     // Força o navegador a computar o reset antes de iniciar a nova animação
//     setTimeout(() => {
//       barraProgresso.style.transition = 'width 5s linear';
//       barraProgresso.style.width = '100%';
//     }, 50);

//     // Define o temporizador para mudar o slide após 5 segundos
//     tempoSlide = setInterval(proximoSlide, 5000);
//   }

//   // Adiciona evento de clique/toque nas bolinhas indicadoras
//   indicadores.forEach((indicador, idx) => {
//     indicador.addEventListener('click', () => {
//       if (idx !== slideAtual) alternarSlide(idx);
//     });
//   });

//   // Inicializa o progresso do primeiro slide
//   if (slides.length > 0) {
//     reiniciarBarraProgresso();
//   }

//   /* 3. EFEITOS DE ROLAGEM (SCROLL REVEAL) */
//   const opcoesEfeito = {
//     root: null,
//     threshold: 0.12,
//     rootMargin: "0px 0px -50px 0px"
//   };

//   const observadorDeScroll = new IntersectionObserver((entradas, observador) => {
//     entradas.forEach(entrada => {
//       if (entrada.isIntersecting) {
//         entrada.target.classList.add('visivel');
//         observador.unobserve(entrada.target);
//       }
//     });
//   }, opcoesEfeito);

//   const elementosParaRevelar = document.querySelectorAll('.revelar-ao-scroll');
//   elementosParaRevelar.forEach(elemento => {
//     observadorDeScroll.observe(elemento);
//   });

//   /* ----------------------------------------------------
//      4. CONTROLE DO POP-UP DE IMAGENS COM SUPORTE A ZOOM
//      ---------------------------------------------------- */
//   const modal = document.getElementById('modal-imagem');
//   const modalImg = document.getElementById('img-ampliada');
//   const legendaTexto = document.getElementById('modal-legenda');
//   const botaoFechar = document.querySelector('.botao-fechar-modal');

//   // Seleciona todas as imagens dentro do texto completo das notícias
//   const imagensNoticias = document.querySelectorAll('.texto-completo img');

//   imagensNoticias.forEach(img => {
//     img.addEventListener('click', () => {
//       modal.style.display = "block";
//       modalImg.src = img.src;
//       legendaTexto.innerHTML = img.alt; // Usa o texto alternativo como legenda
//       document.body.style.overflow = 'hidden'; // Trava o scroll da página de fundo
//     });
//   });

//   // Função para fechar o pop-up
//   function fecharOModal() {
//     modal.style.display = "none";
//     document.body.style.overflow = 'auto'; // Libera o scroll da página
//   }

//   if (botaoFechar) {
//     botaoFechar.addEventListener('click', fecharOModal);
//   }

//   // Também fecha se o morador clicar em qualquer parte escura do fundo
//   if (modal) {
//     modal.addEventListener('click', (event) => {
//       if (event.target === modal || event.target.classList.contains('modal-conteudo-wrapper')) {
//         fecharOModal();
//       }
//     });
//   }

//   /* ----------------------------------------------------
//    4.5 CONTROLE DO POP-UP DE INSTRUÇÕES (BOAS-VINDAS)
//    ---------------------------------------------------- */
//   const modalInstrucoes = document.getElementById('modal-instrucoes');
//   const btnAbrirInstrucoes = document.getElementById('btn-abrir-instrucoes');
//   const btnFecharInstrucoes = document.querySelector('.botao-fechar-instrucoes');

//   if (btnAbrirInstrucoes && modalInstrucoes) {
//     // Abre o pop-up de forma nativa e acessível
//     btnAbrirInstrucoes.addEventListener('click', () => {
//       modalInstrucoes.showModal();
//       document.body.style.overflow = 'hidden'; // Trava o scroll do fundo igual você fez nas fotos
//     });

//     // Função interna para fechar o pop-up com segurança
//     const fecharInstrucoes = () => {
//       modalInstrucoes.close();
//       document.body.style.overflow = 'auto'; // Devolve o scroll da página principal
//     };

//     if (btnFecharInstrucoes) {
//       btnFecharInstrucoes.addEventListener('click', fecharInstrucoes);
//     }

//     // Fecha se o morador clicar no backdrop (na parte escura borrada fora do balão)
//     modalInstrucoes.addEventListener('click', (event) => {
//       if (event.target === modalInstrucoes) {
//         fecharInstrucoes();
//       }
//     });
//   }

//   /* ----------------------------------------------------
//      5. ENVIO DO FORMULÁRIO FALE CONOSCO (DIAGNÓSTICO)
//      ---------------------------------------------------- */
//   const form = document.getElementById('fale-conosco-form');
//   const submitBtn = form.querySelector('button[type="submit"]');

//   form.addEventListener('submit', async (e) => {
//     e.preventDefault();

//     const formData = new FormData(form);
//     // formData.append("access_key", "e13d012a-01ba-46f6-ab74-e596e49392d4");

//     const originalText = submitBtn.textContent;

//     submitBtn.textContent = "Enviando...";
//     submitBtn.disabled = true;

//     try {
//       const response = await fetch("https://api.web3forms.com/submit", {
//         method: "POST",
//         body: formData
//       });

//       const data = await response.json();

//       if (response.ok) {
//         alert("Sucesso! Sua mensagem foi enviada.");
//         form.reset();
//       } else {
//         console.log("Erro detalhado da Web3Forms:", data);
//         alert("Error: " + data.message);
//       }

//     } catch (error) {
//       console.error("Erro ao enviar o formulário:", error);
//       alert("Algo deu errado. Por favor, tente novamente.");
//     } finally {
//       submitBtn.textContent = originalText;
//       submitBtn.disabled = false;
//     }

//   });

// });

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
    clearInterval(tempoSlide);
    barraProgresso.style.transition = 'none';
    barraProgresso.style.width = '0%';

    setTimeout(() => {
      barraProgresso.style.transition = 'width 5s linear';
      barraProgresso.style.width = '100%';
    }, 50);

    tempoSlide = setInterval(proximoSlide, 5000);
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

  /* 4. CONTROLE DO POP-UP DE IMAGENS COM SUPORTE A ZOOM */
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

  if (botaoFechar) {
    botaoFechar.addEventListener('click', fecharOModal);
  }

  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal || event.target.classList.contains('modal-conteudo-wrapper')) {
        fecharOModal();
      }
    });
  }

  /* 4.5 CONTROLE DO POP-UP DE INSTRUÇÕES (BOAS-VINDAS) */
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

    if (btnFecharInstrucoes) {
      btnFecharInstrucoes.addEventListener('click', fecharInstrucoes);
    }

    modalInstrucoes.addEventListener('click', (event) => {
      if (event.target === modalInstrucoes) {
        fecharInstrucoes();
      }
    });
  }

  /* 5. ENVIO DO FORMULÁRIO FALE CONOSCO */
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
          alert("Error: " + data.message);
        }
      } catch (error) {
        alert("Algo deu errado. Por favor, tente novamente.");
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  /* 6. ALTERNADOR DE MODO ESCURO (DARK MODE) - CORRIGIDO FORA DO SUBMIT */
  const btnDarkDesktop = document.getElementById('btn-dark-desktop');
  const btnDarkMobile = document.getElementById('btn-dark-mobile');

  function alternarModoEscuro() {
    const estaNoModoEscuro = document.body.classList.toggle('dark-mode');
    localStorage.setItem('modo-escuro', estaNoModoEscuro ? 'ativado' : 'desativado');
    atualizarInterfaceDark(estaNoModoEscuro);
  }

  function atualizarInterfaceDark(ativo) {
    const botoes = [btnDarkDesktop, btnDarkMobile];
    botoes.forEach(btn => {
      if (btn) {
        const icone = btn.querySelector('i');
        const texto = btn.querySelector('span');
        if (icone && texto) {
          if (ativo) {
            icone.className = 'fa fa-sun-o';
            texto.textContent = btn === btnDarkMobile ? '' : '';
          } else {
            icone.className = 'fa fa-moon-o';
            texto.textContent = btn === btnDarkMobile ? '' : '';
          }
        }
      }
    });
  }

  if (btnDarkDesktop) btnDarkDesktop.addEventListener('click', alternarModoEscuro);
  if (btnDarkMobile) btnDarkMobile.addEventListener('click', alternarModoEscuro);

  const preferenciaModoEscuro = localStorage.getItem('modo-escuro');
  if (preferenciaModoEscuro === 'ativado') {
    document.body.classList.add('dark-mode');
    atualizarInterfaceDark(true);
  }

});
