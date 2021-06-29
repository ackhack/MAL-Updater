var historyObj = [];

function addHistory(name,episode) {

    historyObj.push({
        name: name,
        episode: episode,
    });

    syncHistory();
}

function removeFromHistory(index) {
    if (historyObj[index]) {
        delete historyObj[index];
    }
}

function getHistory() {
    return historyObj;
}

function syncHistory() {
    chrome.storage.local.set({ "MAL_AnimeHistory": historyObj }, function () { });
}