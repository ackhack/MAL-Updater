var code_verifier;
var stateID;
var auth_token;
var usertoken = {
    access: undefined,
    refresh: undefined,
    access_time: undefined,
    refresh_time: undefined,
    access_req_time: undefined,
    refresh_req_time: undefined
};
var client;
var sites = {};
var animeCache;
var bookmarkID;
var active;
var bookmarkActive;
var checkLastEpisodeBool;
var binge = new Set();

init();

chrome.runtime.onMessage.addListener(
    //Listener for HTTPReqeust
    //Needed because content_scripts cant run them
    function (request, sender, onSuccess) {
        switch (request.type) {
            case "GET_ANIME":
                return getAnime(request, onSuccess);
            case "SEND_USERTOKEN":
                return checkState(request, onSuccess);
            case "SEND_ANIME_FINISHED":
                return finishedEpisode(request, onSuccess);
            case "CLOSE_TAB":
                return closeTab(sender);
            case "CACHE_ANIME":
                return setCache(request, onSuccess);
            case "VALIDATE_SITE":
                return validateSite(request, onSuccess);
            case "CHANGED_BOOKMARK":
                return updateBookmarkFolder(request);
            case "DELETE_CACHE":
                return deleteCache(request.query, onSuccess);
            case "CHANGED_ACTIVE":
                return changeActiveState(request.value);
            case "UNAUTHORIZE":
                return unauthorize();
            case "CHANGED_CHECK_LAST_EPISODE":
                return changeCheckLastEpisode(request.value);
            case "BINGE_WATCHING":
                return addBinge(request.id);
            case "GET_NEWEST_VERSION":
                return checkUpdate(onSuccess);
            case "SYNC_CACHE":
                return initCache(onSuccess);
            default:
                return false;
        }
    }
);

function init() {
    //Init with callbacks for right order
    checkUpdate(result => {
        if (result.update) {
            chrome.browserAction.setBadgeText({ text: "1" });
        }
    });
    initSecret(() => { initSites(() => { initSettings(() => { initCache(() => { }) }) }) });
}

//#region Authentification

function getAuthCode() {

    try {
        chrome.storage.local.get(['MAL_User_Token'], function (result) {

            //Check if usertoken is in storage
            //otherwise request new one
            if (result.MAL_User_Token == undefined || result.MAL_User_Token == "") {
                getNewAuthCode();
            } else {
                usertoken = JSON.parse(result.MAL_User_Token);
                parseUserToken();
            }
        });
    } catch (ex) {
        getNewAuthCode();
    }
}

function parseUserToken() {
    //If accessToken is valid, refresh it, just in Case and use it
    if (usertoken.access_req_time + usertoken.access_time > Date.now()) {
        return refreshAccessToken();
    }

    //If refreshToken is valid, use it
    if (usertoken.refresh_req_time + usertoken.refresh_time > Date.now()) {
        return refreshAccessToken();
    }

    //Otherwise get new Tokens
    getNewAuthCode();
}

function refreshAccessToken() {

    let para = "client_id=" + client.id +
        "&client_secret=" + client.secret +
        "&grant_type=refresh_token" +
        "&refresh_token=" + usertoken.refresh;

    let xhr = new XMLHttpRequest();
    xhr.open("POST", "https://myanimelist.net/v1/oauth2/token", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    xhr.onreadystatechange = function () {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            saveAccessToken(JSON.parse(this.response));
        }
    }

    xhr.send(para);
}

function saveAccessToken(res) {
    usertoken.access = res.access_token;
    usertoken.refresh = res.refresh_token;
    usertoken.access_time = res.expires_in * 1000;
    usertoken.refresh_time = 28 * 24 * 60 * 60 * 1000;
    usertoken.access_req_time = Date.now();
    usertoken.refresh_req_time = Date.now();

    //Save var to storage
    chrome.storage.local.set({ MAL_User_Token: JSON.stringify(usertoken) }, function () { });

    //Set update for AccessToken
    pendNewAccessToken(0.9 * res.expires_in * 1000);
}

function pendNewAccessToken(time) {
    //Cap max time, else 0 will be used
    if (time > 2147483647) {
        time = 2147483647;
    }
    console.log("New Token acquired, next one will be in " + time + " Seconds");
    setTimeout(() => {
        console.log("Getting new Token");
        refreshAccessToken();
    }, time);
}

