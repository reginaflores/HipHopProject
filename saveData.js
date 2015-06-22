var rapgeniusClient = require("rapgenius-js");
var http = require('http'), fs = require('fs');
var jf = require('jsonfile')
var util = require('util') 

var NUM_MET_SEARCHES = 60;
var NUM_MET_IMAGES = 25;
var SLEEP_BETWEEN_MET_SEARCHES = 30000;
var SLEEP_BETWEEN_RAPPERS = 30000;
            
var allData = [];
var currentSearch;
var currentRapper;
var currentSong;


var stopwords = ["a", "about", "above", "above", "across", "after", "afterwards", "again", "against", "all", "almost", 
                  "alone", "along", "already", "also","although","always","am","among", "amongst", "amoungst", "amount",  
                  "an", "and", "another", "any","anyhow","anyone","anything","anyway", "anywhere", "are", "around", "as",  
                  "at", "back","be","became", "because","become","becomes", "becoming", "been", "before", "beforehand", 
                  "behind", "being", "below", "beside", "besides", "between", "beyond", "bill", "both", "bottom","but", 
                  "by", "call", "can", "cannot", "cant", "co", "con", "could", "couldnt", "cry", "de", "describe", "detail", 
                  "do", "done", "down", "due", "during", "each", "eg", "eight", "either", "eleven","else", "elsewhere", 
                  "empty", "enough", "etc", "even", "ever", "every", "everyone", "everything", "everywhere", "except", "few", 
                  "fifteen", "fify", "fill", "find", "fire", "first", "five", "for", "former", "formerly", "forty", "found", 
                  "four", "from", "front", "full", "further", "get", "give", "go", "had", "has", "hasnt", "have", "he", "hence", 
                  "her", "here", "hereafter", "hereby", "herein", "hereupon", "hers", "herself", "him", "himself", "his", "how", 
                  "however", "hundred", "ie", "if", "in", "inc", "indeed", "interest", "into", "is", "it", "its", "itself", "keep", 
                  "last", "latter", "latterly", "least", "less", "ltd", "made", "many", "may", "me", "meanwhile", "might", "mill", 
                  "mine", "more", "moreover", "most", "mostly", "move", "much", "must", "my", "name", "namely", "neither", 
                  "never", "nevertheless", "next", "nine", "no", "nobody", "none", "noone", "nor", "not", "nothing", "now", "nowhere", 
                  "of", "off", "often", "on", "once", "one", "only", "onto", "or", "other", "others", "otherwise", "our", "ours", 
                  "ourselves", "out", "over", "own","part", "per", "perhaps", "please", "put", "rather", "re", "same", "see", "seem", 
                  "seemed", "seeming", "seems", "serious", "several", "she", "should", "show", "side", "since", "sincere", "six", "sixty", 
                  "so", "some", "somehow", "someone", "something", "sometime", "sometimes", "somewhere", "still", "such", "system", "take", 
                  "ten", "than", "that", "the", "their", "them", "themselves", "then", "thence", "there", "thereafter", "thereby", 
                  "therefore", "therein", "thereupon", "these", "they", "thickv", "thin", "third", "this", "those", "though", "three", 
                  "through", "throughout", "thru", "thus", "to", "together", "too", "top", "toward", "towards", "twelve", "twenty", "two", 
                  "un", "under", "until", "up", "upon", "us", "very", "via", "was", "we", "well", "were", "what", "whatever", "when", 
                  "whence", "whenever", "where", "whereafter", "whereas", "whereby", "wherein", "whereupon", "wherever", "whether", 
                  "which", "while", "whither", "who", "whoever", "whole", "whom", "whose", "why", "will", "with", "within", "without", 
                  "would", "yet", "you", "your", "yours", "yourself", "yourselves", 
                  //my adds
                  "the", "ain't", "aint", "dont", "im", "i", "aye", "want", "wants", "whats", "got", "thats", "gotta"];


// function sleep(nextFunction, time) { 
//   setTimeout(function() { 
//     nextFunction; }, time); 
// }


function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e15; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}


var arrayUnique = function(a) {
    return a.reduce(function(p, c) {
        if (p.indexOf(c) < 0) p.push(c);
        return p;
    }, []);
};

var searchMet = function(rapword, index, dataForClient, callback) {
  var dataForClientEntry = {};
  dataForClientEntry.word = rapword;
  dataForClientEntry.images = [];
  var searchUrl = "http://scrapi.org/search/" + rapword;
	  
  var request = http.get(searchUrl, function(response) {
      var data = "";
      response.on('data', function(chunck) {
          data += chunck.toString();
      });
      response.on('end', function() {
	  	var metJson = JSON.parse(data);
		if(!metJson.hasOwnProperty('collection')){
			callback();
		}
		else if (!metJson.collection.hasOwnProperty('items')) {
			callback();
		}
		else if (metJson.collection.items == 0) {
			callback();
		}
		else {
          var metItems = metJson.collection.items;
          if (metItems.length > 0) {
              for (var j = 0; j < Math.min(NUM_MET_IMAGES, metItems.length); j++) { //for testing/prototyping
                  if (metItems[j].image_thumb != "http://metmuseum.org/content/img/placeholders/NoImageAvailable_180x180_frame.png") {
                      var entry = {};
                      entry.href = metItems[j].website_href;
                      entry.thumb = metItems[j].image_thumb;
                      entry.gallery = metItems[j].gallery;
                      entry.title = metItems[j].title;
                      entry.primaryArtistNameOnly = metItems[j].primaryArtistNameOnly;
                      dataForClientEntry.images.push(entry);
                  }
                  if (j == Math.min(NUM_MET_IMAGES, metItems.length)-1) {
                      if (dataForClientEntry.images.length > 0) {
                          //dataForClient.push(dataForClientEntry);
                          dataForClient[index] = dataForClientEntry;
                      }
                      callback();
                  }
              }
          }
          else {
              callback();
          }
      }
      });
  });
  request.on('error', function (err) {
    //handle error here
    console.log("received ERROR!!!! "+err.message);
    callback();
	});
};


