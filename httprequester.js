const code_verfier = randomString();
const stateID = getStateID();
var client;

function readClient() {
    let url = chrome.runtime.getURL('secret.json');

    if (!url) {
        updateStatus("No secret.json", "No API Data found")
        return false;
    }

    fetch(url)
        .then((response) => {
            response.json().then((json) => {
                client = json;
                getAuthCode();
            })
        });
    return true;
}

chrome.runtime.onMessage.addListener(
    function (request, sender, onSuccess) {
        switch (request.type) {
            case "GET_AUTH":
                readClient();
                return true;
            case "GET_ANIME":
                getAnime(request, onSuccess);
                return true;
            case "GET_USERTOKEN":
                getUserToken(request);
                return true;
            default:
                return false;
        }
    }
);

function getAnime(req, callb) {

    fetch("https://api.myanimelist.net/v2/anime?limit=1&q=" + req.name, {
        headers: {
            Authorization: "Bearer " + req.client.secret
        }
    })
        .then(response => response.text())
        .then(responseText => callb(responseText));
    return true;  // Will respond asynchronously.
}

function getAuthCode() {

    fetch("https://myanimelist.net/v1/oauth2/authorize?" +
        "response_type=code" +
        "&client_id=" + client.id +
        "&state=" + stateID +
        "&code_challenge=" + code_verfier +
        "&code_challenge_method=plain")
        .then(response => chrome.tabs.create({ url: response.url }));
}

function randomString() {
    return generateId(Math.random() * 128);
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

function getUserToken(req) {
    //req.token

    if (req.state != stateID) {
        alert("States did not match!");
        return;
    }

    fetch("https://myanimelist.net/v1/oauth2/token?" +
        "client_id=" + client.id +
        "&client_secret=" + client.secret +
        "&code=" + req.token +
        "&code_verifier=" + code_verfier +
        "&grant_type=authorization_code")
        .then(response => {
            console.log(response);
        });
}