/**
 *
 * Project: mws-restaurant-stage-1
 * Generated: 30-03-2018 @ 5:03 PM
 *
 * Created by:  Mr. FÜLÖP
 * Email:       online@promoters.ro
 * Web:         https://promoters.online/
 */

//we will use Jake's promises idb to process pending requests stored in iDB
importScripts('node_modules/idb/lib/idb.js');

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
        event.waitUntil(runFavQueue());
    }

});

//WORK IN PROGRESS -> how does sync reschedule?
/* Must return promise */
/* runFavQueue */
function  runFavQueue() {

    return store.temp('readonly').then(temp => {
        console.log("temp data", temp);
        return temp.getAll();
    })
        .then(PendingRequests => {
            console.log('Pending requests', PendingRequests);
            return Promise.all(PendingRequests.map(request =>
            {
                console.log('Pending request', request);
                return fetch(request.data.url,{method: 'PUT'})
                    .then(response => {
                        console.log('fetch ok');
                        return response.json();
                    })
                    .then(data => {
                        console.log('data from fetch ', data);
                        return store.temp('readwrite')
                            .then(temp => {
                                return temp.delete(request.id);
                            });
                    })

            })).catch(function(err){
                console.log(err);
            });
        })
}


let store = {
    db: null,

    init: function() {
        if (store.db) { return Promise.resolve(store.db); }
        return idb.open('temp', 1, function(upgradeDb) {
            upgradeDb.createObjectStore('favorites');
        }).then(function(db) {
            return store.db = db;
        });
    },

    temp: function(mode) {
        return store.init().then(function(db) {
            return db.transaction('favorites', mode).objectStore('favorites');
        })
    }
};

