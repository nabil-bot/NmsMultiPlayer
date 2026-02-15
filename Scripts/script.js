// import { addFacebookVideoPlayer } from './facebook.js';


function loadFacebookSDK() {
    return new Promise((resolve) => {
        if (window.FB) return resolve();
        const script = document.createElement("script");
        script.src = "https://connect.facebook.net/en_US/sdk.js";
        script.async = true;
        script.defer = true;
        script.onload = () => {
            FB.init({ xfbml: true, version: 'v18.0' });
            resolve();
        };
        document.head.appendChild(script);
    });
}

async function addFacebookVideoPlayer(videoUrl, volume, videosContainer) {
    const videoWrapper = document.createElement("div");
    videoWrapper.classList.add("video-wrapper");

    // Container for the FB video
    const playerId = "fb-player-" + Math.random().toString(36).substr(2, 9);
    const fbContainer = document.createElement("div");
    fbContainer.id = playerId;
    fbContainer.classList.add("fb-video");
    fbContainer.dataset.href = videoUrl;
    fbContainer.dataset.allowfullscreen = "true";
    fbContainer.dataset.width = "500"; // Fixed width to match your YT iframe height/aspect
    fbContainer.dataset.autoplay = "true";

    // Volume UI (Same as your YT logic)
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
    volumeSlider.disabled = true; // Disabled by default

    volumeContainer.appendChild(speakerIcon);
    volumeContainer.appendChild(volumeSlider);

    // --- Volume Timer Logic ---
    let volumeDisableTimer = null;
    function enableVolumeTemporarily() {
        volumeSlider.disabled = false;
        clearTimeout(volumeDisableTimer);
        volumeDisableTimer = setTimeout(() => {
            volumeSlider.disabled = true;
        }, 3500);
    }
    volumeContainer.addEventListener("mousedown", enableVolumeTemporarily);

    // Controls Area
    const videoControlsWrapper = document.createElement("div");
    videoControlsWrapper.classList.add("video-controls");

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.innerHTML = '<i class="fa-solid fa-xmark fa-xl"></i>';
    removeBtn.onclick = () => videoWrapper.remove();

    videoControlsWrapper.appendChild(removeBtn);

    // Append everything
    videoWrapper.append(fbContainer, volumeContainer, videoControlsWrapper);
    videosContainer.appendChild(videoWrapper);

    // Load and Parse
    await loadFacebookSDK();
    
    FB.XFBML.parse(videoWrapper, () => {
        FB.Event.subscribe('xfbml.ready', (msg) => {
            if (msg.type === 'video' && msg.id === playerId) {
                const player = msg.instance;
                
                // Set initial volume (FB uses 0 to 1)
                player.setVolume(volume / 100);

                // Update volume on slider move
                volumeSlider.addEventListener("input", () => {
                    player.setVolume(volumeSlider.value / 100);
                });

                // Speaker icon click toggle
                speakerIcon.addEventListener("click", () => {
                    const targetVol = volumeSlider.value > 0 ? 0 : 50;
                    volumeSlider.value = targetVol;
                    player.setVolume(targetVol / 100);
                });
            }
        });
    });
}










let videoCount = 0;
let players = [];
const volume = 50;
const speed = 1;


function startCountdownTimer(wrapper, seconds) {
  const box = wrapper.querySelector(".timer-status");
  box.style.display = "inline-block";

  function update() {
    if (seconds < 0) {
      box.style.display = "none";
      return;
    }
    let m = Math.floor(seconds / 60);
    let s = seconds % 60;
    box.innerHTML = `⏱ ${m}:${s.toString().padStart(2, '0')} 
      <span style="margin-left:8px; cursor:pointer;" class="edit-timer">✏️</span>
      <span style="margin-left:6px; cursor:pointer;" class="clear-timer">❌</span>
    `;
    seconds--;
  }
  update();
  let interval = setInterval(() => {
    if (seconds < 0) {
      clearInterval(interval);
      box.style.display = "none";
    } else update();
  }, 1000);

  // Click handlers
  box.onclick = (e) => {
    if (e.target.classList.contains("edit-timer")) {
      clearInterval(interval);
      pauseVideo(); // reopen modal
    }
    if (e.target.classList.contains("clear-timer")) {
      clearInterval(interval);
      box.style.display = "none";
    }
  };
}