function getNewAuthCode() {
    //Generate verifier and state
    code_verifier = randomString();
    stateID = getStateID();
    console.log(stateID);

    //Opens the MAL Auth page
    fetch("https://myanimelist.net/v1/oauth2/authorize?" +
        "response_type=code" +
        "&client_id=" + client.id +
        "&state=" + stateID +
        "&code_challenge=" + code_verifier +
        "&code_challenge_method=plain")
        .then(response => chrome.tabs.create({ url: response.url }));
}

function randomString() {
    return generateId((Math.random() * 85) + 43);
}

function dec2hex(dec) {
    return dec.toString(16).padStart(2, "0")
}

function generateId(len) {
    var arr = new Uint8Array((len || 40) / 2)
    window.crypto.getRandomValues(arr)
    return Array.from(arr, dec2hex).join('')
}

function getStateID() {
    return "RequestID" + parseFloat(Math.random().toString()).toFixed(10);
}

function checkState(req, callb) {

    //Check if state is the same
    if (req.state != stateID) {
        alert("States did not match!");
        callb(false);
        return false;
    }

    auth_token = req.token;
    getUserToken();
    alert("Successfully authorized MAL Updater");
    callb(true);
    return true;
}

function getUserToken() {

    let para = "client_id=" + client.id +
        "&client_secret=" + client.secret +
        "&grant_type=authorization_code" +
        "&code=" + auth_token +
        "&code_verifier=" + code_verifier;

    let xhr = new XMLHttpRequest();
    xhr.open("POST", "https://myanimelist.net/v1/oauth2/token", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    xhr.onreadystatechange = function () {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            saveAccessToken(JSON.parse(this.response));
        }
    }

    xhr.send(para);
}

//#endregion

//#region Anime-Realted

function getAnime(req, callb, nTry = 0) {
    if (!active) {
        callb({ inactive: true });
    }
    nTry++;

    let cached = nTry == 1 ? getCache(req.site, req.name) : undefined;

    if (cached !== undefined) {

        console.log("Cached: " + req.name);
        checkLastEpisode(cached.meta.id, req.episode, (lastWatched, episode) => {
            callb({
                meta: cached.meta,
                cache: true,
                lastWatched: lastWatched,
                lastEpisode: episode
            });
        })

        return true;

    } else {

        //API max charNumber is 64
        if (req.name.length > 64)
            req.name = req.name.substring(0, 64);

        fetch("https://api.myanimelist.net/v2/anime?fields=alternative_titles?limit=10&q=" + req.name, {
            headers: {
                Authorization: "Bearer " + usertoken.access
            }
        })
            .then(response => response.json())
            .then(responseJSON => {
                if (responseJSON.error) {
                    if (nTry > 9) {
                        callb({ error: "Couldn`t get Result from API:" + JSON.stringify(responseJSON) });
                    } else {
                        getAnime(req, callb, nTry);
                    }
                } else {
                    checkLastEpisode(responseJSON.id, req.episode, (lastWatched, episode) => {
                        responseJSON.lastWatched = lastWatched;
                        responseJSON.lastEpisode = episode;
                        getDisplayMode(displayMode => {
                            responseJSON.displayMode = displayMode;
                            callb(responseJSON);
                        })
                    });
                }
            });
        return true;
    }
}

function checkLastEpisode(id, episode, callb) {
    if (checkLastEpisodeBool == false) {
        callb(undefined, undefined);
        return;
    }
    if (episode == 1 || episode == 0 || id === undefined) {
        callb(true, undefined);
        return;
    }
    if (binge.has(id)) {
        callb(true, undefined);
        return;
    }

    fetch("https://api.myanimelist.net/v2/anime/" + id + "?fields=my_list_status", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + usertoken.access,
        },
    })
        .then(response => {
            response.json().then((json) => {
                if (json.my_list_status) {
                    if (json.my_list_status.num_episodes_watched)
                        callb(episode - 1 == json.my_list_status.num_episodes_watched, json.my_list_status.num_episodes_watched);
                    else
                        callb(true, undefined);
                } else {
                    callb(undefined, undefined);
                }
            })
        });
}

