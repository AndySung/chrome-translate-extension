// 背景脚本 - 处理右键菜单和全局事件
console.log('[Translate Extension] Background script loaded!');

// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Translate Extension] Extension installed');
  
  // 先删除可能存在的旧菜单
  chrome.contextMenus.removeAll(() => {
    // 创建新的右键菜单
    chrome.contextMenus.create({
      id: "translateSelection",
      title: "🌐 翻译选中文字",
      contexts: ["selection"]
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('[Translate Extension] Menu creation error:', chrome.runtime.lastError);
      } else {
        console.log('[Translate Extension] Context menu created successfully');
      }
    });
  });
});

// 监听右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('[Translate Extension] Context menu clicked:', info.menuItemId);
  
  if (info.menuItemId === "translateSelection" && info.selectionText) {
    translateText(info.selectionText, (result) => {
      // 发送翻译结果到内容脚本
      chrome.tabs.sendMessage(tab.id, {
        action: "showTranslation",
        text: info.selectionText,
        translation: result
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Translate Extension] Send message error:', chrome.runtime.lastError);
        }
      });
    });
  }
});

// 翻译函数 - 使用 MyMemory API（免费）
function translateText(text, callback) {
  console.log('[Translate Extension] Translating text:', text);
  
  // 检测语言（简单判断：包含中文字符就是中文）
  const hasChinese = /[\u4e00-\u9fa5]/.test(text);
  const sourceLang = hasChinese ? 'zh' : 'en';
  const targetLang = hasChinese ? 'en' : 'zh';
  
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
  
  console.log('[Translate Extension] API URL:', url);
  
  fetch(url)
    .then(response => {
      console.log('[Translate Extension] API response status:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('[Translate Extension] API response data:', data);
      if (data.responseData && data.responseData.translatedText) {
        callback(data.responseData.translatedText);
      } else {
        callback('翻译失败：' + (data.responseDetails || '未知错误'));
      }
    })
    .catch(error => {
      console.error('[Translate Extension] Translation error:', error);
      callback('翻译服务暂时不可用: ' + error.message);
    });
}

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Translate Extension] Received message from content script:', request);
  
  if (request.action === "translate") {
    translateText(request.text, (result) => {
      console.log('[Translate Extension] Sending translation result:', result);
      sendResponse({ translation: result });
    });
    return true; // 保持消息通道开放
  }
});

console.log('[Translate Extension] Background script initialized');