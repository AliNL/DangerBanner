import React, {useEffect, useRef, useState} from 'react';
import {Input, Button, Space} from 'antd';
import './App.less';

const chrome = window.chrome;
const notEmpty = (path) => (path.trim().length > 0);

const Editable = ({initValue, initEditing, saveItem, deleteItem}) => {
  const [editing, setEditing] = useState(initEditing);
  const [unsaved, setUnsaved] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => {
    if (editing) {
      inputRef.current.focus();
    }
  }, [editing]);
  return (
    <div className={`InputContainer ${unsaved ? 'unsaved' : ''}`}>
      {editing ? (
        <Input
          ref={inputRef}
          className='CustomInput'
          defaultValue={initValue}
          placeholder='Please input dangerous path'
          onFocus={() => {
            setUnsaved(false);
          }}
          onBlur={(e) => {
            setUnsaved(e.target.value !== initValue);
          }}
          onPressEnter={(e) => {
            setEditing(false);
            saveItem(e.target.value);
          }}
        />
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

const App = () => {
  const keyName = 'danger-banner-path-list';
  const enabledTimeName = 'danger-banner-enabled-time';
  const [pathList, setPathList] = useState(['']);
  const [enabledTime, setEnabledTime] = useState(0);

  useEffect(() => {
    chrome.storage.local.get({[keyName]: [], [enabledTimeName]: 0}, (result) => {
      setPathList(result[keyName]);
      setEnabledTime(result[enabledTimeName]);
    });
  }, []);

  const saveItem = (idx) => (value) => {
    const newPathList = [...pathList];
    newPathList[idx] = value;
    setPathList(newPathList);
    chrome.storage.local.set({[keyName]: newPathList.filter(notEmpty)}, () => {
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, 'refresh');
      });
    });
  };

  const deleteItem = (idx) => () => {
    const newPathList = [...pathList];
    newPathList.splice(idx, 1);
    setPathList(newPathList);
    chrome.storage.local.set({[keyName]: newPathList.filter(notEmpty)}, () => {
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, 'refresh');
      });
    });
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
    chrome.storage.local.set({[enabledTimeName]: 0}, () => {
      clearTimeout(timeout);
      chrome.runtime.sendMessage(0);
    });
  }

  const disableFor = (minutes) => () => {
    const milliseconds = minutes * 60 * 1000;
    const newEnabledTime = Date.now() + milliseconds;
    setEnabledTime(newEnabledTime);
    chrome.storage.local.set({[enabledTimeName]: newEnabledTime}, () => {
      timeout = setTimeout(enableNow, milliseconds);
      chrome.runtime.sendMessage(milliseconds);
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
    chrome.storage.local.set({[enabledTimeName]: now.getTime()}, () => {
      const milliseconds = now.getTime() - Date.now();
      timeout = setTimeout(enableNow, milliseconds);
      chrome.runtime.sendMessage(milliseconds);
    });
  }

  return (
    <div className="Popup">
      <div className="Title">Show Alerts on Following Paths</div>
      <div className="Scrollable">
        {pathList.map((path, idx) => <Editable
          key={idx}
          initValue={path}
          initEditing={false}
          saveItem={saveItem(idx)}
          deleteItem={deleteItem(idx)}
        />)}
        <Editable
          key={pathList.length}
          initValue=''
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
