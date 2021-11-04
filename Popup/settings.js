init();

//#region Init

function init() {
    resetNotificationCounter();
    initMenu();
    initFunctions();
    initSettings();
    initCurrentAnime();
}

function initFunctions() {
    document.getElementById("btnBookmarkSave").onclick = changeBookmarks;
    document.getElementById("cbActive").onchange = changeActiveState;
    document.getElementById("cbActiveDiscord").onchange = changeActiveDiscordState;
    document.getElementById("cbCheckLastEpisode").onchange = changeCheckLastEpisode;
    document.getElementById("btnCacheDeleteAll").onclick = deleteCacheAll;
    document.getElementById("btnCacheDeleteThis").onclick = _ => deleteCache({ current: true });
    document.getElementById("btnUnauthorize").onclick = unauthorize;
    document.getElementById("btnRemoveDiscord").onclick = removeDiscord;
    document.getElementById("cbDisplayMode").onchange = changeDisplayMode;
    document.getElementById("cbBookmarksActive").onchange = changeBookmarkActive;
    document.getElementById("pVersion").onclick = versionClicked;
    document.getElementById("btnCacheViewer").onclick = showCache;
    document.getElementById("btnHistoryViewer").onclick = showHistory;
    document.getElementById("btnHelp").onclick = showHelp;
    document.getElementById("btnCacheImport").onclick = importCache;
    document.getElementById("btnCacheExport").onclick = exportCache;
    document.getElementById("cbBookmarkAutoActive").onchange = changeBookmarkAutoActive;
    document.getElementById("selectPreferredSite").onchange = changedPreferredSite;
}

function initSettings() {

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
    })
    getBookmarkActive(active => {
        document.getElementById("cbBookmarksActive").checked = active;
    })
    initPreferredSiteSelect();
    getBookmarkAutoActive(active => {
        document.getElementById("cbBookmarkAutoActive").checked = active;
    })
}

function initMenu() {
    Array.from(document.getElementsByClassName("mainBtn")).forEach(btn => {
        if (!btn.className.includes("ignored"))
            btn.onclick = (ev) => clickedButton(ev);
    });
    document.getElementById("btnBack").onclick = clickedBackButton;
}

function initCurrentAnime() {
    document.getElementById("divCurrent").style.display = "none";
    setCurrentAnime();
}

