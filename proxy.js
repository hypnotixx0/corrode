document.addEventListener('DOMContentLoaded', async () => {
  const input = document.getElementById('nav-search-input');
  let currentUrl = '';
  let navStack = [];
  let navIndex = -1;

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    await navigator.serviceWorker.register('/sw.js');
  }

  const controller = navigator.serviceWorker.controller || await navigator.serviceWorker.ready;

  // Update transport button
  function updateTransport(name = "scram") {
    const btn = document.getElementById('transport-btn');
    const icons = { "/scram/service/": "shield-alt", "/epoxy/": "bolt", "/libcurl/": "cogs" };
    btn.innerHTML = `<i class="fas fa-${icons[name]}"></i>`;
    btn.title = `Transport: ${name.replace("/", "").replace("/", "")}`;
  }

  // Send current URL to SW
  function go(url) {
    if (!url) return;
    currentUrl = url.startsWith('http') ? url : 'https://' + url;
    
    // Update history
    history.add(currentUrl);
    if (navStack[navIndex] !== currentUrl) {
      navStack = navStack.slice(0, navIndex + 1);
      navStack.push(currentUrl);
      navIndex++;
    }
    document.getElementById('back-btn').disabled = navIndex <= 0;
    document.getElementById('forward-btn').disabled = navIndex >= navStack.length - 1;
    document.getElementById('bookmark-btn').innerHTML = bookmarks.has(currentUrl)
      ? '<i class="fas fa-bookmark"></i>' : '<i class="far fa-bookmark"></i>';

    // Tell SW what site to proxy
    controller?.postMessage({ type: "SET_URL", url: currentUrl });
    
    // Reload to trigger proxy
    location.reload();
  }

  // History & Bookmarks (copy from your last working version)
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

  // Navigation
  document.getElementById('home-btn').onclick = () => location.href = 'index.html';
  document.getElementById('back-btn').onclick = () => { if (navIndex > 0) go(navStack[--navIndex]); };
  document.getElementById('forward-btn').onclick = () => { if (navIndex < navStack.length - 1) go(navStack[++navIndex]); };
  document.getElementById('refresh-btn').onclick = () => location.reload();
  document.getElementById('transport-btn').onclick = () => controller?.postMessage({ type: "CHANGE_TRANSPORT" });

  // Search
  const search = () => {
    let q = input.value.trim();
    if (!q) return;
    if (!q.match(/^https?:\/\//)) q = 'https://google.com/search?q=' + encodeURIComponent(q);
    go(q);
    input.value = '';
  };
  document.getElementById('nav-search-btn').onclick = search;
  input.addEventListener('keypress', e => { if (e.key === 'Enter') search(); });

  // Listen for transport changes
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data.type === "TRANSPORT") updateTransport(e.data.name);
  });

  // Start
  const start = sessionStorage.getItem('corrode-url') ||
                (sessionStorage.getItem('corrode-search') ? `https://google.com/search?q=${sessionStorage.getItem('corrode-search')}` : 'https://www.google.com');
  sessionStorage.clear();
  go(start);
});