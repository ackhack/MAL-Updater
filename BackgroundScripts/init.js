init();

function init() {
    //Init with callbacks for right order
    console.log("[Init] Starting at " + new Date(Date.now()).toLocaleString());

    initSecret(() => {
        initSites((sites) => {
            initCache(sites, () => {
                initBookmarkEvent();
                initBookmarkFolder();
            });
        })
    });
}

function initSites(callb) {
    updatePages(() => {
        getSitesVariable(sites => {
            initInjector(sites);
            callb(sites);
        });
    });
}

function initSecret(callb) {
    //Try to get the secret.json
    fetch(chrome.runtime.getURL('Resources/secret.json'))
        .then((response) => {
            response.json().then((json) => {
                client = json;
                if (client.id == undefined || client.secret == undefined) {
                    sendNotification("secret.json does not have the right attributes\ngithub.com/ackhack/mal-updater for more info");
                } else {
                    getAuthCode();
                    callb();
                }
            })
        }).catch(_ => sendNotification("No secret.json found\ngithub.com/ackhack/mal-updater for more info\nExtension will not start unless secret.json is present"));
}

function initBookmarkFolder(folderName) {
    getBookmarkActiveVariable(active => {
        if (!active)
            return;

        getBookmarkIDVariable(id => {
            if (id == "-1") {
                createBookmarkFolder(folderName);
            } else {
                getBookmark(id, res => {
                    if (res == undefined) {
                        createBookmarkFolder(folderName);
                    }
                });
            }
        });
    });
}

function initBookmarkEvent() {
    chrome.bookmarks.onCreated.addListener((_, bookmark) => {
        renameBookmark(bookmark);
    });
}

function initInjector(sites) {
    let sitePatterns = [];
    for (let site in sites) {
        sitePatterns.push(sites[site].sitePattern);
    }
    injectObject.push({
        matches: sitePatterns,
        js: ["InjectScripts/animeSiteInject.js"]
    });

    sitePatterns = [];
    for (let site in sites) {
        let pattern= sites[site].mainPagePattern
        if (pattern != undefined && pattern != "")
            sitePatterns.push(pattern);
    }
    injectObject.push({
        matches: sitePatterns,
        js: ["InjectScripts/animeMainSiteInject.js"],
        all_frames: true
    });
}

function initCache(sites, callb = () => { }) {
    getAnimeCacheVariable(cache => {
        for (let entry in cache) {
            for (let index in sites) {
                if (!(sites[index].id in cache[entry])) {
                    cache[entry][sites[index].id] = [];
                    continue;
                }
            }
            if (cache[entry][undefined]) {
                delete cache[entry][undefined];
            }
            if (cache[entry][null]) {
                delete cache[entry][null];
            }
            if (cache[entry]["undefined"]) {
                delete cache[entry]["undefined"];
            }
            //TEMP move from siteName to id
            if (cache[entry]["kickassanime"]) {
                cache[entry][0] = cache[entry]["kickassanime"];
                delete cache[entry]["kickassanime"];
            }
            if (cache[entry]["9anime"]) {
                cache[entry][1] = cache[entry]["9anime"];
                delete cache[entry]["9anime"];
            }
            if (cache[entry]["gogoanimehub"]) {
                cache[entry][2] = cache[entry]["gogoanimehub"];
                delete cache[entry]["gogoanimehub"];
            }
        }

        setAnimeCacheVariable(cache);
        callb();
    });
}