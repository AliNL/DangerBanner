import React, {useEffect, useRef, useState} from 'react';
import {Input, Button, Space, Tooltip} from 'antd';
import './App.less';

const notEmpty = (path) => (path.trim().length > 0);
const isRegex = (path) => (path.startsWith('/') && path.endsWith('/'));
const onlyUnique = (value, index, self) => self.indexOf(value) === index;

const Editable = ({initValue, initEditing, saveItem, deleteItem}) => {
  const [editing, setEditing] = useState(initEditing);
  const [unsaved, setUnsaved] = useState(false);
  const [regex, setRegex] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => {
    if (editing) {
      inputRef.current.focus();
    }
  }, [editing]);
  return (
    <div className={`InputContainer ${unsaved ? 'unsaved' : ''}`}>
      {editing ? (
        <Tooltip
          title={regex ? '' : (
            <span>Surround with
              <span style={{
                color: '#EE312D',
                fontSize: 16,
                fontWeight: 800,
              }}
              >
                &#47;&#47;
              </span>
              to use regex
            </span>
          )}
          placement="topLeft"
          color='#222'
          mouseEnterDelay={2}
        >
          <Input
            ref={inputRef}
            className='CustomInput'
            defaultValue={initValue}
            placeholder='Please input dangerous path'
            onChange={(e) => {
              setRegex(isRegex(e.target.value));
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
        <div
          className='ant-input HoverBorder'
          style={{minHeight: 32, width: '100%'}}
          onClick={() => {
            setEditing(true);
          }}
        >
          {initValue}
        </div>
      )}
      <img
        className='DeleteIcon'
        onClick={(e) => {
          deleteItem();
          e.stopPropagation();
        }}
        alt='delete'
        src='/images/delete.png'
      />
    </div>
  );
};

let timeout = null;

export const keyName = 'danger-banner-path-list';
export const enabledTimeName = 'danger-banner-enabled-time';

const App = () => {
  const [pathList, setPathList] = useState(['']);
  const [enabledTime, setEnabledTime] = useState(0);

  useEffect(() => {
    window.chrome.storage.local.get({[keyName]: [], [enabledTimeName]: 0}, (result) => {
      setPathList(result[keyName]);
      setEnabledTime(result[enabledTimeName]);
    });
  }, []);

  const saveList = (list) => {
    const formattedList = list.filter(notEmpty).map((path) => (path.trim())).filter(onlyUnique);
    setPathList(formattedList);
    window.chrome.storage.local.set({[keyName]: formattedList}, () => {
      window.chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        window.chrome.tabs.sendMessage(tabs[0].id, 'refresh');
      });
    });
  }

  const saveItem = (idx) => (value) => {
    pathList[idx] = value;
    saveList(pathList);
  };

  const deleteItem = (idx) => () => {
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
  }

  const enableNow = () => {
    setEnabledTime(0);
    window.chrome.storage.local.set({[enabledTimeName]: 0}, () => {
      clearTimeout(timeout);
      window.chrome.runtime.sendMessage(0);
    });
  }

  const disableFor = (minutes) => () => {
    const milliseconds = minutes * 60 * 1000;
    const newEnabledTime = Date.now() + milliseconds;
    setEnabledTime(newEnabledTime);
    window.chrome.storage.local.set({[enabledTimeName]: newEnabledTime}, () => {
      timeout = setTimeout(enableNow, milliseconds);
      window.chrome.runtime.sendMessage(milliseconds);
    });
  }

  const disableToday = () => {
    const now = new Date();
    now.setDate(now.getDate() + 1);
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);
    setEnabledTime(now.getTime());
    window.chrome.storage.local.set({[enabledTimeName]: now.getTime()}, () => {
      const milliseconds = now.getTime() - Date.now();
      timeout = setTimeout(enableNow, milliseconds);
      window.chrome.runtime.sendMessage(milliseconds);
    });
  }

  return (
    <div className="Popup">
      <div className="Title">Show Alerts on Following Paths</div>
      <div className="Scrollable">
        {pathList.map((path, idx) => <Editable
          key={path}
          initValue={path}
          initEditing={false}
          saveItem={saveItem(idx)}
          deleteItem={deleteItem(idx)}
        />)}
        <Editable
          key="new-line"
          initValue=""
          initEditing={true}
          saveItem={saveItem(pathList.length)}
          deleteItem={deleteItem(pathList.length)}
        />
      </div>
      <div className="Footer">
        {enabledTime < Date.now() ? (
          <Space>
            <span>Disable for</span>
            <Button onClick={disableFor(1)}>1 min</Button>
            <Button onClick={disableFor(60)}>1 hour</Button>
            <Button onClick={disableToday}>today</Button>
          </Space>
        ) : (
          <div className="SpaceBetween">
            <Space>
              <span>Disabled until</span>
              <span>{formatDateTime(enabledTime)}</span>
            </Space>
            <Button type="primary" onClick={enableNow}>Enable Now</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
