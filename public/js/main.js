
'use strict';

// the values for model and view are given at the start of initMap()
// this is because initMap() is the callback function for the google maps api
// this way there will never be an error cause by google not being defined
var model;
var view;

function initMap() {
  $(function(){
    ko.applyBindings( new RightAsideStoryViewModel() );
  });

  model = {
    map : {},
    markers : [],
    polygon : null,
    placeMarkers : [],

    locations : [
      {title: "Silicon Valley", location: {lat: 37.443021, lng: -122.154627}},
      {title: "Los Vegas", location: {lat: 36.082, lng: -115.1726}},
      {title: 'Disneyland', location: {lat: 33.812434, lng: -117.918620}},
      {title: "Kennedy Space Center", location: {lat: 28.52327, lng: -80.68161}},
      {title: "DisneyWorld", location: {lat: 28.392825, lng: -81.57085}},
      {title: "Carlsbad Caverns", location: {lat: 32.147855, lng: -104.556714}},
      {title: "St. Louis Gateway Arch", location: {lat: 38.624691, lng: -90.184776}},
      {title: "Minnehaha Park", location: {lat: 44.91533, lng: -93.211001}},
      {title: "Coronado Heights Castle", location: {lat: 38.613411, lng: -97.703163}},
      {title: "Luray Caverns", location: {lat: 38.663950, lng: -78.48385}},
      {title: "Pecos National Historical Park", location: {lat: 35.550286, lng: -105.6878}},
      {title: "Mount Rushmore", location: {lat: 43.879102, lng: -103.459067}},
      {title: "Space Needle", location: {lat: 47.620506, lng: -122.349277}},
      {title: "Niagara Falls", location: {lat: 43.08129, lng: -79.07807}},
      {title: "Grand Canyon", location: {lat: 36.106965, lng: -112.112997}},
      {title: "Yellowstone National Park", location: {lat: 44.427963, lng: -110.588455}}
    ],

    // this is called when a marker on the map is clicked
    populateInfoWindow : function(marker, infowindow) {
      // animate marker when clicked
      // snippet originated from
      // https://developers.google.com/maps/documentation/javascript/examples/marker-animations
      if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
      } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
      }

      if(infowindow.marker != marker) {
        infowindow.setContent("");
        infowindow.marker = marker;
        infowindow.addListener("closeclick", function() {
          infowindow.close();
        });
        var streetViewService = new google.maps.StreetViewService();
        var radius = 50;
        function getStreetView(data, status) {
          if (status == google.maps.StreetViewStatus.OK) {
            var nearStreetViewLocation = data.location.latLng;
            var heading = google.maps.geometry.spherical.computeHeading(
              nearStreetViewLocation, marker.position);
            infowindow.setContent('<div>' + marker.title + '</div><div id="pano"><img src="http://maps.googleapis.com/maps/api/streetview?location=42.40404.2.17513&size=500x500&heading=200&fov=70&pitch=40&key=AIzaSyBAbm2mpHRxSmSk-iaI19oMYKFEqDLxZ_k"></div>');
            var panoramaOptions = {
              position: nearStreetViewLocation,
              pov: {
                heading: heading,
                pitch: 30
              }
            };
            var panorama = new google.maps.StreetViewPanorama(
              document.getElementById("pano"), panoramaOptions);
          } else {
            infowindow.setContent("<div>" + marker.title + "</div>" + "<div>No Street View Found</div>");
          }
        } // end of getStreetView function
        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        infowindow.open(model.map, marker);
      } // end of if
    }, // end of populateInfoWindow(marker, infowindow)

    makeMarkerIcon : function(markerColor) {
      var markerImage = new google.maps.MarkerImage(
        "http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|" +
        markerColor + "|40|_|%E2%80%A2",
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34)
      );
      return markerImage;
    },

    searchWithinPolygon : function() {
      for(var i = 0; i < model.markers.length; i++) {
        if(google.maps.geometry.poly.containsLocation(model.markers[i].position, model.polygon)) {
          model.markers[i].setMap(model.map);
        } else {
          model.markers[i].setMap(null);
        }
      }
    },

    searchBoxPlaces : function(searchBox) {
      view.hideMarkers(model.placeMarkers);
      var places = searchBox.getPlaces();
      if(places.length > 0) {
        model.createMarkersForPlaces(places, model.placeMarkers);
      }
      if(places.length === 0) {
        window.alert("We did not find any places matching that search!");
      }
    },

    createMarkersForPlaces : function(places, markerList) {
      var bounds = new google.maps.LatLngBounds();

      for(var i = 0; i < places.length; i++) {
        var place = places[i];

        var icon = {
          url: place.icon,
          size: new google.maps.Size(35, 35),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(15, 34),
          scaledSize: new google.maps.Size(25, 25)
        };

        var marker = new google.maps.Marker({
          map: model.map,
          icon: icon,
          title: place.name,
          position: place.geometry.location,
          id: place.place_id
        });

        var placeInfoWindow = new google.maps.InfoWindow();

        marker.addListener('click', function() {
          if (placeInfoWindow.marker == this) {
            console.log("This infowindow already is on this marker!");
          } else {
            getPlacesDetails(this, placeInfoWindow);
          }
        }); // end of marker click listener

        markerList.push(marker);

        model.placeMarkers.push(marker);

        if(place.geometry.viewport) {
          bounds.union(place.geometry.viewport);
        } else {
          bounds.extend(place.geometry.location);
        }
        model.map.fitBounds(bounds);
      } // end of for loop
    }, // end of createMarkersForPlaces(places, marker list)

    createLocationsMarkers : function(places, markers) {
      var defaultIcon = model.makeMarkerIcon("0091ff"); // blue
      var highlightedIcon = model.makeMarkerIcon("FFFF24"); // yellow

      var largeInfowindow = new google.maps.InfoWindow();

      for(var i = 0; i < places.length; i++) {
        var position = places[i].location;
        var title = places[i].title;
        var marker = new google.maps.Marker({
          position: position,
          title: title,
          icon: defaultIcon,
          animation: google.maps.Animation.DROP,
          id: i
        });
        markers.push(marker);
        marker.addListener("click", function() {
          model.map.panTo(marker.getPosition());
          model.populateInfoWindow(this, largeInfowindow);
          modelRightAside.searchTerm(this.title);
          modelRightAside.populateMyStories();
        });
        marker.addListener("mouseover", function() {
          this.setIcon(highlightedIcon);
        });
        marker.addListener("mouseout", function() {
          this.setIcon(defaultIcon);
        });
      } // end of for loop

      return markers;
    }, // end of createLocationsMarkers(places, markers)

    populateStates : function() {
      // defines max possible number of retries
      var maxLimit = 10 * model.locations.length;
      var currentCount = 0;

      for(var j = 0; j < model.locations.length; j++) {
        var lat = model.locations[j].location.lat;
        var lng = model.locations[j].location.lng;

        // get the state from lat and lng
        ko.computed(function() {
          // array to hold [0] long_name and [1] short_name for the state
          var state = [];

          // an index that is implemented in a somewhat different fashion
            // because of the asynchronisity of the $.getJSON function that is inside of the for loop
          var asynchIndex = j;

          var error = false;

          var url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" +
                      lat + "," + lng;

          // uncomment the following line to easily get a url to check if the query limit was exceeded
          // console.log("url: " + url);
          // if query limit is exceeded, then change ip address

          $.getJSON(url, function(data) {

            // in case if there is an issue with the returned data
            if (typeof data.results[0] !== 'undefined') {
              // particular section of the returned JSON
              var dataComponents = data.results[0].address_components;

              for(var i = 0; i < dataComponents.length; i++) {
                // determines if the data component contains the state
                if(dataComponents[i].types[0] === "administrative_area_level_1" &&
                  dataComponents[i].types[1] === "political") {
                  state[0] = dataComponents[i].long_name;
                  state[1] = dataComponents[i].short_name;
                }
              }
            } else {
              if(currentCount < maxLimit) {
                currentCount++;
                console.log("retrying to get state");
                $.ajax(this);
              } else {
                error = true;
              }
            }

          }).done(function() {
            // here is where the state parameter will be added
            model.locations[asynchIndex].state = state;
          }).fail(function(jqXHR, textStatus, errorThrown) {
            if(currentCount < maxLimit) {
              // then more retries will be attempted
            } else { // if currentCount is not less than maxLimit, then the following will execute
                     // and since it would not retry with $.ajax(this), the following can only run once
              console.log("JSON for aquiring state that could not be loaded");
              alert("There was an error in setting up the filter process!");
            }

          }).always(function() { // because it calls for data from the internet, this will occurr after rightAside.js has initially run
                                 // this will cause self.locs to never get the state array filled
                                 // using asynchIndex, I can add the state data when it arrives
            // console.log("asynchIndex: " + asynchIndex);

            asynchIndex++;

            // it is the final iteration
              // if all of the locations have tried to get a state
            if(asynchIndex == model.locations.length) {

              var type = typeof modelRightAside;
              if(type === "object") {
                modelRightAside.locationsList(model.locations);
              }

              if(! (currentCount < maxLimit)) {
                // then more retries will be attempted
              } else {
                if(error) {
                  // parse through all of the locations for states
                  // if none of them come up as undefined or whatever, then the error is a false alarm
                  // if at least one of them is undefined, then display the error
                  var noState = false;
                  for(var i = 0; i < model.locations.length; i++) {
                    if(! (model.locations[i].state instanceof Array) ) {
                      noState = true;
                    }
                  }

                  if(noState) {
                    alert("There was an error in collecting the state for one or more of the locations.\n" +
                      "This may cause an error in the 'filter by state' functionality.\n" +
                      "Refreshing the page may resolve this issue");
                  }
                }
              }
            } // end of outer if
          }); // end of $.getJSON(url, function(data))
        }, this); // end of ko.computed(function())
      } // end of for loop
    } // end of populateStates()
  }; // end of model

  view = {
    styles : [
      {
        featureType: "water",
        stylers: [
          { color: "#19a0d8" }
        ]
      }, {
        featureType: "administrative",
        elementType: "labels.text.stroke",
        stylers: [
          { color: "#ffffff" },
          { weight: 6 }
        ]
      }, {
        featureType: "administrative",
        elementType: "labels.text.fill",
        stylers: [
          { color: "#e85113" }
        ]
      }, {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [
          { color: "#efe9e4" },
          { lightness: -40 }
        ]
      }, {
        featureType: 'transit.station',
        stylers: [
          { weight: 9 },
          { hue: '#e85113' }
        ]
      },{
        featureType: 'road.highway',
        elementType: 'labels.icon',
        stylers: [
          { visibility: 'off' }
        ]
      },{
        featureType: 'water',
        elementType: 'labels.text.stroke',
        stylers: [
          { lightness: 100 }
        ]
      },{
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [
          { lightness: -100 }
        ]
      },{
        featureType: 'poi',
        elementType: 'geometry',
        stylers: [
          { visibility: 'on' },
          { color: '#f0e4d3' }
        ]
      },{
        featureType: 'road.highway',
        elementType: 'geometry.fill',
        stylers: [
          { color: '#efe9e4' },
          { lightness: -25 }
        ]
      }
    ], // end of styles array

    initiallyShowListings : function(allMarkers) {
      var bounds = new google.maps.LatLngBounds();
      for(var i = 0; i < allMarkers.length; i++) {
        allMarkers[i].setMap(model.map);
        bounds.extend(allMarkers[i].position);
      }
      model.map.fitBounds(bounds);
    },

    showListings : function(theseMarkers) {
      var bounds = new google.maps.LatLngBounds();
      for(var i = 0; i < theseMarkers.length; i++) {
        theseMarkers[i].setVisible(true);
        bounds.extend(theseMarkers[i].position);
      }
      model.map.fitBounds(bounds);
    },

    hideMarkers : function(markers) {
      for(var i = 0; i < markers.length; i++) {
        markers[i].setVisible(false);
      }
    },

    getPlacesDetails : function(marker, infowindow) {
      var service = new google.maps.places.PlacesService(model.map);
      service.getDetails({
        placeId: marker.id
      }, function(place, status) {
        if(status === google.maps.places.PlacesServiceStatus.OK) {
          infowindow.marker = marker;
          var innerHTML = "<div>";
          if(place.name) {
            innerHTML += "<strong>" + place.name + "</strong>";
          }
          if (place.formatted_address) {
            innerHTML += "<hr>" + place.formatted_address;
          }
          if(place.formatted_phone_number) {
            innerHTML += "<br>" + place.formatted_phone_number;
          }
          if(place.opening_hours) {
            innerHTML += "<br><br><strong>Hours:</strong><br>" +
              place.opening_hours.weekday_text[0] + "<br>" +
              place.opening_hours.weekday_text[1] + "<br>" +
              place.opening_hours.weekday_text[2] + "<br>" +
              place.opening_hours.weekday_text[3] + "<br>" +
              place.opening_hours.weekday_text[4] + "<br>" +
              place.opening_hours.weekday_text[5] + "<br>" +
              place.opening_hours.weekday_text[6];
          }
          if(place.photos) {
            innerHTML += "<br><br><img src='" + place.photos[0].getUrl(
              {maxHeight: 100, maxWidth: 200}) + "'>";
          }
          innerHTML += "</div>";
          infowindow.setContent(innerHTML);
          infowindow.open(model.map, marker);
          infowindow.addListener("closeclick", function() {
            InfoWindow.marker = null;
          });
        } else { // end of if status is OK, the next is error handling
          infowindow.marker = marker;
          var innerHTML = "<div>";
          innerHTML += "Unfortunately, there is some issue with the google.maps.places portion of the Google Maps API.\n";
          innerHTML += "The issue can likely be resolved by refreshing the page.\nSorry for the inconvenience.";
          innerHTML += "</div>";
          infowindow.setContent(innerHTML);
          infowindow.open(model.map, marker);
          infowindow.addListener("closeclick", function() {
            InfoWindow.marker = null;
          });
        } // end of if else
      }); // end of anonymous function(place, status)
    } // end of getPlacesDetails(marker, infowindow)
  }; // end of view



  // ==================================
  // here is the regular initMap() code
  // ==================================



  model.map = new google.maps.Map(document.getElementById("map"), {
    center: {lat: 39.865901, lng: -113.159180},
    zoom: 5,
    styles: view.styles,
    mapTypeControl: false
  });

  var defaultIcon = model.makeMarkerIcon("0091ff");
  var highlightedIcon = model.makeMarkerIcon("FFFF24");

  model.markers = model.createLocationsMarkers(model.locations, model.markers);

  // automatically display the markers on the map
  // view.showListings(model.markers);
  view.initiallyShowListings(model.markers);

  // find what state each locations is in for filtering
  model.populateStates();
} // end of initMap()

function googleAPIError() {
  document.getElementById('nonMapText').innerText = "The Google Maps API has failed to load." +
  "\nPlease refresh the page to try again.";
}
