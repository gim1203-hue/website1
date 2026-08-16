/* --------------------------------------------------------------------- */
/* Music Library — self-contained behaviour for music.html               */
/* Search · favorites · recently played · shuffle · keyboard shortcuts   */
/* --------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function () {
  const library = document.querySelector('.music-library');
  if (!library) return;

  // ---------- Elements ----------
  const countryTabs = Array.from(library.querySelectorAll('.country-tab'));
  const panels = Array.from(library.querySelectorAll('.country-panel'));
  const languageFilters = Array.from(library.querySelectorAll('input[name="language"]'));
  const player = library.querySelector('#selected-music-video');
  const videoTitle = library.querySelector('#selected-video-title');
  const searchInput = library.querySelector('#music-search-input');
  const searchClear = library.querySelector('#music-search-clear');
  const searchStatus = library.querySelector('#music-search-status');
  const countryTabsRow = library.querySelector('.country-tabs');
  const shuffleButton = library.querySelector('#shuffle-button');
  const resetButton = library.querySelector('#reset-filters');
  const favoritesCountEl = library.querySelector('#favorites-count');
  const noResultsEl = library.querySelector('#no-results');
  const recentWrap = library.querySelector('#recent-plays');
  const recentList = library.querySelector('#recent-plays-list');
  const toast = document.querySelector('#music-toast');

  const wikipediaPages = {
    'bilal-saeed': 'Bilal_Saeed',
    bohemia: 'Bohemia_(rapper)',
    'imran-khan': 'Imran_Khan_(singer)',
    divine: 'Divine_(Indian_rapper)',
    'sidhu-moose-wala': 'Sidhu_Moose_Wala',
    'karan-aujla': 'Karan_Aujla',
    eminem: 'Eminem',
    'lil-wayne': 'Lil_Wayne',
    'kendrick-lamar': 'Kendrick_Lamar'
  };

  let currentCountry = 'pakistan';
  let playingLi = null;
  let toastTimer = null;

  // ---------- Small storage helpers (favorites / recently played persist across visits) ----------
  function loadSet(key) {
    try {
      const raw = localStorage.getItem(key);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (error) {
      return new Set();
    }
  }
  function saveSet(key, set) {
    try { localStorage.setItem(key, JSON.stringify(Array.from(set))); } catch (error) { /* storage unavailable, ignore */ }
  }

  // ---------- Favorites ----------
  const FAVORITES_KEY = 'musicLibraryFavorites';
  const favorites = loadSet(FAVORITES_KEY);

  function updateFavoritesCount() {
    if (favoritesCountEl) favoritesCountEl.textContent = String(favorites.size);
  }

  function setFavoriteButtonState(button, isFavorite) {
    button.classList.toggle('is-favorite', isFavorite);
    button.setAttribute('aria-pressed', String(isFavorite));
    button.innerHTML = isFavorite ? '&#9829;' : '&#9825;';
  }

  library.querySelectorAll('.favorite-toggle').forEach(function (button) {
    const album = button.closest('.artist-album');
    const artistId = album.dataset.artist;
    setFavoriteButtonState(button, favorites.has(artistId));

    button.addEventListener('click', function (event) {
      event.stopPropagation();
      const isFavorite = favorites.has(artistId);
      if (isFavorite) favorites.delete(artistId); else favorites.add(artistId);
      setFavoriteButtonState(button, !isFavorite);
      button.classList.add('pulse');
      setTimeout(function () { button.classList.remove('pulse'); }, 350);
      saveSet(FAVORITES_KEY, favorites);
      updateFavoritesCount();
      if (currentCountry === 'favorites') applyFilters();
    });
  });
  updateFavoritesCount();

  // ---------- Recently played ----------
  const RECENT_KEY = 'musicLibraryRecent';
  let recent = [];
  try { recent = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch (error) { recent = []; }

  function renderRecent() {
    if (!recentList || !recentWrap) return;
    recentList.innerHTML = '';
    if (!recent.length) { recentWrap.hidden = true; return; }
    recentWrap.hidden = false;
    recent.forEach(function (item) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'recent-chip';
      chip.textContent = item.artist + ' — ' + item.song;
      chip.addEventListener('click', function () { playSong(item.videoId, item.artist, item.song); });
      recentList.appendChild(chip);
    });
  }

  function addToRecent(item) {
    recent = recent.filter(function (entry) { return entry.videoId !== item.videoId; });
    recent.unshift(item);
    recent = recent.slice(0, 6);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(recent)); } catch (error) { /* ignore */ }
    renderRecent();
  }
  renderRecent();

  // ---------- Toast ----------
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 2600);
  }

  // ---------- Playback ----------
  function playSong(videoId, artistName, songName) {
    if (!videoId) {
      showToast(artistName + ': add an official YouTube video ID for "' + songName + '".');
      return;
    }
    player.src = 'https://www.youtube-nocookie.com/embed/' + videoId + '?autoplay=1&rel=0';
    videoTitle.textContent = 'Now playing: ' + artistName + ' — ' + songName;
    showToast('▶ ' + artistName + ' — ' + songName);
    addToRecent({ artist: artistName, song: songName, videoId: videoId });
    library.querySelector('.selected-video').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleSongActivate(li) {
    const album = li.closest('.artist-album');
    const artist = album.querySelector('h4').textContent;
    const songName = li.dataset.originalText || li.textContent;
    playSong(li.dataset.videoId, artist, songName);
    if (playingLi) playingLi.classList.remove('is-playing');
    li.classList.add('is-playing');
    playingLi = li;
  }

  // ---------- Artist photos (Wikipedia) ----------
  library.querySelectorAll('.artist-album').forEach(function (album) {
    const image = album.querySelector('.artist-photo');
    const page = wikipediaPages[album.dataset.artist];
    if (page && image) {
      fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + page)
        .then(function (response) { return response.json(); })
        .then(function (artist) {
          if (artist.thumbnail) image.src = artist.thumbnail.source;
        })
        .catch(function () { /* The layout still works if a picture cannot load. */ });
    }
  });

  // ---------- Play buttons ----------
  library.querySelectorAll('.play-artist-video').forEach(function (button) {
    button.addEventListener('click', function () {
      const album = button.closest('.artist-album');
      const songs = Array.from(album.querySelectorAll('.song-list li'));
      const primarySong = songs.find(function (li) { return li.dataset.videoId === album.dataset.videoId; }) || songs[0];
      if (primarySong) {
        handleSongActivate(primarySong);
      } else {
        playSong(album.dataset.videoId, album.querySelector('h4').textContent, 'Top pick');
      }
    });
  });

  // ---------- Song list clicks (event delegation, keyboard-accessible) ----------
  library.querySelectorAll('.song-list').forEach(function (list) {
    list.addEventListener('click', function (event) {
      const li = event.target.closest('li');
      if (li) handleSongActivate(li);
    });
    list.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const li = event.target.closest('li');
      if (!li) return;
      event.preventDefault();
      handleSongActivate(li);
    });
  });

  // ---------- Country tabs ----------
  function changeCountry(country) {
    currentCountry = country;
    countryTabs.forEach(function (tab) {
      const selected = tab.dataset.country === country;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-selected', String(selected));
    });
    applyFilters();
  }

  countryTabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () { changeCountry(tab.dataset.country); });
    tab.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      const delta = event.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = (index + delta + countryTabs.length) % countryTabs.length;
      countryTabs[nextIndex].focus();
      changeCountry(countryTabs[nextIndex].dataset.country);
    });
  });

  // ---------- Search highlighting ----------
  function setHighlighted(element, query) {
    if (!element.dataset.originalText) element.dataset.originalText = element.textContent;
    const original = element.dataset.originalText;
    if (!query) { element.textContent = original; return; }
    const index = original.toLowerCase().indexOf(query);
    if (index === -1) { element.textContent = original; return; }
    element.innerHTML = original.slice(0, index) + '<mark>' + original.slice(index, index + query.length) + '</mark>' + original.slice(index + query.length);
  }

  // ---------- Filters (language + country/favorites + search combined) ----------
  function getAllAlbums() { return Array.from(library.querySelectorAll('.artist-album')); }

  function applyFilters() {
    const selectedLanguages = languageFilters.filter(function (input) { return input.checked; }).map(function (input) { return input.value; });
    const query = searchInput.value.trim().toLowerCase();
    const favoritesOnly = currentCountry === 'favorites';
    const showAllPanels = favoritesOnly || Boolean(query);

    if (countryTabsRow) countryTabsRow.classList.toggle('is-searching', Boolean(query) && !favoritesOnly);

    let visibleCount = 0;
    let songCount = 0;

    getAllAlbums().forEach(function (album) {
      const panel = album.closest('.country-panel');
      const inActivePanel = showAllPanels || panel.id === currentCountry + '-panel';
      const matchesLanguage = selectedLanguages.length === 0 || selectedLanguages.includes(album.dataset.language);
      const matchesFavorite = !favoritesOnly || favorites.has(album.dataset.artist);

      const nameEl = album.querySelector('h4');
      const songEls = Array.from(album.querySelectorAll('.song-list li'));
      const nameText = (nameEl.dataset.originalText || nameEl.textContent).toLowerCase();
      const nameMatches = !query || nameText.includes(query);
      const matchingSongEls = songEls.filter(function (li) {
        const text = (li.dataset.originalText || li.textContent).toLowerCase();
        return text.includes(query);
      });
      const matchesSearch = !query || nameMatches || matchingSongEls.length > 0;

      const show = inActivePanel && matchesLanguage && matchesFavorite && matchesSearch;
      album.hidden = !show;

      setHighlighted(nameEl, query);
      songEls.forEach(function (li) { setHighlighted(li, query); });

      if (show) {
        visibleCount += 1;
        songCount += songEls.length;
      }
    });

    if (showAllPanels) {
      panels.forEach(function (panel) {
        panel.hidden = !panel.querySelector('.artist-album:not([hidden])');
      });
    } else {
      panels.forEach(function (panel) { panel.hidden = panel.id !== currentCountry + '-panel'; });
    }

    updateStatus(visibleCount, songCount, query, favoritesOnly);

    const anyFilterActive = Boolean(query) || favoritesOnly || selectedLanguages.length !== languageFilters.length;
    if (resetButton) resetButton.hidden = !anyFilterActive;
  }

  function updateStatus(visibleCount, songCount, query, favoritesOnly) {
    if (noResultsEl) noResultsEl.hidden = visibleCount !== 0;
    if (!searchStatus) return;

    if (query) {
      searchStatus.textContent = visibleCount
        ? visibleCount + ' artist' + (visibleCount === 1 ? '' : 's') + ' · ' + songCount + ' song' + (songCount === 1 ? '' : 's') + ' match "' + searchInput.value.trim() + '" across all countries'
        : 'No matches for "' + searchInput.value.trim() + '"';
    } else if (favoritesOnly) {
      searchStatus.textContent = visibleCount
        ? visibleCount + ' favorite artist' + (visibleCount === 1 ? '' : 's')
        : 'No favorites yet — tap the heart on an artist to add one.';
    } else {
      searchStatus.textContent = visibleCount + ' artist' + (visibleCount === 1 ? '' : 's') + ' · ' + songCount + ' song' + (songCount === 1 ? '' : 's');
    }
  }

  languageFilters.forEach(function (filter) { filter.addEventListener('change', applyFilters); });

  // ---------- Search input wiring ----------
  let searchDebounce = null;
  searchInput.addEventListener('input', function () {
    if (searchClear) searchClear.hidden = searchInput.value.length === 0;
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(applyFilters, 120);
  });
  searchInput.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    searchInput.value = '';
    if (searchClear) searchClear.hidden = true;
    applyFilters();
    searchInput.blur();
  });
  if (searchClear) {
    searchClear.addEventListener('click', function () {
      searchInput.value = '';
      searchClear.hidden = true;
      applyFilters();
      searchInput.focus();
    });
  }

  // "/" focuses search from anywhere on the page, like most modern apps
  document.addEventListener('keydown', function (event) {
    if (event.key !== '/') return;
    const active = document.activeElement;
    const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
    if (isTyping) return;
    event.preventDefault();
    searchInput.focus();
  });

  // ---------- Reset ----------
  if (resetButton) {
    resetButton.addEventListener('click', function () {
      searchInput.value = '';
      if (searchClear) searchClear.hidden = true;
      languageFilters.forEach(function (input) { input.checked = true; });
      changeCountry('pakistan');
    });
  }

  // ---------- Shuffle ----------
  if (shuffleButton) {
    shuffleButton.addEventListener('click', function () {
      const candidates = [];
      getAllAlbums().forEach(function (album) {
        if (album.hidden) return;
        album.querySelectorAll('.song-list li').forEach(function (li) {
          if (li.dataset.videoId) candidates.push(li);
        });
      });
      if (!candidates.length) { showToast('No playable songs match your current filters.'); return; }
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      handleSongActivate(pick);
    });
  }

  // ---------- Init ----------
  changeCountry('pakistan');
});

