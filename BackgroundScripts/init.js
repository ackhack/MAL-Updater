init();

function init() {
    //Init with callbacks for right order
    checkUpdateCycle();
    initSecret(() => { initSites(() => { initSettings(() => { initCache(() => { initHistory(() => { }) }) }) }) });
}

function readDirectory(directory, callb) {
    //Gets all json Pages
    let entries = [];
    directory.createReader().readEntries(function (results) {
        for (let page of results) {
            entries = entries.concat(page.name);
        }
        callb(entries);
    });
}

function initSites(callb) {
    //Write the Pages Folder into a useable object
    chrome.runtime.getPackageDirectoryEntry(function (storageRootEntry) {
        storageRootEntry.getDirectory("Pages", { create: false }, function (directory) {
            readDirectory(directory, function (siteNames) {
                let curSite = 0;
                for (let name of siteNames) {
                    fetch(chrome.runtime.getURL('Pages/' + name))
                        .then((response) => {
                            response.json().then((json) => {
                                if (name != "default.json")
                                    sites[name.substring(0, name.length - 5)] = json;

                                curSite++;
                                if (curSite == siteNames.length) {
                                    initInjector();
                                    callb();
                                }
                            })
                        }).catch(err => console.log(err));
                }
            });
        })
    });
}

function initSecret(callb) {
    //Try to get the secret.json
    chrome.runtime.getPackageDirectoryEntry(function (storageRootEntry) {
        fileExists(storageRootEntry, 'Resources/secret.json', function (isExist) {
            if (isExist) {
                let url = chrome.runtime.getURL('Resources/secret.json');
                fetch(url)
                    .then((response) => {
                        response.json().then((json) => {
                            client = json;
                            if (client.id == undefined || client.secret == undefined) {
                                alert("secret.json does not have the right attributes\ngithub.com/ackhack/mal-updater for more info");
                            } else {
                                getAuthCode();
                                callb();
                            }
                        })
                    });
            } else {
                alert("No secret.json found\ngithub.com/ackhack/mal-updater for more info\nExtension will not start unless secret.json is present");
            }
        });
    });
}

function fileExists(storageRootEntry, fileName, callback) {
    storageRootEntry.getFile(fileName, {
        create: false
    }, function () {
        callback(true);
    }, function () {
        callback(false);
    });
}

function initSettings(callb) {
    function setting1(callb) {
        chrome.storage.local.get("MAL_Settings_Bookmarks", function (res) {
            if (res.MAL_Settings_Bookmarks != "" && res.MAL_Settings_Bookmarks != undefined) {
                initBookmarkFolder(res.MAL_Settings_Bookmarks);
            }
            callb();
        });
    }
    function setting2(callb) {
        chrome.storage.local.get("MAL_Settings_Active", function (res) {
            if (res.MAL_Settings_Active != "" && res.MAL_Settings_Active != undefined) {
                active = res.MAL_Settings_Active;
            } else {
                active = true;
            }
            callb();
        });
    }
    function setting3(callb) {
        chrome.storage.local.get("MAL_Settings_DiscordActive", function (res) {
            if (res.MAL_Settings_DiscordActive == "" && res.MAL_Settings_DiscordActive == undefined) {
                chrome.storage.local.set({ "MAL_Settings_DiscordActive": false }, function (res) {
                    callb();
                });
                return;
            }
            callb();
        });
    }
    function setting4(callb) {
        chrome.storage.local.get("MAL_Settings_CheckLastEpisode", function (res) {
            if (res.MAL_Settings_CheckLastEpisode == "" && res.MAL_Settings_CheckLastEpisode == undefined) {
                chrome.storage.local.set({ "MAL_Settings_CheckLastEpisode": true }, function (res) {
                    callb();
                });
                return;
            }
            callb();
        });
    }
    function setting5(callb) {
        chrome.storage.local.get("MAL_Settings_DisplayMode", function (res) {
            if (res.MAL_Settings_DisplayMode == "" && res.MAL_Settings_DisplayMode == undefined) {
                chrome.storage.local.set({ "MAL_Settings_DisplayMode": true }, function (res) {
                    callb();
                });
                return;
            }
            callb();
        });
    }
    function setting6(callb) {
        chrome.storage.local.get("MAL_Settings_Bookmarks_Active", function (res) {
            if (res.MAL_Settings_Bookmarks_Active != "" && res.MAL_Settings_Bookmarks_Active != undefined) {
                bookmarkActive = res.MAL_Settings_Bookmarks_Active;
                initBookmarkEvent();
            } else {
                bookmarkActive = true;
            }
            callb();
        });
    }
    function setting7(callb) {
        chrome.storage.local.get("MAL_Settings_Bookmarks_Auto", function (res) {
            if (res.MAL_Settings_Bookmarks_Auto != "" && res.MAL_Settings_Bookmarks_Auto != undefined) {
                bookmarkautoActive = res.MAL_Settings_Bookmarks_Auto;
                if (bookmarkautoActive) {
                    checkBookmarks();
                }
            } else {
                bookmarkautoActive = false;
            }
            callb();
        });
    }

    setting1(() => {
        setting2(() => {
            setting3(() => {
                setting4(() => {
                    setting5(() => {
                        setting6(() => {
                            setting7(() => {
                                callb();
                            })
                        })
                    })
                })
            })
        })
    });
}

function initBookmarkFolder(folderName) {

    if (folderName !== undefined && folderName !== "") {
        chrome.storage.local.get("MAL_Bookmark_ID", function (result) {
            if (result == {}) {
                createBookmarkFolder(folderName);
            } else {
                getBookmark(result.MAL_Bookmark_ID, res => {
                    if (res != undefined) {
                        bookmarkID = res.id;
                    } else {
                        createBookmarkFolder(folderName);
                    }
                });
            }
        });
    }
}

function initCache(callb) {
    chrome.storage.local.get("MAL_AnimeCache", function (result) {
        if (result)
            animeCache = result["MAL_AnimeCache"] ?? {};
        else
            animeCache = {};

        callb();
    });
}

function initHistory(callb) {
    chrome.storage.local.get("MAL_AnimeHistory", function (result) {
        if (result)
            historyObj = result["MAL_AnimeHistory"] ?? [];
        else
            historyObj = [];

        callb();
    });
}

function initBookmarkEvent() {
    chrome.bookmarks.onCreated.addListener((_, bookmark) => {
        renameBookmark(bookmark);
    });
}

function checkUpdateCycle() {
    checkUpdate(result => {
        if (result.update) {
            chrome.browserAction.setBadgeText({ text: "1" });
            return;
        }
        setTimeout(() => { checkUpdateCycle() }, 1_800_000);
    });
}

function initInjector() {
    let sitePatterns = [];
    for (let site in sites) {
        sitePatterns.push(sites[site].urlPattern);
    }
    injectObject.push({
        matches: sitePatterns,
        js: ["InjectScripts/animeSiteInject.js"]
    });
}