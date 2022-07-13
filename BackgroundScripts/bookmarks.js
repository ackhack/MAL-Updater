function setBookmark(animeID, nextURL, nTry = 0) {
    getBookmarkActiveVariable(active => {
        if (!active) {
            return;
        }

        function removeOldBookmark(callb = () => { }) {
            getBookmarkIDVariable(bookmarkID => {
                if (bookmarkID)
                    getBookmark(bookmarkID, res => {
                        if (res != undefined && res.children.length >= 0) {
                            let urls = [];
                            for (let child of res.children) {
                                urls.push(child.url);
                            }

                            getCacheByURLs(urls, result => {
                                for (let i = 0; i < result.length; i++) {
                                    if (result[i] == undefined)
                                        continue;

                                    if (result[i].meta.id == animeID) {
                                        chrome.bookmarks.remove(res.children[i].id, () => { });
                                    }
                                }
                                callb();
                            });
                        } else {
                            nTry++;
                            if (nTry > 10) {
                                callb();
                                return;
                            }
                            createBookmarkFolder(setBookmark(animeID, nextURL, nTry));
                        }
                    });
            });
        }

        removeOldBookmark(() => {
            addBookmarkByURL(nextURL);
        });
    });
}

function addBookmarkByURL(url, callb = () => { }) {
    if (url) {
        getSitesVariable((sites) => {
            for (let index in sites) {
                let site = sites[index];
                let match = url.match(site.urlPattern);
                if (match != null) {
                    getCacheByName(site.siteName, match[site.nameMatch], res => {
                        if (res != undefined) {
                            addBookmark(getBookmarkName(res, match[site.episodeMatch]), url);
                            callb();
                        }
                    });
                    return;
                }
            }
            callb();
        });
    }
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

            getSitesVariable((sites) => {
                for (let index in sites) {
                    let site = sites[index];
                    let match = bookmark.url.match(site.urlPattern);
                    if (match != null) {
                        getCacheByName(site.siteName, match[site.nameMatch], res => {
                            if (res === undefined)
                                return;

                            let name = getBookmarkName(res, match[site.episodeMatch]);
                            if (bookmark.title !== name)
                                chrome.bookmarks.update(bookmark.id, { title: name }, () => { });
                        })
                    }
                }
            });
        });
    });
}

function getBookmarkName(anime, episode = undefined) {
    return getAnimeTitle(anime).slice(0, 40) + (episode !== undefined ? " : Ep " + episode : "");
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