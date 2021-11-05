const updateCycleTime = 15_000;

function changeActiveDiscordState(val) {
    setDiscordActiveVariable(val);
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
    chrome.tabs.create({ url: "https://discord.com/channels/@me", active: false }, (tab) => {
        chrome.tabs.update(tab.id, { muted: true });
        setDiscordTabIdVariable(tab.id);
    });
}

function removeDiscord() {
    getDiscordTabIdVariable(discordTabId => {
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
            getDiscordPortVariable(discordPort => {
                if (discordPort !== undefined) {
                    discordPort.postMessage({ action: "close" });
                    discordPort.disconnect();
                }
                setDiscordPortVariable(port);
                console.info("Discord port opened");
                port.onDisconnect.addListener(() => {
                    console.info("Discord port closed");
                    setDiscordPortVariable(undefined);
                });
            });
        } else {
            console.error("Denied connection with unexpected name:", port.name);
            port.disconnect();
        }
    });
});

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
                        let port = undefined;
                        let i = 0;
                        while (port === undefined) {
                            getDiscordPortVariable(discordPort => {
                                port = discordPort;
                            });
                            if (i > 1000) {
                                return;
                            }
                            i++;
                        }
                        if (request.active) {
                            if (recentInfo.name == request.name && recentInfo.episode == request.episode) {
                                return true;
                            }
                            setDiscordRecentInfoVariable({ name: request.name, episode: request.episode });
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
                            if (recentInfo.name == request.name && recentInfo.episode == request.episode && updateQueue === undefined)
                                removeDiscord();
                        }
                    });
                }
            });
            return true;
        default:
            return false;
    }
});

function setDiscordPresence(obj) {

    getDiscordPortVariable(discordPort => {

        if (discordPort !== undefined) {
            return;
        }
        discordPort?.postMessage(obj);
    });
}