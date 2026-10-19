const root = document.documentElement;
const themeButton = document.querySelector('.theme-toggle');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const english = root.lang.startsWith('en');
const text = english
  ? { toLight: 'Switch to light mode', toDark: 'Switch to dark mode', copy: 'Copy', copied: 'Copied', copyFailed: 'Couldn’t copy' }
  : { toLight: 'Activar modo claro', toDark: 'Activar modo oscuro', copy: 'Copiar', copied: 'Copiado', copyFailed: 'No se pudo copiar' };

function isDarkTheme() {
  return root.dataset.theme ? root.dataset.theme === 'dark' : systemTheme.matches;
}

function updateThemeButton() {
  const dark = isDarkTheme();
  const label = dark ? text.toLight : text.toDark;
  themeButton.setAttribute('aria-pressed', String(dark));
  themeButton.title = label;
  document.querySelector('meta[name="theme-color"]').content = dark ? '#0e1621' : '#f5f0e6';
  document.querySelectorAll('picture[data-theme-picture] source').forEach((source) => {
    source.media = dark ? 'all' : 'not all';
  });
  document.querySelectorAll('[data-project-preview][data-dark-src]').forEach((link) => {
    link.href = dark ? link.dataset.darkSrc : link.dataset.lightSrc;
  });
}

themeButton.hidden = false;
updateThemeButton();
systemTheme.addEventListener('change', updateThemeButton);
themeButton.addEventListener('click', () => {
  const nextTheme = isDarkTheme() ? 'light' : 'dark';
  root.dataset.theme = nextTheme;
  try {
    localStorage.setItem('portfolio-theme', nextTheme);
  } catch {
    // Theme switching still works for this visit without browser storage.
  }
  updateThemeButton();
});

const preview = document.querySelector('#project-preview');
if (typeof preview.showModal === 'function') {
  document.querySelectorAll('[data-project-preview]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const thumbnail = link.querySelector('img');
      const fullImage = new Image();
      fullImage.src = link.href;
      fullImage.alt = thumbnail.alt;
      fullImage.width = thumbnail.naturalWidth || thumbnail.width;
      fullImage.height = thumbnail.naturalHeight || thumbnail.height;
      preview.querySelector('[data-preview-image]').replaceChildren(fullImage);
      preview.querySelector('#preview-title').textContent = link.dataset.projectName;
      preview.querySelector('p').textContent = link.dataset.caption;
      link.focus({ preventScroll: true });
      preview.showModal();
    });
  });
  preview.querySelector('[data-preview-close]').addEventListener('click', () => preview.close());
  preview.addEventListener('close', () => preview.querySelector('[data-preview-image]').replaceChildren());
  preview.addEventListener('click', (event) => {
    const bounds = preview.getBoundingClientRect();
    if (event.target === preview && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) preview.close();
  });
}

// Copy buttons appear only where the Clipboard API is available; the mailto link always works.
if (navigator.clipboard) {
  document.querySelectorAll('[data-copy]').forEach((button) => {
    const label = button.querySelector('[data-copy-label]');
    button.hidden = false;
    button.setAttribute('aria-live', 'polite');
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        label.textContent = text.copied;
      } catch {
        label.textContent = text.copyFailed;
      }
      setTimeout(() => { label.textContent = text.copy; }, 2000);
    });
  });
}

// Switching language keeps the visitor on the same section: both pages share section IDs.
document.querySelectorAll('[data-lang-switch]').forEach((link) => {
  link.addEventListener('click', () => {
    if (location.hash) link.hash = location.hash;
  });
});

// The header gains a divider once the page scrolls under it.
const header = document.querySelector('.site-header');
const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

if ('IntersectionObserver' in window) {
  // Mark the navigation link of the section crossing the middle of the viewport.
  const navLinks = new Map([...document.querySelectorAll('.nav-link')].map((link) => [link.hash.slice(1), link]));
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const link = navLinks.get(entry.target.id);
      if (entry.isIntersecting) {
        navLinks.forEach((other) => other.removeAttribute('aria-current'));
        link.setAttribute('aria-current', 'true');
      } else if (link.hasAttribute('aria-current')) {
        link.removeAttribute('aria-current');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach((_, id) => {
    const section = document.getElementById(id);
    if (section) sectionObserver.observe(section);
  });

  // Content is visible without JavaScript; the entrance is only an enhancement.
  if (!reducedMotion.matches) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('[data-reveal]').forEach((element) => {
      if (element.getBoundingClientRect().top < window.innerHeight) return;
      element.classList.add('reveal');
      revealObserver.observe(element);
    });
  }
}
