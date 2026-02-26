class LocalVideoPlaylist {
  constructor(videoData, fileInput) {
    this.videoData = videoData; 
    this.fileInput = fileInput;
    this.currentIndex = 0;
    this.videoPlayer = null;
    this.container = null;
    this.titleLabel = null;
    this.timelineSlider = null;
    this.currentTimeLabel = null;
    this.durationLabel = null;
    this.volumeSlider = null;
    this.playPauseBtn = null;
    this.timerStatus = null;
    this.playlistOverlay = null;
    
    // Track the dragged item index
    this.draggedItemIndex = null;
    
    this.init();
  }

  async init() {
    this.createPlayerSkeleton();
    this.loadVideo(0);
  }

  createPlayerSkeleton() {
    const videosContainer = document.getElementById('videos-container');
    this.container = document.createElement('div');
    this.container.classList.add('video-local-container', 'playlist-container');
    this.container.style.position = 'relative'; // Necessary for overlay positioning

    // Header: Title and Menu
    const header = document.createElement('div');
    header.classList.add('remove-container');
    
    this.titleLabel = document.createElement('label');
    this.titleLabel.classList.add('VideoFileName');
    
    const menuBtn = document.createElement('button');
    menuBtn.className = 'MenuButton-class';
    menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    this.setupMenu(menuBtn);

    header.appendChild(menuBtn);
    header.appendChild(this.titleLabel);

    // Video Element
    this.videoPlayer = document.createElement('video');
    this.videoPlayer.className = 'local-video-player';
    this.videoPlayer.controls = false;

    // --- Playlist Overlay (The List View) ---
    this.playlistOverlay = document.createElement('div');
    this.playlistOverlay.className = 'playlist-overlay';
    this.playlistOverlay.style.display = 'none';
    this.renderPlaylistItems();
    
    // Timeline
    const sliderContainer = document.createElement('div');
    sliderContainer.classList.add('slider-container');
    
    this.timelineSlider = document.createElement('input');
    this.timelineSlider.type = 'range';
    this.timelineSlider.className = 'timeline-slider';
    this.timelineSlider.min = '0';
    this.timelineSlider.value = '0';
    this.timelineSlider.step = '1';

    const timeLabels = document.createElement('div');
    timeLabels.classList.add('timelabelContainer');
    this.currentTimeLabel = document.createElement('span');
    this.currentTimeLabel.className = 'time-label';
    this.durationLabel = document.createElement('span');
    this.durationLabel.className = 'time-label';
    this.timerStatus = document.createElement("div");
    this.timerStatus.className = "timer-status";
    this.timerStatus.style.display = "none";

    timeLabels.appendChild(this.currentTimeLabel);
    timeLabels.appendChild(this.timerStatus);
    timeLabels.appendChild(this.durationLabel);
    sliderContainer.appendChild(this.timelineSlider);
    sliderContainer.appendChild(timeLabels);

    // Controls
    const controls = document.createElement('div');
    controls.classList.add('local-video-controls');

    const mainBtns = document.createElement('div');
    mainBtns.classList.add('otherVideoControllersContainer');

    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="fas fa-step-backward"></i>';
    prevBtn.onclick = () => this.prev();

    this.playPauseBtn = document.createElement('button');
    this.playPauseBtn.classList.add('video-play-pause');
    this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';

    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<i class="fas fa-step-forward"></i>';
    nextBtn.onclick = () => this.next();

    const backwardButton = document.createElement('button');
    backwardButton.textContent = '-10s';
    backwardButton.onclick = () => this.videoPlayer.currentTime -= 10;

    const forwardButton = document.createElement('button');
    forwardButton.textContent = '+10s';
    forwardButton.onclick = () => this.videoPlayer.currentTime += 10;

    const fullscreenBtn = document.createElement('button');
    fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';

    // --- New: List Toggle Button ---
    const listBtn = document.createElement('button');
    listBtn.innerHTML = '<i class="fas fa-list"></i>';
    listBtn.onclick = (e) => {
        e.stopPropagation();
        this.playlistOverlay.style.display = this.playlistOverlay.style.display === 'none' ? 'block' : 'none';
    };

    mainBtns.append(prevBtn, this.playPauseBtn, nextBtn, backwardButton, forwardButton, listBtn, fullscreenBtn);

    // Volume
    const volCont = document.createElement('div');
    volCont.classList.add('volume-container');
    const speakerIcon = document.createElement('i');
    speakerIcon.classList.add('fas', 'fa-volume-up', 'volume-icon');
    this.volumeSlider = document.createElement('input');
    this.volumeSlider.classList.add('slider');
    this.volumeSlider.type = 'range';
    this.volumeSlider.min = 0;
    this.volumeSlider.max = 1;
    this.volumeSlider.step = 0.01;
    this.volumeSlider.value = 0.8;
    volCont.append(speakerIcon, this.volumeSlider);

    controls.appendChild(mainBtns);
    controls.appendChild(volCont);

    // Assembly
    this.container.append(header, this.videoPlayer, this.playlistOverlay, sliderContainer, controls);
    videosContainer.appendChild(this.container);

    this.attachListeners(fullscreenBtn);
  }

  // Helper to render the list of videos in the overlay
  renderPlaylistItems() {
    this.playlistOverlay.innerHTML = '';
    
    this.videoData.forEach((video, index) => {
      const item = document.createElement('div');
      item.className = 'playlist-item';
      item.draggable = true; // Enable native dragging
      if (index === this.currentIndex) item.classList.add('active');

      // Container for the name (left side)
      const nameSpan = document.createElement('span');
      nameSpan.className = 'playlist-item-name';
      nameSpan.textContent = video.name;
      nameSpan.onclick = (e) => {
        e.stopPropagation();
        this.loadVideo(index);
        this.playlistOverlay.style.display = 'none';
      };

      // Remove button (right side)
      const removeBtn = document.createElement('button');
      removeBtn.className = 'playlist-item-remove';
      removeBtn.innerHTML = '<i class="fas fa-times"></i>';
      removeBtn.onclick = (e) => {
        e.stopPropagation();
        this.removeVideoFromPlaylist(index);
      };

      item.appendChild(nameSpan);
      item.appendChild(removeBtn);

      // --- Drag and Drop Listeners ---
      item.addEventListener('dragstart', (e) => {
        this.draggedItemIndex = index;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        this.draggedItemIndex = null;
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault(); // Required to allow drop
        item.classList.add('drag-over');
      });

      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over');
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('drag-over');
        if (this.draggedItemIndex !== null && this.draggedItemIndex !== index) {
          this.reorderPlaylist(this.draggedItemIndex, index);
        }
      });

      this.playlistOverlay.appendChild(item);
    });
  }

  attachListeners(fullscreenBtn) {
    this.videoPlayer.addEventListener('play', () => {
      this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    });
    this.videoPlayer.addEventListener('pause', () => {
      this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    });
    this.playPauseBtn.onclick = () => {
      this.videoPlayer.paused ? this.videoPlayer.play() : this.videoPlayer.pause();
    };

    this.videoPlayer.addEventListener('timeupdate', () => {
      this.currentTimeLabel.textContent = this.formatTime(this.videoPlayer.currentTime);
      this.timelineSlider.value = this.videoPlayer.currentTime;
      this.timelineSlider.max = this.videoPlayer.duration || 0;
      this.durationLabel.textContent = this.formatTime(this.videoPlayer.duration || 0);
      
      const currentUrl = this.videoData[this.currentIndex].url;
      this.saveCookieData(currentUrl, this.videoPlayer.currentTime, this.videoPlayer.volume);
    });

    this.timelineSlider.oninput = () => {
      this.videoPlayer.currentTime = this.timelineSlider.value;
    };

    this.volumeSlider.oninput = () => {
      this.videoPlayer.volume = this.volumeSlider.value;
    };

    fullscreenBtn.onclick = () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        this.videoPlayer.requestFullscreen();
      }
    };

    this.videoPlayer.addEventListener('ended', () => this.next());
    
    // Hide playlist overlay if clicking anywhere else in the container
    this.container.addEventListener('click', () => {
        this.playlistOverlay.style.display = 'none';
    });
    this.playlistOverlay.addEventListener('click', (e) => e.stopPropagation());
  }

  loadVideo(index) {
    if (index < 0 || index >= this.videoData.length) return;
    this.currentIndex = index;
    const data = this.videoData[index];
    
    this.titleLabel.textContent = data.name;
    this.videoPlayer.src = data.url;
    
    // Highlight the active item in the list
    this.renderPlaylistItems();
    
    const fileDic = getCookie("fileDic");
    if (fileDic && fileDic[data.url]) {
      this.videoPlayer.currentTime = fileDic[data.url].timeFrame || 0;
      this.videoPlayer.volume = fileDic[data.url].volume || 0.8;
      this.volumeSlider.value = this.videoPlayer.volume;
    }
    
    this.videoPlayer.play().catch(() => {});
  }

  next() {
    let nextIndex = (this.currentIndex + 1) % this.videoData.length;
    this.loadVideo(nextIndex);
  }

  prev() {
    let prevIndex = (this.currentIndex - 1 + this.videoData.length) % this.videoData.length;
    this.loadVideo(prevIndex);
  }

  formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  }

  saveCookieData(url, time, vol) {
    let fileDic = getCookie("fileDic") || {};
    fileDic[url] = {
      name: this.videoData[this.currentIndex].name,
      timeFrame: Math.round(time),
      volume: parseFloat(vol).toFixed(1)
    };
    setCookie("fileDic", fileDic, 10);
  }

  setupMenu(btn) {
    const menu = document.createElement('div');
    menu.className = 'dropdown-menu';
    menu.style.display = 'none';

    const items = [
      { text: 'Set Pause Timer', icon: 'fas fa-pause', action: () => this.setTimer("pause") },
      { text: 'Set Play Timer', icon: 'fas fa-play', action: () => this.setTimer("play") },
      { text: 'Remove Playlist', icon: 'fa-solid fa-xmark', action: () => {
          this.container.remove();
          if(this.fileInput) this.fileInput.value = '';
      }}
    ];

    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'menu-item';
      div.innerHTML = `<i class="${item.icon}" style="margin-right:10px"></i>${item.text}`;
      div.onclick = () => {
        item.action();
        menu.style.display = 'none';
      };
      menu.appendChild(div);
    });

    btn.onclick = (e) => {
      e.stopPropagation();
      const rect = btn.getBoundingClientRect();
      menu.style.top = `${rect.bottom + window.scrollY}px`;
      menu.style.left = `${rect.left + window.scrollX}px`;
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    };

    document.body.appendChild(menu);
    document.addEventListener('click', () => menu.style.display = 'none');
  }


    reorderPlaylist(fromIndex, toIndex) {
        // Reorder data
        const movedItem = this.videoData.splice(fromIndex, 1)[0];
        this.videoData.splice(toIndex, 0, movedItem);

        // Maintain current playing index logic
        if (this.currentIndex === fromIndex) {
        this.currentIndex = toIndex;
        } else if (fromIndex < this.currentIndex && toIndex >= this.currentIndex) {
        this.currentIndex--;
        } else if (fromIndex > this.currentIndex && toIndex <= this.currentIndex) {
        this.currentIndex++;
        }

        this.renderPlaylistItems();
    }

    removeVideoFromPlaylist(index) {
        // Don't remove if it's the last video
        if (this.videoData.length <= 1) {
        alert("Cannot remove the last video in the playlist.");
        return;
        }

        this.videoData.splice(index, 1);

        if (index === this.currentIndex) {
        // If we removed the currently playing video, load the next one (or previous if last)
        const nextToLoad = index >= this.videoData.length ? 0 : index;
        this.loadVideo(nextToLoad);
        } else if (index < this.currentIndex) {
        // Adjust pointer if we removed something before the current video
        this.currentIndex--;
        this.renderPlaylistItems();
        } else {
        this.renderPlaylistItems();
        }
    }

  setTimer(type) {
    get_timer_time(`Set ${type} Timer`).then((time) => {
      startMediaTimer(this.videoPlayer, time, type, this.timerStatus);
    });
  }
}