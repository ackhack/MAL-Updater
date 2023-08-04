function closeTab(sender, force = false) {
    if (!sender.tab.active || force)
        chrome.tabs.remove(sender.tab.id);
    return true;
}

function validateSite(req, callb) {
    //check if we have the site saved as json
    getSitesVariable(sites => {
        for (let site in sites) {
            if (req.url.match(sites[site].urlPattern)) {
                sites[site].valid = true;
                callb(sites[site]);
                return;
            }
            if (req.url.match(sites[site].sitePattern)) {
                sites[site].valid = false;
                callb(sites[site]);
                return;
            }
        }
        callb(undefined);
    });
    return true;
}

function validateMainSite(req, callb) {
    //check if we have the site saved as json
    getAnimeCacheVariable(animeCache => {
        getSitesVariable(sites => {
            for (let site in sites) {
                if (req.url.match(sites[site].mainPagePattern)) {
                    callb({
                        site: sites[site],
                        cache: animeCache
                    });
                }
            }
            callb(undefined);
        });
    });
    return true;
}

function changeActiveState(value) {
    setActiveVariable(value);
    getUserTokenVariable(usertoken => {
        if (value && usertoken.access == undefined) {
            getAuthCode();
        }
    });
    return true;
}

function hasUpdate(oldVersion, newVersion) {
    if (oldVersion == -1) {
        return true;
    }
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

function checkUpdateExtension(callb) {
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
                    }).catch(err => console.log(err));
            })
        }).catch(err => console.log(err));
    return true;
}

function updatePages(callb = () => {}) {

    function getNewPages(callb) {
        let newPages = {};
        fetch("https://raw.githubusercontent.com/ackhack/MAL-Updater/global-storage/pages/names.json")
            .then((response) => {
                response.json().then((json) => {
                    if (json.names) {
                        let i = 0;
                        for (page of json.names) {
                            let name = page;
                            fetch("https://raw.githubusercontent.com/ackhack/MAL-Updater/global-storage/pages/" + name + ".json")
                                .then((response) => {
                                    response.json().then((pageJson) => {
                                        i++;
                                        newPages[name] = pageJson;
                                        if (i == Object.keys(json.names).length) {
                                            setSitesVariable(newPages);
                                            callb();
                                        }
                                    })
                                }).catch(err => console.log(err));
                        }
                    }
                })
            }).catch(err => console.log(err));
    }

    getSitesVersion((oldVersion) => {
        fetch("https://raw.githubusercontent.com/ackhack/MAL-Updater/global-storage/pages/version.json")
            .then((response) => {
                response.json().then((json) => {
                    if (json.version) {
                        if (hasUpdate(oldVersion, json.version)) {
                            console.log("[Updater] Updating Pages to " + json.version);
                            getNewPages(callb);
                            setSitesVersion(json.version)
                        }
                        else {
                            callb();
                        }
                    }
                })
            }).catch(err => console.log(err));
    });
}

function checkUpdateCycle() {
    checkUpdateExtension(result => {
        if (result.update) {
            console.log("[Updater] Update available");
            chrome.action.setBadgeText({ text: "1" });
        }
    });
    updatePages();
}

function handleAnimeWatchedInfo(req) {
    setBookmark(req.id, req.nextURL);
    addHistory(req.name, req.episode, req.id);
}

function confirmMessage(msg, callb = () => { }) {
    console.log("[General] Sending Confirm Message")
    chrome.notifications.create({
        type: "basic",
        iconUrl: "Resources/icon.png",
        title: "MAL Updater",
        requireInteraction: true,
        buttons: [{
            title: "Yes"
        }, {
            title: "No"
        }],
        message: msg
    }, id => {
        function listener(notificationId, buttonIndex) {
            if (notificationId == id)
                callb(buttonIndex == 0);
            chrome.notifications.onButtonClicked.removeListener(listener);
        }
        chrome.notifications.onButtonClicked.addListener(listener);
    });
    return true;
}

function sendNotification(message) {
    console.log("[General] Sending Notification")
    chrome.notifications.create({
        type: "basic",
        iconUrl: "Resources/icon.png",
        title: "MAL Updater",
        message: message
    });
}