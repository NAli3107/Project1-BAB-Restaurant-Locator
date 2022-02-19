// Strict mode syntax
"use strict";

// user cuisine options - to be shown in checkboxes

const userCuisineOptions = [
  "Italian",
  "Thai",
  "Indian",
  "Chinese",
  "Grill",
  "Pizza",
  "French",
  "Burgers",
  "British",
  "Vegetarian-Friendly",
  "Vegan-Options",
];
userCuisineOptions.sort();
// render cuisine options to the page
userCuisineOptions.forEach((cuisine) => {
  $("#checkboxMenu").append(
    $(
      `<label class="checkbox">
          <input class='cuisine' type="checkbox" value=${cuisine}>
          ${cuisine.split("-").join(" ")}
        </label>`
    )
  );
});

// Travel advsior Api key
let taAPIKey;

// Fetch Travel Advisor API function
const getTravelAPI = async (lat, lon) => {
  // Fixed variables
  const limit = 30;
  const currency = "GBP";
  const distance = 5;
  const isOpen = false;
  const units = "km";
  const language = "en_GB";
  try {
    const response = await fetch(
      `https://travel-advisor.p.rapidapi.com/restaurants/list-by-latlng?latitude=${lat}&longitude=${lon}&limit=${limit}&currency=${currency}&distance=${distance}&open_now=${isOpen}&lunit=${units}&lang=${language}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-host": "travel-advisor.p.rapidapi.com",
          "x-rapidapi-key": taAPIKey,
        },
      }
    );
    if (response.ok) {
      // Return the response data json
      const data = await response.json();
      return renderOutput(data);
    } else {
      console.log(`Error: ${response.statusText}`);
      // Ask for new key if too many requests made (429)
      if (response.status === 429) {
        userTAKey();
      }
    }
  } catch (error) {
    console.log(`Error: ${error}`);
  }
};

let restaurants;
// Render Travel Advisor Output function
const renderOutput = (data) => {
  restaurants = data.data;
  restaurants.sort((a, b) => a.ranking_position - b.ranking_position);
  cuisineSelector();
  //  if user made cuisine choices use applicable array
  if (userCuisineChosesArray.length > 0) {
    displayRestaurants(restaurantsArray);
    addRestaurantMarkers(restaurantsArray);
  } else {
    displayRestaurants(restaurants);
    addRestaurantMarkers(restaurants);
  }
  $("#userLocationInput").val("");
  $("main").removeClass("fadeIn");
};

// Add Restaurant locations to map
function addRestaurantMarkers(restaurants) {
  restaurants.forEach((restaurant) => {
    addMarker(
      restaurant.name,
      restaurant.latitude,
      restaurant.longitude,
      restaurant.location_id
    );
  });
}
// map data fetch
let townInput;
let searchedLatitude;
let searchedLongitude;
let mapData;
function getGeocode() {
  fetch(
    `https://geocode.search.hereapi.com/v1/geocode?q=${townInput}&apiKey=CKReAVlxRYgsLhXPUI3tRrhdngw1rBQNvm426xif23M`
  )
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      mapData = data;
    })
    .then(() => {
      searchedLatitude = mapData.items[0].position.lat;
      searchedLongitude = mapData.items[0].position.lng;
      // Remove previous markers
      removeMapMarkers();
      getTravelAPI(searchedLatitude, searchedLongitude);
      // Center map
      updateMapCenter(searchedLatitude, searchedLongitude, 16);
    })
    .catch((error) => {
      console.log(`Error: ${error}`);
      // Open Invalid Search Modal
      invalidSearch(townInput);
    });
}

// Invalid Search Modal function
const invalidSearch = (townInput) => {
  document.querySelector("#invalidSearchQuery").innerHTML = townInput;
  openModal(invalidSearchModal);
};

// Event listener to close the invalid search modal
const invalidSearchBtn = document.querySelector("#invalidSearchBtn");
invalidSearchBtn.addEventListener("click", function () {
  closeModal(invalidSearchModal);
});

// Travel Advisor api input elements
const apiKeyModal = document.querySelector("#apiKeyModal");
const apiKeyInput = document.querySelector("#apiKeyInput");
const apiKeySaveBtn = document.querySelector("#apiKeySaveBtn");

// Check for Travel Advisor API key in local storage.
const getTAKey = () => {
  const key = localStorage.getItem("TAKey");
  // If not null
  if (key) {
    // Set the key to a variable
    taAPIKey = key;
  } else {
    // Ask for key
    openModal(apiKeyModal);
  }
};

// Set Travel Advsior API key
const setTAKey = (apiKey) => {
  localStorage.setItem("TAKey", apiKey);
};

