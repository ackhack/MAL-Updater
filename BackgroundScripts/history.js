var historyObj = [];

function addHistory(name,episode) {

    historyObj.push({
        name: name,
        episode: episode,
    });

    syncHistory();
}

function syncHistory() {
    chrome.storage.local.set({ "MAL_AnimeHistory": historyObj }, function () { });
}