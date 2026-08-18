const CACHE_NAME =
    'mwc-webminer-v3';

const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/miner.js',
    './js/app.js',
    './manifest.json'
];

/*
|--------------------------------------------------------------------------
| INSTALL
|--------------------------------------------------------------------------
*/

self.addEventListener(
    'install',
    event => {

        event.waitUntil(

            caches
                .open(CACHE_NAME)
                .then(
                    cache =>
                        cache.addAll(
                            ASSETS
                        )
                )

        );

        self.skipWaiting();
    }
);

/*
|--------------------------------------------------------------------------
| FETCH
|--------------------------------------------------------------------------
|
| Only cache requests belonging to the GitHub Pages application.
|
| External resources such as:
|
|   esm.run
|   mining pools
|   external APIs
|
| are allowed to go directly to the network.
|
|--------------------------------------------------------------------------
*/

self.addEventListener(
    'fetch',
    event => {

        const request =
            event.request;

        /*
        |--------------------------------------------------------------------------
        | Never intercept POST/PUT/etc.
        |--------------------------------------------------------------------------
        */

        if (
            request.method !== 'GET'
        ) {

            return;
        }

        const url =
            new URL(
                request.url
            );

        /*
        |--------------------------------------------------------------------------
        | Only handle our own GitHub Pages origin
        |--------------------------------------------------------------------------
        */

        if (
            url.origin !==
            self.location.origin
        ) {

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | CACHE FIRST
        |--------------------------------------------------------------------------
        */

        event.respondWith(

            caches
                .match(
                    request
                )
                .then(
                    cachedResponse => {

                        if (
                            cachedResponse
                        ) {

                            return cachedResponse;
                        }

                        return fetch(
                            request
                        )
                        .then(
                            response => {

                                if (
                                    response &&
                                    response.ok
                                ) {

                                    const copy =
                                        response.clone();

                                    caches
                                        .open(
                                            CACHE_NAME
                                        )
                                        .then(
                                            cache => {

                                                cache.put(
                                                    request,
                                                    copy
                                                );
                                            }
                                        );
                                }

                                return response;
                            }
                        );
                    }
                )
        );
    }
);

/*
|--------------------------------------------------------------------------
| ACTIVATE
|--------------------------------------------------------------------------
*/

self.addEventListener(
    'activate',
    event => {

        event.waitUntil(

            Promise.all([

                caches
                    .keys()
                    .then(
                        keys =>
                            Promise.all(
                                keys.map(
                                    key => {

                                        if (
                                            key !==
                                            CACHE_NAME
                                        ) {

                                            return caches.delete(
                                                key
                                            );
                                        }

                                        return null;
                                    }
                                )
                            )
                    ),

                self.clients.claim()

            ])

        );
    }
);