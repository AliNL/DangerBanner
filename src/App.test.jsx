import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import App, { keyName, enabledTimeName } from './App';

const fakeTime = 1647878400000;
const fakeFetch = jest.fn();
const fakeSave = jest.fn();
const fakeTabs = jest.fn();
const fakePost = jest.fn();
const fakeTabId = 2;
jest.setSystemTime(fakeTime);
window.chrome = {
  storage: {
    local: {
      get: fakeFetch,
      set: fakeSave,
    },
  },
  runtime: {
    sendMessage: fakePost,
  },
  tabs: {
    query: fakeTabs,
    sendMessage: fakePost,
  },
};

describe('Render App', () => {
  test('should show existing path list and focus on an empty line when open', () => {
    fakeFetch.mockImplementation((config, callback) => {
      callback({ ...config, [keyName]: ['existing path 1', 'existing path 2'] });
    });
    const { container } = render(<App />);
    const editable = container.getElementsByClassName('InputContainer');
    expect(editable).toHaveLength(3);
    expect(editable.item(0)).toHaveTextContent('existing path 1');
    expect(editable.item(2)).toHaveTextContent('');
    expect(editable.item(2).firstChild).toHaveFocus();
  });

  test('should focus on an empty line when open given no existing path', () => {
    fakeFetch.mockImplementation((config, callback) => {
      callback(config);
    });
    const { container } = render(<App />);
    const editable = container.getElementsByClassName('InputContainer');
    expect(editable).toHaveLength(1);
    expect(editable.item(0)).toHaveTextContent('');
    expect(editable.item(0).firstChild).toHaveFocus();
  });

  test('should show disable buttons when open given enabled', () => {
    fakeFetch.mockImplementation((config, callback) => {
      callback({ ...config, [enabledTimeName]: 0 });
    });
    const { container } = render(<App />);
    const buttons = container.getElementsByClassName('Footer')[0].getElementsByTagName('button');
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).not.toHaveClass('ant-btn-primary');
  });

  test('should show enable time and enable button when open given disabled', () => {
    fakeFetch.mockImplementation((config, callback) => {
      callback({ ...config, [enabledTimeName]: fakeTime + 5000 });
    });
    const { container } = render(<App />);
    expect(container).toContainHTML('<span>00:00:05</span>');
    const buttons = container.getElementsByClassName('Footer')[0].getElementsByTagName('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveClass('ant-btn-primary');
  });

  test('should show enable time with next day when open given enable date is tomorrow', () => {
    fakeFetch.mockImplementation((config, callback) => {
      callback({ ...config, [enabledTimeName]: fakeTime + 24 * 60 * 60 * 1000 + 10000 });
    });
    const { container } = render(<App />);
    expect(container).toContainHTML('<span>00:00:10 next day</span>');
    const buttons = container.getElementsByClassName('Footer')[0].getElementsByTagName('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveClass('ant-btn-primary');
  });
});

describe('Modify Path List', () => {
  beforeEach(() => {
    jest.useRealTimers();
  });
  afterEach(() => {
    jest.useFakeTimers('modern').setSystemTime(fakeTime);
  });
  test('should save valid string to path list and add an empty line when press enter', () => {
    fakeFetch.mockImplementation((config, callback) => {
      callback(config);
    });
    const { container } = render(<App />);
    const [{ firstChild: input }] = container.getElementsByClassName('InputContainer');
    userEvent.type(input, ' test {enter}');
    const editable = container.getElementsByClassName('InputContainer');
    expect(editable).toHaveLength(2);
    expect(fakeSave).toHaveBeenCalledTimes(1);
    expect(fakeSave).toHaveBeenCalledWith({ [keyName]: ['test'] }, expect.anything());
  });

  test('should save valid regex to path list and add an empty line when press enter', () => {
    fakeFetch.mockImplementation((config, callback) => {
      callback(config);
    });
    const { container } = render(<App />);
    const [{ firstChild: input }] = container.getElementsByClassName('InputContainer');
    userEvent.type(input, ' /test.*/ {enter}');
    const editable = container.getElementsByClassName('InputContainer');
    expect(editable).toHaveLength(2);
    expect(fakeSave).toHaveBeenCalledTimes(1);
    expect(fakeSave).toHaveBeenCalledWith({ [keyName]: ['/test.*/'] }, expect.anything());
  });

  test('should not save empty string to path list when press enter', () => {
    fakeFetch.mockImplementation((config, callback) => {
      callback(config);
    });
    const { container } = render(<App />);
    const [{ firstChild: input }] = container.getElementsByClassName('InputContainer');
    userEvent.type(input, '  {enter}');
    const editable = container.getElementsByClassName('InputContainer');
    expect(editable).toHaveLength(1);
    expect(fakeSave).not.toHaveBeenCalled();
  });

  test('should not save empty regex to path list when press enter', () => {
    fakeFetch.mockImplementation((config, callback) => {
      callback(config);
    });
    const { container } = render(<App />);
    const [{ firstChild: input }] = container.getElementsByClassName('InputContainer');
    userEvent.type(input, ' // {enter}');
    const editable = container.getElementsByClassName('InputContainer');
    expect(editable).toHaveLength(1);
    expect(fakeSave).not.toHaveBeenCalled();
  });

  test('should show unsaved label when blur after change', () => {
    fakeFetch.mockImplementation((config, callback) => {
      callback(config);
    });
    const { container } = render(<App />);
    const [{ firstChild: input }] = container.getElementsByClassName('InputContainer');
    userEvent.type(input, 'whatever');
    userEvent.tab();
    const [editable] = container.getElementsByClassName('InputContainer');
    expect(fakeSave).not.toHaveBeenCalled();
    expect(editable).toHaveClass('unsaved');
    expect(editable.firstChild.nodeName).toBe('INPUT');
  });

  test('should not show unsaved label or keep edit mode when blur without change', () => {
    fakeFetch.mockImplementation((config, callback) => {
      callback({ ...config, [keyName]: ['existing path 1'] });
    });
    const { container } = render(<App />);
    const [path1, newLine] = container.getElementsByClassName('InputContainer');
    userEvent.click(path1.firstChild);
    expect(path1.firstChild.nodeName).toBe('INPUT');
    userEvent.click(newLine.firstChild);
    expect(newLine.firstChild).toHaveFocus();
    expect(path1.firstChild.nodeName).toBe('BUTTON');
    expect(fakeSave).not.toHaveBeenCalled();
    expect(path1).not.toHaveClass('unsaved');
  });

  test('should not add a new line when press enter on previous lines', () => {
    fakeFetch.mockImplementation((config, callback) => {
      callback({ ...config, [keyName]: ['existing path 1'] });
    });
    const { container } = render(<App />);
    const [path1] = container.getElementsByClassName('InputContainer');
    userEvent.click(path1.firstChild);
    userEvent.type(path1.firstChild, ' add something {enter}');
    const editable = container.getElementsByClassName('InputContainer');
    expect(editable[0].firstChild.nodeName).toBe('BUTTON');
    expect(editable).toHaveLength(2);
    expect(fakeSave).toHaveBeenCalledTimes(1);
    expect(fakeSave).toHaveBeenCalledWith({ [keyName]: ['existing path 1 add something'] }, expect.anything());
  });

  test('should delete existing path when click delete icon', () => {
    fakeFetch.mockImplementation((config, callback) => {
      callback({ ...config, [keyName]: ['existing path 1'] });
    });
    const { container } = render(<App />);
    const [path1] = container.getElementsByClassName('InputContainer');
    userEvent.click(path1.lastChild);
    const editable = container.getElementsByClassName('InputContainer');
    expect(editable).toHaveLength(1);
    expect(fakeSave).toHaveBeenCalledTimes(1);
    expect(fakeSave).toHaveBeenCalledWith({ [keyName]: [] }, expect.anything());
  });

  test('should keep the unchanged value in existing line when save another line', () => {
    fakeFetch.mockImplementation((config, callback) => {
      callback({ ...config, [keyName]: ['existing path 1', 'existing path 2'] });
    });
    const { container } = render(<App />);
    const [path1, path2] = container.getElementsByClassName('InputContainer');
    userEvent.click(path1.firstChild);
    userEvent.type(path1.firstChild, ' add something ');
    userEvent.click(path2.firstChild);
    userEvent.type(path2.firstChild, ' add something {enter}');
    const editable = container.getElementsByClassName('InputContainer');
    expect(editable[0].firstChild.nodeName).toBe('INPUT');
    expect(editable[0].firstChild).toHaveValue('existing path 1 add something ');
    expect(editable[0]).toHaveClass('unsaved');
    expect(editable).toHaveLength(3);
    expect(fakeSave).toHaveBeenCalledTimes(1);
    expect(fakeSave).toHaveBeenCalledWith({ [keyName]: ['existing path 1', 'existing path 2 add something'] }, expect.anything());

    userEvent.click(path1.firstChild);
    userEvent.type(path1.firstChild, '{enter}');
    expect(fakeSave).toHaveBeenCalledTimes(2);
    expect(fakeSave).toHaveBeenCalledWith({ [keyName]: ['existing path 1 add something', 'existing path 2 add something'] }, expect.anything());
    expect(editable[0].firstChild.nodeName).toBe('BUTTON');
    expect(editable[0]).not.toHaveClass('unsaved');
  });

  test('should keep the unchanged value in new line when save another line', () => {
    fakeFetch.mockImplementation((config, callback) => {
      callback({ ...config, [keyName]: ['existing path 1'] });
    });
    const { container } = render(<App />);
    const [path1, newLine] = container.getElementsByClassName('InputContainer');
    userEvent.click(newLine.firstChild);
    userEvent.type(newLine.firstChild, ' add something ');
    userEvent.click(path1.firstChild);
    userEvent.type(path1.firstChild, ' add something {enter}');

    expect(newLine.firstChild.nodeName).toBe('INPUT');
    expect(newLine.firstChild).toHaveValue(' add something ');
    expect(newLine).toHaveClass('unsaved');
    expect(fakeSave).toHaveBeenCalledTimes(1);
    expect(fakeSave).toHaveBeenCalledWith({ [keyName]: ['existing path 1 add something'] }, expect.anything());

    userEvent.click(newLine.firstChild);
    userEvent.type(newLine.firstChild, '{enter}');
    expect(fakeSave).toHaveBeenCalledTimes(2);
    expect(fakeSave).toHaveBeenCalledWith({ [keyName]: ['existing path 1 add something', 'add something'] }, expect.anything());
    const editable = container.getElementsByClassName('InputContainer');
    expect(editable).toHaveLength(3);
    expect(editable[1].firstChild.nodeName).toBe('BUTTON');
    expect(editable[1]).not.toHaveClass('unsaved');
    expect(editable[2].firstChild).toHaveFocus();
  });

  test('should clear the input when click delete on unsaved new line', () => {
    fakeFetch.mockImplementation((config, callback) => {
      callback(config);
    });
    const { container } = render(<App />);
    const [newLine] = container.getElementsByClassName('InputContainer');
    userEvent.type(newLine.firstChild, ' add something ');
    userEvent.click(newLine.lastChild);
    const [newLineCleared] = container.getElementsByClassName('InputContainer');
    expect(newLineCleared.firstChild).toHaveFocus();
    expect(newLineCleared.firstChild.nodeName).toBe('INPUT');
    expect(newLineCleared.firstChild).toHaveValue('');
  });

  test('should not add the duplicated path when save the new line', () => {
    fakeFetch.mockImplementation((config, callback) => {
      callback({ ...config, [keyName]: ['existing path 1'] });
    });
    const { container } = render(<App />);
    const editableBefore = container.getElementsByClassName('InputContainer');
    userEvent.type(editableBefore[1].firstChild, ' existing path 1 {enter}');
    const editableAfter = container.getElementsByClassName('InputContainer');
    expect(editableAfter).toHaveLength(2);
    expect(editableAfter[1].firstChild).toHaveValue('');
    expect(editableAfter[1].firstChild).toHaveFocus();
    expect(fakeSave).toHaveBeenCalledWith({ [keyName]: ['existing path 1'] }, expect.anything());
  });

  test('should delete the duplicated path when change an existing path', () => {
    fakeFetch.mockImplementation((config, callback) => {
      callback({ ...config, [keyName]: ['existing path 1', 'existing path 2'] });
    });
    const { container } = render(<App />);
    const editableBefore = container.getElementsByClassName('InputContainer');
    userEvent.click(editableBefore[1].firstChild);
    userEvent.clear(editableBefore[1].firstChild);
    userEvent.type(editableBefore[1].firstChild, ' existing path 1 {enter}');
    const editableAfter = container.getElementsByClassName('InputContainer');
    expect(editableAfter).toHaveLength(2);
    expect(editableAfter[1].firstChild).toHaveValue('');
    expect(fakeSave).toHaveBeenCalledWith({ [keyName]: ['existing path 1'] }, expect.anything());
  });

  test('should add current path to empty line when click add button', () => {
    fakeFetch.mockImplementation((config, callback) => {
      callback({ ...config, [keyName]: ['existing path 1'] });
    });
    fakeTabs.mockImplementation((config, callback) => {
      callback([{ url: 'test' }]);
    });
    const { container } = render(<App />);
    const [path1, newLine] = container.getElementsByClassName('InputContainer');
    expect(path1).not.toHaveClass('Empty');
    expect(newLine).toHaveClass('Empty');
    userEvent.hover(newLine);
    userEvent.click(newLine.childNodes[1]);
    expect(newLine.firstChild).toHaveValue('test');

    userEvent.click(path1.firstChild);
    userEvent.clear(path1.firstChild);
    expect(path1).toHaveClass('Empty');
    userEvent.hover(path1);
    userEvent.click(path1.childNodes[1]);
    expect(path1.firstChild).toHaveValue('test');
  });

  test('should sort existing path in alphabetical order when click sort button', () => {
    fakeFetch.mockImplementation((config, callback) => {
      callback({ ...config, [keyName]: ['existing path 2', 'existing path 3', 'existing path 1'] });
    });
    const { container } = render(<App />);
    const editableBefore = container.getElementsByClassName('InputContainer');
    userEvent.type(editableBefore[3].firstChild, 'test');
    userEvent.click(editableBefore[0].firstChild);
    userEvent.clear(editableBefore[0].firstChild);
    userEvent.type(editableBefore[0].firstChild, 'existing path 4');
    userEvent.click(container.getElementsByClassName('SortIcon')[0]);
    const editableAfter = container.getElementsByClassName('InputContainer');
    expect(editableAfter[3]).toHaveClass('unsaved');
    expect(editableAfter[3].firstChild).toHaveValue('test');
    expect(editableAfter[1]).toHaveClass('unsaved');
    expect(editableAfter[1].firstChild).toHaveValue('existing path 4');
    expect(editableAfter[0].firstChild).toHaveTextContent('existing path 1');
    expect(editableAfter[2].firstChild).toHaveTextContent('existing path 3');
    expect(fakeSave).toHaveBeenCalledWith({ [keyName]: ['existing path 1', 'existing path 2', 'existing path 3'] }, expect.anything());
  });
});

describe('Disable And Enable', () => {
  test('should show disable until 00:01:00 when click disable for 1 min', () => {
    const { container } = render(<App />);
    const [disable1] = container.getElementsByClassName('Footer')[0].getElementsByTagName('button');
    userEvent.click(disable1);
    const buttons = container.getElementsByClassName('Footer')[0].getElementsByTagName('button');
    expect(container).toContainHTML('<span>00:01:00</span>');
    expect(buttons[0]).toHaveTextContent('Enable Now');
    expect(buttons[0]).toHaveFocus();
    expect(fakeSave).toHaveBeenCalledTimes(1);
    expect(fakeSave).toHaveBeenCalledWith(
      { [enabledTimeName]: fakeTime + 60 * 1000 },
      expect.anything(),
    );
  });

  test('should show disable until 01:00:00 when click disable for 1 hour', () => {
    const { container } = render(<App />);
    const buttons = container.getElementsByClassName('Footer')[0].getElementsByTagName('button');
    userEvent.click(buttons[1]);
    expect(container).toContainHTML('<span>01:00:00</span>');
    expect(fakeSave).toHaveBeenCalledTimes(1);
    expect(fakeSave).toHaveBeenCalledWith(
      { [enabledTimeName]: fakeTime + 3600 * 1000 },
      expect.anything(),
    );
  });

  test('should show disable until 00:00:00 next day when click disable for today', () => {
    const { container } = render(<App />);
    const buttons = container.getElementsByClassName('Footer')[0].getElementsByTagName('button');
    userEvent.click(buttons[2]);
    expect(container).toContainHTML('<span>00:00:00 next day</span>');
    expect(fakeSave).toHaveBeenCalledTimes(1);
    expect(fakeSave).toHaveBeenCalledWith(
      { [enabledTimeName]: fakeTime + 24 * 3600 * 1000 },
      expect.anything(),
    );
  });

  test('should show disable buttons when click enable now', () => {
    fakeFetch.mockImplementation((config, callback) => {
      callback({ ...config, [enabledTimeName]: fakeTime + 5000 });
    });
    const { container } = render(<App />);
    expect(container).toContainHTML('<span>00:00:05</span>');
    const [enableNow] = container.getElementsByClassName('Footer')[0].getElementsByTagName('button');
    userEvent.click(enableNow);
    const buttons = container.getElementsByClassName('Footer')[0].getElementsByTagName('button');
    expect(buttons).toHaveLength(3);
    expect(fakeSave).toHaveBeenCalledTimes(1);
    expect(fakeSave).toHaveBeenCalledWith({ [enabledTimeName]: 0 }, expect.anything());
  });
});

describe('Send Event to Background Script', () => {
  beforeEach(() => {
    fakeSave.mockImplementation((config, callback) => (callback()));
    fakeTabs.mockImplementation((config, callback) => (callback([{ id: fakeTabId }])));
  });

  test('should refresh when save path list', () => {
    const { container } = render(<App />);
    const [{ firstChild: input }] = container.getElementsByClassName('InputContainer');
    userEvent.type(input, ' test {enter}');
    expect(fakeSave).toHaveBeenCalledTimes(1);
    expect(fakePost).toBeCalledWith(fakeTabId, 'refresh');
  });

  test('should refresh when delete path', () => {
    fakeFetch.mockImplementation((config, callback) => {
      callback({ ...config, [keyName]: ['existing path 1'] });
    });
    const { container } = render(<App />);
    const [path1] = container.getElementsByClassName('InputContainer');
    userEvent.click(path1.lastChild);
    expect(fakeSave).toHaveBeenCalledTimes(1);
    expect(fakePost).toBeCalledWith(fakeTabId, 'refresh');
  });

  test('should refresh when disable for 1 min', () => {
    const { container } = render(<App />);
    const buttons = container.getElementsByClassName('Footer')[0].getElementsByTagName('button');
    userEvent.click(buttons[0]);
    expect(fakeSave).toHaveBeenCalledTimes(1);
    expect(fakePost).toBeCalledWith(60 * 1000);
  });

  test('should refresh when disable for today', () => {
    const { container } = render(<App />);
    const buttons = container.getElementsByClassName('Footer')[0].getElementsByTagName('button');
    userEvent.click(buttons[2]);
    expect(fakeSave).toHaveBeenCalledTimes(1);
    expect(fakePost).toBeCalledWith(24 * 3600 * 1000);
  });

  test('should refresh when enable', () => {
    fakeFetch.mockImplementation((config, callback) => {
      callback({ ...config, [enabledTimeName]: fakeTime + 5000 });
    });
    const { container } = render(<App />);
    const buttons = container.getElementsByClassName('Footer')[0].getElementsByTagName('button');
    userEvent.click(buttons[0]);
    expect(fakeSave).toHaveBeenCalledTimes(1);
    expect(fakePost).toBeCalledWith(0);
  });
});
