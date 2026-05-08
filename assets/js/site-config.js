/* =========================================================
   SITE CONFIG — lee settings desde Supabase y los aplica
   en todas las páginas públicas (WhatsApp, descuento, email)
   ========================================================= */

(function () {
  const SUPABASE_URL = 'https://imovmcyiegrgwhxibcjf.supabase.co/rest/v1';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imltb3ZtY3lpZWdyZ3doeGliY2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MDk1NTYsImV4cCI6MjA5MjQ4NTU1Nn0.Bnr_IF6xOHfRXi0lUmoBDlKBWUaUhaUdeP_BgjZhokY';

  // Cache settings 60s en sessionStorage para no martillar la API
  const CACHE_KEY = 'qr-settings';
  const CACHE_TTL_MS = 60_000;

  async function fetchSettings() {
    // Intento cache
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached.expires > Date.now()) return cached.data;
      }
    } catch (e) {}

    try {
      const res = await fetch(`${SUPABASE_URL}/settings?id=eq.1&select=*`, {
        headers: {
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`
        }
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const arr = await res.json();
      const data = arr[0];
      if (!data) throw new Error('No settings row');
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, expires: Date.now() + CACHE_TTL_MS }));
      } catch (e) {}
      return data;
    } catch (err) {
      console.warn('[site-config] fallback to defaults:', err);
      return null; // los defaults del HTML quedan
    }
  }

  function applySettings(s) {
    if (!s) return;

    const wa = s.whatsapp_number;
    const waDisplay = s.whatsapp_display;
    const discount = s.discount_percent;
    const email = s.contact_email;
    const promoActive = s.promo_active;

    // 1) Reemplazar todos los wa.me/<numero>
    document.querySelectorAll('a[href*="wa.me/"]').forEach(a => {
      a.href = a.href.replace(/wa\.me\/\d+/, `wa.me/${wa}`);
      // Update %25 in pre-loaded message if exists
      a.href = a.href.replace(/%2010%25/g, `%20${discount}%25`)
                     .replace(/%2025%25/g, `%20${discount}%25`)
                     .replace(/%201[0-9]%25/g, `%20${discount}%25`)
                     .replace(/%203[0-9]%25/g, `%20${discount}%25`)
                     .replace(/%204[0-9]%25/g, `%20${discount}%25`)
                     .replace(/%205[0-9]%25/g, `%20${discount}%25`);
    });

    // 2) Tel: links
    document.querySelectorAll('a[href^="tel:"]').forEach(a => {
      // No tocamos los tel: porque pueden ser varios distintos en el footer
    });

    // 3) Display del teléfono en lugares marcados con [data-wa-display]
    document.querySelectorAll('[data-wa-display]').forEach(el => {
      el.textContent = waDisplay;
    });

    // 4) Email a mailto:
    document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
      const old = a.getAttribute('href').replace(/^mailto:/, '').split('?')[0];
      a.setAttribute('href', a.getAttribute('href').replace(old, email));
      if (a.textContent.trim() === old) a.textContent = email;
    });
    // Email texto suelto en el footer (envoltorio del icono email)
    document.querySelectorAll('.footer-contact li').forEach(li => {
      const txt = li.textContent.trim();
      if (txt.includes('@') && txt.includes('.')) {
        // Reemplaza el último nodo de texto del <li> por el nuevo email
        const lastTextNode = Array.from(li.childNodes).reverse().find(n => n.nodeType === 3 && n.textContent.trim());
        if (lastTextNode) lastTextNode.textContent = ' ' + email;
      }
    });

    // 5) % de descuento en el sitio
    document.querySelectorAll('[data-discount]').forEach(el => {
      el.textContent = `${discount}%`;
    });
    // Buscar y reemplazar texto "25%" o "25% OFF" en spans / botones / h2
    document.querySelectorAll('.discount-num, .discount-num-big').forEach(el => {
      el.textContent = `${discount}%`;
    });
    document.querySelectorAll('.btn-primary.btn-lg, .promo-modal-cta').forEach(btn => {
      if (btn.textContent.includes('OFF') || btn.textContent.includes('descuento')) {
        btn.innerHTML = btn.innerHTML.replace(/\d+%\s*OFF/g, `${discount}% OFF`);
      }
    });
    // h2 del CTA promo
    document.querySelectorAll('.cta-promo h2, #promo-modal h3').forEach(h => {
      if (/de descuento/.test(h.textContent)) {
        h.innerHTML = h.innerHTML.replace(/\d+%/g, `${discount}%`);
      }
    });

    // 6) Promo activa / inactiva
    if (promoActive === false) {
      const promoModal = document.getElementById('promo-modal');
      if (promoModal) promoModal.remove();
      document.querySelectorAll('.cta-section.cta-promo').forEach(el => el.remove());
    }
  }

  // Form submission tracking — guarda consultas en Supabase
  function setupFormTracking() {
    document.querySelectorAll('form[data-form]').forEach(form => {
      form.addEventListener('submit', async (e) => {
        // Construir el data object a partir del form
        const data = {};
        Array.from(form.elements).forEach(el => {
          if (!el.name && !el.id) return;
          const key = el.name || el.id;
          if (el.type === 'checkbox') data[key] = el.checked;
          else if (el.value !== undefined) data[key] = el.value;
        });
        const formType = form.dataset.form || 'unknown';
        // Disparamos el insert pero no bloqueamos el flow del form
        try {
          fetch(`${SUPABASE_URL}/submissions`, {
            method: 'POST',
            headers: {
              apikey: SUPABASE_ANON,
              Authorization: `Bearer ${SUPABASE_ANON}`,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal'
            },
            body: JSON.stringify({ form_type: formType, data })
          }).catch(err => console.warn('[submissions]', err));
        } catch (e) {}
      }, { capture: true });
    });
  }

  // Boot
  document.addEventListener('DOMContentLoaded', async () => {
    const settings = await fetchSettings();
    applySettings(settings);
    setupFormTracking();
  });
})();
