const keyName = 'danger-banner-path-list';
chrome.storage.local.get({ [keyName]: [] }, (result) => {
  if (result[keyName].some((path) => window.location.href.match(path))) {
    const banner = document.createElement('div');
    banner.id = 'danger-banner';
    banner.style = 'position: fixed;' +
      'top: 0;' +
      'left: 0;' +
      'width: 100vw;' +
      'height: 100vh;' +
      'box-sizing: border-box;' +
      'border: solid #EE312D 3px;' +
      'background-image: repeating-linear-gradient(-30deg, #EE312D10, #EE312D10 50px, transparent 50px, transparent 100px);' +
      'pointer-events: none;' +
      'z-index: 9999999';
    document.body.appendChild(banner);
  }
});
