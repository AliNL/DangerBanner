const initialize = () => {
  const keyName = 'danger-banner-path-list';
  document.getElementById('container').remove();
  const container = document.createElement('div');
  container.id = 'container';
  document.body.insertBefore(container, document.getElementById('buttons'));
  chrome.storage.local.get({ [keyName]: [] }, (result) => {
    if (result[keyName].length === 0) {
      addRow(undefined, '');
    } else {
      result[keyName].forEach((path) => {
        addRow(undefined, path);
      });
    }
  });
};

const saveOptions = () => {
  const keyName = 'danger-banner-path-list';
  const paths = document.getElementsByTagName('input');
  const dangerousPaths = [];
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i].value.trim();
    if (path !== '' && !dangerousPaths.includes(path)) {
      dangerousPaths.push(path);
    }
  }
  chrome.storage.local.set({ [keyName]: dangerousPaths }, function () {
    console.log('Saved');
  });
  initialize();
};

const addRow = (event, initValue) => {
  const newRow = document.createElement('input');
  newRow.placeholder = 'Please input dangerous path';
  newRow.value = initValue || '';
  document.getElementById('container').appendChild(newRow);
};

document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('add').addEventListener('click', addRow);
initialize();
