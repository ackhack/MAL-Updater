var bookmarkID;
var bookmarkActive;

var preferredSiteName;
var bookmarkautoActive;
var bookmarkAutoRunning = false;

function setBookmark(animeID, oldURL, nextURL) {

    if (!bookmarkActive) {
        return;
    }

    let anime = getCacheById(animeID);

    //remove old bookmark
    if (bookmarkID)
        getBookmark(bookmarkID, res => {
            if (res != undefined && res.children.length > 0) {
                for (let child of res.children) {

                    if (child.url === undefined)
                        continue;

                    if (child.url == oldURL) {
                        chrome.bookmarks.remove(child.id, () => { });
                        return;
                    }

                    if (child.title.startsWith(animeID)) {
                        chrome.bookmarks.remove(child.id, () => { });
                        return;
                    }
                }
                for (let site in anime) {
                    if (site == "meta")
                        continue;

                    let pattern = sites[site].urlPattern;
                    let indexOpen = 0;

                    for (let i = 0; i < sites[site].nameMatch; i++) {
                        indexOpen = pattern.indexOf("(", indexOpen);
                    }

                    if (indexOpen == -1)
                        continue;

                    let indexClosed = pattern.indexOf(")", indexOpen);

                    if (indexClosed == -1)
                        continue;

                    let actPattern = pattern.slice(0, indexOpen) + anime[site] + pattern.slice(indexClosed + 1);

                    for (let child of res.children) {
                        if (child.url === undefined)
                            continue;

                        if (child.url.match(actPattern)) {
                            chrome.bookmarks.remove(child.id, () => { });
                            return;
                        }
                    }
                }
            } else {
                initSettings(() => { });
            }
        });

    if (nextURL && anime !== undefined) {
        addBookmark(getBookmarkName(anime), nextURL);
    }
}

function addBookmark(name, url, nTry = 0) {
    getBookmark(bookmarkID, res => {
        if (res != undefined) {
            for (let child of res.children) {
                if (child.url == url) {
                    return;
                }
            }
            chrome.bookmarks.create({
                "parentId": bookmarkID,
                "title": name,
                "url": url
            }, () => { })
        } else {
            nTry++;
            if (nTry < 10)
                initSettings(() => { addBookmark(name, url, nTry); })
        }
    });
}

function createBookmarkFolder(name = "Anime") {
    chrome.bookmarks.search(name, (result) => {

        for (let bookmark of result) {
            if (bookmark.title === name && bookmark.url == undefined) {
                bookmarkID = bookmark.id;
                chrome.storage.local.set({ "MAL_Bookmark_ID": bookmark.id }, function () { });
                return;
            }
        }

        chrome.bookmarks.create({
            'title': name,
            'parentId': "1"
        }, bookmark => {
            bookmarkID = bookmark.id;
            chrome.storage.local.set({ "MAL_Bookmark_ID": bookmark.id }, function () { });
        });
    });
}

function updateBookmarkFolder(req) {
    if (req.active === true || req.active === false) {
        bookmarkActive = req.active;
        return true;
    }
    if (req.folderName == "") {
        return true;
    }
    getBookmark(bookmarkID, res => {
        if (res != undefined) {
            chrome.bookmarks.update(bookmarkID, { title: req.folderName }, () => { });
        } else {
            createBookmarkFolder(req.folderName);
        }
    });
    return true;
}

function getBookmark(id, callb) {
    chrome.bookmarks.getSubTree("1", nodes => {
        for (let node of nodes[0].children) {
            if (node.id == id) {
                callb(node);
                return;
            }
        }
        callb(undefined);
    });
}

function renameBookmark(bookmark) {
    if (!bookmarkActive || bookmark.parentId !== bookmarkID || bookmark.url == undefined)
        return;

    let anime = getCacheByURL(bookmark.url);

    if (anime !== undefined) {
        let name = getBookmarkName(anime);
        if (bookmark.title == name)
            return;
        else
            chrome.bookmarks.remove(bookmark.id, () => {
                addBookmark(name, bookmark.url);
            });
    }
}

function changePreferredSite(req) {
    preferredSiteName = req.site;
    chrome.storage.local.set({ "MAL_Settings_Preferred_Site": preferredSiteName }, function () { });
    if (!bookmarkAutoRunning && bookmarkautoActive)
        bookmarkLoop();
    return true;
}

function bookmarkLoop() {
    if (!bookmarkautoActive) {
        bookmarkAutoRunning = false;
        return;
    }

    bookmarkAutoRunning = true;

    chrome.tabs.create({ url: sites[preferredSiteName].mainPageURL, active: false }, (tab) => {
        setTimeout(() => {
            chrome.tabs.get(tab.id, (newTab) => {
                if (!chrome.runtime.lastError) {
                    chrome.tabs.remove(newTab.id);
                }
                setTimeout(() => bookmarkLoop(), 30 * 60000);
            })
        }, 10_000);
    });
}

function changeBookmarkAutoActive(req) {
    bookmarkautoActive = req.value;
    chrome.storage.local.set({ "MAL_Settings_Bookmarks_Auto": bookmarkautoActive }, function () { });
    return true;
}

function getPreferredSite(callb) {
    callb(preferredSiteName);
    return true;
}

function checkBookmarkAuto(req) {
    for (let i = historyObj.length - 1; i >= 0; i--) {
        if (animeCache[req.cacheName].meta.id == historyObj[i].id) {
            if (historyObj[i].episode == req.episode - 1) {
                addBookmark(getBookmarkName(animeCache[req.cacheName]), req.url);
            }
            break;
        }
    }
    return true;
}

function getBookmarkName(anime) {
    return anime.meta.id + ": " + getAnimeTitle(anime);
}