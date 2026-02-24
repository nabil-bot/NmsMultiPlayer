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
      
      this.sentinel = document.createElement('div');
      this.sentinel.className = 'sentinel';
      this.container.appendChild(this.sentinel);

      // ADD THIS: Single listener for the whole list
      this.listElement.addEventListener('dragover', (e) => {
          e.preventDefault();
          const draggingItem = this.listElement.querySelector('.dragging');
          if (!draggingItem) return;

          // Find the item we are hovering over
          const siblings = [...this.listElement.querySelectorAll('.playlist-item:not(.dragging)')];
          
          // Calculate the next sibling based on mouse position
          const nextSibling = siblings.find(sibling => {
              const box = sibling.getBoundingClientRect();
              // Check if mouse is above the middle of the sibling
              return e.clientY <= box.top + box.height / 2;
          });

          this.listElement.insertBefore(draggingItem, nextSibling);
      });

      this.setupInfiniteScroll();
      await this.loadNextChunk();
      this.highlightCurrent(activeIndex);
  }
  setupInfiniteScroll() {
        if (this.observer) this.observer.disconnect();

        this.observer = new IntersectionObserver((entries) => {
          // Add a small log here to debug: console.log('Sentinel intersecting:', entries[0].isIntersecting);
          if (entries[0].isIntersecting && !this.isLoading) {
            this.loadNextChunk();
          }
        }, { 
          root: this.container, // Ensure this div has overflow-y: auto and a height
          rootMargin: '100px',   // Start loading 100px before the user reaches the bottom
          threshold: 0.1 
        });

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
    li.addEventListener('click', (e) => {
        if (e.target.closest('.item-menu-container')) return;
        this.callbacks.onItemClick(index);
        this.highlightCurrent(index);
    });
    const dotBtn = li.querySelector('.three-dot-btn');
    dotBtn.onclick = (e) => {
        e.stopPropagation(); 
        this.listElement.querySelectorAll('.playlist-item').forEach(item => {
            if (item !== li) item.classList.remove('menu-open');
        });

        li.classList.toggle('menu-open');
    };
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
    document.addEventListener('click', (e) => {
        if (!li.contains(e.target)) li.classList.remove('menu-open');
    }, { once: true }); 
    this.addDragListeners(li);
    return li;
}

  handleItemDeletion(removedIndex) {
        const items = this.listElement.querySelectorAll('.playlist-item');
        items.forEach(item => {
            let currentIndex = parseInt(item.dataset.index);
            if (currentIndex > removedIndex) {
                item.dataset.index = currentIndex - 1;
            }
        });
        this.loadedIndex--;
        if (this.links.length === 0) {
            this.container.innerHTML = '<div class="sentinel">Playlist is empty</div>';
        }
    }
  async fetchMetadata(url) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    const thumb = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    
    try {
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
      li.addEventListener('dragstart', () => {
          // Use a timeout to ensure the class is added after the drag image is created
          setTimeout(() => li.classList.add('dragging'), 0);
      });

      li.addEventListener('dragend', () => {
          li.classList.remove('dragging');
          this.handleSortChange();
      });
  }


  handleSortChange() {
          const items = [...this.listElement.querySelectorAll('.playlist-item')];
          
          // 1. Create the new links array based on the current DOM order
          // We use the OLD data-index to find which URL was there
          const newOrder = items.map(li => this.links[parseInt(li.dataset.index)]);
          
          // 2. IMPORTANT: Update the data-index attributes to match the NEW order
          items.forEach((li, newIdx) => {
              li.dataset.index = newIdx;
          });

          // 3. Update the source of truth
          // Since this.links is a reference, this updates the main ytPlaylist too
          this.links.splice(0, this.links.length, ...newOrder);

          // 4. Notify main class
          this.callbacks.onReorder(newOrder);
      }
  async syncUI() {
      if (!this.isLoading && this.loadedIndex < this.links.length) {
          await this.loadNextChunk();
      }
      if (this.sentinel) {
          this.sentinel.style.display = 'flex';
          this.container.appendChild(this.sentinel);
      }
  }

  async refresh(activeIndex = 0) {
        // Stop any current loading processes
        this.isLoading = false;
        
        // Reset the counter
        this.loadedIndex = 0;
        
        // Clear the UI
        this.listElement.innerHTML = '';
        
        // Re-show the sentinel in case it was hidden
        if (this.sentinel) {
            this.sentinel.style.display = 'flex';
        }

        // Load the first batch of the filtered list
        await this.loadNextChunk();
        
        // Re-highlight the active video
        this.highlightCurrent(activeIndex);
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