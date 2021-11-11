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

function addDiscord(callb = () => { }) {
    getDiscordTabIdVariable(discordTabId => {
        if (discordTabId == -1) {
            createDiscordWindow(callb);
        } else {
            chrome.tabs.get(discordTabId, tab => {
                if (chrome.runtime.lastError) {
                    createDiscordWindow(callb);
                } else {
                    callb(tab.id);
                }
            })
        }
    });
}

function createDiscordWindow(callb = () => { }) {
    console.log("Discord: Creating Window");
    chrome.tabs.create({ url: "https://discord.com/channels/@me", active: false }, (tab) => {
        if (chrome.runtime.lastError) {
            return;
        }
        chrome.tabs.update(tab.id, { autoDiscardable: false, muted: true });
        setDiscordTabIdVariable(tab.id);
        callb(tab.id);
    });
}

function removeDiscord() {
    getDiscordTabIdVariable(discordTabId => {
        if (discordTabId == -1) {
            return;
        }
        console.log("Discord: Removing Window");
        chrome.tabs.remove(discordTabId);
        setDiscordTabIdVariable(-1);
    });
    return true;
}

function setDiscordStatus(message) {
    addDiscord(() => {
        latestMessage = {
            valid: true,
            empty: false,
            msg: message
        }
    });
}

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    if (request.type == "getDiscordStatus") {
        console.log("Discord: Sending " + (latestMessage.msg ? latestMessage.msg.details : "No Status"));
        sendResponse(latestMessage);
    }
    if (request.type = "closeDiscord") {
        if (latestMessage.close)
            removeDiscord();
    }
});

var latestMessage = {
    valid: true,
    empty: true,
    msg: null
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.type) {
        case "CHANGED_ACTIVE_DISCORD":
            return changeActiveDiscordState(request.value);
        case "REMOVE_DRP":
            return removeDiscord();
        case "DISCORD_PRESENCE":
            getDiscordActiveVariable(discordActive => {
                if (discordActive) {
                    getDiscordRecentInfoVariable(recentInfo => {
                        if (request.active) {
                            setDiscordRecentInfoVariable({ name: request.name, episode: request.episode });
                            setDiscordStatus({
                                type: 3,
                                name: "Anime",
                                episode: request.episode,
                                streamurl: "",
                                details: request.name,
                                state: "Episode " + request.episode + (request.maxEpisode ? "/" + request.maxEpisode : ""),
                                partycur: "",
                                partymax: "",
                            });

                        } else {
                            if (recentInfo.name == request.name && recentInfo.episode == request.episode) {
                                setDiscordRecentInfoVariable({ name: "", episode: "" });
                                latestMessage = {
                                    valid: true,
                                    close: true
                                }
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