document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const collapseBtn = document.getElementById("sidebar-collapse");

  collapseBtn.addEventListener("click", () => {
    const collapsed = sidebar.classList.toggle("collapsed");

    collapseBtn.textContent = collapsed ? "▶" : "◀";
    collapseBtn.setAttribute("aria-pressed", collapsed ? "true" : "false");
  });
});
