/* Cross-platform alternative to the Python sync helper. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const assets = ['styles.css', 'script.js', 'notes.js', 'section-locks.js', 'study-tools.js', 'learning-extras.js'];
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/^\uFEFF/, '');
for (const asset of assets) {
  const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, asset))).digest('hex').slice(0, 12);
  const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  html = html.replace(new RegExp(`((?:href|src)=")${escaped}(?:\\?[^"\\s]*)?"`, 'g'), `$1${asset}?v=${hash}"`);
}
fs.writeFileSync(path.join(root, 'index.html'), html);
for (const [directory, page, css, js, prefix] of [
  ['website1copy', 'index1.html', 'styles.css', 'script.js', '../'],
  ['website1copy/updates', 'index.html', 'style.css', 'java.js', '../../']
]) {
  const copy = html.replaceAll('href="styles.css?', `href="${css}?`).replaceAll('src="script.js?', `src="${js}?`)
    .replaceAll('data-full-src="images/', `data-full-src="${prefix}images/`).replaceAll('<img src="images/', `<img src="${prefix}images/`)
    .replaceAll('src="website-preview.png"', `src="${prefix}website-preview.png"`);
  fs.writeFileSync(path.join(root, directory, page), copy);
  for (const asset of assets) fs.copyFileSync(path.join(root, asset), path.join(root, directory, asset === 'styles.css' ? css : asset === 'script.js' ? js : asset));
  console.log(`Updated ${directory}/${page}`);
}
