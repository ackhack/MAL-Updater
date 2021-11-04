function closeTab(sender, force = false) {
    if (!sender.tab.active || force)
        chrome.tabs.remove(sender.tab.id);
    return true;
}

function validateSite(req, callb) {
    //check if we have the site saved as json
    for (let site in sites) {
        if (req.url.match(sites[site].sitePattern)) {
            callb(sites[site]);
            return true;
        }
    }
    callb(undefined);
    return false;
}

function validateMainSite(req, callb) {
    //check if we have the site saved as json

    for (let site in sites) {
        if (req.url.match(sites[site].mainPagePattern)) {
            callb({ site: sites[site], cache: animeCache, addBookmarks: (bookmarkautoActive && preferredSiteName == sites[site].siteName) });
            return true;
        }
    }
    callb(undefined);
    return false;
}

function changeActiveState(value) {
    active = value;
    if (active && usertoken === undefined) {
        getAuthCode();
    }
    return true;
}

function changeCheckLastEpisode(value) {
    checkLastEpisodeBool = value;
    return true;
}

function changeDisplayMode(value) {
    displayMode = value;
    return true;
}

function addBinge(id) {
    binge.add(id);
    return true;
}

function removeBinge(id) {
    if (binge.has(id))
        binge.delete(id);
    return true;
}

function checkUpdate(callb) {
    function hasUpdate(oldVersion, newVersion) {
        let oldSplit = oldVersion.split(".");
        let newSplit = newVersion.split(".");

        for (let i = 0; i < oldSplit.length; i++) {
            if (oldSplit[i] > newSplit[i]) {
                return false;
            }
            if (oldSplit[i] < newSplit[i]) {
                return true;
            }
        }
        return false;
    }

    fetch(chrome.runtime.getURL('manifest.json'))
        .then((response) => {
            response.json().then((json) => {
                let oldVersion = json.version;
                fetch("https://raw.githubusercontent.com/ackhack/MAL-Updater/master/manifest.json")
                    .then((response) => {
                        response.json().then((json) => {
                            if (json.version) {
                                callb({
                                    update: hasUpdate(oldVersion, json.version),
                                    version: oldVersion
                                });
                            }
                        })
                    })
            })
        }).catch(err => console.log(err));

    return true;
}

function checkUpdateCycle() {
    checkUpdate(result => {
        if (result.update) {
            chrome.action.setBadgeText({ text: "1" });
            return;
        }
        setTimeout(() => { checkUpdateCycle() }, 1_800_000);
    });
}

function handleAnimeWatchedInfo(req) {
    addHistory(req.name, req.episode, req.id);
}

function confirmMessage(msg, callb) {
    callb(confirm(msg));
    return true;
}

function tryGetStorage(name, defaultValue, callb) {
    chrome.storage.local.get(name, function (result) {
        callb(result ? result[name] ?? defaultValue : defaultValue);
    });
}

function getSitesAsync(callb) {
    callb(sites);
    return true;
}