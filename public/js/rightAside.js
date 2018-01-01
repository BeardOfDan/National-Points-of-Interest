
'use strict';

ko.options.deferUpdates = true;

// the value for this is given inside of RightAsideStoryViewModel()
// this is because the binding for RightAsideStoryViewModel() occurs at the end of initMap()
// because initMap() is the callback function for the google maps api, it will not be called until after the resources for the google api are aquired
// because of all of the preceeding, variables will aquire their values in a manner that prevents them being used while undefined
var modelRightAside;

var independentCount = 0;

function RightAsideStoryViewModel() {

  modelRightAside = {
    myStories: ko.observableArray(),
    numStories: ko.observable(),
    searchTerm: ko.observable(),
    articles: [],
    // thisLoc : model.locations,

    clickedLocs: [],

    locationsList: ko.observableArray(model.locations),

    locationClicked: function () {
      modelRightAside.searchTerm(this.title);
      modelRightAside.populateMyStories();

      // hides markers
      view.hideMarkers(model.markers);

      for (var i = 0; i < model.markers.length; i++) {
        if (model.markers[i].title == this.title) {
          // animate the marker of the clicked list item
          model.markers[i].setAnimation(google.maps.Animation.BOUNCE);

          // Change the color of the clicked list item
          var clickedIcon = model.makeMarkerIcon("2BA834"); // A shade of Green
          model.markers[i].setIcon(clickedIcon);

          // Displays clicked markers
          // if the user clicks the "Show Listings" button, then all the markers will display
          // and the clicked markers will retain their green color
          modelRightAside.clickedLocs.push(model.markers[i]);
          view.showListings(modelRightAside.clickedLocs);
        }
      }
    }, // end of locationClicked()

    story: function (uri, headline, snippet) {
      var self = this;
      self.uri = uri;
      self.headline = headline;
      self.snippet = snippet;
    },

    emptyMyStories: function () {
      modelRightAside.myStories.removeAll();
    },

    populateMyStories: function () {
      // first empty the modelRightAside.myStories
      modelRightAside.myStories.removeAll();

      // NY Times Articles API
      var nytimesURL = "http://api.nytimes.com/svc/search/v2/articlesearch.json?q=" +
        modelRightAside.searchTerm() + "&sort=newest&api-key=e479c6ac1a674c7f95ece02baf9419dd";

      $.getJSON(nytimesURL, function (data) {

        modelRightAside.articles = data.response.docs;

        // if in a previous call to this function no stories were returned,
        // reset this variable to its default value
        if (modelRightAside.numStories < 1) {
          modelRightAside.numStories = 3;
        }

        if (modelRightAside.numStories > modelRightAside.articles.length) {
          modelRightAside.numStories = modelRightAside.articles.length;
        }

        console.log("Number of articles about \"" + modelRightAside.searchTerm() + "\" returned: " + modelRightAside.articles.length);

        if (modelRightAside.numStories > 0) {
          for (var i = 0; i < modelRightAside.numStories; i++) {
            var uri = modelRightAside.articles[i].web_url;
            var headline = modelRightAside.articles[i].headline.main;
            var snippet = modelRightAside.articles[i].snippet;

            modelRightAside.myStories.push(new modelRightAside.story(uri, headline, snippet));
          }
        } else {
          var uri = "https://www.nytimes.com";
          var headline = "No story on this topic was found";
          var snippet = "Sorry, but it seems that the New York Times has no stories on the topic of \"" + modelRightAside.searchTerm() + "\". If you like, you may go to the New York Times website itself.";

          modelRightAside.myStories.push(new modelRightAside.story(uri, headline, snippet));
        }

      }).fail(function (jqXHR, textStatus, errorThrown) {
        console.log("New York Times Articles could not be loaded");
        alert("New York Times Articles about " + modelRightAside.searchTerm() + " could not be loaded");
      }); // end of $.getJSON(nytimesURL, function(data))
    } // end of populateMyStories()
  }; // end of modelRightAside


  // ===============================================
  // start of normal RightAsideStoryViewModel() code
  // ===============================================


  var self = this;

  // default values
  modelRightAside.searchTerm(model.locations[0].title);
  modelRightAside.numStories = 3;
  modelRightAside.populateMyStories();

  self.filterText = ko.observable('');

  self.returnMatches = ko.computed(function () {

    if (self.filterText().length < 1) {
      // this prevents errors from occuring when showListings is run
      view.hideMarkers(model.markers);

      // this ensures that if a user erases all input from the filter text,
      // all of the markers will repopulate the screen
      view.showListings(model.markers);

      return modelRightAside.locationsList();
    } else { // there is something to filter
      // console.log("There is something to Filter");
      // console.log("Filter text: " + self.filterText());
    }

    // an array to hold the location matches
    var locMatches = [];
    // an array to hold the marker matches
    var marMatches = [];

    // hide the markers before adding the matching ones
    view.hideMarkers(model.markers);

    var noMatch = true;

    for (var i = 0; i < modelRightAside.locationsList().length; i++) {
      // creates a regular expression for the user's filter text
      var regEx = new RegExp(self.filterText(), "i"); // the "i" flag means case insensitive

      // if a match is found, the long/short indexes will have a value of the index where the match is found
      // else they will contain the value -1
      var longIndex = modelRightAside.locationsList()[i].state[0].search(regEx);
      var shortIndex = modelRightAside.locationsList()[i].state[1].search(regEx);

      // if the user's text input is found anywhere in the location's state name
      if ((longIndex > -1) || (shortIndex > -1)) { // within the user's search parameter
        locMatches.push(modelRightAside.locationsList()[i]);
        marMatches.push(model.markers[i]);

        var indexStart;
        var indexEnd;
        var matchingStateName;

        // if both are a match, then the long name gets preference
        if (longIndex > -1) { // if the match was in the long name
          indexStart = longIndex;
          matchingStateName = modelRightAside.locationsList()[i].state[0];
        } else { // match was in the short name
          indexStart = shortIndex;
          matchingStateName = modelRightAside.locationsList()[i].state[1];
        }

        indexEnd = indexStart + self.filterText().length;

        matchingStateName = matchingStateName.toLowerCase();

        for (var u = indexStart; u < indexEnd; u++) { // makes matching portions of state name uppercase
          matchingStateName = matchingStateName.substr(0, u) + matchingStateName.charAt(u).toUpperCase() + matchingStateName.substr(u + 1);
        }

        noMatch = false;
      } else {
        // this is not the droid you are looking for
      }
    } // end of for loop

    if (noMatch) {
      return { title: "No Matches Found" };
    } else {
      view.showListings(marMatches);
    }

    // returns an array of matches to the listing
    return locMatches;
  }); // end or returnMatches()
} // end of RightAsideStoryViewModel()
