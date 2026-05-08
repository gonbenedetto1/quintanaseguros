/* =========================================================
   POST RENDER — fetch nota individual desde qr_posts y la
   muestra en post.html?slug=xxx
   ========================================================= */

(async function () {
  const article = document.getElementById('post-article');
  if (!article) return;

  const slug = new URLSearchParams(location.search).get('slug');
  if (!slug) {
    article.innerHTML = `
      <div style="text-align: center; padding: 80px 20px; color: var(--color-text-muted);">
        <p>No se especificó qué nota mostrar.</p>
        <p><a href="blog.html" style="color: var(--color-primary); font-weight: 600;">← Ver todas las notas</a></p>
      </div>`;
    return;
  }

  const SUPABASE_URL = 'https://imovmcyiegrgwhxibcjf.supabase.co/rest/v1';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imltb3ZtY3lpZWdyZ3doeGliY2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MDk1NTYsImV4cCI6MjA5MjQ4NTU1Nn0.Bnr_IF6xOHfRXi0lUmoBDlKBWUaUhaUdeP_BgjZhokY';

  function escape(s) {
    return String(s || '').replace(/[<>&"']/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;' }[c]));
  }
  function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/qr_posts?slug=eq.${encodeURIComponent(slug)}&published=eq.true&select=*`,
      {
        headers: {
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`
        }
      }
    );
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const posts = await res.json();

    if (!posts.length) {
      article.innerHTML = `
        <div style="text-align: center; padding: 80px 20px; color: var(--color-text-muted);">
          <p style="font-size: 1.1rem; margin-bottom: 8px;">📄 Esta nota no existe o ya no está disponible.</p>
          <p><a href="blog.html" style="color: var(--color-primary); font-weight: 600;">← Ver todas las notas</a></p>
        </div>`;
      return;
    }

    const post = posts[0];

    // Update SEO meta tags
    document.title = `${post.title} | Quintana Ruiz`;
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta && post.excerpt) descMeta.setAttribute('content', post.excerpt);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', `https://quintanaruiz.com.ar/post.html?slug=${encodeURIComponent(post.slug)}`);

    // Schema.org BlogPosting JSON-LD
    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      author: { '@type': 'Organization', name: 'Quintana Ruiz Asesores de Seguros' },
      datePublished: post.published_at || post.created_at,
      dateModified: post.updated_at || post.published_at || post.created_at,
      image: post.cover_image,
      publisher: {
        '@type': 'Organization',
        name: 'Quintana Ruiz Asesores de Seguros',
        logo: { '@type': 'ImageObject', url: 'https://quintanaruiz.com.ar/assets/img/logo.png' }
      }
    });
    document.head.appendChild(schemaScript);

    // Render article
    article.innerHTML = `
      <div class="breadcrumbs" style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 20px;">
        <a href="index.html" style="color: var(--color-primary);">Inicio</a> ›
        <a href="blog.html" style="color: var(--color-primary);">Blog</a> ›
        ${escape(post.title)}
      </div>
      <span class="category">${escape(post.category || 'General')}</span>
      <h1>${escape(post.title)}</h1>
      <div class="meta">
        <span>Publicado el ${formatDate(post.published_at || post.created_at)}</span>
        <span>·</span>
        <span>${post.read_minutes || 5} min de lectura</span>
        <span>·</span>
        <span>Por Equipo Quintana Ruiz</span>
      </div>
      ${post.cover_image ? `<img class="featured" src="${escape(post.cover_image)}" alt="${escape(post.title)}" />` : ''}
      <div class="article-body">
        ${post.content_html || '<p><em>Esta nota no tiene contenido todavía.</em></p>'}
      </div>
      <div class="article-cta">
        <h3>¿Necesitás un seguro a tu medida?</h3>
        <p>Hablanos y te asesoramos en menos de 24hs, sin compromiso.</p>
        <a href="contacto.html#cotizar" class="btn btn-primary">Pedir cotización</a>
      </div>
    `;
  } catch (err) {
    console.error('[post-render]', err);
    article.innerHTML = `
      <div style="text-align: center; padding: 80px 20px; color: var(--color-text-muted);">
        <p>No se pudo cargar la nota. Probá refrescar la página.</p>
        <p><a href="blog.html" style="color: var(--color-primary); font-weight: 600;">← Ver todas las notas</a></p>
      </div>`;
  }
})();
