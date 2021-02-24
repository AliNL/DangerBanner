const keyName = 'danger-banner-path-list';
const bannerId = 'danger-banner';
let lastHref = '';

const addBanner = () => {
  if (window.location.href === lastHref) {
    return;
  }
  lastHref = window.location.href;
  chrome.storage.local.get({ [keyName]: [] }, (result) => {
    const bannerElement = document.getElementById(bannerId);
    if (result[keyName].some((path) => window.location.href.match(path))) {
      if (!bannerElement) {
        const banner = document.createElement('div');
        banner.id = bannerId;
        banner.style = 'position: fixed;' +
          'top: 0;' +
          'left: 0;' +
          'width: 100vw;' +
          'height: 100vh;' +
          'box-sizing: border-box;' +
          'border: solid #EE312D 3px;' +
          'background-image: repeating-linear-gradient(-30deg, #EE312D10, #EE312D10 100px, transparent 100px, transparent 200px);' +
          'pointer-events: none;' +
          'z-index: 9999999';
        document.body.appendChild(banner);
      }
    } else {
      if (bannerElement) {
        bannerElement.remove();
      }
    }
  });
};

setInterval(addBanner, 100);
