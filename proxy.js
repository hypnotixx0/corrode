document.addEventListener("DOMContentLoaded", async () => {
  const input = document.getElementById("url");
  let stack = [], index = -1, current = "";

  const BARE_SERVER = "https://corrodeproxy.joshaburrjr.workers.dev/bare/";
  let client = new BareClient(BARE_SERVER);

  const history = {
    add(u) { const h = JSON.parse(localStorage.getItem("ch")||"[]"); h.unshift(u); localStorage.setItem("ch", JSON.stringify(h.slice(0,50))); },
    get() { return JSON.parse(localStorage.getItem("ch")||"[]"); },
    clear() { localStorage.removeItem("ch"); }
  };

  const bookmarks = {
    has(u) { return (JSON.parse(localStorage.getItem("cb")||"[]")).some(x => x.url === u); },
    toggle(u) {
      let b = JSON.parse(localStorage.getItem("cb")||"[]");
      if (this.has(u)) b = b.filter(x => x.url !== u);
      else b.push({ name: new URL(u).hostname, url: u });
      localStorage.setItem("cb", JSON.stringify(b));
    }
  };

  function go(url) {
    if (!url) return;
    current = url.startsWith("http") ? url : "https://" + url;
    history.add(current);
    if (stack[index] !== current) {
      stack = stack.slice(0, index + 1);
      stack.push(current);
      index++;
    }
    document.getElementById("back").disabled = index <= 0;
    document.getElementById("forward").disabled = index >= stack.length - 1;
    document.getElementById("bookmark").innerHTML = bookmarks.has(current) ?
      '<i class="fas fa-bookmark"></i>' : '<i class="far fa-bookmark"></i>';
    location.reload();
  }

  document.getElementById("home").onclick = () => location.href = "index.html";
  document.getElementById("back").onclick = () => { if (index > 0) go(stack[--index]); };
  document.getElementById("forward").onclick = () => { if (index < stack.length - 1) go(stack[++index]); };
  document.getElementById("refresh").onclick = () => location.reload();

  document.getElementById("go").onclick = () => {
    let q = input.value.trim();
    if (q && !q.match(/^https?:\/\//)) q = "https://google.com/search?q=" + encodeURIComponent(q);
    if (q) { go(q); input.value = ""; }
  };
  input.addEventListener("keypress", e => e.key === "Enter" && document.getElementById("go").click());

  document.getElementById("history").onclick = () => {
    const list = document.getElementById("history-list"); list.innerHTML = "";
    history.get().forEach(url => {
      const li = document.createElement("li");
      li.textContent = new URL(url).hostname;
      li.onclick = () => { go(url); document.getElementById("history-panel").classList.remove("active"); };
      list.appendChild(li);
    });
    document.getElementById("history-panel").classList.add("active");
  };

  document.getElementById("bookmark").onclick = () => { bookmarks.toggle(current); go(current); };
  document.getElementById("clear").onclick = () => { history.clear(); document.getElementById("history-list").innerHTML = "<p>Cleared</p>"; };
  document.querySelectorAll(".close").forEach(b => b.onclick = () => document.querySelectorAll(".panel").forEach(p => p.classList.remove("active")));

  const start = sessionStorage.getItem("corrode-url") ||
                (sessionStorage.getItem("corrode-search") ? `https://google.com/search?q=${sessionStorage.getItem("corrode-search")}` : "https://google.com");
  sessionStorage.clear();
  go(start);
});