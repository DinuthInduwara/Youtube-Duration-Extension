let lastVideoData = null;

// Extract video title from YouTube page
function getVideoTitle() {
    const selectors = [
        'h1.ytd-watch-metadata yt-formatted-string',
        '.title.style-scope.ytd-video-primary-info-renderer',
        'h1 yt-formatted-string',
        'h1.title',
        '#container > h1'
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
            return element.textContent.trim();
        }
    }

    return document.title.replace(' - YouTube', '');
}

// Extract channel name from YouTube page
function getChannelName() {
    const selectors = [
        '#owner #channel-name a',
        '#channel-name a',
        '#upload-info yt-formatted-string a',
        '.ytd-channel-name a',
        '#owner-name a'
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
            return element.textContent.trim();
        }
    }

    return 'Unknown Channel';
}

// Get video element and its properties
function getVideoData() {
    const video = document.querySelector('video');

    if (!video) {
        return {
            isPlaying: false,
            title: null,
            channel: null,
            duration: 0,
            currentTime: 0,
            playbackRate: 1
        };
    }

    return {
        isPlaying: !video.paused && video.duration > 0,
        title: getVideoTitle(),
        channel: getChannelName(),
        duration: video.duration,
        currentTime: video.currentTime,
        playbackRate: video.playbackRate
    };
}

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getVideoData') {
        const videoData = getVideoData();
        sendResponse(videoData);
    }
    return true;
});

// Observe DOM changes to detect video changes
const observer = new MutationObserver(() => {
    const currentVideoData = getVideoData();

    // Check if video changed significantly
    if (!lastVideoData ||
        Math.abs(currentVideoData.duration - lastVideoData.duration) > 1 ||
        currentVideoData.title !== lastVideoData.title) {
        lastVideoData = currentVideoData;
    }
});

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'title']
});

// Also listen for video events
document.addEventListener('loadeddata', () => {
    lastVideoData = getVideoData();
}, true);

document.addEventListener('canplay', () => {
    lastVideoData = getVideoData();
}, true);