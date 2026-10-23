import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const projectRoot = new URL('../', import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, projectRoot), 'utf8'));
const projectsData = await readJson('data/projects.json');
const mlProjectsData = await readJson('data/ml-projects.json');
const moreProjectsData = await readJson('data/more-projects.json');
const contact = await readJson('data/contact.json');
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);
const arrow = '<span class="arrow" aria-hidden="true">↗</span>';
const downArrow = '<span class="arrow arrow--down" aria-hidden="true">↓</span>';
const number = (index) => String(index + 1).padStart(2, '0');
const withoutPeriod = (text) => String(text).replace(/\.$/, '');
const STATUS_TONES = ['done', 'progress', 'demo'];
const SITE = 'https://francosgutierrez.dev/';

// Each language has a home page and one detail page per project. Paths are relative to the site root;
// `dir` is the folder a page lives in, so links and assets can be written relative to it.
const PAGES = [
  { lang: 'es', file: 'index.html', dir: '', projectDir: 'proyectos/' },
  { lang: 'en', file: 'en/index.html', dir: 'en/', projectDir: 'en/projects/' },
];
const pageFor = (lang) => PAGES.find((page) => page.lang === lang);
const projectDirFor = (lang, id) => `${pageFor(lang).projectDir}${id}/`;
// From a page in `fromDir`, the relative prefix that reaches the site root.
const toRoot = (fromDir) => (fromDir ? '../'.repeat(fromDir.split('/').filter(Boolean).length) : './');

