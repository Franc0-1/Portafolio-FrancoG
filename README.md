# Portfolio · Franco Sebastian Gutierrez

Portfolio personal en español e inglés: desarrollo web, backend y machine learning. Hecho con HTML, CSS y JavaScript nativo, sin frameworks ni dependencias en el navegador.

- Español: `index.html`
- English: `en/index.html`

## Vista local

```sh
python -m http.server 5173
```

Abrir http://localhost:5173. También funciona abriendo `index.html` directamente; servido por HTTP evita el aviso del navegador sobre la precarga de la fuente.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `index.html`, `en/index.html` | Páginas en español e inglés. Comparten los IDs de sección; las rutas de la versión inglesa usan `../`. |
| `styles.css` | Tokens de diseño (color con `light-dark()`, tipografía, espaciado), componentes y responsive. |
| `scripts/theme-init.js` | Aplica el tema guardado antes del primer render. |
| `scripts/main.js` | Tema claro/oscuro, ampliación de capturas, navegación activa, copiar mail, selector de idioma y apariciones al hacer scroll. |
| `scripts/build.mjs` | Genera los bloques de proyectos, índice y contacto de ambas páginas a partir de `data/`. |
| `scripts/dist.mjs` | Arma `dist/` con solo los archivos del sitio, listo para publicar. |
| `data/` | Contenido de proyectos, repositorios adicionales y contacto. |
| `assets/` | Fuentes (Archivo e IBM Plex Mono, licencia SIL OFL), capturas en PNG y WebP, CV en PDF, imágenes OpenGraph y favicon. |
| `404.html`, `robots.txt`, `sitemap.xml` | Página de error y archivos para buscadores. |
| `_headers` | Encabezados de seguridad (CSP) y caché que Cloudflare aplica a cada respuesta. |
| `wrangler.jsonc` | Configuración del Worker de Cloudflare que sirve `dist/` en el dominio. |

Las capturas muestran las aplicaciones reales con datos de ejemplo o simulados; no contienen información de usuarios.

## Actualizar el contenido

Editar los archivos de `data/` y ejecutar con Node.js:

```sh
node scripts/build.mjs
```

El generador reemplaza los bloques delimitados con comentarios (`project-index`, `projects`, `contact-action`, `contact`) en las dos páginas. No editar esos bloques a mano. El resultado es HTML estático: no hace falta Node para visitar ni alojar el sitio.

Las partes fijas (hero, servicios, perfil, footer) se editan directamente en cada página; al cambiar una, actualizar también la otra.

### Proyectos (`data/projects.json`, `data/ml-projects.json`)

- El español es la fuente. Cada proyecto lleva un bloque `en` con los campos traducidos (incluido `image` con `alt`, `caption` y `previewLabel`); el generador falla si falta.
- `contribution`, `scope`, `status` y `statusTone` (`done`, `progress` o `demo`) forman la ficha. `context` es la etiqueta bajo el titular (pasantía, freelance). `challenge` y `result` forman el bloque Desafío / Resultado; `description`, `problem`, `solution` y `technicalNotes` van en el desplegable.
- El orden de `projects.json` define la composición: el primero es el destacado y los siguientes alternan el lado de la imagen.
- `repositoryUrl` y `demoUrl` aceptan URLs HTTPS; con `null` se omiten. `repositoryPrivate: true` reemplaza el botón del repositorio por la nota "Código privado".
- `image` acepta `src`, `darkSrc`, `alt`, `width`, `height`, `caption`, `previewLabel` y `type: "interface"` para recortar capturas verticales. Si hay un `.webp` junto al PNG, la página usa el WebP y la ampliación abre el PNG.
- En ML, `result`, `resultLabel` y `resultContext` muestran una métrica con su contexto; `evaluationUrl` enlaza la evidencia.

### Contacto (`data/contact.json`)

- `linkedinUrl` debe ser HTTPS y de LinkedIn. `email` es opcional y se muestra con un botón para copiarlo.
- `whatsapp` va en formato internacional sin símbolos (`5491112345678`) y genera un enlace `wa.me` con un mensaje inicial en el idioma de la página.
- `cv` es una lista de PDFs en `assets/cv/` (`label`, `lang`, `file`). Cada página ofrece primero el de su idioma. El generador falla si falta algún archivo.

## Publicar

```sh
node scripts/build.mjs
node scripts/dist.mjs
```

`dist/` contiene solo lo que el sitio necesita y el script verifica que cada recurso enlazado exista.

El sitio está publicado en https://francosgutierrez.dev con Cloudflare Workers. Cada push a `main` dispara el build configurado en Cloudflare:

- Build: `node scripts/build.mjs && node scripts/dist.mjs`
- Deploy: `npx wrangler deploy`

`wrangler.jsonc` sirve `dist/` como archivos estáticos, muestra `404.html` para cualquier dirección inexistente y conecta el dominio con y sin `www`. Las URLs canónicas, `hreflang`, el sitemap y las imágenes OpenGraph apuntan a ese dominio; al cambiarlo, actualizar esos archivos.

La política de seguridad de `_headers` solo permite recursos del propio sitio. Si se agrega un script externo (por ejemplo, estadísticas), hay que sumar su origen a la CSP.

## Accesibilidad y rendimiento

- HTML semántico, enlace para saltar al contenido, foco visible y navegación por teclado (desplegables nativos y diálogo de capturas con retorno de foco).
- Contraste WCAG AA o superior en ambos temas; el tema respeta la preferencia del sistema hasta que se elige uno.
- `prefers-reduced-motion` desactiva las animaciones. Sin JavaScript, todo el contenido es visible.
- Fuentes autoalojadas en subconjunto latino, imágenes WebP con carga diferida y sin solicitudes a terceros.
- Los colores se declaran con `light-dark()`. Para navegadores sin soporte (Safari anterior a 17.5), `build.mjs` genera en `styles.css` un bloque equivalente con valores fijos; no editarlo a mano.
