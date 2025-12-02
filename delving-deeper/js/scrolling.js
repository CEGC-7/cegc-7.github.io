document.addEventListener("DOMContentLoaded", () => {
  if (location.hash) {
    const target = document.querySelector(location.hash);
    if (target) {
      target.scrollIntoView({behavior: "auto", block: "start"});
    }
  }
});