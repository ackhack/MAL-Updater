run();

function run() {
    let urlPattern1 = "\\?code=([^&]+)&state=([^&]+)(&.*)?";
    let urlPattern2 = "\\?state=([^&]+)&code=([^&]+)(&.*)?";
    let urlDenyPattern = "\\?state=0.\\d+&error=([^&]+)&message=([^&]+)&hint=([^&]+)";

    let res1 = window.location.search.match(urlPattern1);
    if (res1) {
        foundMatch(res1[1], res1[2]);
    } else {
        let res2 = window.location.search.match(urlPattern2);
        if (res2) {
            foundMatch(res1[2], res1[1]);
        } else {
            let deny = window.location.search.match(urlDenyPattern)
            if (deny) {
                document.getElementById("pInfo").innerText =
                    "Error: " + res[1] +
                    "\nMessage: " + res[2] +
                    "\nHint: " + res[3];
            } else {
                alert("No Code/State found\nThis site is only for data transfer, nothing to see here");
                chrome.runtime.sendMessage({ type: "CLOSE_TAB" });
                return;
            }
        }
    }
}

function foundMatch(auth_code, state) {
    chrome.runtime.sendMessage(
        {
            type: "SEND_USERTOKEN",
            token: auth_code,
            state: state
        },
        () => { chrome.runtime.sendMessage({ type: "CLOSE_TAB" }); }
    );
}

//https://ackhack.github.io/MAL-Updater/?state=RequestID0.2731310266&error=access_denied&message=The+resource+owner+or+authorization+server+denied+the+request.&hint=The+user+denied+the+request