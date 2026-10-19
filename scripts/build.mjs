import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';

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
const LAYOUTS = ['feature', 'split', 'compact'];

// Each page is generated from the same data; `base` turns ./assets/... into a path valid from that page.
const PAGES = [
  { lang: 'es', file: 'index.html', base: './' },
  { lang: 'en', file: 'en/index.html', base: '../' },
];

const UI = {
  es: {
    contribution: 'Mi aporte', status: 'Estado', scope: 'Alcance', stack: 'Stack', challenge: 'Desafío', result: 'Resultado',
    problem: 'Problema', solution: 'Solución', repo: 'Ver repositorio', demo: 'Ver demo', evaluation: 'Ver evaluación',
    moreDetails: 'Más detalles', technical: 'Enfoque técnico', zoom: 'Ampliar', alsoOnGithub: 'También en GitHub',
    repoAria: (n) => `Repositorio de ${n}`, demoAria: (n) => `Demo de ${n}`, evaluationAria: (n) => `Ver evaluación de ${n}`,
    moreAria: (n) => `Más detalles de ${n}`, technicalAria: (n) => `Enfoque técnico de ${n}`, zoomAria: (n) => `Ampliar captura de ${n}`,
    tagsAria: (n) => `Tecnologías de ${n}`,
    projectsSection: { label: 'Software', title: 'Herramientas internas y aplicaciones web.', lead: 'Dos sistemas en Go que automatizan trabajo administrativo, inventario y actas, y una demo frontend en React.' },
    mlSection: { label: 'ML & Data', title: 'Modelos, inferencia y análisis de datos.', lead: 'Tres proyectos de AnyoneAI: un servicio de clasificación de imágenes, la comparación de modelos de riesgo crediticio y un pipeline ELT.' },
    contactSection: {
      label: 'Contacto', title: '¿Tenés un puesto para cubrir o un proyecto en mente?',
      lead: 'Estoy disponible para oportunidades laborales y proyectos freelance, en Argentina y otros países.',
      single: (name) => `${name} es el canal más directo.`, multiple: 'Escribime por el canal que te quede más cómodo.',
    },
    linkedin: 'Empleo y propuestas', email: 'Empleo, freelance y consultas', whatsapp: 'Proyectos freelance, Argentina y exterior',
    whatsappDisplay: 'Escribir por WhatsApp', whatsappMessage: 'Hola Franco, vi tu portfolio y quería consultarte por un proyecto.',
    github: 'Código y repositorios', cv: 'Desarrollador de software · PDF', copy: 'Copiar',
    privateRepo: 'Código privado · herramienta interna',
    contactMe: 'Contactarme', downloadCv: 'Descargar CV',
  },
  en: {
    contribution: 'My role', status: 'Status', scope: 'Scope', stack: 'Stack', challenge: 'Challenge', result: 'Result',
    problem: 'Problem', solution: 'Solution', repo: 'View repository', demo: 'View demo', evaluation: 'View evaluation',
    moreDetails: 'More details', technical: 'Technical approach', zoom: 'Enlarge', alsoOnGithub: 'Also on GitHub',
    repoAria: (n) => `${n} repository`, demoAria: (n) => `${n} demo`, evaluationAria: (n) => `View ${n} evaluation`,
    moreAria: (n) => `More details about ${n}`, technicalAria: (n) => `Technical approach of ${n}`, zoomAria: (n) => `Enlarge ${n} screenshot`,
    tagsAria: (n) => `${n} technologies`,
    projectsSection: { label: 'Software', title: 'Internal tools and web applications.', lead: 'Two Go systems that automate administrative work, inventory and records, plus a React frontend demo.' },
    mlSection: { label: 'ML & Data', title: 'Models, inference and data analysis.', lead: 'Three AnyoneAI projects: an image classification service, a comparison of credit risk models and an ELT pipeline.' },
    contactSection: {
      label: 'Contact', title: 'Have a position to fill or a project in mind?',
      lead: 'I’m available for job opportunities and freelance projects, in Argentina and abroad.',
      single: (name) => `${name} is the most direct channel.`, multiple: 'Reach out through whichever channel suits you best.',
    },
    linkedin: 'Jobs and proposals', email: 'Jobs, freelance and inquiries', whatsapp: 'Freelance projects, Argentina and abroad',
    whatsappDisplay: 'Message on WhatsApp', whatsappMessage: 'Hi Franco, I saw your portfolio and would like to ask about a project.',
    github: 'Code and repositories', cv: 'Software developer · PDF', copy: 'Copy',
    privateRepo: 'Private code · internal tool',
    contactMe: 'Contact me', downloadCv: 'Download CV',
  },
};

