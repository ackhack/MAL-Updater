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
    for (let i = 0; i< historyObj.length;i++) {
        mainDiv.appendChild(createCard(i, historyObj[i]));
    }
}

function createCard(index,entry) {
    let div = document.createElement("div");
    div.className = "card";
    div.innerText = entry?.name + " : Episode " +  entry?.episode;
    let info = document.createElement("span");
    info.style = "display:none";
    info.innerText = index;
    div.appendChild(info);
    div.onclick = (ev) => clickedCard(ev);
    return div;
}

function clickedCard(event) {
    currIndex = event.target.children[0].innerText;
    document.getElementById("metaDiv").style = "display: block";
    document.getElementById("metaInfo").innerHTML = event.target.innerText;
}

function clearCards() {
    mainDiv.innerHTML = "";
}

function closedMeta() {
    document.getElementById("metaDiv").style = "display: none";
}

function deleteMeta() {
    historyObj.splice(currIndex,1);
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