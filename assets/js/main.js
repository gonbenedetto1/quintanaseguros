/* =========================================================
   QUINTANA RUIZ — main.js
   Mobile nav, scroll reveal, form handling, counters
   ========================================================= */

(() => {
  'use strict';

  /* ---------- Mobile nav toggle ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        if (window.innerWidth < 769 && !a.parentElement.classList.contains('has-dropdown')) {
          nav.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  /* ---------- Scroll reveal ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(el => cio.observe(el));
  }

  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * ease).toLocaleString('es-AR') + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- Forms (demo handler) ---------- */
  document.querySelectorAll('form[data-form]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }

      setTimeout(() => {
        const success = document.createElement('div');
        success.style.cssText = `
          background: #e8f7ee; border: 1px solid #16a34a; color: #14532d;
          padding: 16px 20px; border-radius: 12px; margin-top: 18px;
          font-size: 0.95rem; font-weight: 500;
        `;
        success.innerHTML = '✅ <strong>¡Consulta enviada!</strong> Nos contactaremos a la brevedad. También podés escribirnos por WhatsApp para una respuesta inmediata.';
        form.insertAdjacentElement('afterend', success);
        form.reset();
        if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => success.remove(), 8000);
      }, 800);
    });
  });

  /* ---------- Quote form: dynamic fields ---------- */
  const coverageSelect = document.getElementById('coverage-type');
  if (coverageSelect) {
    coverageSelect.addEventListener('change', () => {
      document.querySelectorAll('[data-coverage]').forEach(block => {
        block.hidden = block.dataset.coverage !== coverageSelect.value;
      });
    });
  }

  /* ---------- Header shadow on scroll ---------- */
  const header = document.querySelector('.site-header');
  if (header) {
    const applyShadow = () => {
      if (window.scrollY > 8) header.style.boxShadow = '0 6px 20px rgba(26, 37, 86, 0.06)';
      else header.style.boxShadow = '';
    };
    applyShadow();
    window.addEventListener('scroll', applyShadow, { passive: true });
  }

  /* ---------- Current year in footer ---------- */
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
})();
