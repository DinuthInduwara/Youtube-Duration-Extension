let refreshInterval;

// Format time as HH:MM:SS
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update the progress circle
function updateProgressCircle(percentage) {
    const circle = document.querySelector('.progress-fill');
    const text = document.querySelector('.progress-text');
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (percentage / 100) * circumference;

    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = offset;
    text.textContent = `${Math.round(percentage)}%`;
}

// Update the progress bar
function updateProgressBar(percentage) {
    const bar = document.querySelector('.progress-fill-bar');
    bar.style.width = `${percentage}%`;
}

// Update the popup with video data
function updatePopup(videoData) {
    if (!videoData || !videoData.isPlaying) {
        document.getElementById('noVideo').classList.remove('hidden');
        document.getElementById('videoInfo').classList.add('hidden');
        return;
    }

    document.getElementById('noVideo').classList.add('hidden');
    document.getElementById('videoInfo').classList.remove('hidden');

    // Update basic info
    document.getElementById('videoTitle').textContent = videoData.title || 'Unknown Title';
    document.getElementById('channelName').textContent = videoData.channel || 'Unknown Channel';
    document.getElementById('playbackSpeed').textContent = `${videoData.playbackRate}x`;

    // Calculate times
    const totalSeconds = videoData.duration;
    const elapsedSeconds = videoData.currentTime;
    const remainingSeconds = totalSeconds - elapsedSeconds;
    const remainingAtSpeed = remainingSeconds / videoData.playbackRate;
    const progressPercent = (elapsedSeconds / totalSeconds) * 100;

    // Update progress indicators
    updateProgressCircle(progressPercent);
    updateProgressBar(progressPercent);

    // Update time displays
    document.getElementById('elapsedTime').textContent = formatTime(elapsedSeconds);
    document.getElementById('remainingTime').textContent = formatTime(remainingSeconds);
    document.getElementById('remainingAtSpeed').textContent = formatTime(remainingAtSpeed);
    document.getElementById('totalDuration').textContent = formatTime(totalSeconds);
    document.getElementById('progressPercent').textContent = `${Math.round(progressPercent)}%`;
}

// Get video data from content script
async function getVideoData() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tab.url?.includes('youtube.com/watch')) {
            chrome.tabs.sendMessage(tab.id, { action: 'getVideoData' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log('No video data available');
                    updatePopup(null);
                    return;
                }
                updatePopup(response);
            });
        } else {
            updatePopup(null);
        }
    } catch (error) {
        console.log('Error getting video data:', error);
        updatePopup(null);
    }
}

// Start auto-refresh
function startAutoRefresh() {
    getVideoData(); // Initial call
    refreshInterval = setInterval(getVideoData, 1000);
}

// Stop auto-refresh
function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
    startAutoRefresh();
});

// Clean up when popup closes
window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
});