// Ask user to enter api key
const userTAKey = () => {
  openModal(apiKeyModal);
};

// Event listener to get the Travel Advisor key
apiKeySaveBtn.addEventListener("click", function () {
  taAPIKey = apiKeyInput.value;
  // Only set key if input not blank
  if (taAPIKey) {
    setTAKey(taAPIKey);
    closeModal(apiKeyModal);
  }
});

// Function to open a modal
function openModal($el) {
  $el.classList.add("is-active");
}

// Function to close a modal
function closeModal($el) {
  $el.classList.remove("is-active");
}

// Get the Travel Advisor api key from local storage
getTAKey();

// function for narrowing down search based on user input
let restaurantsArray = [];
let cuisineArray = [];
function cuisineSelector() {
  restaurantsArray = [];
  for (let i = 0; i < restaurants.length; i++) {
    const restaurant = restaurants[i];
    if (restaurant.name) {
      cuisineArray = [];
      userCuisineChosesArray.forEach((userChose) => {
        cuisineArrayChecker(restaurant, userChose);
      });
    }
  }
}
// takes user choses and put them into an array
let userCuisineChosesArray = [];
function inputToArray() {
  userCuisineChosesArray = [];
  const userCuisineChoses = $(".cuisine:checked");
  for (let i = 0; i < userCuisineChoses.length; i++) {
    userCuisineChosesArray.push(
      userCuisineChoses[i].value.split("-").join(" ")
    );
  }
}
//function checks through each restaurants cuisines to see if it meets the criteria
function cuisineArrayChecker(restaurant, userChose) {
  for (let j = 0; j < restaurant.cuisine.length; j++) {
    cuisineArray.push(restaurant.cuisine[j].name);
  }
  if (cuisineArray.indexOf(userChose) === -1) {
    return;
  } else {
    if (restaurantsArray.includes(restaurant)) {
      return;
    }
    restaurantsArray.push(restaurant);
  }
}
// event listener on submit search button
$("#submitButton").click((e) => {
  e.preventDefault();
  inputToArray();
  townInput = $("#userLocationInput").val();
  getGeocode();
  $("main").addClass("fadeIn");
});

// render restaurant cards
function displayRestaurants(restaurants) {
  $("#restaurant-container").empty();
  for (let i = 0; i < restaurants.length; i++) {
    const restaurant = restaurants[i];
    if (restaurant.name && restaurant.photo) {
      $("#restaurant-container").append(
        $(
          `<div class="column is-4">
            <div id="${restaurant.location_id}" class="card">
              <div class="cardTitle">
                <p id="card-name" class="title is-5">${restaurant.name}</p>
              </div>
              <div class="card-image">
                <figure class="image is-4by3">
                  <img src="${restaurant.photo.images.medium.url}">
                </figure>
              </div>
              <div id="card-content" "class="card-content">
                <div class="content">
                  <details>
                    <summary class="restaurantDescription">Description</summary>
                    <p>${checkForUndefined(restaurant.description)}</p>
                  </details>
                </div>
                <div id="website" class="content">
                  <a href=${checkForUndefined(
                    restaurant.website
                  )} target='_blank'>Visit Website</a>
                </div>
              <footer class="card-footer">
                <ul id="footer">
                  <li>
                    Address:<br>
                    ${checkForUndefined(restaurant.address)}
                  </li>
                  <li> 
                    <a onClick="viewRestaurantOnMap(${restaurant.latitude},${
            restaurant.longitude
          })">View on Map</a>
                  </li>
                  <li>
                    Phone: ${checkForUndefined(restaurant.phone)}
                  </li>
                  <li>
                    <a href=mailto:${checkForUndefined(
                      restaurant.email
                    )}>Email Restaurant</a>
                  </li>
                </ul>
              </footer>
            </div>
          </div>
        </div>`
        )
      );
    }
  }
  $('#sortBy').css('display', 'flex')
  $('#aboutBAB').css('display', 'none')
}

// check for missing data and return generic message
function checkForUndefined(restaurantInfo) {
  if (restaurantInfo === undefined) {
    return "Not-available";
  } else return restaurantInfo;
}

// Map elements
const container = document.getElementById("popup");
const content = document.getElementById("popup-content");
const closer = document.getElementById("popup-closer");

// Overlay for map markers
const overlay = new ol.Overlay({
  element: container,
  autoPan: {
    animation: {
      duration: 250,
    },
  },
});

// Create map
const map = new ol.Map({
  overlays: [overlay],
  target: "map",
  layers: [
    new ol.layer.Tile({
      name: "openStreet",
      source: new ol.source.OSM(),
    }),
  ],
  view: new ol.View({
    // Map starts centered on Birmingham
    center: ol.proj.fromLonLat([-1.89983, 52.48142]),
    zoom: 12,
  }),
});

