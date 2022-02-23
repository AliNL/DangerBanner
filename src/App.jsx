import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Input, Button, Space, Tooltip,
} from 'antd';
import './App.less';

const isRegex = (path) => (path.trim().startsWith('/') && path.trim().endsWith('/'));
const onlyUnique = (value, index, self) => self.indexOf(value) === index;
const notEmpty = (path) => {
  const trimResult = path.trim();
  if (isRegex(trimResult)) {
    return trimResult.length > 2;
  }
  return trimResult.length > 0;
};

function Editable({
  initValue, initEditing, saveItem, deleteItem,
}) {
  const [editing, setEditing] = useState(initEditing);
  const [unsaved, setUnsaved] = useState(false);
  const [empty, setEmpty] = useState(!notEmpty(initValue));
  const inputRef = useRef(null);

  return (
    <div className={`InputContainer ${unsaved ? 'unsaved' : ''} ${empty ? 'Empty' : ''}`}>
      {editing ? (
        <Tooltip
          title={empty ? (
            <span>
              Surround with
              {' '}
              <span style={{ color: '#EE312D', fontSize: 16, fontWeight: 800 }}>&#47;&#47;</span>
              {' '}
              to use regex
            </span>
          ) : ''}
          placement="topLeft"
          color="#222"
          mouseEnterDelay={2}
        >
          <Input
            autoFocus
            ref={inputRef}
            className="CustomInput"
            defaultValue={initValue}
            maxLength={1000}
            placeholder="Please input dangerous path"
            onChange={(e) => {
              setEmpty(!notEmpty(e.target.value));
            }}
            onFocus={() => {
              setUnsaved(false);
            }}
            onBlur={(e) => {
              const changed = e.target.value !== initValue;
              setUnsaved(changed);
              setEditing(changed || !notEmpty(e.target.value));
            }}
            onPressEnter={(e) => {
              if (notEmpty(e.target.value)) {
                setEditing(false);
                saveItem(e.target.value);
              }
            }}
          />
        </Tooltip>
      ) : (
        <Button
          title="click to edit"
          className="ant-input HoverBorder"
          style={{ minHeight: 32, width: '100%' }}
          onClick={() => {
            setEditing(true);
          }}
        >
          {initValue}
        </Button>
      )}
      <Button
        disabled={!empty}
        title="paste current url"
        aria-label="paste current url"
        icon={(
          <img
            alt="paste current url"
            src="/images/paste.png"
          />
        )}
        className="PasteIcon"
        onClick={(e) => {
          window.chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const { url } = tabs[0];
            inputRef.current.setState({ value: url });
            inputRef.current.focus();
            setEmpty(!notEmpty(url));
            setEditing(true);
          });
          e.stopPropagation();
        }}
      />
      <Button
        title="delete"
        aria-label="delete"
        icon={(
          <img
            alt="delete"
            src="/images/delete.png"
          />
        )}
        className="DeleteIcon"
        onClick={(e) => {
          deleteItem();
          e.stopPropagation();
        }}
      />
    </div>
  );
}

Editable.propTypes = {
  initValue: PropTypes.string.isRequired,
  initEditing: PropTypes.bool,
  saveItem: PropTypes.func.isRequired,
  deleteItem: PropTypes.func.isRequired,
};

Editable.defaultProps = {
  initEditing: false,
};

let timeout = null;

export const keyName = 'danger-banner-path-list';
export const enabledTimeName = 'danger-banner-enabled-time';

function App() {
  const [pathList, setPathList] = useState(['']);
  const [enabledTime, setEnabledTime] = useState(0);
  const [newKey, setNewKey] = useState(Date.now());

  useEffect(() => {
    window.chrome.storage.local.get({ [keyName]: [], [enabledTimeName]: 0 }, (result) => {
      setPathList(result[keyName]);
      setEnabledTime(result[enabledTimeName]);
    });
  }, []);

  const saveList = (list) => {
    const formattedList = list.filter(notEmpty).map((path) => (path.trim())).filter(onlyUnique);
    setPathList(formattedList);
    window.chrome.storage.local.set({ [keyName]: formattedList }, () => {
      window.chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        window.chrome.tabs.sendMessage(tabs[0].id, 'refresh');
      });
    });
  };

  const sortList = () => {
    saveList(pathList.sort());
  };

  const saveItem = (idx) => (value) => {
    if (idx === pathList.length) {
      setNewKey(Date.now());
    }
    pathList[idx] = value;
    saveList(pathList);
  };

  const deleteItem = (idx) => () => {
    if (idx === pathList.length) {
      setNewKey(Date.now());
    }
    pathList.splice(idx, 1);
    saveList(pathList);
  };

  const formatDateTime = (timeString) => {
    const time = new Date(timeString);
    const now = new Date();
    let result = '';
    result += time.getHours().toString().padStart(2, '0');
    result += ':';
    result += time.getMinutes().toString().padStart(2, '0');
    result += ':';
    result += time.getSeconds().toString().padStart(2, '0');
    if (time.getDate() !== now.getDate()) {
      result += ' next day';
    }
    return result;
  };

  const enableNow = () => {
    setEnabledTime(0);
    window.chrome.storage.local.set({ [enabledTimeName]: 0 }, () => {
      clearTimeout(timeout);
      window.chrome.runtime.sendMessage(0);
    });
  };

  const disableFor = (minutes) => () => {
    const milliseconds = minutes * 60 * 1000;
    const newEnabledTime = Date.now() + milliseconds;
    setEnabledTime(newEnabledTime);
    window.chrome.storage.local.set({ [enabledTimeName]: newEnabledTime }, () => {
      timeout = setTimeout(enableNow, milliseconds);
      window.chrome.runtime.sendMessage(milliseconds);
    });
  };

  const disableToday = () => {
    const now = new Date();
    now.setDate(now.getDate() + 1);
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);
    setEnabledTime(now.getTime());
    window.chrome.storage.local.set({ [enabledTimeName]: now.getTime() }, () => {
      const milliseconds = now.getTime() - Date.now();
      timeout = setTimeout(enableNow, milliseconds);
      window.chrome.runtime.sendMessage(milliseconds);
    });
  };

  return (
    <div className="Popup">
      <div className="Title">
        Show Alerts on Following Paths
        <Button
          title="sort"
          aria-label="sort"
          icon={(
            <img
              alt="sort"
              src="/images/sort.png"
            />
          )}
          type="primary"
          className="SortIcon"
          onClick={sortList}
        />
      </div>
      <div className="Scrollable">
        {pathList.map((path, idx) => (
          <Editable
            key={path}
            initValue={path}
            saveItem={saveItem(idx)}
            deleteItem={deleteItem(idx)}
          />
        ))}
        <Editable
          key={newKey}
          initValue=""
          initEditing
          saveItem={saveItem(pathList.length)}
          deleteItem={deleteItem(pathList.length)}
        />
      </div>
      <div className="Footer">
        {enabledTime < Date.now() ? (
          <Space>
            <span>Disable for</span>
            <Button title="disable for 1 minute" onClick={disableFor(1)}>1 min</Button>
            <Button title="disable for 1 hour" onClick={disableFor(60)}>1 hour</Button>
            <Button title="disable for today" onClick={disableToday}>today</Button>
          </Space>
        ) : (
          <div className="SpaceBetween">
            <Space>
              <span>Disabled until</span>
              <span>{formatDateTime(enabledTime)}</span>
            </Space>
            <Button autoFocus title="enable now" type="primary" onClick={enableNow}>Enable Now</Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