function finishedEpisode(req, callb) {

    removeBinge(req.id);

    //rating only exists if anime was finished
    if (req.rating) {
        fetch("https://api.myanimelist.net/v2/anime/" + req.id + "/my_list_status", {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + usertoken.access,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: 'status=completed&num_watched_episodes=' + req.episode + '&score=' + req.rating
        })
            .then(response => {
                response.json().then(responseJSON => {
                    if (req.episode == responseJSON.num_episodes_watched) {
                        setBookmark(req.id, req.url, undefined);
                    }
                    callb(responseJSON);
                });
            });
        return true;
    } else {
        console.log(req);
        let anime = getCacheById(req.id);

        console.log(anime);

        if (anime === undefined) {
            callb({ num_episodes_watched: -1 });
            return;
        }

        if (anime.meta.num_episodes == req.episode && req.force == false) {
            callb({ last: true, next: getSequel(anime.meta.related_anime) });
        } else {
            fetch("https://api.myanimelist.net/v2/anime/" + req.id + "/my_list_status", {
                method: "PUT",
                headers: {
                    "Authorization": "Bearer " + usertoken.access,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: 'status=watching&num_watched_episodes=' + req.episode
            })
                .then(response => {
                    response.json().then(responseJSON => {
                        if (req.episode == responseJSON.num_episodes_watched) {
                            setBookmark(req.id, req.url, req.nextURL);
                        }
                        callb(responseJSON)
                    });
                });
        }
        return true;
    }
}

function getDisplayMode(callb) {
    chrome.storage.local.get(["MAL_Settings_DisplayMode"], function (result) {

        if (result != {} && result["MAL_Settings_DisplayMode"] != undefined) {
            callb(result["MAL_Settings_DisplayMode"]);
            return;
        }
        chrome.storage.local.set({ ["MAL_Settings_DisplayMode"]: true }, function () { });
        callb(true);
    });
}

function getAnimeDetails(id, callb) {
    //Gets the episode number of an anime
    fetch("https://api.myanimelist.net/v2/anime/" + id + "?fields=num_episodes,related_anime,alternative_titles", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + usertoken.access,
        },
    })
        .then(response => {
            response.json().then((json) => {
                callb(json);
            })
        });
}

function getSequel(related) {
    for (let rel of related) {
        if (rel.relation_type == "sequel") {
            return rel.node.title;
        }
    }
    return undefined;
}

function setCache(req, callb = () => { }) {
    if (animeCache[req.id] === undefined) {
        getAnimeDetails(req.id, (json) => {

            json["id"] = req.id;

            animeCache[req.id] = {
                meta: json,
                [req.site]: req.name
            };
            console.log(animeCache);
            syncCache();
            callb(animeCache[req.id]);
        })
    } else {
        animeCache[req.id][req.site] = req.name;
        syncCache();
        callb(animeCache[req.id]);
    }
    return true;
}

function getCache(site, name) {

    for (let elem in animeCache) {
        if (animeCache[elem][site] === name) {
            return animeCache[elem];
        }
    }
    return undefined;
}

function getCacheById(id) {
    return animeCache[id];
}

function deleteCache(query = {}, callb = () => { }) {
    if (query.all) {
        animeCache = {};
        syncCache();
        callb(true);
        return true;
    }

    if (query.id) {
        delete animeCache[id];
        syncCache();
        callb(true);
        return true;
    }

    if (query.url) {
        validateSite(query, (site) => {

            if (site === undefined)
                return;

            let res = query.url.match(site.urlPattern);

            if (res) {
                for (let elem in animeCache) {
                    if (animeCache[elem][site.siteName] === res[site.nameMatch]) {
                        delete animeCache[elem][site.siteName];
                        syncCache();
                        callb(true);
                        return;
                    }
                }
            }

        });
        return true;
    }
    callb(false);
    return false;
}

function syncCache() {
    //Save to local Storage
    chrome.storage.local.set({ "MAL_AnimeCache": animeCache }, function () { });
}

//#endregion

//#region Bookmarks

