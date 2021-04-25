run();

function run() {
    //Try to match know URLs
    let urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has("error")) {
        document.getElementById("pInfo").innerText =
                    "Error: " + urlParams.get("error").replace(/\+/g," ") +
                    "\nMessage: " + urlParams.get("message").replace(/\+/g," ") +
                    "\nHint: " + urlParams.get("hint").replace(/\+/g," ");
        return;
    }

    if (urlParams.has("code") && urlParams.has("state")) {
        chrome.runtime.sendMessage(
            {
                type: "SEND_USERTOKEN",
                token: urlParams.get("code"),
                state: urlParams.get("state")
            },
            () => {
                chrome.runtime.sendMessage({ type: "CLOSE_TAB" });
            }
        );
        return;
    }

    alert("No Code/State found\nThis site is only for data transfer, nothing to see here");
    chrome.runtime.sendMessage({ type: "CLOSE_TAB" });
    return;
}