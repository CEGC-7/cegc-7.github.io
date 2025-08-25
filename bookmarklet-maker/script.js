    function makeBookmarklet() {
      const rawCode = document.getElementById('code').value.trim();
      const encoded = encodeURIComponent(rawCode);
      const bookmarklet = `javascript:${encoded}`;
      
      const output = document.getElementById('output');
      output.innerHTML = `
        <p>Drag this to your bookmarks bar:</p>
        <a class="bookmarklet" href="${bookmarklet}">📌 Run Bookmarklet</a>
        <p>Or copy the code:</p>
        <input type="text" value="${bookmarklet}" style="width:100%;height:1em;" readonly onclick="this.select()">
      `;
    }
