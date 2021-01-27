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
        auth_code = res1[1];
        state = res1[2];
        getUserToken();
    } else {
        let res2 = para.match(urlPattern2);
        if (res2) {
            auth_code = res1[2];
            state = res1[1];
            getUserToken();
        } else {
            alert("No Token found in TextBox");
            return;
        }
    }
}

function getUserToken() {
    chrome.runtime.sendMessage(
        {
            type: "SEND_USERTOKEN",
            token: auth_code,
            state: state
        },
        () => {}
  ); 
}