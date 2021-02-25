var animeName;
var episodeNumber;
var animeID;
var site;
var finished = false;

//#region Init

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
            initSite(nTry);
        }, 1000);
}

function parseURL(url) {
    //Get name and episode from URL
    if (site == undefined)
        return false;

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
            name: animeName,
            episode: episodeNumber
        },
        data => recieveAnime(data)
    );
}

function recieveAnime(res) {

    //Error handeling
    if (res.error) {
        updateStatus("Did not get a expected Result");
        updateStatus(res.error);
        return;
    }

    //Dont do anything if inactive
    if (res.inactive) {
        return;
    }

    if (res.lastWatched != undefined) {
        if (!res.lastWatched) {
            showInfo("This is not the next Episode!","Your last watched Episode is EP" + res.lastEpisode);
        }
    }

    //If id was recieved from cache, dont create Elements
    if (res.cache) {
        animeID = res.cache;
        waitPageloadCache();
        return;
    }

    //Create the HTML ELements needed for User Interaction
    let ul = document.createElement("ul");
    ul.style = "margin-left:" + site.ulMarginLeft + "em;";

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
    div.id = "MAL_UPDATER_DIV_1";
    div.style = "position: absolute;left: 50%;top: 50%;background-color:" + site.bgColor + ";border: 3px solid " + site.pageColor + ";padding: 1em 1em 1em 0;z-index: 300000;transform: translate(-50%, -50%);";

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
    abortBtn.onclick = () => { document.getElementById("MAL_UPDATER_DIV_1").remove() };
    abortBtn.innerText = "Abort";

    let tbBtn = document.createElement("button");
    tbBtn.onclick = () => {
        animeID = document.getElementById("MAL_UPDATER_INPUT_1").value;
        if (animeID != null && animeID != undefined && animeID != "") {
            alert("Inserted UserInput, cant guarantee it works");
            afterAnimeID();
            document.getElementById("MAL_UPDATER_DIV_1").remove();
        }
    };
    tbBtn.innerText = "Check ID";

    divButton.appendChild(tbBtn);
    divButton.appendChild(abortBtn);

    div.appendChild(paragrah);
    div.appendChild(ul);
    div.appendChild(textbox);
    div.appendChild(divButton);
    document.getElementsByTagName("body")[0].appendChild(div);
}

function clickedLi(li) {
    //Save Anime to Cache, insert the Finished button and hide the Div
    animeID = li.value;
    afterAnimeID();
    document.getElementById("MAL_UPDATER_DIV_1").remove();
}

function waitPageloadCache(nTry = 0) {
    //Have to wait for Site to load so btnFinished can be placed
    if (nTry == 10) {
        alert("MAL Updater couldnt place the Button, stopping the extension for now");
    }
    nTry++;
    if (getButtonParent() == null)
        setTimeout(() => { waitPageloadCache(nTry) }, 1000);
    else
        afterAnimeID(false);
}


function afterAnimeID(cache = true) {
    if (cache)
        chrome.runtime.sendMessage(
            {
                type: "CACHE_ANIME",
                site: site.siteName,
                name: animeName,
                id: animeID
            },
            () => { }
        )
    sendDiscordPresence(true);
    insertButton();
}

function insertButton() {
    let btnFinish = document.createElement("button");
    btnFinish.id = "MAL_UPDATER_BUTTON_1";
    btnFinish.style = "width: 20em;height: 3em;background-color: " + site.bgColor + ";border: 3px solid " + site.pageColor + ";color: white;";
    btnFinish.textContent = "Finished Episode";
    btnFinish.onclick = () => { finishedEpisode(); };
    let navbar = getButtonParent();
    for (let i = 0; i < site.parentIndex; i++) {
        navbar = navbar.parentElement;
    }
    if (site.buttonInsertBeforeIndex != -1) {
        navbar.insertBefore(btnFinish, navbar.children[site.buttonInsertBeforeIndex]);
    } else {
        navbar.appendChild(btnFinish);
    }
}

function getButtonParent() {
    switch (site.buttonParentType) {
        case "id":
            return document.getElementById(site.buttonParent);
        case "class":
            return document.getElementsByClassName(site.buttonParent)[0];
        default:
            return null;
    }
}

//#endregion

//#region End Episode

function finishedEpisode(force = false) {
    finished = true;

    new Function("callb", site.nextBookmark)(nextURL => {
        chrome.runtime.sendMessage(
            {
                type: "SEND_ANIME_FINISHED",
                id: animeID,
                episode: episodeNumber,
                nextURL: nextURL,
                url: window.location.toString(),
                force: force
            },
            data => {
                sendDiscordPresence(false);
                if (data.last) {
                    finishedLastEpisode(data);
                } else {
                    updateEpisodeSuccess(data.num_episodes_watched == episodeNumber,nextURL);
                }
            }
        );
    });
}

