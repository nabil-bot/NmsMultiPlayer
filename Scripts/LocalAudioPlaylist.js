class LocalAudioPlaylist {
  /**
   * @param {Array<{name: string, url: string}>} playlistData 
   * @param {HTMLInputElement} fileInput - The file input node to reset on removal
   */
  constructor(playlistData, fileInput) {
    this.playlist = playlistData;
    this.fileInput = fileInput;
    this.currentIndex = 0;
    this.defaultVolume = 0.8;
    this.disableTimer = null;
    this.disableVolumeTimer = null;
    this.timeUpdateTimerId = null;

    // Root target container matching your layout structure
    this.videosContainer = document.getElementById('videos-container');
    
    if (!this.playlist || this.playlist.length === 0) return;

    this._init();
  }

  async _init() {
    const currentTrack = this.playlist[this.currentIndex];

    // Build the container using the exact class naming patterns of the video module
    this.videoContainer = document.createElement('div');
    this.videoContainer.classList.add('video-local-container', 'audio-playlist-container');

    // Primary audio engine setup
    this.audioPlayer = document.createElement('audio');
    this.audioPlayer.className = 'local-video-player local-audio-player';
    this.audioPlayer.src = currentTrack.url;
    this.audioPlayer.controls = false;
    this.audioPlayer.loop = false;
    this.audioPlayer.volume = this.defaultVolume;

    // Play/Pause Engine Control Trigger
    this.playPauseBtn = document.createElement('button');
    this.playPauseBtn.classList.add('video-play-pause');
    this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';

    this.playPauseBtn.addEventListener('click', () => this.togglePlayback());

    // Timeline Slider Structure
    this.sliderContainer = document.createElement('div');
    this.sliderContainer.classList.add('slider-container');
    
    this.timelineSlider = document.createElement('input');
    this.timelineSlider.classList.add('timeline-slider');
    this.timelineSlider.type = 'range';
    this.timelineSlider.min = '0';
    this.timelineSlider.value = '0';
    this.timelineSlider.step = '1';
    this.timelineSlider.disabled = true;

    this.sliderContainer.addEventListener('mousedown', () => {
      if (this.timelineSlider.disabled) this.enableSlider();
    });

    this.timelineSlider.addEventListener('input', () => {
      this.audioPlayer.currentTime = this.timelineSlider.value;
      this.enableSlider();
    });

    // Skip modifications
    this.backwardButton = document.createElement('button');
    this.backwardButton.textContent = '-10s';
    this.backwardButton.addEventListener('click', () => {
      this.audioPlayer.currentTime -= 10;
    });

    this.forwardButton = document.createElement('button');
    this.forwardButton.textContent = '+10s';
    this.forwardButton.addEventListener('click', () => {
      this.audioPlayer.currentTime += 10;
    });

    // Track Navigation Buttons
    this.prevTrackBtn = document.createElement('button');
    this.prevTrackBtn.innerHTML = '<i class="fas fa-step-backward"></i>';
    this.prevTrackBtn.addEventListener('click', () => this.playPreviousTrack());

    this.nextTrackBtn = document.createElement('button');
    this.nextTrackBtn.innerHTML = '<i class="fas fa-step-forward"></i>';
    this.nextTrackBtn.addEventListener('click', () => this.playNextTrack());

    // Speed Selection Module
    this.speedSelect = document.createElement('select');
    [0.5, 0.75, 1, 1.15, 1.25, 1.5, 1.75, 2].forEach(speed => {
      const option = document.createElement('option');
      option.value = speed;
      option.textContent = `${speed}x`;
      this.speedSelect.appendChild(option);
    });
    this.speedSelect.value = 1;
    this.speedSelect.addEventListener('change', () => {
      this.audioPlayer.playbackRate = this.speedSelect.value;
    });

    // Loop Engine Track Control
    this.loopBtn = document.createElement('button');
    this.loopIcon = document.createElement('i');
    this.loopIcon.className = 'fa-solid fa-repeat';
    this.loopBtn.appendChild(this.loopIcon);
    this.loopBtn.addEventListener('click', () => this.toggleLoop());

    // Volume Layer Component Architecture
    this.volumeContainer = document.createElement('div');
    this.volumeContainer.classList.add('volume-container');
    
    this.speakerIcon = document.createElement('i');
    this.speakerIcon.classList.add('fas', 'fa-volume-up', 'volume-icon');
    this.volumeContainer.appendChild(this.speakerIcon);

    this.volumeSlider = document.createElement('input');
    this.volumeSlider.type = 'range';
    this.volumeSlider.min = 0;
    this.volumeSlider.max = 1;
    this.volumeSlider.step = 0.01;
    this.volumeSlider.value = this.defaultVolume;
    this.volumeSlider.classList.add('slider');
    this.volumeContainer.appendChild(this.volumeSlider);
    this.volumeSlider.disabled = true;

    this.volumeContainer.addEventListener('mousedown', () => {
      if (this.volumeSlider.disabled) this.enableVolumeSlider();
    });

    this.volumeSlider.addEventListener('input', () => {
      const activeUrl = this.playlist[this.currentIndex].url;
      this.audioPlayer.volume = this.volumeSlider.value;
      this.enableVolumeSlider();
      
      let fileDic = getCookie("fileDic");
      if (fileDic !== null && activeUrl in fileDic) {
        let floatValue = parseFloat(this.volumeSlider.value);
        fileDic[activeUrl]["volume"] = floatValue.toFixed(1);
        setCookie("fileDic", fileDic, 10);
      }
    });

    // Time Indicators
    this.currentTimeLabel = document.createElement('span');
    this.currentTimeLabel.className = 'time-label';
    this.durationLabel = document.createElement('span');
    this.durationLabel.className = 'time-label';
    this.durationLabel.textContent = '00:00';

    // Core Event Handlers for Player
    this.audioPlayer.addEventListener('timeupdate', () => this.handleTimeUpdate());
    this.audioPlayer.addEventListener('loadedmetadata', () => this.handleMetadataLoad());
    this.audioPlayer.addEventListener('play', () => {
      this.playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    });
    this.audioPlayer.addEventListener('pause', () => {
      this.playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    });
    this.audioPlayer.addEventListener('ended', () => this.handleTrackEnded());
    this.audioPlayer.addEventListener('error', (e) => console.error('Failed to load audio source:', e.message));

    // Controller Wrapper Assembly
    this.volumeControllerContainer = document.createElement('div');
    this.volumeControllerContainer.classList.add('volumeControlerContainer');
    this.volumeControllerContainer.appendChild(this.volumeContainer);

    this.otherVideoControllersContainer = document.createElement('div');
    this.otherVideoControllersContainer.classList.add('otherVideoControllersContainer');
    this.otherVideoControllersContainer.appendChild(this.prevTrackBtn);
    this.otherVideoControllersContainer.appendChild(this.playPauseBtn);
    this.otherVideoControllersContainer.appendChild(this.nextTrackBtn);
    this.otherVideoControllersContainer.appendChild(this.backwardButton);
    this.otherVideoControllersContainer.appendChild(this.forwardButton);
    this.otherVideoControllersContainer.appendChild(this.loopBtn);
    this.otherVideoControllersContainer.appendChild(this.speedSelect);

    this.videoControls = document.createElement('div');
    this.videoControls.classList.add('local-video-controls');
    this.videoControls.appendChild(this.otherVideoControllersContainer);
    this.videoControls.appendChild(this.volumeControllerContainer);

    this.timerStatus = document.createElement("div");
    this.timerStatus.className = "video-counter-label";
    this.timerStatus.style.display = "inline-block"; 
    this.timerStatus.style.margin = "0 10px";
    this.timerStatus.textContent = `[${this.currentIndex + 1} / ${this.playlist.length}]`;

    this.timeLabelContainer = document.createElement('div');
    this.timeLabelContainer.classList.add('timelabelContainer');
    this.timeLabelContainer.appendChild(this.currentTimeLabel);
    this.timeLabelContainer.appendChild(this.timerStatus);
    this.timeLabelContainer.appendChild(this.durationLabel);

    // Context Header Elements (Dropdown Actions)
    this.videoFileLabel = document.createElement('label');
    this.videoFileLabel.textContent = currentTrack.name;
    this.videoFileLabel.classList.add('VideoFileName');

    this.MenuButton = document.createElement('button');
    this.MenuButton.className = 'MenuButton-class';
    this.MenuButton.innerHTML = '<i class="fas fa-bars"></i>';

    this.menu = document.createElement('div');
    this.menu.className = 'dropdown-menu';
    this.menu.style.display = 'none';

    const menuItems = [
      { text: 'Set Pause Timer', iconClass: 'fas fa-pause' },
      { text: 'Set Play Timer', iconClass: 'fas fa-play' },
      { text: 'Remove Playlist', iconClass: 'fa-solid fa-xmark fa-xl' }
    ];

    menuItems.forEach(item => {
      const menuItem = document.createElement('div');
      menuItem.className = 'menu-item';
      const menuIcon = document.createElement('i');
      menuIcon.className = item.iconClass;
      menuIcon.style.marginRight = '10px';
      menuItem.appendChild(menuIcon);
      menuItem.appendChild(document.createTextNode(item.text));

      menuItem.addEventListener('click', () => {
        if (item.text === 'Set Pause Timer') {
          get_timer_time(`Set Pause Timer`).then((pauseTime) => {
            startMediaTimer(this.audioPlayer, pauseTime, "pause", this.timerStatus);
          });
        } else if (item.text === "Set Play Timer") {
          get_timer_time(`Set Play Timer`).then((playTime) => {
            startMediaTimer(this.audioPlayer, playTime, "play", this.timerStatus);
          });
        } else if (item.text === 'Remove Playlist') {
          this.destroy();
        }
        this.menu.style.display = 'none';
      });
      this.menu.appendChild(menuItem);
    });

    document.body.appendChild(this.menu);

    this.MenuButton.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.menu.style.display === 'none' || this.menu.style.display === '') {
        const rect = this.MenuButton.getBoundingClientRect();
        this.menu.style.top = `${rect.bottom + window.scrollY}px`;
        this.menu.style.left = `${rect.left + window.scrollX}px`;
        this.menu.style.display = 'block';
      } else {
        this.menu.style.display = 'none';
      }
    });

    document.addEventListener('click', () => {
      this.menu.style.display = 'none';
    });

    this.menu.addEventListener('click', (e) => e.stopPropagation());

    this.removeContainer = document.createElement('div');
    this.removeContainer.classList.add('remove-container');
    this.removeContainer.appendChild(this.MenuButton);
    this.removeContainer.appendChild(this.videoFileLabel);

    this.sliderContainer.appendChild(this.timelineSlider);
    this.sliderContainer.appendChild(this.timeLabelContainer);

    this.videoContainer.appendChild(this.removeContainer);
    this.videoContainer.appendChild(this.audioPlayer);
    this.videoContainer.appendChild(this.sliderContainer);
    this.videoContainer.appendChild(this.videoControls);
    this.videosContainer.appendChild(this.videoContainer);

    this._initializeCookies(currentTrack.url, currentTrack.name);
  }

  togglePlayback() {
    if (!this.audioPlayer.paused) {
      this.audioPlayer.pause();
    } else {
      this.audioPlayer.play().catch(err => console.log("Audio play blocked:", err));
    }
  }

  toggleLoop() {
    this.audioPlayer.loop = !this.audioPlayer.loop;
    if (this.audioPlayer.loop) {
      this.loopIcon.className = 'fa-solid fa-redo-alt';
    } else {
      this.loopIcon.className = 'fa-solid fa-repeat';
    }
  }

  enableSlider() {
    this.timelineSlider.disabled = false;
    clearTimeout(this.disableTimer);
    this.disableTimer = setTimeout(() => {
      this.timelineSlider.disabled = true;
    }, 3000);
  }

  enableVolumeSlider() {
    this.volumeSlider.disabled = false;
    clearTimeout(this.disableVolumeTimer);
    this.disableVolumeTimer = setTimeout(() => {
      this.volumeSlider.disabled = true;
    }, 3500);
  }

  formatTime(timeInSeconds) {
    if (isNaN(timeInSeconds)) return "00:00";
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const formattedHours = hours > 0 ? `${hours < 10 ? '0' : ''}${hours}:` : '';
    const formattedMinutes = `${minutes < 10 ? '0' : ''}${minutes}`;
    const formattedSeconds = `${seconds < 10 ? '0' : ''}${seconds}`;
    return `${formattedHours}${formattedMinutes}:${formattedSeconds}`;
  }

  handleTimeUpdate() {
    const activeUrl = this.playlist[this.currentIndex].url;
    this.currentTimeLabel.textContent = this.formatTime(this.audioPlayer.currentTime);
    this.timelineSlider.value = this.audioPlayer.currentTime;
    this.timelineSlider.max = this.audioPlayer.duration || 0;
    this.durationLabel.textContent = this.formatTime(this.audioPlayer.duration);

    clearTimeout(this.timeUpdateTimerId);
    this.timeUpdateTimerId = setTimeout(() => {
      let fileDic = getCookie("fileDic");
      if (fileDic !== null && activeUrl in fileDic) {
        fileDic[activeUrl]["timeFrame"] = Math.round(this.audioPlayer.currentTime);
        setCookie("fileDic", fileDic, 10);
      }
    }, 1000);
  }

  handleMetadataLoad() {
    const activeUrl = this.playlist[this.currentIndex].url;
    let fileDic = getCookie("fileDic");
    if (fileDic !== null && fileDic[activeUrl] !== undefined) {
      this.audioPlayer.currentTime = fileDic[activeUrl]["timeFrame"] || 0;
      this.audioPlayer.volume = fileDic[activeUrl]["volume"] || this.defaultVolume;
      this.volumeSlider.value = fileDic[activeUrl]["volume"] || this.defaultVolume;
    }
    this.timelineSlider.max = this.audioPlayer.duration || 0;
    this.durationLabel.textContent = this.formatTime(this.audioPlayer.duration);
  }

  handleTrackEnded() {
    if (!this.audioPlayer.loop) {
      this.playNextTrack();
    }
  }

  changeTrack(index) {
    if (index >= 0 && index < this.playlist.length) {
      // FIX 2: Capture current runtime volume level BEFORE swapping sources
      const currentSelectedVolume = this.volumeSlider.value;

      this.currentIndex = index;
      const track = this.playlist[this.currentIndex];
      
      this.audioPlayer.src = track.url;
      this.videoFileLabel.textContent = track.name;
      
      // FIX 1 (cont.): Dynamic text upgrade to update your list index label
      if (this.timerStatus) {
        this.timerStatus.textContent = `[${this.currentIndex + 1} / ${this.playlist.length}]`;
      }

      this._initializeCookies(track.url, track.name);

      // FIX 2 (cont.): Explicitly push the runtime volume setting onto the newly initialized track engine
      this.audioPlayer.volume = currentSelectedVolume;

      this.audioPlayer.play().catch(err => console.log("Autoplay blocked on track swap:", err));
    }
  }

  playNextTrack() {
    if (this.currentIndex < this.playlist.length - 1) {
      this.changeTrack(this.currentIndex + 1);
    } else {
      this.changeTrack(0);
    }
  }

  playPreviousTrack() {
    if (this.currentIndex > 0) {
      this.changeTrack(this.currentIndex - 1);
    } else {
      this.changeTrack(this.playlist.length - 1);
    }
  }

 _initializeCookies(url, name) {
  try {
    let fileDic = getCookie("fileDic") || {};
    if (!(url in fileDic)) {
      // Use the current slider value if it exists, otherwise fall back to default
      const currentVolume = this.volumeSlider ? parseFloat(this.volumeSlider.value) : this.defaultVolume;

      fileDic[url] = {
        name: name,
        timeFrame: 0,
        volume: currentVolume
      };
      const sanitizedDic = typeof keepLastFiveElements === 'function' ? keepLastFiveElements(fileDic) : fileDic;
      setCookie("fileDic", sanitizedDic, 10);
    }
  } catch (error) {
    console.error("Cookie execution failure inside Audio Engine:", error);
  }
}

  destroy() {
    clearTimeout(this.disableTimer);
    clearTimeout(this.disableVolumeTimer);
    clearTimeout(this.timeUpdateTimerId);
    
    this.audioPlayer.pause();
    this.videoContainer.remove();
    this.menu.remove();
    
    if (this.fileInput) {
      this.fileInput.value = '';
    }
    
    if (typeof showHideGlobarControls === 'function') {
      showHideGlobarControls();
    }

    if (window.multiPlayerInstance) {
        window.multiPlayerInstance.localAudioPlaylistInstance = null;
    }
  }
}