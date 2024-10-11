/**
 * Because of increased security in manifest v3, scripts can no longer just inject a script tag into the main page.
 * Functions to be called in the main context must be predefined. Those functions should be in this file, and they will
 * be loaded in the worker context in the extension version.
 *
 * These are the functions for `$.global`. They will be called by name.
 *
 * They are stringified, so don't use the short `fnName() {` notation.
 */
const PageContextFunctions = {
  stubCloneTopNav: () => { window.cloneTopNav = function () { }; },
  disableNativeExtension: () => {
    try {
      const settings = JSON.parse(localStorage.getItem('4chan-settings')) || {};
      if (settings.disableAll)
        return;
      settings.disableAll = true;
      localStorage.setItem('4chan-settings', JSON.stringify(settings));
    } catch (error) {
      Object.defineProperty(window, 'Config', { value: { disableAll: true } });
    }
  },
  disableNativeExtensionNoStorage: () => { Object.defineProperty(window, 'Config', { value: { disableAll: true } }); },
  prettyPrint: ({ id }) => {
    // @ts-ignore
    window.prettyPrint?.((function () { }), document.getElementById(id).parentNode);
  },
  exposeVersion: ({ buildDate, version }) => {
    const date = +buildDate;
    Object.defineProperty(window, 'fourchanXT', {
      value: Object.freeze({
        version,
        // Getter to prevent mutations.
        get buildDate() { return new Date(date); },
      }),
      writable: false,
    });
  },
  initMain: () => {
    document.documentElement.classList.add('js-enabled');
    window.FCX = {};
  },
  initFlash: () => {
    if (JSON.parse(localStorage['4chan-settings'] || '{}').disableAll)
      window.SWFEmbed.init();
  },
  initFlashNoStorage: () => { window.SWFEmbed.init(); },
  setThreadId: () => { window.Main.tid = location.pathname.split(/\/+/)[3]; },
  fourChanPrettyPrintListener: () => {
    window.addEventListener('prettyprint', (e) => window.dispatchEvent(new CustomEvent('prettyprint:cb', {
      detail: { ID: e.detail.ID, i: e.detail.i, html: window.prettyPrintOne(e.detail.html) }
    })), false);
  },
  fourChanMathjaxListener: () => {
    window.addEventListener('mathjax', function (e) {
      if (window.MathJax) {
        window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub, e.target]);
      } else {
        if (!document.querySelector('script[src^="//cdn.mathjax.org/"]')) { // don't load MathJax if already loading
          window.loadMathJax();
          window.loadMathJax = function () { };
        }
        // 4chan only handles post comments on MathJax load; anything else (e.g. the QR preview) must be queued explicitly.
        if (!e.target.classList.contains('postMessage')) {
          document.querySelector('script[src^="//cdn.mathjax.org/"]').addEventListener('load', () => window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub, e.target]), false);
        }
      }
    }, false);
  },
  disable4chanIdHl: () => {
    window.clickable_ids = false;
    for (var node of document.querySelectorAll('.posteruid, .capcode')) {
      node.removeEventListener('click', window.idClick, false);
    }
  },
  initTinyBoard: ({ boardID, threadID }) => {
    threadID = +threadID;
    const form = document.querySelector('form[name="post"]');
    window.$(document).ajaxComplete(function (event, request, settings) {
      let postID;
      if (settings.url !== form.action)
        return;
      if (!(postID = +request.responseJSON?.id))
        return;
      const detail = { boardID, threadID, postID };
      try {
        const { redirect, noko } = request.responseJSON;
        if (redirect && (originalNoko != null) && !originalNoko && !noko) {
          detail.redirect = redirect;
        }
      } catch (error) { }
      event = new CustomEvent('QRPostSuccessful', { bubbles: true, detail });
      document.dispatchEvent(event);
    });
    var originalNoko = window.tb_settings?.ajax?.always_noko_replies;
    let base;
    (((base = window.tb_settings || (window.tb_settings = {}))).ajax || (base.ajax = {})).always_noko_replies = true;
  },
  setupCaptcha: ({ recaptchaKey }) => {
    const render = function () {
      const { classList } = document.documentElement;
      const container = document.querySelector('#qr .captcha-container');
      container.dataset.widgetID = window.grecaptcha.render(container, {
        sitekey: recaptchaKey,
        theme: classList.contains('tomorrow') || classList.contains('spooky') || classList.contains('dark-captcha') ? 'dark' : 'light',
        callback(response) {
          window.dispatchEvent(new CustomEvent('captcha:success', { detail: response }));
        }
      });
    };
    if (window.grecaptcha) {
      render();
    } else {
      const cbNative = window.onRecaptchaLoaded;
      window.onRecaptchaLoaded = function () {
        render();
        cbNative();
      };
      if (!document.head.querySelector('script[src^="https://www.google.com/recaptcha/api.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoaded&render=explicit';
        document.head.appendChild(script);
      }
    }
  },
  resetCaptcha: () => {
    window.grecaptcha.reset(document.querySelector('#qr .captcha-container').dataset.widgetID);
  },
  setupTCaptcha: ({ boardID, threadID, autoLoad }) => {
    const { TCaptcha } = window;
    TCaptcha.init(document.querySelector('#qr .captcha-container'), boardID, +threadID);
    TCaptcha.setErrorCb(err => window.dispatchEvent(new CustomEvent('CreateNotification', {
      detail: { type: 'warning', content: '' + err }
    })));
    if (autoLoad === '1')
      TCaptcha.load(boardID, threadID);
  },
  destroyTCaptcha: () => { window.TCaptcha.destroy(); },
  TCaptchaClearChallenge: () => { window.TCaptcha.clearChallenge(); },
  setupQR: () => {
    window.FCX.oekakiCB = () => window.Tegaki.flatten().toBlob(function (file) {
      const source = `oekaki-${Date.now()}`;
      window.FCX.oekakiLatest = source;
      document.dispatchEvent(new CustomEvent('QRSetFile', {
        bubbles: true,
        detail: { file, name: window.FCX.oekakiName, source }
      }));
    });
    if (window.Tegaki) {
      document.querySelector('#qr .oekaki').hidden = false;
    }
  },
  qrTegakiDraw: () => {
    const { Tegaki, FCX } = window;
    if (Tegaki.bg) {
      Tegaki.destroy();
    }
    FCX.oekakiName = 'tegaki.png';
    Tegaki.open({
      onDone: FCX.oekakiCB,
      onCancel() { Tegaki.bgColor = '#ffffff'; },
      width: +document.querySelector('#qr [name=oekaki-width]').value,
      height: +document.querySelector('#qr [name=oekaki-height]').value,
      bgColor: document.querySelector('#qr [name=oekaki-bg]').checked ?
        document.querySelector('#qr [name=oekaki-bgcolor]').value :
        'transparent'
    });
  },
  qrTegakiLoad: () => {
    const { Tegaki, FCX } = window;
    const name = document.getElementById('qr-filename').value.replace(/\.\w+$/, '') + '.png';
    const { source } = document.getElementById('file-n-submit').dataset;
    const error = content => document.dispatchEvent(new CustomEvent('CreateNotification', {
      bubbles: true,
      detail: { type: 'warning', content, lifetime: 20 }
    }));
    var cb = function (e) {
      if (e) {
        this.removeEventListener('QRMetadata', cb, false);
      }
      const selected = document.getElementById('selected');
      if (!selected?.dataset.type)
        return error('No file to edit.');
      if (!/^(image|video)\//.test(selected.dataset.type)) {
        return error('Not an image.');
      }
      if (!selected.dataset.height)
        return error('Metadata not available.');
      if (selected.dataset.height === 'loading') {
        selected.addEventListener('QRMetadata', cb, false);
        return;
      }
      if (Tegaki.bg) {
        Tegaki.destroy();
      }
      FCX.oekakiName = name;
      Tegaki.open({
        onDone: FCX.oekakiCB,
        onCancel() { Tegaki.bgColor = '#ffffff'; },
        width: +selected.dataset.width,
        height: +selected.dataset.height,
        bgColor: 'transparent'
      });
      const canvas = document.createElement('canvas');
      canvas.width = (canvas.naturalWidth = +selected.dataset.width);
      canvas.height = (canvas.naturalHeight = +selected.dataset.height);
      canvas.hidden = true;
      document.body.appendChild(canvas);
      canvas.addEventListener('QRImageDrawn', function () {
        this.remove();
        Tegaki.onOpenImageLoaded.call(this);
      }, false);
      canvas.dispatchEvent(new CustomEvent('QRDrawFile', { bubbles: true }));
    };
    if (Tegaki.bg && (Tegaki.onDoneCb === FCX.oekakiCB) && (source === FCX.oekakiLatest)) {
      FCX.oekakiName = name;
      Tegaki.resume();
    } else {
      cb();
    }
  },
  testNativeExtension: (output = {}) => {
    if (window.Parser?.postMenuIcon)
      output.enabled = 'true';
    return output;
  },
};

