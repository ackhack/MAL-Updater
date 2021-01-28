var auth_code;
var state;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("btnGrant").addEventListener("click", accepted);
}, false);

function accepted() {
    let para = document.getElementById("inputCode").value;

    let urlPattern1 = "code=([^&]+)&state=([^&]+)(&.*)?";
    let urlPattern2 = "state=([^&]+)&code=([^&]+)(&.*)?";

    let res1 = para.match(urlPattern1);
    if (res1) {
        foundMatch(res1[1],res1[2]);
    } else {
        let res2 = para.match(urlPattern2);
        if (res2) {
            foundMatch(res1[2],res1[1]);
        } else {
            document.getElementById("pFeedback").innerText = "No Token found in TextBox";
            return;
        }
    }
}

function foundMatch(auth,st) {
    auth_code = auth;
    state = st;
    // document.getElementById("btnGrant").style = "visibility:hidden;";
    // document.getElementById("inputCode").style = "visibility:hidden;";
    document.getElementById("pFeedback").innerText = "Code sent";
    getUserToken();
}

function getUserToken() {
    chrome.runtime.sendMessage(
        {
            type: "SEND_USERTOKEN",
            token: auth_code,
            state: state
        },
        (res) => {document.getElementById("pFeedback").innerText = res ? "Code accepted" : "Code declined"}
  ); 
}