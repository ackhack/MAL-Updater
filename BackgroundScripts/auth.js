function getAuthCode() {

    try {
        getUserTokenVariable(usertoken => {
            if (usertoken.access === undefined) {
                getNewAuthCode();
            } else {
                parseUserToken(usertoken);
            }
        });
    } catch (ex) {
        getNewAuthCode();
    }
}

function parseUserToken(usertoken) {
    //If accessToken is valid, refresh it, just in Case and use it
    if (usertoken.access_req_time + usertoken.access_time > Date.now()) {
        return refreshAccessToken(usertoken);
    }

    //If refreshToken is valid, use it
    if (usertoken.refresh_req_time + usertoken.refresh_time > Date.now()) {
        return refreshAccessToken(usertoken);
    }

    //Otherwise get new Tokens
    getNewAuthCode();
}

function refreshAccessToken(usertoken) {

    let para = "client_id=" + client.id +
        "&client_secret=" + client.secret +
        "&grant_type=refresh_token" +
        "&refresh_token=" + usertoken.refresh;

    fetch("https://myanimelist.net/v1/oauth2/token", {
        method: "POST",
        body: para,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    }).then(response => {
        if (response.ok) {
            response.json().then(json => {
                saveAccessToken(json);
            });
        } else {
            sendNotification("Error: " + response.status);
        }
    });
}

function saveAccessToken(res) {
    let usertoken = {};
    usertoken.access = res.access_token;
    usertoken.refresh = res.refresh_token;
    usertoken.access_time = res.expires_in * 1000;
    usertoken.refresh_time = 28 * 24 * 60 * 60 * 1000;
    usertoken.access_req_time = Date.now();
    usertoken.refresh_req_time = Date.now();

    //Save var to storage
    setUserTokenVariable(usertoken);

    //Set update for AccessToken
    let delay = 0.9 * res.expires_in / 60;
    console.log("New Token acquired, next one will be in " + delay + " Minutes");
    chrome.alarms.create("newAccessToken", {
        delayInMinutes: delay
    });
}

function getNewAuthCode() {
    //Generate verifier and state

    function randomString() {
        function generateId(length) {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for (var i = 0; i < length; i++)
                text += possible.charAt(Math.floor(Math.random() * possible.length));

            return text;
        }
        return generateId((Math.random() * 85) + 43);
    }

    function getStateID() {
        return "RequestID" + parseFloat(Math.random().toString()).toFixed(10);
    }

    code_verifier = randomString();
    setCodeVerifierVariable(code_verifier);
    stateID = getStateID();
    setStateIDVariable(stateID);

    //Opens the MAL Auth page
    fetch("https://myanimelist.net/v1/oauth2/authorize?" +
        "response_type=code" +
        "&client_id=" + client.id +
        "&state=" + stateID +
        "&code_challenge=" + code_verifier +
        "&code_challenge_method=plain")
        .then(response => chrome.tabs.create({ url: response.url }));
}

function checkState(req, callb) {

    getStateIDVariable(stateID => {

        //Check if state is the same
        if (req.state != stateID) {
            sendNotification("Error: State is not the same");
            callb(false);
            return false;
        }

        getUserToken(req.token);
        sendNotification("Successfully authorized");
        callb(true);
    });
    return true;
}

function getUserToken(auth_token) {

    getCodeVerifierVariable(code_verifier => {
        let para = "client_id=" + client.id +
            "&client_secret=" + client.secret +
            "&grant_type=authorization_code" +
            "&code=" + auth_token +
            "&code_verifier=" + code_verifier;

        fetch("https://myanimelist.net/v1/oauth2/token", {
            method: "POST",
            body: para,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }).then(response => {
            if (response.ok) {
                response.json().then(json => {
                    saveAccessToken(json);
                });
            } else {
                sendNotification("Error: " + response.status);
            }
        });
    });
}

function unauthorize() {
    changeActiveState(false);
    chrome.storage.local.remove("MAL_User_Token", () => { });
    return true;
}