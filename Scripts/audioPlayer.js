

async function addAudioPlayer(url, name, timeFrame=0, volume=0.8, fileInput) {
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
  audioFileLabel.classList.add('MediaNameLable');
  
  
  function setPauseTimer() {
        get_timer_time("Set Pause Timer").then((pauseTime) => {
        startMediaTimer(audioPlayer, pauseTime, "pause", timerStatus);
        });}
  function setPlayTimer() {
        get_timer_time("Set Play Timer").then((playTime) => {
        startMediaTimer(audioPlayer, playTime, "play", timerStatus);
        });
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
  { text: "Set Play Timer", iconClass: "fas fa-play" },
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
    if (item.text == 'Set Pause Timer'){ 
      setPauseTimer();
    }
    else if (item.text == "Set Play Timer"){
      setPlayTimer();
    }
    else if (item.text == 'Remove'){ 

      menu.style.display = 'none'; // Hide the menu after clicking
      audioContainer.remove();
      fileInput.value = '';
      showHideGlobarControls();
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

