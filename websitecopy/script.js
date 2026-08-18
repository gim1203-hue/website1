/* ============================================================
   SECTION: PAGE HEADER — today's date text
   ============================================================ */
document.getElementById('today-date').textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    /* ============================================================
       SECTION: GIT NOTES — "Steps to create a repository" toggle
       ============================================================ */
    (function() {
      const toggleBtn = document.getElementById('repo-steps-toggle');
      const panel = document.getElementById('repo-steps-panel');
      const caret = document.getElementById('repo-steps-caret');
      if (!toggleBtn || !panel || !caret) return;
      toggleBtn.addEventListener('click', () => {
        const willOpen = panel.hidden;
        panel.hidden = !willOpen;
        toggleBtn.setAttribute('aria-expanded', String(willOpen));
        caret.textContent = willOpen ? '▲' : '▼';
      });
    })();

    /* ============================================================
       SECTION: GIT NOTES — accordion (collapsible h3 sub-sections)
       ============================================================ */
    (function() {
      const contentRight = document.querySelector('.git-notes-section .content-right');
      if (!contentRight) return;
      const headers = Array.from(contentRight.querySelectorAll('h3'));
      headers.forEach((header, index) => {
        header.classList.add('accordion-toggle');
        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        const caret = document.createElement('span');
        caret.className = 'accordion-caret';
        caret.textContent = '▼';
        header.appendChild(caret);
        const panelId = `git-accordion-panel-${index + 1}`;
        const panelItems = [];
        let sibling = header.nextElementSibling;
        while (sibling && sibling.tagName !== 'H3') {
          panelItems.push(sibling);
          sibling = sibling.nextElementSibling;
        }
        header.setAttribute('aria-controls', panelId);
        header.setAttribute('aria-expanded', 'false');
        panelItems.forEach((item) => {
          item.dataset.accordionItem = panelId;
          item.hidden = true;
        });
        function togglePanel() {
          const willOpen = header.getAttribute('aria-expanded') !== 'true';
          header.setAttribute('aria-expanded', String(willOpen));
          caret.textContent = willOpen ? '▲' : '▼';
          panelItems.forEach((item) => {
            item.hidden = !willOpen;
          });
        }
        header.addEventListener('click', togglePanel);
        header.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            togglePanel();
          }
        });
      });
    })();

    /* ============================================================
       SECTION: CERTIFICATE ZOOM MODAL
       ============================================================ */
    (function() {
      const modal = document.getElementById('cert-modal');
      const modalInner = document.querySelector('.cert-modal-inner');
      const modalImage = document.getElementById('cert-modal-image');
      const modalHint = document.getElementById('cert-modal-hint');
      const closeBtn = document.getElementById('cert-modal-close');
      const thumbButtons = document.querySelectorAll('.cert-thumb-btn');
      function setZoomed(isZoomed) {
        modalImage.classList.toggle('zoomed', isZoomed);
        modalHint.textContent = isZoomed ? 'Click the image to zoom out' : 'Click the image to zoom in';
        if (!isZoomed) modalInner.scrollTop = 0;
      }
      function closeModal() {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        modalImage.src = '';
        setZoomed(false);
      }
      thumbButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          setZoomed(false);
          modalImage.src = btn.dataset.fullSrc;
          modalImage.alt = btn.dataset.fullAlt || 'Certificate preview';
          modal.classList.add('is-open');
          modal.setAttribute('aria-hidden', 'false');
        });
      });
      modalImage.addEventListener('click', (event) => {
        event.stopPropagation();
        setZoomed(!modalImage.classList.contains('zoomed'));
      });
      closeBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
      });
    })();

    /* ============================================================
       SECTION: QURAN WIDGET (surah list, audio, live translation)
       ============================================================ */
    const quranState = {
      catalog: [],
      loadedSurahs: new Map(),
      currentUtterance: null
    };
    const quranSurahsContainer = document.getElementById('quran-surahs');
    const loadSurahsBtn = document.getElementById('load-surahs-btn');
    const surahSearchInput = document.getElementById('surah-search');
    function setSpeakingState(card, isSpeaking) {
      const playBtn = card.querySelector('.play-translation-btn');
      const playBothBtn = card.querySelector('.play-both-btn');
      const stopBtn = card.querySelector('.stop-translation-btn');
      playBtn.disabled = !card.dataset.translationReady || isSpeaking;
      playBothBtn.disabled = !card.dataset.translationReady || isSpeaking;
      stopBtn.disabled = !isSpeaking;
    }
    function stopTranslationAudio() {
      window.speechSynthesis.cancel();
      quranState.currentUtterance = null;
      document.querySelectorAll('.surah-audio').forEach(audioEl => {
        audioEl.pause();
        audioEl.onended = null;
      });
      document.querySelectorAll('.surah').forEach(card => setSpeakingState(card, false));
    }
    function playEnglishTranslation(card, surah, statusEl) {
      if (!('speechSynthesis' in window)) {
        statusEl.textContent = 'Speech playback is not supported in this browser.';
        return;
      }
      const cached = quranState.loadedSurahs.get(surah.number);
      if (!cached || !cached.translationText) {
        statusEl.textContent = 'Load this surah first to play translation audio.';
        return;
      }
      const utterance = new SpeechSynthesisUtterance(cached.translationText);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      utterance.onstart = () => {
        quranState.currentUtterance = utterance;
        statusEl.textContent = 'Playing live English translation...';
        setSpeakingState(card, true);
      };
      utterance.onend = () => {
        quranState.currentUtterance = null;
        statusEl.textContent = 'Finished translation playback.';
        setSpeakingState(card, false);
      };
      utterance.onerror = () => {
        quranState.currentUtterance = null;
        statusEl.textContent = 'Translation playback stopped due to a speech error.';
        setSpeakingState(card, false);
      };
      window.speechSynthesis.speak(utterance);
    }
    function buildSurahCard(surah) {
      const card = document.createElement('article');
      card.className = 'surah';
      card.dataset.surahNumber = String(surah.number);
      card.dataset.translationReady = '';
      card.innerHTML = `
        <h4>${surah.number}. ${surah.englishName} — ${surah.englishNameTranslation}</h4>
        <div class="surah-actions">
          <button class="quran-btn load-surah-btn" type="button">Load audio + translation</button>
          <button class="quran-btn play-both-btn" type="button" disabled>Play Arabic + English</button>
          <button class="quran-btn play-translation-btn" type="button" disabled>Play English translation</button>
          <button class="quran-btn stop-translation-btn" type="button" disabled>Stop translation</button>
        </div>
        <p class="arabic surah-arabic">Arabic ayahs will appear after loading this surah.</p>
        <audio class="audio-player surah-audio" controls preload="none"></audio>
        <div class="translation-preview">Translation preview will appear after loading this surah.</div>
        <p class="surah-status">Ready</p>
      `;
      const statusEl = card.querySelector('.surah-status');
      const arabicTextEl = card.querySelector('.surah-arabic');
      const translationPreviewEl = card.querySelector('.translation-preview');
      const audioEl = card.querySelector('.surah-audio');
      const loadBtn = card.querySelector('.load-surah-btn');
      const playBothBtn = card.querySelector('.play-both-btn');
      const playBtn = card.querySelector('.play-translation-btn');
      const stopBtn = card.querySelector('.stop-translation-btn');
      loadBtn.addEventListener('click', async () => {
        const number = surah.number;
        if (quranState.loadedSurahs.has(number)) {
          const cached = quranState.loadedSurahs.get(number);
          audioEl.src = cached.arabicAudioAyahs[0] || '';
          arabicTextEl.innerHTML = cached.arabicTextHtml || 'Arabic text unavailable.';
          translationPreviewEl.textContent = cached.translationPreview;
          card.dataset.translationReady = cached.translationText ? 'yes' : '';
          setSpeakingState(card, false);
          statusEl.textContent = 'Loaded from cache.';
          return;
        }
        loadBtn.disabled = true;
        statusEl.textContent = 'Loading surah data...';
        try {
          const [arabicResponse, englishResponse] = await Promise.all([
            fetch(`https://api.alquran.cloud/v1/surah/${number}/ar.alafasy`),
            fetch(`https://api.alquran.cloud/v1/surah/${number}/en.asad`)
          ]);
          if (!arabicResponse.ok || !englishResponse.ok) {
            throw new Error('API response error');
          }
          const arabicJson = await arabicResponse.json();
          const englishJson = await englishResponse.json();
          const arabicAyahs = arabicJson?.data?.ayahs || [];
          const arabicAudioAyahs = arabicAyahs.map(ayah => ayah.audio).filter(Boolean);
          const arabicTextHtml = arabicAyahs.map(ayah => ayah.text).join('<br>');
          const ayahTranslations = (englishJson?.data?.ayahs || []).map(ayah => ayah.text).join(' ');
          const translationPreview = ayahTranslations
            ? ayahTranslations.slice(0, 360) + (ayahTranslations.length > 360 ? '...' : '')
            : 'No translation text available.';
          quranState.loadedSurahs.set(number, {
            arabicAudioAyahs,
            arabicTextHtml,
            translationText: ayahTranslations,
            translationPreview
          });
          audioEl.src = arabicAudioAyahs[0] || '';
          arabicTextEl.innerHTML = arabicTextHtml || 'Arabic text unavailable.';
          translationPreviewEl.textContent = translationPreview;
          card.dataset.translationReady = ayahTranslations ? 'yes' : '';
          setSpeakingState(card, false);
          statusEl.textContent = ayahTranslations && arabicAudioAyahs.length
            ? 'Loaded. Arabic ayahs/audio and English translation are ready.'
            : 'Loaded with partial data. Some audio or translation may be unavailable.';
        } catch (error) {
          statusEl.textContent = 'Failed to load surah. Check internet and try again.';
        } finally {
          loadBtn.disabled = false;
        }
      });
      playBothBtn.addEventListener('click', () => {
        const cached = quranState.loadedSurahs.get(surah.number);
        if (!cached || !cached.translationText || !cached.arabicAudioAyahs.length) {
          statusEl.textContent = 'Load this surah first to play Arabic and English audio.';
          return;
        }
        stopTranslationAudio();
        setSpeakingState(card, true);
        statusEl.textContent = 'Playing Arabic recitation...';
        let audioIndex = 0;
        const playNextAyah = () => {
          if (audioIndex >= cached.arabicAudioAyahs.length) {
            audioEl.onended = null;
            playEnglishTranslation(card, surah, statusEl);
            return;
          }
          audioEl.src = cached.arabicAudioAyahs[audioIndex];
          audioEl.play().then(() => {
            audioIndex += 1;
          }).catch(() => {
            audioEl.onended = null;
            statusEl.textContent = 'Unable to play Arabic recitation. Please press play on the audio player once.';
            setSpeakingState(card, false);
          });
        };
        audioEl.onended = playNextAyah;
        playNextAyah();
      });
      playBtn.addEventListener('click', () => {
        stopTranslationAudio();
        playEnglishTranslation(card, surah, statusEl);
      });
      stopBtn.addEventListener('click', () => {
        stopTranslationAudio();
        statusEl.textContent = 'Translation playback stopped.';
      });
      return card;
    }
    function normalizeForSearch(text) {
      return String(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')   // strip spaces, hyphens, apostrophes
        .replace(/(.)\1+/g, '$1');   // collapse repeated letters (aa -> a, ii -> i)
    }
    function renderSurahCards(searchText = '') {
      const raw = searchText.trim().toLowerCase();
      const normalizedQuery = normalizeForSearch(searchText);
      const filtered = quranState.catalog.filter(surah => {
        if (!raw) return true;
        if (String(surah.number).includes(raw)) return true;
        return (
          normalizeForSearch(surah.englishName).includes(normalizedQuery) ||
          normalizeForSearch(surah.englishNameTranslation).includes(normalizedQuery)
        );
      });
      quranSurahsContainer.innerHTML = '';
      if (!filtered.length) {
        quranSurahsContainer.innerHTML = '<p class="surah-status">No surah matched your search.</p>';
        return;
      }
      const fragment = document.createDocumentFragment();
      filtered.forEach(surah => fragment.appendChild(buildSurahCard(surah)));
      quranSurahsContainer.appendChild(fragment);
    }
    async function ensureCatalogLoaded() {
      if (quranState.catalog.length) return true;
      loadSurahsBtn.disabled = true;
      loadSurahsBtn.textContent = 'Loading...';
      quranSurahsContainer.innerHTML = '<p class="surah-status">Fetching all surahs...</p>';
      try {
        const response = await fetch('https://api.alquran.cloud/v1/surah');
        if (!response.ok) throw new Error('Failed to load surah list');
        const data = await response.json();
        quranState.catalog = data?.data || [];
        loadSurahsBtn.textContent = 'All Surahs ▲';
        return true;
      } catch (error) {
        quranSurahsContainer.innerHTML = '<p class="surah-status">Could not load surahs. Check internet and try again.</p>';
        quranState.catalog = [];
        loadSurahsBtn.textContent = 'All Surahs ▼';
        return false;
      } finally {
        loadSurahsBtn.disabled = false;
      }
    }
    loadSurahsBtn.addEventListener('click', async () => {
      // If already loaded, just toggle visibility
      if (quranState.catalog.length) {
        const hidden = quranSurahsContainer.style.display === 'none';
        quranSurahsContainer.style.display = hidden ? '' : 'none';
        loadSurahsBtn.textContent = hidden ? 'All Surahs ▲' : 'All Surahs ▼';
        return;
      }
      // First click — load from API
      const loaded = await ensureCatalogLoaded();
      if (loaded) {
        quranSurahsContainer.style.display = '';
        renderSurahCards(surahSearchInput.value);
      }
    });
    surahSearchInput.addEventListener('input', async () => {
      if (!quranState.catalog.length) {
        const loaded = await ensureCatalogLoaded();
        if (!loaded) return;
      }
      quranSurahsContainer.style.display = '';
      renderSurahCards(surahSearchInput.value);
    });
    /* ============================================================
       SECTION: WEATHER WIDGET
       ============================================================ */
    (function() {
      const weatherWidget = document.getElementById('weather-widget');
      const locationNameEl = document.getElementById('weather-location-name');
      const locationBtn = document.getElementById('weather-location-btn');
      const menuBtn = document.getElementById('weather-menu-btn');
      const menuEl = document.getElementById('weather-menu');
      const stateSelectEl = document.getElementById('weather-state-select');
      const citySelectEl  = document.getElementById('weather-city-select');
      const addLocationBtn = document.getElementById('weather-add-location-btn');
      /* ── US States + major cities ── */
      const US_STATES_CITIES = {
        'Alabama': ['Birmingham','Montgomery','Huntsville','Mobile','Tuscaloosa'],
        'Alaska': ['Anchorage','Fairbanks','Juneau','Sitka','Ketchikan'],
        'Arizona': ['Phoenix','Tucson','Mesa','Chandler','Scottsdale','Tempe','Gilbert','Glendale','Peoria'],
        'Arkansas': ['Little Rock','Fort Smith','Fayetteville','Springdale','Jonesboro'],
        'California': ['Los Angeles','San Diego','San Jose','San Francisco','Fresno','Sacramento','Long Beach','Oakland','Bakersfield','Anaheim','Santa Ana','Riverside','Stockton','San Bernardino','Irvine','Modesto','Fremont','Fontana','Moreno Valley','Glendale'],
        'Colorado': ['Denver','Colorado Springs','Aurora','Fort Collins','Lakewood','Thornton','Arvada','Westminster','Pueblo','Centennial'],
        'Connecticut': ['Bridgeport','New Haven','Stamford','Hartford','Waterbury','Norwalk','Danbury'],
        'Delaware': ['Wilmington','Dover','Newark','Middletown','Smyrna'],
        'Florida': ['Jacksonville','Miami','Tampa','Orlando','St. Petersburg','Hialeah','Tallahassee','Port St. Lucie','Cape Coral','Fort Lauderdale','Pembroke Pines','Hollywood','Gainesville','Miramar','Coral Springs'],
        'Georgia': ['Atlanta','Augusta','Columbus','Macon','Savannah','Athens','Sandy Springs','Roswell','Johns Creek','Albany'],
        'Hawaii': ['Honolulu','Pearl City','Hilo','Kailua','Waipahu'],
        'Idaho': ['Boise','Meridian','Nampa','Idaho Falls','Pocatello'],
        'Illinois': ['Chicago','Aurora','Joliet','Rockford','Springfield','Elgin','Peoria','Champaign','Waukegan','Cicero'],
        'Indiana': ['Indianapolis','Fort Wayne','Evansville','South Bend','Carmel','Fishers','Bloomington','Hammond','Gary','Lafayette'],
        'Iowa': ['Des Moines','Cedar Rapids','Davenport','Sioux City','Iowa City','Waterloo','Council Bluffs','Ames','West Des Moines'],
        'Kansas': ['Wichita','Overland Park','Kansas City','Olathe','Topeka','Lawrence','Shawnee','Manhattan'],
        'Kentucky': ['Louisville','Lexington','Bowling Green','Owensboro','Covington'],
        'Louisiana': ['New Orleans','Baton Rouge','Shreveport','Lafayette','Lake Charles','Kenner','Bossier City','Monroe'],
        'Maine': ['Portland','Lewiston','Bangor','South Portland','Auburn'],
        'Maryland': ['Baltimore','Columbia','Germantown','Silver Spring','Waldorf','Glen Burnie','Frederick','Ellicott City','Rockville','Gaithersburg'],
        'Massachusetts': ['Boston','Worcester','Springfield','Cambridge','Lowell','Brockton','New Bedford','Lynn','Fall River','Quincy'],
        'Michigan': ['Detroit','Grand Rapids','Warren','Sterling Heights','Ann Arbor','Lansing','Flint','Dearborn','Livonia','Westland'],
        'Minnesota': ['Minneapolis','Saint Paul','Rochester','Duluth','Bloomington','Brooklyn Park','Plymouth','Saint Cloud'],
        'Mississippi': ['Jackson','Gulfport','Southaven','Hattiesburg','Biloxi'],
        'Missouri': ['Kansas City','Saint Louis','Springfield','Columbia','Independence','Lee\'s Summit','O\'Fallon','St. Joseph','St. Charles'],
        'Montana': ['Billings','Missoula','Great Falls','Bozeman','Butte'],
        'Nebraska': ['Omaha','Lincoln','Bellevue','Grand Island','Kearney'],
        'Nevada': ['Las Vegas','Henderson','Reno','North Las Vegas','Paradise','Sparks','Carson City'],
        'New Hampshire': ['Manchester','Nashua','Concord','Derry','Dover'],
        'New Jersey': ['Newark','Jersey City','Paterson','Elizabeth','Edison','Woodbridge','Lakewood','Toms River','Hamilton','Trenton'],
        'New Mexico': ['Albuquerque','Las Cruces','Rio Rancho','Santa Fe','Roswell'],
        'New York': ['New York City','Buffalo','Rochester','Yonkers','Syracuse','Albany','New Rochelle','Mount Vernon','Schenectady','Utica','The Bronx','Brooklyn','Queens','Staten Island','Manhattan'],
        'North Carolina': ['Charlotte','Raleigh','Greensboro','Durham','Winston-Salem','Fayetteville','Cary','Wilmington','High Point','Concord'],
        'North Dakota': ['Fargo','Bismarck','Grand Forks','Minot','West Fargo'],
        'Ohio': ['Columbus','Cleveland','Cincinnati','Toledo','Akron','Dayton','Parma','Canton','Youngstown','Lorain'],
        'Oklahoma': ['Oklahoma City','Tulsa','Norman','Broken Arrow','Edmond','Lawton','Moore','Midwest City'],
        'Oregon': ['Portland','Eugene','Salem','Gresham','Hillsboro','Beaverton','Bend','Medford'],
        'Pennsylvania': ['Philadelphia','Pittsburgh','Allentown','Erie','Reading','Scranton','Bethlehem','Lancaster','Harrisburg','York'],
        'Rhode Island': ['Providence','Cranston','Woonsocket','Pawtucket','East Providence'],
        'South Carolina': ['Columbia','Charleston','North Charleston','Mount Pleasant','Rock Hill','Greenville','Summerville'],
        'South Dakota': ['Sioux Falls','Rapid City','Aberdeen','Brookings','Watertown'],
        'Tennessee': ['Memphis','Nashville','Knoxville','Chattanooga','Clarksville','Murfreesboro','Franklin','Jackson'],
        'Texas': ['Houston','San Antonio','Dallas','Austin','Fort Worth','El Paso','Arlington','Corpus Christi','Plano','Lubbock','Laredo','Irving','Garland','Frisco','McKinney','Amarillo','Grand Prairie','Brownsville','Pasadena','Killeen'],
        'Utah': ['Salt Lake City','West Valley City','Provo','West Jordan','Orem','Sandy','Ogden','St. George','Layton'],
        'Vermont': ['Burlington','South Burlington','Rutland','Barre','Montpelier'],
        'Virginia': ['Virginia Beach','Norfolk','Chesapeake','Richmond','Newport News','Alexandria','Hampton','Roanoke','Portsmouth','Suffolk'],
        'Washington': ['Seattle','Spokane','Tacoma','Vancouver','Bellevue','Kent','Everett','Renton','Spokane Valley','Kirkland'],
        'West Virginia': ['Charleston','Huntington','Morgantown','Parkersburg','Wheeling'],
        'Wisconsin': ['Milwaukee','Madison','Green Bay','Kenosha','Racine','Appleton','Waukesha','Oshkosh','Eau Claire','Janesville'],
        'Wyoming': ['Cheyenne','Casper','Laramie','Gillette','Rock Springs']
      };
      /* Populate state dropdown */
      Object.keys(US_STATES_CITIES).sort().forEach(state => {
        const opt = document.createElement('option');
        opt.value = state;
        opt.textContent = state;
        stateSelectEl.appendChild(opt);
      });
      /* When state changes, populate city dropdown */
      stateSelectEl.addEventListener('change', () => {
        const state = stateSelectEl.value;
        citySelectEl.innerHTML = '<option value="">— Select a city —</option>';
        if (state && US_STATES_CITIES[state]) {
          US_STATES_CITIES[state].forEach(city => {
            const opt = document.createElement('option');
            opt.value = city;
            opt.textContent = city;
            citySelectEl.appendChild(opt);
          });
          citySelectEl.disabled = false;
        } else {
          citySelectEl.disabled = true;
        }
      });
      const menuStatusEl = document.getElementById('weather-menu-status');
      const mainIconEl = document.getElementById('weather-main-icon');
      const tempBigEl = document.getElementById('weather-temp-big');
      const tempUnitEl = document.getElementById('weather-temp-unit');
      const statusLineEl = document.getElementById('weather-status-line');
      const forecastToggleBtn = document.getElementById('weather-forecast-toggle');
      const forecastLinkBtn = document.getElementById('weather-forecast-link');
      const forecastWrapEl = document.getElementById('weather-forecast-wrap');
      const forecastListEl = document.getElementById('weather-forecast-list');
      const updatedEl = document.getElementById('weather-updated');
      const state = {
        lat: null,
        lon: null,
        locationLabel: 'Detecting...',
        forecastOpen: false
      };
      const WEATHER_LOCATION_STORE = 'ik_weather_location';
      const DEFAULT_LOCATION = { lat: 40.7128, lon: -74.0060, label: 'New York, NY' };
      const WEATHER_CODES = {
        0: 'Clear',
        1: 'Mostly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Fog',
        48: 'Freezing fog',
        51: 'Light drizzle',
        53: 'Drizzle',
        55: 'Dense drizzle',
        61: 'Light rain',
        63: 'Rain',
        65: 'Heavy rain',
        66: 'Freezing rain',
        67: 'Heavy freezing rain',
        71: 'Light snow',
        73: 'Snow',
        75: 'Heavy snow',
        80: 'Rain showers',
        81: 'Heavy showers',
        82: 'Violent showers',
        95: 'Thunderstorm'
      };
      function weatherText(code) {
        return WEATHER_CODES[code] || 'Unknown';
      }
      function weatherIcon(code) {
        if (code === 0) return '☀️';
        if (code === 1 || code === 2) return '🌤️';
        if (code === 3) return '☁️';
        if (code === 45 || code === 48) return '🌫️';
        if ([51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '🌧️';
        if ([71, 73, 75].includes(code)) return '❄️';
        if (code === 95) return '⛈️';
        return '🌡️';
      }
      function persistPreferredLocation(lat, lon, label) {
        try {
          localStorage.setItem(WEATHER_LOCATION_STORE, JSON.stringify({
            lat: Number(lat),
            lon: Number(lon),
            label: label || `${Number(lat).toFixed(3)}, ${Number(lon).toFixed(3)}`
          }));
        } catch (_) {
          // Ignore storage errors so weather loading still works.
        }
      }
      function readPreferredLocation() {
        try {
          const raw = localStorage.getItem(WEATHER_LOCATION_STORE);
          if (!raw) {
            return null;
          }
          const parsed = JSON.parse(raw);
          const lat = Number(parsed?.lat);
          const lon = Number(parsed?.lon);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            return null;
          }
          const label = typeof parsed?.label === 'string' && parsed.label.trim()
            ? parsed.label.trim()
            : `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
          return { lat, lon, label };
        } catch (_) {
          return null;
        }
      }
      function setMenuStatus(message, isError) {
        menuStatusEl.textContent = message || '';
        menuStatusEl.style.color = isError ? '#dc2626' : '#475569';
      }
      function setMenuOpen(open) {
        menuEl.hidden = !open;
      }
      function setForecastOpen(open) {
        state.forecastOpen = open;
        forecastWrapEl.hidden = !open;
        weatherWidget.classList.toggle('forecast-open', open);
      }
      function forecastSummary(daily) {
        if (!daily || !Array.isArray(daily.temperature_2m_min) || daily.temperature_2m_min.length < 2) {
          return 'No trend';
        }
        const todayMin = Number(daily.temperature_2m_min[0]);
        const tomorrowMin = Number(daily.temperature_2m_min[1]);
        if (!Number.isFinite(todayMin) || !Number.isFinite(tomorrowMin)) {
          return 'No trend';
        }
        if (tomorrowMin < todayMin) return 'Low temps to drop tomorrow';
        if (tomorrowMin > todayMin) return 'Warmer low temps tomorrow';
        return 'Similar temps tomorrow';
      }
      function renderForecast(daily) {
        if (!daily || !Array.isArray(daily.time)) {
          forecastListEl.innerHTML = '<li><span class="forecast-day">Unavailable</span><span class="forecast-condition">No data</span><span class="forecast-temp">--</span></li>';
          return;
        }
        const days = daily.time.slice(0, 7).map((dateStr, i) => {
          const dayName = new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' });
          const code = Number(daily.weather_code?.[i]);
          const max = Number(daily.temperature_2m_max?.[i]);
          const min = Number(daily.temperature_2m_min?.[i]);
          const icon = weatherIcon(code);
          const maxText = Number.isFinite(max) ? `${Math.round(max)}°` : '--';
          const minText = Number.isFinite(min) ? `${Math.round(min)}°` : '--';
          return `<li><span class="forecast-day">${dayName}</span><span class="forecast-condition">${icon} ${weatherText(code)}</span><span class="forecast-temp">${maxText}/${minText}</span></li>`;
        });
        forecastListEl.innerHTML = days.join('');
      }
      function geolocation() {
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation is not available in this browser.'));
            return;
          }
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
          );
        });
      }
      async function getLocationPermissionState() {
        if (!navigator.permissions || !navigator.permissions.query) {
          return 'unknown';
        }
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          return result.state || 'unknown';
        } catch (_) {
          return 'unknown';
        }
      }
      async function ipGeolocate() {
        const services = [
          {
            url: 'https://ipapi.co/json/',
            map: (payload) => ({
              lat: Number(payload?.latitude),
              lon: Number(payload?.longitude),
              label: [payload?.city, payload?.region].filter(Boolean).join(', ') || 'Approximate location'
            })
          },
          {
            url: 'https://ipwho.is/',
            map: (payload) => ({
              lat: Number(payload?.latitude),
              lon: Number(payload?.longitude),
              label: [payload?.city, payload?.region].filter(Boolean).join(', ') || 'Approximate location'
            })
          }
        ];
        for (const service of services) {
          try {
            const payload = await fetchJson(service.url, 'IP location request failed.');
            const mapped = service.map(payload);
            if (Number.isFinite(mapped.lat) && Number.isFinite(mapped.lon)) {
              return {
                lat: Number(mapped.lat.toFixed(4)),
                lon: Number(mapped.lon.toFixed(4)),
                label: mapped.label
              };
            }
          } catch (_) {
            // Try the next service.
          }
        }
        return {
          lat: 40.7128,
          lon: -74.0060,
          label: 'New York, NY (default)'
        };
      }
      async function fetchJson(url, errorMessage) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        let response;
        try {
          response = await fetch(url, { signal: controller.signal });
        } finally {
          clearTimeout(timeoutId);
        }
        if (!response.ok) {
          throw new Error(errorMessage);
        }
        return response.json();
      }
      function canUseBrowserLocation() {
        return Boolean(window.isSecureContext && navigator.geolocation);
      }
      async function reverseGeocode(latitude, longitude) {
        const endpoint = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=en&format=json`;
        const payload = await fetchJson(endpoint, 'Reverse geocoding request failed.');
        const result = payload?.results?.[0];
        if (!result) {
          return `${Number(latitude).toFixed(3)}, ${Number(longitude).toFixed(3)}`;
        }
        const region = [result.name, result.admin1].filter(Boolean).join(', ');
        return region || `${Number(latitude).toFixed(3)}, ${Number(longitude).toFixed(3)}`;
      }
      async function geocodeCityState(city, stateName) {
        const query = [city, stateName].filter(Boolean).join(', ');
        const endpoint = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
        const payload = await fetchJson(endpoint, 'Location search failed.');
        const result = payload?.results?.[0];
        if (!result) {
          throw new Error('Location not found. Try city and state again.');
        }
        return {
          lat: Number(result.latitude),
          lon: Number(result.longitude),
          label: [result.name, result.admin1].filter(Boolean).join(', ')
        };
      }
      async function loadWeatherByCoords(latitude, longitude, label) {
        state.lat = Number(latitude);
        state.lon = Number(longitude);
        state.locationLabel = label || `${Number(latitude).toFixed(3)}, ${Number(longitude).toFixed(3)}`;
        persistPreferredLocation(state.lat, state.lon, state.locationLabel);
        locationNameEl.textContent = state.locationLabel;
        statusLineEl.textContent = 'Loading weather...';
        const endpoint =
          `https://api.open-meteo.com/v1/forecast?latitude=${state.lat}&longitude=${state.lon}` +
          '&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min' +
          '&forecast_days=7&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto';
        const payload = await fetchJson(endpoint, 'Weather service request failed.');
        const current = payload?.current;
        const currentUnits = payload?.current_units;
        if (!current || !currentUnits) {
          throw new Error('Weather data is unavailable right now.');
        }
        const statusCode = Number(current.weather_code);
        const temperature = Number(current.temperature_2m);
        const roundedTemp = Number.isFinite(temperature) ? `${Math.round(temperature)}` : '--';
        mainIconEl.textContent = weatherIcon(statusCode);
        tempBigEl.textContent = roundedTemp;
        tempUnitEl.textContent = currentUnits.temperature_2m || '°F';
        statusLineEl.textContent = `${weatherIcon(statusCode)} ${forecastSummary(payload.daily)}`;
        renderForecast(payload.daily);
        updatedEl.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
      }
      async function locateAndLoad() {
        locationNameEl.textContent = 'Detecting...';
        const savedLocation = readPreferredLocation();
        if (savedLocation) {
          try {
            await loadWeatherByCoords(savedLocation.lat, savedLocation.lon, savedLocation.label);
            setMenuStatus('Using saved location. Use "Add location" to update city/state.', false);
            return;
          } catch (_) {
            // Continue with geolocation and other fallbacks.
          }
        }
        try {
          if (!canUseBrowserLocation()) {
            throw new Error('Browser location is unavailable here. Use the "Add location" button or approximate location.');
          }
          const permissionState = await getLocationPermissionState();
          if (permissionState === 'denied') {
            throw new Error('Location permission is blocked. Enable it in browser site settings, or use the "Add location" button.');
          }
          const position = await geolocation();
          const latitude = Number(position.coords.latitude.toFixed(4));
          const longitude = Number(position.coords.longitude.toFixed(4));
          const label = await reverseGeocode(latitude, longitude);
          await loadWeatherByCoords(latitude, longitude, label);
          setMenuStatus('');
        } catch (error) {
          try {
            const fallback = await ipGeolocate();
            await loadWeatherByCoords(fallback.lat, fallback.lon, fallback.label);
            setMenuStatus('Using approximate location. Use "Add location" for exact weather.', false);
          } catch (fallbackError) {
            try {
              await loadWeatherByCoords(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon, DEFAULT_LOCATION.label);
              setMenuStatus('Using default location. Click "Add location" to set your city/state.', false);
            } catch (_) {
              locationNameEl.textContent = 'Location unavailable';
              mainIconEl.textContent = '⚠️';
              tempBigEl.textContent = '--';
              tempUnitEl.textContent = '°F';
              statusLineEl.textContent = 'Weather unavailable';
              forecastListEl.innerHTML = '<li><span class="forecast-day">Unavailable</span><span class="forecast-condition">No data</span><span class="forecast-temp">--</span></li>';
              updatedEl.textContent = 'Updated: failed';
              setMenuStatus(
                fallbackError?.message || error?.message || 'Unable to load weather. Check internet and try again.',
                true
              );
            }
          }
        }
      }
      forecastToggleBtn.addEventListener('click', () => setForecastOpen(!state.forecastOpen));
      forecastLinkBtn.addEventListener('click', () => setForecastOpen(!state.forecastOpen));
      menuBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        setMenuOpen(menuEl.hidden);
      });
      locationBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        try {
          if (state.lat !== null && state.lon !== null) {
            await loadWeatherByCoords(state.lat, state.lon, state.locationLabel);
            return;
          }
          await locateAndLoad();
        } catch (error) {
          setMenuStatus(error.message || 'Unable to refresh weather.', true);
        }
      });
      addLocationBtn.addEventListener('click', async () => {
        const city = citySelectEl.value.trim();
        const stateName = stateSelectEl.value.trim();
        if (!stateName) {
          setMenuStatus('Select a state first.', true);
          return;
        }
        if (!city) {
          setMenuStatus('Select a city.', true);
          return;
        }
        addLocationBtn.disabled = true;
        setMenuStatus('Searching location...', false);
        try {
          const location = await geocodeCityState(city, stateName);
          await loadWeatherByCoords(location.lat, location.lon, location.label);
          setMenuStatus('Location added.', false);
          setMenuOpen(false);
        } catch (error) {
          setMenuStatus(error.message || 'Could not add location.', true);
        } finally {
          addLocationBtn.disabled = false;
        }
      });
      document.addEventListener('click', (event) => {
        if (!menuEl.hidden && !menuEl.contains(event.target) && event.target !== menuBtn) {
          setMenuOpen(false);
        }
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          setMenuOpen(false);
        }
      });
      setForecastOpen(false);
      locateAndLoad();
      setInterval(async () => {
        try {
          if (state.lat !== null && state.lon !== null) {
            await loadWeatherByCoords(state.lat, state.lon, state.locationLabel);
            return;
          }
          await locateAndLoad();
        } catch (_) {
          // Keep interval running and avoid unhandled promise rejections.
        }
      }, 300000);
    })();
    /* ============================================================
       SECTION: TO-DO / NOTES WIDGET
       ============================================================ */
    (function() {
      const input   = document.getElementById('todo-input');
      const addBtn  = document.getElementById('todo-add-btn');
      const list    = document.getElementById('todo-list');
      const STORE   = 'ik_todos';
      let todos     = JSON.parse(localStorage.getItem(STORE) || '[]');
      function save() { localStorage.setItem(STORE, JSON.stringify(todos)); }
      function render() {
        list.innerHTML = '';
        if (!todos.length) {
          list.innerHTML = '<li id="todo-empty">No items yet</li>';
          return;
        }
        todos.forEach((todo, i) => {
          const li = document.createElement('li');
          if (todo.done) li.classList.add('done');
          li.innerHTML = `
            <input type="checkbox" ${todo.done ? 'checked' : ''} data-i="${i}">
            <span class="todo-text">${todo.text}</span>
            <button class="todo-del" data-i="${i}" title="Delete">✕</button>`;
          list.appendChild(li);
        });
        list.querySelectorAll('input[type=checkbox]').forEach(cb => {
          cb.addEventListener('change', () => {
            todos[cb.dataset.i].done = cb.checked;
            save(); render();
          });
        });
        list.querySelectorAll('.todo-del').forEach(btn => {
          btn.addEventListener('click', () => {
            todos.splice(btn.dataset.i, 1);
            save(); render();
          });
        });
      }
      function addItem() {
        const text = input.value.trim();
        if (!text) return;
        todos.push({ text, done: false });
        input.value = '';
        save(); render();
      }
      addBtn.addEventListener('click', addItem);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') addItem(); });
      render();
    })();
    /* ============================================================
       SECTION: CALENDAR WIDGET
       ============================================================ */
    (function() {
      const MONTHS = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
      const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];
      const today  = new Date();
      let viewYear  = today.getFullYear();
      let viewMonth = today.getMonth();
      function renderCalendar() {
        const titleEl    = document.getElementById('cal-title');
        const gridEl     = document.getElementById('cal-grid');
        const yearRowEl  = document.getElementById('cal-year-row');
        titleEl.textContent = MONTHS[viewMonth] + ' ' + viewYear;
        // day-name headers
        gridEl.innerHTML = DAYS.map(d =>
          `<div class="cal-day-name">${d}</div>`).join('');
        const firstDay = new Date(viewYear, viewMonth, 1).getDay();
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const daysInPrev  = new Date(viewYear, viewMonth, 0).getDate();
        // prev-month fill
        for (let i = firstDay - 1; i >= 0; i--) {
          gridEl.innerHTML += `<div class="cal-cell other-month">${daysInPrev - i}</div>`;
        }
        // current month
        for (let d = 1; d <= daysInMonth; d++) {
          const isToday = d === today.getDate() &&
                          viewMonth === today.getMonth() &&
                          viewYear  === today.getFullYear();
          gridEl.innerHTML += `<div class="cal-cell${isToday ? ' today' : ''}">${d}</div>`;
        }
        // next-month fill
        const totalCells = firstDay + daysInMonth;
        const remaining  = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let d = 1; d <= remaining; d++) {
          gridEl.innerHTML += `<div class="cal-cell other-month">${d}</div>`;
        }
        // month chips row (all 12 months of the year)
        yearRowEl.innerHTML = MONTHS.map((m, i) =>
          `<span class="cal-month-chip${i === viewMonth ? ' active' : ''}"
                 data-m="${i}">${m.slice(0,3)}</span>`
        ).join('');
        yearRowEl.querySelectorAll('.cal-month-chip').forEach(chip => {
          chip.addEventListener('click', () => {
            viewMonth = parseInt(chip.dataset.m);
            renderCalendar();
          });
        });
      }
      document.getElementById('cal-prev').addEventListener('click', () => {
        viewMonth--;
        if (viewMonth < 0) { viewMonth = 11; viewYear--; }
        renderCalendar();
      });
      document.getElementById('cal-next').addEventListener('click', () => {
        viewMonth++;
        if (viewMonth > 11) { viewMonth = 0; viewYear++; }
        renderCalendar();
      });
      renderCalendar();
      // auto-refresh at midnight
      const msToMidnight = new Date(today.getFullYear(), today.getMonth(),
                                    today.getDate() + 1) - Date.now();
      setTimeout(() => { renderCalendar(); setInterval(renderCalendar, 86400000); }, msToMidnight);
    })();
    /* ============================================================
       SECTION: RADIO WIDGET (Radio Browser API — no key required)
       ============================================================ */
    (function() {
      const countrySelect = document.getElementById('radio-country-select');
      const searchInput   = document.getElementById('radio-search-input');
      const searchBtn     = document.getElementById('radio-search-btn');
      const listEl        = document.getElementById('radio-station-list');
      const nowPlayingEl  = document.getElementById('radio-now-playing-name');
      const audioEl       = document.getElementById('radio-audio');
      const statusEl      = document.getElementById('radio-status-line');
      if (!countrySelect || !listEl || !audioEl) return;

      // Several mirrors exist; try them in order until one responds.
      const RADIO_API_MIRRORS = [
        'https://de1.api.radio-browser.info',
        'https://de2.api.radio-browser.info',
        'https://at1.api.radio-browser.info',
        'https://nl1.api.radio-browser.info'
      ];
      let workingMirror = null;

      async function radioFetch(path) {
        const mirrors = workingMirror ? [workingMirror, ...RADIO_API_MIRRORS] : RADIO_API_MIRRORS;
        let lastError = null;
        for (const mirror of mirrors) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const response = await fetch(mirror + path, {
              signal: controller.signal,
              headers: { 'User-Agent': 'ImranKhanPersonalSite/1.0' }
            });
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error('Radio API error ' + response.status);
            workingMirror = mirror;
            return await response.json();
          } catch (error) {
            lastError = error;
          }
        }
        throw lastError || new Error('All radio mirrors failed.');
      }

      function setListStatus(message) {
        listEl.innerHTML = `<p class="radio-status">${message}</p>`;
      }

      function renderStations(stations) {
        if (!stations || !stations.length) {
          setListStatus('No stations found. Try a different name or country.');
          return;
        }
        listEl.innerHTML = '';
        const fragment = document.createDocumentFragment();
        stations.slice(0, 40).forEach(station => {
          if (!station.url_resolved && !station.url) return;
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'radio-station-btn';
          const tags = (station.tags || '').split(',').filter(Boolean).slice(0, 2).join(', ');
          btn.innerHTML = `
            <span class="radio-station-name">${station.name || 'Unnamed station'}</span>
            <span class="radio-station-meta">${[station.country, tags].filter(Boolean).join(' • ')}</span>
          `;
          btn.addEventListener('click', () => playStation(station));
          fragment.appendChild(btn);
        });
        listEl.appendChild(fragment);
      }

      function playStation(station) {
        const streamUrl = station.url_resolved || station.url;
        if (!streamUrl) {
          statusEl.textContent = 'This station has no playable stream.';
          return;
        }
        nowPlayingEl.textContent = station.name || 'Live station';
        statusEl.textContent = 'Loading stream...';
        audioEl.src = streamUrl;
        audioEl.play().then(() => {
          statusEl.textContent = 'Playing live.';
        }).catch(() => {
          statusEl.textContent = 'Could not autoplay — press play on the player.';
        });
      }

      async function loadCountries() {
        try {
          const countries = await radioFetch('/json/countries');
          const seen = new Set();
          countries
            .filter(c => c.name && c.stationcount > 0)
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach(c => {
              if (seen.has(c.name)) return;
              seen.add(c.name);
              const opt = document.createElement('option');
              opt.value = c.name;
              opt.textContent = `${c.name} (${c.stationcount})`;
              countrySelect.appendChild(opt);
            });
        } catch (error) {
          // Country list is a convenience; search by name still works without it.
        }
      }

      async function searchStations() {
        const name = searchInput.value.trim();
        const country = countrySelect.value;
        if (!name && !country) {
          setListStatus('Choose a country or type a station name to search.');
          return;
        }
        setListStatus('Searching stations...');
        try {
          const params = new URLSearchParams({
            limit: '40',
            hidebroken: 'true',
            order: 'clickcount',
            reverse: 'true'
          });
          if (name) params.set('name', name);
          if (country) params.set('country', country);
          const stations = await radioFetch(`/json/stations/search?${params.toString()}`);
          renderStations(stations);
        } catch (error) {
          setListStatus('Could not reach the radio directory. Check your internet connection and try again.');
        }
      }

      searchBtn.addEventListener('click', searchStations);
      searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') searchStations(); });
      countrySelect.addEventListener('change', searchStations);
      loadCountries();
    })();
    /* ============================================================
       SECTION: I-LISTEN WIDGET (YouTube search + video player)
       ============================================================ */
    (function() {
      const searchInput   = document.getElementById('youtube-search-input');
      const searchBtn     = document.getElementById('youtube-search-btn');
      const apiKeyBtn     = document.getElementById('youtube-api-key-btn');
      const apiKeyPanel   = document.getElementById('youtube-api-key-panel');
      const apiKeyInput   = document.getElementById('youtube-api-key-input');
      const apiKeySaveBtn = document.getElementById('youtube-api-key-save');
      const apiKeyClearBtn = document.getElementById('youtube-api-key-clear');
      const apiKeyStatus  = document.getElementById('youtube-api-key-status');
      const resultsEl     = document.getElementById('youtube-results');
      const playerEl      = document.getElementById('youtube-player');
      const screenHintEl  = document.getElementById('youtube-screen-hint');
      const countrySelect = document.getElementById('youtube-country-select');
      const relatedSelect = document.getElementById('youtube-related-select');
      const suggestionsEl = document.getElementById('youtube-suggestions');
      if (!searchInput || !playerEl) return;

      const YT_KEY_STORE = 'ik_youtube_api_key';

      /* All countries in the world (ISO 3166-1 codes) mapped to their
         primary spoken language (ISO 639-1), so picking a country biases
         search results to videos/audio in that country's language. */
      const YOUTUBE_COUNTRIES = [
        { code: 'AF', name: 'Afghanistan', lang: 'ps' }, { code: 'AL', name: 'Albania', lang: 'sq' },
        { code: 'DZ', name: 'Algeria', lang: 'ar' }, { code: 'AD', name: 'Andorra', lang: 'ca' },
        { code: 'AO', name: 'Angola', lang: 'pt' }, { code: 'AG', name: 'Antigua and Barbuda', lang: 'en' },
        { code: 'AR', name: 'Argentina', lang: 'es' }, { code: 'AM', name: 'Armenia', lang: 'hy' },
        { code: 'AU', name: 'Australia', lang: 'en' }, { code: 'AT', name: 'Austria', lang: 'de' },
        { code: 'AZ', name: 'Azerbaijan', lang: 'az' }, { code: 'BS', name: 'Bahamas', lang: 'en' },
        { code: 'BH', name: 'Bahrain', lang: 'ar' }, { code: 'BD', name: 'Bangladesh', lang: 'bn' },
        { code: 'BB', name: 'Barbados', lang: 'en' }, { code: 'BY', name: 'Belarus', lang: 'be' },
        { code: 'BE', name: 'Belgium', lang: 'nl' }, { code: 'BZ', name: 'Belize', lang: 'en' },
        { code: 'BJ', name: 'Benin', lang: 'fr' }, { code: 'BT', name: 'Bhutan', lang: 'dz' },
        { code: 'BO', name: 'Bolivia', lang: 'es' }, { code: 'BA', name: 'Bosnia and Herzegovina', lang: 'bs' },
        { code: 'BW', name: 'Botswana', lang: 'en' }, { code: 'BR', name: 'Brazil', lang: 'pt' },
        { code: 'BN', name: 'Brunei', lang: 'ms' }, { code: 'BG', name: 'Bulgaria', lang: 'bg' },
        { code: 'BF', name: 'Burkina Faso', lang: 'fr' }, { code: 'BI', name: 'Burundi', lang: 'fr' },
        { code: 'CV', name: 'Cabo Verde', lang: 'pt' }, { code: 'KH', name: 'Cambodia', lang: 'km' },
        { code: 'CM', name: 'Cameroon', lang: 'fr' }, { code: 'CA', name: 'Canada', lang: 'en' },
        { code: 'CF', name: 'Central African Republic', lang: 'fr' }, { code: 'TD', name: 'Chad', lang: 'fr' },
        { code: 'CL', name: 'Chile', lang: 'es' }, { code: 'CN', name: 'China', lang: 'zh' },
        { code: 'CO', name: 'Colombia', lang: 'es' }, { code: 'KM', name: 'Comoros', lang: 'ar' },
        { code: 'CG', name: 'Congo (Republic of)', lang: 'fr' }, { code: 'CD', name: 'Congo (DR)', lang: 'fr' },
        { code: 'CR', name: 'Costa Rica', lang: 'es' }, { code: 'CI', name: "Côte d'Ivoire", lang: 'fr' },
        { code: 'HR', name: 'Croatia', lang: 'hr' }, { code: 'CU', name: 'Cuba', lang: 'es' },
        { code: 'CY', name: 'Cyprus', lang: 'el' }, { code: 'CZ', name: 'Czechia', lang: 'cs' },
        { code: 'DK', name: 'Denmark', lang: 'da' }, { code: 'DJ', name: 'Djibouti', lang: 'fr' },
        { code: 'DM', name: 'Dominica', lang: 'en' }, { code: 'DO', name: 'Dominican Republic', lang: 'es' },
        { code: 'EC', name: 'Ecuador', lang: 'es' }, { code: 'EG', name: 'Egypt', lang: 'ar' },
        { code: 'SV', name: 'El Salvador', lang: 'es' }, { code: 'GQ', name: 'Equatorial Guinea', lang: 'es' },
        { code: 'ER', name: 'Eritrea', lang: 'ti' }, { code: 'EE', name: 'Estonia', lang: 'et' },
        { code: 'SZ', name: 'Eswatini', lang: 'en' }, { code: 'ET', name: 'Ethiopia', lang: 'am' },
        { code: 'FJ', name: 'Fiji', lang: 'en' }, { code: 'FI', name: 'Finland', lang: 'fi' },
        { code: 'FR', name: 'France', lang: 'fr' }, { code: 'GA', name: 'Gabon', lang: 'fr' },
        { code: 'GM', name: 'Gambia', lang: 'en' }, { code: 'GE', name: 'Georgia', lang: 'ka' },
        { code: 'DE', name: 'Germany', lang: 'de' }, { code: 'GH', name: 'Ghana', lang: 'en' },
        { code: 'GR', name: 'Greece', lang: 'el' }, { code: 'GD', name: 'Grenada', lang: 'en' },
        { code: 'GT', name: 'Guatemala', lang: 'es' }, { code: 'GN', name: 'Guinea', lang: 'fr' },
        { code: 'GW', name: 'Guinea-Bissau', lang: 'pt' }, { code: 'GY', name: 'Guyana', lang: 'en' },
        { code: 'HT', name: 'Haiti', lang: 'fr' }, { code: 'HN', name: 'Honduras', lang: 'es' },
        { code: 'HK', name: 'Hong Kong', lang: 'zh' }, { code: 'HU', name: 'Hungary', lang: 'hu' },
        { code: 'IS', name: 'Iceland', lang: 'is' }, { code: 'IN', name: 'India', lang: 'hi' },
        { code: 'ID', name: 'Indonesia', lang: 'id' }, { code: 'IR', name: 'Iran', lang: 'fa' },
        { code: 'IQ', name: 'Iraq', lang: 'ar' }, { code: 'IE', name: 'Ireland', lang: 'en' },
        { code: 'IL', name: 'Israel', lang: 'he' }, { code: 'IT', name: 'Italy', lang: 'it' },
        { code: 'JM', name: 'Jamaica', lang: 'en' }, { code: 'JP', name: 'Japan', lang: 'ja' },
        { code: 'JO', name: 'Jordan', lang: 'ar' }, { code: 'KZ', name: 'Kazakhstan', lang: 'kk' },
        { code: 'KE', name: 'Kenya', lang: 'sw' }, { code: 'KI', name: 'Kiribati', lang: 'en' },
        { code: 'KW', name: 'Kuwait', lang: 'ar' }, { code: 'KG', name: 'Kyrgyzstan', lang: 'ky' },
        { code: 'LA', name: 'Laos', lang: 'lo' }, { code: 'LV', name: 'Latvia', lang: 'lv' },
        { code: 'LB', name: 'Lebanon', lang: 'ar' }, { code: 'LS', name: 'Lesotho', lang: 'en' },
        { code: 'LR', name: 'Liberia', lang: 'en' }, { code: 'LY', name: 'Libya', lang: 'ar' },
        { code: 'LI', name: 'Liechtenstein', lang: 'de' }, { code: 'LT', name: 'Lithuania', lang: 'lt' },
        { code: 'LU', name: 'Luxembourg', lang: 'fr' }, { code: 'MO', name: 'Macao', lang: 'zh' },
        { code: 'MG', name: 'Madagascar', lang: 'mg' }, { code: 'MW', name: 'Malawi', lang: 'en' },
        { code: 'MY', name: 'Malaysia', lang: 'ms' }, { code: 'MV', name: 'Maldives', lang: 'dv' },
        { code: 'ML', name: 'Mali', lang: 'fr' }, { code: 'MT', name: 'Malta', lang: 'mt' },
        { code: 'MH', name: 'Marshall Islands', lang: 'en' }, { code: 'MR', name: 'Mauritania', lang: 'ar' },
        { code: 'MU', name: 'Mauritius', lang: 'en' }, { code: 'MX', name: 'Mexico', lang: 'es' },
        { code: 'FM', name: 'Micronesia', lang: 'en' }, { code: 'MD', name: 'Moldova', lang: 'ro' },
        { code: 'MC', name: 'Monaco', lang: 'fr' }, { code: 'MN', name: 'Mongolia', lang: 'mn' },
        { code: 'ME', name: 'Montenegro', lang: 'sr' }, { code: 'MA', name: 'Morocco', lang: 'ar' },
        { code: 'MZ', name: 'Mozambique', lang: 'pt' }, { code: 'MM', name: 'Myanmar', lang: 'my' },
        { code: 'NA', name: 'Namibia', lang: 'en' }, { code: 'NR', name: 'Nauru', lang: 'en' },
        { code: 'NP', name: 'Nepal', lang: 'ne' }, { code: 'NL', name: 'Netherlands', lang: 'nl' },
        { code: 'NZ', name: 'New Zealand', lang: 'en' }, { code: 'NI', name: 'Nicaragua', lang: 'es' },
        { code: 'NE', name: 'Niger', lang: 'fr' }, { code: 'NG', name: 'Nigeria', lang: 'en' },
        { code: 'KP', name: 'North Korea', lang: 'ko' }, { code: 'MK', name: 'North Macedonia', lang: 'mk' },
        { code: 'NO', name: 'Norway', lang: 'no' }, { code: 'OM', name: 'Oman', lang: 'ar' },
        { code: 'PK', name: 'Pakistan', lang: 'ur' }, { code: 'PW', name: 'Palau', lang: 'en' },
        { code: 'PS', name: 'Palestine', lang: 'ar' }, { code: 'PA', name: 'Panama', lang: 'es' },
        { code: 'PG', name: 'Papua New Guinea', lang: 'en' }, { code: 'PY', name: 'Paraguay', lang: 'es' },
        { code: 'PE', name: 'Peru', lang: 'es' }, { code: 'PH', name: 'Philippines', lang: 'tl' },
        { code: 'PL', name: 'Poland', lang: 'pl' }, { code: 'PT', name: 'Portugal', lang: 'pt' },
        { code: 'QA', name: 'Qatar', lang: 'ar' }, { code: 'RO', name: 'Romania', lang: 'ro' },
        { code: 'RU', name: 'Russia', lang: 'ru' }, { code: 'RW', name: 'Rwanda', lang: 'rw' },
        { code: 'KN', name: 'Saint Kitts and Nevis', lang: 'en' }, { code: 'LC', name: 'Saint Lucia', lang: 'en' },
        { code: 'VC', name: 'Saint Vincent and the Grenadines', lang: 'en' }, { code: 'WS', name: 'Samoa', lang: 'sm' },
        { code: 'SM', name: 'San Marino', lang: 'it' }, { code: 'ST', name: 'Sao Tome and Principe', lang: 'pt' },
        { code: 'SA', name: 'Saudi Arabia', lang: 'ar' }, { code: 'SN', name: 'Senegal', lang: 'fr' },
        { code: 'RS', name: 'Serbia', lang: 'sr' }, { code: 'SC', name: 'Seychelles', lang: 'fr' },
        { code: 'SL', name: 'Sierra Leone', lang: 'en' }, { code: 'SG', name: 'Singapore', lang: 'en' },
        { code: 'SK', name: 'Slovakia', lang: 'sk' }, { code: 'SI', name: 'Slovenia', lang: 'sl' },
        { code: 'SB', name: 'Solomon Islands', lang: 'en' }, { code: 'SO', name: 'Somalia', lang: 'so' },
        { code: 'ZA', name: 'South Africa', lang: 'en' }, { code: 'KR', name: 'South Korea', lang: 'ko' },
        { code: 'SS', name: 'South Sudan', lang: 'en' }, { code: 'ES', name: 'Spain', lang: 'es' },
        { code: 'LK', name: 'Sri Lanka', lang: 'si' }, { code: 'SD', name: 'Sudan', lang: 'ar' },
        { code: 'SR', name: 'Suriname', lang: 'nl' }, { code: 'SE', name: 'Sweden', lang: 'sv' },
        { code: 'CH', name: 'Switzerland', lang: 'de' }, { code: 'SY', name: 'Syria', lang: 'ar' },
        { code: 'TW', name: 'Taiwan', lang: 'zh' }, { code: 'TJ', name: 'Tajikistan', lang: 'tg' },
        { code: 'TZ', name: 'Tanzania', lang: 'sw' }, { code: 'TH', name: 'Thailand', lang: 'th' },
        { code: 'TL', name: 'Timor-Leste', lang: 'pt' }, { code: 'TG', name: 'Togo', lang: 'fr' },
        { code: 'TO', name: 'Tonga', lang: 'to' }, { code: 'TT', name: 'Trinidad and Tobago', lang: 'en' },
        { code: 'TN', name: 'Tunisia', lang: 'ar' }, { code: 'TR', name: 'Turkey', lang: 'tr' },
        { code: 'TM', name: 'Turkmenistan', lang: 'tk' }, { code: 'TV', name: 'Tuvalu', lang: 'en' },
        { code: 'UG', name: 'Uganda', lang: 'en' }, { code: 'UA', name: 'Ukraine', lang: 'uk' },
        { code: 'AE', name: 'United Arab Emirates', lang: 'ar' }, { code: 'GB', name: 'United Kingdom', lang: 'en' },
        { code: 'US', name: 'United States', lang: 'en' }, { code: 'UY', name: 'Uruguay', lang: 'es' },
        { code: 'UZ', name: 'Uzbekistan', lang: 'uz' }, { code: 'VU', name: 'Vanuatu', lang: 'en' },
        { code: 'VA', name: 'Vatican City', lang: 'it' }, { code: 'VE', name: 'Venezuela', lang: 'es' },
        { code: 'VN', name: 'Vietnam', lang: 'vi' }, { code: 'YE', name: 'Yemen', lang: 'ar' },
        { code: 'ZM', name: 'Zambia', lang: 'en' }, { code: 'ZW', name: 'Zimbabwe', lang: 'en' }
      ];
      if (countrySelect) {
        YOUTUBE_COUNTRIES
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach(country => {
            const opt = document.createElement('option');
            opt.value = country.code;
            opt.dataset.lang = country.lang;
            opt.textContent = country.name;
            countrySelect.appendChild(opt);
          });
      }

      function getApiKey() {
        try { return localStorage.getItem(YT_KEY_STORE) || ''; } catch (_) { return ''; }
      }
      function setApiKey(key) {
        try {
          if (key) localStorage.setItem(YT_KEY_STORE, key);
          else localStorage.removeItem(YT_KEY_STORE);
        } catch (_) { /* ignore storage errors */ }
      }

      apiKeyBtn.addEventListener('click', () => {
        apiKeyPanel.hidden = !apiKeyPanel.hidden;
        if (!apiKeyPanel.hidden) {
          apiKeyInput.value = getApiKey();
          apiKeyStatus.textContent = getApiKey() ? 'A key is currently saved.' : 'No key saved yet — search will not work until one is added.';
        }
      });
      apiKeySaveBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (!key) {
          apiKeyStatus.textContent = 'Enter a key before saving.';
          return;
        }
        setApiKey(key);
        apiKeyStatus.textContent = 'Key saved. You can search now.';
      });
      apiKeyClearBtn.addEventListener('click', () => {
        setApiKey('');
        apiKeyInput.value = '';
        apiKeyStatus.textContent = 'Key cleared.';
      });

      function extractVideoId(text) {
        const trimmed = text.trim();
        if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
        const patterns = [
          /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
          /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
          /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
          /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
        ];
        for (const pattern of patterns) {
          const match = trimmed.match(pattern);
          if (match) return match[1];
        }
        return null;
      }

      function loadVideo(videoId, title) {
        if (!videoId) return;
        playerEl.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        screenHintEl.textContent = title ? `Now playing: ${title}` : 'Video loaded.';
        loadRelatedVideos(videoId, title);
      }

      /* ── "Related content" dropdown: uses the loaded video's title
         (fetching it first via videos.list when we only have an ID,
         e.g. a pasted link) to search YouTube for similar videos and
         lets the user jump straight to one from a <select>. ── */
      async function loadRelatedVideos(videoId, title) {
        if (!relatedSelect) return;
        const apiKey = getApiKey();
        if (!apiKey) {
          relatedSelect.hidden = true;
          return;
        }
        try {
          let queryTitle = title;
          if (!queryTitle) {
            const infoParams = new URLSearchParams({ part: 'snippet', id: videoId, key: apiKey });
            const infoRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?${infoParams.toString()}`);
            if (infoRes.ok) {
              const infoData = await infoRes.json();
              queryTitle = infoData.items?.[0]?.snippet?.title || '';
            }
          }
          if (!queryTitle) {
            relatedSelect.hidden = true;
            return;
          }
          const params = new URLSearchParams({
            part: 'snippet', type: 'video', maxResults: '10', q: queryTitle, key: apiKey,
            videoEmbeddable: 'true', videoSyndicated: 'true'
          });
          const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
          if (!response.ok) throw new Error('related fetch failed');
          const data = await response.json();
          const items = (data.items || []).filter(it => it.id?.videoId && it.id.videoId !== videoId);
          if (!items.length) {
            relatedSelect.hidden = true;
            return;
          }
          relatedSelect.innerHTML = '<option value="">🔽 Related videos…</option>' +
            items.map(it => `<option value="${it.id.videoId}">${(it.snippet?.title || 'Untitled').replace(/</g, '&lt;')}</option>`).join('');
          relatedSelect.hidden = false;
        } catch (_) {
          relatedSelect.hidden = true;
        }
      }
      if (relatedSelect) {
        relatedSelect.addEventListener('change', () => {
          const id = relatedSelect.value;
          if (!id) return;
          const chosenOption = relatedSelect.options[relatedSelect.selectedIndex];
          loadVideo(id, chosenOption.textContent);
        });
      }

      function renderResults(items) {
        resultsEl.innerHTML = '';
        if (!items || !items.length) {
          resultsEl.innerHTML = '<p class="radio-status">No results. Try a different search.</p>';
          return;
        }
        const fragment = document.createDocumentFragment();
        items.forEach(item => {
          const videoId = item.id?.videoId;
          if (!videoId) return;
          const title = item.snippet?.title || 'Untitled video';
          const channel = item.snippet?.channelTitle || '';
          const thumb = item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '';
          const card = document.createElement('button');
          card.type = 'button';
          card.className = 'youtube-result-card';
          card.innerHTML = `
            <img src="${thumb}" alt="${title}" loading="lazy">
            <span class="youtube-result-title">${title}</span>
            <span class="youtube-result-channel">${channel}</span>
          `;
          card.addEventListener('click', () => loadVideo(videoId, title));
          fragment.appendChild(card);
        });
        resultsEl.appendChild(fragment);
      }

      async function performSearch() {
        hideSuggestions();
        const query = searchInput.value.trim();
        if (!query) {
          screenHintEl.textContent = 'Type a search or paste a YouTube link first.';
          return;
        }
        // If the input is a direct video link/ID, just load it — no API key needed.
        const directId = extractVideoId(query);
        if (directId) {
          resultsEl.innerHTML = '';
          loadVideo(directId, null);
          return;
        }
        const apiKey = getApiKey();
        if (!apiKey) {
          resultsEl.innerHTML = '<p class="radio-status">Add a free YouTube API key (🔑 API Key button) to search by keyword, or paste a direct YouTube video link/ID instead.</p>';
          apiKeyPanel.hidden = false;
          apiKeyStatus.textContent = 'No key saved yet — search will not work until one is added.';
          return;
        }
        resultsEl.innerHTML = '<p class="radio-status">Searching YouTube...</p>';
        try {
          const params = new URLSearchParams({
            part: 'snippet',
            type: 'video',
            videoCategoryId: '10',
            maxResults: '12',
            q: query,
            key: apiKey,
            // Only return videos YouTube itself reports as embeddable on
            // other sites and playable outside youtube.com — this is what
            // guarantees every result shown here will actually play in
            // this page's embedded player instead of erroring out.
            videoEmbeddable: 'true',
            videoSyndicated: 'true'
          });
          // If a country is selected, bias results to that country's
          // region and primary language (e.g. Pakistan → Urdu results).
          const selectedOption = countrySelect && countrySelect.selectedOptions[0];
          if (selectedOption && selectedOption.value) {
            params.set('regionCode', selectedOption.value);
            if (selectedOption.dataset.lang) {
              params.set('relevanceLanguage', selectedOption.dataset.lang);
            }
          }
          const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
          if (!response.ok) {
            const errorPayload = await response.json().catch(() => null);
            throw new Error(errorPayload?.error?.message || `YouTube API error ${response.status}`);
          }
          const data = await response.json();
          renderResults(data.items || []);
        } catch (error) {
          resultsEl.innerHTML = `<p class="radio-status">Search failed: ${error.message}. Check that your API key is valid and the YouTube Data API v3 is enabled.</p>`;
        }
      }

      searchBtn.addEventListener('click', performSearch);
      searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') performSearch();
        else if (e.key === 'Escape') hideSuggestions();
      });

      /* ── Live "as you type" suggestions dropdown ──
         Debounced on every keystroke; only ever shows videos YouTube
         reports as embeddable + syndicated, so everything listed is
         guaranteed to actually play in this page's own player. ── */
      let suggestDebounceTimer = null;
      let suggestAbortController = null;

      function hideSuggestions() {
        if (!suggestionsEl) return;
        suggestionsEl.hidden = true;
        suggestionsEl.innerHTML = '';
      }

      function renderSuggestions(items) {
        if (!suggestionsEl) return;
        const playable = (items || []).filter(it => it.id?.videoId);
        if (!playable.length) {
          suggestionsEl.innerHTML = '<div class="suggestion-empty">No playable videos found.</div>';
          suggestionsEl.hidden = false;
          return;
        }
        suggestionsEl.innerHTML = '';
        const fragment = document.createDocumentFragment();
        playable.forEach(item => {
          const videoId = item.id.videoId;
          const title = item.snippet?.title || 'Untitled video';
          const channel = item.snippet?.channelTitle || '';
          const thumb = item.snippet?.thumbnails?.default?.url || item.snippet?.thumbnails?.medium?.url || '';
          const row = document.createElement('button');
          row.type = 'button';
          row.className = 'suggestion-item';
          row.setAttribute('role', 'option');
          row.innerHTML = `
            <img src="${thumb}" alt="" loading="lazy">
            <span class="sug-text">
              <span class="sug-title">${title}</span>
              <span class="sug-channel">${channel}</span>
            </span>`;
          row.addEventListener('click', () => {
            searchInput.value = title;
            hideSuggestions();
            resultsEl.innerHTML = '';
            loadVideo(videoId, title);
          });
          fragment.appendChild(row);
        });
        suggestionsEl.appendChild(fragment);
        suggestionsEl.hidden = false;
      }

      async function fetchSuggestions(query) {
        if (!suggestionsEl) return;
        const apiKey = getApiKey();
        if (!apiKey) {
          suggestionsEl.innerHTML = '<div class="suggestion-empty">Add a YouTube API key (🔑 API Key) to see live suggestions.</div>';
          suggestionsEl.hidden = false;
          return;
        }
        suggestionsEl.innerHTML = '<div class="suggestion-loading">Searching…</div>';
        suggestionsEl.hidden = false;
        if (suggestAbortController) suggestAbortController.abort();
        suggestAbortController = new AbortController();
        try {
          const params = new URLSearchParams({
            part: 'snippet',
            type: 'video',
            maxResults: '8',
            q: query,
            key: apiKey,
            videoEmbeddable: 'true',
            videoSyndicated: 'true'
          });
          const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`, { signal: suggestAbortController.signal });
          if (!response.ok) throw new Error('suggestion request failed');
          const data = await response.json();
          renderSuggestions(data.items || []);
        } catch (error) {
          if (error.name === 'AbortError') return;
          suggestionsEl.innerHTML = '<div class="suggestion-empty">Could not load suggestions right now.</div>';
          suggestionsEl.hidden = false;
        }
      }

      searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();
        clearTimeout(suggestDebounceTimer);
        if (!query || extractVideoId(query)) {
          hideSuggestions();
          return;
        }
        suggestDebounceTimer = setTimeout(() => fetchSuggestions(query), 350);
      });

      document.addEventListener('click', (event) => {
        if (suggestionsEl && !suggestionsEl.hidden &&
            !suggestionsEl.contains(event.target) && event.target !== searchInput) {
          hideSuggestions();
        }
      });
})();


