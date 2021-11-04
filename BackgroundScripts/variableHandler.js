function getSitesVariable(callback) {
    chrome.storage.local.get("sites", function(result) {
        callback(result.sites ?? []);
    });
}

function setSitesVariable(sites) {
    chrome.storage.local.set({sites: sites});
}

function getActiveVariable(callback) {
    chrome.storage.local.get("active", function(result) {
        callback(result.active ?? true);
    });
}

function setActiveVariable(active) {
    chrome.storage.local.set({active: active});
}

function getCheckLastEpisodeBoolVariable(callback) {
    chrome.storage.local.get("checkLastEpisode", function(result) {
        callback(result.checkLastEpisode ?? true);
    });
}

function setCheckLastEpisodeBoolVariable(checkLastEpisode) {
    chrome.storage.local.set({checkLastEpisode: checkLastEpisode});
}

function getBingeVariable(callback) {
    chrome.storage.local.get("binge", function(result) {
        callback(result.binge ?? new Set());
    });
}

function setBingeVariable(binge) {
    chrome.storage.local.set({binge: binge});
}

function getAnimeCacheVariable(callback) {
    chrome.storage.local.get("animeCache", function(result) {
        callback(result.animeCache ?? {});
    });
}

function setAnimeCacheVariable(animeCache) {
    chrome.storage.local.set({animeCache: animeCache});
}

function getDisplayModeVariable(callback) {
    chrome.storage.local.get("displayMode", function(result) {
        callback(result.displayMode ?? true);
    });
}

function setDisplayModeVariable(displayMode) {
    chrome.storage.local.set({displayMode: displayMode});
}

function getClientVariable(callback) {
    chrome.storage.local.get("client", function(result) {
        callback(result.client ?? "");
    });
}

function setClientVariable(client) {
    chrome.storage.local.set({client: client});
}

function getCodeVerifierVariable(callback) {
    chrome.storage.local.get("codeVerifier", function(result) {
        callback(result.codeVerifier ?? "");
    });
}

function setCodeVerifierVariable(codeVerifier) {
    chrome.storage.local.set({codeVerifier: codeVerifier});
}

function getStateIDVariable(callback) {
    chrome.storage.local.get("stateID", function(result) {
        callback(result.stateID ?? "");
    });
}

function setStateIDVariable(stateID) {
    chrome.storage.local.set({stateID: stateID});
}

function getAuthTokenVariable(callback) {
    chrome.storage.local.get("authToken", function(result) {
        callback(result.authToken ?? "");
    });
}

function setAuthTokenVariable(authToken) {
    chrome.storage.local.set({authToken: authToken});
}

function getUserTokenVariable(callback) {
    chrome.storage.local.get("userToken", function(result) {
        callback(result.userToken ?? {
            access: undefined,
            refresh: undefined,
            access_time: undefined,
            refresh_time: undefined,
            access_req_time: undefined,
            refresh_req_time: undefined
        });
    });
}

function setUserTokenVariable(userToken) {
    chrome.storage.local.set({userToken: userToken});
}

function getBookmarkIDVariable(callback) {
    chrome.storage.local.get("bookmarkID", function(result) {
        callback(result.bookmarkID ?? -1);
    });
}

function setBookmarkIDVariable(bookmarkID) {
    chrome.storage.local.set({bookmarkID: bookmarkID});
}

function getBookmarkActiveVariable(callback) {
    chrome.storage.local.get("bookmarkActive", function(result) {
        callback(result.bookmarkActive ?? false);
    });
}

function setBookmarkActiveVariable(bookmarkActive) {
    chrome.storage.local.set({bookmarkActive: bookmarkActive});
}

function setPreferredSiteNameVariable(preferredSiteName) {
    chrome.storage.local.set({preferredSiteName: preferredSiteName});
}

function setPreferredSiteIDVariable(preferredSiteID) {
    chrome.storage.local.set({preferredSiteID: preferredSiteID});
}

function getBookmarkAutoActiveVariable(callback) {
    chrome.storage.local.get("bookmarkAutoActive", function(result) {
        callback(result.bookmarkAutoActive ?? false);
    });
}

function setBookmarkAutoActiveVariable(bookmarkAutoActive) {
    chrome.storage.local.set({bookmarkAutoActive: bookmarkAutoActive});
}

function getBookmarkAutoRunningVariable(callback) {
    chrome.storage.local.get("bookmarkAutoRunning", function(result) {
        callback(result.bookmarkAutoRunning ?? false);
    });
}

function setBookmarkAutoRunningVariable(bookmarkAutoRunning) {
    chrome.storage.local.set({bookmarkAutoRunning: bookmarkAutoRunning});
}

function getDiscordActiveVariable(callback) {
    chrome.storage.local.get("discordActive", function(result) {
        callback(result.discordActive ?? false);
    });
}

function setDiscordActiveVariable(discordActive) {
    chrome.storage.local.set({discordActive: discordActive});
}

function getDiscordLastUpdateVariable(callback) {
    chrome.storage.local.get("discordLastUpdate", function(result) {
        callback(result.discordLastUpdate ?? 0);
    });
}

function setDiscordLastUpdateVariable(discordLastUpdate) {
    chrome.storage.local.set({discordLastUpdate: discordLastUpdate});
}

function getDiscordUpdateQueueVariable(callback) {
    chrome.storage.local.get("discordUpdateQueue", function(result) {
        callback(result.discordUpdateQueue ?? []);
    });
}

function setDiscordUpdateQueueVariable(discordUpdateQueue) {
    chrome.storage.local.set({discordUpdateQueue: discordUpdateQueue});
}

function getDiscordPortVariable(callback) {
    chrome.storage.local.get("discordPort", function(result) {
        callback(result.discordPort ?? 0);
    });
}

function setDiscordPortVariable(discordPort) {
    chrome.storage.local.set({discordPort: discordPort});
}

function getDiscordRecentNameVariable(callback) {
    chrome.storage.local.get("discordRecentName", function(result) {
        callback(result.discordRecentName ?? "");
    });
}

function setDiscordRecentNameVariable(discordRecentName) {
    chrome.storage.local.set({discordRecentName: discordRecentName});
}

function getDiscordRecentEpisodeVariable(callback) {
    chrome.storage.local.get("discordRecentEpisode", function(result) {
        callback(result.discordRecentEpisode ?? "");
    });
}

function setDiscordRecentEpisodeVariable(discordRecentEpisode) {
    chrome.storage.local.set({discordRecentEpisode: discordRecentEpisode});
}

function getHistoryVariable(callback) {
    chrome.storage.local.get("history", function(result) {
        callback(result.history ?? []);
    });
}

function setHistoryVariable(history) {
    chrome.storage.local.set({history: history});
}