function resetNotificationCounter() {
    chrome.action.setBadgeText({ text: "" });
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

function getBookmarkActive(callb) {
    chrome.storage.local.get("MAL_Settings_Bookmarks_Active", res => {
        if (res.MAL_Settings_Bookmarks_Active !== "" && res.MAL_Settings_Bookmarks_Active !== undefined)
            callb(res.MAL_Settings_Bookmarks_Active);
        else
            callb(true);
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

function getBookmarkAutoActive(callb) {
    chrome.storage.local.get("MAL_Settings_Bookmarks_Auto", res => {
        if (res.MAL_Settings_Bookmarks_Auto !== "" && res.MAL_Settings_Bookmarks_Auto !== undefined)
            callb(res.MAL_Settings_Bookmarks_Auto);
        else
            callb(false);
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

function initPreferredSiteSelect() {
    chrome.runtime.sendMessage(
        {
            type: "GET_SITES"
        },
        (sites) => {
            let select = document.getElementById("selectPreferredSite");
            for (let site in sites) {
                let option = document.createElement("option");
                option.innerText = sites[site].siteName;
                option.value = sites[site].siteName;
                select.appendChild(option);
            }
            chrome.runtime.sendMessage(
                {
                    type: "GET_PREFERRED_SITE"
                },
                (site) => {
                    select.value = site;
                }
            );
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

function changeBookmarkActive(event) {
    chrome.storage.local.set({ "MAL_Settings_Bookmarks_Auto": event.target.checked }, function () {
        chrome.runtime.sendMessage(
            {
                type: "CHANGED_BOOKMARK_AUTO",
                active: event.target.checked
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

function deleteCache(query = {}) {
    if (query.all) {
        chrome.runtime.sendMessage(
            {
                type: "DELETE_CACHE",
                query: query
            },
            () => { }
        );
    }
    if (query.current) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {

            // since only one tab should be active and in the current window at once
            // the return variable should only have one entry
            if (tabs[0]) {
                chrome.runtime.sendMessage(
                    {
                        type: "DELETE_CACHE",
                        query: { url: tabs[0].url }
                    },
                    (result) => {
                        alert(result ? "Cache has been cleared" : "An Error has occured");
                    }
                );

            }
        });
    }
}

function deleteCacheAll() {
    chrome.runtime.sendMessage(
        {
            type: "CONFIRM_MESSAGE",
            message: "Do you want to delete the whole Cache (can't be reverted)"
        },
        result => {
            if (result) {
                deleteCache({ all: true });
            }
        }
    );
}

function unauthorize() {
    chrome.runtime.sendMessage(
        {
            type: "CONFIRM_MESSAGE",
            message: "Do you want to unauthorize this Extension?"
        },
        result => {
            if (result) {
                document.getElementById("cbActive").checked = false;
                changeActiveState({ target: { checked: false } });
                chrome.runtime.sendMessage(
                    {
                        type: "UNAUTHORIZE"
                    },
                    () => { }
                );
            }
        }
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
        chrome.runtime.sendMessage(
            {
                type: "CHANGED_DISPLAY_MODE",
                value: event.target.checked
            },
            () => { }
        );
    });
}

function versionClicked() {
    window.open("https://github.com/ackhack/MAL-Updater");
}

function showCache() {
    fetch(chrome.runtime.getURL('Popup/cacheviewer.html'))
        .then((response) => {
            chrome.tabs.create({ url: response.url });
        }).catch(err => console.log(err));
}

function showHistory() {
    fetch(chrome.runtime.getURL('Popup/historyviewer.html'))
        .then((response) => {
            chrome.tabs.create({ url: response.url });
        }).catch(err => console.log(err));
}

function showHelp() {
    fetch(chrome.runtime.getURL('Popup/helpPage.html'))
        .then((response) => {
            chrome.tabs.create({ url: response.url });
        }).catch(err => console.log(err));
}

function importCache() {
    var input = document.createElement('input');
    input.type = 'file';

    input.onchange = e => {
        var file = e.target.files[0];
        if (file.type !== "application/json") {
            alert("Please choose a json File exported from another instance");
            return;
        }
        var reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = readerEvent => {
            var content = readerEvent.target.result;
            console.log(content);
            chrome.runtime.sendMessage(
                {
                    type: "IMPORT_CACHE",
                    cacheString: content
                }
            );
        }
    }
    input.click();
}

function exportCache() {
    chrome.runtime.sendMessage(
        {
            type: "EXPORT_CACHE"
        },
        cacheString => {
            var element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(cacheString));
            element.setAttribute('download', 'malCache.json');

            element.style.display = 'none';
            document.body.appendChild(element);

            element.click();

            document.body.removeChild(element);
        }
    );
}

function changedPreferredSite(event) {
    chrome.runtime.sendMessage(
        {
            type: "CHANGED_PREFERRED_SITE",
            site: event.target.value
        }
    );
}

function changeBookmarkAutoActive(event) {
    chrome.runtime.sendMessage(
        {
            type: "CHANGED_BOOKMARK_AUTO_ACTIVE",
            value: event.target.checked
        }
    );
}

//#endregion

//#region Menu

function clickedButton(ev) {
    document.getElementById("btnBack").style = "display:block";
    Array.from(document.getElementsByClassName("mainDiv")).forEach(div => { div.style = "display:none" });
    document.getElementById(ev.target.parentElement.id + "Settings").style = "display:block";
    document.getElementById("pTitle").innerText = ev.target.innerText + " Settings";
}

function clickedBackButton() {
    document.getElementById("btnBack").style = "display:none";
    Array.from(document.getElementById("divSettings").children).forEach(div => { div.style = "display:none" });
    Array.from(document.getElementsByClassName("mainDiv")).forEach(div => { div.style = "display:block" });
    document.getElementById("pTitle").innerText = "Settings";
}

//#endregion

//#region Current Anime

function setCurrentAnime() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0]) {
            chrome.runtime.sendMessage(
                {
                    type: "GET_ANIME_BY_URL",
                    url: tabs[0].url
                },
                anime => setAnime(anime)
            );
        }
    });
}

function setAnime(anime) {
    if (anime) {
        let img = document.getElementById("imgCurrent");
        img.src = anime.meta.main_picture.large ?? anime.meta.main_picture.medium ?? "";
        img.alt = "Image";
        img.style = "padding-right: 5px;";

        document.getElementById("pCurrent").innerText = getAnimeTitle(anime);

        document.getElementById("divCurrent").style.display = "block";
    }
}

function getAnimeTitle(anime) {
    if (anime.meta.alternative_titles) {
        if (anime.meta.alternative_titles.en) {
            return anime.meta.alternative_titles.en;
        }
    }
    return anime.meta.title ?? "Unnamed Anime";
}

//#endregion