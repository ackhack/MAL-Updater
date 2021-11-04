function addHistory(name,episode,id) {

    historyObj.push({
        name: name,
        episode: episode,
        time: Date.now(),
        id:id
    });

    syncHistory();
}

function syncHistory() {
    chrome.storage.local.set({ "MAL_AnimeHistory": historyObj }, function () { });
}