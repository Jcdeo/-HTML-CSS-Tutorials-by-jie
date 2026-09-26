// ===========================
//  Default code storage
// ===========================
const defaultCode = {};

function collectDefaults() {
  document.querySelectorAll('.code-editor').forEach(function (ta) {
    const id = ta.id.replace('code-', '');
    defaultCode[id] = ta.value;
  });
}

// ===========================
//  Run a single lesson
// ===========================

/**
 * textarea.value already returns decoded text (browser decodes &lt; → < etc.)
 * so we can inject it directly into the iframe as real HTML.
 */
function buildHtml(code) {
  // Always wrap in a full shell so edits to full-doc lessons
  // (like lesson 1) also re-render correctly every time.
  // Strip an outer <!DOCTYPE…</html> if present, keep only the body content
  // when it's a snippet — but for simplicity just always wrap everything.
  return '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '  <meta charset="UTF-8" />\n' +
    '  <meta name="viewport" content="width=device-width,initial-scale=1"/>\n' +
    '  <style>\n' +
    '    *, *::before, *::after { box-sizing: border-box; }\n' +
    '    body { font-family: Segoe UI, system-ui, sans-serif; padding: 14px; margin: 0; font-size: 14px; }\n' +
    '  </style>\n' +
    '</head>\n' +
    '<body>\n' +
    code + '\n' +
    '</body>\n' +
    '</html>';
}

function runCode(id) {
  const editor = document.getElementById('code-' + id);
  const frame  = document.getElementById('preview-' + id);
  if (!editor || !frame) return;

  const html = buildHtml(editor.value);

  // Force the iframe to re-render even if the content barely changed.
  // Blanking srcdoc first ensures the browser treats it as a fresh load.
  frame.srcdoc = '';
  // Use setTimeout(0) to let the blank render before injecting new content
  setTimeout(function () {
    frame.srcdoc = html;
  }, 0);

  // Visual feedback on the Run button
  const btn = editor.closest('.code-panel').querySelector('.run-btn');
  if (btn) {
    btn.textContent = '✓ Done';
    btn.style.background = '#1e8449';
    setTimeout(function () {
      btn.innerHTML = '&#9654; Run';
      btn.style.background = '';
    }, 900);
  }
}

// ===========================
//  Reset a single lesson
// ===========================
function resetCode(id) {
  const editor = document.getElementById('code-' + id);
  if (!editor) return;
  editor.value = defaultCode[id] || '';
  runCode(id);
}

// ===========================
//  Tab key — insert 2 spaces
// ===========================
function handleTab(e) {
  if (e.key !== 'Tab') return;
  e.preventDefault();
  const ta    = e.target;
  const start = ta.selectionStart;
  const end   = ta.selectionEnd;
  const pad   = '  ';
  ta.value = ta.value.substring(0, start) + pad + ta.value.substring(end);
  ta.selectionStart = ta.selectionEnd = start + pad.length;
}

// ===========================
//  Ctrl+Enter — run preview
// ===========================
function handleRunShortcut(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    runCode(e.target.id.replace('code-', ''));
  }
}

// ===========================
//  Nav highlight via scroll
// ===========================
function initNavHighlight() {
  const sections = document.querySelectorAll('.tutorial-section');
  const navLinks = document.querySelectorAll('.nav-link');
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const key = entry.target.id.replace('-section', '');
        navLinks.forEach(function (link) {
          link.classList.toggle('active', link.dataset.section === key);
        });
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );

  sections.forEach(function (s) { observer.observe(s); });
}

// ===========================
//  Smooth scroll for nav
// ===========================
function initNavScroll() {
  document.querySelectorAll('.nav-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// ===========================
//  Lesson counter in nav
// ===========================
function updateLessonCounts() {
  const htmlCount = document.querySelectorAll('#html-section .tutorial-card').length;
  const cssCount  = document.querySelectorAll('#css-section .tutorial-card').length;

  const htmlLink = document.querySelector('.nav-link[data-section="html"]');
  const cssLink  = document.querySelector('.nav-link[data-section="css"]');

  if (htmlLink) htmlLink.title = htmlCount + ' lessons';
  if (cssLink)  cssLink.title  = cssCount  + ' lessons';
}

// ===========================
//  Progress bar (optional UI)
// ===========================
function initProgressTracking() {
  // Mark a lesson card as "viewed" when its Run button is clicked
  document.querySelectorAll('.run-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const card = btn.closest('.tutorial-card');
      if (card) card.classList.add('viewed');
      updateProgressBar();
    });
  });
}

function updateProgressBar() {
  const total  = document.querySelectorAll('.tutorial-card').length;
  const viewed = document.querySelectorAll('.tutorial-card.viewed').length;
  const pct    = total > 0 ? Math.round((viewed / total) * 100) : 0;

  const fill  = document.getElementById('global-progress-fill');
  const label = document.getElementById('global-progress-label');
  const pctEl = document.getElementById('global-progress-pct');

  if (fill)  fill.style.width        = pct + '%';
  if (label) label.textContent       = viewed + ' / ' + total;
  if (pctEl) pctEl.textContent       = pct + '%';

  // Turn the fill gold at 100%
  if (fill) {
    fill.style.background = pct === 100
      ? 'linear-gradient(90deg, #f39c12, #f1c40f)'
      : 'linear-gradient(90deg, #27ae60, #2ecc71)';
    fill.style.boxShadow = pct === 100
      ? '0 0 10px rgba(241,196,15,0.6)'
      : '0 0 8px rgba(46,204,113,0.5)';
  }
}

// ===========================
//  Debounce helper
// ===========================
function debounce(fn, delay) {
  var timer;
  return function () {
    var args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () { fn.apply(null, args); }, delay);
  };
}

// ===========================
//  Boot
// ===========================
document.addEventListener('DOMContentLoaded', function () {

  // 1. Save originals
  collectDefaults();

  // 2. Keyboard listeners + live preview on input (debounced 600ms)
  document.querySelectorAll('.code-editor').forEach(function (ta) {
    ta.addEventListener('keydown', handleTab);
    ta.addEventListener('keydown', handleRunShortcut);

    // Auto-update the preview while the user types (after 600ms pause)
    var id = ta.id.replace('code-', '');
    ta.addEventListener('input', debounce(function () {
      runCode(id);
    }, 600));
  });

  // 3. Auto-run every lesson so previews show on page load
  document.querySelectorAll('.tutorial-card').forEach(function (card) {
    const id = card.dataset.tutorial;
    if (id) runCode(id);
  });

  // 4. Nav
  initNavHighlight();
  initNavScroll();
  updateLessonCounts();

  // 5. Progress tracking
  initProgressTracking();
  updateProgressBar();
});
