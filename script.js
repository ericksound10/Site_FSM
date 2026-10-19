// document.addEventListener('DOMContentLoaded', () => {
//     const botaoMenu = document.querySelector('burger-btn');
//     const menuNav = document.querySelector('mobile-nav');

//     botaoMenu.addEventListener('click', () => {
//         // Liga/Desliga a classe 'ativo' no menu
//         menuNav.classList.toggle('ativo');
//     });

//     // Opcional: Fecha o menu ao clicar em qualquer link dele
//     const linksMenu = document.querySelectorAll('.menu-navegacao a');
//     linksMenu.forEach(link => {
//         link.addEventListener('click', () => {
//             menuNav.classList.remove('ativo');
//         });
//     });
// });

// const burgerBtn = document.getElementById('burger-btn');
// const mainNav = document.getElementById('main-nav');

// burgerBtn.addEventListener('click', () => {
//   mainNav.classList.toggle('hidden-mobile');
// });

// const burgerBtn = document.getElementById('burger-btn');
// const mobileNav = document.getElementById('mobile-nav');

// burgerBtn.addEventListener('click', () => {
//   mobileNav.classList.toggle('hidden');
// });

// document.addEventListener('DOMContentLoaded', () => {
//   const burgerBtn = document.querySelector('.menu-hamburguer');
//   const mainNav = document.querySelector('.menu-navegacao');

//   // Garante que o código só rode se os elementos existirem na página
//   if (burgerBtn && mainNav) {
//     burgerBtn.addEventListener('click', () => {
//       // Alterna a classe para abrir/fechar o menu na lateral
//       mainNav.classList.toggle('ativo');
//     });

//     // Opcional: Fecha o menu automaticamente ao clicar em um link
//     const links = mainNav.querySelectorAll('a');
//     links.forEach(link => {
//       link.addEventListener('click', () => {
//         mainNav.classList.remove('ativo');
//       });
//     });
//   }
// });

document.addEventListener('DOMContentLoaded', () => {
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

    // Fecha se clicar estritamente fora da barra lateral e do botão hambúrguer
    document.addEventListener('click', (event) => {
      if (!mobileNav.contains(event.target) && !burgerBtn.contains(event.target)) {
        mobileNav.classList.add('hidden');
      }
    });
  }
});
