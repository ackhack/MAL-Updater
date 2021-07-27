var animeName;
var episodeNumber;
var animeID;
var metaData;
var site;
var finished = false;
var activeAPICalls = new Set();

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
    if (nTry > 9)
        return;
    nTry++;

    if (parseURL(window.location.toString())) {
        getAnime();
    }
    else
        setTimeout(() => {
            initSite(nTry);
        }, 1000);
}

function parseURL(url) {
    //Get name and episode from URL
    if (site === undefined)
        return false;

    let res = url.match(site.urlPattern);

    if (!res) {
        return false;
    } else {
        animeName = res[site.nameMatch];
        episodeNumber = res[site.episodeMatch] ?? 1;
        return true;
    }
}

function getAnime() {
    apiCallSent("GET_ANIME");
    chrome.runtime.sendMessage(
        {
            type: "GET_ANIME",
            site: site.siteName,
            name: animeName,
            episode: episodeNumber
        },
        data => {
            apiCallRecieved("GET_ANIME");
            recieveAnime(data);
        }
    );
}

function recieveAnime(res) {

    //Error handeling
    if (res.error) {
        updateStatus("Did not get a expected Result from BGScript");
        updateStatus(res.error);
        return;
    }

    //Dont do anything if inactive
    if (res.inactive) {
        return;
    }

    if (res.lastWatched != undefined) {
        if (!res.lastWatched) {
            let bingeBtn = document.createElement("button");
            bingeBtn.onclick = () => { bingeWatching(); bingeBtn.parentElement.remove() }
            bingeBtn.innerText = "Binge Watching";
            bingeBtn.style = "margin-left: 1.5em;margin-top: 5px;";
            showInfo("This is not the next Episode!", "Your last watched Episode is EP" + res.lastEpisode, [bingeBtn]);
        }
    }

    //If id was recieved from cache, dont create Elements
    if (res.cache) {
        animeID = res.meta.id;
        metaData = res.meta;
        waitPageloadCache();
        return;
    }

    //Create the HTML ELements needed for User 

    let mainList = createMainList(res);

    //Main Div for Anime List
    let div = document.createElement("div");
    div.id = "MAL_UPDATER_DIV_1";
    div.style = "position: absolute;left: 50%;top: 50%;background-color:" + site.bgColor + ";border: 3px solid " + site.pageColor + ";padding: 1em 1em 1em 1em;z-index: 300000;transform: translate(-50%, -50%);";

    let paragrah = document.createElement("p");
    paragrah.style = "padding-left: 1.5em;font-size: xx-large;";
    paragrah.innerText = "Which Anime is this?";

    let textbox = document.createElement("input");
    textbox.id = "MAL_UPDATER_INPUT_1";
    textbox.type = "text";
    textbox.placeholder = "If not in List, enter MAL ID here";
    textbox.style = "width: -webkit-fill-available;margin-left: 1.5em;margin-top:1.5em;";

    //Div with the two Buttons
    let divButton = document.createElement("div");
    divButton.style = "padding-left: 1.5em;padding-top: 5px;";

    let abortBtn = document.createElement("button");
    abortBtn.onclick = () => { document.getElementById("MAL_UPDATER_DIV_1").remove() };
    abortBtn.innerText = "Abort";

    let tbBtn = document.createElement("button");
    tbBtn.onclick = () => {
        let id = parseInt(document.getElementById("MAL_UPDATER_INPUT_1").value);

        if (id !== undefined && id !== NaN) {
            displayUserInputtedAnime(id);
        } else {
            alert("Could not parse Number, please retry");
        }
    };
    tbBtn.innerText = "Check ID";

    divButton.appendChild(tbBtn);
    divButton.appendChild(abortBtn);

    div.appendChild(paragrah);
    div.appendChild(mainList);
    div.appendChild(textbox);
    div.appendChild(divButton);
    document.getElementsByTagName("body")[0].appendChild(div);
}

function clickedAnimeOption(li) {
    //Save Anime to Cache, insert the Finished button and hide the Div
    animeID = li.value;
    afterAnimeID();
    document.getElementById("MAL_UPDATER_DIV_1").remove();
}

function waitPageloadCache(nTry = 0) {
    //Have to wait for Site to load so btnFinished can be placed
    if (nTry > 9) {
        alert("MAL Updater couldnt place the Button, stopping the extension for now");
    }
    nTry++;
    if (getButtonParent() == null)
        setTimeout(() => { waitPageloadCache(nTry) }, 1000);
    else
        afterAnimeID(false);
}

