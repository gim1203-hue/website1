/* --------------------------------------------------------------------- */
/* Music Library — search bar + cascading Country -> Artist -> Albums    */
/* --------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function () {
  const library = document.querySelector('.music-library');
  if (!library) return;

  // ---------- Data ----------
  const MUSIC_DATA = {
    pakistan: {
      label: 'Pakistan',
      artists: [
        {
          id: 'bilal-saeed', name: 'Bilal Saeed', meta: 'Punjabi · 2011–present', wiki: 'Bilal_Saeed', language: 'punjabi',
          albums: [
            { title: 'Twelve', year: 2020, tracks: [
              { name: '12 Saal', videoId: 'luFGY9atHqo' },
              { name: 'Adhi Adhi Raat', videoId: 'l-0t8ug3tHM' }
            ] }
          ],
          singles: [ { name: 'No Make Up', videoId: 'dwiaTmTDHWM' } ]
        },
        {
          id: 'bohemia', name: 'Bohemia', meta: 'Punjabi / Urdu rap · 2002–present', wiki: 'Bohemia_(rapper)', language: 'urdu',
          albums: [
            { title: 'Pesa Nasha Pyar', year: 2006, tracks: [ { name: 'Kali Denali', videoId: '5GmdmzvbXg4' } ] },
            { title: 'Thousand Thoughts', year: 2010, tracks: [] },
            { title: 'Skull & Bones: The Final Chapter', year: 2016, tracks: [] }
          ],
          singles: []
        },
        {
          id: 'imran-khan', name: 'Imran Khan', meta: 'Punjabi / English · 2007–present', wiki: 'Imran_Khan_(singer)', language: 'punjabi',
          albums: [
            { title: 'Unforgettable', year: 2009, tracks: [
              { name: 'Amplifier', videoId: 'uuCFRaFWjwY' },
              { name: 'Bewafa', videoId: '' }
            ] }
          ],
          singles: []
        }
      ]
    },
    india: {
      label: 'India',
      artists: [
        {
          id: 'divine', name: 'DIVINE', meta: 'Hindi / English rap · 2013–present', wiki: 'Divine_(Indian_rapper)', language: 'english',
          albums: [ { title: 'Punya Paap', year: 2023, tracks: [] } ],
          singles: [ { name: 'Mirchi', videoId: 'E_MzBw8rzr0' }, { name: 'Kohinoor', videoId: '7dt9LvdSdIA' } ]
        },
        {
          id: 'sidhu-moose-wala', name: 'Sidhu Moose Wala', meta: 'Punjabi · 2016–2022', wiki: 'Sidhu_Moose_Wala', language: 'punjabi',
          albums: [
            { title: 'PBX 1', year: 2018, tracks: [] },
            { title: 'Moosetape', year: 2021, tracks: [ { name: 'Same Beef', videoId: 'Fc0TekLoyBc' } ] }
          ],
          singles: [ { name: 'So High', videoId: 'PtHboeWaqZE' } ]
        },
        {
          id: 'karan-aujla', name: 'Karan Aujla', meta: 'Punjabi · 2017–present', wiki: 'Karan_Aujla', language: 'punjabi',
          albums: [
            { title: 'Making Memories', year: 2021, tracks: [] },
            { title: 'P-Pop Culture', year: 2023, tracks: [] }
          ],
          singles: [ { name: 'Softly', videoId: 'cWMxCE2HTag' }, { name: 'Players', videoId: 'CeFQO9MQNqs' } ]
        }
      ]
    },
    america: {
      label: 'America',
      artists: [
        {
          id: 'eminem', name: 'Eminem', meta: 'English rap · 1996–present', wiki: 'Eminem', language: 'english',
          albums: [
            { title: 'The Slim Shady LP', year: 1999, tracks: [] },
            { title: 'The Marshall Mathers LP', year: 2000, tracks: [] },
            { title: 'Recovery', year: 2010, tracks: [ { name: 'Not Afraid', videoId: 'j5-yKhDd64s' } ] }
          ],
          singles: [ { name: 'Lose Yourself (8 Mile soundtrack)', videoId: 'yvIAi8WPW74' } ]
        },
        {
          id: 'lil-wayne', name: 'Lil Wayne', meta: 'English rap · 1995–present', wiki: 'Lil_Wayne', language: 'english',
          albums: [
            { title: 'Tha Carter', year: 2004, tracks: [] },
            { title: 'Tha Carter III', year: 2008, tracks: [
              { name: 'A Milli', videoId: 'qMk-P2qi3vs' },
              { name: 'Lollipop', videoId: 'GODqk-XLVjg' }
            ] },
            { title: 'Tha Carter V', year: 2018, tracks: [] }
          ],
          singles: []
        },
        {
          id: 'kendrick-lamar', name: 'Kendrick Lamar', meta: 'English rap · 2003–present', wiki: 'Kendrick_Lamar', language: 'english',
          albums: [
            { title: 'good kid, m.A.A.d city', year: 2012, tracks: [] },
            { title: 'To Pimp a Butterfly', year: 2015, tracks: [ { name: 'Alright', videoId: 'Z-48u_uWMHY' } ] },
            { title: 'DAMN.', year: 2017, tracks: [ { name: 'HUMBLE.', videoId: 'tvTRZJ-4EyI' } ] }
          ],
          singles: []
        }
      ]
    }
  };

  // ---------- Elements ----------
  const searchInput = library.querySelector('#music-search-input');
  const searchClear = library.querySelector('#music-search-clear');
  const searchResultsEl = library.querySelector('#search-results');

  const favoritesButton = library.querySelector('#favorites-button');
  const favoritesBadge = library.querySelector('#favorites-badge');
  const favoritesResultsEl = library.querySelector('#favorites-results');

  const countryDropdown = library.querySelector('#country-dropdown');
  const countryToggle = library.querySelector('#country-toggle');
  const countryToggleLabel = library.querySelector('#country-toggle-label');
  const countryList = library.querySelector('#country-list');

  const artistDropdown = library.querySelector('#artist-dropdown');
  const artistToggle = library.querySelector('#artist-toggle');
  const artistToggleLabel = library.querySelector('#artist-toggle-label');
  const artistList = library.querySelector('#artist-list');

  const languageFilters = library.querySelector('#language-filters');
  const languageInputs = Array.from(library.querySelectorAll('input[name="language"]'));

  const nowPlaying = library.querySelector('#now-playing');
  const videoFrame = library.querySelector('#video-frame');
  const videoPlaceholder = library.querySelector('#video-placeholder');
  const player = library.querySelector('#selected-music-video');
  const videoTitle = library.querySelector('#selected-video-title');
  const recentPlaysWrap = library.querySelector('#recent-plays');
  const recentPlaysList = library.querySelector('#recent-plays-list');

  const ytSearchInput = library.querySelector('#youtube-search-input');
  const ytSearchButton = library.querySelector('#youtube-search-button');
  const ytApiKeyButton = library.querySelector('#youtube-api-key-button');
  const ytResultsList = library.querySelector('#youtube-search-results');

  const albumsPanel = library.querySelector('#albums-panel');
  const albumsHeading = library.querySelector('#albums-heading');
  const albumList = library.querySelector('#album-list');
  const shuffleButton = library.querySelector('#shuffle-button');
  const emptyHint = library.querySelector('#empty-hint');

  const toast = document.querySelector('#music-toast');

  let currentCountryKey = null;
  let currentArtist = null;
  let playingEl = null;
  let toastTimer = null;

  // ---------- Small storage helpers ----------
  function loadSet(key) {
    try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch (error) { return new Set(); }
  }
  function saveSet(key, set) {
    try { localStorage.setItem(key, JSON.stringify(Array.from(set))); } catch (error) { /* ignore */ }
  }

  // ---------- Toast ----------
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 2600);
  }

  // ---------- Favorites (persisted, relocated into a small pill next to search) ----------
  const FAVORITES_KEY = 'musicLibraryFavorites';
  const favorites = loadSet(FAVORITES_KEY);

  function updateFavoritesButton() {
    favoritesBadge.textContent = String(favorites.size);
    favoritesButton.hidden = favorites.size === 0;
  }
  function isFavorite(artistId) { return favorites.has(artistId); }
  function toggleFavorite(artistId) {
    if (favorites.has(artistId)) favorites.delete(artistId); else favorites.add(artistId);
    saveSet(FAVORITES_KEY, favorites);
    updateFavoritesButton();
  }
  function findArtistById(artistId) {
    for (const countryKey of Object.keys(MUSIC_DATA)) {
      const found = MUSIC_DATA[countryKey].artists.find(function (a) { return a.id === artistId; });
      if (found) return { countryKey: countryKey, artist: found };
    }
    return null;
  }
  updateFavoritesButton();

  favoritesButton.addEventListener('click', function () {
    favoritesResultsEl.innerHTML = '';
    const entries = Array.from(favorites).map(findArtistById).filter(Boolean);
    if (!entries.length) {
      const empty = document.createElement('li');
      empty.className = 'search-results-empty';
      empty.textContent = 'No favorites yet — tap the heart next to an artist to add one.';
      favoritesResultsEl.appendChild(empty);
    } else {
      entries.forEach(function (entry) {
        const item = document.createElement('li');
        item.className = 'search-result';
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.innerHTML =
          '<span class="search-result-kind kind-artist">artist</span>' +
          '<span class="search-result-text">' + entry.artist.name + '<small>' + MUSIC_DATA[entry.countryKey].label + '</small></span>';
        function activate() {
          selectCountry(entry.countryKey);
          selectArtist(entry.artist);
          favoritesResultsEl.hidden = true;
        }
        item.addEventListener('click', activate);
        item.addEventListener('keydown', function (event) {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          activate();
        });
        favoritesResultsEl.appendChild(item);
      });
    }
    favoritesResultsEl.hidden = false;
    searchResultsEl.hidden = true;
  });
  document.addEventListener('click', function (event) {
    if (!favoritesButton.contains(event.target) && !favoritesResultsEl.contains(event.target)) {
      favoritesResultsEl.hidden = true;
    }
  });

  // ---------- Recently played (persisted, shown under the player once something has played) ----------
  const RECENT_KEY = 'musicLibraryRecent';
  let recent = [];
  try { recent = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch (error) { recent = []; }

  function renderRecent() {
    recentPlaysList.innerHTML = '';
    if (!recent.length) { recentPlaysWrap.hidden = true; return; }
    recentPlaysWrap.hidden = false;
    recent.forEach(function (item) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'recent-chip';
      chip.textContent = item.artist + ' — ' + item.track;
      chip.addEventListener('click', function () { playTrack(item.videoId, item.artist, item.track, null); });
      recentPlaysList.appendChild(chip);
    });
  }
  function addToRecent(entry) {
    recent = recent.filter(function (item) { return item.videoId !== entry.videoId; });
    recent.unshift(entry);
    recent = recent.slice(0, 6);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(recent)); } catch (error) { /* ignore */ }
    renderRecent();
  }
  renderRecent();

  // ---------- Playback ----------
  function playTrack(videoId, artistName, trackName, triggerEl) {
    if (!videoId) {
      showToast(artistName + ': add an official YouTube video ID for "' + trackName + '".');
      return;
    }
    player.src = 'https://www.youtube-nocookie.com/embed/' + videoId + '?autoplay=1&rel=0';
    player.hidden = false;
    videoPlaceholder.hidden = true;
    videoTitle.textContent = 'Now playing: ' + artistName + ' — ' + trackName;
    showToast('▶ ' + artistName + ' — ' + trackName);
    addToRecent({ artist: artistName, track: trackName, videoId: videoId });

    if (playingEl) playingEl.classList.remove('is-playing');
    if (triggerEl) { triggerEl.classList.add('is-playing'); playingEl = triggerEl; }

    nowPlaying.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------- YouTube search (live, via the YouTube Data API v3) & paste-a-link ----------
  // Playing a specific video (by ID or pasted link) never needs a key — only keyword
  // search against the Data API does. The key lives in localStorage so it can be
  // changed from the "API Key" button without touching this file.
  var YOUTUBE_API_KEY_STORAGE = 'ilistenYoutubeApiKey';
  var YOUTUBE_API_KEY_DEFAULT = 'AIzaSyDGxqXl-ka4sv36eeMnPjHgDX19nOoNKVo';

  function getYouTubeApiKey() {
    try { return localStorage.getItem(YOUTUBE_API_KEY_STORAGE) || YOUTUBE_API_KEY_DEFAULT; }
    catch (error) { return YOUTUBE_API_KEY_DEFAULT; }
  }
  function setYouTubeApiKey(key) {
    try {
      if (key) localStorage.setItem(YOUTUBE_API_KEY_STORAGE, key.trim());
      else localStorage.removeItem(YOUTUBE_API_KEY_STORAGE);
    } catch (error) { /* ignore */ }
  }

  function extractYouTubeVideoId(input) {
    var trimmed = (input || '').trim();
    if (/^[\w-]{11}$/.test(trimmed)) return trimmed; // bare video id
    try {
      var url = new URL(trimmed);
      if (!/youtu\.?be/.test(url.hostname)) return null;
      if (url.hostname.indexOf('youtu.be') !== -1) return url.pathname.slice(1, 12) || null;
      if (url.searchParams.get('v')) return url.searchParams.get('v');
      var embedMatch = url.pathname.match(/\/embed\/([\w-]{11})/);
      if (embedMatch) return embedMatch[1];
      var shortsMatch = url.pathname.match(/\/shorts\/([\w-]{11})/);
      if (shortsMatch) return shortsMatch[1];
    } catch (error) { /* not a URL, fall through */ }
    return null;
  }

  function renderYouTubeResults(items) {
    ytResultsList.innerHTML = '';
    if (!items || !items.length) {
      const empty = document.createElement('li');
      empty.className = 'search-results-empty';
      empty.textContent = 'No results — try a different search.';
      ytResultsList.appendChild(empty);
      ytResultsList.hidden = false;
      return;
    }
    items.forEach(function (item) {
      if (!item.id || !item.id.videoId) return;
      const videoId = item.id.videoId;
      const title = item.snippet.title;
      const channel = item.snippet.channelTitle;
      const thumb = item.snippet.thumbnails && (item.snippet.thumbnails.default || {}).url;

      const li = document.createElement('li');
      li.className = 'search-result yt-search-result';
      li.setAttribute('role', 'button');
      li.setAttribute('tabindex', '0');
      li.innerHTML =
        (thumb ? '<img class="yt-result-thumb" src="' + thumb + '" alt="" loading="lazy">' : '') +
        '<span class="search-result-text">' + title + '<small>' + channel + '</small></span>';

      function activate() {
        playTrack(videoId, channel, title, null);
        ytResultsList.hidden = true;
      }
      li.addEventListener('click', activate);
      li.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(); }
      });
      ytResultsList.appendChild(li);
    });
    ytResultsList.hidden = false;
  }

  function runYouTubeSearch() {
    const query = ytSearchInput.value.trim();
    if (!query) return;

    // A pasted link or bare video ID plays directly — no API call needed.
    const directId = extractYouTubeVideoId(query);
    if (directId) {
      playTrack(directId, 'YouTube', 'Pasted video', null);
      ytResultsList.hidden = true;
      return;
    }

    const apiKey = getYouTubeApiKey();
    if (!apiKey) {
      showToast('Add a YouTube API key first (🔑 API Key button).');
      return;
    }

    ytSearchButton.disabled = true;
    const originalLabel = ytSearchButton.textContent;
    ytSearchButton.textContent = 'Searching…';

    const endpoint = 'https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&q=' +
      encodeURIComponent(query) + '&key=' + encodeURIComponent(apiKey);

    // Guard against a hung connection — without this, a dropped/blocked network
    // request would leave the button reading "Searching…" forever.
    const controller = new AbortController();
    const timeoutId = setTimeout(function () { controller.abort(); }, 12000);

    fetch(endpoint, { signal: controller.signal })
      .then(function (response) {
        if (!response.ok) throw new Error('YouTube search failed (' + response.status + ')');
        return response.json();
      })
      .then(function (data) { renderYouTubeResults(data.items); })
      .catch(function (error) {
        if (error && error.name === 'AbortError') {
          showToast('YouTube search timed out — check your connection and try again.');
        } else {
          showToast('Could not search YouTube — check your API key or connection.');
        }
        console.error(error);
      })
      .finally(function () {
        clearTimeout(timeoutId);
        ytSearchButton.disabled = false;
        ytSearchButton.textContent = originalLabel;
      });
  }

  if (ytSearchButton) {
    ytSearchButton.addEventListener('click', runYouTubeSearch);
    ytSearchInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') { event.preventDefault(); runYouTubeSearch(); }
    });
    ytApiKeyButton.addEventListener('click', function () {
      const current = getYouTubeApiKey();
      const next = window.prompt('Paste your YouTube Data API v3 key (get one free from Google Cloud Console):', current || '');
      if (next !== null) {
        setYouTubeApiKey(next);
        showToast(next ? 'API key saved.' : 'API key cleared — using the built-in default.');
      }
    });
    document.addEventListener('click', function (event) {
      if (!ytResultsList.contains(event.target) && event.target !== ytSearchInput) {
        ytResultsList.hidden = true;
      }
    });
  }

  // ---------- Wikipedia photo lookup (kept for future use / album art fallback) ----------
  function fetchArtistPhoto(wikiPage) {
    return fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + wikiPage)
      .then(function (response) { return response.json(); })
      .then(function (data) { return data.thumbnail ? data.thumbnail.source : null; })
      .catch(function () { return null; });
  }

  // ---------- Generic accessible dropdown ----------
  function closeDropdown(toggleBtn, listEl) {
    listEl.hidden = true;
    toggleBtn.setAttribute('aria-expanded', 'false');
  }
  function openDropdown(toggleBtn, listEl) {
    listEl.hidden = false;
    toggleBtn.setAttribute('aria-expanded', 'true');
    const firstOption = listEl.querySelector('.dropdown-option');
    if (firstOption) firstOption.focus();
  }
  function toggleDropdown(toggleBtn, listEl) {
    if (listEl.hidden) openDropdown(toggleBtn, listEl); else closeDropdown(toggleBtn, listEl);
  }

  document.addEventListener('click', function (event) {
    if (!countryDropdown.contains(event.target)) closeDropdown(countryToggle, countryList);
    if (!artistDropdown.contains(event.target)) closeDropdown(artistToggle, artistList);
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeDropdown(countryToggle, countryList);
      closeDropdown(artistToggle, artistList);
    }
  });

  function buildOptionKeyboardNav(listEl, toggleBtn) {
    listEl.addEventListener('keydown', function (event) {
      const options = Array.from(listEl.querySelectorAll('.dropdown-option'));
      const index = options.indexOf(document.activeElement);
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        options[Math.min(index + 1, options.length - 1)].focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        options[Math.max(index - 1, 0)].focus();
      } else if (event.key === 'Escape') {
        closeDropdown(toggleBtn, listEl);
        toggleBtn.focus();
      }
    });
  }
  buildOptionKeyboardNav(countryList, countryToggle);
  buildOptionKeyboardNav(artistList, artistToggle);

  countryToggle.addEventListener('click', function () { toggleDropdown(countryToggle, countryList); });
  artistToggle.addEventListener('click', function () { toggleDropdown(artistToggle, artistList); });

  // ---------- Populate country dropdown ----------
  Object.keys(MUSIC_DATA).forEach(function (countryKey) {
    const country = MUSIC_DATA[countryKey];
    const option = document.createElement('li');
    option.className = 'dropdown-option';
    option.setAttribute('role', 'option');
    option.setAttribute('tabindex', '0');
    option.dataset.country = countryKey;
    option.innerHTML = '<span>' + country.label + '</span><small>' + country.artists.length + ' artists</small>';
    option.addEventListener('click', function () { selectCountry(countryKey); closeDropdown(countryToggle, countryList); });
    option.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectCountry(countryKey);
        closeDropdown(countryToggle, countryList);
        countryToggle.focus();
      }
    });
    countryList.appendChild(option);
  });

  function selectCountry(countryKey) {
    currentCountryKey = countryKey;
    currentArtist = null;
    const country = MUSIC_DATA[countryKey];

    countryToggleLabel.textContent = country.label;
    countryList.querySelectorAll('.dropdown-option').forEach(function (opt) {
      opt.setAttribute('aria-selected', String(opt.dataset.country === countryKey));
    });

    // Populate artist dropdown
    artistList.innerHTML = '';
    country.artists.forEach(function (artist) {
      const option = document.createElement('li');
      option.className = 'dropdown-option';
      option.setAttribute('role', 'option');
      option.setAttribute('tabindex', '0');
      option.dataset.artist = artist.id;
      option.dataset.language = artist.language;
      const releaseCount = artist.albums.length + (artist.singles.length ? 1 : 0);
      option.innerHTML =
        '<span class="dropdown-option-row">' +
          '<span>' + artist.name + '</span>' +
          '<button type="button" class="option-favorite-toggle' + (isFavorite(artist.id) ? ' is-favorite' : '') + '" aria-label="Add ' + artist.name + ' to favorites" aria-pressed="' + isFavorite(artist.id) + '">' + (isFavorite(artist.id) ? '&#9829;' : '&#9825;') + '</button>' +
        '</span>' +
        '<small>' + artist.meta + ' · ' + releaseCount + ' release' + (releaseCount === 1 ? '' : 's') + '</small>';

      option.addEventListener('click', function () { selectArtist(artist); closeDropdown(artistToggle, artistList); });
      option.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectArtist(artist);
          closeDropdown(artistToggle, artistList);
          artistToggle.focus();
        }
      });

      const heart = option.querySelector('.option-favorite-toggle');
      heart.addEventListener('click', function (event) {
        event.stopPropagation();
        toggleFavorite(artist.id);
        const nowFav = isFavorite(artist.id);
        heart.classList.toggle('is-favorite', nowFav);
        heart.setAttribute('aria-pressed', String(nowFav));
        heart.innerHTML = nowFav ? '&#9829;' : '&#9825;';
      });

      artistList.appendChild(option);
    });

    artistDropdown.hidden = false;
    artistToggleLabel.textContent = 'Select an artist';
    albumsPanel.hidden = true;
    // Language filter UI is intentionally not shown in this layout, but the
    // filtering logic stays active (all languages remain checked by default).
    applyLanguageFilter();
    emptyHint.textContent = 'Now pick an artist from ' + country.label + ' to see their albums.';
    emptyHint.hidden = false;
  }

  function applyLanguageFilter() {
    const checked = languageInputs.filter(function (input) { return input.checked; }).map(function (input) { return input.value; });
    artistList.querySelectorAll('.dropdown-option').forEach(function (option) {
      const show = checked.length === 0 || checked.includes(option.dataset.language);
      option.style.display = show ? '' : 'none';
    });
  }
  languageInputs.forEach(function (input) { input.addEventListener('change', applyLanguageFilter); });

  function selectArtist(artist) {
    currentArtist = artist;
    artistToggleLabel.textContent = artist.name;
    artistList.querySelectorAll('.dropdown-option').forEach(function (opt) {
      opt.setAttribute('aria-selected', String(opt.dataset.artist === artist.id));
    });
    renderAlbums(artist);
    emptyHint.hidden = true;
  }

  // ---------- Render albums for an artist ----------
  function renderAlbums(artist) {
    albumsHeading.textContent = 'Albums by ' + artist.name;
    albumList.innerHTML = '';

    const releases = artist.albums.slice();
    if (artist.singles.length) {
      releases.push({ title: 'Singles', year: null, tracks: artist.singles, isSingles: true });
    }

    releases.forEach(function (album) {
      const card = document.createElement('article');
      card.className = 'album-card';

      const summary = document.createElement('div');
      summary.className = 'album-summary';
      summary.setAttribute('role', 'button');
      summary.setAttribute('tabindex', '0');
      const trackLabel = album.tracks.length
        ? album.tracks.length + ' track' + (album.tracks.length === 1 ? '' : 's')
        : 'Explore on YouTube';
      summary.innerHTML =
        '<div class="album-title-group"><h4>' + album.title + '</h4>' +
        '<span>' + (album.year ? album.year + ' · ' : '') + trackLabel + '</span></div>' +
        '<span class="album-toggle-icon" aria-hidden="true">&#9662;</span>';

      const tracksWrap = document.createElement('ol');
      tracksWrap.className = 'album-tracks';

      if (album.tracks.length) {
        album.tracks.forEach(function (track) {
          const li = document.createElement('li');
          li.textContent = track.name;
          li.dataset.videoId = track.videoId || '';
          li.setAttribute('role', 'button');
          li.setAttribute('tabindex', '0');
          li.addEventListener('click', function () { playTrack(track.videoId, artist.name, track.name, li); });
          li.addEventListener('keydown', function (event) {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            playTrack(track.videoId, artist.name, track.name, li);
          });
          tracksWrap.appendChild(li);
        });
      } else {
        const note = document.createElement('p');
        note.className = 'album-tracks-empty';
        note.textContent = 'Track links for this release are coming soon — search "' + artist.name + ' ' + album.title + '" on YouTube in the meantime.';
        tracksWrap.appendChild(note);
      }

      function toggleCard() { card.classList.toggle('is-open'); }
      summary.addEventListener('click', toggleCard);
      summary.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        toggleCard();
      });

      card.appendChild(summary);
      card.appendChild(tracksWrap);
      albumList.appendChild(card);
    });

    albumsPanel.hidden = false;
  }

  // ---------- Shuffle (plays a random track from the currently open artist) ----------
  shuffleButton.addEventListener('click', function () {
    if (!currentArtist) return;
    const releases = currentArtist.albums.concat(currentArtist.singles.length ? [{ title: 'Singles', tracks: currentArtist.singles }] : []);
    const playable = [];
    releases.forEach(function (album, albumIndex) {
      album.tracks.forEach(function (track) {
        if (track.videoId) playable.push({ track: track, albumIndex: albumIndex });
      });
    });
    if (!playable.length) { showToast('No playable tracks yet for ' + currentArtist.name + '.'); return; }
    const pick = playable[Math.floor(Math.random() * playable.length)];
    const cards = Array.from(albumList.querySelectorAll('.album-card'));
    const card = cards[pick.albumIndex];
    if (card) {
      card.classList.add('is-open');
      const li = Array.from(card.querySelectorAll('.album-tracks li')).find(function (el) { return el.textContent === pick.track.name; });
      playTrack(pick.track.videoId, currentArtist.name, pick.track.name, li);
    }
  });

  // ---------- Global search across countries / artists / albums / songs ----------
  function buildSearchIndex() {
    const index = [];
    Object.keys(MUSIC_DATA).forEach(function (countryKey) {
      const country = MUSIC_DATA[countryKey];
      country.artists.forEach(function (artist) {
        index.push({ kind: 'artist', label: artist.name, sub: country.label, countryKey: countryKey, artist: artist });
        artist.albums.forEach(function (album) {
          index.push({ kind: 'album', label: album.title, sub: artist.name + ' · ' + country.label, countryKey: countryKey, artist: artist, album: album });
          album.tracks.forEach(function (track) {
            index.push({ kind: 'song', label: track.name, sub: artist.name + ' · ' + album.title, countryKey: countryKey, artist: artist, album: album, track: track });
          });
        });
        artist.singles.forEach(function (track) {
          index.push({ kind: 'song', label: track.name, sub: artist.name + ' · Single', countryKey: countryKey, artist: artist, track: track });
        });
      });
    });
    return index;
  }
  const searchIndex = buildSearchIndex();

  function highlight(text, query) {
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return text;
    return text.slice(0, idx) + '<mark>' + text.slice(idx, idx + query.length) + '</mark>' + text.slice(idx + query.length);
  }

  function renderSearchResults(query) {
    if (!query) { searchResultsEl.hidden = true; searchResultsEl.innerHTML = ''; return; }

    const matches = searchIndex.filter(function (entry) {
      return entry.label.toLowerCase().includes(query) || entry.sub.toLowerCase().includes(query);
    }).slice(0, 20);

    searchResultsEl.innerHTML = '';
    if (!matches.length) {
      const empty = document.createElement('li');
      empty.className = 'search-results-empty';
      empty.textContent = 'No countries, artists, albums or songs match "' + query + '".';
      searchResultsEl.appendChild(empty);
      searchResultsEl.hidden = false;
      return;
    }

    matches.forEach(function (entry) {
      const item = document.createElement('li');
      item.className = 'search-result';
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.innerHTML =
        '<span class="search-result-kind kind-' + entry.kind + '">' + entry.kind + '</span>' +
        '<span class="search-result-text">' + highlight(entry.label, query) + '<small>' + entry.sub + '</small></span>';

      function activate() {
        selectCountry(entry.countryKey);
        selectArtist(entry.artist);
        if (entry.kind === 'song') {
          if (entry.album) {
            const cards = Array.from(albumList.querySelectorAll('.album-card'));
            const cardIndex = entry.artist.albums.indexOf(entry.album);
            if (cards[cardIndex]) cards[cardIndex].classList.add('is-open');
          }
          const trackEl = Array.from(albumList.querySelectorAll('.album-tracks li')).find(function (li) { return li.textContent === entry.track.name; });
          playTrack(entry.track.videoId, entry.artist.name, entry.track.name, trackEl);
        }
        searchInput.value = '';
        searchClear.hidden = true;
        searchResultsEl.hidden = true;
      }

      item.addEventListener('click', activate);
      item.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        activate();
      });
      searchResultsEl.appendChild(item);
    });

    searchResultsEl.hidden = false;
  }

  let searchDebounce = null;
  searchInput.addEventListener('input', function () {
    searchClear.hidden = searchInput.value.length === 0;
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(function () { renderSearchResults(searchInput.value.trim().toLowerCase()); }, 120);
  });
  searchInput.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      searchInput.value = '';
      searchClear.hidden = true;
      searchResultsEl.hidden = true;
      searchInput.blur();
    }
  });
  searchClear.addEventListener('click', function () {
    searchInput.value = '';
    searchClear.hidden = true;
    searchResultsEl.hidden = true;
    searchInput.focus();
  });
  document.addEventListener('click', function (event) {
    if (!searchInput.contains(event.target) && !searchResultsEl.contains(event.target)) {
      searchResultsEl.hidden = true;
    }
  });

  // "/" focuses search from anywhere on the page
  document.addEventListener('keydown', function (event) {
    if (event.key !== '/') return;
    const active = document.activeElement;
    const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
    if (isTyping) return;
    event.preventDefault();
    searchInput.focus();
  });
});