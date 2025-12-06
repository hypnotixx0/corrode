// proxy.js – Full Bolt Unblocker (no iframe, native loading)
document.addEventListener('DOMContentLoaded', async () => {
  const input = document.getElementById('nav-search-input');
  let currentUrl = '';
  let navStack = [];
  let navIndex = -1;

  const transports = ["Scramjet", "Epoxy", "Libcurl"];
  let currentTransport = 0;

  // Register SW
  if ('serviceWorker' in navigator) {
    await navigator.serviceWorker.register('/sw.js');
    navigator.serviceWorker.addEventListener('message', e => {
      if (e.data.type === 'TRANSPORT_CHANGED') {
        currentTransport = e.data.index;
        updateTransportButton();
      }
    });
  }

  // History & Bookmarks (same as before)
  const history = {
    add(u) { const h = JSON.parse(localStorage.getItem('ch')||'[]'); h.unshift(u); localStorage.setItem('ch', JSON.stringify(h.slice(0,50))); },
    get() { return JSON.parse(localStorage.getItem('ch')||'[]'); }
  };
  const bookmarks = {
    add(n,u) { const b = JSON.parse(localStorage.getItem('cb')||'[]'); b.push({name:n,url:u}); localStorage.setItem('cb',JSON.stringify(b)); },
    get() { return JSON.parse(localStorage.getItem('cb')||'[]'); },
    has(u) { return this.get().some(x=>x.url===u); },
    remove(u) { localStorage.setItem('cb', JSON.stringify(this.get().filter(x=>x.url!==u))); }
  };

  function updateTransportButton() {
    const btn = document.getElementById('transport-btn');
    btn.innerHTML = `<i class="fas fa-shield-alt"></i>`;
    btn.title = `Transport: ${transports[currentTransport]}`;
  }

  function load(url) {
    if (!url) return;
    currentUrl = url.startsWith('http') ? url : 'https://' + url;
    sessionStorage.setItem('corrode-target', currentUrl);
    history.add(currentUrl);

    // Update nav stack
    if (navStack[navIndex] !== currentUrl) {
      navStack = navStack.slice(0, navIndex + 1);
      navStack.push(currentUrl);
      navIndex++;
    }
    document.getElementById('back-btn').disabled = navIndex <= 0;
    document.getElementById('forward-btn').disabled = navIndex >= navStack.length - 1;

    document.getElementById('bookmark-btn').innerHTML = bookmarks.has(currentUrl)
      ? '<i class="fas fa-bookmark"></i>' : '<i class="far fa-bookmark"></i>';

    location.reload(); // Triggers SW rewrite
  }

  // Navigation
  document.getElementById('home-btn').onclick = () => location.href = 'index.html';
  document.getElementById('back-btn').onclick = () => { if (navIndex > 0) load(navStack[--navIndex]); };
  document.getElementById('forward-btn').onclick = () => { if (navIndex < navStack.length - 1) load(navStack[++navIndex]); };
  document.getElementById('refresh-btn').onclick = () => location.reload();

  // Transport switcher
  document.getElementById('transport-btn').onclick = () => {
    navigator.serviceWorker.controller?.postMessage({ type: 'CHANGE_TRANSPORT' });
  };

  // Search
  const search = () => {
    let q = input.value.trim();
    if (!q) return;
    if (!q.match(/^https?:\/\//)) q = 'https://google.com/search?q=' + encodeURIComponent(q);
    load(q);
    input.value = '';
  };
  document.getElementById('nav-search-btn').onclick = search;
  input.addEventListener('keypress', e => { if (e.key === 'Enter') search(); });

  // History & bookmarks (same UI as before – omitted for brevity, copy from previous version)

  // Start
  const startUrl = sessionStorage.getItem('corrode-url') ||
                   (sessionStorage.getItem('corrode-search') ? `https://google.com/search?q=${sessionStorage.getItem('corrode-search')}` : 'https://www.google.com');
  sessionStorage.clear();
  load(startUrl);
  updateTransportButton();
});