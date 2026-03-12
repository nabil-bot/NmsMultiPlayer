let players = [];
const controls = document.getElementById('globalControls');

document.addEventListener("fullscreenchange", () => {
  const fullscreenElement = document.fullscreenElement;
  if (fullscreenElement) {
    sendWebViewSignal('FULL_SCREEN_SIGNAL', 'true');
  } else {
    sendWebViewSignal('FULL_SCREEN_SIGNAL', 'false');
  }
});

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

function sendWebViewSignal(type_, title_) {
  try {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: type_, title: title_ }));
  } catch (error) {
    alert(error);
  }
}




const pendingRequests = new Map();

function callNative(type, payload) {
  const requestId = Math.random().toString(36).substring(7);
  
  return new Promise((resolve, reject) => {
    pendingRequests.set(requestId, { resolve, reject });

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: type,
      requestId: requestId,
      payload: payload // This matches message.payload in RN
    }));
  });
}

// Updated these to wrap the keys in an object
async function saveDataLocal(key, value) {
  return callNative('@save_data', { dataKey: key, data: value });
}

async function pushDataLocal(key, value) {
  return callNative('@push_data', { dataKey: key, data: value });
}

async function loadDataLocal(key) {
  return callNative('@load_data', { dataKey: key });
}

async function removeDataLocal(key) {
  return callNative('@remove_data', { dataKey: key});
}

window.onNativeResponse = function(response) {
  // Ensure we handle both string and object responses depending on how sendToWeb is built
  const { requestId, data, error } = typeof response === 'string' ? JSON.parse(response) : response;
  
  if (pendingRequests.has(requestId)) {
    const { resolve, reject } = pendingRequests.get(requestId);
    if (error) reject(error);
    else resolve(data);
    pendingRequests.delete(requestId);
  }
};


function loadPlaylist() {
  // removeDataLocal('ytPlaylist');
  loadDataLocal('ytPlaylist').then((data) => {
    if (!data) return alert("Empty!");

    let names;
    if (Array.isArray(data)) {
        // If it's an array, get the 'name' property
        names = data.map(item => item.name || "Unnamed");
    } else {
        // If it's an object, get the keys
        names = Object.keys(data);
    }
    alert("Playlists found:\n" + `num of videos: ${data[names[0]].urlList.length}`);
});

}


function keepLastFiveElements(obj) {
  let entries = Object.entries(obj);
  if (entries.length > 5) {
      entries = entries.slice(-5);
  }
  return Object.fromEntries(entries);
}

async function get_timer_time(title) {
  return new Promise((resolve, reject) => {
    const titleElement = document.getElementById("timerTitle");
    titleElement.textContent = title;

    const modal = document.getElementById("pause-timer-modal");
    const mainContainer = document.getElementById('main-contents-container');
    const minInput = document.getElementById("timer-min");
    const secInput = document.getElementById("timer-sec");

    const cancel = document.getElementById("timer-cancel");
    const set = document.getElementById("timer-set");

    modal.style.display = "flex";
    mainContainer.classList.add('is-blurred');

    function close() {
      modal.style.display = "none";
      cancel.onclick = null;
      set.onclick = null;
      mainContainer.classList.remove('is-blurred');
    }

    cancel.onclick = () => {
      close();
      reject("User cancelled");
    };

    set.onclick = () => {
      let m = parseInt(minInput.value) || 0;
      let s = parseInt(secInput.value) || 0;
      let total = m * 60 + s;

      if (total <= 0) {
        alert("Enter a valid time");
        return;
      }

      close();
      resolve(total);   // ✅ this sends value back
    };
  });
}




const mediaTimers = new Map();


function removeMediaTimer(media) {
  const timer = mediaTimers.get(media);

  if (!timer) return;
  clearInterval(timer.interval);
  timer.timerStatus.style.display = "none";
  mediaTimers.delete(media);
}



function editMediaTimer(media, newTime, type_) {
  const timer = mediaTimers.get(media);

  if (!timer) return;

  startMediaTimer(
    media,
    newTime,
    timer.operation,
    timer.timerStatus,
    type_
  );
}


function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}


function startMediaTimer(media, time, operation, timerStatus, type_='') {
  // If already has timer → remove first
  removeMediaTimer(media);

  let remaining = time;

  // container.textContent = formatTime(remaining);
  timerStatus.innerHTML = '';

  // --- Timer Display Element ---
  const timerDisplay = document.createElement('span');
  timerDisplay.classList.add('timer-display');

  // --- Edit Button ---
  const editBtn = document.createElement('button');
  editBtn.textContent = '✏️';
  editBtn.classList.add('edit-timer-button');
  editBtn.onclick = () => {
      // 3. Edit: Cancel current timers and call the setup function again
      get_timer_time(`Set ${operation} timer`).then((pauseTime) =>
        editMediaTimer(media, pauseTime, type_)
      );
    };


   // --- Cancel Button ---
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '❌';

    cancelBtn.classList.add('cancel-timer-button');
    cancelBtn.onclick = () => {
      removeMediaTimer(media);
    };


    timerStatus.appendChild(editBtn);
    timerStatus.appendChild(timerDisplay);
    timerStatus.appendChild(cancelBtn);  


    const updateDisplay = (time) => {
        const m = Math.floor(time / 60);
        const s = time % 60;
        const formattedMinutes = String(m).padStart(2, "0");
        const formattedSeconds = String(s).padStart(2, "0");
        // 5. Update the dedicated display element
        timerDisplay.textContent = `${operation} in ${formattedMinutes}:${formattedSeconds}`;
      };

    updateDisplay(remaining);
    timerStatus.style.display = "flex"; 

  const interval = setInterval(() => {
    remaining--;

    // container.textContent = formatTime(remaining);
    updateDisplay(remaining)

    if (remaining <= 0) {
      clearInterval(interval);

      if (operation === "play") {
        if (type_===''){
            media.play();
        } else if (type_ === 'youtube') {
            media.playVideo();
        }
      } else {
        if (type_===''){
            media.pause();
        } else if (type_ === 'youtube') {
            media.pauseVideo();
        }
      }
      // container.textContent = "";
      timerStatus.style.display = "none";
      mediaTimers.delete(media);
    }

  }, 1000);

  mediaTimers.set(media, {
    interval,
    operation,
    timerStatus
  });
}




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


function removeVideo(videoWrapper, videoUrl) {
  const iframe = videoWrapper.querySelector('iframe');
  const videoId = iframe.src.split('/').pop().split('?')[0];
  players = players.filter(player => player.getVideoData().video_id !== videoId);
  videoWrapper.remove();
  
}





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

function clearAll() {
  const isConfirmed = confirm("Are you sure you want to clear everything?");
  if (isConfirmed) {
    // Put your logic to clear the inputs/data here
    const container = document.getElementById('videos-container');
    container.innerHTML = '';
    clearAllCookies()
    players = [];
    controls.style.display = 'none';
    showHideGlobarControls()
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
      const playPromise = media.play();
      if (playPromise !== undefined) {
          playPromise.catch(error => {
              console.error("Playback failed for one element:", error);
          });
      }
  });

  players.forEach(player => {
    player.seekTo(0);
    player.playVideo();
  });
}

function hasMedia() {
  const container = document.getElementById('videos-container');
  return container.hasChildNodes();
}

function showHideGlobarControls() {
  if (hasMedia()) {
    controls.style.display = 'flex';
  } else {
    controls.style.display = 'none';
  }
}