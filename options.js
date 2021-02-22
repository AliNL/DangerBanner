function initialize() {
  var keyName = 'danger-banner-domain-list';
  var dangerousDomains;
  document.getElementById('container').remove();
  var container = document.createElement('div');
  container.id = 'container';
  document.body.insertBefore(container, document.getElementById('buttons'));
  chrome.storage.local.get({ [keyName]: [] }, function (result) {
    if (result[keyName].length === 0) {
      addRow(undefined, '');
      return;
    }
    for (var i = 0; i < result[keyName].length; i++) {
      addRow(undefined, result[keyName][i]);
    }
  });
}

function saveOptions() {
  var keyName = 'danger-banner-domain-list';
  var domains = document.getElementsByTagName('input');
  var dangerousDomains = [];
  for (var i = 0; i < domains.length; i++) {
    var currentDomain = domains[i].value.trim();
    if (currentDomain !== '') {
      currentDomain = currentDomain.replace('http://', '');
      currentDomain = currentDomain.replace('https://', '');
      currentDomain = currentDomain.replace(/\/.*/, '');
      if (!dangerousDomains.includes(currentDomain)) {
        dangerousDomains.push(currentDomain);
      }
    }
  }
  chrome.storage.local.set({ [keyName]: dangerousDomains }, function () {
    console.log('Saved');
  });
  initialize();
}

function addRow(event, initValue) {
  var newRow = document.createElement('input');
  newRow.placeholder = 'Please input dangerous domain';
  if (initValue) {
    newRow.value = initValue;
  }
  document.getElementById('container').appendChild(newRow);
}

document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('add').addEventListener('click', addRow);
initialize();
