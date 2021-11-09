var historyObj;
var mainDiv;
var currIndex;
const MaxCardsShown = 100;

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

function createCards(start = 0,iterateObject = historyObj) {
    let end = historyObj.length - 1 - start - MaxCardsShown;
    if (end < 0)
        end = 0;

    for (let i = historyObj.length - 1 - start; i >= end; i--) {
        mainDiv.appendChild(createCard(i, iterateObject[i]));
    }

    if (historyObj.length - 1 - start - MaxCardsShown > 0) {
        let div = document.createElement("div");
        div.className = "card";
        div.id = "divShowMore";
        div.innerText = "Show More Entries";
        div.onclick = showMoreCards;
        mainDiv.appendChild(div);
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
    document.getElementById("metaDiv").style = "display: block;position:fixed;";
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
    if (currIndex < 0 || currIndex >= historyObj.length) {
        return;
    }
    historyObj.splice(currIndex, 1);
    clearCards();
    createCards();
    closedMeta();
}

function showMoreCards() {
    document.getElementById("divShowMore")?.remove();
    createCards(mainDiv.childElementCount);
}