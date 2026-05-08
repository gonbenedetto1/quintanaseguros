/* =========================================================
   ADMIN PANEL — Quintana Ruiz
   Auth + Settings + Blog CRUD + Image Upload
   ========================================================= */

const SUPABASE_URL = 'https://imovmcyiegrgwhxibcjf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imltb3ZtY3lpZWdyZ3doeGliY2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MDk1NTYsImV4cCI6MjA5MjQ4NTU1Nn0.Bnr_IF6xOHfRXi0lUmoBDlKBWUaUhaUdeP_BgjZhokY';
const STORAGE_BUCKET = 'qr-blog-images';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let quill;            // Quill editor instance
let editingPostId;    // Currently editing post ID

/* =========================================================
   AUTH
   ========================================================= */

async function checkSession() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    showDashboard(session.user);
  } else {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('login-view').hidden = false;
  document.getElementById('dashboard-view').hidden = true;
}

function showDashboard(user) {
  document.getElementById('login-view').hidden = true;
  document.getElementById('dashboard-view').hidden = false;
  document.getElementById('user-email').textContent = user.email;
  loadSettings();
  loadPosts();
  loadSubmissions();
  initQuill();
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('login-error');
  const btn = e.target.querySelector('button[type="submit"]');

  errorEl.hidden = true;
  btn.disabled = true;
  btn.textContent = 'Ingresando…';

  const { data, error } = await sb.auth.signInWithPassword({ email, password });

  btn.disabled = false;
  btn.textContent = 'Iniciar sesión';

  if (error) {
    console.error('[login] Supabase error:', error);
    let msg = 'Error: ' + (error.message || 'No se pudo iniciar sesión');
    // Mensajes amigables para los errores más comunes
    if (/invalid login credentials/i.test(error.message)) {
      msg = 'Email o contraseña incorrectos.';
    } else if (/email not confirmed/i.test(error.message)) {
      msg = 'El email no está confirmado. Pedile a Pragma que active "Auto Confirm User" en Supabase.';
    } else if (/email signups are disabled/i.test(error.message)) {
      msg = 'El registro está deshabilitado. Si sos admin pedile a Pragma que cree tu usuario manualmente.';
    } else if (/network|fetch/i.test(error.message)) {
      msg = 'Error de conexión. Revisá tu internet o si Supabase está caído.';
    }
    errorEl.textContent = msg;
    errorEl.hidden = false;
    return;
  }
  showDashboard(data.user);
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await sb.auth.signOut();
  location.reload();
});

/* =========================================================
   TAB NAVIGATION
   ========================================================= */

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.tab-content').forEach(c => {
      c.classList.toggle('active', c.id === `tab-${tab}`);
    });
  });
});

/* =========================================================
   SETTINGS TAB
   ========================================================= */

async function loadSettings() {
  const { data, error } = await sb.from('qr_settings').select('*').eq('id', 1).single();
  if (error) {
    console.error('load settings:', error);
    return;
  }
  document.getElementById('whatsapp_number').value = data.whatsapp_number;
  document.getElementById('whatsapp_display').value = data.whatsapp_display;
  document.getElementById('discount_percent').value = data.discount_percent;
  document.getElementById('contact_email').value = data.contact_email;
  document.getElementById('promo_active').checked = data.promo_active;
}

document.getElementById('settings-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msgEl = document.getElementById('settings-msg');
  const btn = e.target.querySelector('button[type="submit"]');

  const updates = {
    whatsapp_number: document.getElementById('whatsapp_number').value.trim(),
    whatsapp_display: document.getElementById('whatsapp_display').value.trim(),
    discount_percent: parseInt(document.getElementById('discount_percent').value),
    contact_email: document.getElementById('contact_email').value.trim(),
    promo_active: document.getElementById('promo_active').checked
  };

  btn.disabled = true; btn.textContent = 'Guardando…';

  const { error } = await sb.from('qr_settings').update(updates).eq('id', 1);

  btn.disabled = false; btn.textContent = 'Guardar cambios';

  if (error) {
    msgEl.className = 'form-msg error';
    msgEl.textContent = 'Error: ' + error.message;
  } else {
    msgEl.className = 'form-msg success';
    msgEl.textContent = '✓ Configuración guardada. Los cambios se aplican en el sitio en segundos.';
  }
  msgEl.hidden = false;
  setTimeout(() => msgEl.hidden = true, 5000);
});

/* =========================================================
   BLOG — LIST + CRUD
   ========================================================= */

