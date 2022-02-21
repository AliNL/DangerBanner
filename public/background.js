let timeout = null;
let interval = null;
let colorIdx = 0;

chrome.browserAction.setBadgeBackgroundColor({color: "rgb(255, 0, 0)"});


const enable = () => {
  chrome.browserAction.setBadgeText({text: ''}, () => {
    clearTimeout(timeout);
    clearInterval(interval);
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, 'refresh');
    });
  });
}

const blink = () => {
  chrome.browserAction.setBadgeBackgroundColor({color: `rgb(${255 - Math.abs(colorIdx)}, 0, 0)`});
  colorIdx = colorIdx > 235 ? -255 : colorIdx + 20;
}

chrome.tabs.onUpdated.addListener((tabId) => {
  chrome.tabs.sendMessage(tabId, 'refresh');
});

chrome.tabs.onActivated.addListener(() => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, 'refresh');
  });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message === 0) {
    chrome.browserAction.setBadgeText({text: ''}, () => {
      enable();
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, 'refresh');
      });
    })
  } else {
    chrome.browserAction.setBadgeText({text: '!'}, () => {
      interval = setInterval(blink, 50);
      timeout = setTimeout(enable, message);
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, 'refresh');
      });
    })
  }
});
