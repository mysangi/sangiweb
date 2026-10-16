const CACHE='self-learners-v5';
const SHELL=['./','./index.html','./manifest.json','./app.js','./icon-192.png','./icon-512.png'];
const APPSHELL='https://script.google.com/macros/s/AKfycbwSk02eslavaH8ChLh2tSazFYyTK4ny_USnmbgTlLOfquq02yDzFfVS0HDbowVDM7Nq/exec';

self.addEventListener('install',(e)=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'}))).catch(()=>null)));
});

self.addEventListener('activate',(e)=>{
  e.waitUntil(
    caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',(e)=>{
  const {request}=e;
  if(request.method!=='GET')return;
  const u=request.url;

  // Skip Google Fonts
  if(u.includes('fonts.googleapis.com')||u.includes('fonts.gstatic.com'))return;

  // Apps Script HTML page: network-first, fallback to cache
  if(u.startsWith(APPSHELL.split('/exec')[0])){
    e.respondWith(
      fetch(request).then(r=>{
        const clone=r.clone();
        caches.open(CACHE).then(c=>c.put(request,clone)).catch(()=>{});
        return r;
      }).catch(()=>caches.match(request))
    );
    return;
  }

  // HTML navigation: network-first
  if(request.mode==='navigate'||(request.headers.get('accept')||'').includes('text/html')){
    e.respondWith(
      fetch(request).then(r=>{
        const clone=r.clone();
        caches.open(CACHE).then(c=>c.put(request,clone)).catch(()=>{});
        return r;
      }).catch(()=>caches.match(request).then(c=>c||caches.match('./index.html')))
    );
    return;
  }

  // Static: cache-first
  e.respondWith(
    caches.match(request).then(cached=>cached||fetch(request).then(r=>{
      if(r&&r.status===200&&r.type==='basic'){
        const clone=r.clone();
        caches.open(CACHE).then(c=>c.put(request,clone)).catch(()=>{});
      }
      return r;
    }).catch(()=>cached))
  );
});
