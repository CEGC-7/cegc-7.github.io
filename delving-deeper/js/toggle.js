document.addEventListener("DOMContentLoaded", () => {
  // Find all list items that have a nested <ul>
  document.querySelectorAll("#sidebar li:has(ul) > a").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault(); // prevent navigation for parent items
      const parent = link.parentElement;
      parent.classList.toggle("expanded");
    });
  });
});