function setBookmark(animeID, oldURL, nextURL) {

    if (!bookmarkActive) {
        return;
    }

    let anime = getCacheById(animeID);
    let name = anime === undefined ? undefined : anime.meta.title;
    //remove old bookmark
    if (bookmarkID)
        getBookmark(bookmarkID, res => {
            if (res != undefined && res.children.length > 0) {
                for (let child of res.children) {

                    if (child.url === undefined)
                        continue;

                    if (child.url == oldURL) {
                        chrome.bookmarks.remove(child.id, () => { });
                        return;
                    }

                    if (child.title.startsWith(animeID)) {
                        name = child.title.substring(animeID.length + 1);
                        chrome.bookmarks.remove(child.id, () => { });
                        return;
                    }
                }
                for (let site in anime) {
                    if (site == "meta")
                        continue;

                    let pattern = sites[site].urlPattern;
                    let indexOpen = 0;

                    for (let i = 0; i < sites[site].nameMatch; i++) {
                        indexOpen = pattern.indexOf("(", indexOpen);
                    }

                    if (indexOpen == -1)
                        continue;

                    let indexClosed = pattern.indexOf(")", indexOpen);

                    if (indexClosed == -1)
                    continue;

                    let actPattern = pattern.slice(0, indexOpen) + anime[site] + pattern.slice(indexClosed + 1);

                    for (let child of res.children) {
                        if (child.url === undefined)
                            continue;

                        if (child.url.match(actPattern)) {
                            chrome.bookmarks.remove(child.id, () => { });
                            return;
                        }
                    }
                }
            } else {
                initSettings(() => { });
            }
        });

    if (nextURL) {
        //add new bookmark
        if (name == undefined) {
            fetch("https://api.myanimelist.net/v2/anime/" + animeID, {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + usertoken.access,
                },
            })
                .then(response => {
                    response.json().then((json) => {
                        name = json.title;
                        addBookmark(animeID + ": " + name, nextURL);
                    })
                });
        } else {
            addBookmark(animeID + ": " + name, nextURL);
        }
    }
}

function addBookmark(name, url) {
    getBookmark(bookmarkID, res => {
        if (res != undefined) {
            chrome.bookmarks.create({
                "parentId": bookmarkID,
                "title": name,
                "url": url
            }, () => { })
        } else {
            initSettings(() => { addBookmark(name, url); })
        }
    });
}

function createBookmarkFolder(name) {
    chrome.bookmarks.search(name, (result) => {

        for (let bookmark of result) {
            if (bookmark.title === name && bookmark.url == undefined) {
                bookmarkID = bookmark.id;
                chrome.storage.local.set({ "MAL_Bookmark_ID": bookmark.id }, function () { });
                return;
            }
        }

        chrome.bookmarks.create({
            'title': name,
            'parentId': "1"
        }, bookmark => {
            bookmarkID = bookmark.id;
            chrome.storage.local.set({ "MAL_Bookmark_ID": bookmark.id }, function () { });
        });
        return;
    });
}

function updateBookmarkFolder(req) {
    if (req.active === true || req.active === false) {
        bookmarkActive = req.active;
        return true;
    }
    if (req.folderName == "") {
        return true;
    }
    getBookmark(bookmarkID, res => {
        if (res != undefined) {
            chrome.bookmarks.update(bookmarkID, { title: req.folderName }, () => { });
        } else {
            createBookmarkFolder(req.folderName);
        }
    });
    return true;
}

function getBookmark(id, callb) {
    chrome.bookmarks.getSubTree("1", nodes => {
        for (let node of nodes[0].children) {
            if (node.id == id) {
                callb(node);
                return;
            }
        }
        callb(undefined);
    });
}

//#endregion

//#region Init

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
                                if (curSite == siteNames.length)
                                    callb();
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
            } else {
                bookmarkActive = true;
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
                            callb();
                        })
                    })
                })
            })
        })
    });
}

function initBookmarkFolder(folderName) {

    if (folderName !== undefined && folderName !== "")
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

function initCache(callb) {
    chrome.storage.local.get("MAL_AnimeCache", function (result) {
        if (result)
            animeCache = result["MAL_AnimeCache"] ?? {};
        else
            animeCache = {};

        callb();
    });
}

//#endregion

//#region Runtime Functions

function closeTab(sender) {
    chrome.tabs.remove(sender.tab.id);
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

function unauthorize() {
    changeActiveState(false);
    chrome.storage.local.remove("MAL_User_Token", () => { });
    usertoken = undefined;
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

//#endregion
