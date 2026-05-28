const { BrowserWindow, session } = require('electron');
const { setSetting } = require('./db');
const { encrypt } = require('./crypto');

let loginWindow = null;

function openLoginWindow(onSuccess) {
  if (loginWindow && !loginWindow.isDestroyed()) {
    loginWindow.focus();
    return;
  }

  loginWindow = new BrowserWindow({
    width: 900,
    height: 700,
    title: 'DeepSeek 登录 — 登录后自动捕获 Token',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      partition: 'persist:deepseek_platform',
    },
  });

  // 注入拦截脚本（在页面加载前）
  const ses = loginWindow.webContents.session;
  const filter = { urls: ['https://platform.deepseek.com/*'] };

  // 监听 /auth-api/v0/users/current 的响应
  ses.webRequest.onCompleted(filter, (details) => {
    if (details.url.includes('/auth-api/v0/users/current') && details.statusCode === 200) {
      // 在页面上下文中解析响应获取 token
      loginWindow.webContents.executeJavaScript(`
        (async () => {
          try {
            const res = await fetch('/auth-api/v0/users/current', {
              credentials: 'include',
              headers: { 'Accept': '*/*', 'x-app-version': '1.0.0' }
            });
            const json = await res.json();
            const token = json?.data?.biz_data?.token || json?.data?.bizData?.token || json?.data?.token;
            if (token) {
              document.title = '__DS_TOKEN__' + token;
            }
          } catch(e) {}
        })();
      `).catch(() => {});
    }
  });

  loginWindow.loadURL('https://platform.deepseek.com/usage');

  loginWindow.webContents.on('did-finish-load', () => {
    // 注入 JS hook：拦截所有 fetch/XHR 到 deepseek API 的请求
    loginWindow.webContents.executeJavaScript(captureScript).catch(() => {});

    // 每 2 秒检查是否捕获到了 token
    const check = setInterval(async () => {
      if (!loginWindow || loginWindow.isDestroyed()) { clearInterval(check); return; }
      try {
        const result = await loginWindow.webContents.executeJavaScript(`
          (function() {
            if (window.__ds_captured_token) {
              return JSON.stringify({ token: window.__ds_captured_token, cookie: window.__ds_captured_cookie || '' });
            }
            return null;
          })();
        `);
        if (result) {
          const { token, cookie: cookieStr } = JSON.parse(result);
          clearInterval(check);
          // 获取 cookies
          const cookies = await ses.cookies.get({ domain: '.deepseek.com' });
          const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
          const finalCookie = cookieStr || cookieHeader;
          // 加密保存
          setSetting('ds_token', encrypt(token));
          setSetting('ds_cookie', encrypt(finalCookie));
          if (onSuccess) onSuccess({ token: token.slice(0, 8) + '...', cookie: finalCookie.slice(0, 30) + '...' });
          if (loginWindow && !loginWindow.isDestroyed()) loginWindow.close();
        }
      } catch {}
    }, 2000);

    loginWindow.on('closed', () => { loginWindow = null; clearInterval(check); });
  });
}

// 注入页面的 JS：拦截 fetch/XHR 捕获 token
const captureScript = `
(() => {
  if (window.__ds_monitor_hooked) return;
  window.__ds_monitor_hooked = true;

  const tokenPattern = /(?:Bearer\\s+)?([A-Za-z0-9+/._~-]{40,}={0,2})/;
  const apiPattern = /platform\\.deepseek\\.com\\/(auth-api|api)\\/v0\\//;

  const tryCapture = (value, source) => {
    if (typeof value !== 'string') return;
    const m = value.match(tokenPattern);
    if (m && m[1] && m[1].length >= 40) {
      window.__ds_captured_token = m[1];
      console.log('[DS Monitor] Token captured from', source);
    }
  };

  // Hook fetch
  const origFetch = window.fetch;
  window.fetch = function(input, init) {
    const url = typeof input === 'string' ? input : input?.url || '';
    // 从请求头中捕获
    try {
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          tryCapture(init.headers.get('Authorization'), 'fetch-req');
        } else if (typeof init.headers === 'object') {
          for (const [k, v] of Object.entries(init.headers)) {
            if (k.toLowerCase() === 'authorization') tryCapture(v, 'fetch-req');
          }
        }
      }
    } catch(e) {}
    // 拦截响应
    return origFetch.apply(this, arguments).then(async (res) => {
      if (apiPattern.test(url)) {
        try {
          const clone = res.clone();
          const text = await clone.text();
          try {
            const json = JSON.parse(text);
            const t = json?.data?.biz_data?.token || json?.data?.bizData?.token;
            if (t) tryCapture(t, 'fetch-resp');
          } catch(e) {}
        } catch(e) {}
      }
      return res;
    });
  };

  // Hook XHR
  const XHR = XMLHttpRequest.prototype;
  const origOpen = XHR.open;
  const origSetHeader = XHR.setRequestHeader;
  const origSend = XHR.send;
  let xhrUrl = '', xhrAuth = '';

  XHR.open = function(method, url) {
    xhrUrl = String(url || '');
    return origOpen.apply(this, arguments);
  };
  XHR.setRequestHeader = function(name, value) {
    if (name.toLowerCase() === 'authorization') tryCapture(value, 'xhr-req');
    return origSetHeader.apply(this, arguments);
  };
  XHR.send = function() {
    this.addEventListener('load', function() {
      if (apiPattern.test(xhrUrl)) {
        try {
          const json = JSON.parse(this.responseText);
          const t = json?.data?.biz_data?.token || json?.data?.bizData?.token;
          if (t) tryCapture(t, 'xhr-resp');
        } catch(e) {}
      }
    });
    return origSend.apply(this, arguments);
  };

  // 主动调用 current user 接口触发 token 返回
  setTimeout(async () => {
    try {
      const res = await fetch('/auth-api/v0/users/current', {
        credentials: 'include',
        headers: { 'Accept': '*/*', 'x-app-version': '1.0.0' }
      });
      const json = await res.json();
      const token = json?.data?.biz_data?.token || json?.data?.bizData?.token || json?.data?.token;
      if (token) tryCapture(token, 'active-fetch');
    } catch(e) {}
  }, 2000);
})();
`;

function getLoginStatus() {
  const tokenEnc = require('./db').getSetting('ds_token', '');
  return { isLoggedIn: !!tokenEnc };
}

module.exports = { openLoginWindow, getLoginStatus };
