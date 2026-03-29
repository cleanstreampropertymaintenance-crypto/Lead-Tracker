// ── Mobile Navigation ────────────────────────────
const toggle = document.getElementById('mobile-toggle');
const mobileNav = document.getElementById('mobile-nav');

toggle.addEventListener('click', () => {
  toggle.classList.toggle('active');
  mobileNav.classList.toggle('open');
});

// Close mobile nav when clicking a link
document.querySelectorAll('.mobile-nav-link').forEach(link => {
  link.addEventListener('click', () => {
    toggle.classList.remove('active');
    mobileNav.classList.remove('open');
  });
});

// ── Sticky Header Scroll Effect ──────────────────
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

// ── Form Submission ──────────────────────────────
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const origText = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    try {
      const data = new FormData(form);
      const res = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        btn.textContent = 'Sent! We\'ll be in touch.';
        btn.style.background = '#00d4aa';
        form.reset();
        setTimeout(() => {
          btn.textContent = origText;
          btn.style.background = '';
          btn.disabled = false;
        }, 4000);
      } else {
        throw new Error('Submit failed');
      }
    } catch {
      btn.textContent = 'Error - Try calling us instead';
      btn.style.background = '#ef4444';
      setTimeout(() => {
        btn.textContent = origText;
        btn.style.background = '';
        btn.disabled = false;
      }, 3000);
    }
  });
}
