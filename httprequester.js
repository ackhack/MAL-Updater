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

init();

chrome.runtime.onMessage.addListener(
    function (request, sender, onSuccess) {
        switch (request.type) {
            case "GET_ANIME":
                return getAnime(request, onSuccess);
            case "SEND_USERTOKEN":
                return checkState(request);
            case "SEND_ANIME_FINISHED":
                return finishedEpisode(request, onSuccess);
            default:
                return false;
        }
    }
);

function init() {
    let url = chrome.runtime.getURL('secret.json');

    if (!url) {
        updateStatus("No secret.json", "No API Data found")
    }

    fetch(url)
        .then((response) => {
            response.json().then((json) => {
                client = json;
                getAuthCode();
            })
        });
}

function getAuthCode() {
    //chrome.storage.local.remove(["MAL_User_Token"], function () {});
    chrome.storage.local.get(['MAL_User_Token'], function (result) {

        if (result.MAL_User_Token == undefined) {
            getNewAuthCode();
        } else {
            usertoken = JSON.parse(result.MAL_User_Token);
            parseUserToken();
        }
    });
}

function parseUserToken() {
    if (usertoken.access_req_time + usertoken.access_time > Date.now()) {
        pendNewAccessToken(usertoken.access_req_time + usertoken.access_time - Date.now());
        return;
    }

    if (usertoken.refresh_req_time + usertoken.refresh_time > Date.now()) {
        return refreshAccessToken();
    }

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
            usertoken.access = res.access_token;
            usertoken.refresh = res.refresh_token;
            usertoken.access_time = res.expires_in * 1000;
            usertoken.refresh_time = 31 * 24 * 60 * 60 * 1000;
            usertoken.access_req_time = Date.now();
            usertoken.refresh_req_time = Date.now();
            chrome.storage.local.set({ MAL_User_Token: JSON.stringify(usertoken) }, function () { });
            pendNewAccessToken(usertoken.access_time);
        }
    }

    xhr.send(para);
}

function pendNewAccessToken(time) {
    setTimeout(() => {
        console.log("Getting new Token");
        refreshAccessToken();
    }, time);
}

function getNewAuthCode() {
    code_verifier = randomString();
    stateID = getStateID();

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

function checkState(req) {

    if (req.state != stateID) {
        alert("States did not match!");
        return false;
    }

    auth_token = req.token;
    getUserToken();
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
            usertoken.access = res.access_token;
            usertoken.refresh = res.refresh_token;
            usertoken.access_time = res.expires_in;
            usertoken.refresh_time = 31 * 24 * 60 * 60;
            usertoken.access_req_time = Date.now();
            usertoken.refresh_req_time = Date.now();
            chrome.storage.local.set({ MAL_User_Token: JSON.stringify(usertoken) }, function () { });
        }
    }

    xhr.send(para);
}

//API Calls from Sites

function getAnime(req, callb) {
    fetch("https://api.myanimelist.net/v2/anime?limit=10&q=" + req.name, {
        headers: {
            Authorization: "Bearer " + usertoken.access
        }
    })
        .then(response => response.json())
        .then(responseJSON => callb(responseJSON));
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
        .then(response => response.json())
        .then(responseJSON => callb(responseJSON));
    return true;
}