function createMainList(res) {
    //Returns the List displaying the Animes to pick from
    if (res.displayMode === false) {
        let ul = document.createElement("ul");
        ul.id = "MAL_UPDATER_LIST_1";
        ul.style = "margin-left:" + site.ulMarginLeft + "em;";

        for (let elem of res.data) {
            let li = document.createElement("li");
            li.style = "cursor: pointer;";
            li.value = elem.node.id;
            li.innerText = elem.node.title;
            li.onclick = () => clickedAnimeOption(li);
            ul.appendChild(li);
        }
        return ul;
    } else {
        let table = document.createElement("table");
        table.id = "MAL_UPDATER_LIST_1";
        table.style = "margin-left:" + site.ulMarginLeft + "em;";

        let counter = 0;
        let currTr = document.createElement("tr");

        for (let elem of res.data) {
            if (counter % 5 == 0 && counter != 0) {
                table.appendChild(currTr);
                currTr = document.createElement("tr");
            }
            let td = document.createElement("td");

            let para = document.createElement("p");
            if (elem.node.alternative_titles?.en)
                para.innerText = elem.node.alternative_titles.en;
            else
                para.innerText = elem.node.title;

            let img = document.createElement("img");
            img.src = elem.node.main_picture?.medium;
            img.alt = elem.node.title;
            img.style = "width:100%;max-width:200px";

            let li = document.createElement("li");
            li.style = "visibility: hidden;";
            li.value = elem.node.id;

            td.style = "cursor: pointer;border: 3px solid " + site.pageColor + "!important;padding:7px;margin:3px";
            td.onclick = () => clickedAnimeOption(li);
            td.appendChild(para);
            td.appendChild(img);
            td.appendChild(li);

            currTr.appendChild(td);
            counter++;
        }

        table.appendChild(currTr);
        return table;
    }
}

function afterAnimeID(cache = true) {
    if (cache) {
        chrome.runtime.sendMessage(
            {
                type: "CACHE_ANIME",
                site: site.siteName,
                name: animeName,
                id: animeID
            },
            (res) => {
                metaData = res.meta;
                sendDiscordPresence(true);
                insertButton();
            }
        )
    } else {
        sendDiscordPresence(true);
        insertButton();
    }
}