function finishedLastEpisode(data) {
    let div = document.createElement("div");
    div.id = "MAL_UPDATER_DIV_2";
    div.style = "position: absolute;left: 50%;top: 50%;background-color:" + site.bgColor + ";border: 3px solid " + site.pageColor + ";padding: 1em 1em 1em 0;z-index: 300000;transform: translate(-50%, -50%);";

    let paragrah = document.createElement("p");
    paragrah.style = "padding-left: 2em;font-size: larger;";
    paragrah.innerText = "Rate Anime";

    let ul = document.createElement("ul");
    ul.style = "margin-left:" + site.ulMarginLeft + "em;";

    for (let i = 0; i < 10; i++) {
        let li = document.createElement("li");
        li.style = "cursor: pointer;";
        li.value = i + 1;
        li.innerText = i + 1;
        li.onclick = () => clickedLastEpLi(li);
        ul.appendChild(li);
    }

    let abortBtn = document.createElement("button");
    abortBtn.onclick = () => { document.getElementById("MAL_UPDATER_DIV_2").remove(); finishedEpisode(true); };
    abortBtn.innerText = "Not Last Episode";
    abortBtn.style = "margin-left: 1.5em;margin-top: 5px;";

    let pSequel = document.createElement("p");
    pSequel.innerText = data.next ? "Sequel: " + data.next : "No Sequel found";
    pSequel.style = "margin-left: 1.5em;";

    div.appendChild(paragrah);
    div.appendChild(ul);
    div.appendChild(pSequel);
    div.appendChild(abortBtn);
    document.getElementsByTagName("body")[0].appendChild(div);
}

function clickedLastEpLi(li) {
    chrome.runtime.sendMessage(
        {
            type: "SEND_ANIME_FINISHED",
            id: animeID,
            episode: episodeNumber,
            rating: li.value
        },
        data => {
            updateEpisodeSuccess(data.num_episodes_watched == episodeNumber);
            document.getElementById("MAL_UPDATER_DIV_2").remove();
        }
    );
}

function updateEpisodeSuccess(success,nextURL) {

    if (success)
        document.getElementById("MAL_UPDATER_BUTTON_1").remove();

    let div = document.createElement("div");
    div.id = "MAL_UPDATER_DIV_3";
    div.style = "position: absolute;left: 50%;top: 50%;background-color:" + site.bgColor + ";border: 3px solid " + site.pageColor + ";padding: 1em 1em 1em 0;z-index: 300000;transform: translate(-50%, -50%);";

    let p = document.createElement("p");
    p.style = "margin-left:1.5em";
    p.innerText = success ? "Successfully updated EpisodeNumber" : "An Error occured while updating the EpisodeNumber";

    let abortBtn = document.createElement("button");
    abortBtn.onclick = () => { document.getElementById("MAL_UPDATER_DIV_3").remove() };
    abortBtn.innerText = "OK";
    abortBtn.style = "margin-left: 1.5em;margin-top: 5px;";

    div.appendChild(p);
    div.appendChild(abortBtn);

    if (nextURL && success) {
        let nextBtn = document.createElement("button");
        nextBtn.onclick = () => {window.open(nextURL,"_self")};
        nextBtn.innerText = "Next EP";
        nextBtn.style = "margin-left: 1.5em;margin-top: 5px;";
        div.appendChild(nextBtn);
    }
    
    document.getElementsByTagName("body")[0].appendChild(div);
}

//#endregion

//#region Discord

function sendDiscordPresence(active) {
    if (animeName != undefined && episodeNumber != undefined) {
        chrome.runtime.sendMessage(
            {
                type: "DISCORD_PRESENCE",
                active: active,
                name: animeName.replace(/^(.)|-(.)/g, (_, g1, g2) => { return g1 ? " " + g1.toLocaleUpperCase() : g2 ? " " + g2.toLocaleUpperCase() : "Unknown" }).slice(1),
                episode: episodeNumber
            }
        );
    }
}

//Shows Discord Presence when window gets focus
window.onfocus = () => {
    if (animeName != undefined && episodeNumber != undefined && !finished)
        sendDiscordPresence(true);
}

//Removes Discord Presence when window closes
window.onbeforeunload = () => {
    if (animeName != undefined && episodeNumber != undefined && !finished)
        sendDiscordPresence(false);
}

//#endregion

//Updates Info if URL changes
let oldHref = document.location.href;
window.onload = function () {
    let bodyList = document.querySelector("body");
    let observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (_) {
            if (oldHref != document.location.href) {
                oldHref = document.location.href;
                parseURL(window.location.toString());
            }
        });
    });
    const config = {
        childList: true,
        subtree: true
    };
    observer.observe(bodyList, config);
};

//Shows Infotext in middle of Screen as Div
function showInfo(header,text) {
    let div = document.createElement("div");
    div.style = "position: absolute;left: 50%;top: 50%;background-color:" + site.bgColor + ";border: 3px solid " + site.pageColor + ";padding: 1em 1em 1em 0;z-index: 300000;transform: translate(-50%, -50%);";

    let pHeader = document.createElement("p");
    pHeader.style = "padding-left: 1.5em;font-size: larger;";
    pHeader.innerText = header;

    let pText = document.createElement("p");
    pText.style = "padding-left: 2em;";
    pText.innerText = text;

    let abortBtn = document.createElement("button");
    abortBtn.onclick = () => { div.remove()};
    abortBtn.innerText = "OK";
    abortBtn.style = "margin-left: 1.5em;margin-top: 5px;";

    div.appendChild(pHeader);
    div.appendChild(pText);
    div.appendChild(abortBtn);
    document.getElementsByTagName("body")[0].appendChild(div);
}