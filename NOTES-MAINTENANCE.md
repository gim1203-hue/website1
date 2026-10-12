# Engineering notes maintenance

The existing course notes and design are preserved. The expanded library contains 26 lessons across 13 topics. Search includes original accordion notes. Native disclosures remain readable without JavaScript; code copying includes a manual fallback.

Backups taken before this expansion: `backups/20261009-202826/`. Backups and local dependencies are excluded from Git.

## Edit and update all local copies

1. Edit lesson content in `notes-content.json`.
2. Run `python tools/build_notes.py` to render the static library into `index.html`.
3. Run `python tools/sync_copies.py` after content, CSS, or JavaScript changes.
4. Run `npm ci`, `npm test`, and `npm run check`.

The synchronized pages are `index.html`, `website1copy/index1.html`, and `website1copy/updates/index.html`. Nested pages use adjusted styles, scripts, and image paths.

## Validation and release

Tests cover all topic filters and copy buttons, search and clear states, expand/collapse, original accordions, clipboard-denial focus management, notes CRUD, calendar, certificate zoom, weather, Quran, radio, and both video widgets. External responses, speech, and media playback are mocked in automated tests. Real browser checks verify desktop/mobile presentation and native keyboard disclosures. External service availability, actual playback, production headers, and hosting configuration require live release checks.

Do not publish until the site owner approves the reviewed changes. No deployment was performed during this expansion.

Four heading groups use the embedded convenience code 1233 in section-locks.js. Click an open heading to close and relock it. Every page load starts locked. This is a visual convenience lock, not authentication; the static source and code remain inspectable.
