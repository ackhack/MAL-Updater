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
var bookmarkID;
var active;
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
                return setCache(request);
            case "VALIDATE_SITE":
                return validateSite(request, onSuccess);
            case "CHANGED_BOOKMARK":
                return updateBookmarkFolder(request.folderName);
            case "DELETE_CACHE":
                return deleteCache();
            case "CHANGED_ACTIVE":
                return changeActiveState(request.value);
            case "UNAUTHORIZE":
                return unauthorize();
            case "CHANGED_CHECK_LAST_EPISODE":
                return changeCheckLastEpisode(request.value);
            case "BINGE_WATCHING":
                return addBinge(request.id);
            default:
                return false;
        }
    }
);

function init() {
    //Init with callbacks for right order
    initSecret(() => { initSites(() => { initSettings(() => { }) }) });
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
    //return "NklUDX_CzS8qrMGWaDzgKs6VqrinuVFHa0xnpWPDy7_fggtM6kAar4jnTwOgzK7nPYfE9n60rsY4fhDExWzr5bf7sEvMMmSXcT2hWkCstFGIJKoaimoq5GvAEQD8NZ8g";
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
    //return "RequestID69420";
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
    chrome.storage.local.get([req.site], function (result) {

        //Try to get name from cache
        if (nTry == 1 && result != {} && result[req.site] != undefined) {
            cache = result[req.site];

            if (cache[req.name]) {
                console.log("Cached: " + req.name);
                checkLastEpisode(cache[req.name], req.episode, (lastWatched, episode) => {
                    callb({
                        cache: cache[req.name],
                        lastWatched: lastWatched,
                        lastEpisode: episode
                    });
                })

                return true;
            }
        }

        //Cut string else API will throw error
        if (req.name.length > 64)
            req.name = req.name.substring(0, 64);

        fetch("https://api.myanimelist.net/v2/anime?limit=10&q=" + req.name, {
            headers: {
                Authorization: "Bearer " + usertoken.access
            }
        })
            .then(response => response.json())
            .then(responseJSON => {
                if (responseJSON.error) {
                    if (nTry == 10) {
                        callb({ error: "Couldn`t get Result from API:" + JSON.stringify(responseJSON) });
                    } else {
                        getAnime(req, callb, nTry);
                    }
                } else {
                    checkLastEpisode(responseJSON.id, req.episode, (lastWatched, episode) => {
                        responseJSON.lastWatched = lastWatched;
                        responseJSON.lastEpisode = episode;
                        callb(responseJSON);
                    });
                }
            });
    });
    return true;
}

function checkLastEpisode(id, episode, callb) {
    if (checkLastEpisodeBool == false) {
        callb(undefined, undefined);
        return;
    }
    if (episode == 1 || episode == 0) {
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
            body: 'status=completed&num_watched_episodes=' + req.episode + "&score=" + req.rating
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
    }

    getAnimeDetails(req.id, res => {
        //req.force is if last episode isnt actually last episode
        if (res.num_episodes == req.episode && req.force == false) {
            callb({ last: true, next: getSequel(res.related_anime) });
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
    })
    return true;
}

function getAnimeDetails(id, callb) {
    //Gets the episode number of an anime
    fetch("https://api.myanimelist.net/v2/anime/" + id + "?fields=num_episodes,related_anime", {
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

function setCache(req) {
    //Save names in storage
    chrome.storage.local.get([req.site], function (result) {

        let cache = {};

        if (result != {} && result[req.site] != undefined) {
            cache = result[req.site];
        }
        cache[req.name] = req.id;

        chrome.storage.local.set({ [req.site]: cache }, function () { });
    });
    return true;
}

function deleteCache() {
    chrome.storage.local.get(null, function (items) {
        for (let key of Object.keys(items)) {
            if (key.startsWith("MAL_"))
                continue;

            chrome.storage.local.remove(key, () => { });
        }
    });
    return true;
}

//#endregion

//#region Bookmarks

function setBookmark(animeID, oldURL, nextURL) {

    let name = undefined;
    //remove old bookmark
    if (bookmarkID)
        getBookmark(bookmarkID, res => {
            if (res != undefined && res.children.length > 0) {
                for (let child of res.children) {
                    if (child.url == oldURL) {
                        chrome.bookmarks.remove(child.id, () => { });
                    } else {
                        if (child.title.startsWith(animeID)) {
                            name = child.title.substring(animeID.length + 1);
                            chrome.bookmarks.remove(child.id, () => { });
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
    chrome.bookmarks.create({
        'title': name,
        'parentId': "1"
    }, bookmark => {
        bookmarkID = bookmark.id;
        chrome.storage.local.set({ "MAL_Bookmark_ID": bookmark.id }, function () { });
    });
}

function updateBookmarkFolder(folderName) {
    if (folderName == "") {
        return true;
    }
    getBookmark(bookmarkID, res => {
        if (res != undefined) {
            chrome.bookmarks.update(bookmarkID, { title: folderName }, () => { });
        } else {
            createBookmarkFolder(folderName);
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
                                if (curSite == siteNames.length) {
                                    callb();
                                }
                            })
                        });
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
        try {
            chrome.storage.local.get("MAL_Settings_Bookmarks", function (res) {
                if (res.MAL_Settings_Bookmarks != "") {
                    initBookmarkFolder(res.MAL_Settings_Bookmarks);
                }
                callb();
            });

        } catch (ex) {
            chrome.storage.local.set({ "MAL_Settings_Bookmarks": "Anime" }, function () {
                initBookmarkFolder("Anime");
                callb();
            });
        }
    }
    function setting2(callb) {
        try {
            chrome.storage.local.get("MAL_Settings_Active", function (res) {
                if (res.MAL_Settings_Active == true || res.MAL_Settings_Active == false) {
                    active = res.MAL_Settings_Active;
                }
                callb();
            });
        } catch (ex) {
            chrome.storage.local.set({ "MAL_Settings_Active": true }, function (res) {
                active = true;
                callb();
            });
        }
    }
    function setting3(callb) {
        try {
            chrome.storage.local.get("MAL_Settings_DiscordActive", function (_) {
                callb();
            });
        } catch (ex) {
            chrome.storage.local.set({ "MAL_Settings_DiscordActive": false }, function (res) {
                callb();
            });
        }
    }

    setting1(() => {
        setting2(() => {
            setting3(() => {
                callb();
            })
        })
    });
}

function initBookmarkFolder(folderName) {

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

//#endregion