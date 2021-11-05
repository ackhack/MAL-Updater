function getSitesVariable(callback) {
    chrome.storage.local.get("sites", function (result) {
        callback(result.sites ?? {});
    });
}

function setSitesVariable(sites) {
    chrome.storage.local.set({ sites: sites });
}

function getActiveVariable(callback) {
    chrome.storage.local.get("active", function (result) {
        callback(result.active ?? true);
    });
}

function setActiveVariable(active) {
    chrome.storage.local.set({ active: active });
}

function getAnimeCacheVariable(callback) {
    chrome.storage.local.get("MAL_AnimeCache", function (result) {
        callback(result.MAL_AnimeCache ?? {});
    });
}

function setAnimeCacheVariable(animeCache) {
    chrome.storage.local.set({ MAL_AnimeCache: animeCache });
}

function getCodeVerifierVariable(callback) {
    chrome.storage.local.get("codeVerifier", function (result) {
        callback(result.codeVerifier ?? "");
    });
}

function setCodeVerifierVariable(codeVerifier) {
    chrome.storage.local.set({ codeVerifier: codeVerifier });
}

function getStateIDVariable(callback) {
    chrome.storage.local.get("stateID", function (result) {
        callback(result.stateID ?? "");
    });
}

function setStateIDVariable(stateID) {
    chrome.storage.local.set({ stateID: stateID });
}

function getAuthTokenVariable(callback) {
    chrome.storage.local.get("authToken", function (result) {
        callback(result.authToken ?? "");
    });
}

function setAuthTokenVariable(authToken) {
    chrome.storage.local.set({ authToken: authToken });
}

function getUserTokenVariable(callback) {
    chrome.storage.local.get("MAL_User_Token", function (result) {
        callback(result.MAL_User_Token ?? {});
    });
}

function setUserTokenVariable(MAL_User_Token) {
    chrome.storage.local.set({ MAL_User_Token: MAL_User_Token });
}

function getBookmarkIDVariable(callback) {
    chrome.storage.local.get("bookmarkID", function (result) {
        callback(result.bookmarkID ?? -1);
    });
}

function setBookmarkIDVariable(bookmarkID) {
    chrome.storage.local.set({ bookmarkID: bookmarkID });
}

function getBookmarkActiveVariable(callback) {
    chrome.storage.local.get("bookmarkActive", function (result) {
        callback(result.bookmarkActive ?? false);
    });
}

function setBookmarkActiveVariable(bookmarkActive) {
    chrome.storage.local.set({ bookmarkActive: bookmarkActive });
}

function setPreferredSiteNameVariable(MAL_Settings_Preferred_Site) {
    chrome.storage.local.set({ MAL_Settings_Preferred_Site: MAL_Settings_Preferred_Site });
}

function getPreferredSiteNameVariable(callback) {
    chrome.storage.local.get("MAL_Settings_Preferred_Site", function (result) {
        callback(result.MAL_Settings_Preferred_Site ?? "kickassanime");
    });
}

function getBookmarkAutoActiveVariable(callback) {
    chrome.storage.local.get("MAL_Settings_Bookmarks_Auto", function (result) {
        callback(result.MAL_Settings_Bookmarks_Auto ?? false);
    });
}

function setBookmarkAutoActiveVariable(MAL_Settings_Bookmarks_Auto) {
    chrome.storage.local.set({ MAL_Settings_Bookmarks_Auto: MAL_Settings_Bookmarks_Auto });
}

function getDiscordActiveVariable(callback) {
    chrome.storage.local.get("MAL_Settings_DiscordActive", function (result) {
        callback(result.MAL_Settings_DiscordActive ?? false);
    });
}

function setDiscordActiveVariable(MAL_Settings_DiscordActive) {
    chrome.storage.local.set({ MAL_Settings_DiscordActive: MAL_Settings_DiscordActive });
}

function getDiscordPortVariable(callback) {
    chrome.storage.local.get("discordPort", function (result) {
        callback(result.discordPort ?? 0);
    });
}

function setDiscordPortVariable(discordPort) {
    chrome.storage.local.set({ discordPort: discordPort });
}

function getDiscordRecentInfoVariable(callback) {
    chrome.storage.local.get("discordRecentInfo", function (result) {
        callback(JSON.parse(result.discordRecentInfo) ?? {
            name: "",
            episode: ""
        });
    });
}

function setDiscordRecentInfoVariable(discordRecentInfo) {
    chrome.storage.local.set({ discordRecentInfo: JSON.stringify(discordRecentInfo) });
}

function getHistoryVariable(callback) {
    chrome.storage.local.get("MAL_AnimeHistory", function (result) {
        callback(result.MAL_AnimeHistory ?? []);
    });
}

function setHistoryVariable(MAL_AnimeHistory) {
    chrome.storage.local.set({ MAL_AnimeHistory: MAL_AnimeHistory });
}

function setDiscordTabIdVariable(discordTabId) {
    chrome.storage.local.set({ discordTabId: discordTabId });
}

function getDiscordTabIdVariable(callback) {
    chrome.storage.local.get("discordTabId", function (result) {
        callback(result.discordTabId ?? -1);
    });
}