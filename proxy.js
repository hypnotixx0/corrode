// proxy.js — Bolt Unblocker as main proxy (Dec 2025)
document.addEventListener('DOMContentLoaded', async () => {
  const content = document.getElementById('proxy-content');
  const loading = document.getElementById('loading-state');
  const input = document.getElementById('nav-search-input');

  let currentUrl = '';      // raw target URL
  let navStack = [];
  let navIndex = -1;
  let apiMode = false;      // false = iframe embed, true = fetch & display text

  loading.style.display = 'flex';

  // History & Bookmarks
  const history = {
    add(u) { const h = JSON.parse(localStorage.getItem('ch')||'[]'); h.unshift(u); localStorage.setItem('ch', JSON.stringify(h.slice(0,50))); },
    get() { return JSON.parse(localStorage.getItem('ch')||'[]'); },
    clear() { localStorage.removeItem('ch'); }
  };
  const bookmarks = {
    add(n,u) { const b = JSON.parse(localStorage.getItem('cb')||'[]'); b.push({name:n,url:u}); localStorage.setItem('cb',JSON.stringify(b)); },
    get() { return JSON.parse(localStorage.getItem('cb')||'[]'); },
    has(u) { return this.get().some(x=>x.url===u); },
    remove(u) { localStorage.setItem('cb', JSON.stringify(this.get().filter(x=>x.url!==u))); }
  };

  function buildBoltUrl(target) {
    return `https://boltunblocker.com/scram/service/${encodeURIComponent(target)}`;
  }

  async function load(url, forceApi = apiMode) {
    if (!url) return;
    currentUrl = url.startsWith('http') ? url : 'https://' + url;
    history.add(currentUrl);

    // Navigation stack
    if (navStack[navIndex] !== currentUrl) {
      navStack = navStack.slice(0, navIndex + 1);
      navStack.push(currentUrl);
      navIndex++;
    }
    document.getElementById('back-btn').disabled = navIndex <= 0;
    document.getElementById('forward-btn').disabled = navIndex >= navStack.length - 1;

    // Bookmark icon
    document.getElementById('bookmark-btn').innerHTML = bookmarks.has(currentUrl)
      ? '<i class="fas fa-bookmark"></i>' : '<i class="far fa-bookmark"></i>';

    content.innerHTML = '';
    loading.style.display = 'flex';

    try {
      if (forceApi) {
        // API MODE – fetch and show text
        const res = await fetch(buildBoltUrl(currentUrl));
        if (!res.ok) throw new Error(`Bolt returned ${res.status}`);
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        const title = doc.querySelector('title')?.textContent || 'No title';
        const price = doc.querySelector('[data-name="last-price"], .price, .tv-symbol-price-quote__value')?.textContent || 'N/A';

        const div = document.createElement('div');
        div.style = 'padding:2rem;color:#ccc;line-height:1.6;';
        div.innerHTML = `
          <h2>API Mode – ${new URL(currentUrl).hostname}</h2>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Detected Price:</strong> ${price}</p>
          <pre style="background:#222;padding:1rem;border-radius:8px;overflow:auto;max-height:60vh;">
${html.substring(0, 3000)}${html.length > 3000 ? '\n\n... (truncated)' : ''}
          </pre>
        `;
        content.appendChild(div);
      } else {
        // NORMAL MODE – iframe embed
        const iframe = document.createElement('iframe');
        iframe.src = buildBoltUrl(currentUrl);
        iframe.style = 'width:100%;height:100%;border:none;background:#000;';
        iframe.onload = () => loading.style.display = 'none';
        content.appendChild(iframe);
      }
      loading.style.display = 'none';
    } catch (err) {
      loading.innerHTML = `<p style="color:#f66;">Failed: ${err.message}</p>`;
      console.error(err);
    }
  }

  // Navigation buttons
  document.getElementById('home-btn').onclick = () => location.href = 'index.html';
  document.getElementById('back-btn').onclick = () => { if (navIndex > 0) load(navStack[--navIndex]); };
  document.getElementById('forward-btn').onclick = () => { if (navIndex < navStack.length - 1) load(navStack[++navIndex]); };
  document.getElementById('refresh-btn').onclick = () => load(currentUrl, apiMode);

  // Search bar
  const search = () => {
    let q = input.value.trim();
    if (!q) return;
    if (!q.match(/^https?:\/\//)) q = 'https://google.com/search?q=' + encodeURIComponent(q);
    load(q, apiMode);
    input.value = '';
  };
  document.getElementById('nav-search-btn').onclick = search;
  input.addEventListener('keypress', e => { if (e.key === 'Enter') search(); });

  // API / Embed toggle
  document.getElementById('api-toggle-btn').onclick = () => {
    apiMode = !apiMode;
    const icon = apiMode ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-code"></i>';
    document.getElementById('api-toggle-btn').innerHTML = icon;
    if (currentUrl) load(currentUrl, apiMode);
  };

  // History panel
  document.getElementById('history-btn').onclick = () => {
    const list = document.getElementById('history-list');
    list.innerHTML = '';
    history.get().forEach(url => {
      const li = document.createElement('li');
      li.innerHTML = `<div class="history-url">${new URL(url).hostname}</div>`;
      li.onclick = () => { load(url, apiMode); document.getElementById('history-panel').classList.remove('active'); };
      list.appendChild(li);
    });
    document.getElementById('history-panel').classList.add('active');
  };
  document.getElementById('clear-history').onclick = () => {
    history.clear();
    document.getElementById('history-list').innerHTML = '<p style="color:#888;">History cleared</p>';
  };

  // Bookmark button
  document.getElementById('bookmark-btn').onclick = () => {
    if (!currentUrl) return;
    if (bookmarks.has(currentUrl)) {
      if (confirm('Remove bookmark?')) {
        bookmarks.remove(currentUrl);
        document.getElementById('bookmark-btn').innerHTML = '<i class="far fa-bookmark"></i>';
      }
    } else {
      const name = prompt('Bookmark name:', new URL(currentUrl).hostname);
      if (name) {
        bookmarks.add(name, currentUrl);
        document.getElementById('bookmark-btn').innerHTML = '<i class="fas fa-bookmark"></i>';
      }
    }
  };

  // Close panels
  document.querySelectorAll('.close-panel').forEach(b => b.onclick = () => {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  });

  // Initial load
  const startUrl = sessionStorage.getItem('corrode-url') ||
                   (sessionStorage.getItem('corrode-search') ? `https://google.com/search?q=${sessionStorage.getItem('corrode-search')}` : 'https://www.google.com');
  sessionStorage.clear();
  load(startUrl);
});