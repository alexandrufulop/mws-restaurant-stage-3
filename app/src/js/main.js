let restaurants,
    neighborhoods,
    cuisines;
var map;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    DBHelper.registerSW(); //we register the service worker

    /* If we are on homepage */
    if (window.location.pathname === '/'){
        fetchNeighborhoods();
        fetchCuisines();
        updateRestaurants(); //better like this ;)
    }

});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
    DBHelper.fetchNeighborhoods((error, neighborhoods) => {
        if (error) { // Got an error
            console.error(error);
        } else {
            self.neighborhoods = neighborhoods;
            fillNeighborhoodsHTML();
        }
    });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
    const select = document.getElementById('neighborhoods-select');
    neighborhoods.forEach(neighborhood => {
        const option = document.createElement('option');
        option.innerHTML = neighborhood;
        option.value = neighborhood;
        select.append(option);
    });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
    DBHelper.fetchCuisines((error, cuisines) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.cuisines = cuisines;
            fillCuisinesHTML();
        }
    });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
    const select = document.getElementById('cuisines-select');

    cuisines.forEach(cuisine => {
        const option = document.createElement('option');
        option.innerHTML = cuisine;
        option.value = cuisine;
        select.append(option);
    });
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
    let loc = {
        lat: 40.722216,
        lng: -73.987501
    };
    self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: loc,
        scrollwheel: false
    });
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
    const cSelect = document.getElementById('cuisines-select');
    const nSelect = document.getElementById('neighborhoods-select');

    const cIndex = cSelect.selectedIndex;
    const nIndex = nSelect.selectedIndex;

    const cuisine = cSelect[cIndex].value;
    const neighborhood = nSelect[nIndex].value;

    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            resetRestaurants(restaurants);
            fillRestaurantsHTML();
        }
    })
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
    // Remove all restaurants
    self.restaurants = [];
    const ul = document.getElementById('restaurants-list');
    ul.innerHTML = '';

    // Remove all map markers
    self.markers.forEach(m => m.setMap(null));
    self.markers = [];
    self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
    const ul = document.getElementById('restaurants-list');
    restaurants.forEach(restaurant => {
        ul.append(createRestaurantHTML(restaurant));
    });
    addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
    const li = document.createElement('li');

    /**
     * a11y
     * Setting aria role attribute to the list element
     */
    li.setAttribute("role", "listitem");

    /* Do we have a valid image url? */
    let imageSrc = DBHelper.imageUrlForRestaurant(restaurant);

    if(imageSrc) {
        const image = document.createElement('img');
        image.className = 'restaurant-img';
        image.setAttribute('data-src', imageSrc);
        image.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

        /* Prevent bug in server json: There is a bug in the server side json -> last item is missing the photograph */
        if (restaurant.photograph !== undefined) {
            image.srcset = `/img/${restaurant.photograph}-400.jpg 360w, /img/${restaurant.photograph}-800.jpg 800w`;
        }
        else
            {
                image.srcset = `/img/no-photo-400.png 360w, /img/no-photo-800.png 800w`;
            }

        //Adding dynamic alt text for each image
        image.alt = DBHelper.imageAltForRestaurant(restaurant);

        li.append(image); //we append the image to the element
    }

    const name = document.createElement('h3');
    name.innerHTML = restaurant.name;

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;


    const address = document.createElement('p');
    address.innerHTML = `${restaurant.address}.`;


    const more = document.createElement('a');
    more.innerHTML = 'View Details';
    more.href = DBHelper.urlForRestaurant(restaurant);


    /**
     * a11y
     * if we have a description of the image we skip the restaurant name and city,
     * thus keeping only the address to be spoken by a screen reader
     */
    /* !!! Important !!!
    if we have an alt text set to the image, it means that a screen reader would repeat the same
    information regarding the selected restaurant (the name and the city).
    To overcome this we are using aria-hide on h1 and p elements
    */
    name.setAttribute("aria-hidden", "true");
    neighborhood.setAttribute("aria-hidden", "true");

    /**
     * a11y
     * Making the Restaurant name audible and focusable
     */
    li.setAttribute("tabindex", "0");

    /**
     * Appending elements to the page
     */

    li.append(name);
    li.append(neighborhood);
    li.append(address);
    li.append(more);

    return li;
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
    restaurants.forEach(restaurant => {
        // Add marker to the map
        const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
            google.maps.event.addListener(marker, 'click', () => {
                window.location.href = marker.url
            });
            self.markers.push(marker);
    });
};
