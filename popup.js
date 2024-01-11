import awsSend from './sdk.js';
import * as bootstrap from 'bootstrap';
require('bootstrap/dist/css/bootstrap.css');
require('./styles/popup.css');

const icons = ['|', '/', '-', '\\'];
let i = 0;
let accessKeyId = '';
let secretAccessKey = '';
let sessionToken = '';
let regexp = '';

function changeText() {
  document.getElementById('aws_extension_content').innerHTML = icons[i];
  i = ++i % icons.length;
}

const sendMessageToContentScript = function (message, callback) {
  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, message, function (response) {
      if (callback) {
        callback(response);
      }
    });
  });
}

const summarizePage = function () {
  let intervalId = setInterval(changeText, 200);
  sendMessageToContentScript({ cmd: 'summary', value: true }, function (response) {
    const { bodyString, host } = response;
    if (bodyString) {
      awsSend(bodyString, { accessKeyId, secretAccessKey, sessionToken, regexp }, function (res) {
        intervalId = clearInterval(intervalId);
        if (res) {
          const text = res.completion;
          document.getElementById('aws_extension_content').innerHTML = text;
        }
      });
    }
  });
}

const saveSettingToLocalStorage = (host, options) => {
  localStorage.setItem(host, JSON.stringify(options));
}

const getSettingFromLocalStorage = (host) => {
  try {
    const regexp = JSON.parse(localStorage.getItem(host))?.regexp;
    const keys = JSON.parse(localStorage.getItem('keys'));
    const accessKeyId = keys?.accessKeyId;
    const secretAccessKey = keys?.secretAccessKey;
    const sessionToken = keys?.sessionToken;
    return {accessKeyId, secretAccessKey, sessionToken, regexp};
  } catch (e) {
    console.warn(e);
    return {};
  }
}

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);

  return tab;
}

getCurrentTab().then((tab) => {
  const url = tab.url || '';
  const urlParts = url.replace(/^(http|https):\/\//, '').split('/')
  const currentHost = urlParts[0];
  if (currentHost) {
    const currentSetting = getSettingFromLocalStorage(currentHost);
    accessKeyId = currentSetting?.accessKeyId || '';
    secretAccessKey = currentSetting?.secretAccessKey || '';
    sessionToken = currentSetting?.sessionToken || '';
    regexp = currentSetting?.regexp || '';
    if (accessKeyId != '' && secretAccessKey != '' && regexp != '') {
      summarizePage();
    }
  }
})

document.getElementById('aws_extension_btn_summarize').addEventListener('click', () => {
  summarizePage();
});

document.getElementById('aws_extension_save_setting').addEventListener('click', () => {
  accessKeyId = document.getElementById('aws_extension_access_key_id').value;
  secretAccessKey = document.getElementById('aws_extension_secret_access_key').value;
  sessionToken = document.getElementById('aws_extension_session_token').value;
  saveSettingToLocalStorage('keys', { accessKeyId, secretAccessKey, sessionToken });
  bootstrap.Modal.getInstance(document.getElementById('aws_extension_modal_setting')).hide();
});

document.getElementById('aws_extension_modal_setting').addEventListener('show.bs.modal', () => {
  document.getElementById('aws_extension_access_key_id').value = accessKeyId;
  document.getElementById('aws_extension_secret_access_key').value = secretAccessKey;
  document.getElementById('aws_extension_session_token').value = sessionToken;
});

document.getElementById('aws_extension_save_rule').addEventListener('click', () => {
  sendMessageToContentScript({ cmd: 'summary', value: true }, function (response) {
    const { bodyString, host } = response;
    if (bodyString) {
      regexp = document.getElementById('aws_extension_reg_exp').value;
      saveSettingToLocalStorage(host, {regexp});
    }
  })
  bootstrap.Modal.getInstance(document.getElementById('aws_extension_modal_rule')).hide();
});

document.getElementById('aws_extension_modal_rule').addEventListener('show.bs.modal', () => {
  document.getElementById('aws_extension_reg_exp').value = regexp;
});
