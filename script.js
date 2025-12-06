class BookmarkManager {
    constructor() { this.key = 'corrode-bookmarks'; }
    getDefaults() {
        return [
            { id: 1, name: 'Google', url: 'https://www.google.com', icon: 'fab fa-google', type: 'default' },
            { id: 2, name: 'YouTube', url: 'https://www.youtube.com', icon: 'fab fa-youtube', type: 'default' },
            { id: 3, name: 'TikTok', url: 'https://www.tiktok.com', icon: 'fab fa-tiktok', type: 'default' },
            { id: 4, name: 'Roblox', url: 'https://www.roblox.com', icon: 'fas fa-cube', type: 'default' },
            { id: 5, name: 'Games', url: 'https://www.coolmathgames.com', icon: 'fas fa-gamepad', type: 'default' },
            { id: 6, name: 'Movies', url: 'https://www.netflix.com', icon: 'fas fa-film', type: 'default' }
        ];
    }
    getAll() {
        const saved = localStorage.getItem(this.key);
        if (!saved || JSON.parse(saved).length === 0) {
            const defaults = this.getDefaults();
            localStorage.setItem(this.key, JSON.stringify(defaults));
            return defaults;
        }
        return JSON.parse(saved);
    }
    save(bookmarks) { localStorage.setItem(this.key, JSON.stringify(bookmarks)); }
    add(name, url, icon = 'fas fa-globe') {
        const bookmarks = this.getAll();
        const bookmark = { id: Date.now(), name, url, icon, type: 'custom', date: new Date().toISOString() };
        bookmarks.push(bookmark);
        this.save(bookmarks);
        return bookmark;
    }
    remove(id) {
        const filtered = this.getAll().filter(b => b.id !== id);
        this.save(filtered);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const bm = new BookmarkManager();
    const grid = document.getElementById('apps-grid');
    const searchInput = document.querySelector('.search-input');

    function render() {
        grid.innerHTML = '';
        bm.getAll().forEach(b => {
            const tile = document.createElement('div');
            tile.className = 'app-tile';
            tile.dataset.id = b.id;
            tile.dataset.url = b.url;
            tile.innerHTML = `
                ${b.type === 'custom' ? '<button class="delete-tile"><i class="fas fa-times"></i></button>' : ''}
                <div class="tile-icon"><i class="${b.icon}"></i></div>
                <span class="tile-label">${b.name}</span>
            `;
            tile.addEventListener('click', e => {
                if (e.target.closest('.delete-tile')) {
                    bm.remove(b.id);
                    render();
                    return;
                }
                sessionStorage.setItem('corrode-url', b.url);
                location.href = 'proxy.html';
            });
            grid.appendChild(tile);
        });

        const add = document.createElement('div');
        add.className = 'app-tile add-tile';
        add.innerHTML = `<div class="tile-icon"><i class="fas fa-plus"></i></div><span class="tile-label">Add</span>`;
        add.onclick = () => {
            const name = prompt('Site Name:');
            if (name) {
                const url = prompt('Site URL:');
                if (url) { bm.add(name, url); render(); }
            }
        };
        grid.appendChild(add);
    }

    searchInput.addEventListener('keypress', e => {
        if (e.key === 'Enter' && searchInput.value.trim()) {
            sessionStorage.setItem('corrode-search', searchInput.value.trim());
            location.href = 'proxy.html';
        }
    });

    render();
});