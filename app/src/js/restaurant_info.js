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
            checkFavRestaurant(); //show favourite restaurant
        }
    });
});


/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (callback) => {
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
let fillRestaurantHTML = (restaurant = self.restaurant) => {

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
        image.setAttribute('data-src', imageSrc);
        image.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

        /* Prevent bug in server json: There is a bug in the server side json -> last item is missing the photograph */
        if (restaurant.photograph !== undefined) {
            image.srcset = `/img/${restaurant.photograph}-400.webp 360w, /img/${restaurant.photograph}-800.webp 800w`;
        }
        else
            {
                image.srcset = `/img/no-photo-400.webp 360w, /img/no-photo-800.webp 800w`;
            }

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

    //debug
    //console.log(`Restaurant id is ${restaurant.id}`);

    /* Retrieve current restaurant reviews */
    DBHelper.fetchRestaurantReviews(restaurant.id, (error, reviews) => {
        self.restaurant.reviews = reviews;
        if (!reviews) {
            console.error(error); //could not retrieve reviews
        }

        // fill reviews
        fillReviewsHTML();
    });

};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
let fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
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
let fillReviewsHTML = (reviews = self.restaurant.reviews) => {

    const container = document.getElementById('reviews-container');

    const title = document.createElement('h3');
    title.innerHTML = 'Reviews';

    /* New feature: Adding a new review */
    title.appendChild(htmlReviewForm());

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


/* Open the add new review HTML form */
let htmlReviewForm = () => {

    let header = document.createElement('h4');
    let button = document.createElement('button');
    button.textContent = "Add a review";
    button.setAttribute('class', 'submit-button');
    button.onclick = function(){
        //we watch the form for submission
        document.getElementById('ModalForm').addEventListener('submit', function(event) {
            event.preventDefault();

            //when the form will be submited we trigger this method
            submitReview(event);
        });

        openModal(); //opening the modal form
    };

    header.appendChild(button);

    return header;
};

/* Submit the form with the newly added review */
let submitReview = (event) => {

    //debug
    //console.log(event);
    let url = DBHelper.DATABASE_URL + '/reviews/'; //backend server url
    let jsonFormData = toJSONString(event.target); //the form data as a JSON obj
    let jsonData = JSON.parse(jsonFormData);
    jsonData["restaurant_id"] = self.restaurant.id; //setting the restaurant_id !!!
    jsonData["createdAt"] = Date.now();
    jsonFormData = JSON.stringify(jsonData); //rebuilding the json string

    //debug
    //console.log(jsonData,jsonFormData);
    //debugger;

    /* Post form data to the server using fetch api */
   return fetch(url, {
        method: 'post',
        body: jsonFormData
    }).then(function(response) {
        return response.json();
    }).then(function(data) {
       //successful: added the review to the db
        //console.log(data); //debug response
       thankYou(event);

      //CAVEAT: todo Now we need to update the cached iDB info with the new, but being offline we don't know the review ID...

    }).catch(function(err) {
        //OFFLINE: sync event should take over from here...
        //console.log(err); //debug

       //Show ThankYou!
        thankYou(event);

        //Showing the user
        let el = document.getElementById('Status');
        el.scrollIntoView();

    }).then(function(){
       //add review to the page no matter if request was successful or not
       let reviewsList = document.getElementById('reviews-list');
       reviewsList.appendChild(createReviewHTML(jsonData));
       reviewsList.scrollIntoView();
   });



};

/* Show review Thank you and close modal */
let thankYou = (event) => {

    /* Locating our form... */
    let formEl = event.target.parentElement; //the div in which the form resides
    let theForm = document.getElementById('ModalForm'); //to be improved: ideally should be selected using formEl ...
    /* Crafting a nice message after form submit */
    formEl.parentElement.style = 'background-color:#fff;z-index:9999;';
    theForm.classList.add('is-hidden');
    document.getElementById('ThankYou').classList.remove('is-hidden');

    setTimeout(function(){
        closeModal();
        formEl.parentElement.style = '';
        document.getElementById('ThankYou').classList.add('is-hidden');
        theForm.classList.remove('is-hidden');

    },3000); //closing modal after thank you message

};
/**
 * Create review HTML and add it to the webpage.
 */
let createReviewHTML = (review) => {

    //debug reviews data
  //console.log(review);

    const li = document.createElement('li');
    const name = document.createElement('p');
    name.innerHTML = review.name;
    li.appendChild(name);

    /**
     * a11y
     * Reviewer's name
     */
    name.setAttribute("aria-label", `Reviewer's name: ${review.name}.`);

    /* Setting date from the json timestamp */
    let restData = new Date(review.createdAt);
    if(review.updatedAt !== undefined)
    {
        let restData = new Date(review.updatedAt);
    }

    review.date = restData.toDateString();

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
let fillBreadcrumb = (restaurant = self.restaurant) => {
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
let getParameterByName = (name, url) => {
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


/* Form to JSON - a method to convert the form input into a json object */
let toJSONString = ( form ) => {
    let obj = {};
    let elements = form.querySelectorAll( "input, select, textarea" );
    for( let i = 0; i < elements.length; ++i ) {
        let element = elements[i];
        let name = element.name;
        let value = element.value;

        if( name ) {
            obj[ name ] = value;
        }
    }

    return JSON.stringify( obj );
};

/* Fav restaurant */
/* Adds the (un)favourite request to iDB to be processed by the sw */
//http://localhost:1337/restaurants/<restaurant_id>/?is_favorite=true
let addToFavorites = () => {

    /* IndexDB */
    let databaseName = 'temp';
    let dbObject = 'favorites';

    //we open/create a new iDB
    const dbPromise = idb.open(databaseName, 1, function(upgradeDb) {

        //debug
        //console.log(`Info: Opening the ${databaseName} object store.`); //debug

        if (!upgradeDb.objectStoreNames.contains(dbObject)) {
            upgradeDb.createObjectStore(dbObject,{keyPath: 'id'});

            //console.log('Creating a new data object store for restaurants JSON.'); //debug
        }
    }).catch(function(){
        console.log('Info: Database is not available');
    });


    dbPromise.then(function(db) {
       //console.log(db, url);
        let tx = db.transaction(dbObject, 'readwrite');

        //we check to see if we already registered this pending request
        //if so this means the user changes his mind and unfavorite the resto
        tx.objectStore(dbObject).get(self.restaurant.id)
            .then(function(obj){

                //do we have stored pending data?
                if(obj !== undefined)
                {
                    let storedUrl = new URL(obj.data.url); //create a url object from stored url string
                    let favourite = storedUrl.searchParams.get("is_favorite"); //the current favourite state

                    //if the user changes his mind and unfavorite while offline we keep track of that action... //BROBLEM
                    if(favourite === "false") {
                        self.restaurant.is_favorite = "true";
                    }
                    else {
                        self.restaurant.is_favorite = "false";
                    }

                    console.log('Already stored object with favourite :', obj, self.restaurant.is_favorite);
                }
                else
                    {
                        //if the resto is not favourite, now will be and the opposite
                        if(self.restaurant.is_favorite === "false") {
                            self.restaurant.is_favorite = "true";
                        }
                        else {
                            self.restaurant.is_favorite = "false";
                        }
                    }

                //add url or modify url to temp idb in order to be processed
                let url = DBHelper.DATABASE_URL+'/restaurants/'+self.restaurant.id+'/?is_favorite='+self.restaurant.is_favorite;
                tx.objectStore(dbObject).put({
                    id: self.restaurant.id,
                    data: {url: url}
                }).then(function(){

                    //Modify this restaurant stored data to reflect the favourite change.. Otherwise the cached version will be old
                    /* IndexDB */
                    let databaseNameR = 'data-v0';
                    let dbObjectR = 'restaurants';

                    let dbPromiseR = idb.open(databaseNameR, 1).catch(console.log('Info: Database is not available'));

                    dbPromiseR.then(function (dbR) {
                        //debug
                        //console.log(dbR);

                        //console.log(self.restaurant);
                       //We update this restaurant favourite value in the restaurants idb
                        let txR = dbR.transaction(dbObjectR, 'readwrite') //READWRITE VERY IMPORTANT for add, put, or delete methods
                            .objectStore(dbObjectR).put(self.restaurant);
                        console.log(txR);
                        return txR.complete;

                    });

                });


            }).then(favToggle())
            .catch(function(err){
                console.log('Transaction failed', err);
            });

    }).catch(function(err){
        console.log(`Error: could not add ${url} data to indexDB!`); //debug
    });

};

/* Toggle favourite heart on/off */
let favToggle = () => {

    //if we don't have any stored pending favourite requests we get the current state from the icon
    let Fav = document.getElementById('Fav');
    let path = Fav.getElementsByTagName('path');
    let starType = path[0].style.fill;

    if(starType !== '')
    {
        path[0].style.fill = '';
    }
    else
        {
            path[0].style.fill = '#F05228'; //todo improve - set a class
        }
};

/* Check if favorite restaurant and show */
let checkFavRestaurant = () => {

    console.log('Check favourite:',self.restaurant.is_favorite);

    let path = document.getElementById('Fav').getElementsByTagName('path');

    if(self.restaurant.is_favorite === "false") {
        path[0].style.fill = ''; //todo improve - set a class and reduce double code
    }
    else
        {
            path[0].style.fill = '#F05228'; //todo improve - set a class and reduce double code
        }

};