import {render} from '@testing-library/react';
import '@testing-library/jest-dom';
import App, {keyName, enabledTimeName} from './App';



describe('Render App', () => {

  const fakeTime = 1647878400000;
  jest.setSystemTime(fakeTime);
  window.chrome = {
    storage: {
      local: {
        set: jest.fn()
      }
    }
  };

  afterEach(() => {
    window.chrome.storage.local.get = jest.fn();
  })

  test('should show existing path list and focus on an empty line when open', () => {
    window.chrome.storage.local.get = jest.fn().mockImplementation((config, callback) => {
      config[keyName] = ['existing path 1', 'existing path 2']
      callback(config)
    })
    const {container} = render(<App/>);
    const editable = container.getElementsByClassName('InputContainer');
    expect(editable).toHaveLength(3);
    expect(editable.item(0)).toHaveTextContent('existing path 1');
    expect(editable.item(2)).toHaveTextContent('');
    expect(editable.item(2).firstChild).toHaveFocus();
  })


  test('should focus on an empty line when open given no existing path', () => {
    window.chrome.storage.local.get = jest.fn().mockImplementation((config, callback) => {
      callback(config)
    })
    const {container} = render(<App/>);
    const editable = container.getElementsByClassName('InputContainer');
    expect(editable).toHaveLength(1);
    expect(editable.item(0)).toHaveTextContent('');
    expect(editable.item(0).firstChild).toHaveFocus();
  })

  test('should show disable buttons when open given enabled', () => {
    window.chrome.storage.local.get = jest.fn().mockImplementation((config, callback) => {
      config[enabledTimeName] = 0;
      callback(config)
    })
    const {container} = render(<App/>);
    const buttons = container.getElementsByTagName('button');
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).not.toHaveClass('ant-btn-primary');
  })

  test('should show enable time and enable button when open given disabled', () => {
    window.chrome.storage.local.get = jest.fn().mockImplementation((config, callback) => {
      config[enabledTimeName] = fakeTime + 5000;
      callback(config)
    })
    const {container} = render(<App/>);
    expect(container).toContainHTML('<span>00:00:05</span>');
    const buttons = container.getElementsByTagName('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveClass('ant-btn-primary');
  })

  test('should show enable time with next day when open given enable date is tomorrow', () => {
    window.chrome.storage.local.get = jest.fn().mockImplementation((config, callback) => {
      config[enabledTimeName] = fakeTime + 24 * 60 * 60 * 1000 + 10000;
      callback(config)
    })
    const {container} = render(<App/>);
    expect(container).toContainHTML('<span>00:00:10 next day</span>');
    const buttons = container.getElementsByTagName('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveClass('ant-btn-primary');
  })
});

describe('Modify Path List', () => {

});