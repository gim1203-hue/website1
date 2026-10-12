const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {JSDOM} = require('jsdom');
const html = fs.readFileSync('index.html','utf8');
function setup(t, saved, blocked = false) {
  const dom = new JSDOM(html,{url:'https://imrankhan.nyc/',runScripts:'outside-only'});
  t.after(()=>dom.window.close());const w=dom.window,d=w.document;
  if(saved)w.localStorage.setItem('ik_learning_extras_v1',JSON.stringify(saved));
  if(blocked)Object.defineProperty(w,'localStorage',{get(){throw Error('Blocked');}});
  w.fetch=()=>new Promise(()=>{});w.HTMLMediaElement.prototype.pause=()=>{};w.HTMLMediaElement.prototype.play=()=>Promise.resolve();
  w.print=()=>{};
  for(const file of ['script.js','notes.js','section-locks.js','study-tools.js','learning-extras.js'])w.eval(fs.readFileSync(file,'utf8'));
  return {w,d,click:id=>d.getElementById(id).click(),submit:id=>d.getElementById(id).dispatchEvent(new w.Event('submit',{cancelable:true})),input:(id,value,type='input')=>{d.getElementById(id).value=value;d.getElementById(id).dispatchEvent(new w.Event(type));}};
}
const readState=w=>JSON.parse(w.localStorage.getItem('ik_learning_extras_v1'));
test('ten tabs work with keyboard and whole-site search reveals glossary',t=>{
  const {w,d,input}=setup(t);assert.equal(d.querySelectorAll('#extras-tabs [role="tab"]').length,10);
  const first=d.getElementById('extra-tab-commands');first.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
  assert.equal(d.getElementById('extra-journal').hidden,false);assert.equal(d.activeElement.id,'extra-tab-journal');
  input('site-search','Glossary: DOM');d.querySelector('#site-search-results button').click();
  assert.equal(d.getElementById('extra-glossary').hidden,false);
  assert.match(d.getElementById('extra-new').textContent,/October 12, 2026/);
});
test('command copying preserves exact syntax and falls back to manual selection',async t=>{
  const {w,d,input}=setup(t);input('command-search','git commit');
  let copied;Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async text=>{copied=text;}},configurable:true});
  d.querySelector('#command-list button').click();await Promise.resolve();assert.equal(copied,'git commit -m "Describe your change"');
  w.navigator.clipboard.writeText=async()=>{throw Error('Denied');};d.querySelector('#command-list button').click();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(d.getElementById('command-manual').hidden,false);assert.equal(d.getElementById('command-manual').value,copied);
});
test('journal saves, edits, deletes, undoes, and renders user content as text',t=>{
  const {w,d,submit,click}=setup(t);d.getElementById('journal-title').value='<img src=x onerror=alert(1)>';d.getElementById('journal-cause').value='A missing brace';d.getElementById('journal-fix').value='Add the brace';submit('journal-form');
  assert.equal(readState(w).journal.length,1);assert.equal(d.querySelector('#journal-list img'),null);
  d.querySelector('#journal-list button').click();d.getElementById('journal-fix').value='Check syntax first';submit('journal-form');assert.equal(readState(w).journal[0].fix,'Check syntax first');
  d.querySelectorAll('#journal-list button')[1].click();assert.equal(readState(w).journal.length,0);click('journal-undo');assert.equal(readState(w).journal.length,1);
  const reload=setup(t,readState(w));assert.match(reload.d.getElementById('journal-list').textContent,/Check syntax first/);
});
test('playground examples save, update by name, load exactly, and delete/restore',t=>{
  const {w,d,click}=setup(t);d.getElementById('snippet-name').value='<script>example</script>';d.getElementById('playground-html').value='<h1>My example</h1>';d.getElementById('playground-css').value='h1 {color: blue;}';d.getElementById('playground-js').value='document.body.dataset.example="yes";';click('snippet-save');
  assert.equal(readState(w).snippets.length,1);assert.equal(d.querySelector('#snippet-list script'),null);
  d.getElementById('playground-html').value='<h1>Updated</h1>';click('snippet-save');assert.equal(readState(w).snippets.length,1);
  d.getElementById('playground-html').value='';d.querySelector('#snippet-list button').click();assert.equal(d.getElementById('playground-html').value,'<h1>Updated</h1>');
  d.querySelectorAll('#snippet-list button')[1].click();assert.equal(readState(w).snippets.length,0);click('snippet-undo');assert.equal(readState(w).snippets.length,1);
});
test('wrong quiz answers are retained once and correct retries clear review',t=>{
  const {w,d,click}=setup(t);d.querySelector('#quiz-answers button').click();assert.equal(readState(w).missed.length,1);assert.match(d.getElementById('quiz-review-list').textContent,/git status/);
  click('quiz-restart');d.querySelector('#quiz-answers button').click();assert.equal(readState(w).missed.length,1);
  click('quiz-restart');d.querySelectorAll('#quiz-answers button')[1].click();assert.equal(readState(w).missed.length,0);
});
test('project checklists persist completion and isolate multiple projects',t=>{
  const {w,d,submit}=setup(t);const first=d.querySelector('#checklist-tasks input');first.checked=true;first.dispatchEvent(new w.Event('change'));assert.equal(readState(w).projects[0].tasks[0].done,true);
  d.getElementById('checklist-new-name').value='New project';submit('checklist-new-form');assert.equal(d.getElementById('checklist-meter').value,0);
  d.getElementById('checklist-task-title').value='<img src=x> custom task';submit('checklist-task-form');assert.equal(readState(w).projects[1].tasks.length,8);assert.equal(d.querySelector('#checklist-tasks img'),null);
  const reload=setup(t,readState(w));assert.equal(reload.d.getElementById('checklist-meter').value,1);
});
test('glossary filtering and reading preferences apply, persist, and reset',t=>{
  const {w,d,input,click}=setup(t);input('glossary-search','promise');assert.equal(d.querySelector('#glossary-list dt').textContent,'Promise');input('glossary-search','unlikelymissingterm');assert.equal(d.getElementById('glossary-list').children.length,0);
  input('reading-size','20','change');input('reading-spacing','2.2','change');d.getElementById('reading-contrast').checked=true;d.getElementById('reading-contrast').dispatchEvent(new w.Event('change'));
  const reload=setup(t,readState(w));assert.equal(reload.d.body.style.getPropertyValue('--study-text-size'),'20px');assert(reload.d.body.classList.contains('study-high-contrast'));
  click('reading-reset');assert.equal(d.body.style.getPropertyValue('--study-text-size'),'16px');assert.equal(d.body.classList.contains('study-high-contrast'),false);
});
test('printing selects matching lessons and restores native disclosures afterward',t=>{
  const {w,d,input,click}=setup(t);const lesson=d.getElementById('lesson-0');assert.equal(lesson.open,false);
  w.print=()=>{assert(d.body.classList.contains('study-printing'));assert.equal(d.querySelectorAll('.study-print-target').length,1);assert(lesson.open);};
  d.querySelector('#lesson-0 button[aria-label^="Print lesson:"]').click();w.dispatchEvent(new w.Event('afterprint'));assert.equal(lesson.open,false);assert.equal(d.body.classList.contains('study-printing'),false);
  input('notes-search','fetch');const matching=d.querySelectorAll('.lesson:not([hidden])').length;assert(matching>0&&matching<26);
  w.print=()=>assert.equal(d.querySelectorAll('.study-print-target').length,matching);click('print-matching');w.dispatchEvent(new w.Event('afterprint'));assert.equal(d.querySelectorAll('.study-print-target').length,0);
});
test('link checks distinguish confirmed missing links, restricted sites, and unverified cross-origin results',async t=>{
  const {w,d,click}=setup(t);d.querySelectorAll('a[href]').forEach(link=>link.remove());
  const fixture=(href,parent=d.body)=>{const a=d.createElement('a');a.href=href;a.textContent=href;parent.append(a);};
  fixture('#lesson-0');fixture('#missing-anchor');fixture('/missing.html');fixture('/head-not-supported');fixture('https://external.test/restricted');fixture('https://external.test/cors');fixture('/locked-secret',d.getElementById('locked-links-0'));
  const calls=[];w.fetch=async(url,options)=>{calls.push({url,options});if(url.includes('cors'))throw Error('CORS');const status=url.includes('missing.html')?404:url.includes('restricted')?403:url.includes('head-not-supported')&&options.method==='HEAD'?405:200;return {status,ok:status===200};};
  d.getElementById('links-external').checked=true;click('links-check');
  for(let i=0;i<100&&d.getElementById('links-check').disabled;i++)await new Promise(resolve=>setTimeout(resolve,5));
  assert.equal(d.getElementById('links-check').disabled,false);const results=d.getElementById('links-results').textContent;
  assert.match(results,/Broken — missing page anchor/);assert.match(results,/Broken — HTTP 404/);assert.match(results,/Restricted — HTTP 403/);assert.match(results,/Unverified — browser restriction/);
  assert(calls.some(call=>call.url.includes('head-not-supported')&&call.options.method==='GET'));assert.equal(calls.some(call=>call.url.includes('locked-secret')),false);assert.equal(calls.find(call=>call.url.includes('external.test')).options.credentials,'omit');
});
test('link checks can be cancelled and blocked storage leaves journal usable',async t=>{
  const {w,d,click,submit}=setup(t,null,true);d.getElementById('journal-title').value='Error';d.getElementById('journal-cause').value='Cause';d.getElementById('journal-fix').value='Fix';submit('journal-form');assert.match(d.getElementById('extras-storage').textContent,/visit only/);assert.match(d.getElementById('journal-list').textContent,/Fix/);
  d.querySelectorAll('a[href]').forEach(link=>link.remove());const a=d.createElement('a');a.href='/pending';a.textContent='Pending';d.body.append(a);
  w.fetch=(url,{signal})=>new Promise((resolve,reject)=>{signal.addEventListener('abort',()=>reject(Error('Aborted')));});click('links-check');click('links-stop');
  for(let i=0;i<100&&d.getElementById('links-check').disabled;i++)await new Promise(resolve=>setTimeout(resolve,5));assert.equal(d.getElementById('links-check').disabled,false);assert.match(d.getElementById('links-status').textContent,/Stopped/);
});
test('all copied pages include identical extra tools and preserve the Entra resource',()=>{
  for(const [folder,page] of [['website1copy','index1.html'],['website1copy/updates','index.html']]){const text=fs.readFileSync(`${folder}/${page}`,'utf8');assert.match(text,/learning-extras\.js\?v=[a-f0-9]{12}/);assert(text.includes('https://entra.microsoft.com'));assert.equal(fs.readFileSync(`${folder}/learning-extras.js`,'utf8'),fs.readFileSync('learning-extras.js','utf8'));}
});
