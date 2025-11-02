// Track the popup window
let popupWindowId = null;

// Create or focus the popup window
async function togglePopupWindow() {
    try {
        // Check if window already exists
        if (popupWindowId) {
            try {
                const window = await chrome.windows.get(popupWindowId);
                if (window) {
                    // Window exists, bring it to focus
                    await chrome.windows.update(popupWindowId, { focused: true });
                    return;
                }
            } catch (error) {
                // Window doesn't exist anymore, reset the ID
                popupWindowId = null;
            }
        }

        // Create new window
        const window = await chrome.windows.create({
            url: chrome.runtime.getURL('popup.html'),
            type: 'popup',
            width: 400,
            height: 500,
            left: 100,
            top: 100
        });

        popupWindowId = window.id;

        // Listen for window closure
        chrome.windows.onRemoved.addListener((closedWindowId) => {
            if (closedWindowId === popupWindowId) {
                popupWindowId = null;
            }
        });

    } catch (error) {
        console.error('Error creating popup window:', error);
    }
}

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
    if (command === 'open-progress-tracker') {
        togglePopupWindow();
    }
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getVideoData') {
        // Forward to content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.url?.includes('youtube.com/watch')) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'getVideoData' }, (response) => {
                    // Forward response to popup window if it exists
                    if (popupWindowId) {
                        chrome.runtime.sendMessage({
                            action: 'videoDataUpdate',
                            data: response
                        });
                    }
                });
            }
        });
    }
});