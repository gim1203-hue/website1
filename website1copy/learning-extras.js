/* Additional learning tools. User-written content is rendered as text, never markup. */
(() => {
  'use strict';
  const host = document.getElementById('study-tools');
  if (!host) return;
  const get = id => document.getElementById(id);
  const clip = (value, max = 2000) => typeof value === 'string' ? value.slice(0, max) : '';
  const STORE = 'ik_learning_extras_v1';
  const root = document.createElement('section'); root.id = 'study-more';
  root.innerHTML = `
    <h3>More learning tools</h3><p id="extras-storage" class="study-muted" role="status">Your saved work stays in this browser.</p>
    <div id="extras-tabs" class="study-row" role="tablist" aria-label="More learning tools"></div>
    <section id="extra-commands" data-extra="commands" role="tabpanel"><h4>Command cheat sheet</h4><label for="command-search">Find a command</label><input id="command-search" type="search" placeholder="Git, PowerShell, files…"><div id="command-list"></div><p id="command-status" role="status"></p><label id="command-manual-label" for="command-manual" hidden>Copy this command manually</label><textarea id="command-manual" readonly hidden></textarea></section>
    <section id="extra-journal" data-extra="journal" role="tabpanel" hidden><h4>Mistake journal</h4><form id="journal-form"><label for="journal-title">Error or mistake</label><input id="journal-title" maxlength="200" required><div class="study-grid"><div><label for="journal-cause">What caused it?</label><textarea id="journal-cause" maxlength="2000" required></textarea></div><div><label for="journal-fix">How did you fix it?</label><textarea id="journal-fix" maxlength="2000" required></textarea></div></div><div class="study-row"><button id="journal-save" type="submit">Save mistake</button><button id="journal-cancel" type="button" hidden>Cancel edit</button><button id="journal-undo" type="button" hidden>Undo delete</button></div></form><p id="journal-status" role="status"></p><div id="journal-list"></div></section>
    <section id="extra-snippets" data-extra="snippets" role="tabpanel" hidden><h4>Saved playground examples</h4><p>Save the current HTML, CSS, and JavaScript from your playground.</p><label for="snippet-name">Example name</label><input id="snippet-name" maxlength="100" placeholder="My first button"><div class="study-row"><button id="snippet-save" type="button">Save playground example</button></div><div id="snippet-list"></div><p id="snippet-status" role="status"></p></section>
    <section id="extra-review" data-extra="review" role="tabpanel" hidden><h4>Quiz review</h4><p>Questions you miss appear here. Reveal the answer, then mark it understood.</p><div id="quiz-review-list"></div><p id="quiz-review-status" role="status"></p></section>
    <section id="extra-projects" data-extra="projects" role="tabpanel" hidden><h4>Project checklist</h4><label for="checklist-project">Choose a project</label><select id="checklist-project"></select><form id="checklist-new-form" class="study-row"><label for="checklist-new-name">New project name</label><input id="checklist-new-name" maxlength="100" required><button type="submit">Add project</button></form><p id="checklist-progress" role="status"></p><progress id="checklist-meter" value="0" max="7" aria-label="Project tasks completed"></progress><div id="checklist-tasks"></div><form id="checklist-task-form"><label for="checklist-task-title">Add a task</label><input id="checklist-task-title" maxlength="200" required><button type="submit">Add task</button></form><p id="checklist-status" role="status"></p></section>
    <section id="extra-glossary" data-extra="glossary" role="tabpanel" hidden><h4>Engineering glossary</h4><label for="glossary-search">Find a term</label><input id="glossary-search" type="search" placeholder="API, DOM, promise…"><dl id="glossary-list"></dl><p id="glossary-status" role="status"></p></section>
    <section id="extra-reading" data-extra="reading" role="tabpanel" hidden><h4>Reading preferences</h4><div class="study-grid"><div><label for="reading-size">Text size</label><select id="reading-size"><option value="16">Standard</option><option value="18">Large</option><option value="20">Extra large</option></select></div><div><label for="reading-spacing">Line spacing</label><select id="reading-spacing"><option value="1.7">Standard</option><option value="1.9">Relaxed</option><option value="2.2">Spacious</option></select></div></div><label class="extras-check"><input id="reading-contrast" type="checkbox"> High contrast</label><button id="reading-reset" type="button">Reset reading preferences</button><p id="reading-status" role="status"></p></section>
    <section id="extra-print" data-extra="print" role="tabpanel" hidden><h4>Print-friendly notes</h4><p>Print the lessons matching your current notes filters, or use Print lesson inside an individual lesson. In the print dialog, choose Save as PDF to create a PDF.</p><button id="print-matching" type="button">Print matching lessons</button><p id="print-status" role="status"></p></section>
    <section id="extra-links" data-extra="links" role="tabpanel" hidden><h4>Resource link checker</h4><p>Check page links and local resources. Unlock a resource group first to include its links.</p><label class="extras-check"><input id="links-external" type="checkbox"> Include external websites</label><p class="study-muted">Some websites prevent browser checks. Those results are marked Unverified, so you can open them yourself.</p><div class="study-row"><button id="links-check" type="button">Check links</button><button id="links-stop" type="button" disabled>Stop checking</button></div><p id="links-status" role="status"></p><div id="links-results"></div></section>
    <section id="extra-new" data-extra="new" role="tabpanel" hidden><h4>What's new</h4><article class="extras-entry"><h5>More tools for your course · October 12, 2026</h5><p>Command cheat sheet, mistake journal, saved code examples, missed-question review, project checklists, glossary, reading preferences, print-friendly notes, and link checking.</p></article><article class="extras-entry"><h5>Take your progress with you · October 12, 2026</h5><p>Export and import bookmarks and completed lessons between browsers.</p></article><article class="extras-entry"><h5>Your learning hub · October 12, 2026</h5><p>Lesson bookmarks, progress tracking, practice quizzes, projects, a code playground, whole-site search, and focus mode.</p></article></section>`;
  host.append(root);
  const navLink = document.createElement('a'); navLink.href = '#study-more'; navLink.textContent = 'More learning tools'; get('study-toolbar').querySelector('nav').append(navLink);
  const names = {commands:'Commands', journal:'Mistake journal', snippets:'Saved code', review:'Quiz review', projects:'Checklist', glossary:'Glossary', reading:'Reading', print:'Print notes', links:'Link checker', new:"What's new"};
  let active = 'commands';
  const tabs = [];
  function selectTab(key, focus = false) {
    if (!names[key]) return; active = key;
    root.querySelectorAll('[data-extra]').forEach(panel => { panel.hidden = panel.dataset.extra !== key; });
    tabs.forEach(button => { const selected = button.dataset.tab === key; button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1; });
    if (focus) get('extra-tab-' + key).focus();
  }
  for (const [key, title] of Object.entries(names)) {
    const button = document.createElement('button'); button.type = 'button'; button.id = 'extra-tab-' + key; button.dataset.tab = key;
    button.textContent = title; button.setAttribute('role', 'tab'); button.setAttribute('aria-controls', 'extra-' + key);
    get('extra-' + key).setAttribute('aria-labelledby', button.id);
    button.addEventListener('click', () => selectTab(key)); tabs.push(button); get('extras-tabs').append(button);
    document.dispatchEvent(new CustomEvent('study-search-register', {detail:{title,kind:'Learning tool',element:get('extra-' + key)}}));
  }
  get('extras-tabs').addEventListener('keydown', event => {
    const index = tabs.indexOf(event.target); if (index < 0) return;
    const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
    if (next >= 0) { event.preventDefault(); selectTab(tabs[next].dataset.tab, true); }
  });
  document.addEventListener('study-search-open', event => {
    const panel = event.detail?.element?.closest?.('[data-extra]'); if (panel && root.contains(panel)) selectTab(panel.dataset.extra);
  });
  selectTab(active);

  let state = {journal:[], snippets:[], missed:[], projects:[], preferences:{size:16, spacing:1.7, contrast:false}};
  let storageOK = true;
  let sequence = 0;
  const newID = () => `${Date.now().toString(36)}-${++sequence}`;
  try {
    const value = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (value && typeof value === 'object') {
      if (Array.isArray(value.journal)) state.journal = value.journal.slice(0,100).filter(x=>x && typeof x.id === 'string' && typeof x.title === 'string').map(x=>({id:clip(x.id,100),title:clip(x.title,200),cause:clip(x.cause),fix:clip(x.fix)}));
      if (Array.isArray(value.snippets)) state.snippets = value.snippets.slice(0,50).filter(x=>x && typeof x.name === 'string').map(x=>({name:clip(x.name,100),html:clip(x.html,65536),css:clip(x.css,65536),js:clip(x.js,65536)}));
      if (Array.isArray(value.missed)) state.missed = value.missed.slice(0,50).filter(x=>x && typeof x.id === 'string').map(x=>({id:clip(x.id,100),topic:clip(x.topic,100),question:clip(x.question),chosen:clip(x.chosen),answer:clip(x.answer),explanation:clip(x.explanation)}));
      if (Array.isArray(value.projects)) state.projects = value.projects.slice(0,20).filter(x=>x && typeof x.name === 'string' && Array.isArray(x.tasks)).map(x=>({name:clip(x.name,100),tasks:x.tasks.slice(0,50).filter(task=>task && typeof task.title === 'string').map(task=>({title:clip(task.title,200),done:task.done === true}))}));
      const p = value.preferences;
      if (p && typeof p === 'object') state.preferences = {size:[16,18,20].includes(p.size) ? p.size : 16,spacing:[1.7,1.9,2.2].includes(p.spacing) ? p.spacing : 1.7,contrast:p.contrast === true};
    }
  } catch (_) { storageOK = false; }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); storageOK = true; }
    catch (_) { storageOK = false; }
    get('extras-storage').textContent = storageOK ? 'Your saved work stays in this browser.' : 'Browser storage is unavailable or full. Changes will last for this visit only.';
  }
  if (!storageOK) get('extras-storage').textContent = 'Browser storage is unavailable. Changes will last for this visit only.';
  const text = (tag, value, cls) => { const element = document.createElement(tag); element.textContent = value; if (cls) element.className = cls; return element; };
  const action = (label, handler) => { const button = text('button',label); button.type = 'button'; button.addEventListener('click',handler); return button; };
  const entry = () => { const element = document.createElement('article'); element.className = 'extras-entry'; return element; };

  const commands = [
    ['Git', 'git status', 'See staged and unstaged changes.'], ['Git', 'git diff', 'Review changes before staging.'], ['Git', 'git add filename', 'Stage one file for a commit.'], ['Git', 'git commit -m "Describe your change"', 'Commit the staged changes.'], ['Git', 'git log --oneline -5', 'Review the five latest commits.'], ['Git', 'git restore --staged filename', 'Unstage a file while keeping working changes.'], ['Git', 'git push origin master', 'Publish your local master commits.'],
    ['PowerShell', 'Get-Location', 'Show your current directory.'], ['PowerShell', 'Get-ChildItem', 'List files and directories.'], ['PowerShell', 'Set-Location -LiteralPath "C:\\Projects\\my website"', 'Move to a directory with spaces in its name.'], ['PowerShell', 'Get-Content -LiteralPath .\\index.html -TotalCount 20', 'Read the beginning of a file.'], ['Project', 'npm test', 'Run the website tests.'], ['Project', 'npm run check', 'Check JavaScript syntax.'], ['Project', 'npm run sync', 'Update copied pages and asset versions.']
  ];
  function drawCommands() {
    const query = get('command-search').value.toLowerCase().trim(); const list = get('command-list'); list.replaceChildren();
    commands.filter(command=>command.join(' ').toLowerCase().includes(query)).forEach(([topic, code, description])=>{
      const row = entry(); row.append(text('p',topic,'study-muted'),text('code',code),text('p',description));
      row.append(action('Copy command',async()=>{
        try { if (!navigator.clipboard?.writeText) throw new Error('Unavailable'); await navigator.clipboard.writeText(code); get('command-status').textContent = 'Command copied.'; }
        catch (_) { get('command-manual').value = code; get('command-manual').hidden = false; get('command-manual-label').hidden = false; get('command-manual').focus(); get('command-manual').select(); get('command-status').textContent = 'Select the command below and press Ctrl+C or Command+C.'; }
      })); list.append(row);
    });
    if (!list.children.length) list.append(text('p','No commands match.'));
  }
  get('command-search').addEventListener('input',drawCommands); drawCommands();

  let editing = null, deleted = null;
  function cancelEdit() { editing = null; get('journal-form').reset(); get('journal-save').textContent = 'Save mistake'; get('journal-cancel').hidden = true; }
  function drawJournal() {
    const list = get('journal-list'); list.replaceChildren();
    if (!state.journal.length) list.append(text('p','No mistakes saved yet. Record an error and how you solved it.'));
    state.journal.forEach(item=>{
      const row = entry(); row.append(text('h5',item.title),text('p','Cause: '+item.cause),text('p','Fix: '+item.fix));
      const actions = text('div','','study-row');
      actions.append(action('Edit',()=>{editing=item.id; for (const key of ['title','cause','fix']) get('journal-'+key).value=item[key];get('journal-save').textContent='Update mistake';get('journal-cancel').hidden=false;get('journal-title').focus();}),action('Delete',()=>{deleted={item,index:state.journal.indexOf(item)};state.journal=state.journal.filter(x=>x!==item);if(editing===item.id)cancelEdit();save();drawJournal();get('journal-undo').hidden=false;get('journal-status').textContent='Mistake deleted. You can undo this deletion.';}));row.append(actions);list.append(row);
    });
  }
  get('journal-form').addEventListener('submit',event=>{
    event.preventDefault();const item={id:editing||newID(),title:get('journal-title').value.trim(),cause:get('journal-cause').value.trim(),fix:get('journal-fix').value.trim()};
    if (!item.title||!item.cause||!item.fix) {get('journal-status').textContent='Fill in the mistake, cause, and fix.';return;}
    if (!editing && state.journal.length>=100) {get('journal-status').textContent='You have 100 entries. Remove an old entry before adding another.';return;}
    if(editing)state.journal=state.journal.map(x=>x.id===editing?item:x);else state.journal.unshift(item);
    save();drawJournal();cancelEdit();get('journal-status').textContent=storageOK?'Mistake saved.':'Mistake kept for this visit only.';
  });
  get('journal-cancel').addEventListener('click',cancelEdit);
  get('journal-undo').addEventListener('click',()=>{if(!deleted)return;if(state.journal.length>=100){get('journal-status').textContent='Remove an entry before restoring this mistake.';return;}state.journal.splice(deleted.index,0,deleted.item);deleted=null;save();drawJournal();get('journal-undo').hidden=true;get('journal-status').textContent='Mistake restored.';});drawJournal();

  let removedSnippet = null;
  const undoSnippet = action('Undo delete',()=>{if(!removedSnippet)return;if(state.snippets.length>=50||state.snippets.some(item=>item.name===removedSnippet.name)){get('snippet-status').textContent='Remove an example with that name or free a slot before restoring this example.';return;}state.snippets.push(removedSnippet);removedSnippet=null;save();drawSnippets();get('snippet-status').textContent='Example restored.';undoSnippet.hidden=true;});undoSnippet.id='snippet-undo';undoSnippet.hidden=true;get('snippet-status').after(undoSnippet);
  function drawSnippets() {
    const list=get('snippet-list');list.replaceChildren();if(!state.snippets.length)list.append(text('p','No examples saved yet. Write code in the playground, then name and save it here.'));
    state.snippets.forEach(item=>{const row=entry();row.append(text('h5',item.name));const actions=text('div','','study-row');actions.append(action('Load example',()=>{for(const key of ['html','css','js'])get('playground-'+key).value=item[key];get('snippet-name').value=item.name;get('playground-run').click();get('snippet-status').textContent='Loaded '+item.name+'.';get('study-playground').scrollIntoView?.({block:'start'});}),action('Delete',()=>{removedSnippet=item;state.snippets=state.snippets.filter(x=>x!==item);save();drawSnippets();undoSnippet.hidden=false;get('snippet-status').textContent='Example deleted. You can undo this deletion.';}));row.append(actions);list.append(row);});
  }
  get('snippet-save').addEventListener('click',()=>{
    const name=get('snippet-name').value.trim();if(!name){get('snippet-status').textContent='Give your example a name first.';return;}
    const item={name};for(const key of ['html','css','js']){item[key]=get('playground-'+key).value;if(item[key].length>65536){get('snippet-status').textContent='Each editor must contain fewer than 65,537 characters to save an example.';return;}}
    const existing=state.snippets.findIndex(x=>x.name===name);
    if(existing<0&&state.snippets.length>=50){get('snippet-status').textContent='You have 50 saved examples. Remove an old example before saving another.';return;}
    if(existing>=0)state.snippets[existing]=item;else state.snippets.push(item);
    save();drawSnippets();get('snippet-status').textContent=storageOK?`Example ${existing>=0?'updated':'saved'}: ${name}.`:'Example kept for this visit only.';
  });drawSnippets();

  function drawReview() {
    const list=get('quiz-review-list');list.replaceChildren();if(!state.missed.length)list.append(text('p','No missed questions to review. Try a practice quiz.'));
    state.missed.forEach(item=>{const row=entry();row.append(text('p',item.topic,'study-muted'),text('h5',item.question),text('p','Your answer: '+item.chosen));const details=document.createElement('details');details.append(text('summary','Reveal answer'),text('p','Correct answer: '+item.answer),text('p',item.explanation));row.append(details,action('Got it — remove from review',()=>{state.missed=state.missed.filter(x=>x.id!==item.id);save();drawReview();get('quiz-review-status').textContent='Question marked understood.';}));list.append(row);});
  }
  document.addEventListener('study-quiz-answer',event=>{
    const answer=event.detail;if(!answer||typeof answer.id!=='string')return;
    state.missed=state.missed.filter(item=>item.id!==answer.id);
    if(answer.correct!==true)state.missed.unshift({id:clip(answer.id,100),topic:clip(answer.topic,100),question:clip(answer.question),chosen:clip(answer.chosen),answer:clip(answer.answer),explanation:clip(answer.explanation)});
    state.missed=state.missed.slice(0,50);save();drawReview();
  });drawReview();

  const defaultTasks=['Define the project goal','Plan the page and content','Build the core features','Check mobile layout','Check keyboard access','Run tests and review changes','Publish and check the live website'];
  if(!state.projects.length)state.projects.push({name:'Software Engineering Hub',tasks:defaultTasks.map(title=>({title,done:false}))});
  let projectIndex=0;
  function drawProjects() {
    const select=get('checklist-project');select.replaceChildren();state.projects.forEach((project,index)=>{const option=text('option',project.name);option.value=String(index);select.append(option);});select.value=String(projectIndex);
    const project=state.projects[projectIndex],done=project.tasks.filter(task=>task.done).length;
    get('checklist-progress').textContent=`${done} of ${project.tasks.length} tasks completed.`;get('checklist-meter').max=Math.max(1,project.tasks.length);get('checklist-meter').value=done;
    const list=get('checklist-tasks');list.replaceChildren();project.tasks.forEach(task=>{const label=text('label','','extras-check');const box=document.createElement('input');box.type='checkbox';box.checked=task.done;box.addEventListener('change',()=>{task.done=box.checked;save();get('checklist-progress').textContent=`${project.tasks.filter(t=>t.done).length} of ${project.tasks.length} tasks completed.`;get('checklist-meter').value=project.tasks.filter(t=>t.done).length;});label.append(box,text('span',task.title));list.append(label);});
  }
  get('checklist-project').addEventListener('change',()=>{projectIndex=Number(get('checklist-project').value);drawProjects();});
  get('checklist-new-form').addEventListener('submit',event=>{event.preventDefault();const name=get('checklist-new-name').value.trim();if(!name)return;if(state.projects.length>=20){get('checklist-status').textContent='You have reached the limit of 20 projects.';return;}if(state.projects.some(project=>project.name===name)){get('checklist-status').textContent='That project name already exists.';return;}state.projects.push({name,tasks:defaultTasks.map(title=>({title,done:false}))});projectIndex=state.projects.length-1;save();drawProjects();get('checklist-new-form').reset();get('checklist-status').textContent='Project added.';});
  get('checklist-task-form').addEventListener('submit',event=>{event.preventDefault();const title=get('checklist-task-title').value.trim();if(!title)return;const project=state.projects[projectIndex];if(project.tasks.length>=50){get('checklist-status').textContent='Each project supports up to 50 tasks.';return;}project.tasks.push({title,done:false});save();drawProjects();get('checklist-task-form').reset();get('checklist-status').textContent='Task added.';});drawProjects();

  const terms = [
    ['API','Application programming interface: a contract for how one program communicates with another.'],['DOM','Document Object Model: the browser’s object representation of the page, which JavaScript can read and update.'],['Branch','An independent line of development in a Git repository.'],['Commit','A recorded snapshot of staged changes in Git.'],['Promise','A JavaScript object representing the eventual completion or failure of an asynchronous operation.'],['Repository','A project’s files and version history.'],['Merge','Combining changes from different lines of development.'],['CSS','Cascading Style Sheets: rules that control a web page’s presentation and layout.'],['HTML','HyperText Markup Language: the structure and meaning of a web document.'],['HTTP','Hypertext Transfer Protocol: the request/response protocol used by the web.'],['JSON','JavaScript Object Notation: a text format for structured data.'],['Responsive design','A layout that adapts to different screen sizes and input devices.'],['Accessibility','Designing content and controls so people with different abilities can use them.'],['Deployment','Publishing a version of an application to an environment where it can run.'],['localStorage','Browser storage that retains strings for a website between sessions, unless cleared or unavailable.'],['CORS','Cross-Origin Resource Sharing: browser rules that control whether a script can read responses from another origin.']
  ];
  function drawGlossary() {const query=get('glossary-search').value.toLowerCase().trim(),list=get('glossary-list');list.replaceChildren();const matches=terms.filter(term=>term.join(' ').toLowerCase().includes(query));matches.forEach(([term,definition])=>list.append(text('dt',term),text('dd',definition)));get('glossary-status').textContent=`${matches.length} terms found.`;}
  get('glossary-search').addEventListener('input',drawGlossary);drawGlossary();
  terms.forEach(([term,definition])=>document.dispatchEvent(new CustomEvent('study-search-register',{detail:{title:`Glossary: ${term} — ${definition}`,kind:'Reference',element:get('extra-glossary')}})));

  function applyReading() {const p=state.preferences;document.body.style.setProperty('--study-text-size',p.size+'px');document.body.style.setProperty('--study-line-spacing',String(p.spacing));document.body.classList.toggle('study-high-contrast',p.contrast);get('reading-size').value=String(p.size);get('reading-spacing').value=String(p.spacing);get('reading-contrast').checked=p.contrast;}
  for(const id of ['reading-size','reading-spacing','reading-contrast'])get(id).addEventListener('change',()=>{state.preferences={size:Number(get('reading-size').value),spacing:Number(get('reading-spacing').value),contrast:get('reading-contrast').checked};save();applyReading();get('reading-status').textContent=storageOK?'Reading preferences saved.':'Reading preferences applied for this visit.';});
  get('reading-reset').addEventListener('click',()=>{state.preferences={size:16,spacing:1.7,contrast:false};save();applyReading();get('reading-status').textContent='Reading preferences reset.';});applyReading();

  let printCleanup=null;
  function printLessons(lessons) {
    if(!lessons.length){get('print-status').textContent='No matching lessons to print. Clear your note filters first.';return;}
    printCleanup?.();const snapshots=[];
    lessons.forEach(lesson=>{lesson.classList.add('study-print-target');lesson.closest('.notes-topic-group').classList.add('study-print-group');for(const detail of [lesson,...lesson.querySelectorAll('details')]){snapshots.push([detail,detail.open]);detail.open=true;}});
    document.body.classList.add('study-printing');
    printCleanup=()=>{document.body.classList.remove('study-printing');document.querySelectorAll('.study-print-target,.study-print-group').forEach(element=>element.classList.remove('study-print-target','study-print-group'));snapshots.forEach(([detail,open])=>{detail.open=open;});printCleanup=null;};
    get('print-status').textContent=`Printing ${lessons.length} lesson${lessons.length===1?'':'s'}. Choose Save as PDF in your print dialog if needed.`;
    try {window.print();} catch (_) {printCleanup();get('print-status').textContent='Printing is unavailable in this browser.';}
  }
  window.addEventListener('afterprint',()=>printCleanup?.());
  get('print-matching').addEventListener('click',()=>printLessons([...document.querySelectorAll('#engineering-notes .lesson:not([hidden])')]));
  document.querySelectorAll('#engineering-notes .lesson').forEach(lesson=>{const button=action('Print lesson',()=>printLessons([lesson]));button.setAttribute('aria-label','Print lesson: '+lesson.querySelector('summary > span').textContent);lesson.querySelector('.study-lesson-actions')?.append(button);});

  let checking=false, stopped=false;const controllers=new Set();
  get('links-stop').addEventListener('click',()=>{stopped=true;controllers.forEach(controller=>controller.abort());get('links-status').textContent='Stopping link checks…';});
  async function checkLink(url) {
    if(url.origin===location.origin&&url.pathname===location.pathname&&url.search===location.search){if(!url.hash)return 'Reachable';try{return document.getElementById(decodeURIComponent(url.hash.slice(1)))?'Reachable':'Broken — missing page anchor';}catch(_){return 'Broken — invalid page anchor';}}
    const controller=new AbortController();controllers.add(controller);const timeout=setTimeout(()=>controller.abort(),6000);
    try {const options={method:'HEAD',mode:'cors',credentials:url.origin===location.origin?'same-origin':'omit',cache:'no-store',signal:controller.signal};let response=await fetch(url.href,options);if(response.status===405||response.status===501)response=await fetch(url.href,{...options,method:'GET'});if(response.ok)return 'Reachable';if(response.status===404||response.status===410)return `Broken — HTTP ${response.status}`;if(response.status===401||response.status===403)return `Restricted — HTTP ${response.status}`;return `Unverified — HTTP ${response.status}`;}
    catch(_){return stopped?'Not checked — stopped':'Unverified — browser restriction, network error, or timeout';}
    finally {clearTimeout(timeout);controllers.delete(controller);}
  }
  get('links-check').addEventListener('click',async()=>{
    if(checking)return;checking=true;stopped=false;get('links-check').disabled=true;get('links-stop').disabled=false;const results=get('links-results');results.replaceChildren();
    const unique=new Map();let externalSkipped=0,lockedSkipped=0;
    document.querySelectorAll('a[href]').forEach(link=>{if(link.closest('#links-results'))return;const locked=link.closest('.locked-group.is-locked,.accordion-panel.is-locked');if(locked){lockedSkipped++;return;}try{const url=new URL(link.getAttribute('href'),location.href);if(!['http:','https:'].includes(url.protocol))return;if(url.origin!==location.origin&&!get('links-external').checked){externalSkipped++;return;}if(!unique.has(url.href))unique.set(url.href,{url,label:link.textContent.trim()||url.href});}catch(_){/* Unsupported links are not requested. */}});
    const links=[...unique.values()].slice(0,150);let cursor=0,done=0;const totals={reachable:0,broken:0,other:0,notchecked:0};
    const rows=links.map(link=>{const row=entry(),anchor=document.createElement('a');anchor.href=link.url.href;anchor.textContent=link.label;anchor.target='_blank';anchor.rel='noopener noreferrer';row.append(anchor,text('p',link.url.href,'extras-url'));const status=text('p','Waiting…');row.append(status);results.append(row);return status;});
    const report=()=>{get('links-status').textContent=`${stopped?'Stopped. ':''}${done-totals.notchecked} of ${links.length} checked: ${totals.reachable} reachable, ${totals.broken} broken, ${totals.other} restricted or unverified. ${lockedSkipped} locked links and ${externalSkipped} external links skipped.${unique.size>150?' First 150 unique links shown.':''}`;};report();
    try {await Promise.all(Array.from({length:Math.min(4,links.length)},async()=>{while(!stopped&&cursor<links.length){const index=cursor++;rows[index].textContent='Checking…';const status=await checkLink(links[index].url);rows[index].textContent=status;rows[index].classList.toggle('study-transfer-error',status.startsWith('Broken'));totals[status.startsWith('Reachable')?'reachable':status.startsWith('Broken')?'broken':status.startsWith('Not checked')?'notchecked':'other']++;done++;report();}}));}
    finally {rows.forEach(row=>{if(row.textContent==='Waiting…')row.textContent='Not checked — stopped';});checking=false;get('links-check').disabled=false;get('links-stop').disabled=true;report();}
  });
})();
