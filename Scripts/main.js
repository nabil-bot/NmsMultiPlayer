class multiPlayer {
    constructor() {
        this.medias = [];
        this.ytPlaylist = [];
        this.ytPlaylist_loaded = false;
        this.currentPlaylistIndex = 0;
        this.playlistLabel = null
        this.autoPlayCheckBox = null
        this.showingPlaylist = false;
        this.playlistViewInstance = null;
        this.browseBtn = document.getElementById('browse-btn');
        this.pasteBtn = document.getElementById('paste-btn');
        this.clearBtn = document.getElementById('clear-button');
        this.addVideoBtn = document.getElementById('add-video-btn');
        this.videosContainer = document.getElementById('videos-container');
        this.playAllButton = document.getElementById('play-all-button');
        this.pauseAllButton = document.getElementById('pause-all-button');
        this.clearAllButton = document.getElementById('clear-all-button');
        this.replayButton = document.getElementById('replay-button');
        this.fileInput = document.getElementById('file-input');
        this.playlistInput = document.getElementById('playlist-input');
        this.audioPlayListInput = document.getElementById('audio-playlist-input');
        this.playAllButton.addEventListener('click', handlePlayAll);
        this.pauseAllButton.addEventListener('click', handlePauseAll);
        this.replayButton.addEventListener('click', replayAll);
        this.clearAllButton.addEventListener('click', clearAll);
        this.addVideoBtn.addEventListener('click', this.addVideo.bind(this));
        this.browseBtn.addEventListener('click', this.browse.bind(this));
        this.pasteBtn.addEventListener('click', this.paste.bind(this));
        this.clearBtn.addEventListener('click', this.clear.bind(this));
        this.fileInput.addEventListener('change', this.handleFileChange);
        this.playlistInput.addEventListener('change', this.handlePlaylistChange);
        this.audioPlayListInput.addEventListener('change', this.handleAudioPlaylistChange);
        this.playlistPlayer = null;
        this.playlistIframe = null;
        this.playlistMediaLabel = null;
        this.localAudioPlaylistInstance = null;
        this.singleYoutubePlayers = [];
    }
   handleMediaSignal(action) {
        if (action === 'DISCONNECTED') {
                handlePauseAll();
                return;
            }
        if (this.playlistPlayer) {  // && this.ytPlaylist.length > 0
            const state = this.playlistPlayer.getPlayerState();
            switch (action) {

                case 'PLAY':
                    this.playlistPlayer.playVideo();
                    return;

                case 'PAUSE':
                    if (state === YT.PlayerState.PLAYING) {
                        this.playlistPlayer.pauseVideo();
                    } else {
                        this.playlistPlayer.playVideo();
                    }
                    return;

                case 'NEXT':
                    this.changePlaylistVideo(
                        +1,
                        this.playlistIframe,
                        this.playlistMediaLabel
                    );
                    return;

                case 'PREVIOUS':
                    this.changePlaylistVideo(
                        -1,
                        this.playlistIframe,
                        this.playlistMediaLabel
                    );
                    return;
            }
        }
        if (this.localAudioPlaylistInstance) {

            const audioPlaylist = this.localAudioPlaylistInstance;
            const audio = audioPlaylist.audioPlayer;

            switch (action) {

                case 'PLAY':

                    audio.play().catch(err => {
                        console.log("Audio play failed:", err);
                    });

                    return;

                case 'PAUSE':

                    // Bluetooth toggle behavior
                    if (audio.paused) {
                        audio.play().catch(err => {
                            console.log("Audio play failed:", err);
                        });
                    } else {
                        audio.pause();
                    }

                    return;

                case 'NEXT':

                    audioPlaylist.playNextTrack();

                    return;

                case 'PREVIOUS':

                    audioPlaylist.playPreviousTrack();

                    return;
            }
        }
        switch (action) {

            case 'PLAY':
                handlePlayAll();
                break;

            case 'PAUSE':
                handlePauseAll();
                break;
        }
    }
    browse() {sendWebViewSignal('VIDEO_BROWSE', 'Browse');}
    paste() {
      pasteFromClipboard();
    }
    clear() {document.getElementById('video-url').value = '';}
    handlePlaylistChange = (event) => {
        const files = Array.from(event.target.files); 

        if (files.length > 0) {
          const videoPlaylistData = files.map(file => ({
            name: file.name,
            url: URL.createObjectURL(file) 
          }));
          const playlist = new LocalVideoPlaylist(videoPlaylistData, event.target);
        }
      }
    handleAudioPlaylistChange = (event) => {
        const files = Array.from(event.target.files); 
        if (files.length > 0) {
          const audioPlaylistData = files.map(file => ({
            name: file.name,
            url: URL.createObjectURL(file) 
          }));
          this.localAudioPlaylistInstance = new LocalAudioPlaylist(audioPlaylistData, event.target);
           showHideGlobarControls();
        }
    }  
    handleFileChange = (event) => {
        const files = event.target.files;
        if (files.length > 0) {
            for (const file of files) {
                const url =  URL.createObjectURL(file);
                const name = file.name
                
                let timeFrame = 0;
                let volume = 0.8;

                const fileDic = getCookie("fileDic");

                if (fileDic !== null) {
                    for (let savedUrl in fileDic) {
                        if (savedUrl == url || name == fileDic[savedUrl]["name"]) {
                            timeFrame = fileDic[savedUrl]["timeFrame"];
                            volume = fileDic[savedUrl]["volume"];
                        }
                    }
                }
                try{
                  if (file.type.startsWith('audio/')) {addAudioPlayer(url, name, timeFrame, volume, this.fileInput);}
                  else if (file.type.startsWith('video/')) {addLocalVideoPlayer(url, name, timeFrame, volume, this.fileInput);}
                  showHideGlobarControls();
                } catch (error){
                  alert(error)
                }
            }
        }
    }
    addVideo() {
      const videoUrlInput = document.getElementById('video-url');
      let videoUrl = videoUrlInput.value.trim();
      if (videoUrl.includes("facebook")) {
        addFacebookVideoPlayer(videoUrl, 70, document.getElementById("videos-container"));
        return
      }
      if (isYouTubeUrl(videoUrl)) {
        if (videoUrl.includes(",")){
          const splitedUrls = videoUrl.split(",");
          videoUrl = splitedUrls[0];
          this.addYoutubeVideo(videoUrl, 70, true, splitedUrls, 0, 0, true); 
        }else{
          this.addYoutubeVideo(videoUrl);
        }
      }
      } // end of addVideo
   
    togglePlayAfterPlaylist(videoWrapper, menuItemElement) {

    videoWrapper.playAfterPlaylist =
        !videoWrapper.playAfterPlaylist;

    const enabled = videoWrapper.playAfterPlaylist;

    menuItemElement.innerHTML =
        `<i class="fas fa-${enabled ? 'check-square' : 'square'}"
            style="margin-right:10px"></i>
         Play After Playlist Ends`;
}
    
      async addYoutubeVideo(videoUrl, volume=70, isPlaylist=false, playlistVideos=[], timeFrame=0, playlistIndex=0, customPlaylist=false, saved_name=null) {
      try{
        
        if (isPlaylist){
          if (this.ytPlaylist.length > 0){
            const isConfirmed = confirm("There is already an playlist\nDo you want to add to curretn playlist?");
            if (!isConfirmed) return  
            this.ytPlaylist.push(...playlistVideos);
            this.updatePlaylistLabel()
            if (this.ytPlaylist_loaded && this.playlistViewInstance) {
                this.playlistViewInstance.syncUI(); 
              }
            return
          } else{
            this.currentPlaylistIndex = playlistIndex
          }
          this.ytPlaylist.push(...playlistVideos);
        }
        let videoId = isPlaylist
          ? getVideoId(playlistVideos[this.currentPlaylistIndex])
          : getVideoId(videoUrl);
        
        if (!videoId) return;
        const videoWrapper = document.createElement("div");
        videoWrapper.classList.add("video-wrapper");
        const titleBar = document.createElement("div");
        titleBar.classList.add("remove-container");
        const mediaLabel = document.createElement('label');
        // mediaLabel.textContent = '';
        mediaLabel.classList.add('MediaNameLable');
        // Iframe
        const iframe = document.createElement("iframe");
        iframe.height = "252";
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
        iframe.frameBorder = "0";
        iframe.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen";
        iframe.allowFullscreen = true;
        const volumeContainer = document.createElement("div");
        volumeContainer.classList.add("volume-container");
        const speakerIcon = document.createElement("i");
        speakerIcon.classList.add("fas", "fa-volume-up", "volume-icon");
        const volumeSlider = document.createElement("input");
        volumeSlider.type = "range";
        volumeSlider.min = 0;
        volumeSlider.max = 100;
        volumeSlider.value = volume;
        volumeSlider.classList.add("slider");
        volumeSlider.disabled = true;
        volumeContainer.appendChild(speakerIcon);
        volumeContainer.appendChild(volumeSlider);
        let volumeDisableTimer = null;
        function enableVolumeTemporarily() {
          volumeSlider.disabled = false;
          clearTimeout(volumeDisableTimer);
          volumeDisableTimer = setTimeout(() => {
            volumeSlider.disabled = true;
          }, 3500);
        }
        volumeContainer.addEventListener("mousedown", enableVolumeTemporarily);
        const videoControlsWrapper = document.createElement("div");
        videoControlsWrapper.classList.add("video-controls");
        const menuBtn = document.createElement("button");
        menuBtn.className = "MenuButton-class";
        const menuIcon = document.createElement("i");
        menuIcon.className = "fas fa-bars";
        menuBtn.appendChild(menuIcon);
        const menu = document.createElement("div");
        menu.className = "dropdown-menu";
        menu.style.display = "none";
        document.body.appendChild(menu);

        const hasPlaylist = this.ytPlaylist.length > 0;

        const menuItems = [
          { text: "Reload", iconClass: "fas fa-redo" },
          { text: "Set Pause Timer", iconClass: "fas fa-pause" },
          { text: "Set Play Timer", iconClass: "fas fa-play" },
          { text: "Copy Link", iconClass: "fas fa-copy" },
          { text: "Save as Playlist", iconClass: "fas fa-list" },
          { text: "Remove Unplayable", iconClass: "fa-solid fa-video-slash fa-lg" },
           {text: 'Remove', iconClass: 'fa-solid fa-xmark fa-xl'}
        ];

        if (!isPlaylist) {
          menuItems.splice(
              menuItems.length - 1,
              0,
              {
                  text: "Play After Playlist Ends",
                  iconClass: "fas fa-list-check",
                  checkable: true
              }
          );
      }

        const onlyForPlaylist = ['Remove Unplayable', 'Save as Playlist'];
        menuItems.forEach((item) => {
          if (!isPlaylist && onlyForPlaylist.includes(item.text)) return;
          const el = document.createElement("div");
          el.className = "menu-item";

          const ic = document.createElement("i");
          ic.className = item.iconClass;
          ic.style.marginRight = "10px";
          el.appendChild(ic);
          el.append(item.text);
          el.onclick = () => {
            menu.style.display = "none";

            if (item.text === "Reload") {
              const old = iframe.src;
              iframe.src = "";
              setTimeout(() => (iframe.src = old), 25);
            }

              if (item.text === "Set Pause Timer") {
               pauseVideo();
              }
              if (item.text === "Set Play Timer")
               {
                playVideo();
              }
              if (item.text.includes("Save as Playlist")) {
                this.saveYtPlaylist(saved_name);
              }
              if (item.text === "Remove Unplayable") 
              {
                this.cleanupNonEmbeddable();
              }
              if (item.text === "Remove") 
              {
                try{
                  removeVideo(videoWrapper, videoUrl);
                  if (isPlaylist){
                      if (this.playlistViewInstance) {
                          this.playlistViewInstance.destroy();
                          this.playlistViewInstance = null; 
                          this.ytPlaylist_loaded = false; 
                      }
                      this.ytPlaylist = [];
                      this.playlistPlayer = null;
                      this.playlistIframe = null;
                      this.playlistMediaLabel = null;
                    }
                  const dic = getCookie("urlDic");
                  if (dic && dic[videoUrl]) {
                    delete dic[videoUrl];
                    Object.keys(dic).length
                      ? setCookie("urlDic", dic, 10)
                      : deleteCookie("urlDic");
                  }
                      showHideGlobarControls();
                      if (isPlaylist){
                        this.ytPlaylist = [];
                    }
                    if (customPlaylist) return deleteCookie("customListDic");
                  }catch(e){
                    alert(e);
                  }
                    }
              if (item.text === "Play After Playlist Ends") {

                if (this.ytPlaylist.length === 0) {
                    alert("No YouTube playlist available.");
                    return;
                }

                this.togglePlayAfterPlaylist(videoWrapper, el);
            }
          };
          menu.appendChild(el);
        });
        menuBtn.onclick = (e) => {
          e.stopPropagation();
          const r = menuBtn.getBoundingClientRect();
          menu.style.top = `${r.bottom + window.scrollY}px`;
          menu.style.left = `${r.left + window.scrollX}px`;
          menu.style.display = menu.style.display === "block" ? "none" : "block";
        };

        document.addEventListener("click", () => (menu.style.display = "none"));
        menu.addEventListener("click", (e) => e.stopPropagation());
        titleBar.appendChild(menuBtn);
        titleBar.appendChild(mediaLabel);
        if (isPlaylist) {
          this.playlistLabel = document.createElement("label");
          this.updatePlaylistLabel()
          this.playlistLabel.className = 'playlistSerial'
          const prevBtn = document.createElement("button");
          prevBtn.textContent = "⏮";
          prevBtn.className = "previous-btn";
          prevBtn.onclick = () => this.changePlaylistVideo(-1, iframe, mediaLabel);
          const nextBtn = document.createElement("button");
          nextBtn.textContent = "⏭";
          nextBtn.className = "next-btn";
          nextBtn.onclick = () => this.changePlaylistVideo(+1, iframe, mediaLabel);
          const playlistNavigationDiv = document.createElement("div");
          playlistNavigationDiv.className = "playlist-navigation";
          playlistNavigationDiv.append(prevBtn, this.playlistLabel, nextBtn);
          const checkBoxContainer = document.createElement("div");
          checkBoxContainer.className = "auto-play-checkbox-container";
          this.autoPlayCheckBox = document.createElement("input");
          this.autoPlayCheckBox.type = "checkbox";
          this.autoPlayCheckBox.checked = true;
          this.autoPlayCheckBox.className = "auto-play-checkbox";
          const autoPlayLabel = document.createElement("label");
          autoPlayLabel.textContent = "Auto Play";
          autoPlayLabel.className = "auto-play-label";
          checkBoxContainer.append(this.autoPlayCheckBox, autoPlayLabel);
          const showPlaylistBtn = document.createElement("button");
          const dropIcon = document.createElement("i");
          dropIcon.className = "fas fa-caret-down";
          showPlaylistBtn.append(dropIcon);
          showPlaylistBtn.className = "show-playlist-btn";
          showPlaylistBtn.id = "show-playlist-btn";
          showPlaylistBtn.onclick = () => this.showPlaylist(iframe, mediaLabel);
          videoControlsWrapper.append(playlistNavigationDiv);
          videoControlsWrapper.append(checkBoxContainer);
          videoControlsWrapper.append(showPlaylistBtn);
        }
        const timerStatus = document.createElement("div");
        timerStatus.className = "timer-status";
        timerStatus.style.display = "none"; // hidden unless active
        videoControlsWrapper.appendChild(timerStatus);
        videoWrapper.append(titleBar, iframe, volumeContainer, videoControlsWrapper);
        if (isPlaylist){
          const playlistContainer = document.createElement("div");
          playlistContainer.className = "playlist-container";
          playlistContainer.id = "playlist-container";
          playlistContainer.style.display = "none";
          videoWrapper.appendChild(playlistContainer);
        }
        this.videosContainer.appendChild(videoWrapper);
        const player = this.initializeYouTubeAPI(iframe, volume, timeFrame, mediaLabel, isPlaylist);

        if (!isPlaylist) {
            videoWrapper.playAfterPlaylist = false;
        }
        if (!customPlaylist) {
          const dic = getCookie("urlDic") || {};
          dic[videoUrl] = dic[videoUrl] || { volume, timeFrame };
          setCookie("urlDic", dic, 14);
        }
        volumeSlider.addEventListener("input", () => {
          player.setVolume(volumeSlider.value);
          if (customPlaylist){
            const dic = getCookie("customListDic") || {};
            dic.volume = volumeSlider.value;
            setCookie("customListDic", dic, 14);
          }else{
            const dic = getCookie("urlDic");
            if (dic && dic[videoUrl]) {
              dic[videoUrl].volume = volumeSlider.value;
              setCookie("urlDic", dic, 10);
            }
          }
        });
        function pauseVideo() {
          get_timer_time("Set Pause Timer").then((pauseTime) => {
            const videoPlayer = players.find(p => p.getIframe() === iframe);
            if (!videoPlayer) return;
            startMediaTimer(videoPlayer, pauseTime, "pause", timerStatus, 'youtube');
          })
          }
        function playVideo() {
          get_timer_time("Set Play Timer").then((playTime) => {
            const videoPlayer = players.find(p => p.getIframe() === iframe);
            if (!videoPlayer) return;
            startMediaTimer(videoPlayer, playTime, "play", timerStatus, 'youtube');
          })
          }  
        } catch (error) {
         alert(error); 
        }
        showHideGlobarControls();
      } // end of addYoutubeVideo
    updatePlaylistLabel() {
      if (this.playlistLabel)
        this.playlistLabel.textContent = `${this.currentPlaylistIndex + 1}/${this.ytPlaylist.length}`;
    }  
   
    notifyPlaylistEnded() {

        console.log("PLAYLIST ENDED");

        this.singleYoutubePlayers.forEach(entry => {

            console.log(
                entry.wrapper,
                entry.wrapper?.playAfterPlaylist
            );

            if (
                entry.wrapper &&
                entry.wrapper.playAfterPlaylist
            ) {

                console.log("PLAYING TARGET VIDEO");

                entry.player.playVideo();
            }
        });
    }

  changePlaylistVideo(dir, iframe, mediaLabel) {
        if (!this.ytPlaylist.length || this.ytPlaylist.length === 1) return;

        this.currentPlaylistIndex = (this.currentPlaylistIndex + dir + this.ytPlaylist.length) % this.ytPlaylist.length;
        this.updatePlaylistLabel();
        
        const newUrl = this.ytPlaylist[this.currentPlaylistIndex];
        const newId = getVideoId(newUrl);
        const player = players.find(p => p.getIframe() === iframe);

        if (player && typeof player.loadVideoById === 'function') {
            player.loadVideoById(newId);
            setTimeout(() => {
                if (mediaLabel) mediaLabel.textContent = player.getVideoData().title;
            }, 500);
        } else {
            iframe.src = `https://www.youtube.com/embed/${newId}?autoplay=1&enablejsapi=1`;
        }
        if (this.playlistViewInstance) {
            this.playlistViewInstance.highlightCurrent(this.currentPlaylistIndex);
        }
    }

    initializeYouTubeAPI(iframe, volume_, timeFrame, mediaLabel, isPlaylist) {
          iframe.dataset.targetVolume = volume_;
          let existingPlayer = players.find(p => p.getIframe() === iframe);
          if (existingPlayer) {
              existingPlayer.setVolume(Number(volume_));
              return; 
          }
          const createPlayer = () => {
              const player = new YT.Player(iframe, {
                  events: {
                      onReady: (e) => {
                          e.target.setVolume(Number(iframe.dataset.targetVolume));
                          e.target.seekTo(timeFrame);
                          
                          if (mediaLabel) {
                              const videoData = e.target.getVideoData();
                              mediaLabel.textContent = videoData.title;
                          }
                          if (!players.includes(e.target)) players.push(e.target);
                          if (isPlaylist) {
                              this.playlistPlayer = e.target;
                              this.playlistIframe = iframe;
                              this.playlistMediaLabel = mediaLabel;
                          } else {
                              this.singleYoutubePlayers.push({
                                  player: e.target,
                                  wrapper: iframe.closest(".video-wrapper")
                              });
                          }
                      },
                      onStateChange: (e) => {


                          if (e.data === YT.PlayerState.ENDED && isPlaylist) {

                            const isLastVideo =
                                this.currentPlaylistIndex >=
                                this.ytPlaylist.length - 1;

                            if (
                                !isLastVideo &&
                                this.autoPlayCheckBox &&
                                this.autoPlayCheckBox.checked
                            ) {
                                this.changePlaylistVideo(+1, iframe, mediaLabel);
                                return;
                            }

                            if (isLastVideo) {
                                this.notifyPlaylistEnded();
                            }
                        }


                          
                      },
                  },
              });
              return player;
          }

          const wait = () => {
              if (!window.YT || !YT.Player) return setTimeout(wait, 80);
              const my_player = createPlayer();
              return my_player;
          }
          const player = wait();
          return player;
          
      }
    addToYtPlaylist(url) {
      if (this.ytPlaylist.length === 0){
        this.addYoutubeVideo(url, 80, true, [url], 0, 0, true);
      } else{
        this.ytPlaylist.push(url);
        this.updatePlaylistLabel()
        if (this.ytPlaylist_loaded && this.playlistViewInstance) {
            this.playlistViewInstance.syncUI(); 
        }
      }
    }
    async saveYtPlaylist(savedName=null) {
      const PlaylistName = new Popup({
        title: "Save Playlist",
        message: "Enter a name for your playlist:",
        confirmText: "Save",
        cancelText: "Cancel",
        isInput: true,
        useBlur: true
      });
      const playlistName = await PlaylistName.show();
      if (playlistName) {
          loadDataLocal('ytPlaylist').then(async (data) => {
              let currentData = data || {}; 
              let shouldSave = false;
              if (currentData[playlistName]) {
                  const confirmReplace = confirm(`"${playlistName}" already exists. Replace it?`);
                  if (confirmReplace) {
                      currentData[playlistName] = { urlList: this.ytPlaylist };
                      shouldSave = true;
                  }
              } else {
                  currentData[playlistName] = { urlList: this.ytPlaylist };
                  shouldSave = true;
              }
              if (shouldSave) {
                  await saveDataLocal("ytPlaylist", currentData);
              }
          });
      }
      else{

      }
    } // end of saveYtPlaylist

    async cleanupNonEmbeddable() {
            const originalCount = this.ytPlaylist.length;
            
            const processingPopup = new Popup({
                title: "Scanning Playlist",
                message: "Checking videos for playback restrictions...",
                useBlur: true
            });
            processingPopup.show();

            // 1. Map every URL to a check function (runs in parallel)
            const checkPromises = this.ytPlaylist.map(async (url) => {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 3000);
                    const response = await fetch(`https://www.youtube.com/oembed?url=${url}&format=json`, { 
                        signal: controller.signal 
                    });
                    clearTimeout(timeoutId);
                    return response.ok ? url : null;
                } catch {
                    return null;
                }
            });
            const results = await Promise.all(checkPromises);
            const validPlaylist = results.filter(url => url !== null);
            this.ytPlaylist.splice(0, this.ytPlaylist.length, ...validPlaylist);
            const removedCount = originalCount - this.ytPlaylist.length;
            if (this.currentPlaylistIndex >= this.ytPlaylist.length) {
                this.currentPlaylistIndex = Math.max(0, this.ytPlaylist.length - 1);
            }
            if (this.ytPlaylist_loaded && this.playlistViewInstance) {
                await this.playlistViewInstance.refresh(this.currentPlaylistIndex);
            }
            this.updatePlaylistLabel()
            const message = removedCount > 0 
                ? `Cleaned up ${removedCount} unplayable video(s).`
                : "All videos are playable!";
            processingPopup.hide();
            new Popup({
                title: "Cleanup Complete",
                message: message,
                confirmText: "Great",
                useBlur: true
            }).show();
        }
    showPlaylist(iframe, mediaLabel) {
          const showPlaylistBtn = document.getElementById("show-playlist-btn");
          const icon = showPlaylistBtn.querySelector('i');

          const playlistContainer = document.getElementById("playlist-container");
          this.showingPlaylist = !this.showingPlaylist;

          if (this.showingPlaylist) {
              icon.classList.remove('fa-caret-down');
              icon.classList.add('fa-caret-up');
          } else {
              icon.classList.remove('fa-caret-up');
              icon.classList.add('fa-caret-down');
          }

          if (this.showingPlaylist) {
            playlistContainer.style.display = "block";
            
            // Always re-init if the data changed or hasn't been loaded
            if (!this.ytPlaylist_loaded) {
                this.playlistViewInstance = new PlaylistView(playlistContainer, this.ytPlaylist, {
                    onItemClick: (idx) => {
                      this.currentPlaylistIndex = idx;
                      this.changePlaylistVideo(0, iframe, mediaLabel);
                    },
                    onDelete: (idx) => {
                      const wasPlayingDeleted = (idx === this.currentPlaylistIndex);
                      this.ytPlaylist.splice(idx, 1);
                      if (this.ytPlaylist.length === 0) {
                          this.currentPlaylistIndex = 0;
                          this.stopPlayer(); 
                      } 
                      else if (idx < this.currentPlaylistIndex) {
                          this.currentPlaylistIndex--;
                      } 
                      else if (wasPlayingDeleted) {
                          if (this.currentPlaylistIndex >= this.ytPlaylist.length) {
                              this.currentPlaylistIndex = this.ytPlaylist.length - 1;
                          }
                          this.changePlaylistVideo(0, iframe, mediaLabel);
                      }
                      if (this.playlistViewInstance) {
                          this.playlistViewInstance.highlightCurrent(this.currentPlaylistIndex);
                      }

                      this.updatePlaylistLabel()
                  },
                    onReorder: (newList) => {
                        this.ytPlaylist = newList;
                    }
                });
                this.playlistViewInstance.init(this.currentPlaylistIndex);
                this.ytPlaylist_loaded = true;
            }
        } else {
            playlistContainer.style.display = "none";
        }
      }
}
const multiPlayerInstance = new multiPlayer();