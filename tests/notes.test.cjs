const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const html = fs.readFileSync('index.html', 'utf8');
const content = JSON.parse(fs.readFileSync('notes-content.json', 'utf8'));
const settle = () => new Promise(resolve => setImmediate(resolve));
async function setup(t, clipboard) {
  const errors = [];
  const console = new VirtualConsole();
  console.on('jsdomError', error => errors.push(error));
  const dom = new JSDOM(html, { url:'http://127.0.0.1:5502/index.html', runScripts:'outside-only', virtualConsole:console });
  t.after(() => dom.window.close());
  const w = dom.window, d = w.document;
  w.localStorage.setItem('ik_youtube_api_key', ''); // Exercise missing-key behavior independently of the embedded default.
  w.HTMLMediaElement.prototype.play = () => Promise.resolve();
  w.HTMLMediaElement.prototype.pause = () => {};
  w.speechSynthesis = {cancel(){},speak(utterance){utterance.onstart?.();}};
  w.SpeechSynthesisUtterance = function(text){this.text=text;};
  if (clipboard) Object.defineProperty(w.navigator,'clipboard',{value:clipboard,configurable:true});
  w.fetch = async url => {
    const path = String(url);
    let data = {};
    if (path.includes('/v1/surah/') && path.includes('/en.asad')) data = {data:{ayahs:[{text:'English translation'}]}};
    else if (path.includes('/v1/surah/')) data = {data:{ayahs:[{text:'<b>Arabic text</b>',audio:'https://example.com/recitation.mp3'}]}};
    else if (path.endsWith('/v1/surah')) data = {data:Array.from({length:114},(_,i)=>({number:i+1,englishName:i===0?'Al-Faatiha':`Surah ${i+1}`,englishNameTranslation:i===0?'The Opening':`Meaning ${i+1}`}))};
    else if (path.includes('/json/countries')) data = [{name:'United States',stationcount:5}];
    else if (path.includes('/json/stations')) data = [{name:'<b>Test radio</b>',country:'United States',tags:'music',url_resolved:'https://example.com/radio.mp3'}];
    else if (path.includes('googleapis.com')) data = {items:[{id:{videoId:'abcdefghijk'},snippet:{title:'<b>Test video</b>',channelTitle:'A & B',thumbnails:{default:{url:'https://example.com/thumb.png'}}}}]};
    else if (path.includes('/forecast?')) data = {current:{temperature_2m:64,weather_code:3},current_units:{temperature_2m:"Ã‚Â°F"},daily:{time:['2026-10-09','2026-10-10'],weather_code:[3,3],temperature_2m_max:[70,71],temperature_2m_min:[50,49]}};
    else if (path.includes('geocoding-api')) data = {results:[{name:'New York',admin1:'New York',latitude:40.7,longitude:-74}]};
    else data = {latitude:40.7,longitude:-74,city:'New York',region:'New York'};
    return {ok:true,status:200,json:async()=>data};
  };
  w.eval(fs.readFileSync('script.js','utf8'));
  w.eval(fs.readFileSync('notes.js','utf8'));
  await settle();
  return {w,d,errors,click:id=>d.getElementById(id).click(), input:(id,value,event='input')=>{const e=d.getElementById(id);e.value=value;e.dispatchEvent(new w.Event(event,{bubbles:true}));}};
}
test('all lessons preserve literal examples and include explanations, mistakes, and practice', async t => {
  const {d,errors}=await setup(t);
  assert.equal(d.querySelectorAll('.lesson').length,26);
  assert.equal(d.querySelectorAll('.notes-topic-group').length,13);
  content.forEach((lesson,i)=>assert.equal(d.getElementById(`example-${i}`).textContent,lesson.code));
  assert.equal(d.querySelectorAll('.lesson-mistake').length,26);
  assert.equal(d.querySelectorAll('.practice-answer').length,26);
  assert.equal(d.querySelectorAll('[id]').length,new Set([...d.querySelectorAll('[id]')].map(e=>e.id)).size);
  for (const e of d.querySelectorAll('[aria-controls]')) for(const id of e.getAttribute('aria-controls').split(/\s+/)) assert.ok(d.getElementById(id),id);
  assert.deepEqual(errors,[]);
});
test('every topic filter, search normalization, empty state, clear, and Escape', async t => {
  const {d,w,input,click}=await setup(t);
  for(const topic of new Set(content.map(e=>e.topic))) {
    input('notes-topic',topic,'change');
    const visible=[...d.querySelectorAll('.lesson')].filter(e=>!e.hidden);
    assert.equal(visible.length,2);assert.ok(visible.every(e=>e.dataset.topic===topic));
  }
  input('notes-topic','all','change');input('notes-search','  REACT  cleanup ');
  assert.equal(d.querySelectorAll('.lesson:not([hidden])').length,1);
  assert.ok(d.querySelector('.lesson:not([hidden])').open);
  input('notes-search','no-such-topic-xyz');assert.equal(d.getElementById('notes-empty').hidden,false);
  assert.equal(d.getElementById('notes-expand').disabled,true);
  click('notes-clear');assert.equal(d.querySelectorAll('.lesson:not([hidden])').length,26);
  assert.equal(d.activeElement.id,'notes-search');
  input('notes-search','React');d.getElementById('notes-search').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  assert.equal(d.getElementById('notes-search').value,'');
  input('notes-topic','legacy','change');assert.equal(d.querySelectorAll('.lesson:not([hidden])').length,0);assert.equal(d.getElementById('git-notes').hidden,false);
});
test('expand/collapse and preserved legacy accordion controls', async t => {
  const {d,w,input,click}=await setup(t);
  click('notes-expand');assert.ok([...d.querySelectorAll('.lesson')].every(e=>e.open));
  const old=[...d.querySelectorAll('.content-right > .accordion-toggle')];assert.ok(old.length>20);
  assert.ok(old.every(e=>e.getAttribute('aria-expanded')==='true'));
  click('notes-collapse');assert.ok([...d.querySelectorAll('.lesson')].every(e=>!e.open));
  for(const button of old) {
    button.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));assert.equal(button.getAttribute('aria-expanded'),'true');
    button.dispatchEvent(new w.KeyboardEvent('keydown',{key:' ',bubbles:true}));assert.equal(button.getAttribute('aria-expanded'),'false');
  }
  click('repo-steps-toggle');assert.equal(d.getElementById('repo-steps-panel').hidden,false);click('repo-steps-toggle');
  for(const lesson of d.querySelectorAll('.lesson')) {lesson.open=true;const answer=lesson.querySelector('.practice-answer');answer.open=true;assert.ok(answer.open);answer.open=false;lesson.open=false;}
  input('notes-search','git reset');assert.ok([...d.querySelectorAll('.content-right > .accordion-toggle')].some(e=>!e.hidden));
  click('notes-clear');assert.ok(old.every(e=>e.getAttribute('aria-expanded')==='false'));
});
test('every copy button copies the exact code', async t => {
  const copied=[];const {d}=await setup(t,{writeText:async text=>copied.push(text)});
  for(const button of d.querySelectorAll('.notes-copy')) {button.click();await settle();assert.equal(button.disabled,false);}
  assert.deepEqual(copied,content.map(e=>e.code));
  assert.match(d.getElementById('notes-copy-status').textContent,/Copied code/);
});
test('copy denial opens manual selection, traps focus, closes and restores focus', async t => {
  const {d,w}=await setup(t,{writeText:async()=>{throw Error('Denied');}});
  const button=d.querySelector('.notes-copy');button.closest('details').open=true;button.focus();button.click();await settle();
  const dialog=d.getElementById('notes-copy-dialog'),field=d.getElementById('notes-copy-text');
  assert.equal(dialog.hidden,false);assert.equal(field.value,content[0].code);assert.equal(d.activeElement,field);
  assert.equal(field.selectionEnd,field.value.length);assert.equal(d.querySelector('main').inert,true);
  dialog.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Tab',bubbles:true}));assert.equal(d.activeElement.id,'notes-copy-close');
  dialog.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true}));assert.equal(d.activeElement,field);
  dialog.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.ok(dialog.hidden);assert.equal(d.activeElement,button);assert.ok(!d.querySelector('main').inert);
  button.click();await settle();d.getElementById('notes-copy-close').click();assert.ok(dialog.hidden);
  button.click();await settle();dialog.click();assert.ok(dialog.hidden);
});
test('notes CRUD, calendar, certificate zoom/escape, weather controls', async t => {
  const {d,w,input,click}=await setup(t);
  input('todo-input','<img src=x onerror=alert(1)>');click('todo-add-btn');
  assert.equal(d.querySelector('#todo-list img'),null);assert.match(d.querySelector('.todo-text').textContent,/<img/);
  d.querySelector('#todo-list input').click();assert.ok(d.querySelector('#todo-list li').classList.contains('done'));
  d.querySelector('.todo-del').click();assert.equal(d.querySelectorAll('.todo-del').length,0);
  const title=d.getElementById('cal-title').textContent;click('cal-next');assert.notEqual(d.getElementById('cal-title').textContent,title);click('cal-prev');assert.equal(d.getElementById('cal-title').textContent,title);
  for(const chip of [...d.querySelectorAll('.cal-month-chip')]) {chip.click();assert.ok(d.getElementById('cal-title').textContent.startsWith(chip.getAttribute('aria-label')));}
  for(const button of d.querySelectorAll('.cert-thumb-btn')) {
    button.click();assert.equal(d.getElementById('cert-modal').getAttribute('aria-hidden'),'false');assert.equal(d.activeElement.id,'cert-modal-close');
    d.getElementById('cert-modal-image').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));assert.ok(d.getElementById('cert-modal-image').classList.contains('zoomed'));
    d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(d.getElementById('cert-modal').getAttribute('aria-hidden'),'true');assert.equal(d.activeElement,button);
  }
  click('weather-forecast-toggle');assert.ok(!d.getElementById('weather-forecast-wrap').hidden);click('weather-forecast-link');assert.ok(d.getElementById('weather-forecast-wrap').hidden);
  click('weather-menu-btn');assert.ok(!d.getElementById('weather-menu').hidden);click('weather-add-location-btn');assert.match(d.getElementById('weather-menu-status').textContent,/state/);
  input('weather-state-select','New York','change');assert.ok(!d.getElementById('weather-city-select').disabled);
  input('weather-city-select','New York City','change');click('weather-add-location-btn');await settle();assert.ok(d.getElementById('weather-menu').hidden);
  click('weather-location-btn');await settle();assert.notEqual(d.getElementById('weather-temp-big').textContent,'--');
});
test('Quran load/search/translation and radio search/play use safe API rendering', async t => {
  const {d,input,click}=await setup(t);click('load-surahs-btn');await settle();assert.equal(d.querySelectorAll('.surah').length,114);
  input('surah-search','Fatiha');await settle();assert.equal(d.querySelectorAll('.surah').length,1);
  d.querySelector('.load-surah-btn').click();await settle();assert.equal(d.querySelector('.surah-arabic b'),null);
  assert.equal(d.querySelector('.play-translation-btn').disabled,false);d.querySelector('.play-translation-btn').click();d.querySelector('.stop-translation-btn').click();
  d.querySelector('.play-both-btn').click();await settle();d.querySelector('.stop-translation-btn').click();
  click('load-surahs-btn');assert.equal(d.getElementById('quran-surahs').style.display,'none');click('load-surahs-btn');
  input('radio-search-input','test');click('radio-search-btn');await settle();assert.equal(d.querySelectorAll('.radio-station-btn').length,1);
  assert.equal(d.querySelector('.radio-station-btn b'),null);d.querySelector('.radio-station-btn').click();await settle();assert.match(d.getElementById('radio-status-line').textContent,/Playing/);
});
test('both video widgets: missing key, key save/clear, search, related, direct ID, back', async t => {
  const {d,input,click}=await setup(t);
  for(const prefix of ['youtube','iwatch']) {
    d.defaultView.localStorage.setItem('ik_youtube_api_key','');
    input(`${prefix}-search-input`,'test');click(`${prefix}-search-btn`);assert.equal(d.getElementById(`${prefix}-api-key-panel`).hidden,false);
    input(`${prefix}-api-key-input`,'test-key');click(`${prefix}-api-key-save`);
    click(`${prefix}-search-btn`);await settle();const result=d.querySelector(`#${prefix}-results .youtube-result-card`);assert.ok(result);assert.equal(result.querySelector('b'),null);
    result.click();await settle();assert.match(d.getElementById(`${prefix}-player`).src,/youtube.com\/embed\/abcdefghijk/);
    input(`${prefix}-related-select`,'abcdefghijk','change');await settle();
    click(`${prefix}-api-key-clear`);assert.equal(d.defaultView.localStorage.getItem('ik_youtube_api_key'),prefix==='iwatch'?'':null);
    input(`${prefix}-search-input`,'abcdefghijk');click(`${prefix}-search-btn`);assert.match(d.getElementById(`${prefix}-player`).src,/abcdefghijk/);
    if(prefix==='iwatch'){click('iwatch-np-back-btn');assert.equal(d.getElementById('iwatch-player').src,'about:blank');}
  }
});

