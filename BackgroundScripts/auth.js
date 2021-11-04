function getAuthCode() {

    try {
        tryGetStorage('MAL_User_Token',"",result => {
            if (result === "") {
                getNewAuthCode();
            } else {
                usertoken = JSON.parse(result);
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

    fetch("https://myanimelist.net/v1/oauth2/token", {
        method: "POST",
        body: para,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    }).then(response => {
        if (response.ok) {
            return response.json().then(json => {
                saveAccessToken(JSON.parse(this.response));
            });
        } else {
            console.log("Error: " + response.status);
        }
    });
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

    function randomString() {
        return generateId((Math.random() * 85) + 43);
    }

    //function that generates a random string of length n
    function generateId(length) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < length; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }
    
    function getStateID() {
        return "RequestID" + parseFloat(Math.random().toString()).toFixed(10);
    }

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

    fetch("https://myanimelist.net/v1/oauth2/token", {
        method: "POST",
        body: para,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    }).then(response => {
        if (response.ok) {
            return response.json().then(json => {
                saveAccessToken(JSON.parse(this.response));
            });
        } else {
            console.log("Error: " + response.status);
        }
    });
}

function unauthorize() {
    changeActiveState(false);
    chrome.storage.local.remove("MAL_User_Token", () => { });
    usertoken = undefined;
    return true;
}