// Spanish is the source; other languages override fields from each item's "en" block.
function localize(item, lang) {
  const { en, ...base } = item;
  if (lang === 'es') return base;
  if (!en) throw new Error(`Missing "${lang}" translation: ${item.id || item.name}`);
  return { ...base, ...en, ...(base.image ? { image: { ...base.image, ...en.image } } : {}) };
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

function renderPage({ lang, base }) {
  const t = UI[lang];
  const asset = (path) => escapeHtml(path.replace(/^\.\//, base));
  const projects = projectsData.map((p) => localize(p, lang));
  const mlProjects = mlProjectsData.map((p) => localize(p, lang));
  const moreProjects = moreProjectsData.map((p) => localize(p, lang));

  function renderFigure(project) {
    const image = project.image;
    if (!image) return '';
    if (!image.alt?.trim() || !(image.width > 0) || !(image.height > 0)) throw new Error(`Invalid project image: ${project.id}`);
    const caption = escapeHtml(image.caption || project.name);
    const darkSource = image.darkSrc ? `<source media="(prefers-color-scheme: dark)" srcset="${asset(inlineSource(image.darkSrc))}" />` : '';
    return `<figure class="frame${image.type === 'interface' ? ' frame--crop' : ''}">
        <figcaption class="frame-bar">${caption}</figcaption>
        <a class="frame-link" href="${asset(image.src)}" target="_blank" rel="noopener" data-project-preview data-project-name="${escapeHtml(project.name)}" data-caption="${caption}" data-light-src="${asset(image.src)}"${image.darkSrc ? ` data-dark-src="${asset(image.darkSrc)}"` : ''} aria-label="${escapeHtml(image.previewLabel || t.zoomAria(project.name))}"><picture${image.darkSrc ? ' data-theme-picture' : ''}>${darkSource}<img src="${asset(inlineSource(image.src))}" alt="${escapeHtml(image.alt)}" loading="lazy" decoding="async" width="${Number(image.width)}" height="${Number(image.height)}" /></picture><span class="frame-zoom" aria-hidden="true">${t.zoom} ↗</span></a>
      </figure>`;
  }

  const tags = (project) => `<ul class="tags" aria-label="${escapeHtml(t.tagsAria(project.name))}">${project.stack.map((tech) => `<li>${escapeHtml(tech)}</li>`).join('')}</ul>`;
  const meta = (index, category) => `<p class="item-meta"><span class="item-num">${number(index)}</span><span>${escapeHtml(category)}</span></p>`;

  function status(project) {
    if (!project.status) return '';
    if (!STATUS_TONES.includes(project.statusTone)) throw new Error(`Invalid statusTone: ${project.id}`);
    return `<span class="state state--${project.statusTone}">${escapeHtml(withoutPeriod(project.status))}</span>`;
  }

  function renderProject(project, index) {
    const facts = [
      ['contribution', project.contribution && escapeHtml(withoutPeriod(project.contribution))],
      ['status', status(project)],
      ['scope', project.scope && escapeHtml(project.scope)],
    ].filter(([, value]) => value);
    // An unpaired short fact takes the full row so the two-column spec never leaves a gap.
    const shortFacts = facts.filter(([key]) => key !== 'scope').length;
    const isWide = (key, i) => key === 'scope' || (shortFacts % 2 === 1 && i === shortFacts - 1);
    // Internal tools keep their code private: the card says so instead of linking to a 404.
    const repository = project.repositoryPrivate
      ? `<span class="private-note">${t.privateRepo}</span>`
      : externalLink(project.repositoryUrl, t.repo, t.repoAria(project.name), 'btn btn--outline btn--sm');
    const links = repository
      + externalLink(project.demoUrl, t.demo, t.demoAria(project.name), 'btn btn--outline btn--sm');
    return `<article class="project project--${LAYOUTS[index] || 'compact'}" id="${escapeHtml(project.id)}" aria-labelledby="${escapeHtml(project.id)}-title" data-reveal>
      <header class="project-head">
        ${meta(index, project.category)}
        <h3 id="${escapeHtml(project.id)}-title">${escapeHtml(project.name)}</h3>
        <p class="project-headline">${escapeHtml(project.headline)}</p>
        ${project.context ? `<p class="project-context">${escapeHtml(project.context)}</p>` : ''}
      </header>
      ${project.image ? `<div class="project-media">${renderFigure(project)}</div>` : ''}
      <div class="project-body">
        ${project.challenge && project.result ? `<dl class="outcome"><div><dt>${t.challenge}</dt><dd>${escapeHtml(project.challenge)}</dd></div><div><dt>${t.result}</dt><dd>${escapeHtml(project.result)}</dd></div></dl>` : ''}
        <dl class="spec">${facts.map(([key, value], i) => `<div class="spec-row spec-row--${key}${isWide(key, i) ? ' spec-row--wide' : ''}"><dt>${t[key]}</dt><dd>${value}</dd></div>`).join('')}<div class="spec-row spec-row--wide"><dt>${t.stack}</dt><dd>${tags(project)}</dd></div></dl>
        ${links ? `<div class="project-actions">${links}</div>` : ''}
        <details class="disclosure"><summary aria-label="${escapeHtml(t.moreAria(project.name))}">${t.moreDetails}<span class="disclosure-icon" aria-hidden="true"></span></summary>
          <div class="disclosure-body">
            <p>${escapeHtml(project.description)}</p>
            <dl class="context"><div><dt>${t.problem}</dt><dd>${escapeHtml(project.problem)}</dd></div><div><dt>${t.solution}</dt><dd>${escapeHtml(project.solution)}</dd></div></dl>
            <ul>${project.technicalNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join('')}</ul>
          </div>
        </details>
      </div>
    </article>`;
  }

  function renderMlProject(project, index) {
    const result = project.result ? `<p class="metric"><strong class="metric-value">${escapeHtml(project.result)}</strong><span class="metric-label">${escapeHtml(project.resultLabel)}</span>${project.resultContext ? `<span class="metric-context">${escapeHtml(project.resultContext)}</span>` : ''}</p>` : '';
    return `<article class="ml-row${project.image ? '' : ' ml-row--text'}" id="${escapeHtml(project.id)}" aria-labelledby="${escapeHtml(project.id)}-title" data-reveal>
      <header class="ml-head">
        ${meta(index, project.category)}
        <h3 id="${escapeHtml(project.id)}-title">${escapeHtml(project.displayName || project.name)}</h3>
      </header>
      <div class="ml-copy">
        <p>${escapeHtml(project.description)}</p>
        ${result}
        ${tags(project)}
        <div class="project-actions">${externalLink(project.repositoryUrl, t.repo, t.repoAria(project.name), 'btn btn--outline btn--sm')}${externalLink(project.evaluationUrl, t.evaluation, t.evaluationAria(project.name))}</div>
      </div>
      ${project.image ? `<div class="ml-media">${renderFigure(project)}</div>` : ''}
      <details class="disclosure ml-details"><summary aria-label="${escapeHtml(t.technicalAria(project.name))}">${t.technical}<span class="disclosure-icon" aria-hidden="true"></span></summary><div class="disclosure-body"><ul>${project.technicalNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join('')}</ul></div></details>
    </article>`;
  }

  const renderMore = (project) => `<li><a class="more-link" href="${checkedUrl(project.repositoryUrl)}" aria-label="${escapeHtml(t.repoAria(project.name))}"><span class="more-name">${escapeHtml(project.name)}</span><span class="more-desc">${escapeHtml(project.description)}</span><span class="more-stack">${project.stack.map(escapeHtml).join(' · ')}</span>${arrow}</a></li>`;

  function renderIndexItem(project, index) {
    const note = project.status ? status(project) : project.result ? `<span class="state state--metric">AUC ${escapeHtml(project.result)}</span>` : '';
    return `<li><a href="#${escapeHtml(project.id)}"><span class="index-num">${number(index)}</span><span class="index-name">${escapeHtml(project.displayName || project.name)}<small>${project.stack.slice(0, 3).map(escapeHtml).join(' · ')}</small></span>${note}</a></li>`;
  }

  const projectIndex = `<div class="index-group"><p class="index-label">Software</p><ol>${projects.map(renderIndexItem).join('')}</ol></div>
          <div class="index-group"><p class="index-label">ML & Data</p><ol start="${projects.length + 1}">${mlProjects.map((project, i) => renderIndexItem(project, projects.length + i)).join('')}</ol></div>`;

  const sectionHead = (num, s, titleId) => `<header class="section-head" data-reveal><p class="section-label"><span>${num}</span> ${s.label}</p><div><h2 id="${titleId}">${s.title}</h2><p>${s.lead}</p></div></header>`;
  const section = `<section class="section projects-section" id="proyectos" aria-labelledby="projects-title">
      <div class="container">
        ${sectionHead('01', t.projectsSection, 'projects-title')}
        <div class="project-list">
    ${projects.map(renderProject).join('\n    ')}
        </div>
        ${moreProjects.length ? `<aside class="more" aria-labelledby="more-title" data-reveal><h3 id="more-title" class="more-title">${t.alsoOnGithub}</h3><ul class="more-list">${moreProjects.map(renderMore).join('')}</ul></aside>` : ''}
      </div>
    </section>
    <section class="section ml-section" id="machine-learning" aria-labelledby="ml-title">
      <div class="container">
        ${sectionHead('02', t.mlSection, 'ml-title')}
        <div class="ml-list">
    ${mlProjects.map((project, i) => renderMlProject(project, projects.length + i)).join('\n    ')}
        </div>
      </div>
    </section>`;

  const channels = [];
  if (contact.linkedinUrl) {
    const url = new URL(contact.linkedinUrl);
    if (url.protocol !== 'https:' || !['linkedin.com', 'www.linkedin.com'].includes(url.hostname)) throw new Error('Invalid LinkedIn contact URL');
    channels.push({ name: 'LinkedIn', purpose: t.linkedin, href: contact.linkedinUrl, display: `${url.hostname.replace(/^www\./, '')}${url.pathname.replace(/\/$/, '')}` });
  }
  if (contact.email) {
    if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(contact.email)) throw new Error('Invalid contact email');
    channels.push({ name: 'Email', purpose: t.email, href: `mailto:${contact.email}`, display: contact.email, copy: contact.email });
  }
  if (contact.whatsapp) {
    // International format without symbols, e.g. 5491112345678.
    const digits = String(contact.whatsapp).replace(/\D/g, '');
    if (!/^\d{8,15}$/.test(digits)) throw new Error('Invalid WhatsApp number');
    channels.push({ name: 'WhatsApp', purpose: t.whatsapp, href: `https://wa.me/${digits}?text=${encodeURIComponent(t.whatsappMessage)}`, display: t.whatsappDisplay });
  }
  // The page's own language comes first, both in Contact and in the hero download link.
  const cvFiles = (contact.cv || []).map((cv) => {
    if (!/^\.\/assets\/cv\/[\w.-]+\.pdf$/.test(cv.file) || !existsSync(new URL(cv.file, projectRoot))) throw new Error(`Missing CV file: ${cv.file}`);
    return cv;
  }).sort((a, b) => (b.lang === lang) - (a.lang === lang));
  const cvLink = (cv) => `<a class="cv-link" href="${asset(cv.file)}" download hreflang="${escapeHtml(cv.lang)}">${escapeHtml(cv.label)} ${downArrow}</a>`;
  const cvRow = cvFiles.length ? `<li class="channel-item"><div class="channel channel--files"><span class="channel-name">CV</span><span class="channel-purpose">${t.cv}</span><span class="channel-value">${cvFiles.map(cvLink).join('')}</span></div></li>` : '';
  const channelRow = ({ name, purpose, href, display, copy }) => `<li class="channel-item"><a class="channel" href="${escapeHtml(href)}"><span class="channel-name">${escapeHtml(name)}</span><span class="channel-purpose">${escapeHtml(purpose)}</span><span class="channel-value">${escapeHtml(display)} ${arrow}</span></a>${copy ? `<button class="channel-copy" type="button" data-copy="${escapeHtml(copy)}" hidden><span data-copy-label>${t.copy}</span><span class="sr-only"> ${escapeHtml(name.toLowerCase())}</span></button>` : ''}</li>`;
  const c = t.contactSection;
  const contactSection = channels.length ? `<section class="section contact-section" id="contacto" aria-labelledby="contact-title">
      <div class="container">
        <div class="contact-panel" data-reveal>
          <div class="contact-copy"><p class="section-label"><span>05</span> ${c.label}</p><h2 id="contact-title">${c.title}</h2><p>${c.lead} ${channels.length === 1 ? c.single(channels[0].name) : c.multiple}</p></div>
          <ul class="channels">${channels.map(channelRow).join('')}${cvRow}${channelRow({ name: 'GitHub', purpose: t.github, href: 'https://github.com/Franc0-1', display: 'github.com/Franc0-1' })}</ul>
        </div>
      </div>
    </section>` : '';
  const contactAction = (channels.length
    ? `<a class="btn btn--ghost-ink" href="#contacto">${t.contactMe}</a>`
    : `<a class="btn btn--ghost-ink" href="https://github.com/Franc0-1">GitHub ${arrow}</a>`)
    + (cvFiles.length ? `<a class="hero-cv link-arrow" href="${asset(cvFiles[0].file)}" download hreflang="${escapeHtml(cvFiles[0].lang)}">${t.downloadCv} ${downArrow}</a>` : '');

  return [['project-index', projectIndex], ['projects', section], ['contact-action', contactAction], ['contact', contactSection]];
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

for (const page of PAGES) {
  const pagePath = new URL(page.file, projectRoot);
  let output = await readFile(pagePath, 'utf8');
  for (const [name, content] of renderPage(page)) {
    const region = new RegExp(`([ \\t]*)<!-- ${name}:start -->[\\s\\S]*?<!-- ${name}:end -->`, 'g');
    if ([...output.matchAll(region)].length !== 1) throw new Error(`Expected one ${name} region in ${page.file}.`);
    output = output.replace(region, (_, indent) => `${indent}<!-- ${name}:start -->\n${indent}${content}\n${indent}<!-- ${name}:end -->`);
  }
  await writeFile(pagePath, output);
}
console.log(`Generated ${PAGES.map((p) => p.file).join(' and ')} and ${fallbackTokens} fallback color tokens: ${projectsData.length} featured projects, ${mlProjectsData.length} ML/data projects and ${moreProjectsData.length} additional repositories.`);
