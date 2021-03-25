import React, { useEffect, useRef, useState } from 'react';
import { Input } from 'antd';
import './App.less';

const chrome = window.chrome;
const notEmpty = (path) => (path.trim().length > 0);

const Editable = ({ initValue, initEditing, saveItem, deleteItem }) => {
  console.log(initValue, initEditing);
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
          style={{ minHeight: 32, width: '100%' }}
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
        src='/images/delete.png'
      />
    </div>
  );
};

const App = () => {
  const keyName = 'danger-banner-path-list';
  const [pathList, setPathList] = useState(['']);
  useEffect(() => {
    chrome.storage.local.get({ [keyName]: [] }, (result) => {
      setPathList(result[keyName]);
    });
  }, []);

  const saveItem = (idx) => (value) => {
    const newPathList = [...pathList];
    newPathList[idx] = value;
    setPathList(newPathList);
    chrome.storage.local.set({ [keyName]: newPathList.filter(notEmpty) }, () => {
      console.log('saved');
    });
  };

  const deleteItem = (idx) => () => {
    const newPathList = [...pathList];
    newPathList.splice(idx, 1);
    setPathList(newPathList);
    chrome.storage.local.set({ [keyName]: newPathList.filter(notEmpty) }, () => {
      console.log('saved');
    });
  };

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
    </div>
  );
};

export default App;



