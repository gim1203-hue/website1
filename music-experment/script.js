/* ---------- I-LISTEN (YouTube widget) ---------- */
(function(){
  const LIBRARY_CAP = 1000;

  // Kept in JS variables rather than localStorage: browser storage APIs are
  // unavailable in this artifact environment, so state only lives for the
  // current session/page load. Use Export/Import on the Library panel to
  // carry it between sessions.
  const state = {
    apiKey: "",
    library: [], // newest first: {id, title, channelTitle, channelId, thumb, addedAt}
    currentVideo: null, // {id, title, channelTitle, channelId} — whatever is loaded in the player right now
  };

  const suggestCache = new Map();      // query -> items[]
  const uploadsPlaylistCache = new Map(); // channelId -> uploads playlist id (or null)
  let suggestReqId = 0;

  const flyoutState = { playlistId: null, channelId: null, nextPageToken: null, loadedIds: new Set() };

  const yEls = {
    wrap: document.getElementById('youtube-searchbar-wrap'),
    searchInput: document.getElementById('youtube-search-input'),
    searchBtn: document.getElementById('youtube-search-btn'),
    dropdown: document.getElementById('youtube-search-results'),
    apiKeyBtn: document.getElementById('youtube-api-key-btn'),
    apiKeyPanel: document.getElementById('youtube-api-key-panel'),
    apiKeyInput: document.getElementById('youtube-api-key-input'),
    apiKeySave: document.getElementById('youtube-api-key-save'),
    apiKeyClear: document.getElementById('youtube-api-key-clear'),
    apiKeyStatus: document.getElementById('youtube-api-key-status'),
    resultsGrid: document.getElementById('youtube-results'),
    screen: document.getElementById('youtube-screen'),
    screenHint: document.getElementById('youtube-screen-hint'),
    flyout: document.getElementById('youtube-related-panel'),
    flyoutThumb: document.getElementById('yt-flyout-thumb'),
    flyoutTitle: document.getElementById('yt-flyout-title'),
    flyoutSubtitle: document.getElementById('yt-flyout-subtitle'),
    flyoutClose: document.getElementById('yt-flyout-close'),
    flyoutBody: document.getElementById('yt-flyout-body'),
    flyoutMore: document.getElementById('yt-flyout-more'),
    libraryBtn: document.getElementById('youtube-library-btn'),
    libraryBackdrop: document.getElementById('libraryBackdrop'),
    libraryList: document.getElementById('library-list'),
    libraryCountLabel: document.getElementById('library-count-label'),
    libraryExportBtn: document.getElementById('library-export-btn'),
    libraryImportBtn: document.getElementById('library-import-btn'),
    libraryImportInput: document.getElementById('library-import-input'),
    libraryClearBtn: document.getElementById('library-clear-btn'),
    libraryCloseBtn: document.getElementById('library-close-btn'),
  };

  const thumbFor = (id) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

  function debounce(fn, wait){
    let t;
    return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn(...args), wait); };
  }

  function extractVideoId(raw){
    const input = raw.trim();
    if(!input) return null;
    if(/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
    try{
      const url = new URL(input);
      const host = url.hostname.replace(/^www\./,'');
      if(host==='youtu.be'){
        return url.pathname.slice(1).split('/')[0] || null;
      }
      if(host==='youtube.com' || host==='m.youtube.com' || host==='music.youtube.com'){
        if(url.searchParams.get('v')) return url.searchParams.get('v');
        const parts = url.pathname.split('/').filter(Boolean);
        if(parts[0]==='embed' || parts[0]==='shorts' || parts[0]==='live'){
          return parts[1] || null;
        }
      }
    } catch(e){ /* not a valid URL, and not a bare 11-char id either */ }
    return null;
  }

  /* ---------- API key panel ---------- */
  function setKeyStatus(msg, kind){
    yEls.apiKeyStatus.textContent = msg || '';
    yEls.apiKeyStatus.className = kind || '';
  }
  yEls.apiKeyBtn.addEventListener('click', ()=>{
    yEls.apiKeyPanel.hidden = !yEls.apiKeyPanel.hidden;
    if(!yEls.apiKeyPanel.hidden){
      yEls.apiKeyInput.value = state.apiKey;
      yEls.apiKeyInput.focus();
    }
  });
  yEls.apiKeySave.addEventListener('click', ()=>{
    const key = yEls.apiKeyInput.value.trim();
    if(!key){ setKeyStatus('Enter a key first.', 'err'); return; }
    state.apiKey = key;
    suggestCache.clear();
    setKeyStatus('Key saved for this session.', 'ok');
  });
  yEls.apiKeyClear.addEventListener('click', ()=>{
    state.apiKey = '';
    yEls.apiKeyInput.value = '';
    setKeyStatus('Key cleared.', 'ok');
  });
  yEls.apiKeyInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter') yEls.apiKeySave.click(); });

  /* ---------- Player + Library ---------- */
  function addToLibrary(entry){
    state.library = state.library.filter(e => e.id !== entry.id);
    state.library.unshift(entry);
    if(state.library.length > LIBRARY_CAP){
      state.library.length = LIBRARY_CAP;
    }
    renderLibraryButton();
    if(!yEls.libraryBackdrop.classList.contains('open')) return;
    renderLibraryList();
  }

  function renderLibraryButton(){
    yEls.libraryBtn.textContent = `📁 Library (${state.library.length})`;
  }

  function renderLibraryList(){
    yEls.libraryCountLabel.textContent = `${state.library.length} / ${LIBRARY_CAP} saved`;
    yEls.libraryList.innerHTML = '';
    state.library.forEach(item=>{
      const row = document.createElement('div');
      row.className = 'library-item';
      row.innerHTML = `
        <img src="${item.thumb}" alt="" loading="lazy">
        <div class="li-meta">
          <div class="li-title">${escapeHtml(item.title)}</div>
          <div class="li-sub">${escapeHtml(item.channelTitle || '')}</div>
        </div>
        <button class="li-remove" type="button" title="Remove">✕</button>`;
      row.querySelector('.li-remove').addEventListener('click', (e)=>{
        e.stopPropagation();
        state.library = state.library.filter(e2 => e2.id !== item.id);
        renderLibraryButton();
        renderLibraryList();
      });
      row.addEventListener('click', ()=>{
        loadVideo(item.id, item.title, item.channelTitle, item.channelId);
        closeLibrary();
      });
      yEls.libraryList.appendChild(row);
    });
  }

  function openLibrary(){ yEls.libraryBackdrop.classList.add('open'); renderLibraryList(); }
  function closeLibrary(){ yEls.libraryBackdrop.classList.remove('open'); }
  yEls.libraryBtn.addEventListener('click', openLibrary);
  yEls.libraryCloseBtn.addEventListener('click', closeLibrary);
  yEls.libraryBackdrop.addEventListener('click', (e)=>{ if(e.target===yEls.libraryBackdrop) closeLibrary(); });
  yEls.libraryClearBtn.addEventListener('click', ()=>{
    if(state.library.length && !confirm('Clear all songs from your Library? This cannot be undone.')) return;
    state.library = [];
    renderLibraryButton();
    renderLibraryList();
  });
  yEls.libraryExportBtn.addEventListener('click', ()=>{
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), items: state.library }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'i-listen-library.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
  yEls.libraryImportBtn.addEventListener('click', ()=> yEls.libraryImportInput.click());
  yEls.libraryImportInput.addEventListener('change', ()=>{
    const file = yEls.libraryImportInput.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      try{
        const data = JSON.parse(reader.result);
        const items = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : null);
        if(!items) throw new Error('Unrecognized file format.');
        const cleaned = items.filter(it => it && it.id && it.title).slice(0, LIBRARY_CAP);
        if(!confirm(`Import ${cleaned.length} song(s)? This replaces your current Library.`)) return;
        state.library = cleaned;
        renderLibraryButton();
        renderLibraryList();
      } catch(err){
        alert("Couldn't import that file: " + err.message);
      } finally {
        yEls.libraryImportInput.value = '';
      }
    };
    reader.readAsText(file);
  });

  function escapeHtml(s){ return (s||'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  /* ---------- YouTube IFrame Player API ----------
     Using the official JS API (instead of hand-building an <iframe src=...>
     embed URL) so YouTube's own bootstrap handles the origin/postMessage
     handshake — a raw src= embed was failing with "Error 153: Video player
     configuration error" in this environment. */
  let ytApiInjected = false;
  let ytApiReady = false;
  let ytPlayer = null;
  let pendingVideoId = null;

  function ensureYTApi(){
    if(ytApiInjected) return;
    ytApiInjected = true;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }
  window.onYouTubeIframeAPIReady = function(){
    ytApiReady = true;
    if(pendingVideoId){
      const id = pendingVideoId;
      pendingVideoId = null;
      mountPlayer(id);
    }
  };

  const PLAYER_ERROR_MESSAGES = {
    2: "That video ID doesn't look valid.",
    5: "This video can't be played in an embedded player right now.",
    100: 'Video not found — it may have been removed or made private.',
    101: 'The video owner has disabled playback outside YouTube.',
    150: 'The video owner has disabled playback outside YouTube.',
  };

  function mountPlayer(id){
    if(!ytApiReady){ pendingVideoId = id; ensureYTApi(); return; }
    const oldHolder = document.getElementById('youtube-player-holder');
    if(oldHolder) oldHolder.remove();
    if(ytPlayer){ try{ ytPlayer.destroy(); }catch(e){ /* already gone */ } ytPlayer = null; }
    const holder = document.createElement('div');
    holder.id = 'youtube-player-holder';
    yEls.screen.insertBefore(holder, yEls.screenHint);
    ytPlayer = new YT.Player('youtube-player-holder', {
      width: '100%',
      height: '100%',
      videoId: id,
      playerVars: { autoplay: 1, rel: 0, playsinline: 1 },
      events: {
        onReady: (e)=>{ try{ e.target.playVideo(); }catch(err){ /* ignore */ } },
        onError: (e)=>{
          yEls.screenHint.textContent = PLAYER_ERROR_MESSAGES[e.data] || `Playback error (code ${e.data}).`;
          yEls.screen.classList.remove('has-video');
        }
      }
    });
  }

  function loadVideo(id, title, channelTitle, channelId){
    if(!id) return;
    ensureYTApi();
    mountPlayer(id);
    yEls.screen.classList.add('has-video');
    yEls.screenHint.textContent = title ? `Now playing: ${title}` : 'Now playing…';
    closeDropdown();

    const entry = { id, title: title || `Video (${id})`, channelTitle: channelTitle || '', channelId: channelId || null, thumb: thumbFor(id), addedAt: Date.now() };
    addToLibrary(entry);
    state.currentVideo = entry;

    // If we don't have title/channel info (e.g. a pasted link) but do have a
    // key, fetch it so the Library entry and "more from this channel" flyout
    // are useful. Cheap call: 1 quota unit.
    if((!title || !channelId) && state.apiKey){
      fetchVideoSnippet(id).then(snip=>{
        if(!snip) return;
        const fixed = { id, title: snip.title, channelTitle: snip.channelTitle, channelId: snip.channelId, thumb: thumbFor(id), addedAt: entry.addedAt };
        addToLibrary(fixed);
        if(state.currentVideo && state.currentVideo.id === id) state.currentVideo = fixed;
        yEls.screenHint.textContent = `Now playing: ${snip.title}`;
      }).catch(()=>{ /* ignore — direct playback still works without metadata */ });
    }
  }

  async function fetchVideoSnippet(id){
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part','snippet');
    url.searchParams.set('id', id);
    url.searchParams.set('key', state.apiKey);
    const res = await fetch(url.toString());
    const data = await res.json();
    if(!res.ok || !data.items || !data.items.length) return null;
    const s = data.items[0].snippet;
    return { title: s.title, channelTitle: s.channelTitle, channelId: s.channelId };
  }

  /* ---------- Autocomplete dropdown ---------- */
  function openDropdown(){ yEls.dropdown.classList.add('open'); }
  function closeDropdown(){ yEls.dropdown.classList.remove('open'); yEls.dropdown.innerHTML = ''; }

  function renderDropdownNote(text){
    yEls.dropdown.innerHTML = `<li class="yt-res-note">${escapeHtml(text)}</li>`;
    openDropdown();
  }

  function renderSuggestions(items){
    yEls.dropdown.innerHTML = '';
    if(!items.length){
      renderDropdownNote('No matches found.');
      return;
    }
    items.forEach(item=>{
      const isChannel = item.id.kind === 'youtube#channel';
      const snip = item.snippet;
      const thumbUrl = (snip.thumbnails && (snip.thumbnails.default || snip.thumbnails.medium) || {}).url || '';
      const li = document.createElement('li');
      if(isChannel) li.classList.add('yt-channel-suggest');
      li.innerHTML = `
        ${thumbUrl ? `<img src="${thumbUrl}" alt="" loading="lazy">` : '<span class="yt-type-badge">' + (isChannel?'Artist':'Video') + '</span>'}
        <div class="yt-res-text">
          <div class="yt-res-title">${escapeHtml(snip.title)}</div>
          <div class="yt-res-channel">${isChannel ? 'Artist / Channel' : escapeHtml(snip.channelTitle||'')}</div>
        </div>
        ${thumbUrl ? `<span class="yt-type-badge">${isChannel?'Artist':'Video'}</span>` : ''}`;
      li.addEventListener('click', ()=> selectSuggestion(item, isChannel));
      yEls.dropdown.appendChild(li);
    });
    openDropdown();
  }

  async function fetchSuggestions(query){
    const key = query.toLowerCase();
    if(suggestCache.has(key)){
      renderSuggestions(suggestCache.get(key));
      return;
    }
    if(!state.apiKey){
      renderDropdownNote('🔑 Add an API key above to see live suggestions.');
      return;
    }
    const reqId = ++suggestReqId;
    renderDropdownNote('Searching…');
    try{
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.searchParams.set('part','snippet');
      url.searchParams.set('type','video,channel');
      url.searchParams.set('maxResults','8');
      url.searchParams.set('q', query);
      url.searchParams.set('key', state.apiKey);
      const res = await fetch(url.toString());
      const data = await res.json();
      if(reqId !== suggestReqId) return; // stale response, a newer keystroke superseded it
      if(!res.ok){
        renderDropdownNote((data.error && data.error.message) || 'Search failed.');
        return;
      }
      const items = data.items || [];
      suggestCache.set(key, items);
      renderSuggestions(items);
    } catch(err){
      if(reqId !== suggestReqId) return;
      renderDropdownNote("Couldn't reach YouTube: " + err.message);
    }
  }

  const debouncedSuggest = debounce((query)=>{
    if(query.length < 2){ closeDropdown(); return; }
    fetchSuggestions(query);
  }, 450);

  yEls.searchInput.addEventListener('input', ()=> debouncedSuggest(yEls.searchInput.value.trim()));
  yEls.searchInput.addEventListener('focus', ()=>{ if(yEls.dropdown.children.length) openDropdown(); });

  function selectSuggestion(item, isChannel){
    if(isChannel){
      const channelId = item.id.channelId;
      openArtistFlyout(channelId, item.snippet.title, item.snippet.thumbnails);
    } else {
      const videoId = item.id.videoId;
      const snip = item.snippet;
      yEls.resultsGrid.innerHTML = '';
      loadVideo(videoId, snip.title, snip.channelTitle, snip.channelId);
      openSongFlyout(snip.channelId, snip.channelTitle, videoId, snip.title, snip.thumbnails);
    }
    closeDropdown();
  }

  /* ---------- "Related" flyout: artist's uploads, or more from a song's channel ---------- */
  function flyoutThumbUrl(thumbnails){
    return (thumbnails && (thumbnails.medium || thumbnails.default) || {}).url || '';
  }

  function openArtistFlyout(channelId, channelTitle, thumbnails){
    yEls.flyoutThumb.src = flyoutThumbUrl(thumbnails);
    yEls.flyoutTitle.textContent = channelTitle;
    yEls.flyoutSubtitle.textContent = `Videos by ${channelTitle}`;
    openFlyout(channelId);
  }

  function openSongFlyout(channelId, channelTitle, videoId, videoTitle, thumbnails){
    if(!channelId) return;
    yEls.flyoutThumb.src = thumbFor(videoId);
    yEls.flyoutTitle.textContent = videoTitle;
    yEls.flyoutSubtitle.textContent = `More from ${channelTitle || 'this channel'}`;
    openFlyout(channelId);
  }

  async function openFlyout(channelId){
    if(!state.apiKey){
      yEls.flyoutBody.innerHTML = `<div class="status-msg">Add an API key to browse by artist/channel.</div>`;
      yEls.flyout.hidden = false;
      yEls.flyoutMore.hidden = true;
      return;
    }
    flyoutState.channelId = channelId;
    flyoutState.playlistId = null;
    flyoutState.nextPageToken = null;
    flyoutState.loadedIds = new Set();
    if(state.currentVideo) flyoutState.loadedIds.add(state.currentVideo.id); // avoid listing it twice
    yEls.flyoutBody.innerHTML = '';
    yEls.flyoutMore.hidden = true;
    yEls.flyout.hidden = false;
    const nowCard = buildNowPlayingCard();
    if(nowCard){
      const pinnedGrid = document.createElement('div');
      pinnedGrid.className = 'youtube-results';
      pinnedGrid.appendChild(nowCard);
      yEls.flyoutBody.appendChild(pinnedGrid);
    }
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'status-msg';
    loadingMsg.textContent = 'Loading…';
    yEls.flyoutBody.appendChild(loadingMsg);
    try{
      const playlistId = await getUploadsPlaylistId(channelId);
      loadingMsg.remove();
      if(!playlistId){
        if(!nowCard) yEls.flyoutBody.innerHTML = `<div class="status-msg">Couldn't find this channel's uploads.</div>`;
        return;
      }
      flyoutState.playlistId = playlistId;
      const page = await fetchPlaylistPage(playlistId, null);
      renderFlyoutItems(page.items);
      flyoutState.nextPageToken = page.nextPageToken || null;
      yEls.flyoutMore.hidden = !flyoutState.nextPageToken;
    } catch(err){
      loadingMsg.remove();
      const errMsg = document.createElement('div');
      errMsg.className = 'status-msg';
      errMsg.textContent = `Couldn't load videos: ${err.message}`;
      yEls.flyoutBody.appendChild(errMsg);
    }
  }

  function buildNowPlayingCard(){
    if(!state.currentVideo) return null;
    const v = state.currentVideo;
    const card = document.createElement('div');
    card.className = 'yt-card yt-card-current';
    const safeTitle = escapeHtml(v.title);
    card.innerHTML = `
      <div class="yt-thumb"><img src="${thumbFor(v.id)}" alt="${safeTitle}" loading="lazy"><span class="yt-now-badge">▶ Now Playing</span></div>
      <div class="yt-meta">
        <div class="yt-title">${safeTitle}</div>
        <div class="yt-channel">${escapeHtml(v.channelTitle||'')}</div>
      </div>`;
    card.addEventListener('click', ()=> loadVideo(v.id, v.title, v.channelTitle, v.channelId));
    return card;
  }

  async function getUploadsPlaylistId(channelId){
    if(uploadsPlaylistCache.has(channelId)) return uploadsPlaylistCache.get(channelId);
    const url = new URL('https://www.googleapis.com/youtube/v3/channels');
    url.searchParams.set('part','contentDetails');
    url.searchParams.set('id', channelId);
    url.searchParams.set('key', state.apiKey);
    const res = await fetch(url.toString());
    const data = await res.json();
    if(!res.ok || !data.items || !data.items.length){
      uploadsPlaylistCache.set(channelId, null);
      return null;
    }
    const playlistId = data.items[0].contentDetails.relatedPlaylists.uploads;
    uploadsPlaylistCache.set(channelId, playlistId);
    return playlistId;
  }

  async function fetchPlaylistPage(playlistId, pageToken){
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part','snippet');
    url.searchParams.set('maxResults','24');
    url.searchParams.set('playlistId', playlistId);
    if(pageToken) url.searchParams.set('pageToken', pageToken);
    url.searchParams.set('key', state.apiKey);
    const res = await fetch(url.toString());
    const data = await res.json();
    if(!res.ok) throw new Error((data.error && data.error.message) || `Request failed (${res.status})`);
    return data;
  }

  function renderFlyoutItems(items){
    const grid = document.createElement('div');
    grid.className = 'youtube-results';
    let added = 0;
    items.forEach(item=>{
      const snip = item.snippet;
      const videoId = snip.resourceId && snip.resourceId.videoId;
      if(!videoId || flyoutState.loadedIds.has(videoId)) return;
      flyoutState.loadedIds.add(videoId);
      added++;
      const thumb = flyoutThumbUrl(snip.thumbnails);
      const card = document.createElement('div');
      card.className = 'yt-card';
      const safeTitle = escapeHtml(snip.title || 'Untitled');
      card.innerHTML = `
        <div class="yt-thumb">${thumb ? `<img src="${thumb}" alt="${safeTitle}" loading="lazy">` : ''}</div>
        <div class="yt-meta">
          <div class="yt-title">${safeTitle}</div>
          <div class="yt-channel">${escapeHtml(snip.channelTitle||'')}</div>
        </div>`;
      card.addEventListener('click', ()=>{
        loadVideo(videoId, snip.title, snip.channelTitle || snip.videoOwnerChannelTitle, flyoutState.channelId);
        closeFlyout();
      });
      grid.appendChild(card);
    });
    if(added === 0){
      if(!yEls.flyoutBody.querySelector('.yt-card')){
        yEls.flyoutBody.innerHTML = `<div class="status-msg">No videos found for this channel.</div>`;
      }
      return;
    }
    yEls.flyoutBody.appendChild(grid);
  }

  yEls.flyoutMore.addEventListener('click', async ()=>{
    if(!flyoutState.playlistId || !flyoutState.nextPageToken) return;
    yEls.flyoutMore.disabled = true;
    try{
      const page = await fetchPlaylistPage(flyoutState.playlistId, flyoutState.nextPageToken);
      renderFlyoutItems(page.items);
      flyoutState.nextPageToken = page.nextPageToken || null;
      yEls.flyoutMore.hidden = !flyoutState.nextPageToken;
    } catch(err){
      alert("Couldn't load more: " + err.message);
    } finally {
      yEls.flyoutMore.disabled = false;
    }
  });

  function closeFlyout(){ yEls.flyout.hidden = true; yEls.flyoutBody.innerHTML = ''; }
  yEls.flyoutClose.addEventListener('click', closeFlyout);

  /* ---------- Freeform search (Search button / Enter with no suggestion picked) ---------- */
  function renderResults(items){
    yEls.resultsGrid.innerHTML = '';
    if(!items || items.length===0){
      yEls.resultsGrid.innerHTML = `<div class="status-msg">No results found.</div>`;
      return;
    }
    items.forEach(item=>{
      const id = item.id && item.id.videoId;
      const snip = item.snippet;
      if(!id || !snip) return;
      const thumb = (snip.thumbnails && (snip.thumbnails.medium || snip.thumbnails.default)) || {};
      const card = document.createElement('div');
      card.className = 'yt-card';
      const safeTitle = escapeHtml(snip.title);
      card.innerHTML = `
        <div class="yt-thumb">${thumb.url ? `<img src="${thumb.url}" alt="${safeTitle}" loading="lazy">` : ''}</div>
        <div class="yt-meta">
          <div class="yt-title">${safeTitle}</div>
          <div class="yt-channel">${escapeHtml(snip.channelTitle||'')}</div>
        </div>`;
      card.addEventListener('click', ()=>{
        loadVideo(id, snip.title, snip.channelTitle, snip.channelId);
        openSongFlyout(snip.channelId, snip.channelTitle, id, snip.title, snip.thumbnails);
      });
      yEls.resultsGrid.appendChild(card);
    });
  }

  async function searchYouTube(query, opts={}){
    if(!state.apiKey){
      setKeyStatus('Add a YouTube API key to search, or paste a video link/ID directly.', 'err');
      yEls.apiKeyPanel.hidden = false;
      return;
    }
    yEls.resultsGrid.innerHTML = `<div class="status-msg">Searching…</div>`;
    if(opts.autoplay) yEls.screenHint.textContent = 'Finding a match…';
    try{
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.searchParams.set('part','snippet');
      url.searchParams.set('type','video');
      url.searchParams.set('maxResults','12');
      url.searchParams.set('q', query);
      url.searchParams.set('key', state.apiKey);
      const res = await fetch(url.toString());
      const data = await res.json();
      if(!res.ok) throw new Error((data.error && data.error.message) || `Search failed (${res.status})`);
      const items = data.items || [];
      renderResults(items);
      // Play the top match immediately — typing a song and hitting Search/Enter
      // should start playback right away, not just list results to click through.
      if(opts.autoplay){
        if(items.length){
          const top = items[0];
          loadVideo(top.id.videoId, top.snippet.title, top.snippet.channelTitle, top.snippet.channelId);
        } else {
          yEls.screenHint.textContent = "Couldn't find a matching video to play.";
        }
      }
    } catch(err){
      yEls.resultsGrid.innerHTML = `<div class="status-msg">Couldn't search: ${err.message}</div>`;
      if(opts.autoplay) yEls.screenHint.textContent = "Couldn't search: " + err.message;
    }
  }

  function handleSearch(){
    const raw = yEls.searchInput.value.trim();
    if(!raw) return;
    closeDropdown();
    const videoId = extractVideoId(raw);
    if(videoId){ yEls.resultsGrid.innerHTML = ''; loadVideo(videoId); return; }
    closeFlyout();
    searchYouTube(raw, { autoplay: true });
  }

  yEls.searchBtn.addEventListener('click', handleSearch);
  yEls.searchInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter') handleSearch(); });

  /* ---------- Global dismiss handlers ---------- */
  document.addEventListener('click', (e)=>{
    if(!yEls.wrap.contains(e.target)) closeDropdown();
  });
  document.addEventListener('keydown', (e)=>{
    if(e.key !== 'Escape') return;
    closeDropdown();
    closeFlyout();
    closeLibrary();
  });

  renderLibraryButton();
})();
const YOUTUBE_API_KEY = "AIzaSyB0J5bv6BP3KPpRXGyfiFUbJhPFu02qvLU";