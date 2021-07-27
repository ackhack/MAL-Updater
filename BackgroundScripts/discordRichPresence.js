//Enables Discord to be loaded into iframe
chrome.webRequest.onHeadersReceived.addListener(
    function (info) {
        let headers = info.responseHeaders;
        for (let i = headers.length - 1; i >= 0; --i) {
            let header = headers[i].name.toLowerCase();
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

const updateCycleTime = 15_000;
var discordActive;
var lastUpdate = Date.now();
var updateQueue = undefined;
var discordPort;
var recentName = "";
var recentEpisode = 0;

function changeActiveDiscordState(val) {
    discordActive = val;
    if (!val) {
        removeDiscord();
    } else {
        if (confirm("Please make to sure be logged in in DiscordWeb")) {
            chrome.tabs.create({ url: "https://discord.com/login" }, () => { })
        }
    }
    return true;
}

function addDiscord() {
    if (document.getElementById("iframeDiscord") == null) {
        let iframe = document.createElement("iframe");
        iframe.height = "1px";
        iframe.width = "1px";
        iframe.id = "iframeDiscord";
        iframe.src = "https://discord.com/channels/@me";
        document.documentElement.appendChild(iframe);
        console.log("Discord on");
    }
}

function removeDiscord() {
    let iframe = document.getElementById("iframeDiscord");
    if (iframe) {
        iframe.remove();
        console.log("Discord off");
    }
    return true;
}

chrome.runtime.onConnect.addListener((port) => {
    if (!discordActive) {
        return;
    }
    if (port.name == "discord") {
        if (discordPort !== undefined) {
            discordPort.postMessage({ action: "close" });
            discordPort.disconnect();
        }
        discordPort = port;
        console.info("Discord port opened");
        port.onDisconnect.addListener(() => {
            console.info("Discord port closed");
            discordPort = undefined;
        });
    } else {
        console.error("Denied connection with unexpected name:", port.name);
        port.disconnect();
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
        case "CHANGED_ACTIVE_DISCORD":
            return changeActiveDiscordState(request.value);
        case "REMOVE_DRP":
            return removeDiscord();
        case "DISCORD_PRESENCE":
            if (discordActive) {
                addDiscord();
                waitForLoad(() => {
                    if (request.active) {
                        if (recentName == request.name && recentEpisode == request.episode) {
                            return true;
                        }
                        recentName = request.name;
                        recentEpisode = request.episode;
                        setDiscordPresence({
                            type: 3,
                            name: "Anime",
                            streamurl: "",
                            details: request.name,
                            state: "Episode " + request.episode + (request.maxEpisode ? "/" + request.maxEpisode : ""),
                            partycur: "",
                            partymax: "",
                        });
                    } else {
                        if (recentName == request.name && recentEpisode == request.episode) {
                            setTimeout(() => {
                                if (Date.now() - updateCycleTime > lastUpdate && updateQueue === undefined) {
                                    recentName = undefined;
                                    recentEpisode = undefined;
                                    removeDiscord();
                                }
                            }, updateCycleTime);
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
    if (nTry > 9)
        return;

    setTimeout(() => {
        waitForLoad(callb, nTry);
    }, 1000);
}

function setDiscordPresence(obj) {

    //Renew UpdateQueue if new DRP is avaiable
    if (updateQueue !== undefined) {
        updateQueue = obj;
        return;
    }

    let time = Date.now();
    if (time - updateCycleTime > lastUpdate) {
        //Send Update instant if lastUpdate is old
        lastUpdate = time;
        discordPort.postMessage(obj);
    } else {
        //Send Update when some Time has passed
        updateQueue = obj;
        setTimeout(() => {
            lastUpdate = Date.now();
            discordPort?.postMessage(updateQueue);
            updateQueue = undefined;
        }, updateCycleTime - (time - lastUpdate));
    }
}