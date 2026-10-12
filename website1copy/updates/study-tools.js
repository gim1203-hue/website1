/* Learning tools: private progress stays in this browser; code runs in an isolated frame. */
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const library = byId('engineering-notes');
  if (!library || !byId('study-tools')) return;
  const lessons = [...library.querySelectorAll('.lesson')];
  const ids = new Set(lessons.map(lesson => lesson.id));
  const STORE = 'ik_study_progress_v1';
  let state = {bookmarks: [], completed: [], focus: false};
  let storageOK = true;
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (saved && typeof saved === 'object') {
      for (const key of ['bookmarks', 'completed']) {
        state[key] = Array.isArray(saved[key]) ? [...new Set(saved[key].filter(id => ids.has(id)))] : [];
      }
      state.focus = saved.focus === true;
    }
  } catch (_) { storageOK = false; }
  const progress = document.createElement('div');
  progress.className = 'study-progress';
  progress.innerHTML = '<h3>Your learning progress</h3><p id="study-progress-text" role="status"></p><progress id="study-progress-meter" max="26" value="0" aria-label="Completed lessons"></progress><div class="study-row"><label><input id="notes-bookmarks-only" type="checkbox"> Bookmarked lessons only</label></div><p id="study-storage-status" class="study-muted"></p>';
  library.querySelector('.notes-library-heading').after(progress);
  byId('study-progress-meter').max = lessons.length;
  const buttons = [];
  lessons.forEach(lesson => {
    const title = lesson.querySelector('summary > span').textContent;
    const row = document.createElement('div'); row.className = 'study-row study-lesson-actions';
    for (const [key, label, activeLabel] of [['bookmarks', 'Bookmark', 'Bookmarked'], ['completed', 'Mark completed', 'Completed']]) {
      const button = document.createElement('button'); button.type = 'button';
      button.addEventListener('click', () => {
        state[key] = state[key].includes(lesson.id) ? state[key].filter(id => id !== lesson.id) : [...state[key], lesson.id];
        save(); renderProgress(); document.dispatchEvent(new Event('study-progress-change'));
      });
      buttons.push({button, key, label, activeLabel, id: lesson.id, title}); row.append(button);
    }
    lesson.querySelector('.lesson-body').prepend(row);
  });
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); storageOK = true; }
    catch (_) { storageOK = false; }
  }
  function renderProgress() {
    const count = state.completed.length;
    byId('study-progress-text').textContent = `${count} of ${lessons.length} lessons completed · ${Math.round(count / lessons.length * 100)}%`;
    byId('study-progress-meter').value = count;
    byId('study-storage-status').textContent = storageOK ? 'Bookmarks and progress are saved in this browser.' : 'Browser storage is unavailable. Progress will last for this visit only.';
    lessons.forEach(lesson => { lesson.dataset.bookmarked = String(state.bookmarks.includes(lesson.id)); lesson.dataset.completed = String(state.completed.includes(lesson.id)); });
    buttons.forEach(({button, key, label, activeLabel, id, title}) => {
      const selected = state[key].includes(id); button.textContent = selected ? activeLabel : label;
      button.setAttribute('aria-pressed', String(selected)); button.setAttribute('aria-label', `${selected ? activeLabel : label}: ${title}`);
    });
  }
  byId('notes-bookmarks-only').addEventListener('change', () => document.dispatchEvent(new Event('study-progress-change')));
  function renderFocus() {
    document.body.classList.toggle('study-focus-mode', state.focus);
    byId('study-focus').setAttribute('aria-pressed', String(state.focus));
    byId('study-focus').textContent = state.focus ? 'Exit focus mode' : 'Focus mode';
  }
  byId('study-focus').addEventListener('click', () => { state.focus = !state.focus; save(); renderFocus(); renderProgress(); });
  renderProgress(); renderFocus();

  const normalize = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const records = lessons.map(lesson => ({title:lesson.querySelector('summary > span').textContent, text:normalize(lesson.dataset.topic + ' ' + lesson.textContent), kind:'Lesson', element:lesson}));
  const addRecord = (title, kind, element) => { if (element) records.push({title, kind, element, text:normalize(title + ' ' + kind)}); };
  for (const [title, id] of [['Weather', 'weather-widget'], ['Notes & To-Do', 'todo-widget'], ['Calendar', 'cal-widget'], ['Practice quizzes', 'study-quiz'], ['Projects gallery', 'study-projects'], ['HTML CSS JavaScript code playground', 'study-playground'], ['Software Engineering Hub project', 'study-projects'], ['Original Git course notes', 'git-notes']]) addRecord(title, 'Tool or section', byId(id));
  document.querySelectorAll('[data-lock-heading]').forEach(heading => addRecord(heading.textContent.replace(/[🔒🔓?]/gu, '').trim(), 'Locked resources', heading));
  document.querySelectorAll('.media-card').forEach(card => { const heading = card.querySelector('h2,h3,h4'); if (heading) addRecord(heading.textContent, 'Media tool', card); });
  document.querySelectorAll('a[href]').forEach(link => {
    if (link.closest('.lock-content, .accordion-panel, #engineering-notes, #git-notes, #study-toolbar') || !link.textContent.trim()) return;
    const heading = link.closest('[data-lock-group]'); if (heading) return;
    addRecord(link.textContent.trim(), 'Resource link', link);
  });
  const search = byId('site-search'), results = byId('site-search-results');
  function showSearch() {
    const tokens = normalize(search.value).split(' ').filter(Boolean); results.replaceChildren(); results.hidden = !tokens.length;
    byId('site-search-status').textContent = '';
    if (!tokens.length) return;
    const matches = records.filter(record => tokens.every(token => record.text.includes(token)));
    byId('site-search-status').textContent = matches.length ? `${matches.length} results${matches.length > 25 ? ' · showing the first 25' : ''}. Locked groups still require their code.` : 'No results. Try a shorter phrase.';
    matches.slice(0, 25).forEach(record => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = `${record.kind} · ${record.title}`;
      button.addEventListener('click', () => {
        if (state.focus && !record.element.closest('#engineering-notes, #study-tools, #study-toolbar')) { state.focus = false; save(); renderFocus(); }
        if (record.kind === 'Lesson') {
          byId('notes-search').value = ''; byId('notes-topic').value = 'all'; byId('notes-bookmarks-only').checked = false;
          document.dispatchEvent(new Event('study-progress-change')); record.element.open = true;
          record.element.querySelector('summary').focus();
        } else if (record.element.matches('[data-lock-heading]')) record.element.focus();
        else if (record.element.matches('a')) record.element.focus();
        record.element.scrollIntoView?.({behavior:'auto', block:'center'});
      }); results.append(button);
    });
  }
  search.addEventListener('input', showSearch);
  search.addEventListener('keydown', event => { if (event.key === 'Escape') { search.value = ''; showSearch(); } });

  const quizzes = {
    Git: [
      ['Which command shows your working tree status?', ['git push', 'git status', 'git merge'], 1, 'git status lists your branch, staged changes, and unstaged changes.'],
      ['What does git add do?', ['Stages changes for a commit', 'Uploads to GitHub', 'Deletes a branch'], 0, 'git add stages the changes you want to include in your next commit.'],
      ['How do you undo a published commit without rewriting history?', ['git reset --hard', 'Delete .git', 'git revert'], 2, 'git revert creates a new commit that reverses an earlier commit.']
    ],
    HTML: [
      ['Which element is meant for a clickable action?', ['<button>', '<div>', '<span>'], 0, 'A button supplies keyboard interaction and action semantics.'],
      ['What does an image alt attribute provide?', ['An image width', 'A text alternative', 'A download link'], 1, 'Alt text describes meaningful image content when the image cannot be seen.'],
      ['Which element represents the main page content?', ['<aside>', '<footer>', '<main>'], 2, 'main identifies the primary content of the document.']
    ],
    CSS: [
      ['Which property creates a flex layout?', ['display: flex', 'position: flex', 'layout: flex'], 0, 'display: flex arranges child elements using the flexbox layout model.'],
      ['Which rule helps adapt a layout to small screens?', ['@font-face', '@media', '@keyframes'], 1, 'Media queries apply styles according to conditions such as viewport width.'],
      ['Which selector matches a class named card?', ['#card', 'card', '.card'], 2, 'A dot selects a class; a hash selects an ID.']
    ],
    JavaScript: [
      ['Which method listens for a button click?', ['addEventListener', 'JSON.parse', 'Array.map'], 0, 'addEventListener registers a callback for an event such as click.'],
      ['What should you check before reading a fetch response as a success?', ['response.color', 'response.ok', 'response.name'], 1, 'fetch can resolve for HTTP error responses. Check response.ok first.'],
      ['Which array method returns a transformed array?', ['push', 'pop', 'map'], 2, 'map calls a function on every element and returns the results in a new array.']
    ]
  };
  let quizIndex = 0, score = 0, answered = false;
  const quizTopic = byId('quiz-topic');
  function drawQuiz() {
    const questions = quizzes[quizTopic.value], question = questions[quizIndex]; answered = false;
    byId('quiz-position').textContent = `${quizTopic.value} · Question ${quizIndex + 1} of ${questions.length} · Score ${score}`;
    byId('quiz-question').textContent = question[0]; byId('quiz-feedback').textContent = 'Choose an answer to see an explanation.';
    byId('quiz-next').disabled = true; byId('quiz-next').textContent = quizIndex === questions.length - 1 ? 'See results' : 'Next question';
    byId('quiz-answers').replaceChildren();
    question[1].forEach((answer, index) => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = answer;
      button.addEventListener('click', () => {
        if (answered) return; answered = true; const correct = index === question[2]; if (correct) score++;
        byId('quiz-feedback').textContent = `${correct ? 'Correct!' : 'The correct answer is ' + question[1][question[2]] + '.'} ${question[3]}`;
        byId('quiz-answers').querySelectorAll('button').forEach((choice, i) => { choice.disabled = true; choice.classList.toggle('study-correct', i === question[2]); });
        byId('quiz-next').disabled = false;
      }); byId('quiz-answers').append(button);
    });
  }
  function restartQuiz() { quizIndex = 0; score = 0; drawQuiz(); }
  quizTopic.addEventListener('change', restartQuiz); byId('quiz-restart').addEventListener('click', restartQuiz);
  byId('quiz-next').addEventListener('click', () => {
    if (!answered) return;
    if (quizIndex < quizzes[quizTopic.value].length - 1) { quizIndex++; drawQuiz(); }
    else { byId('quiz-feedback').textContent = `Quiz complete: ${score} of ${quizzes[quizTopic.value].length} correct. Restart or choose another topic to practice again.`; byId('quiz-next').disabled = true; }
  }); drawQuiz();

  const editors = ['html', 'css', 'js'].map(type => byId('playground-' + type));
  const defaults = editors.map(editor => editor.value);
  const frame = byId('playground-output');
  const encode = text => JSON.stringify(text).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  function runCode() {
    const [html, css, js] = editors.map(editor => editor.value);
    const runner = `const report = message => parent.postMessage({type:'ik-playground',message},'*'); window.addEventListener('error',e=>report('Error: '+e.message)); window.addEventListener('unhandledrejection',e=>report('Error: '+String(e.reason))); const style=document.createElement('style'); style.textContent=${encode(css)}; document.head.append(style); document.body.innerHTML=${encode(html)}; try { new Function(${encode(js)})(); report('Code ran successfully.'); } catch(error) { report('Error: '+error.message); }`;
    frame.srcdoc = '<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\' \'unsafe-eval\'; style-src \'unsafe-inline\'; img-src data: blob:; form-action \'none\'; base-uri \'none\'"></head><body><script>' + runner + '</script></body></html>';
    byId('playground-status').textContent = 'Running your example…';
  }
  window.addEventListener('message', event => {
    if (event.source !== frame.contentWindow || event.data?.type !== 'ik-playground' || typeof event.data.message !== 'string') return;
    byId('playground-status').textContent = event.data.message.slice(0, 500);
  });
  byId('playground-run').addEventListener('click', runCode);
  byId('playground-reset').addEventListener('click', () => { editors.forEach((editor, i) => { editor.value = defaults[i]; }); runCode(); });
  runCode();
})();
