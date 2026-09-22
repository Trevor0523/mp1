const header = document.querySelector('.site-header');
const navItems = Array.from(document.querySelectorAll('.navigation li a[href^="#"]'))
  .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
  .filter((item) => item.section);

function updatePositionIndicator() {
  // Both measurements use viewport coordinates; allow a pixel for rounding.
  const readingLine = header.getBoundingClientRect().bottom + 30;
  let currentItem = null;
  navItems.forEach((item) => {
    if (item.section.getBoundingClientRect().top <= readingLine) currentItem = item;
  });

  // A short final section might never reach the navbar at maximum scroll.
  const atBottom = window.scrollY + window.innerHeight >=
    document.documentElement.scrollHeight - 2;
  if (atBottom) currentItem = navItems[navItems.length - 1];

  navItems.forEach((item) => {
    if (item === currentItem) item.link.setAttribute('aria-current', 'location');
    else item.link.removeAttribute('aria-current');
  });
}

function updateNavbarSize() {
  const navbar = document.querySelector('.navigation');
  if (window.scrollY > 50) navbar.classList.add('scrolled');
  else navbar.classList.remove('scrolled');
}

// Coalesce scroll events into one update per animation frame.
let updatePending = false;
function schedulePositionUpdate() {
  if (updatePending) return;
  updatePending = true;
  window.requestAnimationFrame(() => {
    updatePositionIndicator();
    updateNavbarSize();
    updatePending = false;
  });
}
window.addEventListener('scroll', schedulePositionUpdate, { passive: true });
window.addEventListener('resize', schedulePositionUpdate);
window.addEventListener('load', schedulePositionUpdate);
window.addEventListener('pageshow', schedulePositionUpdate);
updatePositionIndicator();

// Manual carousel: navigation wraps around, with no automatic slide changes.
const carousel = document.querySelector('.experience-carousel');
if (carousel) {
  const slides = Array.from(carousel.querySelectorAll('.experience-slide'));
  const selectors = Array.from(carousel.querySelectorAll('.carousel-pagination button'));
  const status = carousel.querySelector('.carousel-status');
  let activeSlide = 0;

  function showSlide(index) {
    activeSlide = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeSlide;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
      slide.toggleAttribute('inert', !isActive);
      if (isActive) selectors[slideIndex].setAttribute('aria-current', 'true');
      else selectors[slideIndex].removeAttribute('aria-current');
    });
    status.textContent = slides[activeSlide].getAttribute('aria-label');
  }

  carousel.querySelector('.carousel-previous').addEventListener('click', () => showSlide(activeSlide - 1));
  carousel.querySelector('.carousel-next').addEventListener('click', () => showSlide(activeSlide + 1));
  selectors.forEach((button, index) => button.addEventListener('click', () => showSlide(index)));
  carousel.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    showSlide(activeSlide + (event.key === 'ArrowRight' ? 1 : -1));
  });
}

const projectModal = document.getElementById('project-modal');
const projectModalTitle = document.getElementById('project-modal-title');
const projectModalBody = document.getElementById('project-modal-body');
let openingCard = null;

document.querySelectorAll('.project-grid .project-card').forEach((card) => {
  const title = card.querySelector('h3').textContent.trim();

  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-haspopup', 'dialog');
  card.setAttribute('aria-controls', 'project-modal');
  card.setAttribute('aria-label', `${title}: view project details`);

  function openProjectModal() {
    if (projectModal.open) return;

    const template = card.querySelector('.project-modal-content');

    openingCard = card;
    projectModalTitle.textContent = title;
    const artwork = card.querySelector('.project-art');
    const modalArtwork = document.getElementById('project-modal-art');

    modalArtwork.replaceChildren();

    if (artwork) {
      modalArtwork.append(artwork.cloneNode(true));
    }
    projectModalBody.replaceChildren();

    if (template) {
      projectModalBody.append(template.content.cloneNode(true));
    }

    projectModal.showModal();
    document.documentElement.classList.add('modal-open');
  }

  card.addEventListener('click', openProjectModal);

  card.addEventListener('keydown', (event) => {
    if (event.target !== card) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); // Prevent Space from scrolling the page.
      if (!event.repeat) openProjectModal();
    }
  });
});

projectModal.querySelector('.modal-close').addEventListener('click', () => {
  projectModal.close();
});

projectModal.addEventListener('click', (event) => {
  if (event.target !== projectModal) return;

  const bounds = projectModal.getBoundingClientRect();
  const outside =
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom;

  if (outside) projectModal.close();
});

projectModal.addEventListener('close', () => {
  document.documentElement.classList.remove('modal-open');
  openingCard?.focus({ preventScroll: true });
});
