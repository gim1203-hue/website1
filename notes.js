/* Notes enhancement: content and native disclosures remain usable without JavaScript. */
(() => {
  'use strict';
  const library = document.getElementById('engineering-notes');
  if (!library) return;
  const search = document.getElementById('notes-search');
  const topic = document.getElementById('notes-topic');
  const status = document.getElementById('notes-result-status');
  const empty = document.getElementById('notes-empty');
  const legacy = document.getElementById('git-notes');
  const normalize = text => text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const lessons = [...library.querySelectorAll('.lesson')].map(element => ({
    element, text: normalize(element.dataset.topic + ' ' + element.textContent)
  }));
  const oldNotes = [...legacy.querySelectorAll('.content-right > .accordion-toggle, #repo-steps-toggle')].map(element => {
    const panel = document.getElementById(element.getAttribute('aria-controls'));
    return { element, panel, text: normalize('Git terminal HTML original ' + element.textContent + ' ' + panel.textContent) };
  });
  const sidebar = legacy.querySelector('.sidebar-left');
  const sidebarText = normalize(sidebar.textContent);
  let savedState = null;
  function setOldOpen(record, open) {
    if (record.element.dataset.locked === "true") open = false;
    record.element.setAttribute('aria-expanded', String(open));
    const caret = record.element.querySelector('.accordion-caret, .repo-steps-caret');
    if (caret) caret.textContent = open ? '▲' : '▼';
    if (record.panel.classList.contains('accordion-panel')) {
      [...record.panel.children].forEach(child => { child.hidden = !open; });
    } else record.panel.hidden = !open;
  }
  function filterNotes() {
    const tokens = normalize(search.value).split(' ').filter(Boolean);
    const selected = topic.value;
    const bookmarksOnly = document.getElementById('notes-bookmarks-only')?.checked === true;
    const filtering = tokens.length > 0 || selected !== 'all' || bookmarksOnly;
    if (filtering && !savedState) savedState = {
      lessons: lessons.map(record => record.element.open),
      legacy: oldNotes.map(record => record.element.getAttribute('aria-expanded') === 'true')
    };
    const matches = text => tokens.every(token => text.includes(token));
    let count = 0;
    lessons.forEach(record => {
      const match = (!bookmarksOnly || record.element.dataset.bookmarked === 'true') && (selected === 'all' || selected === record.element.dataset.topic) && matches(record.text);
      record.element.hidden = !match;
      if (match) { count++; if (tokens.length) record.element.open = true; }
    });
    library.querySelectorAll('.notes-topic-group').forEach(group => {
      group.hidden = ![...group.querySelectorAll('.lesson')].some(element => !element.hidden);
    });
    let oldCount = 0;
    oldNotes.forEach(record => {
      const match = !bookmarksOnly && (selected === 'all' || selected === 'legacy') && matches(record.text);
      record.element.hidden = !match;
      record.panel.classList.toggle('notes-filter-hidden', !match);
      if (match) { oldCount++; if (tokens.length) setOldOpen(record, true); }
    });
    sidebar.hidden = bookmarksOnly || !((selected === 'all' || selected === 'legacy') && matches(sidebarText));
    legacy.hidden = oldCount === 0 && sidebar.hidden;
    if (!filtering && savedState) {
      lessons.forEach((record, index) => { record.element.open = savedState.lessons[index]; });
      oldNotes.forEach((record, index) => setOldOpen(record, savedState.legacy[index]));
      savedState = null;
    }
    empty.hidden = count + oldCount > 0 || !sidebar.hidden;
    status.textContent = `${count} lesson${count === 1 ? '' : 's'} and ${oldCount} original note section${oldCount === 1 ? '' : 's'} found.`;
    document.getElementById('notes-expand').disabled = count + oldCount === 0;
    document.getElementById('notes-collapse').disabled = count + oldCount === 0;
  }
  search.addEventListener('input', filterNotes);
  document.addEventListener('study-progress-change', filterNotes);
  topic.addEventListener('change', filterNotes);
  document.getElementById('notes-clear').addEventListener('click', () => {
    const bookmarks = document.getElementById('notes-bookmarks-only');
    if (bookmarks) bookmarks.checked = false;
    search.value = ''; topic.value = 'all'; filterNotes(); search.focus();
  });
  search.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault(); search.value = ''; filterNotes();
    }
  });
  for (const [id, open] of [['notes-expand', true], ['notes-collapse', false]]) {
    document.getElementById(id).addEventListener('click', () => {
      lessons.filter(record => !record.element.hidden).forEach(record => {
        record.element.open = open;
        if (!open) record.element.querySelectorAll('details').forEach(answer => { answer.open = false; });
      });
      oldNotes.filter(record => !record.element.hidden).forEach(record => setOldOpen(record, open));
      status.textContent = open ? 'Matching notes expanded.' : 'Matching notes collapsed.';
    });
  }
  const dialog = document.getElementById('notes-copy-dialog');
  const field = document.getElementById('notes-copy-text');
  const close = document.getElementById('notes-copy-close');
  const copyStatus = document.getElementById('notes-copy-status');
  document.body.append(dialog);
  let opener = null;
  let inertSiblings = [];
  function closeDialog() {
    dialog.hidden = true;
    inertSiblings.forEach(([element, inert]) => { element.inert = inert; });
    inertSiblings = [];
    document.body.classList.remove('modal-open');
    opener?.focus();
  }
  function manualCopy(text, button) {
    opener = button;
    field.value = text;
    dialog.hidden = false;
    inertSiblings = [...document.body.children].filter(element => element !== dialog)
      .map(element => [element, element.inert]);
    inertSiblings.forEach(([element]) => { element.inert = true; });
    document.body.classList.add('modal-open');
    field.focus(); field.select();
    copyStatus.textContent = 'Clipboard unavailable. Use the selected code in the copy dialog.';
  }
  library.addEventListener('click', async event => {
    const button = event.target.closest('.notes-copy');
    if (!button || !library.contains(button) || button.disabled) return;
    const code = document.getElementById(button.dataset.copyTarget);
    if (!code) return;
    button.disabled = true;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(code.textContent);
      copyStatus.textContent = `Copied code for ${button.closest('.lesson').querySelector('summary span').textContent}.`;
    } catch (_) { manualCopy(code.textContent, button); }
    finally { button.disabled = false; }
  });
  close.addEventListener('click', closeDialog);
  dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); closeDialog(); }
    else if (event.key === 'Tab') {
      event.preventDefault(); (document.activeElement === field ? close : field).focus();
    }
  });
  filterNotes();
})();
