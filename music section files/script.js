//--------------------------------------------------------------------------
/* Music Library — add this after script.js, just before </body> */
document.addEventListener('DOMContentLoaded', function () {
  const library = document.querySelector('.music-library');
  if (!library) return;

  const countryTabs = library.querySelectorAll('.country-tab');
  const panels = library.querySelectorAll('.country-panel');
  const languageFilters = library.querySelectorAll('input[name="language"]');
  const player = library.querySelector('#selected-music-video');
  const videoTitle = library.querySelector('#selected-video-title');

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

  function updateLanguageFilter() {
    const selectedLanguages = Array.from(languageFilters)
      .filter(function (input) { return input.checked; })
      .map(function (input) { return input.value; });

    library.querySelectorAll('.country-panel:not([hidden]) .artist-album').forEach(function (album) {
      album.hidden = selectedLanguages.length > 0 && !selectedLanguages.includes(album.dataset.language);
    });
  }

  function changeCountry(country) {
    countryTabs.forEach(function (tab) {
      const selected = tab.dataset.country === country;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-selected', String(selected));
    });
    panels.forEach(function (panel) {
      panel.hidden = panel.id !== country + '-panel';
    });
    updateLanguageFilter();
  }

  countryTabs.forEach(function (tab) {
    tab.addEventListener('click', function () { changeCountry(tab.dataset.country); });
  });
  languageFilters.forEach(function (filter) {
    filter.addEventListener('change', updateLanguageFilter);
  });

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

    album.querySelector('.play-artist-video').addEventListener('click', function () {
      const videoId = album.dataset.videoId;
      const artist = album.querySelector('h4').textContent;
      const song = album.querySelector('.song-list li').textContent;

      if (!videoId) {
        videoTitle.textContent = artist + ' — add an official YouTube video ID to this artist card.';
        return;
      }
      player.src = 'https://www.youtube-nocookie.com/embed/' + videoId + '?autoplay=1&rel=0';
      videoTitle.textContent = 'Now playing: ' + artist + ' — ' + song;
      library.querySelector('.selected-video').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  updateLanguageFilter();
});

