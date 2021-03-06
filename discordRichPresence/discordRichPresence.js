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
let isActive = false;
let lastUpdate = Date.now();
let updateQueue = undefined;
let discordPort;
let recentName = "";
let recentEpisode = 0;

chrome.storage.local.get("MAL_Settings_DiscordActive", function (res) {
    if (res.MAL_Settings_DiscordActive == true) {
        isActive = true;
    }
});

function changeActiveDiscordState(val) {
    isActive = val;
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

chrome.runtime.onConnect.addListener((port) => {
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
    if (nTry == 10)
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
            discordPort.postMessage(updateQueue);
            updateQueue = undefined;
        }, updateCycleTime - (time - lastUpdate));
    }
}