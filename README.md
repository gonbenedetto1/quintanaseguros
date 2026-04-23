# Quintana Ruiz Asesores de Seguros — Web

Rediseño web profesional para aseguradora con foco en conversión y SEO.

## Stack

- HTML5 semántico
- CSS puro con design system (variables, grid, flexbox)
- JavaScript vanilla (sin dependencias)
- Imágenes desde Unsplash (reemplazar por reales en producción)
- Google Fonts (Inter + Poppins)

## Estructura

```
quintana-ruiz-web/
├── index.html                          Home
├── nosotros.html                       Nosotros + equipo + historia
├── coberturas.html                     Overview de todas las coberturas
├── seguros-auto.html                   Landing Auto + cotizador
├── seguros-hogar.html                  Landing Hogar + cotizador
├── seguros-comercio.html               Landing Comercio/PyMEs + cotizador
├── companias.html                      Compañías aseguradoras partners
├── blog.html                           Índice del blog
├── blog/
│   └── terceros-completo-vs-todo-riesgo.html   Artículo ejemplo
├── contacto.html                       Contacto + formulario + mapa
├── robots.txt                          Directiva para crawlers
├── sitemap.xml                         Sitemap XML para Google
└── assets/
    ├── css/style.css                   Design system completo
    ├── js/main.js                      Interacciones (nav, forms, scroll reveal)
    └── img/
        ├── logo.svg                    Logo (reemplazar por PNG real)
        └── favicon.svg                 Favicon
```

## Cómo verlo localmente

**Opción 1 — Doble click:** abrí `index.html` en tu navegador. Listo.

**Opción 2 — Servidor local (recomendado para ver bien el Google Maps):**
```bash
cd quintana-ruiz-web
python3 -m http.server 8000
# Abrir http://localhost:8000
```

## Deploy

### Netlify (recomendado, 1 minuto)
1. Ir a [netlify.com](https://netlify.com)
2. Drag & drop de la carpeta `quintana-ruiz-web` completa
3. Listo — sitio en vivo

### Vercel
```bash
npx vercel
```

### Hosting tradicional
Subir por FTP todos los archivos a la raíz del hosting.

## Cosas a reemplazar antes de ir a producción

- [ ] Logo real → reemplazar `assets/img/logo.svg` por PNG/SVG oficial
- [ ] Imágenes reales → reemplazar las de Unsplash por fotos reales del equipo, oficina, etc.
- [ ] Fotos del equipo → reemplazar en `index.html` y `nosotros.html`
- [ ] Nombres/roles reales del equipo (hoy son 3 ficticios)
- [ ] Dirección real → actualizar en footer y schema.org de todas las páginas
- [ ] Teléfono y WhatsApp reales
- [ ] Formularios → conectar a un backend real (Formspree, Netlify Forms, o API propia). Hoy solo muestran mensaje de éxito demo.
- [ ] Google Analytics / Tag Manager
- [ ] Meta Pixel (si se usará Facebook Ads)
- [ ] Cambiar URL canonical `https://quintanaruiz.com.ar/` por la definitiva
- [ ] Reemplazar el iframe del mapa por un embed con la dirección exacta
- [ ] Google Business Profile — verificar y optimizar
- [ ] Subir a Google Search Console + cargar sitemap.xml

## SEO incluido

- Meta titles y descriptions optimizados por página
- Schema.org: InsuranceAgency (LocalBusiness), FAQPage, BlogPosting
- Sitemap XML
- robots.txt
- URLs amigables
- Jerarquía correcta de headings (H1 único por página, H2/H3 bien usados)
- Canonical tags
- Open Graph para redes sociales
- Imágenes con `alt` descriptivo
- `lazy loading` en imágenes secundarias
- HTML semántico (header, nav, main, section, article, footer)

## Mobile

Diseño mobile-first con breakpoints en 960px, 768px, 640px y 400px. Probado a nivel componente (nav, hero, coberturas, forms, footer). Menú hamburguesa con dropdown accesible.

## Features incluidos

- ✅ Hero con CTAs múltiples
- ✅ Selector rápido de coberturas
- ✅ Carrusel infinito de compañías aseguradoras
- ✅ Sección equipo con fotos y roles
- ✅ Reviews de Google (ejemplos — integrar API real cuando haya reseñas)
- ✅ Blog con artículo completo de muestra
- ✅ Cotizadores online específicos por cobertura
- ✅ Tabla comparativa de coberturas (auto)
- ✅ FAQ con Schema.org
- ✅ Formulario de contacto con tipo de consulta
- ✅ Mapa de Google Maps embebido
- ✅ Botón flotante de WhatsApp con pulse animation
- ✅ Contador animado de estadísticas
- ✅ Scroll reveal animations
- ✅ Menú mobile con dropdown

## Próximos pasos sugeridos (fase 2)

- Área privada de clientes (login + dashboard de pólizas)
- Cotizador inteligente conectado a APIs de aseguradoras
- Chatbot automático en WhatsApp
- Más contenido del blog (2-4 artículos por mes)
- Recursos descargables (lead magnets)
- Integración con CRM (HubSpot, Pipedrive)
