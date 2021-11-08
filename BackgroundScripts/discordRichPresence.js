const updateCycleTime = 15_000;

function changeActiveDiscordState(val) {
    setDiscordActiveVariable(val);
    if (!val) {
        removeDiscord();
    } else {
        confirmMessage("Please make to sure be logged in in DiscordWeb", result => {
            if (result) {
                chrome.tabs.create({ url: "https://discord.com/login" }, () => { })
            }
        })
    }
    return true;
}

function addDiscord() {
    getDiscordTabIdVariable(discordTabId => {
        if (discordTabId == -1) {
            createDiscordWindow();
        } else {
            chrome.tabs.get(discordTabId, tab => {
                if (chrome.runtime.LastError) {
                    createDiscordWindow();
                }
            })
        }
    });
}

function createDiscordWindow() {
    chrome.tabs.create({ url: "https://discord.com/channels/@me", active: false }, (tab) => {
        chrome.tabs.update(tab.id, { muted: true });
        setDiscordTabIdVariable(tab.id);
    });
}

function removeDiscord() {
    getDiscordTabIdVariable(discordTabId => {
        if (discordTabId == -1) {
            return;
        }
        chrome.tabs.remove(discordTabId);
        setDiscordTabIdVariable(-1);
    });
    return true;
}

chrome.runtime.onConnect.addListener((port) => {
    getDiscordActiveVariable(discordActive => {
        if (!discordActive) {
            return;
        }
        if (port.name == "discord") {
            console.info("Discord port opened");
            discordPort = port;
            if (messageToSend != undefined) {
                port?.postMessage(messageToSend);
                messageToSend = undefined;
            }
            port.onDisconnect.addListener(() => {
                discordPort = null;
                console.info("Discord port closed");
            });
        } else {
            console.error("Denied connection with unexpected name:", port.name);
            port.disconnect();
        }
    });
});

var discordPort = null;
var messageToSend = undefined;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
        case "CHANGED_ACTIVE_DISCORD":
            return changeActiveDiscordState(request.value);
        case "REMOVE_DRP":
            return removeDiscord();
        case "DISCORD_PRESENCE":
            getDiscordActiveVariable(discordActive => {
                if (discordActive) {
                    addDiscord();
                    getDiscordRecentInfoVariable(recentInfo => {
                        if (request.active) {
                            if (recentInfo.name == request.name && recentInfo.episode == request.episode) {
                                return;
                            }

                            setDiscordRecentInfoVariable({ name: request.name, episode: request.episode });

                            let msg = {
                                type: 3,
                                name: "Anime",
                                streamurl: "",
                                details: request.name,
                                state: "Episode " + request.episode + (request.maxEpisode ? "/" + request.maxEpisode : ""),
                                partycur: "",
                                partymax: "",
                            };

                            discordPort?.postMessage(msg);
                            if (discordPort == null)
                                messageToSend = msg;

                        } else {  
                            if (recentInfo.name == request.name && recentInfo.episode == request.episode){
                                setDiscordRecentInfoVariable({ name: "", episode: "" });
                                removeDiscord();
                            }
                        }
                    });
                } else {
                    removeDiscord();
                }
            });
            return true;
        default:
            return false;
    }
});