var lyricsSearchCb = function(err, lyricsAndExplanations){
    if(err){
        console.log("Error: " + err);
    }
    else {
        var lyricsText = "";
        var lyrics = lyricsAndExplanations.lyrics;
        var explanations = lyricsAndExplanations.explanations;
        lyrics.addExplanations(explanations);

        //sections
        for(var s = 0; s < lyrics.sections.length; s++){
            for(var v = 0; v < lyrics.sections[s].verses.length; v++){
                lyricsText += lyrics.sections[s].verses[v].content + " ";
            }
        }

        var punctuationless = lyricsText.replace(/[\.,-\/#?!$%\^&\*;:{}=\-_`~()]/g,"");
        punctuationless = punctuationless.replace(/(\r\n|\n|\r)/gm," ");
        punctuationless = punctuationless.replace(/'/g, '');
        punctuationless = punctuationless.replace(/\s{2,}/g," ");
        punctuationless = punctuationless.replace("nigga", 'nigger');
        punctuationless = punctuationless.replace("niggas", 'nigger');
        punctuationless = punctuationless.replace("Nigga", 'nigger');
        punctuationless = punctuationless.replace("Niggas", 'nigger');

        var words = punctuationless.split(" ");
        for(var w = 0 ; w < words.length; w++){
          words[w] = words[w].toLowerCase();
        }

        words = words.filter( function( el ) {
          return stopwords.indexOf( el.toLowerCase() ) < 0 && el != "";
        });

  		  words = arrayUnique(words);

        var dataForClient = [];
        var numSearches = 0;
        for(var i=0; i<Math.min(NUM_MET_SEARCHES, words.length-1); i++){
          console.log("SEARCH FOR " +words[i]+ " "+ i + " / "+ Math.min(NUM_MET_SEARCHES, words.length-1));
            sleep(SLEEP_BETWEEN_MET_SEARCHES);
            searchMet(words[i], i, dataForClient, function() {
              numSearches++;
              console.log("NUM SEARCHES = "+numSearches+" out of "+(Math.min(NUM_MET_SEARCHES, words.length-1)));
              if (numSearches == Math.min(NUM_MET_SEARCHES, words.length-1)-1) {
              		dataForClient = dataForClient.filter(function(n){ return n != undefined }); 
                  var rapperEntry = {rapper:currentRapper, data:{song:currentSong, words:dataForClient}};                  
                  allData.push(rapperEntry);
                  currentSearch++;
                  console.log("GO TO NEXT RAPPER!!!\n======\n")
                  sleep(SLEEP_BETWEEN_RAPPERS);
                  doNextSearch();
              }
            });
        }
    }
};

var processRapGeniusResults = function(err, songs){
    if(err){
        console.log("Error: " + err);
    } 
    else {
        if(songs.length > 0){
            rapgeniusClient.searchLyricsAndExplanations(songs[0].link, "rap", lyricsSearchCb);
        }
    }
};

var searchRapGenius = function(song) {
    rapgeniusClient.searchSong(song, "rap", processRapGeniusResults);
};

var listOfSearches = [];
//listOfSearches.push({rapper:"/biggie", song:"Juicy"});
//listOfSearches.push({rapper:"/krsone", song:"Sound of da Police"});
//listOfSearches.push({rapper:"/drake", song:"Know Yourself"});
// listOfSearches.push({rapper:"/kanye", song:"No Church in the Wild"});
// listOfSearches.push({rapper:"/kendrick", song:"King Kunta"});
// listOfSearches.push({rapper:"/lilwayne", song:"A Milli"});
// listOfSearches.push({rapper:"/missyelliot", song:"The Rain (Supa Dupa Fly)"});
// listOfSearches.push({rapper:"/nas", song:"I Can"});
listOfSearches.push({rapper:"/nicki", song:"Feeling Myself"});
listOfSearches.push({rapper:"/publicenemy", song:"Fight The Power"});
listOfSearches.push({rapper:"/queenlatifah", song:"U.N.I.T.Y."});
listOfSearches.push({rapper:"/rakim", song:"I Know You Got Soul"});
listOfSearches.push({rapper:"/jayz", song:"Public Service Announcement"});

var doNextSearch = function() {
    var file = 'data.json'
    var obj = {data: allData}
    jf.writeFile(file, obj, function(err) {
      console.log(err)
    }) 
 
   if (currentSearch < listOfSearches.length) {
     currentRapper = listOfSearches[currentSearch].rapper;
     currentSong = listOfSearches[currentSearch].song;
     searchRapGenius(currentSong);
   }
};

var dataLoaded = function(myData){
  var lookup = {};
  myData.data.forEach(function (el, i, arr) {
      lookup[el.rapper] = el.data;
  });
};

var loadData = function() {
  var file = 'data.json'
  jf.readFile(file, function(err, obj) {
    dataLoaded(obj);
  });
};


//loadData();

currentSearch = 0;
doNextSearch();
