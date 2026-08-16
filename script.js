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