async function addVideoPlayer(
  videoUrl,
  volume,
  speed,
  isPlaylist = false,
  playlistVideos = [],
  timeFrame = 0,
  currentPlaylistIndex = 0,
  customPlaylist = false
) {

  let videoId = isPlaylist
    ? getVideoId(playlistVideos[currentPlaylistIndex])
    : getVideoId(videoUrl);

  if (!videoId) return;

  const videosContainer = document.getElementById("videos-container");

  // Wrapper
  const videoWrapper = document.createElement("div");
  videoWrapper.classList.add("video-wrapper");

  // Iframe
  const iframe = document.createElement("iframe");
  iframe.height = "252";
  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
  iframe.frameBorder = "0";
  iframe.allow =
    "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";
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

  speakerIcon.addEventListener("click", () => {
    const targetVol = volumeSlider.value > 0 ? 0 : 50;
    setVolume(videoWrapper, targetVol);
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
  let label = null;

  if (isPlaylist) {
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "⏮";
    prevBtn.className = "previous-btn";
    prevBtn.onclick = () => changePlaylistVideo(-1);

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "⏭";
    nextBtn.className = "next-btn";
    nextBtn.onclick = () => changePlaylistVideo(+1);

    label = document.createElement("label");
    label.textContent = `${currentPlaylistIndex + 1}/${playlistVideos.length}`;
    label.className = 'playlistSerial'

    videoControlsWrapper.append(prevBtn, label, nextBtn);

  }

  

  
  
  // TIMER STATUS CONTAINER
  const timerStatus = document.createElement("div");
  timerStatus.className = "timer-status";
  timerStatus.style.marginLeft = "10px";
  timerStatus.style.fontSize = "12px";
  timerStatus.style.color = "var(--text-bold)";
  timerStatus.style.display = "none"; // hidden unless active
  videoControlsWrapper.appendChild(timerStatus);

  
  // Remove button
  const removeBtn = document.createElement("button");
  const removeIcon = document.createElement("i");
  removeIcon.className = "fa-solid fa-xmark fa-xl";
  removeBtn.appendChild(removeIcon);
  removeBtn.className = "remove-btn";

  removeBtn.onclick = () => {
    removeVideo(videoWrapper, videoUrl);
    if (customPlaylist) return deleteCookie("customListDic");

    const dic = getCookie("urlDic");
    if (dic && dic[videoUrl]) {
      delete dic[videoUrl];
      Object.keys(dic).length
        ? setCookie("urlDic", dic, 10)
        : deleteCookie("urlDic");
    }
  };

  videoControlsWrapper.appendChild(removeBtn);

  // Append everything
  videoWrapper.append(iframe, volumeContainer, videoControlsWrapper);
  videosContainer.appendChild(videoWrapper);

  // ---- PLAYER INITIALIZATION ---- //
  initializeYouTubeAPI(iframe, volume, timeFrame);

  // ---- SAVE URL PROPERTIES ---- //
  if (!customPlaylist) {
    const dic = getCookie("urlDic") || {};
    dic[videoUrl] = dic[videoUrl] || { volume, timeFrame };
    setCookie("urlDic", dic, 14);
  }

  // ------------------------------
  //   INNER FUNCTIONS
  // ------------------------------

  function initializeYouTubeAPI(iframe, volume, timeFrame) {
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
            if (e.data === YT.PlayerState.ENDED) return changePlaylistVideo(+1);

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

  function changePlaylistVideo(dir) {
    if (!playlistVideos.length) return;

    currentPlaylistIndex =
      (currentPlaylistIndex + dir + playlistVideos.length) %
      playlistVideos.length;
    if (label)
      label.textContent = `${currentPlaylistIndex + 1}/${playlistVideos.length}`;
    const newUrl = playlistVideos[currentPlaylistIndex];
    const newId = getVideoId(newUrl);

    iframe.src = `https://www.youtube.com/embed/${newId}?autoplay=1&enablejsapi=1`;
    initializeYouTubeAPI(iframe, volumeSlider.value, 0);
    if (customPlaylist) {
      const dic = getCookie("customListDic") || {};
      dic.currentIndex = currentPlaylistIndex;
      setCookie("customListDic", dic, 14);
    }
  }

  function pauseVideo() {
  const modal = document.getElementById("pause-timer-modal");
  const minInput = document.getElementById("timer-min");
  const secInput = document.getElementById("timer-sec");
  modal.style.display = "flex";
  const cancel = document.getElementById("timer-cancel");
  const set = document.getElementById("timer-set");
  function close() {
    modal.style.display = "none";
    cancel.onclick = null;
    set.onclick = null;
  }

  cancel.onclick = close;

  set.onclick = () => {
    let m = parseInt(minInput.value) || 0;
    let s = parseInt(secInput.value) || 0;
    let total = m * 60 + s;

    if (total <= 0) {
      alert("Enter a valid time");
      return;
    }

    close();

    const player = players.find(p => p.getIframe() === iframe);
    if (!player) return;

    // Start countdown
    startCountdownTimer(videoWrapper, total);

    setTimeout(() => player.pauseVideo(), total * 1000);
  };
}

}


function isYouTubeUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace('www.', '');

    return (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'youtu.be'
    );
  } catch (e) {
    return false; // invalid URL
  }
}

async function addVideo() {
  const videoUrlInput = document.getElementById('video-url');
  let videoUrl = videoUrlInput.value.trim();

  if (videoUrl.includes("facebook")) {
    addFacebookVideoPlayer(videoUrl, 50, document.getElementById("videos-container"));
    return
  }
  
  if (videoUrl.includes(",")) {
    filterLink(videoUrl, 60, 0)
    return
  }


  if (!videoUrl) {
    sendWebViewSignal('VIDEO_BROWSE', 'Browse')
    return; // Exit the function if the video URL is empty
  }
  if (isYouTubeUrl(videoUrl)) {
    // handle YouTube
    await filterLink(videoUrl, 60, 0);
  } else {
    // non-YouTube → local HTML5 video
    addLocalVideoPlayer(videoUrl);
    // addOnlineVideoPlayer(videoUrl)
  }





  videoUrlInput.value = '';
}

function OpenBrowser() {
  sendWebViewSignal('VIDEO_BROWSE', 'Browse')
}

async function addVideoFromNative(videoUrl) {
  alert("in addVideoFromNative");
  await filterLink(videoUrl, 70, 0)
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
  try {
    const u = new URL(url);

    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1);
    }

    if (u.pathname.startsWith("/shorts/")) {
      return u.pathname.split("/")[2];
    }

    return u.searchParams.get("v");
  } catch {
    return null;
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
document.getElementById('browse-btn').addEventListener('click', OpenBrowser);
document.getElementById('paste-btn').addEventListener('click', pasteFromClipboard);
document.getElementById('clear-all-button').addEventListener('click', clearAll);
document.getElementById('replay-button').addEventListener('click', replayAll);


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






// function testDirectVideoUrlPlayback(url) {
//   const container = document.getElementById('videos-container') || document.body;
//   const video = document.createElement('video');
//   video.src = url;
//   video.style.width = '100%';
//   video.style.height = 'auto';
//   container.appendChild(video);
//   video.play().catch(() => {
//   });
// }




function addOnlineVideoPlayer(url) {
  const videosContainer = document.getElementById('videos-container') || document.body;

  // Main container (same class as local)
  const videoContainer = document.createElement('div');
  videoContainer.classList.add('video-container');

  // --- VIDEO ELEMENT ---
  const videoPlayer = document.createElement('video');
  videoPlayer.className = 'local-video-player'; // SAME CLASS
  videoPlayer.controls = false;
  videoPlayer.playsInline = true;
  videoPlayer.preload = 'metadata';

  // IMPORTANT: stable layout
  videoPlayer.style.width = '100%';
  videoPlayer.style.height = '240px';
  videoPlayer.style.background = 'black';

  // Append first, then set src (important)
  videoContainer.appendChild(videoPlayer);
  videosContainer.appendChild(videoContainer);

  videoPlayer.src = url;

  // --- PLAY / PAUSE BUTTON ---
  const playPauseBtn = document.createElement('button');
  playPauseBtn.classList.add('video-play-pause');
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';

  function updatePlayIcon() {
    playPauseBtn.innerHTML = videoPlayer.paused
      ? '<i class="fas fa-play"></i>'
      : '<i class="fas fa-pause"></i>';
  }

  playPauseBtn.addEventListener('click', () => {
    if (videoPlayer.paused) {
      videoPlayer.play().catch(() => {});
    } else {
      videoPlayer.pause();
    }
  });

  videoPlayer.addEventListener('play', updatePlayIcon);
  videoPlayer.addEventListener('pause', updatePlayIcon);

  // --- TIMELINE ---
  const sliderContainer = document.createElement('div');
  sliderContainer.classList.add('slider-container');

  const timelineSlider = document.createElement('input');
  timelineSlider.type = 'range';
  timelineSlider.classList.add('timeline-slider');
  timelineSlider.min = 0;
  timelineSlider.value = 0;

  sliderContainer.appendChild(timelineSlider);

  videoPlayer.addEventListener('loadedmetadata', () => {
    timelineSlider.max = videoPlayer.duration || 0;
  });

  videoPlayer.addEventListener('timeupdate', () => {
    timelineSlider.value = videoPlayer.currentTime || 0;
  });

  timelineSlider.addEventListener('input', () => {
    videoPlayer.currentTime = timelineSlider.value;
  });

  // --- VOLUME ---
  const volumeContainer = document.createElement('div');
  volumeContainer.classList.add('volume-container');

  const volumeSlider = document.createElement('input');
  volumeSlider.type = 'range';
  volumeSlider.min = 0;
  volumeSlider.max = 1;
  volumeSlider.step = 0.01;
  volumeSlider.value = 0.8;
  volumeSlider.classList.add('slider');

  volumeContainer.appendChild(volumeSlider);

  volumeSlider.addEventListener('input', () => {
    videoPlayer.volume = volumeSlider.value;
  });

  // --- CONTROLS CONTAINER ---
  const otherVideoControllersContainer = document.createElement('div');
  otherVideoControllersContainer.classList.add('otherVideoControllersContainer');
  otherVideoControllersContainer.appendChild(playPauseBtn);

  const volumeControlerContainer = document.createElement('div');
  volumeControlerContainer.classList.add('volumeControlerContainer');
  volumeControlerContainer.appendChild(volumeContainer);

  const videoControls = document.createElement('div');
  videoControls.classList.add('local-video-controls');
  videoControls.appendChild(otherVideoControllersContainer);
  videoControls.appendChild(volumeControlerContainer);

  // --- FINAL ASSEMBLY ---
  videoContainer.appendChild(sliderContainer);
  videoContainer.appendChild(videoControls);

  // Try autoplay (gesture-safe)
  videoPlayer.play().catch(() => {});
}












const fileInput = document.getElementById('file-input');

async function addLocalVideoPlayer(url, name="", timeFrame = 0, defaultVolume=0.8) {
  return new Promise((resolve, reject) => {
    // 1. Setup Containers and Video Element
    
    const videosContainer = document.getElementById('videos-container');
    const videoContainer = document.createElement('div');
    videoContainer.classList.add('video-container');

    let timeUpdateTimerId = null;

    // Create the HTML5 Video element
    const videoPlayer = document.createElement('video');

    videoPlayer.className = 'local-video-player';
    videoPlayer.src = url;
    videoPlayer.controls = false; // We'll use custom controls
    videoPlayer.loop = false;
    // Set default volume, if you want a video-specific default
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
      // 🔥 MODIFICATION 2: Implement debouncing using the local timer ID
      // ----------------------------------------------------------------------
      clearTimeout(timeUpdateTimerId); // Clear any pending updates for this video
      
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
    
    // const removeButton = document.createElement('button');
    // const RemoveIcon = document.createElement('i');
    // RemoveIcon.className = "fa-solid fa-xmark fa-xl";
    // removeButton.appendChild(RemoveIcon);
    // removeButton.style = 'var(--text-subtle)';
    // removeButton.classList.add('remove-btn');
    // removeButton.addEventListener('click', function() {
    //   videoContainer.remove();
    // });

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
        } else if (item.text == 'Remove'){
          videoContainer.remove();
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

    // 17. Initialize/Update Cookie
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


async function addAudioPlayer(url, name, timeFrame=0, volume=0.8) {
  return new Promise((resolve, reject) => {
  const videosContainer = document.getElementById('videos-container');
  const audioContainer = document.createElement('div');
  audioContainer.classList.add('audio-container');
  const audioPlayer = document.createElement('audio');
  let pauseTimeoutId = null; 
  let countdownIntervalId = null;
  
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
    audioPlayer.loop = !audioPlayer.loop;
    // Toggle icon and update button text based on loop state
    if (audioPlayer.loop) {
      // Remove both classes by separating them with commas
      loopIcon.classList.remove('fa-solid', 'fa-repeat');
      loopIcon.classList.add('fa-solid', 'fa-redo-alt'); 
    } else {
        loopIcon.classList.remove('fa-solid', 'fa-redo-alt');
        loopIcon.classList.add('fa-solid', 'fa-repeat');
    }
  }

  const playBackBtn = document.createElement('button')
  const playBackIcon = document.createElement('i')
  playBackIcon.className = 'fa-solid fa-reply'
  playBackBtn.appendChild(playBackIcon)
  playBackBtn.addEventListener('click', () => {
    audioPlayer.currentTime = 0
  })

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
      timelineSlider.value = audioPlayer.currentTime; 
      timelineSlider.max = audioPlayer.duration;
    }
    else{
      timelineSlider.value = '0';
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
  
  
  const timerStatus = document.createElement("div");
  timerStatus.className = "timer-status";
  timerStatus.style.marginLeft = "10px";
  timerStatus.style.fontSize = "12px";
  timerStatus.style.color = "#333";
  timerStatus.style.display = "none";
  
  
  timeLabelContainer.appendChild(currentTimeLabel);
  timeLabelContainer.appendChild(timerStatus);

  timeLabelContainer.appendChild(durationLabel);


  sliderContainer.appendChild(timeLabelContainer)
  otherAudioControllersContainer.appendChild(playPauseBtn);
  otherAudioControllersContainer.appendChild(backwardButton);
  otherAudioControllersContainer.appendChild(forwardButton);
  otherAudioControllersContainer.appendChild(playBackBtn)
  otherAudioControllersContainer.appendChild(loopBtn);
  otherAudioControllersContainer.appendChild(speedSelect);
  // volumeControlerContainer.appendChild(volumeContainer);
  audioControls.appendChild(otherAudioControllersContainer);
  // audioControls.appendChild(volumeControlerContainer);
  // audioControls.appendChild(volumeContainer)
  const audioFileLabel = document.createElement('label');
  audioFileLabel.textContent = name;
  audioFileLabel.classList.add('AudioFileName');
  
  
  
  
  
  
  
  // const removeButton = document.createElement('button');
  // const RemoveIcon = document.createElement('i');
  // RemoveIcon.className = "fa-solid fa-xmark fa-xl"
  // removeButton.appendChild(RemoveIcon);
  // removeButton.style = 'color: black'
  // removeButton.classList.add('remove-btn');
  // removeButton.addEventListener('click', function () {
  //   audioContainer.remove();
  //   fileInput.value = '';
  // });





    function startCountdownTimer(totalSeconds) {
      console.log("Starting countdown timer for", totalSeconds, "seconds.");
      
      // 1. CLEAR existing interval if present
      if (countdownIntervalId) clearInterval(countdownIntervalId);
      
      let timeLeft = totalSeconds;
      
      // 2. CLEAR the previous content of the timerStatus container
      timerStatus.innerHTML = '';
      
      // --- Timer Display Element ---
      const timerDisplay = document.createElement('span');
      // timerDisplay.style.marginRight = '10px';
      timerStatus.appendChild(timerDisplay);
      
      // --- Edit Button ---
      const editBtn = document.createElement('button');
      editBtn.textContent = '✏️';
      editBtn.style.fontSize = '10px';
      editBtn.style.marginRight = '5px';
      editBtn.style.marginLeft = '5px';
      editBtn.style.padding = '2px'
      editBtn.onclick = () => {
        // 3. Edit: Cancel current timers and call the setup function again
        if (pauseTimeoutId) clearTimeout(pauseTimeoutId);
        if (countdownIntervalId) clearInterval(countdownIntervalId);
        countdownIntervalId = null;
        pauseTimeoutId = null;
        timerStatus.style.display = "none";
        setPauseTimer(); // This function handles getting the new time from the user
      };
      timerStatus.appendChild(editBtn);
      
      // --- Cancel Button ---
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = '❌';
      cancelBtn.style.fontSize = '10px';
      cancelBtn.style.marginRight = '5px';
      cancelBtn.style.padding = '2px'
      cancelBtn.onclick = () => {
        // 4. Cancel: Clear all timers and hide the status
        if (pauseTimeoutId) clearTimeout(pauseTimeoutId);
        if (countdownIntervalId) clearInterval(countdownIntervalId);
        countdownIntervalId = null;
        pauseTimeoutId = null;
        timerStatus.style.display = "none";
      };
      timerStatus.appendChild(cancelBtn);

      const updateDisplay = (time) => {
        const m = Math.floor(time / 60);
        const s = time % 60;
        const formattedMinutes = String(m).padStart(2, "0");
        const formattedSeconds = String(s).padStart(2, "0");
        // 5. Update the dedicated display element
        timerDisplay.textContent = `Pauses in ${formattedMinutes}:${formattedSeconds}`;
      };

      updateDisplay(timeLeft);
      timerStatus.style.display = "flex"; // Use flex to align buttons nicely

      countdownIntervalId = setInterval(() => {
        timeLeft--;
        
        if (timeLeft < 0) {
          clearInterval(countdownIntervalId);
          countdownIntervalId = null;
          
          // Execute pause action
          audioPlayer.pause(); 
          pauseTimeoutId = null; 
          
          // Update status for completion
          timerStatus.textContent = "Paused.";
          
          // Hide status after a brief delay
          setTimeout(() => {
            timerStatus.style.display = "none";
          }, 2000);
        } else {
          updateDisplay(timeLeft);
        }
      }, 1000);
    }



  // --------------------------------------------------------
    //   NEW INNER FUNCTION: Pause Timer Setup
    // --------------------------------------------------------
    function setPauseTimer() {
      // Clear any previous timers before setting a new one
      if (pauseTimeoutId) clearTimeout(pauseTimeoutId);
      if (countdownIntervalId) clearInterval(countdownIntervalId);



  const modal = document.getElementById("pause-timer-modal");
  const mainContainer = document.getElementById('main-contents-container');
  const minInput = document.getElementById("timer-min");
  const secInput = document.getElementById("timer-sec");

  modal.style.display = "flex";
  mainContainer.classList.add('is-blurred');


  const cancel = document.getElementById("timer-cancel");
  const set = document.getElementById("timer-set");

  function close() {
    modal.style.display = "none";
    cancel.onclick = null;
    set.onclick = null;
    mainContainer.classList.remove('is-blurred');
  }

  cancel.onclick = close;

  set.onclick = () => {
    let m = parseInt(minInput.value) || 0;
    let s = parseInt(secInput.value) || 0;
    let total = m * 60 + s;

    if (total <= 0) {
      alert("Enter a valid time");
      return;
    }

    close();

    startCountdownTimer(total);

    // setTimeout(() => player.pauseVideo(), total * 1000);
  };


// }
    }





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
  { text: 'Copy Link', iconClass: 'fas fa-copy' },
  {text: 'Remove', iconClass: 'fa-solid fa-xmark fa-xl'},
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
      setPauseTimer();
    }
    else if (item.text == 'Remove'){ 
      audioContainer.remove();
      fileInput.value = '';
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
  // removeContainer.appendChild(removeButton)
  
  audioContainer.appendChild(removeContainer);
  audioContainer.appendChild(sliderContainer);
  audioContainer.appendChild(audioPlayer);
  audioContainer.appendChild(audioControls);
  audioContainer.appendChild(volumeContainer)
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
  alert("in fiter link");
  return new Promise((resolve, reject) => {
    if (videoUrl.includes(",")){
      let splitedUrls = videoUrl.split(",")
      try{
        addVideoPlayer(splitedUrls[0], volume, speed, true, splitedUrls, timeFrame,0, true); // No need to pass isPlaylist=true
      } catch (error){
        alert(error)
      }
      let customListDic = {}
      customListDic["urls"] = splitedUrls
      customListDic["currentIndex"] = 0
      customListDic["volume"] = 100
      setCookie("customListDic", customListDic, 14);
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

function clearAllCookies() {
  const cookies = document.cookie.split(";");

  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf("=");
    
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
  
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  }
}

fileInput.addEventListener('change', function(event) {
  const files = event.target.files;

  if (files.length > 0) {
    for (const file of files) {
      const url = URL.createObjectURL(file);
      

      const name = file.name;
      if (file.type.startsWith('audio/')) {
        let timeFrame = 0;
        let volume = 0.8;

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
        let timeFrame = 0;
        let volume = 0.8;

        try {
          const fileDic = getCookie("fileDic");
          if (fileDic != null) {
            for (let savedUrl in fileDic) {
              if (savedUrl == url || name == fileDic[savedUrl]["name"]) {
                timeFrame = fileDic[savedUrl]["timeFrame"];
                volume = fileDic[savedUrl]["volume"];
              }
            }
          }
          
          try {
            addLocalVideoPlayer(url, name, timeFrame, volume); 
          } catch (error) {
            alert(error)
          }
        } catch (error) {
          alert(error);
        }
      }
    }
    
    // ⭐ THE CRITICAL LINE TO ADD: Reset the input's value.
    // This makes the browser treat the next selection, even if it's the same file, as a change.
    event.target.value = ''; 
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
  
  var customListDic = getCookie("customListDic");

  if (customListDic !== null) {
    try{
    addVideoPlayer(customListDic["urls"][customListDic["currentIndex"]], customListDic["volume"], 1, true, customListDic["urls"], 0, customListDic["currentIndex"], customPlaylist=true); // No need to pass isPlaylist=true
    } catch (error){
      alert(error)
    }
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


function clearAll() {
  const isConfirmed = confirm("Are you sure you want to clear everything?");
  if (isConfirmed) {
    // Put your logic to clear the inputs/data here
    const container = document.getElementById('videos-container');
    container.innerHTML = '';
    clearAllCookies()
  } else {
    // User clicked 'Cancel', nothing happens
    console.log("Action cancelled.");
  }
}


function replayAll() {
  const videosContainer = document.getElementById('videos-container');
  // 1. Find all video and audio elements inside the container
  const allMedia = videosContainer.querySelectorAll('video, audio');

  // 2. Loop through each media element
  allMedia.forEach(media => {
      // Reset to beginning
      media.currentTime = 0;
      
      // Start playback
      // We use a promise check to avoid errors if a video hasn't loaded yet
      const playPromise = media.play();

      if (playPromise !== undefined) {
          playPromise.catch(error => {
              console.error("Playback failed for one element:", error);
          });
      }
  });

}



