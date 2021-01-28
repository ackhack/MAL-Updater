run();

function run() {
    //Try to match know URLs
    let urlPattern1 = "\\?code=([^&]+)&state=([^&]+)(&.*)?";
    let urlPattern2 = "\\?state=([^&]+)&code=([^&]+)(&.*)?";
    let urlDenyPattern = "\\?state=([^&]+)&error=([^&]+)&message=([^&]+)&hint=([^&]+)";

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
                //Access was denied
                document.getElementById("pInfo").innerText =
                    "Error: " + deny[2].replace(/\+/g," ") +
                    "\nMessage: " + deny[3].replace(/\+/g," ") +
                    "\nHint: " + deny[4].replace(/\+/g," ");
            } else {
                //Unknown URL
                alert("No Code/State found\nThis site is only for data transfer, nothing to see here");
                chrome.runtime.sendMessage({ type: "CLOSE_TAB" });
                return;
            }
        }
    }
}

function foundMatch(auth_code, state) {
    //Validate vars in httprequester.js
    chrome.runtime.sendMessage(
        {
            type: "SEND_USERTOKEN",
            token: auth_code,
            state: state
        },
        () => {
            //chrome.runtime.sendMessage({ type: "CLOSE_TAB" });
        }
    );
}