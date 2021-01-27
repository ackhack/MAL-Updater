var animeName;
var episodeNumber;
var animeID;
var animeCache = {};

init();

function init() {
    parseURL(window.location.toString());
    getAnime(animeName);
}

function getAnime(name) {
    if (animeCache[name]) {
        animeID = animeCache[name];
        console.log("Found ID in cache: " + animeID);
        insertButton();
    }
    chrome.runtime.sendMessage(
        {
            type: "GET_ANIME",
            name: name
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
        con.log("TO USER: " + user);
    }
    console.log("MAL Updater: " + con);
}

function parseURL(url) {
    //https://www2.kickassanime.rs/anime/world-witches-hasshin-shimasu-162140/episode-03-550318
    let urlPattern = "https?:\\/\\/.*kickassanime.*\\/anime\\/(.*)-\\d+\\/episode-0*(\\d+)-\\d+";

    let res = url.match(urlPattern);

    if (!res) {
        updateStatus("No RegEx match", true, "No Anime found in URL");
    } else {
        animeName = res[1];
        episodeNumber = res[2];
    }
}

function recieveAnime(list) {
    let ul = document.createElement("ul");
    //Find exact Match
    for (let elem of list.data) {
        let li = document.createElement("li");
        li.style = "cursor: pointer;";
        li.value = elem.node.id;
        li.innerText = elem.node.title;
        li.onclick = () => clickedLi(li);
        ul.appendChild(li);
    }

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

    let divButton = document.createElement("div");
    divButton.style = "padding-left: 1.5em;padding-top: 5px;";

    let abortBtn = document.createElement("button");
    abortBtn.onclick = () => { document.getElementById("MAL_UPDATER_DIV_1").style += "visibility: hidden;"; };
    abortBtn.innerText = "Abort";

    let tbBtn = document.createElement("button");
    tbBtn.onclick = () => {
        animeID = document.getElementById("MAL_UPDATER_INPUT_1").innerText;
        alert("Inserted UserInput, cant guarantee it works");
        insertButton();
        document.getElementById("MAL_UPDATER_DIV_1").style += "visibility: hidden;";
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
    animeCache[animeName] = li.value;
    animeID = li.value;
    insertButton();
    document.getElementById("MAL_UPDATER_DIV_1").style += "visibility: hidden;";
}

function insertButton() {
    let btnFinish = document.createElement("button");
    btnFinish.style = "width: 20em;height: 3em;background-color: #212121;border: 3px solid #e7dba3;color: #e7dba3;";
    btnFinish.textContent = "Finished Episode";
    btnFinish.onclick = () => { finishedEpisode(); };
    let navbar = document.getElementById("main-nav");
    navbar.insertBefore(btnFinish, navbar.children[1]);
}