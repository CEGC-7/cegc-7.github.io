document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('font-toggle');
  function applyButtonFont() {
    const isComic = document.body.classList.contains('font-comic');
    btn.style.fontFamily = isComic
      ? 'Georgia, "Times New Roman", serif'
      : '"Comic Sans MS", "Comic Sans", cursive, sans-serif';
    btn.setAttribute('aria-pressed', isComic ? 'true' : 'false');
  }
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
    document.documentElement.style.setProperty(
      '--app-font',
      nowComic
        ? '"Comic Sans MS", "Comic Sans", cursive, sans-serif'
        : 'Georgia, "Times New Roman", serif'
    );
    applyButtonFont();
  });
});