test('all local copies contain the same lessons and shared behavior', () => {
  for (const [directory, page, css, script] of [
    ['website1copy', 'index1.html', 'styles.css', 'script.js'],
    ['website1copy/updates', 'index.html', 'style.css', 'java.js']
  ]) {
    const copy = new JSDOM(fs.readFileSync(require('node:path').join(directory, page), 'utf8'));
    assert.equal(copy.window.document.querySelectorAll('.lesson').length, 26);
    for (let i = 0; i < content.length; i++) {
      assert.equal(copy.window.document.getElementById(`example-${i}`).textContent, content[i].code);
    }
    for (const [source, target] of [['notes.js', 'notes.js'], ['styles.css', css], ['script.js', script]]) {
      assert.equal(fs.readFileSync(require('node:path').join(directory, target), 'utf8'), fs.readFileSync(source, 'utf8'));
    }
    copy.window.close();
  }
});


test('four locks reject wrong codes, unlock independently, relock, and resist bulk expansion', async t => {
  const {w,d} = await setup(t);
  w.HTMLDialogElement.prototype.showModal = function(){this.open=true;};
  w.HTMLDialogElement.prototype.close = function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
  w.eval(fs.readFileSync('section-locks.js','utf8'));
  const headings=[...d.querySelectorAll('[data-lock-heading]')];
  assert.equal(headings.length,4);
  const field=d.getElementById('section-lock-code'), form=d.getElementById('section-lock-form'), dialog=d.getElementById('section-lock-dialog');
  const submit=code=>{field.value=code;form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));};
  for(const heading of headings){
    assert.equal(heading.dataset.locked,'true');
    heading.click(); assert.equal(dialog.open,true); assert.equal(d.activeElement,field);
    submit('9999'); assert.equal(dialog.open,true); assert.equal(heading.dataset.locked,'true');
    submit('1233'); assert.equal(dialog.open,false); assert.equal(heading.dataset.locked,'false'); assert.equal(heading.getAttribute('aria-expanded'),'true'); assert.equal(d.activeElement,heading);
    assert.equal(headings.filter(h=>h.dataset.locked==='false').length,1);
    heading.click(); assert.equal(heading.dataset.locked,'true'); assert.equal(heading.getAttribute('aria-expanded'),'false');
  }
  const legacy=headings[3];
  d.getElementById('notes-expand').click(); assert.equal(legacy.getAttribute('aria-expanded'),'false');
  legacy.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true})); assert.equal(dialog.open,true);
  d.getElementById('section-lock-cancel').click(); assert.equal(dialog.open,false); assert.equal(legacy.dataset.locked,'true'); assert.equal(d.activeElement,legacy);
  for(const folder of ['website1copy','website1copy/updates']) assert.equal(fs.readFileSync(`${folder}/section-locks.js`,'utf8'),fs.readFileSync('section-locks.js','utf8'));
});

test('I-WATCH embedded default survives fresh loads and honors override or clear', async t => {
  for (let load = 0; load < 2; load++) {
    const {w,d}=await setup(t);
    w.localStorage.removeItem('ik_youtube_api_key');
    d.getElementById('iwatch-api-key-btn').click();
    const input=d.getElementById('iwatch-api-key-input');
    assert.match(input.value, /^AIza[\w-]{35}$/);
    input.value='override-test-key';d.getElementById('iwatch-api-key-save').click();
    d.getElementById('iwatch-api-key-btn').click(); d.getElementById('iwatch-api-key-btn').click();
    assert.equal(input.value,'override-test-key');
    d.getElementById('iwatch-api-key-clear').click();
    assert.equal(w.localStorage.getItem('ik_youtube_api_key'),'');
    d.getElementById('iwatch-api-key-btn').click();d.getElementById('iwatch-api-key-btn').click();
    assert.equal(input.value,'');
  }
});

