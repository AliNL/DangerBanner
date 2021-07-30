const keyName = 'danger-banner-path-list';
let lastHref = '';
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

const toggleBanner = () => {
  if (window.location.href === lastHref) {
    return;
  }
  lastHref = window.location.href;
  chrome.storage.local.get({ [keyName]: [] }, (result) => {
    banner.style.display = result[keyName].some((path) => window.location.href.match(path)) ? 'block' : 'none';
  });
};

const handleKeydown = ({ shiftKey, metaKey }) => {
  if (shiftKey && metaKey) {
    banner.style.display = 'none';
  }
  setTimeout(() => {
    chrome.storage.local.get({ [keyName]: [] }, (result) => {
      banner.style.display = result[keyName].some((path) => window.location.href.match(path)) ? 'block' : 'none';
    });
  }, 3000);
}

setInterval(toggleBanner, 200);
window.addEventListener('keydown', handleKeydown);
