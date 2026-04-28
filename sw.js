const CACHE_NAME =
    'mwc-miner-v1';

const ASSETS = [
    '/',
    'index.html',
    'css/style.css',
    'js/miner.js',
    'js/app.js',
    'manifest.json'
];

/*
|--------------------------------------------------------------------------
| Install
|--------------------------------------------------------------------------
*/

self.addEventListener(
    'install',
    event => {
        event.waitUntil(
            caches.open(CACHE_NAME)
                .then(cache => {
                    return cache.addAll(
                        ASSETS
                    );
                })
        );
    }
);

/*
|--------------------------------------------------------------------------
| Fetch
|--------------------------------------------------------------------------
*/

self.addEventListener(
    'fetch',
    event => {
        event.respondWith(
            caches.match(
                event.request
            )
            .then(response => {
                return response ||
                    fetch(
                        event.request
                    );
            })
        );
    }
);

/*
|--------------------------------------------------------------------------
| Activate
|--------------------------------------------------------------------------
*/

self.addEventListener(
    'activate',
    event => {
        event.waitUntil(
            caches.keys()
                .then(keys => {
                    return Promise.all(
                        keys.map(key => {
                            if (
                                key !== CACHE_NAME
                            ) {

                                return caches.delete(
                                    key
                                );
                            }
                        })
                    );
                })
        );
    }
);

self.skipWaiting();

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
});