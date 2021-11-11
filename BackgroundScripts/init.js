init();

function init() {
    //Init with callbacks for right order

    initSecret(() => {
        initSites(() => {
            initBookmarkEvent();
            initBookmarkFolder();
        })
    });
}

function initSites(callb) {
    //Write the Pages Folder into a useable object
    const siteFileNames = [
        "9anime.json",
        "gogoanimehub.json",
        "kickassanime.json"
    ];

    var sites = {};
    let i = 0;

    for (let name of siteFileNames) {
        fetch(chrome.runtime.getURL('Pages/' + name))
            .then((response) => {
                response.json().then((json) => {
                    sites[name.substring(0, name.length - 5)] = json;
                    i++;
                    if (i == siteFileNames.length) {
                        setSitesVariable(sites);
                        initInjector(sites);
                        callb();
                    }
                })
            }).catch(err => console.log(err));
    }
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