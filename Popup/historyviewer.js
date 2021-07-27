var historyObj;
var mainDiv;
var currIndex;

init();

function init() {
    mainDiv = document.getElementById("mainDiv");

    document.onkeydown = function (evt) {
        evt = evt || window.event;
        if (evt.key == "Escape") {
            closedMeta();
        }
    };

    document.getElementById("btnClose").onclick = closedMeta;
    document.getElementById("btnDelete").onclick = deleteMeta;

    chrome.storage.local.get("MAL_AnimeHistory", function (result) {
        if (result)
            historyObj = result["MAL_AnimeHistory"] ?? [];
        else
            historyObj = [];

        createCards();
    });
}

function createCards() {
    for (let i = historyObj.length-1; i > 0; i--) {
        mainDiv.appendChild(createCard(i, historyObj[i]));
    }
}

function createCard(index, entry) {
    let div = document.createElement("div");
    div.className = "card";
    div.innerText = entry?.name + " : Episode " + entry?.episode;
    entry.index = index;
    let info = document.createElement("span");
    info.style = "display:none";
    info.innerText = JSON.stringify(entry);
    div.appendChild(info);
    div.onclick = (ev) => clickedCard(ev);
    return div;
}

function clickedCard(event) {
    let entry = JSON.parse(event.target.children[0].innerText);
    currIndex = entry?.index ?? -1;
    document.getElementById("metaDiv").style = "display: block";
    document.getElementById("metaInfo").innerText = "Name: " + entry?.name + "\nEpisode: " + entry?.episode + "\nTime: " + (new Date(entry?.time) !== "Invalid Date" ? new Date(entry?.time).toLocaleString() : "Invalid Date");
}

function clearCards() {
    mainDiv.innerHTML = "";
}

function closedMeta() {
    document.getElementById("metaDiv").style = "display: none";
}

function deleteMeta() {
    if (!confirm("Do you really want to delete this Entry"))
        return;
    if (currIndex == -1) {
        return;
    }
    historyObj.splice(currIndex, 1);
    syncHistory();
    clearCards();
    createCards();
    closedMeta();
}

function syncHistory() {
    chrome.storage.local.set({ "MAL_AnimeHistory": historyObj }, function () {
        chrome.runtime.sendMessage({
            type: "SYNC_HISTORY"
        });
    });
}