var animeName;
var episodeNumber;
var client;

init();

function init() {

    if (!readClient()) {
        return;
    } else {

    }

    parseURL(window.location.toString());
    updateStatus(animeName);
    updateStatus(episodeNumber);
    sendAPICall(animeName);
}

function readClient() {
    chrome.runtime.sendMessage(
        {
            type: "GET_AUTH"
        },
        data => recieveAPICall(data)
  ); 
}


function parseURL(url) {
    //https://www2.kickassanime.rs/anime/world-witches-hasshin-shimasu-162140/episode-03-550318
    let urlPattern = "https?:\\/\\/.*kickassanime.*\\/anime\\/(.*)-\\d+\\/episode-0*(\\d+)-\\d+";

    let res = url.match(urlPattern);

    if (!res) {
        updateStatus("No RegEx match", true, "No Anime found in URL");
    } else {
        animeName = res[1];
        episodeNumber = res[2]//.replace("-"," ");
    }
}

function sendAPICall(para) {

    if (client == undefined) {
        setTimeout(() =>{sendAPICall(para)},500);
        return;
    }

    chrome.runtime.sendMessage(
        {
            type: "GET_ANIME",
            name: para,
            client: client
        },
        data => recieveAPICall(data)
  ); 
}

function recieveAPICall(data) {
    updateStatus(data);
}

function updateStatus(con, user = "") {
    if (user != "") {
        con.log("TO USER: " + user);
    }
    console.log("MAL Updater: " + con);
}