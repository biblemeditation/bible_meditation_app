// 성경묵상노트 서비스 워커: 홈 화면 앱 설치, 오프라인 화면, 알림 클릭 처리
// 새 버전을 올릴 때마다 아래 번호를 하나씩 올립니다. 앱은 이 번호로 새 버전이 있는지 알아봅니다.
const CACHE = "bible-note-v8";
const SHELL = ["./", "./index.html", "./firebase-config.js", "./readings.json", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  // 항상 서버에 바뀐 것이 있는지 먼저 확인하고(바뀐 게 없으면 짧은 확인만 오갑니다),
  // 인터넷이 없을 때만 저장해 둔 화면을 보여 줍니다.
  const net = req.mode === "navigate"
    ? fetch(req.url, {cache: "no-cache", credentials: "same-origin"})
    : fetch(req, {cache: "no-cache"});
  e.respondWith(
    net.then(res => {
      if (res.ok && !new URL(req.url).search) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, {ignoreSearch: true}).then(r => r || caches.match("./index.html")))
  );
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type: "window", includeUncontrolled: true}).then(list => {
    for (const c of list) { if ("focus" in c) return c.focus(); }
    return self.clients.openWindow("./");
  }));
});
