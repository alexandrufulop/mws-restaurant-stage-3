let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
    self.map = new google.maps.Map(document.getElementById('map'), {
        title: 'A map with the location of the restaurants', //added google maps title a11y
        zoom: 16,
        center: self.restaurant.latlng,
        scrollwheel: false
    });
};


/**
 * Fetch restaurant details
 */
document.addEventListener('DOMContentLoaded', (event) => {
    /* Fetch restaurant details  */
    fetchRestaurantFromURL((error, restaurant) => {
        if (error) { // Got an error!
            console.error(error);
        } else {

            //console.log(restaurant); //restaurant data from parsed json

            fillBreadcrumb();
            DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
        }
    });
});


/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
    if (self.restaurant) { // restaurant already fetched!
        callback(null, self.restaurant);
    }
    const id = getParameterByName('id');
    if (!id) { // no id found in URL
        error = 'No restaurant id in URL';
        callback(error, null);
    } else {
        DBHelper.fetchRestaurantById(id, (error, restaurant) => {
            self.restaurant = restaurant;
            if (!restaurant) {
                console.error(error);
                return;
            }

            fillRestaurantHTML(); //fill the html with restaurant data
            callback(null, restaurant)
        });
    }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {

    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    const address = document.getElementById('restaurant-address');

    /**
     * a11y
     * Restaurant address
     */
    address.setAttribute("aria-label", 'Restaurant address: ' + restaurant.address);

    address.innerHTML = restaurant.address;

    /* Do we have a valid image url? */
    let imageSrc = DBHelper.imageUrlForRestaurant(restaurant);
    if(imageSrc){
        const image = document.getElementById('restaurant-img');
        image.src = imageSrc;
        image.className = 'restaurant-img';

        //Adding dynamic alt text for each image
        const imageAlt = DBHelper.imageAltForRestaurant(restaurant);
        if (imageAlt) {
            image.alt = imageAlt;
        }
    }

    const cuisine = document.getElementById('restaurant-cuisine');
    /**
     * a11y
     * Restaurant cuisine type - made clear
     */
    cuisine.setAttribute("aria-label", restaurant.cuisine_type + ' cuisine');

    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
    }

    // fill reviews
    fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
    const hours = document.getElementById('restaurant-hours');

    for (let key in operatingHours) {
        const row = document.createElement('tr');

        /**
         * a11y
         * Allow tabbing through the opening hours
         */
        row.setAttribute("tabindex", "0");

        const day = document.createElement('td');
        day.innerHTML = key;
        row.appendChild(day);

        const time = document.createElement('td');
        time.innerHTML = operatingHours[key];
        row.appendChild(time);

        hours.appendChild(row);
    }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {

    const container = document.getElementById('reviews-container');

    const title = document.createElement('h3');
    title.innerHTML = 'Reviews';
    /**
     * a11y
     * Allow tabbing to the Reviews section
     */
    title.setAttribute("tabindex", "0");

    container.appendChild(title);

    if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
        return;
    }
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
    const li = document.createElement('li');
    const name = document.createElement('p');
    name.innerHTML = review.name;
    li.appendChild(name);

    /**
     * a11y
     * Reviewer's name
     */
    name.setAttribute("aria-label", `Reviewer's name: ${review.name}.`);

    const date = document.createElement('p');
    date.innerHTML = review.date;
    li.appendChild(date);

    /**
     * a11y
     * Reviews date
     */
    date.setAttribute("aria-label", `Review date: ${review.date}.`);

    const rating = document.createElement('p');
    rating.innerHTML = `Rating: ${review.rating}`;
    li.appendChild(rating);

    /**
     * a11y
     * Help in understanding the rating
     */
    rating.setAttribute("aria-label", `Overall rating: ${review.rating} out of 5 points.`);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    /**
     * a11y
     * Setting aria role attribute to the list element
     */
    li.setAttribute("aria-role", "tab");

    /**
     * a11y
     * We want to allow the user to tab through the different reviews of the restaurant
     */
    li.setAttribute("tabindex", "0");

    return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
    const breadcrumb = document.getElementById('breadcrumb');

    const li = document.createElement('li');
    li.innerHTML = restaurant.name;

    /**
     * a11y
     * Adding title tobreadcrumb
     */
    li.setAttribute("title", restaurant.name);

    /**
     * a11y
     * Breadcrumb
     * https://www.w3.org/TR/2017/NOTE-wai-aria-practices-1.1-20171214/examples/breadcrumb/index.html
     */
    const curLink = document.createElement('a');
    curLink.innerHTML = ('#');
    curLink.setAttribute("aria-current", "page");
    curLink.title = `${restaurant.name} restaurant`;

    breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
    if (!url)
        url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
    if (!results)
        return null;
    if (!results[2])
        return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
};


