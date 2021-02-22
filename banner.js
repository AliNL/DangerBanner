var keyName = 'danger-banner-domain-list';
chrome.storage.local.get({ [keyName]: [] }, function (result) {
  if (result[keyName].includes(window.location.hostname)) {
    var banner = document.createElement('div');
    banner.id = 'danger-banner';
    banner.style = 'position: fixed;' +
      'top: 0;' +
      'width: 100vw;' +
      'text-align: center;' +
      'background-color: #EE312D;' +
      'color: white;' +
      'font-size: 16px;' +
      'font-family: sans-serif;' +
      'font-weight: bold;' +
      'line-height: 40px;' +
      'height: 40px;' +
      'z-index: 9999999';
    banner.appendChild(document.createTextNode('DANGEROUS AREA'));
    document.body.appendChild(banner);
    document.body.style = 'border-top: solid #EE312D 40px;';
  }
});