// This requestId workaround isn't needed in manifest V3, since returning true in the event listener works.
// But we keep it for manifest V2.
let requestID = 0;
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  const id = requestID;
  requestID++;
  handlers[request.type](request, sender).then(data => {
    chrome.tabs.sendMessage(sender.tab.id, { id, data });
  });
  sendResponse(id);
});

var handlers = {
  permission(request) {
    return new Promise(resolve => {
      const origins = request.origins || ['*://*/'];
      chrome.permissions.contains({origins}, function(result) {
        if (result) {
          resolve(result);
        } else {
          chrome.permissions.request({origins}, function(result) {
            resolve(chrome.runtime.lastError ? false : result);
          });
        }
      });
    })
  },

  async ajax(request) {
    try {
      const res = await fetch(request.url, { headers: request.headers || {} });
      if (!res.ok) {
        return { error: true };
      }
      let response;
      if (request.responseType === 'arraybuffer') {
        response = await res.arrayBuffer();
      } else if (request.responseType === 'json') {
        response = await res.json();
      } else {
        response = await res.text();
      }
      const responseHeaderString = Array.from(res.headers, h => `${h[0]}: ${h[1]}\r\n`).join('');
      return { status: res.status, statusText: res.statusText, response, responseHeaderString };
    } catch (e) {
      return { error: true };
    }
  },

  async runInPageContext(request, sender) {
    const results = await chrome.scripting.executeScript({
      func: PageContextFunctions[request.fn],
      args: request.data ? [request.data] : [],
      target: { tabId: sender.tab.id },
      world: 'MAIN',
    });
    return results[0].result
  }
};