function insertButton() {
    let btnFinish = document.createElement("button");
    btnFinish.id = "MAL_UPDATER_BUTTON_1";
    btnFinish.style = "width: 20em;height: 3em;background-color: " + site.bgColor + ";border: 3px solid " + site.pageColor + ";color: white;";
    btnFinish.textContent = "Finished Episode";
    btnFinish.title = animeID;
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
        apiCallSent("SEND_ANIME_FINISHED");
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
                apiCallRecieved("SEND_ANIME_FINISHED");
                sendWatchedInfo();
                if (data.last) {
                    finishedLastEpisode(data);
                } else {
                    updateEpisodeSuccess(data.num_episodes_watched == episodeNumber, nextURL);
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
    paragrah.style = "padding-left: 2em;font-size: x-large;";
    paragrah.innerText = "Rate Anime";

    let select = document.createElement("select");
    select.style = "margin-left:2em;";

    for (let i = 0; i < 10; i++) {
        let opt = document.createElement("option");
        opt.value = i + 1;
        opt.innerText = i + 1;
        select.appendChild(opt);
    }

    let commitBtn = document.createElement("button");
    commitBtn.onclick = () => { clickedLastEp(select.value); document.getElementById("MAL_UPDATER_DIV_2").remove(); };
    commitBtn.innerText = "Rate";
    commitBtn.style = "margin-left: 1.5em;margin-top: 5px;";

    let abortBtn = document.createElement("button");
    abortBtn.onclick = () => { document.getElementById("MAL_UPDATER_DIV_2").remove(); finishedEpisode(true); };
    abortBtn.innerText = "Not Last Episode";
    abortBtn.style = "margin-left: 1.5em;margin-top: 5px;";

    let pSequel = document.createElement("p");
    pSequel.innerText = data.next ? "Sequel: " + data.next : "No Sequel found";
    pSequel.style = "margin-left: 1.5em;margin-top: 1em;";

    div.appendChild(paragrah);
    div.appendChild(select);
    div.appendChild(commitBtn);
    div.appendChild(pSequel);
    div.appendChild(abortBtn);
    document.getElementsByTagName("body")[0].appendChild(div);
}

function clickedLastEp(value) {
    apiCallSent("SEND_ANIME_FINISHED");
    chrome.runtime.sendMessage(
        {
            type: "SEND_ANIME_FINISHED",
            id: animeID,
            episode: episodeNumber,
            rating: value,
            url: window.location.toString()
        },
        data => {
            apiCallRecieved("SEND_ANIME_FINISHED");
            updateEpisodeSuccess(data.num_episodes_watched == episodeNumber);
            document.getElementById("MAL_UPDATER_DIV_2")?.remove();
        }
    );
}

function updateEpisodeSuccess(success, nextURL) {

    if (success)
        document.getElementById("MAL_UPDATER_BUTTON_1").remove();

    let borderColor = success ? "rgb(0,220,0)" : "rgb(255,0,0)";

    let div = document.createElement("div");
    div.id = "MAL_UPDATER_DIV_3";
    div.style = "position: absolute;left: 50%;top: 50%;background-color:" + site.bgColor + ";border: 3px solid " + borderColor + ";padding: 1em 1em 1em 0;z-index: 300000;transform: translate(-50%, -50%);";

    let p = document.createElement("p");
    p.style = "margin-left:1.5em;margin-bottom:5px;";
    p.innerText = (success ? "✅Successfully updated EpisodeNumber✅" : "❌An Error occured while updating the EpisodeNumber❌") + "\n" + getAnimeName() + ": Episode " + episodeNumber;

    let abortBtn = document.createElement("button");
    abortBtn.onclick = () => { document.getElementById("MAL_UPDATER_DIV_3").remove() };
    abortBtn.innerText = "OK";
    abortBtn.style = "margin-left: 1.5em;margin-top: 5px;";

    div.appendChild(p);
    div.appendChild(abortBtn);

    if (nextURL && success) {
        let nextBtn = document.createElement("button");
        nextBtn.onclick = () => { window.open(nextURL, "_self") };
        nextBtn.innerText = "Next EP";
        nextBtn.style = "margin-left: 1.5em;margin-top: 5px;";
        div.appendChild(nextBtn);
    }

    document.getElementsByTagName("body")[0].appendChild(div);
}

function bingeWatching() {
    chrome.runtime.sendMessage({
        type: "BINGE_WATCHING",
        id: animeID
    });
}

//#endregion

//#region Discord

function sendDiscordPresence(active) {
    if (animeName != undefined && episodeNumber != undefined && metaData != undefined) {
        chrome.runtime.sendMessage(
            {
                type: "DISCORD_PRESENCE",
                active: active,
                name: getAnimeName(),
                episode: episodeNumber,
                maxEpisode: metaData.num_episodes
            }
        );
    }
}

//Shows Discord Presence when window gets focus
window.onfocus = (ev) => {
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
function showInfo(header, text, buttons = []) {
    let div = document.createElement("div");
    div.style = "position: absolute;left: 50%;top: 50%;background-color:" + site.bgColor + ";border: 3px solid " + site.pageColor + ";padding: 1em 1em 1em 0;z-index: 300000;transform: translate(-50%, -50%);";

    let pHeader = document.createElement("p");
    pHeader.style = "padding-left: 1.5em;font-size: larger;";
    pHeader.innerText = header;

    let pText = document.createElement("p");
    pText.style = "padding-left: 2em;";
    pText.innerText = text;

    let abortBtn = document.createElement("button");
    abortBtn.onclick = () => { div.remove(); };
    abortBtn.innerText = "OK";
    abortBtn.style = "margin-left: 1.5em;margin-top: 5px;";

    div.appendChild(pHeader);
    div.appendChild(pText);
    div.appendChild(abortBtn);
    for (let btn of buttons) {
        div.appendChild(btn);
    }
    document.getElementsByTagName("body")[0].appendChild(div);
}


function updateStatus(text) {
    console.log(text);
}

function apiCallSent(name) {
    activeAPICalls.add(name);
    setTimeout(() => {
        if (activeAPICalls.has(name)) {
            showDelayMessage();
        }
    }, 5_000);
}

function apiCallRecieved(name) {
    if (activeAPICalls.has(name)) {
        activeAPICalls.delete(name);
        removeDelayMessage();
    }
}

function showDelayMessage() {
    if (document.getElementById("MAL_UPDATER_BUTTON_2") === null) {
        showInfo("MAL", "The MAL API appears to be quiet slow at the moment");
    }
}

function removeDelayMessage() {
    document.getElementById("MAL_UPDATER_BUTTON_2")?.parentElement.remove();
}

function getAnimeName() {
    if (metaData.alternative_titles) {
        if (metaData.alternative_titles.en) {
            return metaData.alternative_titles.en;
        }
    }
    return metaData.title ?? animeName.replace(/^(.)|-(.)/g, (_, g1, g2) => { return g1 ? " " + g1.toLocaleUpperCase() : g2 ? " " + g2.toLocaleUpperCase() : "Unknown" }).slice(1);
}

function sendWatchedInfo() {
    if (animeName != undefined && episodeNumber != undefined && metaData != undefined) {
        sendDiscordPresence(false);
        chrome.runtime.sendMessage(
            {
                type: "ANIME_WATCHED_INFO",
                name: getAnimeName(),
                episode: episodeNumber,
                maxEpisode: metaData.num_episodes
            }
        );
    }
}

function displayUserInputtedAnime(id) {
    let ul = document.getElementById("MAL_UPDATER_LIST_1");
    if (!ul) {
        return;
    }
    chrome.runtime.sendMessage(
        {
            type: "GET_ANIME_BY_ID",
            id: id
        },
        res => {
            ul.id = "";
            ul.parentElement.replaceChild(createMainList({data: [{node: res}]}),ul);
        }
    );
}