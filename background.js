// 背景脚本 - 处理右键菜单和全局事件
chrome.runtime.onInstalled.addListener(() => {
  // 创建右键菜单
  chrome.contextMenus.create({
    id: "translateSelection",
    title: "翻译选中文字",
    contexts: ["selection"]
  });
});

// 监听右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "translateSelection" && info.selectionText) {
    translateText(info.selectionText, (result) => {
      // 发送翻译结果到内容脚本
      chrome.tabs.sendMessage(tab.id, {
        action: "showTranslation",
        text: info.selectionText,
        translation: result
      });
    });
  }
});

// 翻译函数 - 使用 MyMemory API（免费）
function translateText(text, callback) {
  const sourceLang = 'en';
  const targetLang = 'zh';
  
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
  
  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.responseData) {
        callback(data.responseData.translatedText);
      } else {
        callback('翻译失败，请重试');
      }
    })
    .catch(error => {
      console.error('Translation error:', error);
      callback('翻译服务暂时不可用');
    });
}

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "translate") {
    translateText(request.text, (result) => {
      sendResponse({ translation: result });
    });
    return true; // 保持消息通道开放
  }
});