// Update map center point
const updateMapCenter = (lat, lon, zoom = 15) => {
  map.getView().setCenter(ol.proj.fromLonLat([lon, lat]));
  map.getView().setZoom(zoom);
};

// Function to create marker
const addMarker = (place, lat, lon, element) => {
  if (place) {
    const marker = new ol.Feature({
      geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat])),
      name: place,
      element: element,
    });

    const markers = new ol.source.Vector({
      name: "mapMarkers",
      features: [marker],
    });

    const markerVectorLayer = new ol.layer.Vector({
      name: place,
      source: markers,
      style: new ol.style.Style({
        image: new ol.style.Icon({
          anchor: [0.5, 46],
          anchorXUnits: "fraction",
          anchorYUnits: "pixels",
          src: "./assets/images/icon.png",
        }),
      }),
    });
    map.addLayer(markerVectorLayer);
  }
};

// Display popup on icon click
map.on("click", function (evt) {
  const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
    return feature;
  });
  if (feature) {
    const coordinate = evt.coordinate;
    const name = feature.get("name");
    const elementID = feature.get("element");
    content.innerHTML = `<p>${name}</p><a href="#${elementID}">More information</a>`;
    overlay.setPosition(coordinate);
  } else {
    overlay.setPosition(undefined);
  }
});

// Close popup on map
closer.onclick = function () {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};

// Clear Map Markers
const removeMapMarkers = () => {
  const layers = [...map.getLayers().getArray()];
  layers.forEach((layer) => {
    if (layer && layer.get("name") !== "openStreet") {
      map.removeLayer(layer);
    }
  });
};

// View restaurant on map
const viewRestaurantOnMap = (lat, lon) => {
  updateMapCenter(lat, lon, 20);
  document.body.scrollTop = document.documentElement.scrollTop = 0;
};

/* Local Storage */
const recentSearchesSize = 5;
const recentSearchesKey = "recentSearches";

const searchButtonElement = $("#submitButton");
const searchValueElement = $("#userLocationInput");
const searchResultsListElement = $("search-results-list");
const recentSearchListElement = $("#recent-search-list");
const recentSearchClearButtonElement = $("#recent-search-clear");
searchButtonElement.click(searchRestaurants);
recentSearchClearButtonElement.click(clearRecentSearches);

renderRecentSearches();

function searchRestaurants(event) {
  event.preventDefault();
  const searchValue = searchValueElement.val();
  addRecentSearches(searchValue);
  renderRecentSearches();
}

function renderRecentSearches() {
  recentSearchListElement.html("");
  getRecentSearchItems().forEach((searchItem) => {
    const newRecentSearchItems = $("<li>");
    newRecentSearchItems.text(
      searchItem.charAt(0).toUpperCase() + searchItem.slice(1)
    );
    recentSearchListElement.prepend(newRecentSearchItems);
  });
}

function getRecentSearchItems() {
  const localStorageString = localStorage.getItem(recentSearchesKey);
  if (localStorageString == null) {
    return [];
  }
  return JSON.parse(localStorageString);
}

function addRecentSearches(term) {
  const recentSearches = getRecentSearchItems();
  if (recentSearches.includes(term)) {
    return;
  }
  recentSearches.push(term);
  while (recentSearches.length > recentSearchesSize) {
    recentSearches.shift();
  }
  localStorage.setItem(recentSearchesKey, JSON.stringify(recentSearches));
}

function clearRecentSearches() {
  localStorage.removeItem(recentSearchesKey);
  renderRecentSearches();
}

// sort by distance/rating

const distanceButton = $("#distanceButton");
const ratingButton = $("#ratingButton");

function sortByDistance() {
  if (restaurantsArray.length > 0) {
    restaurantsArray.sort((a, b) => a.distance - b.distance);
    displayRestaurants(restaurantsArray);
  } else {
    restaurants.sort((a, b) => a.distance - b.distance);
    displayRestaurants(restaurants);
  }
}

function sortByRating() {
  if (restaurantsArray.length > 0) {
    restaurantsArray.sort((a, b) => a.ranking_position - b.ranking_position);
    displayRestaurants(restaurantsArray);
  } else {
    restaurants.sort((a, b) => a.ranking_position - b.ranking_position);
    displayRestaurants(restaurants);
  }
}

distanceButton.click(sortByDistance);
ratingButton.click(sortByRating);

// search from history

function searchFromHistory(e) {
  townInput = e.target.innerText;
  inputToArray();
  getGeocode();
  $("main").addClass("fadeIn");
}

recentSearchListElement.click(searchFromHistory);
