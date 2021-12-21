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
    console.log("[Discord] Creating Window");
    chrome.tabs.create({ url: "https://discord.com/channels/@me", active: false }, (tab) => {
        if (chrome.runtime.lastError) {
            return;
        }
        chrome.tabs.update(tab.id, { autoDiscardable: false, muted: true });
        setDiscordTabIdVariable(tab.id);
        setDiscordLatestMessageVariable({ valid: true, empty: true });
        callb(tab.id);
    });
}

function removeDiscord() {
    getDiscordTabIdVariable(discordTabId => {
        if (discordTabId == -1) {
            return;
        }
        console.log("[Discord] Removing Window");
        chrome.tabs.remove(discordTabId);
        setDiscordTabIdVariable(-1);
    });
    return true;
}

function setDiscordStatus(message) {
    addDiscord(() => {
        setDiscordLatestMessageVariable({
            valid: true,
            empty: false,
            msg: message
        });
    });
}

function handleDiscordPresence(request) {
    getDiscordActiveVariable(discordActive => {
        if (discordActive) {
            getCacheById(request.id, anime => { 
                getDiscordRecentInfoVariable(recentInfo => {
                    if (request.active) {
                        let name = getAnimeTitle(anime);
                        setDiscordRecentInfoVariable({ name: name, episode: request.episode });
                        setDiscordStatus({
                            type: 3,
                            name: "Anime",
                            episode: request.episode,
                            streamurl: "",
                            details: name,
                            state: "Episode " + request.episode + (anime.meta.num_episodes ? "/" + anime.meta.num_episodes : ""),
                            partycur: "",
                            partymax: "",
                        });
    
                    } else {
                        if (recentInfo.name == request.name && recentInfo.episode == request.episode) {
                            setDiscordRecentInfoVariable({ name: "", episode: "" });
                            setDiscordLatestMessageVariable({
                                valid: true,
                                close: true
                            });
                        }
                    }
                });    
            })
        } else {
            removeDiscord();
        }
    });
}

function handleDiscordExternal(request,sender,sendResponse) {
    getDiscordLatestMessageVariable(latestMessage => {
        if (request.type == "getDiscordStatus") {
            console.log("[Discord] Sending " + (latestMessage.msg ? latestMessage.msg.details : latestMessage.close ? "Closing" : "No Status"));
            sendResponse(latestMessage);
        }
        if (request.type == "closeDiscord" && latestMessage.close) {
            removeDiscord();
        }
        return true;
    });
}