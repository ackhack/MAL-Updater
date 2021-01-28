run();

function run() {
    let urlPattern1 = "\\?code=([^&]+)&state=([^&]+)(&.*)?";
    let urlPattern2 = "\\?state=([^&]+)&code=([^&]+)(&.*)?";

    let res1 = window.location.search.match(urlPattern1);
    if (res1) {
        foundMatch(res1[1], res1[2]);
    } else {
        let res2 = para.match(urlPattern2);
        if (res2) {
            foundMatch(res1[2], res1[1]);
        } else {
            alert("This site is only for data transfer, nothing to see here");
            window.close();
            return;
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
        () => {
            window.close();
        }
    );
}