const UI = {
  es: {
    contribution: 'Mi aporte', status: 'Estado', scope: 'Alcance', stack: 'Stack', challenge: 'Desafío', result: 'Resultado',
    problem: 'Problema', solution: 'Solución', repo: 'Ver repositorio', demo: 'Ver demo', evaluation: 'Ver evaluación',
    moreDetails: 'Más detalles', technical: 'Enfoque técnico', zoom: 'Ampliar', alsoOnGithub: 'También en GitHub',
    repoAria: (n) => `Ver repositorio de ${n}`, demoAria: (n) => `Ver demo de ${n}`, evaluationAria: (n) => `Ver evaluación de ${n}`,
    moreAria: (n) => `Más detalles de ${n}`, technicalAria: (n) => `Enfoque técnico de ${n}`, zoomAria: (n) => `Ampliar captura de ${n}`,
    tagsAria: (n) => `Tecnologías de ${n}`,
    projectsSection: { label: 'Software', title: 'Herramientas internas y aplicaciones web.', lead: 'Dos sistemas en Go que automatizan trabajo administrativo, inventario y actas, dos demos frontend en React para proyectos freelance y una app personal.' },
    mlSection: { label: 'ML & Data', title: 'Modelos, inferencia y análisis de datos.', lead: 'Tres proyectos de AnyoneAI: un servicio de clasificación de imágenes, la comparación de modelos de riesgo crediticio y un pipeline ELT.' },
    contactSection: {
      label: 'Contacto', title: '¿Tenés un proyecto en mente o un puesto para cubrir?',
      lead: 'Estoy disponible para proyectos freelance y oportunidades laborales, en Argentina y otros países.',
      single: (name) => `${name} es el canal más directo.`, multiple: 'Contame en pocas líneas qué necesitás resolver, por el canal que te quede más cómodo.',
    },
    linkedin: 'Empleo y propuestas', email: 'Empleo, freelance y consultas', whatsapp: 'Proyectos freelance, Argentina y exterior',
    whatsappDisplay: 'Escribir por WhatsApp', whatsappMessage: 'Hola Franco, vi tu portafolio y quería consultarte por un proyecto.',
    github: 'Código y repositorios', copy: 'Copiar',
    privateRepo: 'Código privado · herramienta interna',
    contactMe: 'Contactarme', downloadCv: 'Descargar CV',
    viewProject: 'Ver proyecto', allProjects: 'Todos los proyectos', about: 'Sobre el proyecto', facts: 'Ficha del proyecto',
    previous: 'Anterior', next: 'Siguiente', pager: 'Más proyectos', locale: 'es_AR',
    caseCta: { title: '¿Te interesa algo parecido?', text: 'Contame qué necesitás resolver y lo conversamos.', button: 'Contactarme' },
  },
  en: {
    contribution: 'My role', status: 'Status', scope: 'Scope', stack: 'Stack', challenge: 'Challenge', result: 'Result',
    problem: 'Problem', solution: 'Solution', repo: 'View repository', demo: 'View demo', evaluation: 'View evaluation',
    moreDetails: 'More details', technical: 'Technical approach', zoom: 'Enlarge', alsoOnGithub: 'Also on GitHub',
    repoAria: (n) => `View repository of ${n}`, demoAria: (n) => `View demo of ${n}`, evaluationAria: (n) => `View ${n} evaluation`,
    moreAria: (n) => `More details about ${n}`, technicalAria: (n) => `Technical approach of ${n}`, zoomAria: (n) => `Enlarge ${n} screenshot`,
    tagsAria: (n) => `${n} technologies`,
    projectsSection: { label: 'Software', title: 'Internal tools and web applications.', lead: 'Two Go systems that automate administrative work, inventory and records, two React frontend demos for freelance projects and a personal app.' },
    mlSection: { label: 'ML & Data', title: 'Models, inference and data analysis.', lead: 'Three AnyoneAI projects: an image classification service, a comparison of credit risk models and an ELT pipeline.' },
    contactSection: {
      label: 'Contact', title: 'Have a project in mind or a position to fill?',
      lead: 'I’m available for freelance projects and job opportunities, in Argentina and abroad.',
      single: (name) => `${name} is the most direct channel.`, multiple: 'Tell me in a few lines what you need to solve, through whichever channel suits you best.',
    },
    linkedin: 'Jobs and proposals', email: 'Jobs, freelance and inquiries', whatsapp: 'Freelance projects, Argentina and abroad',
    whatsappDisplay: 'Message on WhatsApp', whatsappMessage: 'Hi Franco, I saw your portfolio and would like to ask about a project.',
    github: 'Code and repositories', copy: 'Copy',
    privateRepo: 'Private code · internal tool',
    contactMe: 'Contact me', downloadCv: 'Download CV',
    viewProject: 'View project', allProjects: 'All projects', about: 'About the project', facts: 'Project facts',
    previous: 'Previous', next: 'Next', pager: 'More projects', locale: 'en_US',
    caseCta: { title: 'Interested in something similar?', text: 'Tell me what you need to solve and let’s talk it through.', button: 'Contact me' },
  },
};

// Spanish is the source; other languages override fields from each item's "en" block.
function localize(item, lang) {
  const { en, ...base } = item;
  if (lang === 'es') return base;
  if (!en) throw new Error(`Missing "${lang}" translation: ${item.id || item.name}`);
  return {
    ...base, ...en,
    ...(base.image ? { image: { ...base.image, ...en.image } } : {}),
    ...(base.chart ? { chart: { ...base.chart, ...en.chart } } : {}),
  };
}

function checkedUrl(url) {
  if (new URL(url).protocol !== 'https:') throw new Error(`Expected HTTPS URL: ${url}`);
  return escapeHtml(url);
}

function externalLink(url, label, accessibleLabel = label, className = 'link-arrow') {
  if (!url) return '';
  return `<a class="${className}" href="${checkedUrl(url)}" aria-label="${escapeHtml(accessibleLabel)}">${escapeHtml(label)} ${arrow}</a>`;
}

// Pages show a lighter WebP copy when one sits next to the PNG; the preview keeps opening the original file.
const inlineSource = (src) => {
  const webp = src.replace(/\.png$/, '.webp');
  return webp !== src && existsSync(new URL(webp, projectRoot)) ? webp : src;
};

