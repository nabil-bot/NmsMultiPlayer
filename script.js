

// working code ========================================

document.addEventListener('visibilitychange', function (event) {
{
  if (document.visibilityState === 'visible') {

  } 
  else {
    document.hidden = false;
    document.visibilityState = 'visible';
    players.forEach(player => {
      if (player.getPlayerState() === YT.PlayerState.PLAYING) {
        player.playVideo(); // Resume playback if the player was playing
      }
    });

    event.stopImmediatePropagation();
    return 
  }
} 
});

// working code ========================================


let videoCount = 0;
let players = [];
const volume = 50;
const speed = 1;

async function addVideoPlayer(videoUrl, volume, speed, isPlaylist = false, playlistVideos=[], timeFrame=0, currentPlaylistIndex=0, customPlaylist = false) { //videoUrl could be playlist url
  if (isPlaylist){
    videoId = getVideoId(playlistVideos[currentPlaylistIndex]);
  }else{
    videoId = getVideoId(videoUrl);
  }

  if (videoId == null) { // Handles both null and undefined
    return;
  }

  const videosContainer = document.getElementById('videos-container');
  const videoWrapper = document.createElement('div');
  videoWrapper.classList.add('video-wrapper');
  const iframe = document.createElement('iframe');
  // iframe.width = '';
  iframe.height = '242';

  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
  iframe.frameborder = '0';
  iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
  iframe.allowFullscreen = true;
  
  
  const volumeContainer = document.createElement('div');
  volumeContainer.classList.add('volume-container');
  const speakerIcon = document.createElement('i');
  speakerIcon.classList.add('fas', 'fa-volume-up', 'volume-icon');
  volumeContainer.appendChild(speakerIcon);
  const volumeSlider = document.createElement('input');
  volumeSlider.type = 'range';
  volumeSlider.min = 0;
  volumeSlider.max = 100;
  volumeSlider.value = volume;
  volumeSlider.classList.add('slider');
  volumeContainer.appendChild(volumeSlider);
  volumeSlider.disabled = true

  let disableVolumeTimer; // Variable to store the timer

// Function to enable the slider and manage the timer
function enableVolumeSlider() {
  volumeSlider.disabled = false; // Enable the slider

  // Safely clear any existing timer
  try {
    clearTimeout(disableVolumeTimer);
  } catch (error) {
    console.error('Error clearing timeout:', error);
  }

  // Set a new timer to disable the slider after 3 seconds
  disableVolumeTimer = setTimeout(() => {
    volumeSlider.disabled = true;
  }, 3500);
}

// Add an event listener to the container for enabling the slider
volumeContainer.addEventListener('mousedown', () => {
  if (volumeSlider.disabled) {
    enableVolumeSlider();
  }
});
  
  volumeSlider.addEventListener('input', function () {
    setVolume(videoWrapper, volumeSlider.value);

    var urlDic = getCookie("urlDic");
    if (urlDic !== null) {
      if (videoUrl in urlDic){
        urlDic[videoUrl]["volume"] = volumeSlider.value;
        setCookie("urlDic", urlDic, 10);
      } 
    }
  });
  speakerIcon.addEventListener('click', function() {
    if (volumeSlider.value > 0){
      setVolume(videoWrapper, 0);
    }else if (volumeSlider.value == 0) {
      setVolume(videoWrapper, 50);
    }
  });
  const videoControlsWrapper = document.createElement('div');
  videoControlsWrapper.classList.add('video-controls');

  const MenuButton = document.createElement('button');
MenuButton.className = 'MenuButton-class';
const icon = document.createElement('i');
icon.className = 'fas fa-bars'; // Add Font Awesome classes for the menu icon
MenuButton.appendChild(icon);

// Create the dropdown menu
const menu = document.createElement('div');
menu.className = 'dropdown-menu';
menu.style.display = 'none'; // Hide the menu initially

// Add menu items
const menuItems = [
  { text: 'Reload', iconClass: 'fas fa-redo' },
  { text: 'Set Pause Timer', iconClass: 'fas fa-pause' },
  { text: 'Copy Link', iconClass: 'fas fa-copy' }
];
menuItems.forEach(item => {
  const menuItem = document.createElement('div');
  menuItem.className = 'menu-item';

  // Create and append the icon
  const menuIcon = document.createElement('i');
  menuIcon.className = item.iconClass;
  menuIcon.style.marginRight = '10px'; // Add spacing between icon and text
  menuItem.appendChild(menuIcon);

  // Add text content
  menuItem.appendChild(document.createTextNode(item.text));

  // Add click functionality
  menuItem.addEventListener('click', () => {
    // alert(`You clicked: ${item.text}`);

    if (item.text == 'Reload'){
    const src = iframe.src; // Get the current source URL
    iframe.src = ""; // Clear the src temporarily
    setTimeout(() => {
      iframe.src = src; // Reapply the same source URL
    }, 10); // Short delay to ensure reload
    }


    if (item.text === 'Set Pause Timer') {
      pauseVideo()
    } 



    menu.style.display = 'none'; // Hide the menu after clicking
  });

  menu.appendChild(menuItem);
});

// Append the menu to the document body
document.body.appendChild(menu);

// Toggle menu visibility on button click
MenuButton.addEventListener('click', (e) => {
  // Prevent click from propagating to the document
  e.stopPropagation();

  // Toggle menu visibility
  if (menu.style.display === 'none' || menu.style.display === '') {
    // Position the menu relative to the button
    const rect = MenuButton.getBoundingClientRect();
    menu.style.top = `${rect.bottom + window.scrollY}px`;
    menu.style.left = `${rect.left + window.scrollX}px`;
    menu.style.display = 'block';
  } else {
    menu.style.display = 'none';
  }
});

// Hide the menu when clicking outside
document.addEventListener('click', () => {
  menu.style.display = 'none';
});

// Prevent the menu from hiding when clicking inside it
menu.addEventListener('click', (e) => {
  e.stopPropagation();
});
  // menu btn =======================================================================


  videoControlsWrapper.appendChild(MenuButton);
  // videoControlsWrapper.appendChild(videoSpeedWrapper);
    

  
  function initializeYouTubeAPI(iframe, volume, timeFrame) {
    function createPlayer() {
      const player = new YT.Player(iframe, {
        events: {
          'onReady': function (event) {
            try {
              event.target.setVolume(volume);
              event.target.seekTo(timeFrame);
              if (players.indexOf(event.target) === -1) {
                players.push(event.target);
              } else {
                console.log('Player already exists in players array');
              }
            } catch (error) {
              console.error('Error during onReady event:', error);
            }
          },
          'onStateChange': function (event) {
            try {
              if (event.data === YT.PlayerState.ENDED) {
                playNextVideoFromPlaylist(videoWrapper);
                // console.log('Video ended, playing next video from playlist');
              } else if (event.data === YT.PlayerState.PAUSED){

                  var urlDic = getCookie("urlDic");
                  if (urlDic != null){
                    if (videoUrl in urlDic)

                      var floatNumber = player.getCurrentTime();
                      var intNumber = Math.floor(floatNumber);   
                      urlDic[videoUrl]["timeFrame"]=  intNumber;
                      setCookie("urlDic", urlDic, 10);
                      console.log(urlDic[videoUrl]["timeFrame"])
                  }
              }
            } catch (error) {
              console.error('Error during onStateChange event:', error);
            }
          }
        },
        'onPlaybackQualityChange': function (event) {
          // This function will be called when playback quality changes
          // alert(player.getPlaybackQuality());
          console.log(event.target.getPlaybackQuality());
        }
        ,
        playerVars: {
          // Add additional parameters if needed
        }
      });

      // Optional: Check if the player instance is created successfully
      if (!player) {
        console.error('Failed to create YouTube player instance');
      } else {
        console.log('YouTube player instance created successfully');
        try{
          player.setVolume(volumeSlider.value);
        }catch(error){
          console.log(error)
        }
      }
    }

    function waitForYouTubeAPI() {
      if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
        // console.log('YouTube IFrame API is not yet loaded. Waiting...');
        setTimeout(waitForYouTubeAPI, 100); // Retry after 100 milliseconds
      } else {
        createPlayer();
      }
    }
    waitForYouTubeAPI();

    
  } // initializeYouTubeAPI function ends here


  function pauseVideo() {
  // Ask the user for input in seconds
  const timeInSeconds = prompt('Enter the time in seconds to pause the player:');

  // Validate the input
  if (timeInSeconds && !isNaN(timeInSeconds) && timeInSeconds > 0) {
    alert(`Player will pause in ${timeInSeconds} seconds.`);
    
    // Find the active player (if multiple players are used)
    const activePlayer = players.find(player => player.getIframe() === iframe);
    if (activePlayer) {
      setTimeout(() => {
        activePlayer.pauseVideo(); // Pause the video after the specified time
      }, timeInSeconds * 1000); // Convert seconds to milliseconds
    } else {
      console.error('No active player found.');
    }
  } else {
    alert('Invalid input. Please enter a valid number.');
  }
}


  if (isPlaylist) {
    const previousButton = document.createElement('button');
    previousButton.textContent = '⏮';
    previousButton.classList.add('previous-btn');
    previousButton.addEventListener('click', function () {
      playPreviousVideoFromPlaylist(videoWrapper);
    });
    videoControlsWrapper.appendChild(previousButton);

    const nextButton = document.createElement('button');
    nextButton.textContent = '⏭';

    nextButton.classList.add('next-btn');
    nextButton.addEventListener('click', function () {
      playNextVideoFromPlaylist(videoWrapper);
    });
    videoControlsWrapper.appendChild(nextButton);

    previousButton.style.height = '26px';
    nextButton.style.height = '26px';
    previousButton.style.fontSize = '15px';
    nextButton.style.fontSize = '16px';

    var label = document.createElement('label');
    label.textContent = `${currentPlaylistIndex+1}/${playlistVideos.length}`;
    label.style.fontSize = '14px';
    videoControlsWrapper.appendChild(label);
    }

  const removeButton = document.createElement('button');
  // removeButton.textContent = '❌';

  const RemoveIcon = document.createElement('i');
  RemoveIcon.className = "fa-solid fa-xmark fa-xl"// Add Font Awesome classes for the menu icon
  removeButton.appendChild(RemoveIcon);
  removeButton.style = 'color: black'
  removeButton.classList.add('remove-btn');
  removeButton.addEventListener('click', function () {
    removeVideo(videoWrapper, videoUrl);
    

    if (customPlaylist){
      deleteCookie("customListDic")
      return
    }

    var urlDic = getCookie("urlDic");
    if (urlDic != null){
        if (videoUrl in urlDic){
          delete urlDic[videoUrl]
          if (Object.keys(urlDic).length == 0){
              deleteCookie("urlDic");
          }else{
              setCookie("urlDic", urlDic, 10);
          }
        }} 
  });
  videoControlsWrapper.appendChild(removeButton);
  videoWrapper.appendChild(iframe);
  videoWrapper.appendChild(volumeContainer);
  videoWrapper.appendChild(videoControlsWrapper);
  
  videosContainer.appendChild(videoWrapper);


  function playNextVideoFromPlaylist(videoWrapper) {
    if (playlistVideos.length === 0) {
      return;
    }

    currentPlaylistIndex = (currentPlaylistIndex + 1) % playlistVideos.length;

    label.textContent = `${currentPlaylistIndex+1}/${playlistVideos.length}`;
    const nextVideoUrl = playlistVideos[currentPlaylistIndex];
    const videoId = getVideoId(nextVideoUrl);
    const iframe = videoWrapper.querySelector('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
    const slider = videoWrapper.querySelector('.slider');
    initializeYouTubeAPI(iframe, slider.value, 0);
    // alert("after init app")

    if (customPlaylist){
      let newDic = getCookie("customListDic")
      newDic["currentIndex"]=currentPlaylistIndex
      setCookie("customListDic",newDic , 10);
    }
  }

  function playPreviousVideoFromPlaylist(videoWrapper) {
    if (playlistVideos.length === 0) {
      return;
    }
    currentPlaylistIndex = (currentPlaylistIndex - 1 + playlistVideos.length) % playlistVideos.length;
    label.textContent = `${currentPlaylistIndex+1}/${playlistVideos.length}`;
    const previousVideoUrl = playlistVideos[currentPlaylistIndex];
    const videoId = getVideoId(previousVideoUrl);
    const iframe = videoWrapper.querySelector('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
    const slider = videoWrapper.querySelector('.slider');
    initializeYouTubeAPI(iframe, slider.value, 0);
    // if (players.indexOf(event.target) === -1) 
    if (customPlaylist){
      let newDic = getCookie("customListDic")
      newDic["currentIndex"]=currentPlaylistIndex
      setCookie("customListDic",newDic , 10);
    }
  }

  initializeYouTubeAPI(iframe, volume, timeFrame);

  if (customPlaylist)
    {
      return
    }
  
  try {
        var urlDic = getCookie("urlDic");
        if (urlDic != null){
          if (!(videoUrl in urlDic)){
            var urlProperties = {}
            urlProperties["timeFrame"] = timeFrame
            urlProperties["volume"] = volume
            urlDic[videoUrl] = urlProperties
            setCookie("urlDic", urlDic, 10);
          }
        } else{
          var urlDic = {};
          var urlProperties = {};
          urlProperties["volume"] = 1
          urlProperties["timeFrame"] = 0
          urlDic[videoUrl] = urlProperties
          setCookie("urlDic", urlDic, 10);
          urlDic = getCookie("urlDic");
        }
    } catch (error) {
        alert("An error occurred: " + error);
    }
}



async function addVideo() {
  const videoUrlInput = document.getElementById('video-url');
  let videoUrl = videoUrlInput.value.trim();

  if (!videoUrl) {
    sendWebViewSignal('VIDEO_BROWSE', 'Browse')
    return; // Exit the function if the video URL is empty
  }

  await filterLink(videoUrl, 60, 0)
  videoUrlInput.value = '';
}

async function addVideoFromNative(videoUrl) {
  await filterLink(videoUrl, 70, 0)
  // videoUrlInput.value = '';
}


function getPlaylistVideos(playlistUrl) {
  return new Promise((resolve, reject) => {
    const playlistId = new URL(playlistUrl).searchParams.get('list');
    if (!playlistId) {
      reject('Invalid playlist URL. Please enter a valid URL with the "list" parameter.');
      return;}
    fetchVideosFromPlaylist(playlistId)
      .then(videoUrls => {
        resolve(videoUrls);
      })
      .catch(error => {
        reject(error);
      });
  });
}
async function fetchVideosFromPlaylist(playlistId) {
  const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=AIzaSyDQkRgxuQ7i5-1UuYtuve8eZgAb1-XGe30`);
  const data = await response.json();
  const videoUrls = [];
  for (const item of data.items) {
    if (item.kind === 'youtube#playlistItem') {
      const videoId = item.snippet.resourceId.videoId;
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      videoUrls.push(videoUrl);
    }
  }
  return videoUrls;
}
function removeVideo(videoWrapper, videoUrl) {
  const iframe = videoWrapper.querySelector('iframe');
  const videoId = iframe.src.split('/').pop().split('?')[0];
  players = players.filter(player => player.getVideoData().video_id !== videoId);
  videoWrapper.remove();
  
}
function getVideoId(url) {
  var regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/;
  
  var match = url.match(regExp);

  if (match && match[1]) {
    return match[1];
  } else {
    regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/;
    match = url.match(regExp);
    if (match && match[1]) {
      return match[1];
    } else {
      // alert("Invalid url")
      return null;
    }
  }
}
function setVolume(videoWrapper, volume) {
  const iframe = videoWrapper.querySelector('iframe');
  const videoId = iframe.src.split('/').pop().split('?')[0];
  const player = players.find(player => player.getVideoData().video_id === videoId);
  if (player) {
    player.setVolume(volume);
  }
}
function setSpeed(videoWrapper, speed) {
  const iframe = videoWrapper.querySelector('iframe');
  const videoId = iframe.src.split('/').pop().split('?')[0];
  const player = players.find(player => player.getVideoData().video_id === videoId);
  if (player) {
    player.setPlaybackRate(parseFloat(speed));
  }
}
function pasteFromClipboard() {
  
  try {

    navigator.clipboard.readText()
    .then(text => {
      document.getElementById('video-url').value = text.trim();
    })
    .catch(err => {
      console.error('Failed to read clipboard contents: ', err);
    });

  } catch (error) {
    console.log(error);
  }

  
  try {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ClipBoardPlz', title: 'ClipBoardPlz' }));
  } catch (error){
    alert(error);
  }
}

function setUrlTextField(url) {
      document.getElementById('video-url').value = url.trim();
}

document.getElementById('add-video-btn').addEventListener('click', addVideo);
document.getElementById('paste-btn').addEventListener('click', pasteFromClipboard);



// Function to send signal to React Native WebView
function sendWebViewSignal(type_, title_) {
  try {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: type_, title: title_ }));
  } catch (error) {
    alert(error);
  }
}



document.addEventListener("fullscreenchange", () => {
  const fullscreenElement = document.fullscreenElement;
  if (fullscreenElement) {
    sendWebViewSignal('FULL_SCREEN_SIGNAL', 'true');
  } else {
    sendWebViewSignal('FULL_SCREEN_SIGNAL', 'false');
  }
});


function setCookie(name, value, daysToExpire) {
  var expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + daysToExpire);
  var cookieValue = encodeURIComponent(name) + "=" + encodeURIComponent(JSON.stringify(value)) + "; expires=" + expirationDate.toUTCString() + "; path=/";
  document.cookie = cookieValue;
}
function getCookie(name) {
  var cookieName = encodeURIComponent(name) + "=";
  var cookieArray = document.cookie.split(';');
  for (var i = 0; i < cookieArray.length; i++) {
    var cookie = cookieArray[i].trim();
    if (cookie.indexOf(cookieName) === 0) {
      var cookieValue = cookie.substring(cookieName.length, cookie.length);
      try {
        return JSON.parse(decodeURIComponent(cookieValue));
      } catch (error) {
        // If parsing fails, return null since we expect a dictionary
        return null;
      }
    }
  }
  return null;
}

const fileInput = document.getElementById('file-input');

async function addLocalVideoPlayer(url, name, timeFrame = 0) {
  return new Promise((resolve, reject) => {
    // 1. Setup Containers and Video Element
    const videosContainer = document.getElementById('videos-container');
    const videoContainer = document.createElement('div');
    videoContainer.classList.add('video-container');

    // Create the HTML5 Video element
    const videoPlayer = document.createElement('video');
    videoPlayer.className = 'local-video-player';
    videoPlayer.src = url;
    videoPlayer.controls = false; // We'll use custom controls
    videoPlayer.loop = false;
    // Set default volume, if you want a video-specific default
    const defaultVolume = 0.8; 
    videoPlayer.volume = defaultVolume;

    // 2. Play/Pause Button
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

    // 3. Timeline Slider (Scrubbing)
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
        // --- ENTER FULLSCREEN ---
        // Request fullscreen on the video player element
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
    speakerIcon.style.color = 'gray';
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
      // Update cookie data for time frame
      var fileDic = getCookie("fileDic");
      if (fileDic !== null && url in fileDic) {
        fileDic[url]["timeFrame"] = videoPlayer.currentTime;
        setCookie("fileDic", fileDic, 10);
      }
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
            loopIcon.classList.add('fa-redo-alt');
        } else {
            loopIcon.classList.remove('fa-redo-alt');
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

    // 13. Time Label Container
    const timeLabelContainer = document.createElement('div');
    timeLabelContainer.classList.add('timelabelContainer');
    timeLabelContainer.appendChild(currentTimeLabel);
    timeLabelContainer.appendChild(durationLabel);
    
    // 14. File Label and Remove Button
    const videoFileLabel = document.createElement('label');
    videoFileLabel.textContent = name;
    videoFileLabel.classList.add('VideoFileName');
    
    const removeButton = document.createElement('button');
    const RemoveIcon = document.createElement('i');
    RemoveIcon.className = "fa-solid fa-xmark fa-xl";
    removeButton.appendChild(RemoveIcon);
    removeButton.style = 'color: black';
    removeButton.classList.add('remove-btn');
    
    removeButton.addEventListener('click', function() {
      videoContainer.remove();
      // Logic to clear file input and delete cookie data
      // (Assuming fileInput is accessible in this scope)
      // fileInput.value = ''; 
      try {
        var fileDic = getCookie("fileDic");
        if (fileDic !== null && url in fileDic) {
          delete fileDic[url];
          if (Object.keys(fileDic).length == 0) {
            deleteCookie("fileDic");
          } else {
            setCookie("fileDic", fileDic, 10);
          }
        }
      } catch (error) {
        alert("An error occurred during removal: " + error);
      }
    });

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
      { text: 'Copy Link', iconClass: 'fas fa-copy' },
      { text: 'Toggle Fullscreen', iconClass: 'fas fa-expand' } // Video specific menu item
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
          const timeInSeconds = prompt('Enter the time in seconds to pause:');
          if (timeInSeconds && !isNaN(timeInSeconds) && timeInSeconds > 0) {
            setTimeout(() => {
              videoPlayer.pause();
            }, timeInSeconds * 1000);
            alert(`Player will pause in ${timeInSeconds} seconds.`);
          } else {
            alert('Invalid input. Please enter a valid number.');
          }
        } else if (item.text == 'Toggle Fullscreen') {
            if (videoPlayer.requestFullscreen) {
                videoPlayer.requestFullscreen();
            } else if (videoPlayer.mozRequestFullScreen) { // Firefox
                videoPlayer.mozRequestFullScreen();
            } else if (videoPlayer.webkitRequestFullscreen) { // Chrome, Safari and Opera
                videoPlayer.webkitRequestFullscreen();
            } else if (videoPlayer.msRequestFullscreen) { // IE/Edge
                videoPlayer.msRequestFullscreen();
            }
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
    removeContainer.appendChild(removeButton);
    
    sliderContainer.appendChild(timelineSlider);
    sliderContainer.appendChild(timeLabelContainer);

    videoContainer.appendChild(removeContainer);
    videoContainer.appendChild(videoPlayer); // Append the actual video element
    videoContainer.appendChild(sliderContainer);
    videoContainer.appendChild(videoControls);
    videosContainer.appendChild(videoContainer);

    // 17. Initialize/Update Cookie
    try {
      var fileDic = getCookie("fileDic");
      if (fileDic !== null) {
        if (!(url in fileDic)) {
          var urlProperties = {};
          urlProperties["name"] = name;
          urlProperties["timeFrame"] = timeFrame;
          urlProperties["volume"] = defaultVolume.toFixed(1); // Save default volume
          fileDic[url] = urlProperties;
          setCookie("fileDic", keepLastFiveElements(fileDic), 10);
        }
      } else {
        var fileDic = {};
        var urlProperties = {};
        urlProperties["name"] = name;
        urlProperties["timeFrame"] = timeFrame;
        urlProperties["volume"] = defaultVolume.toFixed(1); // Save default volume
        fileDic[url] = urlProperties;
        setCookie("fileDic", fileDic, 10);
      }
    } catch (error) {
      alert("An error occurred during cookie management: " + error);
    }
    
    resolve();
  });
}


async function addAudioPlayer(url, name, timeFrame=0, volume=0.8) {
  return new Promise((resolve, reject) => {
  const videosContainer = document.getElementById('videos-container');
  const audioContainer = document.createElement('div');
  audioContainer.classList.add('audio-container');
  const audioPlayer = document.createElement('audio');
  audioPlayer.src = url;
  audioPlayer.controls = false;
  audioPlayer.loop = false;
  const playPauseBtn = document.createElement('button');
  playPauseBtn.classList.add('audio-play-pause');
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  function handlePlay(){
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
  }
  function handlePause(){
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  }
  function playPauseAudioPlayer(){
    if (!audioPlayer.paused){
      audioPlayer.pause();
    } else {
      audioPlayer.play();
    }
  }
  
  playPauseBtn.addEventListener('click', function(){
    playPauseAudioPlayer()
  }

  );
  const sliderContainer = document.createElement('div');
  sliderContainer.classList.add('slider-container');
  const timelineSlider = document.createElement('input');
  timelineSlider.classList.add('timeline-slider');
  timelineSlider.type = 'range';
  timelineSlider.min = '0';
  timelineSlider.value = '0';
  timelineSlider.step = '1';
  timelineSlider.disabled = true;
  let disableTimer; // Variable to store the timer
// Function to enable the slider and manage the timer
function enableSlider() {
  timelineSlider.disabled = false; // Enable the slider
  // Safely clear any existing timer
  try {
    clearTimeout(disableTimer);
  } catch (error) {
    console.error('Error clearing timeout:', error);
  }
  // Set a new timer to disable the slider after 3 seconds
  disableTimer = setTimeout(() => {
    timelineSlider.disabled = true;
  }, 3000);
}
// Add an event listener to the container for enabling the slider
sliderContainer.addEventListener('mousedown', () => {
  if (timelineSlider.disabled) {
    enableSlider();
  }
});
  const forwardButton = document.createElement('button');
  forwardButton.textContent = '+10s';
  forwardButton.addEventListener('click', () => {
    audioPlayer.currentTime += 10;
  });
  function toggleLoop() {
    alert("i am in this func")
    audioPlayer.loop = !audioPlayer.loop;

    // Toggle icon and update button text based on loop state
    if (audioPlayer.loop) {
      loopIcon.classList.remove('fa-solid fa-repeat');
      loopIcon.classList.add('fa-redo-alt');  // Change icon to signify loop is on
    } else {
      loopIcon.classList.remove('fa-redo-alt');
      loopIcon.classList.add('fa-solid fa-repeat');  // Change icon to signify loop is off
    }
  }
  const loopBtn = document.createElement('button');
  const loopIcon = document.createElement('i');
  loopIcon.className = 'fa-solid fa-repeat'; // Add Font Awesome classes for the menu icon
  loopBtn.appendChild(loopIcon);
  loopBtn.addEventListener('click', toggleLoop);
  const backward30Sec = document.createElement('button');
  backward30Sec.textContent = '-30s';
  backward30Sec.addEventListener('click', () => {
    audioPlayer.currentTime -= 30;
  });
  const backwardButton = document.createElement('button');
  backwardButton.textContent = '-10s';
  backwardButton.addEventListener('click', () => {
    audioPlayer.currentTime -= 10;
  });
  const speedSelect = document.createElement('select');
  [0.5, 0.75, 1, 1.15,1.25, 1.5, 1.75, 2].forEach(speed => {
    const option = document.createElement('option');
    option.value = speed;
    option.textContent = `${speed}x`;
    speedSelect.appendChild(option);
  });
  speedSelect.value = 1
  speedSelect.addEventListener('change', () => {
    audioPlayer.playbackRate = speedSelect.value;
  });
  const volumeContainer = document.createElement('div');
  volumeContainer.classList.add('volume-container');
  const speakerIcon = document.createElement('i');
  speakerIcon.classList.add('fas', 'fa-volume-up', 'volume-icon');
  speakerIcon.style.color = 'gray';
  volumeContainer.appendChild(speakerIcon);
  const volumeSlider = document.createElement('input');
  volumeSlider.type = 'range';
  volumeSlider.min = 0;
  volumeSlider.max = 1;
  volumeSlider.step = 0.01;
  volumeSlider.value = volume;
  volumeSlider.classList.add('slider');
  volumeContainer.appendChild(volumeSlider);
  volumeSlider.disabled = true
  let disableVolumeTimer; // Variable to store the timer
// Function to enable the slider and manage the timer
function enableVolumeSlider() {
  volumeSlider.disabled = false; // Enable the slider
  // Safely clear any existing timer
  try {
    clearTimeout(disableVolumeTimer);
  } catch (error) {
    console.error('Error clearing timeout:', error);
  }
  // Set a new timer to disable the slider after 3 seconds
  disableVolumeTimer = setTimeout(() => {
    volumeSlider.disabled = true;
  }, 3500);
}
// Add an event listener to the container for enabling the slider
volumeContainer.addEventListener('mousedown', () => {
  if (volumeSlider.disabled) {
    enableVolumeSlider();
  }
});
  volumeSlider.addEventListener('input', () => {
    audioPlayer.volume = volumeSlider.value;
    enableVolumeSlider();
    var fileDic = getCookie("fileDic");
    if (fileDic !== null) {
      if (url in fileDic){
        let floatValue = parseFloat(volumeSlider.value); // Convert the value to a float
        let formattedValue = floatValue.toFixed(1); 
        fileDic[url]["volume"] = formattedValue;
        setCookie("fileDic", fileDic, 10);
      } 
    }
  });
  const currentTimeLabel = document.createElement('span');
  currentTimeLabel.className = 'time-label';
  const durationLabel = document.createElement('span');
  durationLabel.className = 'time-label';
  durationLabel.textContent = '0:0'; // Initialize duration label
  // Helper function to format time in MM:SS format
  const formatTime = (timeInSeconds) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const formattedHours = hours > 0 ? `${hours < 10 ? '0' : ''}${hours}:` : '';
    const formattedMinutes = `${minutes < 10 ? '0' : ''}${minutes}`;
    const formattedSeconds = `${seconds < 10 ? '0' : ''}${seconds}`;
    return `${formattedHours}${formattedMinutes}:${formattedSeconds}`;
};
  audioPlayer.addEventListener('timeupdate', () => {
    currentTimeLabel.textContent = formatTime(audioPlayer.currentTime);
    timelineSlider.value = audioPlayer.currentTime; 
    timelineSlider.max = audioPlayer.duration;
    durationLabel.textContent = `${formatTime(audioPlayer.duration)}`;
    var fileDic = getCookie("fileDic");
    if (fileDic !== null) {
      if (url in fileDic){
        fileDic[url]["timeFrame"] = audioPlayer.currentTime;
        setCookie("fileDic", fileDic, 10);
      } 
    }
  }
);
  audioPlayer.addEventListener('loadedmetadata', () => {

  var fileDic = getCookie("fileDic");
  if (fileDic !== null && fileDic[url] !== undefined) {
      audioPlayer.currentTime = fileDic[url]["timeFrame"];
      audioPlayer.volume = fileDic[url]["volume"];
    }
  });
  audioPlayer.addEventListener('error', (e) => {
    console.error('Failed to load audio:', e.message);
});
  timelineSlider.addEventListener('input', () => {
    audioPlayer.currentTime = timelineSlider.value;
    enableSlider(); 
  });
  audioPlayer.addEventListener('play', handlePlay);
  audioPlayer.addEventListener('pause', handlePause);
  const volumeControlerContainer = document.createElement('div');
  volumeControlerContainer.classList.add('volumeControlerContainer');
  const otherAudioControllersContainer = document.createElement('div');
  otherAudioControllersContainer.classList.add('otherAudioControllersContainer');
  sliderContainer.appendChild(timelineSlider);
  const audioControls = document.createElement('div');
  audioControls.classList.add('audio-controls');
  const timeLabelContainer = document.createElement('div');
  timeLabelContainer.classList.add('timelabelContainer');
  timeLabelContainer.appendChild(currentTimeLabel);
  timeLabelContainer.appendChild(durationLabel);
  sliderContainer.appendChild(timeLabelContainer)
  otherAudioControllersContainer.appendChild(playPauseBtn);
  otherAudioControllersContainer.appendChild(backwardButton);
  otherAudioControllersContainer.appendChild(forwardButton);
  otherAudioControllersContainer.appendChild(loopBtn);
  otherAudioControllersContainer.appendChild(speedSelect);
  volumeControlerContainer.appendChild(volumeContainer);
  audioControls.appendChild(otherAudioControllersContainer);
  audioControls.appendChild(volumeControlerContainer);
  const audioFileLabel = document.createElement('label');
  audioFileLabel.textContent = name;
  audioFileLabel.classList.add('AudioFileName');
  const removeButton = document.createElement('button');
  // removeButton.textContent = '❌';

  const RemoveIcon = document.createElement('i');
  RemoveIcon.className = "fa-solid fa-xmark fa-xl"// Add Font Awesome classes for the menu icon
  removeButton.appendChild(RemoveIcon);
  removeButton.style = 'color: black'

  removeButton.classList.add('remove-btn');
  removeButton.addEventListener('click', function () {
    audioContainer.remove();
    fileInput.value = '';

    try {
      var fileDic = getCookie("fileDic");
      if (fileDic !== null) {
        if (url in fileDic) {
          delete fileDic[url]

          if (Object.keys(fileDic).length == 0){
            deleteCookie("fileDic");
          }else{
            setCookie("fileDic", fileDic, 10);
          }
        }
      }
  } catch (error) {
      alert("An error occurred: " + error);
  }
  });
  const MenuButton = document.createElement('button');
  MenuButton.className = 'MenuButton-class';
  const icon = document.createElement('i');
  icon.className = 'fas fa-bars'; // Add Font Awesome classes for the menu icon
  MenuButton.appendChild(icon);

// Create the dropdown menu
const menu = document.createElement('div');
menu.className = 'dropdown-menu';
menu.style.display = 'none'; // Hide the menu initially

// Add menu items
const menuItems = [
  { text: 'Set Pause Timer', iconClass: 'fas fa-pause' },
  { text: 'Copy Link', iconClass: 'fas fa-copy' }
];
menuItems.forEach(item => {
  const menuItem = document.createElement('div');
  menuItem.className = 'menu-item';

  // Create and append the icon
  const menuIcon = document.createElement('i');
  menuIcon.className = item.iconClass;
  menuIcon.style.marginRight = '10px'; // Add spacing between icon and text
  menuItem.appendChild(menuIcon);

  // Add text content
  menuItem.appendChild(document.createTextNode(item.text));

  // Add click functionality
  menuItem.addEventListener('click', () => {
    // alert(`You clicked: ${item.text}`);
    if (item.text == 'Set Pause Timer'){
      const timeInSeconds = prompt('Enter the time in seconds to pause:');

  // Validate the input
  if (timeInSeconds && !isNaN(timeInSeconds) && timeInSeconds > 0) {
    
    setTimeout(() => {
      audioPlayer.pause(); 
      }, timeInSeconds * 1000); 
    
    alert(`Player will pause in ${timeInSeconds} seconds.`);
    
    
  } else {
    alert('Invalid input. Please enter a valid number.');
  }
    }

    menu.style.display = 'none'; // Hide the menu after clicking
  });

  menu.appendChild(menuItem);
});
// Append the menu to the document body
document.body.appendChild(menu);
// Toggle menu visibility on button click
MenuButton.addEventListener('click', (e) => {
  // Prevent click from propagating to the document
  e.stopPropagation();

  // Toggle menu visibility
  if (menu.style.display === 'none' || menu.style.display === '') {
    // Position the menu relative to the button
    const rect = MenuButton.getBoundingClientRect();
    menu.style.top = `${rect.bottom + window.scrollY}px`;
    menu.style.left = `${rect.left + window.scrollX}px`;
    menu.style.display = 'block';
  } else {
    menu.style.display = 'none';
  }
});

// Hide the menu when clicking outside
document.addEventListener('click', () => {
  menu.style.display = 'none';
});

// Prevent the menu from hiding when clicking inside it
menu.addEventListener('click', (e) => {
  e.stopPropagation();
});

  const removeContainer = document.createElement('div');
  removeContainer.classList.add('remove-container');
  removeContainer.appendChild(MenuButton)
  removeContainer.appendChild(audioFileLabel)
  removeContainer.appendChild(removeButton)
  audioContainer.appendChild(removeContainer);
  audioContainer.appendChild(sliderContainer);
  audioContainer.appendChild(audioPlayer);
  audioContainer.appendChild(audioControls);
  videosContainer.appendChild(audioContainer);

  try {
    var fileDic = getCookie("fileDic");
    if (fileDic !== null) {
      if (!(url in fileDic)) {  
      var urlProperties = {}
      urlProperties["name"] = name
      urlProperties["timeFrame"] = timeFrame
      urlProperties["volume"] = volume
      fileDic[url] = urlProperties
      setCookie("fileDic", keepLastFiveElements(fileDic), 10);
      }
    } else{
      var fileDic = {};
      var urlProperties = {};
      urlProperties["name"] = name
      urlProperties["timeFrame"] = timeFrame
      urlProperties["volume"] = volume
      fileDic[url] = urlProperties
      setCookie("fileDic", fileDic, 10);
    }

  } catch (error) {
    alert("An error occurred: " + error);
  }
  resolve();
})
}



const playAllButton = document.getElementById('play-all-button');
const pauseAllButton = document.getElementById('pause-all-button');


function handlePlayAll() {
  // 1. Control HTML <audio> elements
  const audioElements = document.querySelectorAll('audio');
  audioElements.forEach(audio => {
    // If the audio is PAUSED, try to PLAY it.
    if (audio.paused) { 
      // Use .play().catch() to handle potential errors (like Autoplay Policy rejection)
      audio.play().catch(error => {
        console.error("Autoplay prevented for an audio element:", error);
      });
    }
  });

  // 2. Control HTML <video> elements
  const videoElements = document.querySelectorAll('video');
  videoElements.forEach(video => {
    // If the video is PAUSED, try to PLAY it.
    if (video.paused) {
      video.play().catch(error => {
        console.error("Autoplay prevented for a video element:", error);
      });
    }
  });

  // 3. Control YouTube Players
  // Assumes 'players' is a globally accessible array of YT.Player objects
  // and 'YT' is the global YouTube API object.
  if (typeof players !== 'undefined' && typeof YT !== 'undefined') {
    players.forEach(player => {
      try {
        const state = player.getPlayerState();
        // Play if the state is NOT playing (YT.PlayerState.PLAYING is 1)
        if (state !== YT.PlayerState.PLAYING) {
          player.playVideo();
        }
      } catch (e) {
        console.warn("Could not control YouTube player for Play All:", e);
      }
    });
  }
}

// Function for pausing all media
function handlePauseAll() {
  // 1. Control HTML <audio> elements
  const audioElements = document.querySelectorAll('audio');
  audioElements.forEach(audio => {
    // If the audio is NOT paused (i.e., it is playing), pause it.
    if (!audio.paused) {
      audio.pause();
    }
  });

  // 2. Control HTML <video> elements
  const videoElements = document.querySelectorAll('video');
  videoElements.forEach(video => {
    if (!video.paused) {
      video.pause();
    }
  });

  // 3. Control YouTube Players
  // Assumes 'players' is a globally accessible array of YT.Player objects
  if (typeof players !== 'undefined' && typeof YT !== 'undefined') {
    players.forEach(player => {
      try {
        const state = player.getPlayerState();
        // Pause if the state is Playing (1) or Buffering (3)
        if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING) {
          player.pauseVideo();
        }
      } catch (e) {
        console.warn("Could not control YouTube player for Pause All:", e);
      }
    });
  }
}


playAllButton.addEventListener('click', handlePlayAll);

// When the 'pauseAllButton' is clicked, execute the 'handlePauseAll' function
pauseAllButton.addEventListener('click', handlePauseAll);
  










async function filterLink(videoUrl, volume, timeFrame) {
  return new Promise((resolve, reject) => {
    if (videoUrl.includes(",")){
      let splitedUrls = videoUrl.split(", ")
      addVideoPlayer(splitedUrls[0], volume, speed, true, splitedUrls, timeFrame,0, true); // No need to pass isPlaylist=true
      
      let customListDic = {}
      customListDic["urls"] = splitedUrls
      customListDic["currentIndex"] = 0
      customListDic["volume"] = 100


      setCookie("customListDic", customListDic, 10);
      

      resolve();
    }
    else {
      addVideoPlayer(videoUrl, volume, speed,false, [], timeFrame);
      resolve(); 
    }
  });
}

document.getElementById('clear-button').addEventListener('click', function() {
    document.getElementById('video-url').value = '';
});


function deleteCookie(name) {
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}



fileInput.addEventListener('change', function(event) {
  const files = event.target.files;

  if (files.length > 0) {
    for (const file of files) {
      const url = URL.createObjectURL(file);
      
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({ 
          type: 'SELECTED_FILE_URL', 
          state: url 
        }));
      } catch (error) {
        console.log(error);
      }

      const name = file.name;
      if (file.type.startsWith('audio/')) {
          let timeFrame = 0;
          let volume = 0;

          const fileDic = getCookie("fileDic");
          if (fileDic != null) {
            for (let savedUrl in fileDic) {
              if (savedUrl == url || name == fileDic[savedUrl]["name"]) {
                timeFrame = fileDic[savedUrl]["timeFrame"];
                volume = fileDic[savedUrl]["volume"];
              }
            }
          }
          addAudioPlayer(url, name, timeFrame, volume);
        }
        else if (file.type.startsWith('video/')) {
        // --- NEW: Handle video files ---
        addLocalVideoPlayer(url, name); 

      }
    }
  }
});



function keepLastFiveElements(obj) {
  let entries = Object.entries(obj);
  if (entries.length > 5) {
      entries = entries.slice(-5);
  }
  return Object.fromEntries(entries);
}

async function initFunc() {
  try{
  var urlDic = getCookie("urlDic");
    if (urlDic !== null) {
      for (let url in urlDic) {
        try {
          await filterLink(url, urlDic[url]["volume"], urlDic[url]["timeFrame"]); 
        } catch (error) {
          console.log(error);
        }
      }
    };
    // var fileDic = getCookie("fileDic");
    // if (fileDic != null) {
    //   for (let url in fileDic){
    //     await addAudioPlayer(url, fileDic[url]["name"], fileDic[url]["timeFrame"], fileDic[url]["volume"]);

    //   }
    // }

    var customListDic = getCookie("customListDic");
    if (customListDic !== null) {
      addVideoPlayer(customListDic["urls"][customListDic["currentIndex"]], volume, speed, true, customListDic["urls"], 0, customListDic["currentIndex"], customPlaylist=true); // No need to pass isPlaylist=true
      
      // let customListDic = {}
      // customListDic["urls"] = splitedUrls
      // customListDic["currentIndex"] = 0
      // customListDic["volume"] = 100
      
    };
  }catch (error) {
    console.error('An error occurred during initialization:', error);
  }
}
initFunc().then(() => {
  console.log('Initialization completed.');
}).catch(error => {
  console.error('Initialization failed:', error);
});





  const Clipcheckbox = document.getElementById('trackCheckbox');
  const clipboardTextField = document.getElementById('clipboardTextField');
  let previousClipboard = '';

  Clipcheckbox.addEventListener('change', function() {
    if (this.checked) {
     

 navigator.clipboard.writeText('').then(() => {
        previousClipboard = '';
        trackClipboard();
      });
    } else {
      previousClipboard = '';
    }
  });

