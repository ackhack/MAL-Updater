function setBookmark(animeID, oldURL, nextURL) {
    getBookmarkActiveVariable(active => {
        if (!active) {
            return;
        }

        getCacheById(animeID, result => {
            let anime = result;

            //remove old bookmark
            getBookmarkIDVariable(bookmarkID => {
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
                            getSitesVariable(sites => {
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
                            });
                        } else {
                            createBookmarkFolder();
                        }
                    });
            });

            //add new bookmark
            if (nextURL && anime !== undefined) {
                addBookmark(getBookmarkName(anime), nextURL);
            }
        });
    });
}

function addBookmark(name, url, callb = () => { }, nTry = 0) {
    getBookmarkIDVariable(bookmarkID => {
        getBookmark(bookmarkID, res => {
            if (res != undefined) {
                for (let child of res.children) {
                    if (child.url == url) {
                        callb(false);
                        return;
                    }
                }
                chrome.bookmarks.create({
                    "parentId": bookmarkID,
                    "title": name,
                    "url": url
                }, () => {
                    callb(true);
                })
            } else {
                nTry++;
                if (nTry < 10) {
                    createBookmarkFolder(() => {
                        addBookmark(name, url, callb, nTry);
                    });
                } else {
                    callb(false);
                }
            }
        });
    });
}

function createBookmarkFolder(name = "Anime", callb = () => { }) {
    chrome.bookmarks.search(name, (result) => {

        for (let bookmark of result) {
            if (bookmark.title === name && bookmark.url == undefined) {
                setBookmarkIDVariable(bookmark.id);
                return;
            }
        }

        chrome.bookmarks.create({
            'title': name,
            'parentId': "1"
        }, bookmark => {
            setBookmarkIDVariable(bookmark.id);
            callb();
        });
    });
}

function updateBookmarkFolder(req) {
    if (req.active === true || req.active === false) {
        setBookmarkActiveVariable(req.active);
        return true;
    }
    if (req.folderName == "") {
        return true;
    }
    getBookmarkIDVariable(bookmarkID => {
        getBookmark(bookmarkID, res => {
            if (res != undefined) {
                chrome.bookmarks.update(bookmarkID, { title: req.folderName }, () => { });
            } else {
                createBookmarkFolder(req.folderName);
            }
        });
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
    getBookmarkActiveVariable(bookmarkActive => {
        getBookmarkIDVariable(bookmarkID => {
            if (!bookmarkActive || bookmark.parentId !== bookmarkID || bookmark.url == undefined)
                return;

            getCacheByURLAsync(bookmark.url, anime => {
                if (anime !== undefined) {
                    let name = getBookmarkName(anime);
                    if (bookmark.title == name)
                        return;
                    else
                        chrome.bookmarks.remove(bookmark.id, () => {
                            addBookmark(name, bookmark.url);
                        });
                }
            });
        });
    });
}

function bookmarkLoop() {
    getBookmarkAutoActiveVariable(bookmarkautoActive => {
        if (!bookmarkautoActive) {
            return;
        }

        getSitesVariable(sites => {
            getPreferredSiteNameVariable(preferredSiteName => {
                chrome.tabs.create({ url: sites[preferredSiteName].mainPageURL, active: false }, (tab) => {
                    if (chrome.runtime.lastError) {
                        return;
                    }
                    chrome.alarms.create("force_close" + tab.id, {
                        delayInMinutes: 1,
                    })
                });
            });
        });
    });
}

function checkBookmarkAuto(req) {
    let processed = 0;
    let addedAnimes = [];
    getAnimeCacheVariable(animeCache => {
        getHistoryVariable(historyObj => {
            function addBookmarkTmp(anime, callb) {
                for (let i = historyObj.length - 1; i >= 0; i--) {
                    if (animeCache[anime.cacheName].meta.id == historyObj[i].id) {
                        if (historyObj[i].episode == anime.episode - 1) {
                            addBookmark(getBookmarkName(animeCache[anime.cacheName]), anime.url, (added) => {
                                if (added) {
                                    addedAnimes.push({
                                        "name": getAnimeTitle(animeCache[anime.cacheName]),
                                        "episode": anime.episode
                                    });
                                }
                                callb();
                            });
                            return;
                        }
                        break;
                    }
                }
                callb();
            }
            for (let anime of req.animes) {
                addBookmarkTmp(anime, () => {
                        processed++;
                        if (processed == req.animes.length && addedAnimes.length > 0) {
                            getBookmarkAutoNotificationVariable(bookmarkAutoNotification => {
                                if (bookmarkAutoNotification) {
                                    let notification = "Bookmarks: Added " + addedAnimes.length + "\n";
                                    for (let anime of addedAnimes) {
                                        notification += anime.name.slice(0, 10) + " | Ep " + anime.episode + "\n";
                                    }
                                    sendNotification(notification);
                                }
                            });
                        }
                    }
                );
            }
        });
    });
    return true;
}

function getBookmarkName(anime) {
    return anime.meta.id + ": " + getAnimeTitle(anime);
}

function getBookmarkFolderName(callb = () => { }) {
    getBookmarkIDVariable(bookmarkID => {
        getBookmark(bookmarkID, res => {
            if (res != undefined) {
                callb(res.title);
            } else {
                callb("");
            }
        });
    });
}