// Rendering helpers shared by the home page and the project pages, for one language and one folder.
function helpers(lang, fromDir) {
  const t = UI[lang];
  const root = toRoot(fromDir);
  const asset = (path) => escapeHtml(path.replace(/^\.\//, root));
  const href = (path) => escapeHtml(root + path);

  function renderFigure(project) {
    const image = project.image;
    if (!image) return '';
    if (!image.alt?.trim() || !(image.width > 0) || !(image.height > 0)) throw new Error(`Invalid project image: ${project.id}`);
    const caption = escapeHtml(image.caption || project.name);
    const darkSource = image.darkSrc ? `<source media="(prefers-color-scheme: dark)" srcset="${asset(inlineSource(image.darkSrc))}" />` : '';
    return `<figure class="frame">
        <figcaption class="frame-bar">${caption}</figcaption>
        <a class="frame-link" href="${asset(image.src)}" target="_blank" rel="noopener" data-project-preview data-project-name="${escapeHtml(project.name)}" data-caption="${caption}" data-light-src="${asset(image.src)}"${image.darkSrc ? ` data-dark-src="${asset(image.darkSrc)}"` : ''} aria-label="${escapeHtml(image.previewLabel || t.zoomAria(project.name))}"><picture${image.darkSrc ? ' data-theme-picture' : ''}>${darkSource}<img src="${asset(inlineSource(image.src))}" alt="${escapeHtml(image.alt)}" decoding="async" width="${Number(image.width)}" height="${Number(image.height)}" /></picture><span class="frame-zoom" aria-hidden="true">${t.zoom} ↗</span></a>
      </figure>`;
  }

  // Data charts are drawn in HTML so they use the page's type and theme colors. Bars are inline SVG
  // with presentation attributes because the CSP does not allow inline styles.
  function renderChart(project) {
    const chart = project.chart;
    if (!chart.labels?.length || chart.labels.length !== chart.counts?.length) throw new Error(`Invalid chart: ${project.id}`);
    const locale = lang === 'es' ? 'es-AR' : 'en-US';
    const count = new Intl.NumberFormat(locale);
    const share = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const total = chart.counts.reduce((sum, value) => sum + value, 0);
    const rows = chart.labels.map((label, i) => {
      const ratio = chart.counts[i] / total;
      const tone = i === chart.labels.length - 1 ? 'accent' : 'base';
      return `<div class="chart-row chart-row--${tone}"><dt>${escapeHtml(label)}</dt><dd class="chart-value"><strong>${share.format(ratio * 100)}%</strong> ${count.format(chart.counts[i])}</dd><dd class="chart-bar"><svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true" focusable="false"><rect class="chart-track" width="100" height="10" /><rect class="chart-fill" width="${(ratio * 100).toFixed(2)}" height="10" /></svg></dd></div>`;
    }).join('');
    return `<figure class="frame chart">
        <figcaption class="frame-bar">${escapeHtml(chart.caption)}</figcaption>
        <div class="chart-body"><p class="chart-label">${escapeHtml(chart.label)}</p><dl class="chart-rows">${rows}</dl>${chart.source ? `<p class="chart-source">${escapeHtml(chart.source)}</p>` : ''}</div>
      </figure>`;
  }

  const tags = (project) => `<ul class="tags" aria-label="${escapeHtml(t.tagsAria(project.name))}">${project.stack.map((tech) => `<li>${escapeHtml(tech)}</li>`).join('')}</ul>`;
  const meta = (index, category) => `<p class="item-meta"><span class="item-num">${number(index)}</span><span>${escapeHtml(category)}</span></p>`;

  function status(project) {
    if (!project.status) return '';
    if (!STATUS_TONES.includes(project.statusTone)) throw new Error(`Invalid statusTone: ${project.id}`);
    return `<span class="state state--${project.statusTone}">${escapeHtml(withoutPeriod(project.status))}</span>`;
  }

  // Internal tools keep their code private: the page says so instead of linking to a 404.
  const links = (project) => (project.repositoryPrivate
    ? `<span class="private-note">${escapeHtml(project.privateNote || t.privateRepo)}</span>`
    : externalLink(project.repositoryUrl, t.repo, t.repoAria(project.name), 'btn btn--outline btn--sm'))
    + externalLink(project.demoUrl, t.demo, t.demoAria(project.name), 'btn btn--outline btn--sm')
    + externalLink(project.evaluationUrl, t.evaluation, t.evaluationAria(project.name));

  const metric = (project) => (project.resultLabel ? `<p class="metric"><strong class="metric-value">${escapeHtml(project.result)}</strong><span class="metric-label">${escapeHtml(project.resultLabel)}</span>${project.resultContext ? `<span class="metric-context">${escapeHtml(project.resultContext)}</span>` : ''}</p>` : '');

  return { t, asset, href, renderFigure, renderChart, tags, meta, status, links, metric };
}

// Every project in page order, with its home section and its number.
function allProjects(lang) {
  return [
    ...projectsData.map((p) => ({ ...localize(p, lang), section: 'proyectos' })),
    ...mlProjectsData.map((p) => ({ ...localize(p, lang), section: 'machine-learning' })),
  ].map((project, index) => ({ ...project, index }));
}

function renderPage({ lang, dir }) {
  const h = helpers(lang, dir);
  const { t, asset, href } = h;
  const projects = allProjects(lang);
  const moreProjects = moreProjectsData.map((p) => localize(p, lang));

  // A card leads to the project page. Its title link stretches over the card, so the card reads as one link.
  function renderThumb(project) {
    const image = project.image;
    if (image) {
      const darkSource = image.darkSrc ? `<source media="(prefers-color-scheme: dark)" srcset="${asset(inlineSource(image.darkSrc))}" />` : '';
      return `<div class="card-thumb"><picture${image.darkSrc ? ' data-theme-picture' : ''}>${darkSource}<img src="${asset(inlineSource(image.src))}" alt="" loading="lazy" decoding="async" width="${Number(image.width)}" height="${Number(image.height)}" /></picture></div>`;
    }
    // Without a capture the card shows the project's key figure on the ink color of the hero.
    const figure = project.resultLabel
      ? `<span class="card-figure">${escapeHtml(project.result)}</span><span class="card-figure-label">${escapeHtml(project.resultLabel)}</span>`
      : `<span class="card-figure card-figure--stack">${project.stack.slice(0, 3).map(escapeHtml).join(' · ')}</span>`;
    return `<div class="card-thumb card-thumb--text" aria-hidden="true">${figure}</div>`;
  }
  const renderCard = (project, feature) => `<article class="card${feature ? ' card--feature' : ''}" id="${escapeHtml(project.id)}" data-reveal>
      ${renderThumb(project)}
      <div class="card-body">
        ${h.meta(project.index, project.category)}
        <h3 class="card-title"><a class="card-link" href="${href(projectDirFor(lang, project.id))}">${escapeHtml(project.displayName || project.name)}</a></h3>
        <p class="card-line">${escapeHtml(project.headline || project.description)}</p>
        ${feature && project.challenge ? `<p class="card-result"><span>${t.result}</span>${escapeHtml(project.result)}</p>` : ''}
        <p class="card-foot">${h.status(project)}<span class="card-stack">${project.stack.slice(0, 3).map(escapeHtml).join(' · ')}</span></p>
        <span class="card-more" aria-hidden="true">${t.viewProject} <span class="arrow">→</span></span>
      </div>
    </article>`;

  const renderMore = (project) => `<li><a class="more-link" href="${checkedUrl(project.repositoryUrl)}" aria-label="${escapeHtml(t.repoAria(project.name))}"><span class="more-name">${escapeHtml(project.name)}</span><span class="more-desc">${escapeHtml(project.description)}</span><span class="more-stack">${project.stack.map(escapeHtml).join(' · ')}</span>${arrow}</a></li>`;

  const software = projects.filter((p) => p.section === 'proyectos');
  const ml = projects.filter((p) => p.section === 'machine-learning');
  const sectionHead = (num, s, titleId) => `<header class="section-head" data-reveal><p class="section-label"><span>${num}</span> ${s.label}</p><div><h2 id="${titleId}">${s.title}</h2><p>${s.lead}</p></div></header>`;
  const section = `<section class="section projects-section" id="proyectos" aria-labelledby="projects-title">
      <div class="container">
        ${sectionHead('02', t.projectsSection, 'projects-title')}
        <div class="cards cards--software">
    ${software.map((project, i) => renderCard(project, i === 0)).join('\n    ')}
        </div>
        ${moreProjects.length ? `<aside class="more" aria-labelledby="more-title" data-reveal><h3 id="more-title" class="more-title">${t.alsoOnGithub}</h3><ul class="more-list">${moreProjects.map(renderMore).join('')}</ul></aside>` : ''}
      </div>
    </section>
    <section class="section ml-section" id="machine-learning" aria-labelledby="ml-title">
      <div class="container">
        ${sectionHead('03', t.mlSection, 'ml-title')}
        <div class="cards cards--ml">
    ${ml.map((project) => renderCard(project, false)).join('\n    ')}
        </div>
      </div>
    </section>`;

  const channels = [];
  // Freelance clients usually write first: direct channels lead, LinkedIn follows.
  if (contact.whatsapp) {
    // International format without symbols, e.g. 5491112345678.
    const digits = String(contact.whatsapp).replace(/\D/g, '');
    if (!/^\d{8,15}$/.test(digits)) throw new Error('Invalid WhatsApp number');
    channels.push({ name: 'WhatsApp', purpose: t.whatsapp, href: `https://wa.me/${digits}?text=${encodeURIComponent(t.whatsappMessage)}`, display: t.whatsappDisplay });
  }
  if (contact.email) {
    if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(contact.email)) throw new Error('Invalid contact email');
    channels.push({ name: 'Email', purpose: t.email, href: `mailto:${contact.email}`, display: contact.email, copy: contact.email });
  }
  if (contact.linkedinUrl) {
    const url = new URL(contact.linkedinUrl);
    if (url.protocol !== 'https:' || !['linkedin.com', 'www.linkedin.com'].includes(url.hostname)) throw new Error('Invalid LinkedIn contact URL');
    channels.push({ name: 'LinkedIn', purpose: t.linkedin, href: contact.linkedinUrl, display: `${url.hostname.replace(/^www\./, '')}${url.pathname.replace(/\/$/, '')}` });
  }
  // The page's own language comes first, both in Contact and in the hero download link.
  const cvFiles = (contact.cv || []).map((cv) => {
    if (!/^\.\/assets\/cv\/[\w.-]+\.pdf$/.test(cv.file) || !existsSync(new URL(cv.file, projectRoot))) throw new Error(`Missing CV file: ${cv.file}`);
    return cv;
  }).sort((a, b) => (b.lang === lang) - (a.lang === lang));
  const channelRow = ({ name, purpose, href, display, copy }) => `<li class="channel-item"><a class="channel" href="${escapeHtml(href)}"><span class="channel-name">${escapeHtml(name)}</span><span class="channel-purpose">${escapeHtml(purpose)}</span><span class="channel-value">${escapeHtml(display)} ${arrow}</span></a>${copy ? `<button class="channel-copy" type="button" data-copy="${escapeHtml(copy)}" hidden><span data-copy-label>${t.copy}</span><span class="sr-only"> ${escapeHtml(name.toLowerCase())}</span></button>` : ''}</li>`;
  const c = t.contactSection;
  const contactSection = channels.length ? `<section class="section contact-section" id="contacto" aria-labelledby="contact-title">
      <div class="container">
        <div class="contact-panel" data-reveal>
          <div class="contact-copy"><p class="section-label"><span>05</span> ${c.label}</p><h2 id="contact-title">${c.title}</h2><p>${c.lead} ${channels.length === 1 ? c.single(channels[0].name) : c.multiple}</p></div>
          <ul class="channels">${channels.map(channelRow).join('')}${channelRow({ name: 'GitHub', purpose: t.github, href: 'https://github.com/Franc0-1', display: 'github.com/Franc0-1' })}</ul>
        </div>
      </div>
    </section>` : '';
  const contactAction = (channels.length
    ? `<a class="btn btn--ghost-ink" href="#contacto">${t.contactMe}</a>`
    : `<a class="btn btn--ghost-ink" href="https://github.com/Franc0-1">GitHub ${arrow}</a>`)
    + (cvFiles.length ? `<a class="hero-cv link-arrow" href="${asset(cvFiles[0].file)}" download hreflang="${escapeHtml(cvFiles[0].lang)}">${t.downloadCv} ${downArrow}</a>` : '');

  return [['projects', section], ['contact-action', contactAction], ['contact', contactSection]];
}

const ids = [...projectsData, ...mlProjectsData].map((project) => project.id);
if (new Set(ids).size !== ids.length || ids.some((id) => !/^[a-z][a-z0-9-]*$/.test(id))) throw new Error('Project IDs must be unique lowercase slugs.');

// Browsers without light-dark() (Safari before 17.5) get the same tokens as plain values,
// derived from the declarations in styles.css so the palette keeps a single source.
async function writeColorFallback() {
  const cssPath = new URL('styles.css', projectRoot);
  const css = await readFile(cssPath, 'utf8');
  const tokens = [...css.matchAll(/^\s*(--[\w-]+):\s*([^;]*light-dark\([^;]*);/gm)].map(([, name, value]) => [name, value.trim()]);
  if (!tokens.length) throw new Error('No light-dark() tokens found in styles.css.');
  const pick = (value, index) => value.replace(/light-dark\(\s*([^,()]+?)\s*,\s*([^()]+?)\s*\)/g, (_, light, dark) => (index ? dark : light));
  const declarations = (index, indent) => tokens.map(([name, value]) => `${indent}${name}: ${pick(value, index)};`).join('\n');
  const block = `/* light-dark-fallback:start */
/* Generated by scripts/build.mjs from the light-dark() tokens above. Do not edit. */
@supports not (color: light-dark(#000, #fff)) {
  :root {
${declarations(0, '    ')}
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
${declarations(1, '      ')}
    }
  }
  :root[data-theme="dark"] {
${declarations(1, '    ')}
  }
}
/* light-dark-fallback:end */`;
  const region = /\/\* light-dark-fallback:start \*\/[\s\S]*?\/\* light-dark-fallback:end \*\//;
  if (!region.test(css)) throw new Error('Expected the light-dark-fallback region in styles.css.');
  await writeFile(cssPath, css.replace(region, () => block));
  return tokens.length;
}
const fallbackTokens = await writeColorFallback();

const homes = {};
for (const page of PAGES) {
  const pagePath = new URL(page.file, projectRoot);
  let output = await readFile(pagePath, 'utf8');
  for (const [name, content] of renderPage(page)) {
    const region = new RegExp(`([ \\t]*)<!-- ${name}:start -->[\\s\\S]*?<!-- ${name}:end -->`, 'g');
    if ([...output.matchAll(region)].length !== 1) throw new Error(`Expected one ${name} region in ${page.file}.`);
    output = output.replace(region, (_, indent) => `${indent}<!-- ${name}:start -->\n${indent}${content}\n${indent}<!-- ${name}:end -->`);
  }
  await writeFile(pagePath, output);
  homes[page.lang] = output;
}

// Project pages reuse the home page's header, footer and preview dialog, so the chrome has a single source.
function chromeOf(home, file) {
  const pick = (pattern, name) => {
    const match = home.match(pattern);
    if (!match) throw new Error(`Expected the ${name} in ${file}.`);
    return match[0];
  };
  return {
    skip: pick(/<a class="skip-link"[^>]*>[^<]*<\/a>/, 'skip link'),
    header: pick(/<header class="site-header">[\s\S]*?\n {4}<\/header>/, 'site header'),
    footer: pick(/<footer class="site-footer">[\s\S]*?<\/footer>/, 'footer'),
    dialog: pick(/<dialog class="project-preview"[\s\S]*?<\/dialog>/, 'preview dialog'),
  };
}

function renderProjectPage(lang, project, projects) {
  const page = pageFor(lang);
  const other = PAGES.find((p) => p.lang !== lang);
  const dir = projectDirFor(lang, project.id);
  const h = helpers(lang, dir);
  const { t, asset, href } = h;
  const home = href(page.dir);
  const chrome = chromeOf(homes[lang], page.file);
  const name = escapeHtml(project.displayName || project.name);
  const summary = project.headline || project.description;
  const url = (path) => escapeHtml(SITE + path);

  // Header links point back to the home sections; the language switch goes to the same project.
  const header = chrome.header
    .replace(/href="#/g, `href="${home}#`)
    .replace(/(<a class="lang-link" href=")[^"]*"/, `$1${href(projectDirFor(other.lang, project.id))}"`)
    .replace(`class="nav-link" href="${home}#${project.section}"`, `class="nav-link" href="${home}#${project.section}" aria-current="page"`);
  const footer = chrome.footer.replace('href="#inicio"', 'href="#contenido"');

  const media = project.image ? h.renderFigure(project) : project.chart ? h.renderChart(project) : '';
  const outcome = project.challenge && project.result
    ? `<dl class="outcome"><div><dt>${t.challenge}</dt><dd>${escapeHtml(project.challenge)}</dd></div><div><dt>${t.result}</dt><dd>${escapeHtml(project.result)}</dd></div></dl>`
    : '';
  const about = project.problem
    ? `<section class="case-block" aria-labelledby="about-${escapeHtml(project.id)}"><h2 class="case-h2" id="about-${escapeHtml(project.id)}">${t.about}</h2><p>${escapeHtml(project.description)}</p><dl class="context"><div><dt>${t.problem}</dt><dd>${escapeHtml(project.problem)}</dd></div><div><dt>${t.solution}</dt><dd>${escapeHtml(project.solution)}</dd></div></dl></section>`
    : '';
  const facts = [
    [t.contribution, project.contribution && escapeHtml(withoutPeriod(project.contribution))],
    [t.status, h.status(project)],
    [t.scope, project.scope && escapeHtml(project.scope)],
    [t.stack, h.tags(project)],
  ].filter(([, value]) => value).map(([label, value]) => `<div class="spec-row spec-row--wide"><dt>${label}</dt><dd>${value}</dd></div>`).join('');

  const pagerLink = (target, kind) => (target
    ? `<a class="case-pager-link case-pager-link--${kind}" href="${href(projectDirFor(lang, target.id))}"><span class="case-pager-label">${kind === 'prev' ? `<span class="arrow" aria-hidden="true">←</span> ${t.previous}` : `${t.next} <span class="arrow" aria-hidden="true">→</span>`}</span><span class="case-pager-name">${escapeHtml(target.displayName || target.name)}</span></a>`
    : '<span></span>');
  const position = projects.findIndex((p) => p.id === project.id);

  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <meta name="theme-color" content="#f5f0e6" />
    <title>${name} — Franco Sebastian Gutierrez</title>
    <meta name="description" content="${escapeHtml(summary)}" />
    <meta property="og:type" content="article" />
    <meta property="og:locale" content="${t.locale}" />
    <meta property="og:site_name" content="Franco Sebastian Gutierrez" />
    <meta property="og:url" content="${url(dir)}" />
    <meta property="og:title" content="${name} — Franco Sebastian Gutierrez" />
    <meta property="og:description" content="${escapeHtml(summary)}" />
    <meta property="og:image" content="${url(`assets/og/og-${lang}.png`)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="canonical" href="${url(dir)}" />
    <link rel="alternate" hreflang="es" href="${url(projectDirFor('es', project.id))}" />
    <link rel="alternate" hreflang="en" href="${url(projectDirFor('en', project.id))}" />
    <link rel="alternate" hreflang="x-default" href="${url(projectDirFor('es', project.id))}" />
    <link rel="icon" type="image/svg+xml" href="${asset('./assets/favicon.svg')}" />
    <link rel="icon" type="image/png" sizes="32x32" href="${asset('./assets/favicon-32.png')}" />
    <link rel="apple-touch-icon" href="${asset('./assets/apple-touch-icon.png')}" />
    <link rel="preload" href="${asset('./assets/fonts/archivo-latin-var.woff2')}" as="font" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="${asset('./styles.css')}" />
    <script src="${asset('./scripts/theme-init.js')}"></script>
    <script src="${asset('./scripts/main.js')}" defer></script>
  </head>
  <body>
    ${chrome.skip}
    ${header}

    <main id="contenido">
      <article class="case" aria-labelledby="case-title">
        <div class="container">
          <p class="case-back"><a class="link-arrow" href="${home}#${project.section}"><span class="arrow arrow--back" aria-hidden="true">←</span> ${t.allProjects}</a></p>
          <header class="case-head">
            ${h.meta(project.index, project.category)}
            <h1 id="case-title">${name}</h1>
            <p class="case-lead">${escapeHtml(summary)}</p>
            ${project.context ? `<p class="project-context">${escapeHtml(project.context)}</p>` : ''}
          </header>
          ${media ? `<div class="case-media">${media}</div>` : ''}
          <div class="case-grid">
            <div class="case-main">
              ${outcome}
              ${about}
              <section class="case-block" aria-labelledby="notes-${escapeHtml(project.id)}"><h2 class="case-h2" id="notes-${escapeHtml(project.id)}">${t.technical}</h2><ul class="case-notes">${project.technicalNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join('')}</ul></section>
            </div>
            <aside class="case-aside" aria-label="${t.facts}">
              ${h.metric(project)}
              <dl class="spec">${facts}</dl>
              <div class="project-actions">${h.links(project)}</div>
            </aside>
          </div>
          <nav class="case-pager" aria-label="${t.pager}">${pagerLink(projects[position - 1], 'prev')}${pagerLink(projects[position + 1], 'next')}</nav>
        </div>
      </article>

      <section class="case-cta" aria-labelledby="case-cta-title">
        <div class="container">
          <div class="case-cta-panel">
            <h2 id="case-cta-title">${t.caseCta.title}</h2>
            <p>${t.caseCta.text}</p>
            <a class="btn btn--primary" href="${home}#contacto">${t.caseCta.button}</a>
          </div>
        </div>
      </section>
    </main>

    ${footer}

    ${chrome.dialog}
  </body>
</html>
`;
}

// The project folders only hold generated pages: they are rebuilt from scratch on every run.
let projectPages = 0;
for (const page of PAGES) {
  const folder = new URL(page.projectDir, projectRoot);
  if (!/^(en\/)?(proyectos|projects)\/$/.test(page.projectDir)) throw new Error(`Refusing to clean ${page.projectDir}.`);
  await rm(folder, { recursive: true, force: true });
  const projects = allProjects(page.lang);
  for (const project of projects) {
    const dir = new URL(projectDirFor(page.lang, project.id), projectRoot);
    await mkdir(dir, { recursive: true });
    await writeFile(new URL('index.html', dir), renderProjectPage(page.lang, project, projects));
    projectPages++;
  }
}

// The sitemap lists every page with its language alternate.
const sitemapEntry = (es, en) => [es, en].map((loc) => `  <url>
    <loc>${SITE}${loc}</loc>
    <xhtml:link rel="alternate" hreflang="es" href="${SITE}${es}" />
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${en}" />
  </url>`).join('\n');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[sitemapEntry('', 'en/'), ...allProjects('es').map((p) => sitemapEntry(projectDirFor('es', p.id), projectDirFor('en', p.id)))].join('\n')}
</urlset>
`;
await writeFile(new URL('sitemap.xml', projectRoot), sitemap);

console.log(`Generated ${PAGES.map((p) => p.file).join(' and ')}, ${projectPages} project pages, sitemap.xml and ${fallbackTokens} fallback color tokens: ${projectsData.length} featured projects, ${mlProjectsData.length} ML/data projects and ${moreProjectsData.length} additional repositories.`);
