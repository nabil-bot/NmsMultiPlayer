
async function addLocalVideoPlayer(url, name="", timeFrame = 0, defaultVolume=0.8, fileInput) {
  return new Promise((resolve, reject) => {
    const videosContainer = document.getElementById('videos-container');
    const videoContainer = document.createElement('div');
    videoContainer.classList.add('video-local-container');
    const videoPlayer = document.createElement('video');

    videoPlayer.className = 'local-video-player';
    videoPlayer.src = url;
    videoPlayer.controls = false; // We'll use custom controls
    videoPlayer.loop = false;
    // Set default volume, if you want a video-specific default
    videoPlayer.volume = defaultVolume;
    const playPauseBtn = document.createElement('button');
    playPauseBtn.classList.add('video-play-pause');
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';

    function handlePlay() {
      playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }
    function handlePause() {
      playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
    function playPauseVideoPlayer() {
      if (!videoPlayer.paused) {
        videoPlayer.pause();
      } else {
        videoPlayer.play();
      }
    }

    playPauseBtn.addEventListener('click', function() {
      playPauseVideoPlayer();
    });
    const sliderContainer = document.createElement('div');
    sliderContainer.classList.add('slider-container');
    const timelineSlider = document.createElement('input');
    timelineSlider.classList.add('timeline-slider');
    timelineSlider.type = 'range';
    timelineSlider.min = '0';
    timelineSlider.value = '0';
    timelineSlider.step = '1';
    timelineSlider.disabled = true;

    let disableTimer;
    function enableSlider() {
      timelineSlider.disabled = false;
      try {
        clearTimeout(disableTimer);
      } catch (error) {
        console.error('Error clearing timeout:', error);
      }
      disableTimer = setTimeout(() => {
        timelineSlider.disabled = true;
      }, 3000);
    }
    
    // Use mousedown/touchstart for better mobile compatibility
    sliderContainer.addEventListener('mousedown', () => {
      if (timelineSlider.disabled) {
        enableSlider();
      }
    });

    // 4. Time Jump Buttons
    const backwardButton = document.createElement('button');
    backwardButton.textContent = '-10s';
    backwardButton.addEventListener('click', () => {
      videoPlayer.currentTime -= 10;
    });

    const forwardButton = document.createElement('button');
    forwardButton.textContent = '+10s';
    forwardButton.addEventListener('click', () => {
      videoPlayer.currentTime += 10;
    });

    // 5. Playback Speed Selector
    const speedSelect = document.createElement('select');
    [0.5, 0.75, 1, 1.15, 1.25, 1.5, 1.75, 2].forEach(speed => {
      const option = document.createElement('option');
      option.value = speed;
      option.textContent = `${speed}x`;
      speedSelect.appendChild(option);
    });
    speedSelect.value = 1;
    speedSelect.addEventListener('change', () => {
      videoPlayer.playbackRate = speedSelect.value;
    });
    // 6. Fullscreen Button
    const fullscreenButton = document.createElement('button');
    fullscreenButton.innerHTML = '<i class="fas fa-expand"></i>';
    // fullscreenButton.addEventListener('click', () => {
    //   videoPlayer.requestFullscreen();
    // });

    fullscreenButton.addEventListener('click', () => {
    // Check if the document is currently in fullscreen mode
    if (document.fullscreenElement) {
        // --- EXIT FULLSCREEN ---
        document.exitFullscreen();
        
        // Unlock screen orientation when exiting fullscreen
        if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
        }

    } else {
        videoPlayer.requestFullscreen()
            .then(() => {
                // Lock screen orientation to Landscape only AFTER fullscreen is active
                if (screen.orientation && screen.orientation.lock) {
                    // Try to lock to primary landscape, or fallback to any landscape
                    screen.orientation.lock('landscape-primary')
                        .catch(error => {
                            // Fallback if primary is not supported or if there's an issue
                            console.warn("Could not lock to landscape-primary, trying 'landscape':", error);
                            screen.orientation.lock('landscape')
                        });
                }
            })
            .catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
    }
});
    // 7. Volume Control
    const volumeContainer = document.createElement('div');
    volumeContainer.classList.add('volume-container');
    const speakerIcon = document.createElement('i');
    speakerIcon.classList.add('fas', 'fa-volume-up', 'volume-icon');
    volumeContainer.appendChild(speakerIcon);

    const volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.min = 0;
    volumeSlider.max = 1;
    volumeSlider.step = 0.01;
    volumeSlider.value = defaultVolume; // Initial volume
    volumeSlider.classList.add('slider');
    volumeContainer.appendChild(volumeSlider);

    volumeSlider.disabled = true;
    let disableVolumeTimer;
    function enableVolumeSlider() {
      volumeSlider.disabled = false;
      try {
        clearTimeout(disableVolumeTimer);
      } catch (error) {
        console.error('Error clearing timeout:', error);
      }
      disableVolumeTimer = setTimeout(() => {
        volumeSlider.disabled = true;
      }, 3500);
    }

    volumeContainer.addEventListener('mousedown', () => {
      if (volumeSlider.disabled) {
        enableVolumeSlider();
      }
    });

    volumeSlider.addEventListener('input', () => {
      videoPlayer.volume = volumeSlider.value;
      enableVolumeSlider();
      // Update cookie data for volume
      var fileDic = getCookie("fileDic");
      if (fileDic !== null && url in fileDic) {
        let floatValue = parseFloat(volumeSlider.value);
        let formattedValue = floatValue.toFixed(1);
        fileDic[url]["volume"] = formattedValue;
        setCookie("fileDic", fileDic, 10);
      }
    });
    
    // 7. Time Labels
    const currentTimeLabel = document.createElement('span');
    currentTimeLabel.className = 'time-label';
    const durationLabel = document.createElement('span');
    durationLabel.className = 'time-label';
    durationLabel.textContent = '0:0'; 

    // Helper function to format time (same as audio player)
    const formatTime = (timeInSeconds) => {
        const hours = Math.floor(timeInSeconds / 3600);
        const minutes = Math.floor((timeInSeconds % 3600) / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        const formattedHours = hours > 0 ? `${hours < 10 ? '0' : ''}${hours}:` : '';
        const formattedMinutes = `${minutes < 10 ? '0' : ''}${minutes}`;
        const formattedSeconds = `${seconds < 10 ? '0' : ''}${seconds}`;
        return `${formattedHours}${formattedMinutes}:${formattedSeconds}`;
    };
    
    // 8. Video Element Event Listeners
    videoPlayer.addEventListener('timeupdate', () => {
      currentTimeLabel.textContent = formatTime(videoPlayer.currentTime);
      timelineSlider.value = videoPlayer.currentTime;
      timelineSlider.max = videoPlayer.duration;
      durationLabel.textContent = `${formatTime(videoPlayer.duration)}`;
      
      timeUpdateTimerId = setTimeout(() => {
        var fileDic = getCookie("fileDic");
        if (fileDic !== null && url in fileDic) {
          // Save the rounded time to prevent excessive decimal usage
          fileDic[url]["timeFrame"] = Math.round(videoPlayer.currentTime);
          setCookie("fileDic", fileDic, 10);
        }
      }, 1000); // Saves the time only once per second (1000ms)
    });

    videoPlayer.addEventListener('loadedmetadata', () => {
      // Load saved state from cookie on metadata load
      var fileDic = getCookie("fileDic");
      if (fileDic !== null && fileDic[url] !== undefined) {
        videoPlayer.currentTime = fileDic[url]["timeFrame"];
        videoPlayer.volume = fileDic[url]["volume"];
        // Also update the volume slider to reflect the loaded volume
        volumeSlider.value = fileDic[url]["volume"]; 
      }
    });

    videoPlayer.addEventListener('error', (e) => {
      console.error('Failed to load video:', e.message);
    });

    videoPlayer.addEventListener('play', handlePlay);
    videoPlayer.addEventListener('pause', handlePause);

    timelineSlider.addEventListener('input', () => {
      videoPlayer.currentTime = timelineSlider.value;
      enableSlider();
    });

    // 9. Loop Button (using the audio player's logic)
    function toggleLoop() {
        videoPlayer.loop = !videoPlayer.loop;
        if (videoPlayer.loop) {
            loopIcon.classList.remove('fa-solid', 'fa-repeat');
            loopIcon.classList.add('fa-solid', 'fa-redo-alt'); 
        } else {
            loopIcon.classList.remove('fa-solid', 'fa-redo-alt');
            loopIcon.classList.add('fa-solid', 'fa-repeat');
        }
    }
    const loopBtn = document.createElement('button');
    const loopIcon = document.createElement('i');
    loopIcon.className = 'fa-solid fa-repeat';
    loopBtn.appendChild(loopIcon);
    loopBtn.addEventListener('click', toggleLoop);

    // 10. Volume Controller Container
    const volumeControlerContainer = document.createElement('div');
    volumeControlerContainer.classList.add('volumeControlerContainer');
    volumeControlerContainer.appendChild(volumeContainer);
    
    // 11. Other Controllers Container
    const otherVideoControllersContainer = document.createElement('div');
    otherVideoControllersContainer.classList.add('otherVideoControllersContainer');
    otherVideoControllersContainer.appendChild(playPauseBtn);
    otherVideoControllersContainer.appendChild(backwardButton);
    otherVideoControllersContainer.appendChild(forwardButton);
    otherVideoControllersContainer.appendChild(loopBtn);
    otherVideoControllersContainer.appendChild(speedSelect);
    otherVideoControllersContainer.appendChild(fullscreenButton);

    // 12. Main Controls Container
    const videoControls = document.createElement('div');
    videoControls.classList.add('local-video-controls');
    videoControls.appendChild(otherVideoControllersContainer);
    videoControls.appendChild(volumeControlerContainer);


    const timerStatus = document.createElement("div");
    timerStatus.className = "timer-status";
    timerStatus.style.display = "none";


    // 13. Time Label Container
    const timeLabelContainer = document.createElement('div');
    timeLabelContainer.classList.add('timelabelContainer');
    timeLabelContainer.appendChild(currentTimeLabel);
    timeLabelContainer.appendChild(timerStatus);
    timeLabelContainer.appendChild(durationLabel);
    
    // 14. File Label and Remove Button
    const videoFileLabel = document.createElement('label');
    videoFileLabel.textContent = name;
    videoFileLabel.classList.add('VideoFileName');
    
    // 15. Menu Button (using the audio player's logic)
    const MenuButton = document.createElement('button');
    MenuButton.className = 'MenuButton-class';
    const icon = document.createElement('i');
    icon.className = 'fas fa-bars';
    MenuButton.appendChild(icon);

    const menu = document.createElement('div');
    menu.className = 'dropdown-menu';
    menu.style.display = 'none';

    const menuItems = [
      { text: 'Set Pause Timer', iconClass: 'fas fa-pause' },
      { text: "Set Play Timer", iconClass: "fas fa-play" },
      { text: 'Toggle Fullscreen', iconClass: 'fas fa-expand' }, // Video specific menu item
      { text: 'Remove', iconClass: 'fa-solid fa-xmark fa-xl'}
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
        if (item.text == 'Set Pause Timer') {
          setPauseTimer();
        } 
        else if (item.text == "Set Play Timer") {
          setPlayTimer();
        }
        else if (item.text == 'Toggle Fullscreen') {
            if (videoPlayer.requestFullscreen) {
                videoPlayer.requestFullscreen();
            } else if (videoPlayer.mozRequestFullScreen) { // Firefox
                videoPlayer.mozRequestFullScreen();
            } else if (videoPlayer.webkitRequestFullscreen) { // Chrome, Safari and Opera
                videoPlayer.webkitRequestFullscreen();
            } else if (videoPlayer.msRequestFullscreen) { // IE/Edge
                videoPlayer.msRequestFullscreen();
            }
        } else if (item.text == 'Remove'){
          videoContainer.remove();
          fileInput.value = '';
          showHideGlobarControls();
        }

        menu.style.display = 'none';
      });
      menu.appendChild(menuItem);
    });
    
    document.body.appendChild(menu);

    MenuButton.addEventListener('click', (e) => {
      e.stopPropagation();
      if (menu.style.display === 'none' || menu.style.display === '') {
        const rect = MenuButton.getBoundingClientRect();
        menu.style.top = `${rect.bottom + window.scrollY}px`;
        menu.style.left = `${rect.left + window.scrollX}px`;
        menu.style.display = 'block';
      } else {
        menu.style.display = 'none';
      }
    });

    document.addEventListener('click', () => {
      menu.style.display = 'none';
    });

    menu.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // 16. Final Assembly
    const removeContainer = document.createElement('div');
    removeContainer.classList.add('remove-container');
    removeContainer.appendChild(MenuButton);
    removeContainer.appendChild(videoFileLabel);
    // removeContainer.appendChild(removeButton);
    
    sliderContainer.appendChild(timelineSlider);
    sliderContainer.appendChild(timeLabelContainer);

    videoContainer.appendChild(removeContainer);
    videoContainer.appendChild(videoPlayer); // Append the actual video element
    videoContainer.appendChild(sliderContainer);
    videoContainer.appendChild(videoControls);
    videosContainer.appendChild(videoContainer);



    function setPauseTimer() {
      // 3. Edit: Cancel current timers and call the setup function again
      get_timer_time(`Set Pause Timer`).then((pauseTime) => {
        startMediaTimer(videoPlayer, pauseTime, "pause", timerStatus);
      });
    }

    function setPlayTimer() {
      // 3. Edit: Cancel current timers and call the setup function again
      get_timer_time(`Set Play Timer`).then((playTime) => {
        startMediaTimer(videoPlayer, playTime, "play", timerStatus);
      });
    }

    

    try {
      var fileDic = getCookie("fileDic");
      if (fileDic !== null) {
        if (!(url in fileDic)) {
          var urlProperties = {};
          urlProperties["name"] = name;
          urlProperties["timeFrame"] = timeFrame;
          urlProperties["volume"] = defaultVolume; // defaultVolume.toFixed(1); // Save default volume
          fileDic[url] = urlProperties;
          setCookie("fileDic", keepLastFiveElements(fileDic), 10);
        }
      } else {
        var fileDic = {};
        var urlProperties = {};
        urlProperties["name"] = name;
        urlProperties["timeFrame"] = timeFrame;
        urlProperties["volume"] = defaultVolume; // defaultVolume.toFixed(1); // Save default volume
        fileDic[url] = urlProperties;
        setCookie("fileDic", fileDic, 10);
      }
    } catch (error) {
      alert("An error occurred during cookie management: " + error);
    }
    resolve();
  });
}
