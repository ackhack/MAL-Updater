var animeName;
var episodeNumber;
var animeID;
var video;

if (window.location.toString().includes(".kickassanime."))
    init();

function init() {
    if (parseURL(window.location.toString()))
        getAnime();
}

function getAnime() {
    chrome.runtime.sendMessage(
        {
            type: "GET_ANIME",
            site: "kickassanime",
            name: animeName
        },
        data => recieveAnime(data)
    );
}

function finishedEpisode() {
    chrome.runtime.sendMessage(
        {
            type: "SEND_ANIME_FINISHED",
            id: animeID,
            episode: episodeNumber
        },
        data => {
            if (data.num_episodes_watched == episodeNumber) {
                alert("Successfully updated EpisodeNumber");
            } else {
                alert("An Error occured while updating the EpisodeNumber");
            }
        }
    );
}

function updateStatus(con, user = "") {
    if (user != "") {
        alert("TO USER: " + user);
    }
    console.log("MAL Updater: " + con);
}

function parseURL(url) {
    //https://www2.kickassanime.rs/anime/world-witches-hasshin-shimasu-162140/episode-03-550318
    //Get name and episode from URL
    let urlPattern = "https?:\\/\\/.*kickassanime.*\\/anime\\/(.*)-\\d+\\/episode-0*(\\d+)-\\d+";

    let res = url.match(urlPattern);

    if (!res) {
        updateStatus("No RegEx match");
        return false;
    } else {
        animeName = res[1];
        episodeNumber = res[2];
        return true;
    }
}

function recieveAnime(res) {

    //If id was recieved from cache, dont create Elements
    if (res.cache) {
        animeID = res.cache;
        waitPageloadCache();
        return;
    }
    //Create the HTML ELements needed for User Interaction
    let ul = document.createElement("ul");

    if (res.data == undefined) {
        updateStatus("Did not get a expected Result");
        updateStatus(res);
        getAnime();
        return;
    }

    for (let elem of res.data) {
        let li = document.createElement("li");
        li.style = "cursor: pointer;";
        li.value = elem.node.id;
        li.innerText = elem.node.title;
        li.onclick = () => clickedLi(li);
        ul.appendChild(li);
    }

    //Main Div for Anime List
    let div = document.createElement("div");
    div.id = "MAL_UPDATER_DIV_1"
    div.style = "position: absolute;left: 50%;top: 50%;background-color: rgb(33, 33, 33);border: 3px solid rgb(231, 219, 163);padding: 1em 1em 1em 0;z-index: 300000;transform: translate(-50%, -50%);";

    let paragrah = document.createElement("p");
    paragrah.style = "padding-left: 2em;font-size: larger;";
    paragrah.innerText = "Which Anime is this?"

    let textbox = document.createElement("input");
    textbox.id = "MAL_UPDATER_INPUT_1";
    textbox.type = "text";
    textbox.placeholder = "If not in List, enter MAL ID here";
    textbox.style = "width: -webkit-fill-available;margin-left: 1.5em;";

    //Div with the two Buttons
    let divButton = document.createElement("div");
    divButton.style = "padding-left: 1.5em;padding-top: 5px;";

    let abortBtn = document.createElement("button");
    abortBtn.onclick = () => { document.getElementById("MAL_UPDATER_DIV_1").style += "visibility: hidden;"; };
    abortBtn.innerText = "Abort";

    let tbBtn = document.createElement("button");
    tbBtn.onclick = () => {
        animeID = document.getElementById("MAL_UPDATER_INPUT_1").value;
        if (animeID != null && animeID != undefined && animeID != "") {
            alert("Inserted UserInput, cant guarantee it works");
            afterAnimeID();
            document.getElementById("MAL_UPDATER_DIV_1").style += "visibility: hidden;";            
        }
    };
    tbBtn.innerText = "Check ID";

    divButton.appendChild(tbBtn);
    divButton.appendChild(abortBtn);

    div.appendChild(paragrah);
    div.appendChild(ul);
    div.appendChild(textbox);
    div.appendChild(divButton);
    document.getElementsByTagName("body")[0].appendChild(div)
}

function clickedLi(li) {
    //Save Anime to Cache, insert the Finished button and hide the Div
    animeID = li.value;
    chrome.runtime.sendMessage(
        {
            type: "CACHE_ANIME",
            site: "kickassanime",
            name: animeName,
            id: animeID
        },
        () => { }
    );
    afterAnimeID();
    document.getElementById("MAL_UPDATER_DIV_1").style += "visibility: hidden;";
}

function waitPageloadCache(nTry = 0) {
    //Have to wait for Site to load so btnFinished can be placed
    if (nTry == 10) {
        alert("MAL Updater couldnt place the Button, stopping the extension for now");
    }
    nTry++;
    if (document.getElementById("main-nav") == null)
        setTimeout(() => { waitPageloadCache(nTry) }, 1000);
    else
        afterAnimeID();
}

function afterAnimeID() {
    insertButton();
    //startVideoObserver();
}

function insertButton() {
    let btnFinish = document.createElement("button");
    btnFinish.id = "MAL_UPDATER_BUTTON_1";
    btnFinish.style = "width: 20em;height: 3em;background-color: #212121;border: 3px solid #e7dba3;color: #e7dba3;";
    btnFinish.textContent = "Finished Episode";
    btnFinish.onclick = () => { finishedEpisode(); };
    let navbar = document.getElementById("main-nav");
    navbar.insertBefore(btnFinish, navbar.children[1]);
}

//Not working until i can get access to iframe
// function startVideoObserver() {
//     let vid = document.getElementsByTagName("video");
//     if (vid == null || vid.length == 0) {
//         setTimeout(() => {
//             console.log("SEARCHING");
//             startVideoObserver();
//         }, 1000);
//     } else {
//         video = vid[0];
//         console.log("ADD EVENTS");
//         //Add important events
//         video.onseeked = videoUpdated;
//         video.ondurationchange = videoUpdated;
//         video.onplaying = videoUpdated;
//         video.onratechange = videoUpdated;
//         video.ontimeupdate = videoUpdated;
//     }
// }

// function videoUpdated() {
//     console.log("EVENT TRIGGERED");
//     checkVideoFinshed();

//     let time = ((video.duration-video.currentTime)/video.playbackRate)+2000;

//     setTimeout(() => {
//         checkVideoFinshed();
//     },time);
// }

// function checkVideoFinshed() {
//     console.log("CHECKING FINISHED");
//     if (video.currentTime > video.duration * 0.9) {
//         console.log("ACTUALLY FINISHED");
//         autoFinishEpiosode();
//     }
// }

// function autoFinishEpiosode() {
//     chrome.runtime.sendMessage(
//         {
//             type: "SEND_ANIME_FINISHED",
//             id: animeID,
//             episode: episodeNumber
//         },
//         data => {
//             document.getElementById("MAL_UPDATER_BUTTON_1").innerText =
//                 data.num_episodes_watched == episodeNumber ? "AutoFinished: EP " + episodeNumber : "AutoFinished failed,Press for manual";
//         }
//     );
// }