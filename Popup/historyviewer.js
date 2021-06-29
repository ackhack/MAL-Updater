var historyObj;
var mainDiv;

init();

function init() {
    mainDiv = document.getElementById("mainDiv");
    chrome.storage.local.get("MAL_AnimeHistory", function (result) {
        if (result)
            historyObj = result["MAL_AnimeHistory"] ?? [];
        else
            historyObj = [];

        createCards();
    });
}

function createCards() {
    historyObj.forEach(entry => mainDiv.appendChild(createCard(entry.name, entry.episode)));
}

function createCard(title, episode) {
    let div = document.createElement("div");
    div.className = "card";
    div.innerText = title + " : Episode " +  episode;
    return div;
}

function syncHistory() {
    chrome.storage.local.set({ "MAL_AnimeHistory": historyObj }, function () {
        chrome.runtime.sendMessage({
            type: "SYNC_HISTORY"
        });
    });
}