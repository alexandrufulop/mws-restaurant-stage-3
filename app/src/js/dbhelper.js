/**
 * Common database helper functions.
 */

class DBHelper {

    /**
     * Registering the Service Worker
     */
    static registerSW() {
        //checking to see if the browser supports sw
        if (!navigator.serviceWorker || !navigator.serviceWorker.register) {
            console.log("This browser doesn't support service workers");
            return;
        }

        //registering the sw
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('/sw.js').then(function (registration) {
                // Registration successful
                //console.log('ServiceWorker registration successful with scope: ', registration.scope); //debug
            }, function (err) {
                // registration failed
                console.log('ServiceWorker registration failed: ', err);
            });
        });

    };

    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    static get DATABASE_URL() {
        const port = 1337; //get json from remote server
        return `http://localhost:${port}`;
    }

    /**
     * Fetch all restaurants.
     */

    static fetchRestaurants(callback) {

        /* IndexDB */
        let databaseName = 'data-v0';
        let dbObject = 'restaurants';

        const dbPromise = idb.open(databaseName, 1, function(upgradeDb) {

            //debug
            //console.log(`Info: Opening the ${databaseName} object store.`); //debug

            if (!upgradeDb.objectStoreNames.contains(dbObject)) {
                upgradeDb.createObjectStore(dbObject,{
                    keyPath: 'id'
                });

                //console.log('Creating a new data object store for restaurants JSON.'); //debug
            }
        }).catch(function(){
            console.log('Info: Database is not available');
        });


        /* Get stored objects */
        dbPromise.then(db => {
            return db.transaction(dbObject)
                .objectStore(dbObject).getAll();
        }).then(function(storedData) {

            //if we have stored JSON data in the indexDB
            if (storedData.length > 0) {

                //debug
               //console.log('Info: We have stored data in our ibd', storedData);

                callback(null, storedData); //we are returning the stored data from the idb
            }
            else
                {

                    console.log('Info: Retriving JSON data and storing into DB');


                    //there is no stored data so we retrieve it from the server
                    /* Getting the restaurants JSON from the development server using the FETCH API instead of XMLHttpRequest() */
                    fetch(DBHelper.DATABASE_URL+'/restaurants')
                        .then(
                            function(response) {
                                if (response.status !== 200) {
                                    console.log('Error: Looks like there was a problem. Status Code: ' +
                                        response.status);

                                    callback(response.status, null);
                                }

                                //This is the JSON response from the dev server
                                response.json().then(function(data) {

                                    //console.log(data); //restaurants data from remote JSON //debug

                                    dbPromise.then(function(db) {
                                        let tx = db.transaction(dbObject, 'readwrite');
                                        let keyValStore = tx.objectStore(dbObject);

                                        data.forEach(function(restaurant){
                                            keyValStore.put(restaurant);
                                        });

                                        //return tx.complete;
                                    }).then(function() {
                                        //console.log('Success: JSON data added to indexDB!'); //debug
                                    }).catch(function(err){
                                        console.log('Error: could not add data to indexDB!'); //debug
                                    });

                                    callback(null, data); //returning the data => restaurants JSON

                                });
                            }
                        )
                        .catch(function(err) {
                            console.log('Error: Fetch Error', err);

                            callback(err, null);
                        });
                }

        });

    }


    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback) {
        // fetch all restaurants with proper error handling.
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                const restaurant = restaurants.find(r => r.id == id);
                if (restaurant) { // Got the restaurant
                    callback(null, restaurant);
                } else { // Restaurant does not exist in the database
                    callback('Restaurant does not exist', null);
                }
            }
        });
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */
    static fetchRestaurantByCuisine(cuisine, callback) {
        // Fetch all restaurants  with proper error handling
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given cuisine type
                const results = restaurants.filter(r => r.cuisine_type == cuisine);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */
    static fetchRestaurantByNeighborhood(neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given neighborhood
                const results = restaurants.filter(r => r.neighborhood == neighborhood);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */
    static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                let results = restaurants
                if (cuisine != 'all') { // filter by cuisine
                    results = results.filter(r => r.cuisine_type == cuisine);
                }
                if (neighborhood != 'all') { // filter by neighborhood
                    results = results.filter(r => r.neighborhood == neighborhood);
                }
                callback(null, results);
            }
        });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */
    static fetchNeighborhoods(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all neighborhoods from all restaurants
                const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
                // Remove duplicates from neighborhoods
                const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
                callback(null, uniqueNeighborhoods);
            }
        });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */
    static fetchCuisines(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all cuisines from all restaurants
                const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
                // Remove duplicates from cuisines
                const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
                callback(null, uniqueCuisines);
            }
        });
    }

    /**
     * Restaurant page URL.
     */
    static urlForRestaurant(restaurant) {
        return (`./restaurant.html?id=${restaurant.id}`);
    }

    /**
     * Restaurant image URL.
     */
    static imageUrlForRestaurant(restaurant) {
        /*
        In order to prevent missing photos like for example the Casa Enrique restaurant
        we check to see if we have an image id available...
         */
        if (restaurant.photograph !== undefined) {
            return (`/img/${restaurant.photograph}.webp`); //for stage3 we will use webp
        }

        /* In case we do not have an image we could either return null or a dummy photo */
        return ('/img/no-photo.webp');
    }

    /**
     *
     * a11y - Meaningful alternative text for images
     *
     * @param restaurant
     * @returns {*}
     */
    static imageAltForRestaurant(restaurant) {
        if (restaurant.name !== undefined && restaurant.neighborhood !== undefined) {
            //Alt would sound like "Restaurant Name" in "Location"
            return `Image of ${restaurant.name} restaurant`;
        }
        return null;
    }


    /**
     * Map marker for a restaurant.
     */
    static mapMarkerForRestaurant(restaurant, map) {
        if (typeof google !== "undefined") {

            const marker = new google.maps.Marker({
                    position: restaurant.latlng,
                    title: restaurant.name,
                    url: DBHelper.urlForRestaurant(restaurant),
                    map: map,
                    animation: google.maps.Animation.DROP
                }
            );
            return marker;
        }
    }

    /**
     * Fetch all reviews for a particular restaurant.
     */

    static fetchRestaurantReviews(restaurantID,callback) {

        //there is no stored data so we retrieve it from the server
        /* Getting the restaurants JSON from the development server using the FETCH API instead of XMLHttpRequest() */
        fetch(DBHelper.DATABASE_URL+'/reviews/?restaurant_id='+restaurantID)
            .then(
                function(response) {
                    if (response.status !== 200) {
                        console.log('Error: Looks like there was a problem. Status Code: ' +
                            response.status);

                        callback(response.status, null);
                    }

                    //This is the JSON response from the dev server
                    response.json().then(function(data) {

                       //console.log(data); //restaurants data from remote JSON //debug
                        callback(null, data); //returning the data => restaurants JSON

                    });
                }
            )
            .catch(function(err) {
                console.log('Error: Fetch Error', err);

                callback(err, null);
            });
    }

}
