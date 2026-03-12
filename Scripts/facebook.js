
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