async function loadPosts() {
  const listEl = document.getElementById('posts-list');
  listEl.innerHTML = '<div class="empty-state">Cargando…</div>';

  const { data, error } = await sb.from('qr_posts').select('*').order('created_at', { ascending: false });
  if (error) { listEl.innerHTML = `<div class="empty-state">Error: ${error.message}</div>`; return; }

  if (!data.length) {
    listEl.innerHTML = '<div class="empty-state">Todavía no hay notas. Hacé click en "+ Nueva nota" para crear la primera.</div>';
    return;
  }

  listEl.innerHTML = data.map(p => `
    <div class="post-row" data-id="${p.id}">
      <div>
        <div class="post-row-title">${escapeHtml(p.title)}</div>
        <div class="post-row-meta">${escapeHtml(p.category || 'General')} · /${escapeHtml(p.slug)} · ${formatDate(p.created_at)}</div>
      </div>
      <span class="badge ${p.published ? 'published' : 'draft'}">${p.published ? 'Publicada' : 'Borrador'}</span>
      <span style="color: var(--text-light); font-size: 0.85rem;">${p.read_minutes || 5} min</span>
      <button class="btn-link">Editar →</button>
    </div>
  `).join('');

  listEl.querySelectorAll('.post-row').forEach(row => {
    row.addEventListener('click', () => openEditor(row.dataset.id));
  });
}

document.getElementById('new-post-btn').addEventListener('click', () => openEditor(null));
document.getElementById('back-to-list').addEventListener('click', () => {
  document.getElementById('post-editor').hidden = true;
  document.getElementById('posts-list').style.display = '';
  document.querySelector('#tab-blog .tab-header').style.display = '';
  loadPosts();
});

function initQuill() {
  if (quill) return;
  quill = new Quill('#post-content-editor', {
    theme: 'snow',
    placeholder: 'Empezá a escribir el contenido de la nota...',
    modules: {
      toolbar: [
        [{ header: [2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'link'],
        ['clean']
      ]
    }
  });
}

async function openEditor(id) {
  document.getElementById('posts-list').style.display = 'none';
  document.querySelector('#tab-blog .tab-header').style.display = 'none';
  document.getElementById('post-editor').hidden = false;
  document.getElementById('post-msg').hidden = true;

  if (!id) {
    // New post
    editingPostId = null;
    document.getElementById('editor-title').textContent = 'Nueva nota';
    document.getElementById('post-id').value = '';
    document.getElementById('post-title').value = '';
    document.getElementById('post-slug').value = '';
    document.getElementById('post-category').value = 'General';
    document.getElementById('post-cover').value = '';
    document.getElementById('post-cover-preview').hidden = true;
    document.getElementById('post-excerpt').value = '';
    document.getElementById('post-read-min').value = 5;
    document.getElementById('post-published').checked = false;
    document.getElementById('delete-post-btn').hidden = true;
    if (quill) quill.setContents([]);
    return;
  }

  // Edit existing
  const { data, error } = await sb.from('qr_posts').select('*').eq('id', id).single();
  if (error) { alert('Error: ' + error.message); return; }

  editingPostId = id;
  document.getElementById('editor-title').textContent = 'Editar nota';
  document.getElementById('post-id').value = id;
  document.getElementById('post-title').value = data.title;
  document.getElementById('post-slug').value = data.slug;
  document.getElementById('post-category').value = data.category || 'General';
  document.getElementById('post-cover').value = data.cover_image || '';
  document.getElementById('post-excerpt').value = data.excerpt || '';
  document.getElementById('post-read-min').value = data.read_minutes || 5;
  document.getElementById('post-published').checked = data.published;
  document.getElementById('delete-post-btn').hidden = false;

  const preview = document.getElementById('post-cover-preview');
  if (data.cover_image) { preview.src = data.cover_image; preview.hidden = false; }
  else { preview.hidden = true; }

  if (quill) {
    quill.clipboard.dangerouslyPasteHTML(data.content_html || '');
  }
}

// Auto-generate slug from title
document.getElementById('post-title').addEventListener('blur', (e) => {
  const slugInput = document.getElementById('post-slug');
  if (!slugInput.value && e.target.value) {
    slugInput.value = slugify(e.target.value);
  }
});

// Cover image upload
document.getElementById('post-cover-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const ext = file.name.split('.').pop();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await sb.storage.from(STORAGE_BUCKET).upload(filename, file);
  if (error) { alert('Error subiendo imagen: ' + error.message); return; }

  const { data: { publicUrl } } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(filename);
  document.getElementById('post-cover').value = publicUrl;
  const preview = document.getElementById('post-cover-preview');
  preview.src = publicUrl;
  preview.hidden = false;
});

// Cover URL change
document.getElementById('post-cover').addEventListener('input', (e) => {
  const preview = document.getElementById('post-cover-preview');
  if (e.target.value) { preview.src = e.target.value; preview.hidden = false; }
  else { preview.hidden = true; }
});

// Save post
document.getElementById('post-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msgEl = document.getElementById('post-msg');
  const btn = e.target.querySelector('button[type="submit"]');

  const post = {
    title: document.getElementById('post-title').value.trim(),
    slug: document.getElementById('post-slug').value.trim(),
    category: document.getElementById('post-category').value,
    cover_image: document.getElementById('post-cover').value.trim() || null,
    excerpt: document.getElementById('post-excerpt').value.trim() || null,
    content_html: quill.root.innerHTML,
    read_minutes: parseInt(document.getElementById('post-read-min').value) || 5,
    published: document.getElementById('post-published').checked,
    published_at: document.getElementById('post-published').checked ? new Date().toISOString() : null
  };

  btn.disabled = true; btn.textContent = 'Guardando…';

  let result;
  if (editingPostId) {
    result = await sb.from('qr_posts').update(post).eq('id', editingPostId);
  } else {
    result = await sb.from('qr_posts').insert(post);
  }

  btn.disabled = false; btn.textContent = 'Guardar';

  if (result.error) {
    msgEl.className = 'form-msg error';
    msgEl.textContent = 'Error: ' + result.error.message;
    msgEl.hidden = false;
    return;
  }

  msgEl.className = 'form-msg success';
  msgEl.textContent = editingPostId ? '✓ Nota actualizada.' : '✓ Nota creada.';
  msgEl.hidden = false;

  setTimeout(() => {
    document.getElementById('back-to-list').click();
  }, 800);
});

