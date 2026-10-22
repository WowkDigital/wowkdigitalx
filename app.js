const menuButton = document.querySelector('#menu-toggle');
const menu = document.querySelector('#mobile-menu');
function closeMenu() { menu.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Open navigation'); }
menuButton.addEventListener('click', () => { const open = menu.hidden; menu.hidden = !open; menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); });
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) { closeMenu(); menuButton.focus(); } });
window.matchMedia('(min-width: 641px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
const privacy = document.querySelector('#privacy-dialog');
document.querySelector('#privacy-open').addEventListener('click', () => privacy.showModal());
document.querySelector('#privacy-close').addEventListener('click', () => privacy.close());
privacy.addEventListener('click', event => { if (event.target === privacy) { const rect = privacy.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) privacy.close(); } });
document.querySelector('#year').textContent = new Date().getFullYear();
document.querySelector('#contact-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const body = `Name / Company: ${data.get('name')}\nEmail: ${data.get('email')}\n\n${data.get('message')}`;
  window.location.href = `mailto:kontakt@wowkdigitalx.pl?subject=${encodeURIComponent(String(data.get('subject')))}&body=${encodeURIComponent(body)}`;
  document.querySelector('#form-status').textContent = 'Your email draft is ready to open. If no email app opens, write directly to kontakt@wowkdigitalx.pl. Nothing has been sent by this website.';
});
