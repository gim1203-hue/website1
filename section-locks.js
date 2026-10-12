/* Convenience locks only: the embedded code does not provide server security. */
(() => {
  'use strict';
  const CODE = '1233';
  const dialog = document.getElementById('section-lock-dialog');
  const form = document.getElementById('section-lock-form');
  const input = document.getElementById('section-lock-code');
  const error = document.getElementById('section-lock-error');
  let pending = null;
  const records = [...document.querySelectorAll('[data-lock-heading]')].map(heading => {
    const legacy = heading.hasAttribute('data-lock-legacy');
    const panel = document.getElementById(heading.getAttribute('aria-controls'));
    const group = legacy ? panel : heading.closest('[data-lock-group]');
    const title = legacy ? heading.firstChild.textContent.trim() : heading.querySelector('span').textContent;
    let icon = heading.querySelector('[data-lock-icon]');
    if (!icon) {
      icon = document.createElement('span'); icon.dataset.lockIcon = ''; icon.setAttribute('aria-hidden','true'); heading.append(icon);
    }
    const record = {heading, panel, group, title, icon, legacy};
    function setOpen(open) {
      heading.dataset.locked = String(!open);
      heading.setAttribute('aria-expanded', String(open));
      heading.setAttribute('aria-label', `${title} — ${open ? 'open; close and lock' : 'locked; enter code to open'}`);
      icon.textContent = open ? '🔓' : '🔒';
      group.classList.toggle('is-locked', !open);
      if (legacy) {
        [...panel.children].forEach(child => { child.hidden = !open; });
        const caret = heading.querySelector('.accordion-caret');
        if (caret) caret.textContent = open ? '▲' : '▼';
      } else panel.hidden = !open;
    }
    record.setOpen = setOpen;
    setOpen(false);
    const activate = event => {
      if (event.type === 'keydown' && !['Enter',' '].includes(event.key)) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (heading.dataset.locked === 'false') { setOpen(false); return; }
      pending = record; input.value = ''; error.textContent = '';
      input.removeAttribute('aria-invalid');
      document.getElementById('section-lock-description').textContent = title;
      dialog.showModal(); input.focus();
    };
    heading.addEventListener('click', activate, true);
    if (legacy) heading.addEventListener('keydown', activate, true);
    return record;
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!pending) return;
    if (input.value !== CODE) {
      error.textContent = 'Incorrect code. Try again.'; input.setAttribute('aria-invalid','true'); input.select(); return;
    }
    pending.setOpen(true); dialog.close();
  });
  document.getElementById('section-lock-cancel').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    input.value = ''; if (pending) pending.heading.focus(); pending = null;
  });
  // Each section starts locked on every page load; no code or unlock is stored.
})();
