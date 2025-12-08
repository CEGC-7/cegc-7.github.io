document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('font-toggle');

  function applyButtonFont() {
    const isComic = document.body.classList.contains('font-comic');
    // Button shows the opposite font
    btn.style.fontFamily = isComic
      ? 'Georgia, "Times New Roman", serif'   // default font when Comic Sans is active
      : '"Comic Sans MS", "Comic Sans", cursive, sans-serif'; // Comic Sans when default is active
    btn.setAttribute('aria-pressed', isComic ? 'true' : 'false');
  }

  // Restore prior choice
  const saved = localStorage.getItem('dndFontMode');
  if (saved === 'comic') {
    document.body.classList.add('font-comic');
    document.documentElement.style.setProperty(
      '--app-font',
      '"Comic Sans MS", "Comic Sans", cursive, sans-serif'
    );
  }

  applyButtonFont();

  btn.addEventListener('click', () => {
    const nowComic = !document.body.classList.contains('font-comic');
    document.body.classList.toggle('font-comic', nowComic);
    localStorage.setItem('dndFontMode', nowComic ? 'comic' : 'default');

    // Update CSS variable for the rest of the page
    document.documentElement.style.setProperty(
      '--app-font',
      nowComic
        ? '"Comic Sans MS", "Comic Sans", cursive, sans-serif'
        : 'Georgia, "Times New Roman", serif'
    );

    applyButtonFont();
  });
});