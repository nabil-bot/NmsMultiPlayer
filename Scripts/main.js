

class multiPlayer {
    constructor() {
        this.medias = [];
        this.ytPlaylist = [];
        this.currentPlaylistIndex = 0;
        this.playlistLabel = null
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
        this.playAllButton.addEventListener('click', handlePlayAll);
        this.pauseAllButton.addEventListener('click', handlePauseAll);
        this.replayButton.addEventListener('click', replayAll);
        this.clearAllButton.addEventListener('click', clearAll);
        this.addVideoBtn.addEventListener('click', this.addVideo.bind(this));
        this.browseBtn.addEventListener('click', this.browse.bind(this));
        this.pasteBtn.addEventListener('click', this.paste.bind(this));
        this.clearBtn.addEventListener('click', this.clear.bind(this));
        this.fileInput.addEventListener('change', this.handleFileChange);
    }


    browse() {sendWebViewSignal('VIDEO_BROWSE', 'Browse');}
    paste() {
      pasteFromClipboard();
    }
    clear() {document.getElementById('video-url').value = '';}
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

      if (isYouTubeUrl(videoUrl)) {
        this.addYoutubeVideo(videoUrl);
      }
    }

    async addYoutubeVideo(videoUrl, volume=70, isPlaylist=false, playlistVideos=[], timeFrame=0, playlistIndex=0, customPlaylist=false) {
      try{
        
        if (isPlaylist){
          if (this.ytPlaylist.length > 0){
            const isConfirmed = confirm("Do you want to add to curretn playlist?");
            if (!isConfirmed) return  
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

        // Save and apply volume
        volumeSlider.addEventListener("input", () => {
          setVolume(videoWrapper, volumeSlider.value);
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


        // Controls Area
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
        ];


        menuItems.forEach((item) => {
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

            if (item.text === "Set Pause Timer") pauseVideo();
            if (item.text === "Set Play Timer") playVideo();
            
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
        videoControlsWrapper.appendChild(menuBtn);

        // Playlist buttons

        if (isPlaylist) {
          this.playlistLabel = document.createElement("label");
          this.playlistLabel.textContent = `${this.currentPlaylistIndex + 1}/${this.ytPlaylist.length}`;
          this.playlistLabel.className = 'playlistSerial'
          
          
          const prevBtn = document.createElement("button");
          prevBtn.textContent = "⏮";
          prevBtn.className = "previous-btn";
          prevBtn.onclick = () => this.changePlaylistVideo(-1, iframe);

          const nextBtn = document.createElement("button");
          nextBtn.textContent = "⏭";
          nextBtn.className = "next-btn";
          nextBtn.onclick = () => this.changePlaylistVideo(+1, iframe);

          videoControlsWrapper.append(prevBtn, this.playlistLabel, nextBtn);

        }

        // TIMER STATUS CONTAINER
        const timerStatus = document.createElement("div");
        timerStatus.className = "timer-status";
        timerStatus.style.display = "none"; // hidden unless active
        videoControlsWrapper.appendChild(timerStatus);

        // Remove button
        const removeBtn = document.createElement("button");
        const removeIcon = document.createElement("i");
        removeIcon.className = "fa-solid fa-xmark fa-xl";
        removeBtn.appendChild(removeIcon);
        removeBtn.className = "remove-btn";



        removeBtn.onclick = () => {
            try{
              removeVideo(videoWrapper, videoUrl);
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
          };
        
        videoControlsWrapper.appendChild(removeBtn);

        // Append everything
        videoWrapper.append(iframe, volumeContainer, videoControlsWrapper);
        this.videosContainer.appendChild(videoWrapper);


        // ---- PLAYER INITIALIZATION ---- //
        this.initializeYouTubeAPI(iframe, volume, timeFrame);


        // ---- SAVE URL PROPERTIES ---- //
        if (!customPlaylist) {
          const dic = getCookie("urlDic") || {};
          dic[videoUrl] = dic[videoUrl] || { volume, timeFrame };
          setCookie("urlDic", dic, 14);
        }

        // ------------------------------
        //   INNER FUNCTIONS
        // ------------------------------


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

    changePlaylistVideo(dir, iframe) {
          if (!this.ytPlaylist.length) 
            return;

          this.currentPlaylistIndex =
            (this.currentPlaylistIndex + dir + this.ytPlaylist.length) %
            this.ytPlaylist.length;
          if (this.playlistLabel)
            this.playlistLabel.textContent = `${this.currentPlaylistIndex + 1}/${this.ytPlaylist.length}`;
          const newUrl = this.ytPlaylist[this.currentPlaylistIndex];
          const newId = getVideoId(newUrl);

          iframe.src = `https://www.youtube.com/embed/${newId}?autoplay=1&enablejsapi=1`;
          
          this.initializeYouTubeAPI(iframe, volumeSlider.value, 0);

          if (customPlaylist) {
            const dic = getCookie("customListDic") || {};
            dic.currentIndex = this.currentPlaylistIndex;
            setCookie("customListDic", dic, 14);
          }
        }  

    initializeYouTubeAPI(iframe, volume, timeFrame) {
            function createPlayer() {
              const player = new YT.Player(iframe, {
                events: {
                  onReady(e) {
                    e.target.setVolume(volume);
                    e.target.seekTo(timeFrame);

                    if (!players.includes(e.target)) players.push(e.target);

                    // Force volume after player loads to fix autoplay-volume delay
                    setTimeout(() => {
                      try {
                        player.setVolume(volume);
                      } catch {}
                    }, 300);
                  },

                  onStateChange(e) {
                    if (e.data === YT.PlayerState.ENDED) return this.changePlaylistVideo(+1, iframe);

                    if (e.data === YT.PlayerState.PAUSED) {
                      const dic = getCookie("urlDic");
                      if (dic && dic[videoUrl]) {
                        dic[videoUrl].timeFrame = Math.floor(player.getCurrentTime());
                        setCookie("urlDic", dic, 10);
                      }
                    }
                  },
                },
              });
            }

            function wait() {
              if (!window.YT || !YT.Player) return setTimeout(wait, 80);
              createPlayer();
            }
            wait();
      }
    
    addToYtPlaylist(url) {
      // alert(this.ytPlaylist.length);
      if (this.ytPlaylist.length === 0){
        this.addYoutubeVideo(url, 80, true, [url], 0, 0, true);
      } else{
        this.ytPlaylist.push(url);
        this.playlistLabel.textContent = `${this.currentPlaylistIndex + 1}/${this.ytPlaylist.length}`;
      }
    }

}

const multiPlayerInstance = new multiPlayer();

// multiPlayerInstance.addYoutubeVideo("bls ");