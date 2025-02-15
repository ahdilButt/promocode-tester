document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const statusDiv = document.getElementById('status');
    const logDiv = document.getElementById('log');

    function addLog(message) {
        // Don't log error messages about message channel
        if (message.includes('message channel closed')) {
            return;
        }
        const logEntry = document.createElement('div');
        logEntry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
        logDiv.insertBefore(logEntry, logDiv.firstChild);
    }

    async function injectContentScript() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) {
                throw new Error('No active tab found');
            }

            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['src/content.js']
            });

            return true;
        } catch (error) {
            console.error('Injection error:', error);
            statusDiv.textContent = 'Error: Could not inject script. Please refresh the page and try again.';
            addLog('Error: Script injection failed');
            return false;
        }
    }

    async function sendMessageToTab(message) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) {
                throw new Error('No active tab found');
            }
            return await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
            if (!error.message.includes('message channel closed')) {
                addLog(`Error: ${error.message}`);
            }
            return null;
        }
    }

    startButton.addEventListener('click', async () => {
        logDiv.textContent = '';
        addLog('Preparing to test...');
        
        startButton.disabled = true;
        statusDiv.textContent = 'Initializing...';

        const injected = await injectContentScript();
        if (!injected) {
            startButton.disabled = false;
            return;
        }

        // Give the content script time to initialize
        await new Promise(resolve => setTimeout(resolve, 500));

        stopButton.disabled = false;
        statusDiv.textContent = 'Testing promo codes...';
        addLog('Starting promo code test...');

        await sendMessageToTab({ action: 'startTesting' });
    });

    stopButton.addEventListener('click', async () => {
        await sendMessageToTab({ action: 'stopTesting' });
        startButton.disabled = false;
        stopButton.disabled = true;
        statusDiv.textContent = 'Testing stopped';
        addLog('Testing stopped by user');
    });

    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message) => {
        switch (message.type) {
            case 'progress':
                statusDiv.textContent = message.message;
                addLog(message.message);
                break;
                
            case 'error':
                if (!message.message.includes('message channel closed')) {
                    statusDiv.textContent = message.message;
                    addLog(`Error: ${error.message}`);
                }
                startButton.disabled = false;
                stopButton.disabled = true;
                break;
                
            case 'complete':
                statusDiv.textContent = message.message || 'Testing complete!';
                addLog(message.message || 'Testing complete');
                startButton.disabled = false;
                stopButton.disabled = true;
                break;
        }
    });
});