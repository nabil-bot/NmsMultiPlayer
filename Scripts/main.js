

class multiPlayer {
    constructor() {
        this.medias = [];
        this.ytPlaylist = [];
        this.ytPlaylist_loaded = false;
        this.currentPlaylistIndex = 0;
        this.playlistLabel = null
        this.autoPlayCheckBox = null
        // this.playlistVolume = 80;
        this.showingPlaylist = false;
        this.playlistViewInstance = null;
        // connectors ============================
        this.browseBtn = document.getElementById('browse-btn');
        this.pasteBtn = document.getElementById('paste-btn');
        this.clearBtn = document.getElementById('clear-button');
        this.addVideoBtn = document.getElementById('add-video-btn');
        this.videosContainer = document.getElementById('videos-container');
        // this.videoUrl = document.getElementById('video-url');
        this.playAllButton = document.getElementById('play-all-button');
        this.pauseAllButton = document.getElementById('pause-all-button');
        this.clearAllButton = document.getElementById('clear-all-button');
        this.replayButton = document.getElementById('replay-button');
        this.fileInput = document.getElementById('file-input');
        this.playlistInput = document.getElementById('playlist-input');
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
    }
    browse() {sendWebViewSignal('VIDEO_BROWSE', 'Browse');}
    paste() {
      pasteFromClipboard();
    }
    clear() {document.getElementById('video-url').value = '';}

