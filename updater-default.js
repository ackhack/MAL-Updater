var animeName;
var episodeNumber;
var animeID;
var site;

chrome.runtime.sendMessage(
    {
        type: "VALIDATE_SITE",
        url: window.location.toString()
    },
    data => {
        if (data) {
            site = data;
            initSite();
        }
    }
);

function initSite(nTry = 0) {

    //Retrying because URL can change without Postback
    if (nTry == 10)
        return;
    nTry++;

    if (parseURL(window.location.toString()))
        getAnime();
    else
        setTimeout(() => {
            init(nTry);
        }, 1000);
}

function parseURL(url) {
    //Get name and episode from URL

    let res = url.match(site.urlPattern);

    if (!res) {
        updateStatus("No RegEx match", "No Anime found in URL");
        return false;
    } else {
        animeName = res[site.nameMatch];
        episodeNumber = res[site.episodeMatch] ?? 1;
        return true;
    }
}

function getAnime() {
    chrome.runtime.sendMessage(
        {
            type: "GET_ANIME",
            site: site.siteName,
            name: animeName
        },
        data => recieveAnime(data)
    );
}

function finishedEpisode() {
    //Reparsing the URL because it can change without Postback
    parseURL(window.location.toString());
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

function recieveAnime(res) {

    //Error handeling
    if (res.error) {
        updateStatus("Did not get a expected Result");
        updateStatus(res.error);
        return;
    }

    //If id was recieved from cache, dont create Elements
    if (res.cache) {
        animeID = res.cache;
        waitPageloadCache();
        return;
    }

    //Create the HTML ELements needed for User Interaction
    let ul = document.createElement("ul");

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
    div.style = "position: absolute;left: 50%;top: 50%;background-color:" + site.bgColor + ";border: 3px solid" + site.pageColor + ";padding: 1em 1em 1em 0;z-index: 300000;transform: translate(-50%, -50%);";

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
            site: site.siteName,
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
    if (document.getElementById(site.buttonParent) == null)
        setTimeout(() => { waitPageloadCache(nTry) }, 1000);
    else
        afterAnimeID();
}

function afterAnimeID() {
    insertButton();
}

function insertButton() {
    let btnFinish = document.createElement("button");
    btnFinish.id = "MAL_UPDATER_BUTTON_1";
    btnFinish.style = "width: 20em;height: 3em;background-color: " + site.bgColor + ";border: 3px solid " + site.pageColor + ";color: white;";
    btnFinish.textContent = "Finished Episode";
    btnFinish.onclick = () => { finishedEpisode(); };
    let navbar = document.getElementById(site.buttonParent);
    for (let i = 0; i < site.parentIndex; i++) {
        navbar = navbar.parentElement;
    }
    if (site.buttonInsertBeforeIndex != -1) {
        navbar.insertBefore(btnFinish, navbar.children[site.buttonInsertBeforeIndex]);
    } else {
        navbar.appendChild(btnFinish);
    }
}