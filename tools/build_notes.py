from pathlib import Path
import html, json, re
root = Path(__file__).resolve().parents[1]
E = html.escape
entries = json.loads((root / 'notes-content.json').read_text(encoding='utf-8'))
topics = list(dict.fromkeys(item['topic'] for item in entries))
section = '''<!-- ENGINEERING LIBRARY START -->
<section id="engineering-notes" class="notes-library" aria-labelledby="notes-library-title">
  <div class="notes-library-heading"><p class="notes-eyebrow">LEARN · BUILD · PRACTICE</p><h2 id="notes-library-title">Software Engineering Notes</h2><p>A practical reference from your first commit to a production release. Your original course notes are preserved below.</p></div>
  <div class="notes-controls" role="search" aria-label="Engineering notes">
    <div><label for="notes-search">Search all engineering notes</label><input id="notes-search" type="search" placeholder="Try: git restore, React, fetch, SQL…" aria-controls="notes-topics git-notes" autocomplete="off"></div>
    <div><label for="notes-topic">Topic</label><select id="notes-topic"><option value="all">All topics + original notes</option>'''
section += ''.join(f'<option value="{E(topic)}">{E(topic)}</option>' for topic in topics)
section += '''<option value="legacy">Original course notes</option></select></div>
    <button id="notes-clear" type="button">Clear search and filters</button>
  </div>
  <div class="notes-actions"><button id="notes-expand" type="button">Expand matching notes</button><button id="notes-collapse" type="button">Collapse matching notes</button><a href="#git-notes">Original course notes ↓</a></div>
  <p id="notes-result-status" role="status" aria-live="polite" aria-atomic="true">26 lessons in 13 topics, plus your original notes.</p>
  <p id="notes-empty" hidden>No notes match. Try a shorter phrase or clear the filters.</p>
  <div id="notes-topics" class="notes-topics">'''
for topic_index, topic in enumerate(topics):
    section += f'<section class="notes-topic-group" data-topic="{E(topic)}" aria-labelledby="topic-{topic_index}"><h3 id="topic-{topic_index}">{E(topic)}</h3>'
    for index, item in enumerate(entries):
        if item['topic'] != topic: continue
        section += f'''<details class="lesson" id="lesson-{index}" data-topic="{E(topic)}"><summary><span>{E(item['title'])}</span><span class="lesson-label">Guide + practice</span></summary><div class="lesson-body"><p>{E(item['explanation'])}</p><div class="lesson-code-header"><span>{E(item['language'])}</span><button class="notes-copy" type="button" data-copy-target="example-{index}" aria-label="Copy code: {E(item['title'])}">Copy code</button></div><pre tabindex="0" aria-label="{E(item['language'])} example"><code id="example-{index}">{E(item['code'])}</code></pre><div class="lesson-mistake"><h4>Common mistakes</h4><p>{E(item['mistake'])}</p></div><div class="lesson-practice"><h4>Try it yourself</h4><p>{E(item['exercise'])}</p><details class="practice-answer"><summary>Show practice answer</summary><p>{E(item['answer'])}</p></details></div></div></details>'''
    section += '</section>'
section += '''</div><div class="notes-references"><h3>Official references</h3><p>Check official documentation when syntax or behavior is unfamiliar.</p><a href="https://git-scm.com/docs/git-restore" target="_blank" rel="noopener">Git restore</a> · <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/ul" target="_blank" rel="noopener">Modern HTML lists</a> · <a href="https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch" target="_blank" rel="noopener">Fetch API</a> · <a href="https://react.dev/learn" target="_blank" rel="noopener">React Learn</a> · <a href="https://nodejs.org/api/test.html" target="_blank" rel="noopener">Node test runner</a> · <a href="https://cheatsheetseries.owasp.org/" target="_blank" rel="noopener">OWASP security guidance</a></div>
  <p id="notes-copy-status" role="status" aria-live="polite"></p>
</section>
<div id="notes-copy-dialog" class="notes-copy-dialog" hidden role="dialog" aria-modal="true" aria-labelledby="notes-copy-title"><div class="notes-copy-dialog-inner"><h2 id="notes-copy-title">Copy this example</h2><p>Clipboard access is unavailable. Select the text below and use Ctrl+C or Command+C.</p><label for="notes-copy-text">Code to copy</label><textarea id="notes-copy-text" readonly spellcheck="false"></textarea><button id="notes-copy-close" type="button">Close copy dialog</button></div></div>
<!-- ENGINEERING LIBRARY END -->
'''

h = (root / 'index.html').read_text(encoding='utf-8-sig')
pattern = r'<!-- ENGINEERING LIBRARY START -->.*?<!-- ENGINEERING LIBRARY END -->\n?'
h, count = re.subn(pattern, lambda _: section, h, count=1, flags=re.S)
assert count == 1, 'Library markers missing'
(root / 'index.html').write_text(h, encoding='utf-8')
print(f'Rendered {len(entries)} lessons in {len(topics)} topics.')
