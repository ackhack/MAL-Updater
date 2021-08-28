var settings = [
    {
        name: "MAL_Settings_Bookmarks",
        execfunction: initBookmarkFolder
    }, {
        name: "MAL_Settings_Active",
        variable: 'active',
        default: true
    }, {
        name: "MAL_Settings_DiscordActive",
        variable: 'discordActive',
        default: false
    }, {
        name: "MAL_Settings_CheckLastEpisode",
        variable: 'checkLastEpisodeBool',
        default: true
    }, {
        name: "MAL_Settings_DisplayMode",
        variable: 'displayMode',
        default: true
    }, {
        name: "MAL_Settings_Bookmarks_Active",
        variable: 'bookmarkActive',
        execfunction: initBookmarkEvent,
        default: true
    }, {
        name: "MAL_Settings_Bookmarks_Auto",
        variable: 'bookmarkautoActive',
        default: false
    },
    {
        name: "MAL_Settings_Preferred_Site",
        variable: 'preferredSiteName',
        default: "kickassanime"
    }
];

init();

function init() {
    //Init with callbacks for right order
    checkUpdateCycle();
    initSecret(() => {
        initSites(() => {
            initSettings(0, () => {
                if (bookmarkautoActive)
                    bookmarkLoop();

                initCache(() => {
                    initHistory(() => { })
                })
            })
        })
    });
}

function initSites(callb) {
    //Write the Pages Folder into a useable object
    chrome.runtime.getPackageDirectoryEntry(function (storageRootEntry) {
        storageRootEntry.getDirectory("Pages", { create: false }, function (directory) {
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

        function fileExists(storageRootEntry, fileName, callback) {
            storageRootEntry.getFile(fileName, {
                create: false
            }, function () {
                callback(true);
            }, function () {
                callback(false);
            });
        }

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

function initSettings(i, callb) {
    if (i == settings.length) {
        callb();
        return;
    }
    let setting = settings[i];

    tryGetStorage(setting.name, undefined, result => {

        if (result !== undefined) {
            if ('variable' in setting) {
                this[setting.variable] = result;
            }
            if ('execfunction' in setting) {
                setting.execfunction(result);
            }
        } else {
            if ('variable' in setting) {
                this[setting.variable] = setting.default;
            }
            if ('execfunction' in setting && setting.default === true) {
                setting.execfunction();
            }
        }
        initSettings(++i, callb);
    });
}

function initBookmarkFolder(folderName) {

    if (folderName !== undefined && folderName !== "") {
        tryGetStorage("MAL_Bookmark_ID", "", result => {
            if (result === "") {
                createBookmarkFolder(folderName);
            } else {
                getBookmark(result, res => {
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
    tryGetStorage("MAL_AnimeCache", {}, result => {
        animeCache = result;
        callb();
    });
}

function initHistory(callb) {
    tryGetStorage("MAL_AnimeHistory", {}, result => {
        historyObj = result;
        callb();
    });
}

function initBookmarkEvent() {
    chrome.bookmarks.onCreated.addListener((_, bookmark) => {
        renameBookmark(bookmark);
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

    sitePatterns = [];
    for (let site in sites) {
        sitePatterns.push(sites[site].mainPagePattern);
    }
    injectObject.push({
        matches: sitePatterns,
        js: ["InjectScripts/animeMainSiteInject.js"],
        all_frames: true
    });
}