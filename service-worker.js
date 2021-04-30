const VERSION = 'v4';
const PAGES_CACHE = `${VERSION}_PAGES`;
const OFFLINE_PAGE = 'offline.html';
const CACHED_RESOURCES = [
  OFFLINE_PAGE,
  '/',
  '/introduction/',
  '/target-audience/',
  '/terminology/',
  '/testing-principles/',
  '/example-applications/',
  '/angular-testing-principles/',
  '/test-suites-with-jasmine/',
  '/faking-dependencies/',
  '/debugging-tests/',
  '/testing-components/',
  '/testing-components-with-children/',
  '/testing-components-depending-on-services/',
  '/testing-complex-forms/',
  '/testing-components-with-spectator/',
  '/testing-services/',
  '/testing-pipes/',
  '/testing-directives/',
  '/testing-modules/',
  '/measuring-code-coverage/',
  '/end-to-end-testing/',
  '/summary/',
  '/index-of-example-applications/',
  '/references/',
  '/acknowledgements/',
  '/about/',
  '/license/',
  '/assets/manifest.json',
  '/assets/css/book.css',
  '/assets/img/testing-angular/flying-probe-800-cavif-q60.avif',
  '/assets/img/testing-angular/flying-probe-1600-cavif-q50.avif',
  '/assets/img/testing-angular/flying-probe-800-cwebp-q80.webp',
  '/assets/img/testing-angular/flying-probe-1600.webp',
  '/assets/img/testing-angular/flying-probe-800-85.jpg',
  '/assets/img/testing-angular/flying-probe-1600-65.jpg',
  '/assets/fonts/noto-sans-normal-normal-latin.woff2',
  '/assets/fonts/noto-sans-italic-normal-latin.woff2',
  '/assets/fonts/noto-sans-normal-bold-latin.woff2',
  '/assets/js/link-types.js',
  '/assets/js/highlight-toc.js',
  '/assets/js/iframe-buttons.js',
  '/assets/cojs/llapse-toc.js',
];

addEventListener('install', (event) => {
  skipWaiting();

  event.waitUntil(
    fetch(OFFLINE_PAGE).then((response) =>
      caches.open(PAGES_CACHE).then((cache) =>
        cache.put(OFFLINE_PAGE, response)
      )
    )
  );
});

addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !key.startsWith(VERSION))
          .map((key) => {
            console.log('Delete from cache', key);
            return caches.delete(key);
          })
      )
    )
  );
});

function isRelevantRequest(method, url) {
  const urlParts = new URL(url);
  return (
    method === 'GET' &&
    urlParts.origin === location.origin &&
    CACHED_RESOURCES.some((resourceUrl) => resourceUrl === urlParts.pathname)
  );
}

addEventListener('fetch', (event) => {
  const { request } = event;
  const { method, url } = request;
  if (!isRelevantRequest(method, url)) {
    return;
  }
  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(PAGES_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() =>
        caches.match(request).then((responseFromCache) => {
          if (responseFromCache) {
            return responseFromCache;
          }
          // Serve offline page
          return caches
            .open(PAGES_CACHE)
            .then((cache) => cache.match(OFFLINE_PAGE));
        })
      )
  );
});
