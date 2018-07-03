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

let cacheName = 'gglnd-stage3-v0';

let urlsToCache = [
    '/',
    '/index.html',
    '/restaurant.html',
    '/dist/large-screen.css',
    '/dist/medium-screen.css',
    '/dist/styles.min.css',
    '/dist/min-rest.js',
    '/dist/min.js',
    '/fonts',
    '/img/1-800.webp',
    '/img/2-800.webp',
    '/img/3-800.webp',
    '/img/4-800.webp',
    '/img/5-800.webp',
    '/img/6-800.webp',
    '/img/7-800.webp',
    '/img/8-800.webp',
    '/img/9-800.webp',
    '/img/no-photo-800.webp',
    '/icon.png',
    '/icon-min.png',
    '/favicon.ico',
    '/manifest.json',
    'http://localhost:1337/restaurants'
];

/* Cache specific uls - see above */
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(cacheName).then(function (cache) {
            return cache.addAll(urlsToCache);
        }).catch(function (err) {
            console.log('Info: No cache storage available yet!');
        })
    );
});

/* Observe any fetch event and cache it */
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

                 //debug
                 //console.log('sw-fetch-request',fetchRequest); //debug

                return fetch(fetchRequest).then(
                    function (response) {

                        //debug
                        //console.log('sw-fetch-response',response); //debug

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
                    console.log('Info: You are offline!');
                });
            })
    );
});

/* Background sync events handling */
self.addEventListener('sync', function (event) {

    /* Add new review to restaurant */
    if (event.tag === 'new-review') {
        //when the form will be submited we trigger this method
        event.waitUntil(console.log(`Syncing: ${event.tag}`)); //todo wip
    }

    /* Add/Remove resto from favourites */
    if (event.tag === 'favourite') {
        event.waitUntil(fav());
    }

});


let fav = () => {
    console.log('added to favorites');
    //url from temp idb
    //set or unset Fav restaurant
    /*return fetch(url,{method: 'PUT'})
        .then(
            function(response) {
                if (response.status !== 200) {
                    console.log('Error: Looks like there was a problem. Status Code: ' + response.status);
                    //debug
                    console.log('Success: Restaurant added to favourites!');
                    //return false;
                }

                //return true; //fav restaurant ok
            })
        .catch(function(err) {
            console.log('Error: Could not add restaurant to favourites', err);
            //return false; //failed to fav
        });*/
};



