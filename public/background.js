const keyName = 'danger-banner-path-list';
const enabledTimeName = 'danger-banner-enabled-time';
let timeout = null;

const informActiveTabs = () => {
  chrome.tabs.query({ active: true, status: 'complete' }, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, 'refresh', undefined, (response) => {
        if (!response) {
          chrome.tabs.reload(tab.id);
        }
      });
    });
  });
};

const enabledMode = () => {
  chrome.browserAction.setIcon({
    path: {
      16: 'images/icon16.png',
      32: 'images/icon32.png',
      48: 'images/icon48.png',
      128: 'images/icon128.png',
    },
  });
  chrome.browserAction.setBadgeText({ text: '' });
  informActiveTabs();
};

const disabledMode = () => {
  chrome.browserAction.setIcon({
    path: {
      16: 'images/icon16-disabled.png',
      32: 'images/icon32-disabled.png',
      48: 'images/icon48-disabled.png',
      128: 'images/icon128-disabled.png',
    },
  });
  chrome.browserAction.setBadgeText({ text: '!' });
  informActiveTabs();
};

const enable = () => {
  enabledMode();
  clearTimeout(timeout);
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.browserAction.setBadgeBackgroundColor({ color: '#EE312D' });
  chrome.storage.local.get({ [keyName]: [], [enabledTimeName]: 0 }, (result) => {
    if (result[enabledTimeName] < Date.now()) {
      enabledMode();
    } else {
      disabledMode();
    }
  });
});

chrome.tabs.onActivated.addListener(informActiveTabs);

chrome.runtime.onMessage.addListener((message) => {
  if (message === 0) {
    enable();
  } else {
    disabledMode();
    timeout = setTimeout(enable, message);
  }
});
