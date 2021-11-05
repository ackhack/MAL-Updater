const settings = [
    {
        name: "MAL_Settings_Bookmarks",
        execfunction: initBookmarkFolder
    }, {
        name: "MAL_Settings_Active",
        variable: 'active',
        default: true
    }
];

init();

function init() {
    //Init with callbacks for right order
    checkUpdateCycle();
    setDiscordTabIdVariable(-1);
    initSecret(() => {
        initSites(() => {
            initSettings(0, () => {
                bookmarkLoop();
            })
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
    tryGetStorage("MAL_Bookmark_ID", "", result => {
        if (result === "") {
            createBookmarkFolder(folderName);
        } else {
            getBookmark(result, res => {
                if (res != undefined) {
                    setBookmarkIDVariable(res.id);
                } else {
                    createBookmarkFolder(folderName);
                }
            });
        }
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