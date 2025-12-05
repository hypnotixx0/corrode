// proxy.js — FINAL WORKING VERSION (Dec 2025)
document.addEventListener('DOMContentLoaded', async () => {
  const content = document.getElementById('proxy-content');
  const loading = document.getElementById('loading-state');
  const input = document.getElementById('nav-search-input');

  let currentUrl = '';
  let navStack = [];
  let navIndex = -1;
  let scramjetReady = false;

  // Show loading until Scramjet is ready
  loading.style.display = 'flex';

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    await navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  // Load Scramjet from FAST CDN (jsDelivr + GitHub raw)
  const { ScramjetController } = $scramjetLoadController();
  const scramjet = new ScramjetController({
    files: {
      wasm: "https://github.com/MercuryWorkshop/scramjet/releases/download/v2.0.0/scramjet.wasm.wasm",
      all: "https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0/dist/scramjet.all.js",
      sync: "https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0/dist/scramjet.sync.js"
    }
  });

  // Wait for Scramjet to fully init
  await scramjet.init();
  scramjetReady = true;
  console.log('Scramjet ready!');

  // Transport
  const conn = new BareMux.BareMuxConnection("https://cdn.jsdelivr.net/npm/@mercuryworkshop/bare-mux@2.0.8/dist/worker.js");
  await conn.setTransport("https://cdn.jsdelivr.net/npm/@mercuryworkshop/curl-transport@1.4.0/dist/index.js", []);

  // History & Bookmarks (simple)
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

  function load(url) {
    if (!url || !scramjetReady) return;
    currentUrl = url;
    history.add(url);

    // Update nav stack
    if (navStack[navIndex] !== url) {
      navStack = navStack.slice(0, navIndex + 1);
      navStack.push(url);
      navIndex++;
    }
    document.getElementById('back-btn').disabled = navIndex <= 0;
    document.getElementById('forward-btn').disabled = navIndex >= navStack.length - 1;

    // Update bookmark button
    document.getElementById('bookmark-btn').innerHTML = bookmarks.has(url) 
      ? '<i class="fas fa-bookmark"></i>' 
      : '<i class="far fa-bookmark"></i>';

    // Load in iframe
    const iframe = document.createElement('iframe');
    iframe.src = scramjet.prefix + scramjet.codec.encode(url);
    iframe.style = 'width:100%;height:100%;border:none;background:#000;';
    iframe.onload = () => loading.style.display = 'none';
    content.innerHTML = '';
    content.appendChild(iframe);
  }

  // Navigation
  document.getElementById('home-btn').onclick = () => location.href = 'index.html';
  document.getElementById('back-btn').onclick = () => { if (navIndex > 0) load(navStack[--navIndex]); };
  document.getElementById('forward-btn').onclick = () => { if (navIndex < navStack.length - 1) load(navStack[++navIndex]); };
  document.getElementById('refresh-btn').onclick = () => load(currentUrl);

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

  // History panel
  document.getElementById('history-btn').onclick = () => {
    const list = document.getElementById('history-list');
    list.innerHTML = '';
    history.get().forEach(url => {
      const li = document.createElement('li');
      li.innerHTML = `<div class="history-url">${new URL(url).hostname}</div>`;
      li.onclick = () => { load(url); document.getElementById('history-panel').classList.remove('active'); };
      list.appendChild(li);
    });
    document.getElementById('history-panel').classList.add('active');
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

  // Start loading
  const startUrl = sessionStorage.getItem('corrode-url') ||
                   (sessionStorage.getItem('corrode-search') ? `https://google.com/search?q=${sessionStorage.getItem('corrode-search')}` : 'https://google.com');
  sessionStorage.clear();
  load(startUrl);
});