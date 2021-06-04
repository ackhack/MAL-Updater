//#region Bookmarks

function setBookmark(animeID, oldURL, nextURL) {

    if (!bookmarkActive) {
        return;
    }

    let anime = getCacheById(animeID);
    let name = anime === undefined ? "" : getTitle(anime);
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
                        name = child.title.substring(animeID.length + 1);
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

    if (nextURL) {
        //add new bookmark
        if (name == undefined) {
            fetch("https://api.myanimelist.net/v2/anime/" + animeID, {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + usertoken.access,
                },
            })
                .then(response => {
                    response.json().then((json) => {
                        name = json.title;
                        addBookmark(animeID + ": " + name, nextURL);
                    })
                });
        } else {
            addBookmark(animeID + ": " + name, nextURL);
        }
    }
}

function addBookmark(name, url) {
    getBookmark(bookmarkID, res => {
        if (res != undefined) {
            chrome.bookmarks.create({
                "parentId": bookmarkID,
                "title": name,
                "url": url
            }, () => { })
        } else {
            initSettings(() => { addBookmark(name, url); })
        }
    });
}

function createBookmarkFolder(name) {
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
        return;
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

    for (let site in sites) {

        let match = bookmark.url.match(sites[site].urlPattern);
        if (match != null) {
            let anime = getCache(site, match[sites[site].nameMatch]);

            if (anime !== undefined) {
                let name = anime.meta.id + ": " + getTitle(anime);

                if (bookmark.title == name)
                    return;

                chrome.bookmarks.remove(bookmark.id, () => {
                    addBookmark(anime.meta.id + ": " + getTitle(anime), bookmark.url);
                });
            }
            return;
        }
    }
}

function setAutoBookmark(req) {
    bookmarkautoActive = req.active;
    return true;
}

//#endregion
