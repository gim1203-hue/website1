const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {JSDOM} = require('jsdom');
const html = fs.readFileSync('index.html', 'utf8');
function setup(t, saved, blocked = false) {
  const dom = new JSDOM(html, {url:'https://imrankhan.nyc/', runScripts:'outside-only'});
  t.after(() => dom.window.close());
  const w = dom.window, d = w.document;
  if (saved) w.localStorage.setItem('ik_study_progress_v1', saved);
  if (blocked) Object.defineProperty(w, 'localStorage', {get(){throw Error('Blocked');}});
  w.fetch = () => new Promise(() => {});
  w.HTMLMediaElement.prototype.pause = () => {};
  w.HTMLMediaElement.prototype.play = () => Promise.resolve();
  w.eval(fs.readFileSync('script.js', 'utf8'));
  w.eval(fs.readFileSync('notes.js', 'utf8'));
  w.eval(fs.readFileSync('section-locks.js', 'utf8'));
  w.eval(fs.readFileSync('study-tools.js', 'utf8'));
  return {w,d,click:id=>d.getElementById(id).click()};
}
test('bookmarks and completion persist, validate saved IDs, and combine with note filters', t => {
  const {w,d,click} = setup(t, JSON.stringify({bookmarks:['lesson-0','unknown','lesson-0'],completed:['lesson-1','unknown']}));
  assert.equal(d.getElementById('study-progress-meter').value, 1);
  const only = d.getElementById('notes-bookmarks-only'); only.checked = true; only.dispatchEvent(new w.Event('change'));
  assert.equal(d.querySelectorAll('.lesson:not([hidden])').length, 1);
  assert.equal(d.getElementById('git-notes').hidden, true);
  d.querySelector('#lesson-0 .study-lesson-actions button').click();
  assert.equal(d.querySelectorAll('.lesson:not([hidden])').length, 0);
  assert.equal(d.getElementById('notes-empty').hidden, false);
  click('notes-clear'); assert.equal(only.checked, false);
  d.querySelector('#lesson-0 .study-lesson-actions button:last-child').click();
  const saved = JSON.parse(w.localStorage.getItem('ik_study_progress_v1'));
  assert.deepEqual(saved.completed, ['lesson-1','lesson-0']);
  assert.equal(d.getElementById('study-progress-meter').value, 2);
});
test('blocked or malformed storage leaves working controls and visit-only feedback', t => {
  const {d} = setup(t, null, true);
  d.querySelector('#lesson-0 .study-lesson-actions button:last-child').click();
  assert.equal(d.getElementById('study-progress-meter').value, 1);
  assert.match(d.getElementById('study-storage-status').textContent, /visit only/);
  const other = setup(t, '{broken');
  assert.equal(other.d.getElementById('study-progress-meter').value, 0);
});
test('whole-site search reveals filtered lessons but never unlocks resource groups', t => {
  const {w,d} = setup(t);
  const search = d.getElementById('site-search');
  search.value = 'Snapshots'; search.dispatchEvent(new w.Event('input'));
  const only = d.getElementById('notes-bookmarks-only'); only.checked = true; only.dispatchEvent(new w.Event('change'));
  d.querySelector('#site-search-results button').click();
  assert.equal(d.getElementById('lesson-0').hidden, false); assert.equal(d.getElementById('lesson-0').open, true);
  search.value = 'DEVELOPER'; search.dispatchEvent(new w.Event('input'));
  const lockedResult = [...d.querySelectorAll('#site-search-results button')].find(b=>b.textContent.startsWith('Locked resources'));
  assert(lockedResult); lockedResult.click();
  assert.equal(d.querySelector('[data-lock-heading]').dataset.locked, 'true');
  assert.equal(d.getElementById('locked-links-0').hidden, true);
  search.value = '<img onerror=alert(1)>'; search.dispatchEvent(new w.Event('input'));
  assert.equal(d.querySelector('#site-search-results img'), null);
  assert.match(d.getElementById('site-search-status').textContent, /No results/);
});
test('all quiz topics score once, explain answers, finish, and restart', t => {
  const {w,d,click} = setup(t);
  for (const topic of ['Git','HTML','CSS','JavaScript']) {
    const select = d.getElementById('quiz-topic'); select.value = topic; select.dispatchEvent(new w.Event('change'));
    for (let index = 0; index < 3; index++) {
      const answer = d.querySelectorAll('#quiz-answers button')[(topic === 'Git' ? [1,0,2] : [0,1,2])[index]]; answer.click(); answer.click();
      assert.match(d.getElementById('quiz-feedback').textContent, /Correct!/);
      assert.equal(d.getElementById('quiz-next').disabled, false); click('quiz-next');
    }
    assert.match(d.getElementById('quiz-feedback').textContent, /3 of 3 correct/);
    click('quiz-restart'); assert.match(d.getElementById('quiz-position').textContent, /Score 0/);
  }
});
test('focus preference persists and search exits focus for hidden tools', t => {
  const {w,d,click} = setup(t, JSON.stringify({focus:true}));
  assert(d.body.classList.contains('study-focus-mode'));
  const search = d.getElementById('site-search'); search.value = 'Weather'; search.dispatchEvent(new w.Event('input'));
  d.querySelector('#site-search-results button').click();
  assert.equal(d.body.classList.contains('study-focus-mode'), false);
  click('study-focus'); assert.equal(JSON.parse(w.localStorage.getItem('ik_study_progress_v1')).focus, true);
});
test('playground isolates code, escapes closing scripts, authenticates messages, and resets', t => {
  const {w,d,click} = setup(t);
  const frame = d.getElementById('playground-output');
  assert.equal(frame.getAttribute('sandbox'), 'allow-scripts');
  d.getElementById('playground-js').value = 'throw new Error("</script><script>bad</script>")'; click('playground-run');
  assert.equal((frame.srcdoc.match(/<script>/g)||[]).length, 1);
  assert.match(frame.srcdoc, /default-src 'none'/);
  w.dispatchEvent(new w.MessageEvent('message', {data:{type:'ik-playground',message:'fake'},source:w}));
  assert.notEqual(d.getElementById('playground-status').textContent, 'fake');
  w.dispatchEvent(new w.MessageEvent('message', {data:{type:'ik-playground',message:'Error: sample'},source:frame.contentWindow}));
  assert.equal(d.getElementById('playground-status').textContent, 'Error: sample');
  click('playground-reset'); assert.match(d.getElementById('playground-js').value, /You did it/);
});
test('each copied page resolves project image and includes identical learning tools', () => {
  for (const [folder,page,prefix] of [['website1copy','index1.html','../'],['website1copy/updates','index.html','../../']]) {
    const text = fs.readFileSync(`${folder}/${page}`, 'utf8');
    assert(text.includes(`src="${prefix}website-preview.png"`));
    assert.match(text, /study-tools\.js\?v=[a-f0-9]{12}/);
    assert.equal(fs.readFileSync(`${folder}/study-tools.js`,'utf8'),fs.readFileSync('study-tools.js','utf8'));
  }
});

