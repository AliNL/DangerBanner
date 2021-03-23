import React, { useEffect, useRef, useState } from 'react';
import { Input } from 'antd';
import './App.less';

const chrome = window.chrome;
const Editable = ({ initValue, initEditing, save }) => {
  const [editing, setEditing] = useState(initEditing);
  const [value, setValue] = useState(initValue);
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
          defaultValue={value}
          placeholder='Please input dangerous path'
          onFocus={() => {
            setUnsaved(false);
          }}
          onBlur={() => {
            setUnsaved(true);
          }}
          onPressEnter={(e) => {
            setValue(e.target.value);
            setEditing(false);
            save(e.target.value);
          }}
        />
      ) : (
        <div
          className='ant-input HoverBorder'
          style={{ minHeight: 32, width: '100%' }}
          onClick={() => {
            setEditing(true);
          }}
        >
          {value}
        </div>
      )}
    </div>
  );
};

const App = () => {
  const keyName = 'danger-banner-path-list';
  const [pathList, setPathList] = useState(['']);
  useEffect(() => {
    chrome.storage.local.get({ [keyName]: [] }, (result) => {
      if (result[keyName].length === 0) {
        setPathList(['']);
      } else {
        setPathList(result[keyName]);
      }
    });
  });

  const saveOne = (idx) => (value) => {
    const newPathList = [...pathList];
    newPathList[idx] = value;
    if (newPathList.length === idx + 1) {
      newPathList.push('');
    }
    setPathList(newPathList);
    chrome.storage.local.set({ [keyName]: newPathList });
  };

  return (
    <div className="Popup">
      <div className="Title">Show Alerts on Following Paths</div>
      {pathList.map((path, idx) => <Editable
        key={idx}
        initValue={path}
        initEditing={idx + 1 === pathList.length}
        save={saveOne(idx)} />)}
    </div>
  );
};

export default App;



