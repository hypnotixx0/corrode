class BookmarkManager {
    constructor() {
        this.key = 'corrode-bookmarks';
    }
    
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
    
    save(bookmarks) {
        localStorage.setItem(this.key, JSON.stringify(bookmarks));
    }
    
    add(name, url, icon = 'fas fa-globe') {
        const bookmarks = this.getAll();
        const bookmark = {
            id: Date.now(),
            name: name,
            url: url,
            icon: icon,
            type: 'custom',
            date: new Date().toISOString()
        };
        
        bookmarks.push(bookmark);
        this.save(bookmarks);
        return bookmark;
    }
    
    remove(id) {
        const bookmarks = this.getAll();
        const filtered = bookmarks.filter(b => b.id !== id);
        this.save(filtered);
    }
    
    update(bookmarks) {
        this.save(bookmarks);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const bookmarkManager = new BookmarkManager();
    const appsGrid = document.getElementById('apps-grid');
    const searchInput = document.querySelector('.search-input');
    const settingsBtn = document.querySelector('.settings-btn');
    const footerLinks = document.querySelectorAll('.footer-link');
    
    function renderBookmarks() {
        const bookmarks = bookmarkManager.getAll();
        appsGrid.innerHTML = '';
        
        console.log('Rendering bookmarks:', bookmarks);
        
        bookmarks.forEach(bookmark => {
            const tile = document.createElement('div');
            tile.className = 'app-tile';
            tile.dataset.id = bookmark.id;
            tile.dataset.url = bookmark.url;
            
            tile.innerHTML = `
                ${bookmark.type === 'custom' ? '<button class="delete-tile"><i class="fas fa-times"></i></button>' : ''}
                <div class="tile-icon">
                    <i class="${bookmark.icon}"></i>
                </div>
                <span class="tile-label">${bookmark.name}</span>
            `;
            
            tile.addEventListener('click', function(e) {
                if (!e.target.closest('.delete-tile')) {
                    this.style.transform = 'translateY(-3px) scale(1.03)';
                    this.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.3), 0 0 25px rgba(255, 255, 255, 0.12)';
                    
                    setTimeout(() => {
                        this.style.transform = 'translateY(-3px)';
                        this.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 255, 255, 0.08)';
                    }, 150);
                    
                    sessionStorage.setItem('corrode-app', bookmark.name.toLowerCase());
                    sessionStorage.setItem('corrode-url', bookmark.url);
                    window.location.href = 'proxy.html';
                }
            });
            
            if (bookmark.type === 'custom') {
                const deleteBtn = tile.querySelector('.delete-tile');
                deleteBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const id = parseInt(tile.dataset.id);
                    bookmarkManager.remove(id);
                    
                    tile.style.transform = 'scale(0.8)';
                    tile.style.opacity = '0';
                    setTimeout(() => {
                        renderBookmarks();
                    }, 200);
                    
                    showNotification('Bookmark removed');
                });
            }
            
            appsGrid.appendChild(tile);
        });
        
        const addTile = document.createElement('div');
        addTile.className = 'app-tile add-tile';
        addTile.innerHTML = `
            <div class="tile-icon">
                <i class="fas fa-plus"></i>
            </div>
            <span class="tile-label">Add</span>
        `;
        
        addTile.addEventListener('click', function() {
            const appName = prompt('Site Name:');
            if (appName) {
                const appUrl = prompt('Site URL:');
                if (appUrl) {
                    bookmarkManager.add(appName, appUrl);
                    renderBookmarks();
                    showNotification('Bookmark added');
                }
            }
        });
        
        appsGrid.appendChild(addTile);
    }
    
    function showNotification(message) {
        const div = document.createElement('div');
        div.textContent = message;
        div.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #222;
            color: #ccc;
            padding: 10px 18px;
            border-radius: 10px;
            border-left: 3px solid #666;
            z-index: 1000;
            font-size: 0.85rem;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(div);
        
        setTimeout(() => {
            div.style.transform = 'translateX(0)';
            div.style.opacity = '1';
        }, 10);
        
        setTimeout(() => {
            div.style.transform = 'translateX(100%)';
            div.style.opacity = '0';
            setTimeout(() => div.remove(), 300);
        }, 2000);
    }
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.trim()) {
            sessionStorage.setItem('corrode-search', this.value);
            window.location.href = 'proxy.html';
        }
    });
    
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            this.style.transform = 'rotate(90deg)';
            setTimeout(() => {
                this.style.transform = 'rotate(180deg)';
            }, 150);
            
            setTimeout(() => {
                this.style.transform = '';
            }, 600);
        });
    }
    
    footerLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
        });
    });
    
    renderBookmarks();
});