// Delete post
document.getElementById('delete-post-btn').addEventListener('click', async () => {
  if (!editingPostId) return;
  if (!confirm('¿Seguro querés eliminar esta nota? Esta acción no se puede deshacer.')) return;

  const { error } = await sb.from('qr_posts').delete().eq('id', editingPostId);
  if (error) { alert('Error: ' + error.message); return; }
  document.getElementById('back-to-list').click();
});

/* =========================================================
   SUBMISSIONS
   ========================================================= */

async function loadSubmissions() {
  const listEl = document.getElementById('submissions-list');
  listEl.innerHTML = '<div class="empty-state">Cargando…</div>';

  const { data, error } = await sb.from('qr_submissions').select('*').order('created_at', { ascending: false }).limit(100);
  if (error) { listEl.innerHTML = `<div class="empty-state">Error: ${error.message}</div>`; return; }

  if (!data.length) {
    listEl.innerHTML = '<div class="empty-state">Todavía no hay consultas recibidas.</div>';
    return;
  }

  listEl.innerHTML = data.map(s => `
    <div class="submission-row ${s.read ? '' : 'unread'}">
      <div class="meta">${formatDate(s.created_at, true)} · ${escapeHtml(s.form_type)}</div>
      <div class="data">
        ${formatSubmissionData(s.data)}
      </div>
    </div>
  `).join('');
}

function formatSubmissionData(data) {
  if (!data || typeof data !== 'object') return escapeHtml(String(data));
  const fields = [];
  if (data.name) fields.push(`<strong>Nombre:</strong> ${escapeHtml(data.name)}`);
  if (data.email) fields.push(`<strong>Email:</strong> ${escapeHtml(data.email)}`);
  if (data.phone) fields.push(`<strong>Tel:</strong> ${escapeHtml(data.phone)}`);
  if (data.coverage) fields.push(`<strong>Cobertura:</strong> ${escapeHtml(data.coverage)}`);
  if (data.message) fields.push(`<strong>Mensaje:</strong> ${escapeHtml(data.message)}`);
  return fields.join(' · ') || `<pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
}

/* =========================================================
   UTILS
   ========================================================= */

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function formatDate(iso, withTime) {
  if (!iso) return '';
  const d = new Date(iso);
  const date = d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  if (!withTime) return date;
  const time = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
}

/* =========================================================
   BOOT
   ========================================================= */

checkSession();
