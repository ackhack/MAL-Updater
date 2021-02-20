//Enables Discord to be loaded into iframe
chrome.webRequest.onHeadersReceived.addListener(
    function (info) {
        var headers = info.responseHeaders;
        for (var i = headers.length - 1; i >= 0; --i) {
            var header = headers[i].name.toLowerCase();
            if (header == "x-frame-options" || header == "frame-options") {
                headers.splice(i, 1); // Remove header
            }
        }
        return { responseHeaders: headers };
    },
    {
        urls: ["https://discord.com/channels/@me"],
        types: ["sub_frame"],
    },
    [
        "blocking",
        "responseHeaders",
        // Modern Chrome needs 'extraHeaders' to see and change this header,
        // so the following code evaluates to 'extraHeaders' only in modern Chrome.
        chrome.webRequest.OnHeadersReceivedOptions.EXTRA_HEADERS,
    ].filter(Boolean)
);

var isActive = false;

chrome.storage.local.get("MAL_Settings_DiscordActive", function (res) {
    if (res.MAL_Settings_DiscordActive == true) {
        isActive = true;
    }
});

function changeActiveDiscordState(val) {
    isActive = val;
    if (!val) {
        removeDiscord();
    }
    return true;
}

function addDiscord() {  
    if (document.getElementById("iframe1") == null) {
        let iframe = document.createElement("iframe");
        iframe.height = "1px";
        iframe.width = "1px";
        iframe.id = "iframe1";
        iframe.src = "https://discord.com/channels/@me";
        document.documentElement.appendChild(iframe);
        console.log("Discord on");
    }
}

function removeDiscord() { 
    let iframe = document.getElementById("iframe1");
    if (iframe) {
        iframe.remove();
        console.log("Discord off");
    }
}

let discordPort;
const resetActivity = () => {
    if (discordPort !== undefined) {
        discordPort.postMessage({
            type: 0,
            name: "",
            streamurl: "",
            details: "",
            state: "",
            partycur: "",
            partymax: "",
        });
    }
};

chrome.runtime.onConnect.addListener((port) => {
    if (port.name == "discord") {
        if (discordPort !== undefined) {
            discordPort.postMessage({ action: "close" });
            discordPort.disconnect();
        }
        discordPort = port;
        console.info("Discord port opened");
        resetActivity();
        port.onDisconnect.addListener(() => {
            console.info("Discord port closed");
            discordPort = undefined;
        });
    } else {
        console.error("Denied connection with unexpected name:", port.name);
        port.disconnect();
    }
});

var recentName = "";
var recentEpisode = 0;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
        case "CHANGED_ACTIVE_DISCORD":
            return changeActiveDiscordState(request.value);
        case "DISCORD_PRESENCE":
            if (isActive) {
                addDiscord();
                waitForLoad(() => {
                    if (request.active) {
                        if (recentName == request.name && recentEpisode == request.episode) {
                            return;
                        }
                        recentName = request.name;
                        recentEpisode = request.episode;
                        setDiscordPresence({
                            type: 3,
                            name: "Anime",
                            streamurl: "",
                            details: request.name,
                            state: request.episode,
                            partycur: "",
                            partymax: "",
                        });
                    } else {
                        if (recentName == request.name && recentEpisode == request.episode) {
                            recentName = undefined;
                            recentEpisode = undefined;
                            resetActivity();
                            removeDiscord();
                        }
                    }
                })

            }
            return true;
        default:
            return false;
    }
});

function waitForLoad(callb, nTry = 0) {

    if (discordPort !== undefined) {
        callb();
        return;
    }

    nTry++;
    if (nTry == 10)
        return;

    setTimeout(() => {
        waitForLoad(callb, nTry);
    }, 1000);
}

function setDiscordPresence(obj) {
    discordPort.postMessage(obj);
}