    handlePlaylistChange = (event) => {
        // Convert FileList to a real Array
        const files = Array.from(event.target.files); 

        if (files.length > 0) {
          const videoPlaylistData = files.map(file => ({
            name: file.name,
            url: URL.createObjectURL(file) 
          }));
          
          // Ensure fileInput is defined or grabbed from the event
          const playlist = new LocalVideoPlaylist(videoPlaylistData, event.target);
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


    async addYoutubeVideo(videoUrl, volume=70, isPlaylist=false, playlistVideos=[], timeFrame=0, playlistIndex=0, customPlaylist=false, saved_name=null) {
      try{
        
        if (isPlaylist){
          
          if (this.ytPlaylist.length > 0){
            const isConfirmed = confirm("There is already an playlist\nDo you want to add to curretn playlist?");
            if (!isConfirmed) return  
            
            // this.playlistVolume = volume;
            this.ytPlaylist.push(...playlistVideos);
            this.updatePlaylistLabel()
            if (this.ytPlaylist_loaded && this.playlistViewInstance) {
                this.playlistViewInstance.syncUI(); 
              }
            return
          } else{
            this.currentPlaylistIndex = playlistIndex
          }
          // this.playlistVolume = volume;
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
        iframe.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;

        // Volume UI
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


        // Enable slider for 3.5 seconds
        let volumeDisableTimer = null;
        function enableVolumeTemporarily() {
          volumeSlider.disabled = false;
          clearTimeout(volumeDisableTimer);
          volumeDisableTimer = setTimeout(() => {
            volumeSlider.disabled = true;
          }, 3500);
        }
        volumeContainer.addEventListener("mousedown", enableVolumeTemporarily);
        // volumeSlider.addEventListener("input", () => {
        //   setVolume(videoWrapper, volumeSlider.value); // this works perfectly for single video
        //   // if (isPlaylist){
        //   //   this.playlistVolume = volumeSlider.value
        //   // }
        //   if (customPlaylist){
        //     const dic = getCookie("customListDic") || {};
        //     dic.volume = volumeSlider.value;
        //     setCookie("customListDic", dic, 14);
        //   }else{
        //     const dic = getCookie("urlDic");
        //     if (dic && dic[videoUrl]) {
        //       dic[videoUrl].volume = volumeSlider.value;
        //       setCookie("urlDic", dic, 10);
        //     }
        //   }
        // });
        const videoControlsWrapper = document.createElement("div");
        videoControlsWrapper.classList.add("video-controls");

        // Menu Button
        const menuBtn = document.createElement("button");
        menuBtn.className = "MenuButton-class";

        const menuIcon = document.createElement("i");
        menuIcon.className = "fas fa-bars";
        menuBtn.appendChild(menuIcon);

        const menu = document.createElement("div");
        menu.className = "dropdown-menu";
        menu.style.display = "none";
        document.body.appendChild(menu);


        const menuItems = [
          { text: "Reload", iconClass: "fas fa-redo" },
          { text: "Set Pause Timer", iconClass: "fas fa-pause" },
          { text: "Set Play Timer", iconClass: "fas fa-play" },
          { text: "Copy Link", iconClass: "fas fa-copy" },
          { text: "Save as Playlist", iconClass: "fas fa-list" },
          { text: "Remove Unplayable", iconClass: "fa-solid fa-video-slash fa-lg" },
           {text: 'Remove', iconClass: 'fa-solid fa-xmark fa-xl'}
        ];
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
                          this.playlistViewInstance = null; // Clear the reference
                          this.ytPlaylist_loaded = false;   // Allow it to re-load next time
                      }
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
        // Playlist buttons

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

        // TIMER STATUS CONTAINER
        const timerStatus = document.createElement("div");
        timerStatus.className = "timer-status";
        timerStatus.style.display = "none"; // hidden unless active
        videoControlsWrapper.appendChild(timerStatus);

        // Append everything
        videoWrapper.append(titleBar, iframe, volumeContainer, videoControlsWrapper);

        if (isPlaylist){
          const playlistContainer = document.createElement("div");
          playlistContainer.className = "playlist-container";
          playlistContainer.id = "playlist-container";
          playlistContainer.style.display = "none";
          videoWrapper.appendChild(playlistContainer);
        }



        this.videosContainer.appendChild(videoWrapper);


        // ---- PLAYER INITIALIZATION ---- //
        const player = this.initializeYouTubeAPI(iframe, volume, timeFrame, mediaLabel, isPlaylist);


        // ---- SAVE URL PROPERTIES ---- //
        if (!customPlaylist) {
          const dic = getCookie("urlDic") || {};
          dic[videoUrl] = dic[videoUrl] || { volume, timeFrame };
          setCookie("urlDic", dic, 14);
        }

        // ------------------------------
        //   INNER FUNCTIONS
        // ------------------------------

        volumeSlider.addEventListener("input", () => {
          // setVolume(videoWrapper, volumeSlider.value); // this works perfectly for single video
          // if (isPlaylist){
          //   this.playlistVolume = volumeSlider.value
          // }
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
         alert(error); // main catch block
        }
        showHideGlobarControls();
      
      } // end of addYoutubeVideo
    updatePlaylistLabel() {
      if (this.playlistLabel)
        this.playlistLabel.textContent = `${this.currentPlaylistIndex + 1}/${this.ytPlaylist.length}`;
    }  
   

  changePlaylistVideo(dir, iframe, mediaLabel) {
        if (!this.ytPlaylist.length || this.ytPlaylist.length === 1) return;

        this.currentPlaylistIndex = (this.currentPlaylistIndex + dir + this.ytPlaylist.length) % this.ytPlaylist.length;
        this.updatePlaylistLabel();
        
        const newUrl = this.ytPlaylist[this.currentPlaylistIndex];
        const newId = getVideoId(newUrl);

        // Find the existing player instance for this iframe
        const player = players.find(p => p.getIframe() === iframe);

        if (player && typeof player.loadVideoById === 'function') {
            // Use the API to change the video smoothly
            player.loadVideoById(newId);
            
            // Update label after a short delay so the API has time to fetch the new title
            setTimeout(() => {
                if (mediaLabel) mediaLabel.textContent = player.getVideoData().title;
            }, 500);
        } else {
            // Fallback if player isn't ready: Update SRC (standard way)
            iframe.src = `https://www.youtube.com/embed/${newId}?autoplay=1&enablejsapi=1`;
        }

        if (this.playlistViewInstance) {
            this.playlistViewInstance.highlightCurrent(this.currentPlaylistIndex);
        }
    }

    initializeYouTubeAPI(iframe, volume_, timeFrame, mediaLabel, isPlaylist) {
          iframe.dataset.targetVolume = volume_;

          // Check if this iframe already has a player attached to it
          let existingPlayer = players.find(p => p.getIframe() === iframe);

          if (existingPlayer) {
              // If it exists, just update its properties/video, don't make a new one
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
                      },
                      onStateChange: (e) => {
                          // CRITICAL: Only trigger auto-advance if THIS specific instance is a playlist
                          if (e.data === YT.PlayerState.ENDED && isPlaylist) {
                              // Check checkbox here too so it doesn't fire if disabled
                              if (this.autoPlayCheckBox && this.autoPlayCheckBox.checked) {
                                  this.changePlaylistVideo(+1, iframe, mediaLabel);
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
        // 3. If the UI is live, tell it to refresh its view of the data
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
              // 1. Initialize data if it's null/empty
              let currentData = data || {}; 
              let shouldSave = false;

              // 2. Check if the name already exists
              if (currentData[playlistName]) {
                  const confirmReplace = confirm(`"${playlistName}" already exists. Replace it?`);
                  if (confirmReplace) {
                      currentData[playlistName] = { urlList: this.ytPlaylist };
                      shouldSave = true;
                  }
              } else {
                  // 3. If it doesn't exist, add it
                  currentData[playlistName] = { urlList: this.ytPlaylist };
                  shouldSave = true;
              }
              // 4. Save the updated object
              if (shouldSave) {
                  await saveDataLocal("ytPlaylist", currentData);
                  // alert("Playlist saved successfully!");
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
                    return null; // Restricted or timeout
                }
            });

            // 2. Wait for all checks to finish
            const results = await Promise.all(checkPromises);
            const validPlaylist = results.filter(url => url !== null);

            // 3. CRITICAL FIX: Update array in-place so PlaylistView sees the change
            this.ytPlaylist.splice(0, this.ytPlaylist.length, ...validPlaylist);
            
            const removedCount = originalCount - this.ytPlaylist.length;

            // 4. Adjust current index
            if (this.currentPlaylistIndex >= this.ytPlaylist.length) {
                this.currentPlaylistIndex = Math.max(0, this.ytPlaylist.length - 1);
            }
            // 5. Update UI (Now it will see the updated this.links!)
            if (this.ytPlaylist_loaded && this.playlistViewInstance) {
                await this.playlistViewInstance.refresh(this.currentPlaylistIndex);
            }
            this.updatePlaylistLabel()
            // 6. Show Result
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
          
          // Toggle the state first
          this.showingPlaylist = !this.showingPlaylist;

          if (this.showingPlaylist) {
              // We are now showing it, so show UP
              icon.classList.remove('fa-caret-down');
              icon.classList.add('fa-caret-up');
              // Add code here to actually show your playlist UI
          } else {
              // We are hiding it, so show DOWN
              icon.classList.remove('fa-caret-up');
              icon.classList.add('fa-caret-down');
              // Add code here to actually hide your playlist UI
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
                      
                      // 1. Remove from data array
                      this.ytPlaylist.splice(idx, 1);

                      // 2. Handle Index Re-calculation
                      if (this.ytPlaylist.length === 0) {
                          // Case: Playlist is now empty
                          this.currentPlaylistIndex = 0;
                          this.stopPlayer(); // Logic to clear iframe
                      } 
                      else if (idx < this.currentPlaylistIndex) {
                          // Case: Deleted something above. 
                          // We stay on the same video, but its index decreased.
                          this.currentPlaylistIndex--;
                      } 
                      else if (wasPlayingDeleted) {
                          // Case: Deleted the active video.
                          // If we deleted the last item, stay on the new last index.
                          if (this.currentPlaylistIndex >= this.ytPlaylist.length) {
                              this.currentPlaylistIndex = this.ytPlaylist.length - 1;
                          }
                          // Auto-play the "new" video at this position
                          this.changePlaylistVideo(0, iframe, mediaLabel);
                      }

                      // 3. Update the UI Highlight (Sync the blue active state)
                      if (this.playlistViewInstance) {
                          this.playlistViewInstance.highlightCurrent(this.currentPlaylistIndex);
                      }

                      this.updatePlaylistLabel()
                  },
                    onReorder: (newList) => {
                        this.ytPlaylist = newList;
                        // Save to cookies here if needed
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

// multiPlayerInstance.addYoutubeVideo("bls ");