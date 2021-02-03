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
                return validateSite(request,onSuccess);
            default:
                return false;
        }
    }
);

function init() {
    initSecret(() => { initSites(function () { console.log(sites) }) });
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

function debug_removeStorage() {
    chrome.storage.local.remove(["MAL_User_Token"], function (res) { console.log(res) });
}
function debug_clearStorage() {
    chrome.storage.local.clear(function (res) { console.log(res) });
}

function removeAnimeCache(animename,sitename) {
    chrome.storage.local.get([sitename], function (result) {

        result[sitename][animename] = undefined;

        chrome.storage.local.set({ [sitename]: result }, function () { });
    });
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

            let res = JSON.parse(this.response);

            //Save Tokens and Time in var
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
    }

    xhr.send(para);
}

function pendNewAccessToken(time) {
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
            let res = JSON.parse(this.response);

            //Save Tokens and Time in var
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
    }

    xhr.send(para);
}

function closeTab(sender) {
    chrome.tabs.remove(sender.tab.id);
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

function getAnime(req, callb, nTry = 0) {
    nTry++;
    chrome.storage.local.get([req.site], function (result) {

        //Try to get name from cache
        if (nTry == 1 && result != {} && result[req.site] != undefined) {
            cache = result[req.site];

            if (cache[req.name]) {
                console.log("Cached: " + req.name);
                callb({ cache: cache[req.name] });
                return true;
            }
        }

        if (req.name.length > 64)
            req.name = req.name.substring(0, 64);

        fetch("https://api.myanimelist.net/v2/anime?limit=10&q=" + req.name, {
            headers: {
                Authorization: "Bearer " + usertoken.access
            }
        })
            .then(response => response.json())
            .then(responseJSON => {
                console.log(responseJSON);
                if (responseJSON.error) {
                    if (nTry == 10) {
                        callb({ error: "Couldn`t get Result from API:" + JSON.stringify(responseJSON) });
                    } else {
                        getAnime(req, callb, nTry);
                    }
                } else {
                    callb(responseJSON);
                }
            });
    });
    return true;
}

function finishedEpisode(req, callb) {
    fetch("https://api.myanimelist.net/v2/anime/" + req.id + "/my_list_status", {
        method: "PUT",
        headers: {
            "Authorization": "Bearer " + usertoken.access,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: 'status=watching&num_watched_episodes=' + req.episode
    })
        .then(response => {
            console.log(response);
            response.json().then(responseJSON => callb(responseJSON));
        });

    return true;
}

function validateSite(req,callb) {
    for (let site in sites) {
        if (req.url.match(sites[site].sitePattern)) {
            callb(sites[site]);
            return true;
        }
    }
    callb(undefined);
    return false;
}

function readDirectory(directory, callb) {
    let entries = [];
    directory.createReader().readEntries(function (results) {
        for (let page of results) {
            entries = entries.concat(page.name);
        }
        callb(entries);
    });
}

function initSites(callb) {
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
    chrome.runtime.getPackageDirectoryEntry(function (storageRootEntry) {
        fileExists(storageRootEntry, 'Resources/secret.json', function (isExist) {
            if (isExist) {
                let url = chrome.runtime.getURL('Resources/secret.json');
                console.log(url);
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