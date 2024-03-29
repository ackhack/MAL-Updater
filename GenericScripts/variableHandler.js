//#region Generic

function getSitesVariable(callback) {
    chrome.storage.local.get("MAL_Sites_Variable", function (result) {
        callback(result.MAL_Sites_Variable ?? {});
    });
    return true;
}

function setSitesVariable(MAL_Sites_Variable) {
    chrome.storage.local.set({ MAL_Sites_Variable: MAL_Sites_Variable });
}

function getActiveVariable(callback) {
    chrome.storage.local.get("MAL_Settings_Active", function (result) {
        callback(result.MAL_Settings_Active ?? true);
    });
    return true;
}

function setActiveVariable(MAL_Settings_Active) {
    chrome.storage.local.set({ MAL_Settings_Active: MAL_Settings_Active });
}

function getSitesVersion(callback) {
    chrome.storage.local.get("MAL_Pages_Version", function (result) {
        callback(result.MAL_Pages_Version ?? -1);
    });
    return true;
}

function setSitesVersion(MAL_Pages_Version) {
    chrome.storage.local.set({ MAL_Pages_Version: MAL_Pages_Version });
}

//#endregion

//#region Cache

function getAnimeCacheVariable(callback) {
    chrome.storage.local.get("MAL_AnimeCache", function (result) {
        callback(result.MAL_AnimeCache ?? {});
    });
    return true;
}

function setAnimeCacheVariable(animeCache) {
    chrome.storage.local.set({ MAL_AnimeCache: animeCache });
}

//#endregion

//#region Auth

function getCodeVerifierVariable(callback) {
    chrome.storage.local.get("codeVerifier", function (result) {
        callback(result.codeVerifier ?? "");
    });
    return true;
}

function setCodeVerifierVariable(codeVerifier) {
    chrome.storage.local.set({ codeVerifier: codeVerifier });
}

function getStateIDVariable(callback) {
    chrome.storage.local.get("stateID", function (result) {
        callback(result.stateID ?? "");
    });
    return true;
}

function setStateIDVariable(stateID) {
    chrome.storage.local.set({ stateID: stateID });
}

function getAuthTokenVariable(callback) {
    chrome.storage.local.get("authToken", function (result) {
        callback(result.authToken ?? "");
    });
    return true;
}

function setAuthTokenVariable(authToken) {
    chrome.storage.local.set({ authToken: authToken });
}

function getUserTokenVariable(callback) {
    chrome.storage.local.get("MAL_User_Token", function (result) {
        callback(result.MAL_User_Token ?? {});
    });
    return true;
}

function setUserTokenVariable(MAL_User_Token) {
    chrome.storage.local.set({ MAL_User_Token: MAL_User_Token });
}

//#endregion

//#region Bookmark

function getBookmarkIDVariable(callback) {
    chrome.storage.local.get("MAL_Bookmark_ID", function (result) {
        callback(result.MAL_Bookmark_ID ?? "-1");
    });
    return true;
}

function setBookmarkIDVariable(MAL_Bookmark_ID) {
    chrome.storage.local.set({ MAL_Bookmark_ID: MAL_Bookmark_ID });
}

function getBookmarkActiveVariable(callback) {
    chrome.storage.local.get("MAL_Settings_Bookmarks_Active", function (result) {
        callback(result.MAL_Settings_Bookmarks_Active ?? false);
    });
    return true;
}

function setBookmarkActiveVariable(MAL_Settings_Bookmarks_Active) {
    chrome.storage.local.set({ MAL_Settings_Bookmarks_Active: MAL_Settings_Bookmarks_Active });
}

function setPreferredSiteIdVariable(MAL_Settings_Preferred_Site) {
    chrome.storage.local.set({ MAL_Settings_Preferred_Site: MAL_Settings_Preferred_Site });
}

function getPreferredSiteIdVariable(callback) {
    chrome.storage.local.get("MAL_Settings_Preferred_Site", function (result) {
        callback(isNaN(result.MAL_Settings_Preferred_Site) ? 0 : result.MAL_Settings_Preferred_Site);
    });
    return true;
}

function getBookmarkAutoActiveVariable(callback) {
    chrome.storage.local.get("MAL_Settings_Bookmarks_Auto", function (result) {
        callback(result.MAL_Settings_Bookmarks_Auto ?? false);
    });
    return true;
}

function setBookmarkAutoActiveVariable(MAL_Settings_Bookmarks_Auto) {
    chrome.storage.local.set({ MAL_Settings_Bookmarks_Auto: MAL_Settings_Bookmarks_Auto });
}

function getBookmarkAutoNotificationVariable(callback) {
    chrome.storage.local.get("MAL_Settings_Bookmarks_Notification", function (result) {
        callback(result.MAL_Settings_Bookmarks_Notification ?? false);
    });
    return true;
}

function setBookmarkAutoNotificationVariable(MAL_Settings_Bookmarks_Notification) {
    chrome.storage.local.set({ MAL_Settings_Bookmarks_Notification: MAL_Settings_Bookmarks_Notification });
}

function getBookmarkAutoLastFetchUrlListVariable(callback) {
    chrome.storage.local.get("MAL_Settings_Bookmarks_Last_Fetch_Url_List", function (result) {
        callback(result.MAL_Settings_Bookmarks_Last_Fetch_Url_List ?? {});
    });
    return true;
}

function setBookmarkAutoLastFetchUrlListVariable(MAL_Settings_Bookmarks_Last_Fetch_Url_List) {
    chrome.storage.local.set({ MAL_Settings_Bookmarks_Last_Fetch_Url_List: MAL_Settings_Bookmarks_Last_Fetch_Url_List });
}

//#endregion

//#region History

function getHistoryVariable(callback) {
    chrome.storage.local.get("MAL_AnimeHistory", function (result) {
        callback(result.MAL_AnimeHistory ?? []);
    });
    return true;
}

function setHistoryVariable(MAL_AnimeHistory) {
    chrome.storage.local.set({ MAL_AnimeHistory: MAL_AnimeHistory });
}

//#endregion

//#region Discord

function getDiscordActiveVariable(callback) {
    chrome.storage.local.get("MAL_Settings_DiscordActive", function (result) {
        callback(result.MAL_Settings_DiscordActive ?? false);
    });
    return true;
}

function setDiscordActiveVariable(MAL_Settings_DiscordActive) {
    chrome.storage.local.set({ MAL_Settings_DiscordActive: MAL_Settings_DiscordActive });
}

function getDiscordRecentInfoVariable(callback) {
    chrome.storage.local.get("discordRecentInfo", function (result) {
        callback(result.discordRecentInfo ?? {
            name: "",
            episode: ""
        });
    });
    return true;
}

function setDiscordRecentInfoVariable(discordRecentInfo) {
    chrome.storage.local.set({ discordRecentInfo: discordRecentInfo });
}

function setDiscordTabIdVariable(discordTabId) {
    chrome.storage.local.set({ discordTabId: discordTabId });
}

function getDiscordTabIdVariable(callback) {
    chrome.storage.local.get("discordTabId", function (result) {
        callback(result.discordTabId ?? -1);
    });
    return true;
}

function setDiscordLatestMessageVariable(LatestMessage) {
    chrome.storage.local.set({ LatestMessage: LatestMessage });
}

function getDiscordLatestMessageVariable(callback) {
    chrome.storage.local.get("LatestMessage", function (result) {
        callback(result.LatestMessage ?? {valid: true, empty: true});
    });
    return true;
}

//#endregion