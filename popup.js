var auth_code;
var state;

document.addEventListener('DOMContentLoaded', () => {
    let para = document.getElementById("inputCode").innerText;

    let urlPattern1 = "code=([^&]+)&state=([^&]+)(?>&.*)?";
    let urlPattern2 = "state=([^&]+)&code=([^&]+)(?>&.*)?";

    let res1 = para.match(urlPattern1);
    if (res1) {
        auth_code = res1[1];
        state = res1[2];
    } else {
        let res2 = para.match(urlPattern2);
        if (res2) {
            auth_code = res1[2];
            state = res1[1];
        } else {
            alert("No Token found in URL");
            return;
        }
    }
    document.getElementById("btnGrant").addEventListener("click", accepted);
}, false);

function accepted() {
    // chrome.storage.local.set({ "mal_updater_token": document.getElementById("inputCode").innerText}, function(){
    // });
    getUserToken();
}

function getUserToken() {
    chrome.runtime.sendMessage(
        {
            type: "GET_USERTOKEN",
            token: auth_code,
            state: state
        },
        _
  ); 
}