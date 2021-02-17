init();
function init() {

    document.getElementById("btnVal").onclick = changeBookmarks;
    document.getElementById("cbActive").onchange = changeActiveState;
    document.getElementById("btnCacheDelete").onclick = deleteCache;
    document.getElementById("btnUnauthorize").onclick = unauthorize;

    getActiveState(active => {
        document.getElementById("cbActive").checked = active;
    })
    getBookmarkFolderName(name => {
        document.getElementById("tbBookmarks").value = name;
    })
}

function getActiveState(callb) {
    chrome.storage.local.get("MAL_Settings_Active", res => {
        if (res.MAL_Settings_Active != "")
            callb(res.MAL_Settings_Active);
        else
            callb(false);
    });
}

function getBookmarkFolderName(callb) {
    chrome.storage.local.get("MAL_Settings_Bookmarks", res => {
        if (res.MAL_Settings_Bookmarks != "")
            callb(res.MAL_Settings_Bookmarks);
        else
            callb("Anime");
    });
}

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