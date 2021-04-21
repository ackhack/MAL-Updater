init();
function init() {

    resetNotificationCounter();

    document.getElementById("btnVal").onclick = changeBookmarks;
    document.getElementById("cbActive").onchange = changeActiveState;
    document.getElementById("cbActiveDiscord").onchange = changeActiveDiscordState;
    document.getElementById("cbCheckLastEpisode").onchange = changeCheckLastEpisode;
    document.getElementById("btnCacheDelete").onclick = deleteCache;
    document.getElementById("btnUnauthorize").onclick = unauthorize;
    document.getElementById("btnRemoveDiscord").onclick = removeDiscord;
    document.getElementById("cbDisplayMode").onchange = changeDisplayMode;
    document.getElementById("pVersion").onclick = versionClicked;

    getActiveState(active => {
        document.getElementById("cbActive").checked = active;
    })
    getBookmarkFolderName(name => {
        document.getElementById("tbBookmarks").value = name;
    })
    getActiveDiscordState(active => {
        document.getElementById("cbActiveDiscord").checked = active;
    })
    getCheckLastEpisode(active => {
        document.getElementById("cbCheckLastEpisode").checked = active;
    })
    getDisplayMode(active => {
        document.getElementById("cbDisplayMode").checked = active;
    })
    getCurrentVersion(versionText => {
        document.getElementById("pVersion").innerText = versionText;
    });
}

//#region Init

function resetNotificationCounter() {
    chrome.browserAction.setBadgeText({text: ""});
}

function getActiveState(callb) {
    chrome.storage.local.get("MAL_Settings_Active", res => {
        if (res.MAL_Settings_Active !== "" && res.MAL_Settings_Active !== undefined)
            callb(res.MAL_Settings_Active);
        else
            callb(true);
    });
}

function getBookmarkFolderName(callb) {
    chrome.storage.local.get("MAL_Settings_Bookmarks", res => {
        if (res.MAL_Settings_Bookmarks !== "" && res.MAL_Settings_Bookmarks !== undefined)
            callb(res.MAL_Settings_Bookmarks);
        else
            callb("");
    });
}

function getActiveDiscordState(callb) {
    chrome.storage.local.get("MAL_Settings_DiscordActive", res => {
        if (res.MAL_Settings_DiscordActive !== "" && res.MAL_Settings_DiscordActive !== undefined)
            callb(res.MAL_Settings_DiscordActive);
        else
            callb(false);
    });
}

function getCheckLastEpisode(callb) {
    chrome.storage.local.get("MAL_Settings_CheckLastEpisode", res => {
        if (res.MAL_Settings_CheckLastEpisode !== "" && res.MAL_Settings_CheckLastEpisode !== undefined)
            callb(res.MAL_Settings_CheckLastEpisode);
        else
            callb(true);
    });
}

function getDisplayMode(callb) {
    chrome.storage.local.get("MAL_Settings_DisplayMode", res => {
        if (res.MAL_Settings_DisplayMode !== "" && res.MAL_Settings_DisplayMode !== undefined)
            callb(res.MAL_Settings_DisplayMode);
        else
            callb(true);
    });
}

function getCurrentVersion(callb) {

    chrome.runtime.sendMessage(
        {
            type: "GET_NEWEST_VERSION"
        },
        (result) => {
            if (result.update) {
                callb("New Version Available: " + result.version);
            } else {
                callb("Version: " + result.version);
            }
        }
    );
}

//#endregion

//#region Setting Functions

function changeBookmarks() {
    chrome.storage.local.set({ "MAL_Settings_Bookmarks": document.getElementById("tbBookmarks").value }, function () {
        chrome.runtime.sendMessage(
            {
                type: "CHANGED_BOOKMARK",
                folderName: document.getElementById("tbBookmarks").value
            },
            () => { }
        );
    });
}

function changeActiveState(event) {
    chrome.storage.local.set({ "MAL_Settings_Active": event.target.checked }, function () {
        chrome.runtime.sendMessage(
            {
                type: "CHANGED_ACTIVE",
                value: event.target.checked
            },
            () => { }
        );
    });
}
function changeActiveDiscordState(event) {
    chrome.storage.local.set({ "MAL_Settings_DiscordActive": event.target.checked }, function () {
        chrome.runtime.sendMessage(
            {
                type: "CHANGED_ACTIVE_DISCORD",
                value: event.target.checked
            },
            () => { }
        );
    });
}

function deleteCache() {
    chrome.runtime.sendMessage(
        {
            type: "DELETE_CACHE"
        },
        () => { }
    );
}

function unauthorize() {
    document.getElementById("cbActive").checked = false;
    changeActiveState({ target: { checked: false } });
    chrome.runtime.sendMessage(
        {
            type: "UNAUTHORIZE"
        },
        () => { }
    );
}

function removeDiscord() {
    chrome.runtime.sendMessage(
        {
            type: "REMOVE_DRP"
        },
        () => { }
    );
}

function changeCheckLastEpisode(event) {
    chrome.storage.local.set({ "MAL_Settings_CheckLastEpisode": event.target.checked }, function (res) {
        console.log(event.target.checked);
        chrome.runtime.sendMessage(
            {
                type: "CHANGED_CHECK_LAST_EPISODE",
                value: event.target.checked
            },
            () => { }
        );
    });
}

function changeDisplayMode(event) {
    chrome.storage.local.set({ "MAL_Settings_DisplayMode": event.target.checked }, function (res) {
    });
}

function versionClicked() {
    window.open("https://github.com/ackhack/MAL-Updater");
}

//#endregion