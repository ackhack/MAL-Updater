var client;

function readClient() {
    let url = chrome.runtime.getURL('secret.json');

    if (!url) {
        updateStatus("No secret.json","No API Data found")
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

    fetch("https://api.myanimelist.net/v1/oauth2/authorize?" +
    "response_type=code" +
    "&client_id=" + client.id +
    "&state=RequestID42" +
    "&code_challenge=" + randomString() +
    "&code_challenge_method=plain")
    .then(response => console.log(response));
}

function randomString() {
    return "NklUDX_CzS8qrMGWaDzgKs6VqrinuVFHa0xnpWPDy7_fggtM6kAar4jnTwOgzK7nPYfE9n60rsY4fhDExWzr5bf7sEvMMmSXcT2hWkCstFGIJKoaimoq5GvAEQD8NZ8g";
}