async function importBackup(w, d, content) {
  const picker = d.getElementById('study-import-file');
  const file = new w.File([content], 'backup.json', {type:'application/json'});
  Object.defineProperty(picker, 'files', {value:[file], configurable:true});
  picker.dispatchEvent(new w.Event('change'));
  for (let attempt = 0; attempt < 100 && d.getElementById('study-import').disabled; attempt++) await new Promise(resolve=>setTimeout(resolve, 5));
  assert.equal(d.getElementById('study-import').disabled, false);
}
test('export downloads only portable learning data and imports into a fresh browser', async t => {
  const {w,d,click} = setup(t, JSON.stringify({bookmarks:['lesson-0'],completed:['lesson-1'],focus:true}));
  let blob, download;
  w.URL.createObjectURL = value => { blob = value; return 'blob:backup'; };
  w.URL.revokeObjectURL = () => {};
  w.HTMLAnchorElement.prototype.click = function(){download = this.download;};
  click('study-export'); assert.equal(download, 'imran-study-progress.json');
  const text = await new Promise(resolve=>{const reader=new w.FileReader();reader.onload=()=>resolve(reader.result);reader.readAsText(blob);});
  const backup = JSON.parse(text);
  assert.deepEqual(Object.keys(backup).sort(), ['bookmarks','completed','exportedAt','format','version']);
  assert.equal(backup.format, 'imran-study-progress'); assert.equal(backup.version, 1);
  assert.deepEqual(backup.bookmarks, ['lesson-0']); assert.deepEqual(backup.completed, ['lesson-1']);
  const fresh = setup(t);
  await importBackup(fresh.w, fresh.d, text);
  assert.equal(fresh.d.getElementById('lesson-0').dataset.bookmarked, 'true');
  assert.equal(fresh.d.getElementById('study-progress-meter').value, 1);
  assert.equal(fresh.d.body.classList.contains('study-focus-mode'), false);
  assert.equal(fresh.d.querySelector('[data-lock-heading]').dataset.locked, 'true');
});
test('import merges without duplicates, skips unknown IDs, and reapplies bookmark filtering', async t => {
  const {w,d} = setup(t, JSON.stringify({bookmarks:['lesson-0'],completed:['lesson-1']}));
  d.getElementById('notes-bookmarks-only').checked = true;
  const text = JSON.stringify({format:'imran-study-progress',version:1,bookmarks:['lesson-0','lesson-2','lesson-2','unknown'],completed:['lesson-1','lesson-3']});
  await importBackup(w,d,text);
  assert.deepEqual(JSON.parse(w.localStorage.getItem('ik_study_progress_v1')).bookmarks, ['lesson-0','lesson-2']);
  assert.equal(d.querySelectorAll('.lesson:not([hidden])').length, 2);
  assert.equal(d.getElementById('study-progress-meter').value, 2);
  assert.match(d.getElementById('study-transfer-status').textContent, /Skipped 1/);
  await importBackup(w,d,text);
  assert.match(d.getElementById('study-transfer-status').textContent, /Imported 0 new bookmarks and 0 new completed lessons/);
});
test('invalid, future-version, oversized, and malformed-list backups leave progress unchanged', async t => {
  const {w,d} = setup(t, JSON.stringify({bookmarks:['lesson-0'],completed:['lesson-1']}));
  const before = w.localStorage.getItem('ik_study_progress_v1');
  for (const content of ['{broken', 'null', JSON.stringify({format:'imran-study-progress',version:2,bookmarks:[],completed:[]}), JSON.stringify({format:'imran-study-progress',version:1,bookmarks:['lesson-2'],completed:[{}]}), ' '.repeat(128*1024+1)]) {
    await importBackup(w,d,content);
    assert.equal(w.localStorage.getItem('ik_study_progress_v1'), before);
    assert(d.getElementById('study-transfer-status').classList.contains('study-transfer-error'));
  }
});
test('import survives blocked storage and export reports download failure', async t => {
  const {w,d,click} = setup(t, null, true);
  await importBackup(w,d,JSON.stringify({format:'imran-study-progress',version:1,bookmarks:['lesson-0'],completed:['lesson-1']}));
  assert.equal(d.getElementById('study-progress-meter').value, 1);
  assert.match(d.getElementById('study-transfer-status').textContent, /export a backup before leaving/);
  w.URL.createObjectURL = () => { throw Error('Unavailable'); };
  click('study-export'); assert.match(d.getElementById('study-transfer-status').textContent, /Could not download/);
});
