/* =========================================================
   GOOGLE REVIEWS — trae reseñas reales desde Places API (New)
   Cache 24h en localStorage para minimizar requests
   Fallback: si la API falla, quedan las cards estáticas
   ========================================================= */

(async function () {
  const grid = document.querySelector('.reviews-grid');
  if (!grid) return;

  const API_KEY = 'AIzaSyBr2zUQhU9AlrXkzLnBZ_PJwNvxkqFsBsA';
  const SEARCH_QUERY = 'Quintana Ruiz Asesores de Seguros Córdoba';
  const CACHE_KEY = 'qr-google-reviews-v1';
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas
  const MAX_REVIEWS = 3;

  /* ---------- helpers ---------- */
  function escape(s) {
    return String(s || '').replace(/[<>&"']/g, c =>
      ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }

  function avatarColor(name) {
    const palette = [
      ['#4285F4', '#1A73E8'], ['#E91E63', '#C2185B'],
      ['#2E7D32', '#1B5E20'], ['#F57C00', '#E65100'],
      ['#7B1FA2', '#4A148C'], ['#00838F', '#006064']
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
    return palette[Math.abs(hash) % palette.length];
  }

  function getCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const { data, expires } = JSON.parse(raw);
      if (Date.now() > expires) { localStorage.removeItem(CACHE_KEY); return null; }
      return data;
    } catch { return null; }
  }

  function setCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data, expires: Date.now() + CACHE_TTL_MS
      }));
    } catch {}
  }

  /* ---------- fetch from Google Places API (New) ---------- */
  async function fetchPlaceWithReviews() {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.reviews,places.googleMapsUri'
      },
      body: JSON.stringify({
        textQuery: SEARCH_QUERY,
        languageCode: 'es',
        regionCode: 'AR'
      })
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Places API ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    return data.places && data.places[0] ? data.places[0] : null;
  }

  /* ---------- Google "G" logo SVG ---------- */
  const googleSVG = `<svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h5.9c-.2 1.4-1 2.6-2.2 3.4v2.8h3.6c2.1-2 3.3-4.8 3.3-8.4z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.3 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.6H2v2.9C3.8 20.6 7.6 23 12 23z"/><path fill="#FBBC05" d="M5.8 14c-.2-.7-.4-1.4-.4-2.1 0-.7.1-1.4.4-2.1V7H2c-.8 1.5-1.3 3.2-1.3 5s.5 3.5 1.3 5l3.8-3z"/><path fill="#EA4335" d="M12 4.8c1.6 0 3.1.6 4.2 1.7l3.2-3.2C17.5 1.5 14.9.5 12 .5 7.6.5 3.8 2.9 2 6.5l3.8 3c.9-2.7 3.3-4.7 6.2-4.7z"/></svg>`;

  /* ---------- render ---------- */
  function renderReviews(place) {
    if (!place || !place.reviews || !place.reviews.length) return false;

    // Actualizar score arriba (4.9 / 5.0 etc.)
    const scoreNum = document.querySelector('.google-score .score-num');
    if (scoreNum && place.rating != null) {
      scoreNum.textContent = place.rating.toFixed(1);
    }

    // Renderizar reseñas
    const reviews = place.reviews.slice(0, MAX_REVIEWS);
    grid.innerHTML = reviews.map(r => {
      const text = (r.text && r.text.text) || (r.originalText && r.originalText.text) || '';
      const author = (r.authorAttribution && r.authorAttribution.displayName) || 'Cliente';
      const photo = r.authorAttribution && r.authorAttribution.photoUri;
      const time = r.relativePublishTimeDescription || '';
      const rating = Math.round(r.rating || 5);
      const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
      const initial = (author.match(/\S/) || ['C'])[0].toUpperCase();
      const [c1, c2] = avatarColor(author);

      const avatarHTML = photo
        ? `<img class="avatar" src="${escape(photo)}" alt="${escape(author)}" referrerpolicy="no-referrer" style="width:44px;height:44px;border-radius:50%;object-fit:cover;">`
        : `<div class="avatar" style="background: linear-gradient(135deg, ${c1}, ${c2});">${escape(initial)}</div>`;

      return `
        <div class="review-card">
          <div class="stars">${stars}</div>
          <p class="quote">"${escape(text)}"</p>
          <div class="reviewer">
            ${avatarHTML}
            <div><strong>${escape(author)}</strong><span>${escape(time)}</span></div>
          </div>
          <div class="google-mark">
            ${googleSVG}
            Publicado en Google
          </div>
        </div>
      `;
    }).join('');

    return true;
  }

  /* ---------- boot ---------- */
  // 1) Mostrar cache si existe (carga rápida)
  const cached = getCache();
  if (cached) renderReviews(cached);

  // 2) Fetch fresco en background
  try {
    const place = await fetchPlaceWithReviews();
    if (place) {
      setCache(place);
      renderReviews(place);
    }
  } catch (err) {
    console.warn('[reviews-render]', err.message);
    // Si falla y no había cache, dejamos las cards estáticas del HTML
  }
})();
