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


    document.getElementById("cbActive").onchange = changeActiveState;
    document.getElementById("btnHistoryViewer").onclick = showHistory;
    document.getElementById("btnTimelineViewer").onclick = showTimeline;
    document.getElementById("btnUnauthorize").onclick = unauthorize;

    document.getElementById("btnCacheViewer").onclick = showCache;
    document.getElementById("btnCacheDeleteAll").onclick = deleteCacheAll;
    document.getElementById("btnCacheDeleteThis").onclick = _ => deleteCache({ current: true });
    document.getElementById("btnCacheImport").onclick = importCache;
    document.getElementById("btnCacheExport").onclick = exportCache;

    document.getElementById("cbBookmarksActive").onchange = changeBookmarkActive;
    document.getElementById("btnBookmarkSave").onclick = changeBookmarks;
    document.getElementById("cbBookmarkAutoActive").onchange = changeBookmarkAutoActive;
    document.getElementById("cbBookmarkAutoNotification").onchange = changeBookmarkAutoNotification;
    document.getElementById("selectPreferredSite").onchange = changedPreferredSite;

    document.getElementById("cbActiveDiscord").onchange = changeActiveDiscordState;
    document.getElementById("btnRemoveDiscord").onclick = removeDiscord;

    document.getElementById("pVersion").onclick = versionClicked;
    document.getElementById("btnHelp").onclick = showHelp;
}

function initSettings() {

    getActiveVariable(active => {
        document.getElementById("cbActive").checked = active;
    })

    getBookmarkFolderName(name => {
        document.getElementById("tbBookmarks").value = name;
    })
    getBookmarkActiveVariable(active => {
        document.getElementById("cbBookmarksActive").checked = active;
    })
    getBookmarkAutoActiveVariable(active => {
        document.getElementById("cbBookmarkAutoActive").checked = active;
    })
    getBookmarkAutoNotificationVariable(active => {
        document.getElementById("cbBookmarkAutoNotification").checked = active;
    })
    getPreferredSiteSelect();

    getDiscordActiveVariable(active => {
        document.getElementById("cbActiveDiscord").checked = active;
    })

    getCurrentVersion(versionText => {
        document.getElementById("pVersion").innerText = versionText;
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

function getBookmarkFolderName(callb = () => { }) {
    chrome.runtime.sendMessage({
        type: "GET_BOOKMARK_FOLDER_NAME"
    }, callb);
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

function getPreferredSiteSelect() {
    chrome.runtime.sendMessage(
        {
            type: "GET_SITES"
        },
        (sites) => {
            let select = document.getElementById("selectPreferredSite");
            for (let site in sites) {
                let option = document.createElement("option");
                option.innerText = sites[site].friendlyName;
                option.value = sites[site].id;
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

function changeActiveState(event) {
    chrome.runtime.sendMessage(
        {
            type: "CHANGED_ACTIVE",
            value: event.target.checked
        },
        () => { }
    );
}

function showHistory() {
    fetch(chrome.runtime.getURL('Popup/historyviewer.html'))
        .then((response) => {
            chrome.tabs.create({ url: response.url });
        }).catch(err => console.log(err));
}

function showTimeline() {
    fetch(chrome.runtime.getURL('Popup/timelineviewer.html'))
        .then((response) => {
            chrome.tabs.create({ url: response.url });
        }).catch(err => console.log(err));
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

function showCache() {
    fetch(chrome.runtime.getURL('Popup/cacheviewer.html'))
        .then((response) => {
            chrome.tabs.create({ url: response.url });
        }).catch(err => console.log(err));
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
        chrome.runtime.sendMessage(
            {
                type: "DELETE_ACTIVE_CACHE"
            },
            (result) => {
                alert(result ? "Cache has been cleared" : "An Error has occured");
            }
        );
    }
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

function changeBookmarkActive(event) {
    chrome.storage.local.set({ "MAL_Settings_Bookmarks_Active": event.target.checked });
}

function changeBookmarks() {
    chrome.runtime.sendMessage({
        type: "CHANGE_BOOKMARKS",
        folderName: document.getElementById("tbBookmarks").value
    });
}

function changeBookmarkAutoActive(event) {
    chrome.storage.local.set({ "MAL_Settings_Bookmarks_Auto": event.target.checked });
}

function changeBookmarkAutoNotification(event) {
    chrome.storage.local.set({ "MAL_Settings_Bookmarks_Notification": event.target.checked });
}

function changedPreferredSite(event) {
    chrome.storage.local.set({ "MAL_Settings_Preferred_Site": event.target.value });
}

function changeActiveDiscordState(event) {
    chrome.runtime.sendMessage(
        {
            type: "CHANGED_ACTIVE_DISCORD",
            value: event.target.checked
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

function versionClicked() {
    window.open("https://github.com/ackhack/MAL-Updater");
}

function showHelp() {
    fetch(chrome.runtime.getURL('Popup/helpPage.html'))
        .then((response) => {
            chrome.tabs.create({ url: response.url });
        }).catch(err => console.log(err));
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
    chrome.runtime.sendMessage(
        {
            type: "GET_ACTIVE_ANIME"
        },
        anime => setAnime(anime)
    );
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
//#endregion