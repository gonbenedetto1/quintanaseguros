/* =========================================================
   BLOG RENDER — fetch posts publicados desde qr_posts y los
   muestra en la grilla de blog.html
   ========================================================= */

(async function () {
  const grid = document.getElementById('blog-grid');
  if (!grid) return;

  const SUPABASE_URL = 'https://imovmcyiegrgwhxibcjf.supabase.co/rest/v1';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imltb3ZtY3lpZWdyZ3doeGliY2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MDk1NTYsImV4cCI6MjA5MjQ4NTU1Nn0.Bnr_IF6xOHfRXi0lUmoBDlKBWUaUhaUdeP_BgjZhokY';

  const fallbackImg = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&auto=format&fit=crop';

  function escape(s) {
    return String(s || '').replace(/[<>&"']/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;' }[c]));
  }
  function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/qr_posts?published=eq.true&order=published_at.desc.nullslast,created_at.desc&select=id,slug,title,excerpt,category,cover_image,read_minutes,published_at,created_at`,
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
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 80px 20px; color: var(--color-text-muted); background: var(--color-bg-soft); border-radius: var(--radius-lg);">
          <p style="font-size: 1.1rem; margin-bottom: 8px;">📝 Próximamente notas en el blog.</p>
          <p style="font-size: 0.92rem;">Estamos preparando contenido útil sobre seguros para vos.</p>
        </div>`;
      return;
    }

    grid.innerHTML = posts.map(p => `
      <article class="blog-card">
        <a href="post.html?slug=${encodeURIComponent(p.slug)}" aria-label="${escape(p.title)}">
          <img class="blog-card-img" src="${escape(p.cover_image || fallbackImg)}" alt="${escape(p.title)}" loading="lazy" />
        </a>
        <div class="blog-card-body">
          <span class="category">${escape(p.category || 'General')}</span>
          <h3><a href="post.html?slug=${encodeURIComponent(p.slug)}">${escape(p.title)}</a></h3>
          ${p.excerpt ? `<p>${escape(p.excerpt)}</p>` : ''}
          <div class="meta">${p.read_minutes || 5} min de lectura · ${formatDate(p.published_at || p.created_at)}</div>
        </div>
      </article>
    `).join('');
  } catch (err) {
    console.error('[blog-render]', err);
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--color-text-muted); background: var(--color-bg-soft); border-radius: var(--radius-lg);">
        No se pudieron cargar las notas. Probá refrescar la página.
      </div>`;
  }
})();
