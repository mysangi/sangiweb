(function () {
  var loader = document.getElementById('loader');
  var frame  = document.getElementById('appFrame');
  var loaderHidden = false;
  function hideLoader() {
    if (loaderHidden) return;
    loaderHidden = true;
    if (loader) loader.classList.add('hide');
  }
  if (frame) {
    frame.addEventListener('load', hideLoader);
    frame.addEventListener('error', function () { hideLoader(); });
  }
  setTimeout(hideLoader, 4000);
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); }, { passive: false });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js')
        .then(function (reg) { console.log('SW registered:', reg.scope); })
        .catch(function (err) { console.warn('SW registration failed:', err); });
    });
  }

  var installBanner = document.getElementById('installBanner');
  var installBtn = document.getElementById('installBtn');
  var closeBannerBtn = document.getElementById('closeBannerBtn');
  var wrapper = document.getElementById('wrapper');
  var deferredPrompt = null;

  function isAppInstalled() {
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
    if (window.matchMedia('(display-mode: minimal-ui)').matches) return true;
    if (window.navigator.standalone === true) return true;
    if (document.referrer.includes('android-app://')) return true;
    return false;
  }

  function showBanner() {
    installBanner.classList.add('show');
    wrapper.classList.add('banner-visible');
  }
  function hideBanner() {
    installBanner.classList.remove('show');
    wrapper.classList.remove('banner-visible');
  }
  function maybeShowBanner() {
    if (isAppInstalled()) return;
    if (sessionStorage.getItem('installBannerDismissed') === 'true') return;
    setTimeout(showBanner, 1500);
  }

  closeBannerBtn.addEventListener('click', function () {
    hideBanner();
    sessionStorage.setItem('installBannerDismissed', 'true');
  });

  installBtn.addEventListener('click', function () {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function (r) {
        if (r.outcome === 'accepted') hideBanner();
        deferredPrompt = null;
      });
    } else {
      var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIOS) {
        alert('To install:\n\n1. Tap the Share button\n2. Scroll and tap "Add to Home Screen"\n3. Tap "Add"');
      } else {
        alert('To install:\n\nOpen your browser menu (⋮) and select "Install app" or "Add to Home Screen".');
      }
    }
  });

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    maybeShowBanner();
  });

  window.addEventListener('load', function () {
    setTimeout(function () {
      if (!deferredPrompt) maybeShowBanner();
    }, 2500);
  });

  window.addEventListener('appinstalled', function () { hideBanner(); });

  var mqStandalone = window.matchMedia('(display-mode: standalone)');
  if (mqStandalone.addEventListener) {
    mqStandalone.addEventListener('change', function (e) {
      if (e.matches) hideBanner();
    });
  }
})();
