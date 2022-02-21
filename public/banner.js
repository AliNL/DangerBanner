const keyName = 'danger-banner-path-list';
const enabledTimeName = 'danger-banner-enabled-time';
const banner = document.createElement('div');
banner.style = 'position: fixed;' +
  'top: 0;' +
  'left: 0;' +
  'width: 100vw;' +
  'height: 100vh;' +
  'box-sizing: border-box;' +
  'border: solid #EE312D 3px;' +
  'background-image: repeating-linear-gradient(-30deg, #EE312D10, #EE312D10 100px, transparent 100px, transparent 200px);' +
  'pointer-events: none;' +
  'z-index: 9999999;' +
  'display: none;';
document.body.appendChild(banner);

let interval = null;
let lastHref = '';

const toggleBanner = () => {
  try {
    chrome.storage.local.get({[keyName]: [], [enabledTimeName]: 0}, (result) => {
      if (result[enabledTimeName] < Date.now()) {
        banner.style.display = result[keyName].some((path) => {
          if (path.startsWith('/') && path.endsWith('/')) {
            return window.location.href.match(path.slice(1, path.length - 1));
          }
          return window.location.href.includes(path);
        }) ? 'block' : 'none';
      } else {
        banner.style.display = 'none';
      }
    })
  } catch (e) {
    console.log('Please refresh the page');
    clearInterval(interval);
  }
};

chrome.runtime.onMessage.addListener(() => {
  toggleBanner();
});

interval = setInterval(() => {
  if (window.location.href !== lastHref) {
    lastHref = window.location.href;
    toggleBanner();
  }
}, 200);
