class PlaylistView {
  constructor(container, links, callbacks) {
    this.container = container;
    this.links = links;
    this.callbacks = callbacks;
    this.currentIndex = 0;
    this.chunkSize = 10;
    this.loadedIndex = 0;
    this.isLoading = false;
    this.listElement = document.createElement('ul');
    this.listElement.className = 'yt-playlist-ul';
  }

  async init(activeIndex = 0) {
    this.container.innerHTML = '';
    this.container.appendChild(this.listElement);
    
    // Add sentinel for infinite scroll
    this.sentinel = document.createElement('div');
    this.sentinel.className = 'sentinel';
    this.container.appendChild(this.sentinel);

    this.setupInfiniteScroll();
    await this.loadNextChunk();
    this.highlightCurrent(activeIndex);
  }

  setupInfiniteScroll() {
        this.observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !this.isLoading) {
                this.loadNextChunk();
            }
        }, { root: this.container, threshold: 0.1 });

        this.observer.observe(this.sentinel);
            }       

  highlightCurrent(index) {
    const items = this.listElement.querySelectorAll('.playlist-item');
    items.forEach(item => item.classList.remove('active-video'));
    
    const activeItem = this.listElement.querySelector(`[data-index="${index}"]`);
    if (activeItem) {
      activeItem.classList.add('active-video');
      activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  async loadNextChunk() {
    if (this.isLoading || this.loadedIndex >= this.links.length) return;
    this.isLoading = true;

    const end = Math.min(this.loadedIndex + this.chunkSize, this.links.length);
    const chunk = this.links.slice(this.loadedIndex, end);

    const metadataBatch = await Promise.all(chunk.map(url => this.fetchMetadata(url)));

    metadataBatch.forEach((data, i) => {
      const li = this.createListItem(data, this.loadedIndex + i);
      this.listElement.appendChild(li);
    });

    this.loadedIndex = end;
    this.isLoading = false;
  }

 createListItem(data, index) {
    const li = document.createElement('li');
    li.className = 'playlist-item';
    li.dataset.index = index;
    li.draggable = true;

    li.innerHTML = `
      <div class="drag-handle"><i class="fas fa-grip-vertical"></i></div>
      <div class="thumb-wrapper">
        <img src="${data.thumb}" class="playlist-thumb" loading="lazy">
      </div>
      <div class="playlist-info">
        <p class="playlist-title">${data.title}</p>
      </div>
      <div class="item-menu-container">
        <button class="three-dot-btn"><i class="fas fa-ellipsis-v"></i></button>
        <div class="menu-dropdown">
          <div class="menu-item delete-action"><i class="fas fa-trash"></i> Remove</div>
        </div>
      </div>
    `;

    // 1. ADDED: Click to Play logic
    li.addEventListener('click', (e) => {
        // Don't trigger play if clicking the menu buttons
        if (e.target.closest('.item-menu-container')) return;
        this.callbacks.onItemClick(index);
        this.highlightCurrent(index);
    });

    // 2. ADDED: Toggle Menu logic (This makes the Remove button appear)
    const dotBtn = li.querySelector('.three-dot-btn');
    dotBtn.onclick = (e) => {
        e.stopPropagation(); // Prevents the video from playing when clicking menu
        
        // Close any other open menus first
        this.listElement.querySelectorAll('.playlist-item').forEach(item => {
            if (item !== li) item.classList.remove('menu-open');
        });

        li.classList.toggle('menu-open');
    };

    // 3. Keep your existing Delete logic
    const deleteBtn = li.querySelector('.delete-action');
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        
        li.style.transition = 'opacity 0.2s, transform 0.2s';
        li.style.opacity = '0';
        li.style.transform = 'translateX(20px)';
        
        setTimeout(() => {
            li.remove();
            this.handleItemDeletion(index);
            this.callbacks.onDelete(index);
        }, 200);
    };

    // 4. ADDED: Global click listener to close menu when clicking outside
    // We use a named function so we could theoretically remove it, 
    // but for simplicity, we'll just check if the element still exists.
    document.addEventListener('click', (e) => {
        if (!li.contains(e.target)) li.classList.remove('menu-open');
    }, { once: true }); // 'once' helps with cleanup

    this.addDragListeners(li);
    return li;
}


  handleItemDeletion(removedIndex) {
    // Re-index the remaining DOM elements
    const items = this.listElement.querySelectorAll('.playlist-item');
    items.forEach(item => {
        let currentIndex = parseInt(item.dataset.index);
        if (currentIndex > removedIndex) {
            item.dataset.index = currentIndex - 1;
        }
    });

    // Update the local tracking of loadedIndex
    this.loadedIndex--;

    // If the list is now empty, show a message
    if (this.links.length === 0) {
        this.container.innerHTML = '<div class="sentinel">Playlist is empty</div>';
    }
}

  // ... (fetchMetadata and addDragListeners remain similar to previous version)
  async fetchMetadata(url) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    const thumb = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    
    try {
      // Use a timeout to prevent hanging on one slow link
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`https://www.youtube.com/oembed?url=${url}&format=json`, { signal: controller.signal });
      clearTimeout(id);
      
      const json = await response.json();
      return { title: json.title, thumb, url, id: videoId };
    } catch {
      return { title: "YouTube Video (" + videoId + ")", thumb, url, id: videoId };
    }
  }

  addDragListeners(li) {
    li.addEventListener('dragstart', () => li.classList.add('dragging'));
    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
      this.handleSortChange();
    });
    
    li.addEventListener('dragover', (e) => {
      e.preventDefault();
      const draggingItem = this.container.querySelector('.dragging');
      const siblings = [...this.listElement.querySelectorAll('.playlist-item:not(.dragging)')];
      const nextSibling = siblings.find(sib => e.clientY <= sib.offsetTop + sib.offsetHeight / 2);
      this.listElement.insertBefore(draggingItem, nextSibling);
    });
  }
  handleSortChange() {
    const items = [...this.listElement.querySelectorAll('.playlist-item')];
    // Rebuild the link list based on current DOM order
    const newOrder = items.map(li => this.links[parseInt(li.dataset.index)]);
    this.callbacks.onReorder(newOrder);
  }
  destroy() {
    if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
    }
    this.container.innerHTML = '';
    this.links = null;
    this.listElement = null;
    console.log("PlaylistView destroyed and memory cleared.");
}

}