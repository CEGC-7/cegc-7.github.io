//FONT
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('font-toggle');
  function applyButtonFont() {
    const isComic = document.body.classList.contains('font-comic');
    btn.style.fontFamily = isComic
      ? 'Georgia, serif'
      : '"Comic Sans MS", sans-serif';
    btn.setAttribute('aria-pressed', isComic ? 'true' : 'false');
  }
  const saved = localStorage.getItem('dndFontMode');
  if (saved === 'comic') {
    document.body.classList.add('font-comic');
    document.documentElement.style.setProperty(
      '--app-font',
      '"Comic Sans MS", sans-serif'
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
        ? '"Comic Sans MS", sans-serif'
        : 'Georgia, serif'
    );
    applyButtonFont();
  });
});

//SCROLLING
document.addEventListener("DOMContentLoaded", () => {
  if (location.hash) {
    const target = document.querySelector(location.hash);
    if (target) {
      target.scrollIntoView({behavior: "auto", block: "start"});
    }
  }
});

//SIDEBAR
document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const collapseBtn = document.getElementById("sidebar-collapse");

  collapseBtn.addEventListener("click", () => {
    const collapsed = sidebar.classList.toggle("collapsed");

    collapseBtn.textContent = collapsed ? "\u25B6" : "\u25C0";
    collapseBtn.setAttribute("aria-pressed", collapsed ? "true" : "false");
  });
});

//CONTENTS
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("#sidebar li:has(ul) > a").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const parent = link.parentElement;
      parent.classList.toggle("expanded");
    });
  });
});