/* ============================================================
   SECTION: I-WATCH WIDGET
   Duplicate of the I-LISTEN YouTube Search + Video widget above
   (same display, same functions, same behavior — including the
   "related content" dropdown), wired to its own element IDs but
   SHARING I-LISTEN's YouTube API key (same localStorage key), so
   saving a key in either widget's API Key panel unlocks search in
   both. Only the outer TV-console shell (.iwatch-app / .tv-outer /
   .tv-screen) is the original I-WATCH markup, kept so the section's
   size/shape is unchanged from the original movie browser.
   ============================================================ */
(function() {
  const searchInput    = document.getElementById('iwatch-search-input');
  const searchBtn      = document.getElementById('iwatch-search-btn');
  const apiKeyBtn       = document.getElementById('iwatch-api-key-btn');
  const apiKeyPanel     = document.getElementById('iwatch-api-key-panel');
  const apiKeyInput     = document.getElementById('iwatch-api-key-input');
  const apiKeySaveBtn   = document.getElementById('iwatch-api-key-save');
  const apiKeyClearBtn  = document.getElementById('iwatch-api-key-clear');
  const apiKeyStatus    = document.getElementById('iwatch-api-key-status');
  const resultsEl       = document.getElementById('iwatch-results');
  const playerEl        = document.getElementById('iwatch-player');
  const screenIdleEl    = document.getElementById('iwatchScreenIdle');
  const npBarEl         = document.getElementById('iwatch-np-bar');
  const npTitleEl       = document.getElementById('iwatch-np-title');
  const npBackBtn       = document.getElementById('iwatch-np-back-btn');
  const filterHintEl    = document.getElementById('iwatch-filter-hint');
  const relatedSelect   = document.getElementById('iwatch-related-select');
  const suggestionsEl   = document.getElementById('iwatch-suggestions');
  if (!searchInput || !playerEl) return;

  const YT_KEY_STORE = 'ik_youtube_api_key';

  function getApiKey() {
    try { return localStorage.getItem(YT_KEY_STORE) || ''; } catch (_) { return ''; }
  }
  function setApiKey(key) {
    try {
      if (key) localStorage.setItem(YT_KEY_STORE, key);
      else localStorage.removeItem(YT_KEY_STORE);
    } catch (_) { /* ignore storage errors */ }
  }

  apiKeyBtn.addEventListener('click', () => {
    apiKeyPanel.hidden = !apiKeyPanel.hidden;
    if (!apiKeyPanel.hidden) {
      apiKeyInput.value = getApiKey();
      apiKeyStatus.textContent = getApiKey() ? 'A key is currently saved.' : 'No key saved yet — search will not work until one is added.';
    }
  });
  apiKeySaveBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      apiKeyStatus.textContent = 'Enter a key before saving.';
      return;
    }
    setApiKey(key);
    apiKeyStatus.textContent = 'Key saved. You can search now.';
  });
  apiKeyClearBtn.addEventListener('click', () => {
    setApiKey('');
    apiKeyInput.value = '';
    apiKeyStatus.textContent = 'Key cleared.';
  });

  function extractVideoId(text) {
    const trimmed = text.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
    ];
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  function showIdle() {
    playerEl.style.display = 'none';
    playerEl.src = 'about:blank';
    screenIdleEl.style.display = '';
    npBarEl.hidden = true;
    if (relatedSelect) relatedSelect.hidden = true;
  }

  function loadVideo(videoId, title) {
    if (!videoId) return;
    playerEl.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    screenIdleEl.style.display = 'none';
    playerEl.style.display = 'block';
    npTitleEl.textContent = title || 'Now playing';
    npBarEl.hidden = false;
    loadRelatedVideos(videoId, title);
  }

  /* ── "Related content" dropdown — same behavior as I-LISTEN's:
     resolve a title for the loaded video (fetching it when only an
     ID is known, e.g. a pasted link), search for similar videos, and
     let the user jump to one straight from the dropdown. ── */
  async function loadRelatedVideos(videoId, title) {
    if (!relatedSelect) return;
    const apiKey = getApiKey();
    if (!apiKey) {
      relatedSelect.hidden = true;
      return;
    }
    try {
      let queryTitle = title;
      if (!queryTitle) {
        const infoParams = new URLSearchParams({ part: 'snippet', id: videoId, key: apiKey });
        const infoRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?${infoParams.toString()}`);
        if (infoRes.ok) {
          const infoData = await infoRes.json();
          queryTitle = infoData.items?.[0]?.snippet?.title || '';
        }
      }
      if (!queryTitle) {
        relatedSelect.hidden = true;
        return;
      }
      const params = new URLSearchParams({
        part: 'snippet', type: 'video', maxResults: '10', q: queryTitle, key: apiKey,
        videoEmbeddable: 'true', videoSyndicated: 'true'
      });
      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
      if (!response.ok) throw new Error('related fetch failed');
      const data = await response.json();
      const items = (data.items || []).filter(it => it.id?.videoId && it.id.videoId !== videoId);
      if (!items.length) {
        relatedSelect.hidden = true;
        return;
      }
      relatedSelect.innerHTML = '<option value="">🔽 Related videos…</option>' +
        items.map(it => `<option value="${it.id.videoId}">${(it.snippet?.title || 'Untitled').replace(/</g, '&lt;')}</option>`).join('');
      relatedSelect.hidden = false;
    } catch (_) {
      relatedSelect.hidden = true;
    }
  }
  if (relatedSelect) {
    relatedSelect.addEventListener('change', () => {
      const id = relatedSelect.value;
      if (!id) return;
      const chosenOption = relatedSelect.options[relatedSelect.selectedIndex];
      loadVideo(id, chosenOption.textContent);
    });
  }

  function renderResults(items) {
    resultsEl.innerHTML = '';
    if (!items || !items.length) {
      resultsEl.innerHTML = '<p class="radio-status">No results. Try a different search.</p>';
      return;
    }
    const fragment = document.createDocumentFragment();
    items.forEach(item => {
      const videoId = item.id?.videoId;
      if (!videoId) return;
      const title = item.snippet?.title || 'Untitled video';
      const channel = item.snippet?.channelTitle || '';
      const thumb = item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '';
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'youtube-result-card';
      card.innerHTML = `
        <img src="${thumb}" alt="${title}" loading="lazy">
        <span class="youtube-result-title">${title}</span>
        <span class="youtube-result-channel">${channel}</span>
      `;
      card.addEventListener('click', () => loadVideo(videoId, title));
      fragment.appendChild(card);
    });
    resultsEl.appendChild(fragment);
  }

  async function performSearch() {
    hideSuggestions();
    const query = searchInput.value.trim();
    if (!query) {
      if (filterHintEl) filterHintEl.textContent = 'Type a search or paste a YouTube link first.';
      return;
    }
    // If the input is a direct video link/ID, just load it — no API key needed.
    const directId = extractVideoId(query);
    if (directId) {
      resultsEl.innerHTML = '';
      loadVideo(directId, null);
      return;
    }
    const apiKey = getApiKey();
    if (!apiKey) {
      resultsEl.innerHTML = '<p class="radio-status">Add a free YouTube API key (🔑 API Key button) to search by keyword, or paste a direct YouTube video link/ID instead.</p>';
      apiKeyPanel.hidden = false;
      apiKeyStatus.textContent = 'No key saved yet — search will not work until one is added.';
      return;
    }
    resultsEl.innerHTML = '<p class="radio-status">Searching YouTube...</p>';
    try {
      const params = new URLSearchParams({
        part: 'snippet',
        type: 'video',
        maxResults: '12',
        q: query,
        key: apiKey,
        // Only return videos YouTube itself reports as embeddable on other
        // sites and playable outside youtube.com, so everything shown here
        // is guaranteed to actually play in this page's player.
        videoEmbeddable: 'true',
        videoSyndicated: 'true'
      });
      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.error?.message || `YouTube API error ${response.status}`);
      }
      const data = await response.json();
      renderResults(data.items || []);
    } catch (error) {
      resultsEl.innerHTML = `<p class="radio-status">Search failed: ${error.message}. Check that your API key is valid and the YouTube Data API v3 is enabled.</p>`;
    }
  }

  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') performSearch();
    else if (e.key === 'Escape') hideSuggestions();
  });
  if (npBackBtn) {
    npBackBtn.addEventListener('click', showIdle);
  }

  /* ── Live "as you type" suggestions dropdown — same behavior as
     I-LISTEN's: debounced, only shows embeddable + syndicated
     (guaranteed-playable) videos. ── */
  let suggestDebounceTimer = null;
  let suggestAbortController = null;

  function hideSuggestions() {
    if (!suggestionsEl) return;
    suggestionsEl.hidden = true;
    suggestionsEl.innerHTML = '';
  }

  function renderSuggestions(items) {
    if (!suggestionsEl) return;
    const playable = (items || []).filter(it => it.id?.videoId);
    if (!playable.length) {
      suggestionsEl.innerHTML = '<div class="suggestion-empty">No playable videos found.</div>';
      suggestionsEl.hidden = false;
      return;
    }
    suggestionsEl.innerHTML = '';
    const fragment = document.createDocumentFragment();
    playable.forEach(item => {
      const videoId = item.id.videoId;
      const title = item.snippet?.title || 'Untitled video';
      const channel = item.snippet?.channelTitle || '';
      const thumb = item.snippet?.thumbnails?.default?.url || item.snippet?.thumbnails?.medium?.url || '';
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'suggestion-item';
      row.setAttribute('role', 'option');
      row.innerHTML = `
        <img src="${thumb}" alt="" loading="lazy">
        <span class="sug-text">
          <span class="sug-title">${title}</span>
          <span class="sug-channel">${channel}</span>
        </span>`;
      row.addEventListener('click', () => {
        searchInput.value = title;
        hideSuggestions();
        resultsEl.innerHTML = '';
        loadVideo(videoId, title);
      });
      fragment.appendChild(row);
    });
    suggestionsEl.appendChild(fragment);
    suggestionsEl.hidden = false;
  }

  async function fetchSuggestions(query) {
    if (!suggestionsEl) return;
    const apiKey = getApiKey();
    if (!apiKey) {
      suggestionsEl.innerHTML = '<div class="suggestion-empty">Add a YouTube API key (🔑 API Key) to see live suggestions.</div>';
      suggestionsEl.hidden = false;
      return;
    }
    suggestionsEl.innerHTML = '<div class="suggestion-loading">Searching…</div>';
    suggestionsEl.hidden = false;
    if (suggestAbortController) suggestAbortController.abort();
    suggestAbortController = new AbortController();
    try {
      const params = new URLSearchParams({
        part: 'snippet',
        type: 'video',
        maxResults: '8',
        q: query,
        key: apiKey,
        videoEmbeddable: 'true',
        videoSyndicated: 'true'
      });
      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`, { signal: suggestAbortController.signal });
      if (!response.ok) throw new Error('suggestion request failed');
      const data = await response.json();
      renderSuggestions(data.items || []);
    } catch (error) {
      if (error.name === 'AbortError') return;
      suggestionsEl.innerHTML = '<div class="suggestion-empty">Could not load suggestions right now.</div>';
      suggestionsEl.hidden = false;
    }
  }

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    clearTimeout(suggestDebounceTimer);
    if (!query || extractVideoId(query)) {
      hideSuggestions();
      return;
    }
    suggestDebounceTimer = setTimeout(() => fetchSuggestions(query), 350);
  });

  document.addEventListener('click', (event) => {
    if (suggestionsEl && !suggestionsEl.hidden &&
        !suggestionsEl.contains(event.target) && event.target !== searchInput) {
      hideSuggestions();
    }
  });

  // initial state
  showIdle();
})();