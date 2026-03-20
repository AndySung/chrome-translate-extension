// 内容脚本 - 处理页面上的划词翻译
(function() {
  'use strict';

  let translatePopup = null;
  let isTranslating = false;

  // 创建翻译弹窗
  function createPopup() {
    const popup = document.createElement('div');
    popup.id = 'translate-popup';
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
    popup.querySelector('.translate-close').addEventListener('click', hidePopup);
    
    document.body.appendChild(popup);
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
      translatePopup.style.top = `${y - rect.height - 30}px`;
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
    if (isTranslating) return;
    
    isTranslating = true;
    showLoading(x, y);
    
    chrome.runtime.sendMessage(
      { action: "translate", text: text },
      (response) => {
        isTranslating = false;
        if (response && response.translation) {
          showTranslation(text, response.translation, x, y);
        } else {
          showTranslation(text, '翻译失败', x, y);
        }
      }
    );
  }

  // 监听鼠标抬起事件（划词结束）
  document.addEventListener('mouseup', (e) => {
    // 延迟一点，确保选区已更新
    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      // 如果选中了文字且不是点击在弹窗内
      if (selectedText && selectedText.length > 0 && selectedText.length < 500) {
        // 检查点击位置是否在弹窗内
        if (translatePopup && translatePopup.contains(e.target)) {
          return;
        }
        
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        translateSelection(selectedText, rect.left, rect.bottom + window.scrollY + 10);
      }
    }, 10);
  });

  // 点击页面其他地方关闭弹窗
  document.addEventListener('mousedown', (e) => {
    if (translatePopup && !translatePopup.contains(e.target)) {
      hidePopup();
    }
  });

  // 监听来自背景脚本的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showTranslation") {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      showTranslation(request.text, request.translation, rect.left, rect.bottom + window.scrollY + 10);
    }
  });

  // ESC 键关闭弹窗
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hidePopup();
    }
  });

})();