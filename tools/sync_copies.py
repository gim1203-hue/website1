from pathlib import Path
root = Path(__file__).resolve().parents[1]
html = (root / 'index.html').read_text(encoding='utf-8-sig')
for directory, page, style, script, prefix in [
    ('website1copy', 'index1.html', 'styles.css', 'script.js', '../images/'),
    ('website1copy/updates', 'index.html', 'style.css', 'java.js', '../../images/')
]:
    target = root / directory
    content = html.replace('href="styles.css"', f'href="{style}"').replace('src="script.js"', f'src="{script}"')
    content = content.replace('data-full-src="images/', f'data-full-src="{prefix}').replace('<img src="images/', f'<img src="{prefix}')
    (target / page).write_text(content, encoding='utf-8')
    for source, destination in [('styles.css', style), ('script.js', script), ('notes.js', 'notes.js'), ('section-locks.js', 'section-locks.js')]:
        (target / destination).write_bytes((root / source).read_bytes())
    print(f'Updated {directory}/{page}')
