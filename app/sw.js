/**
 *
 * Project: mws-restaurant-stage-1
 * Generated: 30-03-2018 @ 5:03 PM
 *
 * Created by:  Mr. FÜLÖP
 * Email:       online@promoters.ro
 * Web:         https://promoters.online/
 */

// This file must be in /

/**
 * Service Worker actions
 */

let cacheName = 'gglnd-stage2-v0';

let urlsToCache = [
    '/',
    '/icon.png',
    '/icon-min.png',
    '/favicon.ico',
    '/manifest.json',
    '/index.html',
    '/fonts/raleway-v12-latin-regular.woff2',
    '/dist/styles.min.css',
    '/dist/large-screen.css',
    '/dist/medium-screen.css',
    '/dist/libs.js',
    '/dist/main.js',
    '/dist/restaurant_info.js',
    '/restaurant.html',
    'http://localhost:1337/restaurants' //caching json request
];


self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(cacheName).then(function (cache) {
            return cache.addAll(urlsToCache);
        }).catch(function () {
            console.log('Info: No cache storage available!');
        })
    );
});


self.addEventListener('fetch', function (event) {
    event.respondWith(
        //I need to match the cache for restaurants.html?id=
        caches.match(event.request, {ignoreSearch: true})
            .then(function (response) {
                // we have cached data - we return the response
                if (response) {
                    return response;
                }

                /* !! Note for myself:
                Clone the response. A response is a stream
                and because we want the browser to consume the response
                as well as the cache consuming the response, we need
                to clone it so we have two streams.
                */
                let fetchRequest = event.request.clone(); //!!CLONE

                // console.log(fetchRequest); //debug //todo mode = 'no-cors'; for dummy image

                return fetch(fetchRequest).then(
                    function (response) {
                        // If we received a valid response from the network
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        //add all fetched assets to cache
                        let responseToCache = response.clone();

                        caches.open(cacheName)
                            .then(function (cache) {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                ).catch(function (err) {
                    console.log('You are offline!');
                });
            })
    );
});



