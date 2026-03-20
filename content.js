// 内容脚本 - 处理页面上的划词翻译
console.log('[Translate Extension] Content script loaded!');

(function() {
  'use strict';

  // 防止重复加载
  if (window.translateExtensionLoaded) {
    console.log('[Translate Extension] Already loaded, skipping...');
    return;
  }
  window.translateExtensionLoaded = true;

  let translatePopup = null;
  let isTranslating = false;
  let lastSelection = '';
  let lastSelectionTime = 0;

  // 创建翻译弹窗
  function createPopup() {
    console.log('[Translate Extension] Creating popup...');
    const popup = document.createElement('div');
    popup.id = 'translate-popup-extension';
    popup.innerHTML = `
      <div class="translate-header">
        <span class="translate-title">🌐 翻译结果</span>
        <button class="translate-close">×</button>
      </div>
      <div class="translate-content">
        <div class="translate-original"></div>
        <div class="translate-arrow">↓</div>
        <div class="translate-result"></div>
      </div>
      <div class="translate-loading" style="display: none;">
        <span class="translate-spinner"></span>
        <span>翻译中...</span>
      </div>
    `;
    
    // 关闭按钮事件
    popup.querySelector('.translate-close').addEventListener('click', (e) => {
      e.stopPropagation();
      hidePopup();
    });
    
    document.body.appendChild(popup);
    console.log('[Translate Extension] Popup created and appended to body');
    return popup;
  }

  // 显示弹窗
  function showPopup(x, y) {
    if (!translatePopup) {
      translatePopup = createPopup();
    }
    
    translatePopup.style.display = 'block';
    translatePopup.style.left = `${x}px`;
    translatePopup.style.top = `${y}px`;
    
    // 确保不超出视窗
    const rect = translatePopup.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      translatePopup.style.left = `${window.innerWidth - rect.width - 10}px`;
    }
    if (rect.bottom > window.innerHeight) {
      translatePopup.style.top = `${Math.max(10, y - rect.height - 10)}px`;
    }
  }

  // 隐藏弹窗
  function hidePopup() {
    if (translatePopup) {
      translatePopup.style.display = 'none';
    }
  }

  // 显示翻译结果
  function showTranslation(original, translation, x, y) {
    console.log('[Translate Extension] Showing translation:', original, '->', translation);
    if (!translatePopup) {
      translatePopup = createPopup();
    }
    
    translatePopup.querySelector('.translate-original').textContent = original;
    translatePopup.querySelector('.translate-result').textContent = translation;
    translatePopup.querySelector('.translate-loading').style.display = 'none';
    translatePopup.querySelector('.translate-content').style.display = 'block';
    
    showPopup(x, y);
  }

  // 显示加载中
  function showLoading(x, y) {
    if (!translatePopup) {
      translatePopup = createPopup();
    }
    
    translatePopup.querySelector('.translate-content').style.display = 'none';
    translatePopup.querySelector('.translate-loading').style.display = 'flex';
    
    showPopup(x, y);
  }

  // 翻译选中的文字
  function translateSelection(text, x, y) {
    console.log('[Translate Extension] Translating:', text);
    if (isTranslating) return;
    
    isTranslating = true;
    showLoading(x, y);
    
    try {
      chrome.runtime.sendMessage(
        { action: "translate", text: text },
        (response) => {
          isTranslating = false;
          console.log('[Translate Extension] Got response:', response);
          if (chrome.runtime.lastError) {
            console.error('[Translate Extension] Runtime error:', chrome.runtime.lastError);
            showTranslation(text, '翻译服务错误: ' + chrome.runtime.lastError.message, x, y);
          } else if (response && response.translation) {
            showTranslation(text, response.translation, x, y);
          } else {
            showTranslation(text, '翻译失败，请重试', x, y);
          }
        }
      );
    } catch (error) {
      console.error('[Translate Extension] Send message error:', error);
      isTranslating = false;
      showTranslation(text, '翻译出错: ' + error.message, x, y);
    }
  }

  // 监听鼠标抬起事件（划词结束）
  document.addEventListener('mouseup', (e) => {
    // 延迟一点，确保选区已更新
    setTimeout(() => {
      try {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        console.log('[Translate Extension] Mouse up, selection:', selectedText);
        
        // 防抖动：如果和上次选择一样，且时间间隔短，则忽略
        const now = Date.now();
        if (selectedText === lastSelection && now - lastSelectionTime < 500) {
          return;
        }
        lastSelection = selectedText;
        lastSelectionTime = now;
        
        // 如果选中了文字且不是点击在弹窗内
        if (selectedText && selectedText.length > 0 && selectedText.length < 500) {
          // 检查点击位置是否在弹窗内
          if (translatePopup && translatePopup.contains(e.target)) {
            return;
          }
          
          // 获取选区位置
          let range;
          try {
            range = selection.getRangeAt(0);
          } catch (e) {
            console.log('[Translate Extension] No range available');
            return;
          }
          
          const rect = range.getBoundingClientRect();
          console.log('[Translate Extension] Selection rect:', rect);
          
          // 计算弹窗位置
          const x = rect.left + window.scrollX;
          const y = rect.bottom + window.scrollY + 10;
          
          translateSelection(selectedText, x, y);
        }
      } catch (error) {
        console.error('[Translate Extension] Error in mouseup handler:', error);
      }
    }, 50);
  });

  // 点击页面其他地方关闭弹窗
  document.addEventListener('mousedown', (e) => {
    if (translatePopup && !translatePopup.contains(e.target)) {
      hidePopup();
    }
  });

  // 监听来自背景脚本的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Translate Extension] Received message:', request);
    if (request.action === "showTranslation") {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        showTranslation(request.text, request.translation, 
          rect.left + window.scrollX, 
          rect.bottom + window.scrollY + 10);
      }
    }
    return true;
  });

  // ESC 键关闭弹窗
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hidePopup();
    }
  });

  console.log('[Translate Extension] Content script initialized successfully!');

})();