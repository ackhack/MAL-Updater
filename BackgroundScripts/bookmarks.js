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

function createAutoBookmarks(useNonPreferred = false) {

    function addAutoCloseObject() {
        let obj = document.createElement("span");
        obj.id = "MAL_UPDATER_AUTO_CLOSE";
        document.body.appendChild(obj);
    }

    getBookmarkAutoActiveVariable(bookmarkautoActive => {
        if (!bookmarkautoActive) {
            return;
        }

        getSitesVariable(sites => {
            getPreferredSiteNameVariable(preferredSiteName => {
                if (!useNonPreferred) {
                    chrome.tabs.create({ url: sites[preferredSiteName].mainPageURL, active: false }, (tab) => {
                        chrome.scripting.executeScript({
                            target: {
                                tabId: tab.id
                            },
                            func: addAutoCloseObject
                        });
                        if (chrome.runtime.lastError) {
                            return;
                        }
                        chrome.alarms.create("force_close" + tab.id, {
                            delayInMinutes: 1,
                        })
                    });
                } else {
                    for (let index in sites) {
                        if (index != preferredSiteName) {
                            chrome.tabs.create({ url: sites[index].mainPageURL, active: false }, (tab) => {
                                chrome.scripting.executeScript({
                                    target: {
                                        tabId: tab.id
                                    },
                                    func: addAutoCloseObject
                                });
                                if (chrome.runtime.lastError) {
                                    return;
                                }
                                chrome.alarms.create("force_close" + tab.id, {
                                    delayInMinutes: 1,
                                })
                            });
                        }
                    }
                }
            });
        });
    });
}

function checkBookmarkAuto(req) {
    let processed = 0;
    let addedAnimes = [];
    getAnimeCacheVariable(animeCache => {
        getHistoryVariable(historyObj => {
            getBookmarkAutoSmartWaitingVariable(smartWaiting => {
                getBookmarkAutoNotificationVariable(bookmarkAutoNotification => {
                    function addBookmarkTmp(anime, callb) {
                        for (let i = historyObj.length - 1; i >= 0; i--) {
                            if (animeCache[anime.cacheName].meta.id == historyObj[i].id) {
                                if (historyObj[i].episode == anime.episode - 1) {
                                    addBookmark(getBookmarkName(animeCache[anime.cacheName], anime.episode), anime.url, (added) => {
                                        if (added) {
                                            addedAnimes.push({
                                                "name": getAnimeTitle(animeCache[anime.cacheName]),
                                                "episode": anime.episode,
                                                "id": animeCache[anime.cacheName].meta.id
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
                    let bookmarkSing = true;
                    for (let anime of req.animes) {
                        if (anime.id == smartWaiting.id && bookmarkSing) {
                            setBookmarkAutoSmartWaitingVariable({ id: -1, iter: 0 });
                            smartBookmarkLoop(false);
                            bookmarkSing = false;
                        }
                        addBookmarkTmp(anime, () => {
                            processed++;
                            if (processed == req.animes.length && addedAnimes.length > 0) {
                                let notification = "Bookmarks: Added " + addedAnimes.length + "\n";
                                for (let anime of addedAnimes) {
                                    notification += anime.name.slice(0, 10) + " | Ep " + anime.episode + "\n";
                                }
                                if (bookmarkAutoNotification) {
                                    sendNotification(notification);
                                }
                            }
                        });
                    }
                });
            });
        });
    });
    return true;
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

function smartBookmarkLoop(create = true) {
    getBookmarkAutoSmartVariable(bookmarkSmartActive => {
        if (!bookmarkSmartActive) {
            return;
        }
        if (create)
            createAutoBookmarks();
        nextSmartBookmarkTime(time => {
            if (time === -1) {
                return;
            }

            chrome.alarms.create("smartBookmark", {
                delayInMinutes: time
            });
        })
    });
}

function nextSmartBookmarkTime(callb) {

    function getNextAnimeInTimeline(timeline = {}, callb = () => { }) {
        let now = new Date(Date.now());
        let day = now.getDay() - 1;
        if (day == -1) day = 6;
        let hour = now.getHours();
        let minute = now.getMinutes();
        let next = {};
        let currDay = 0;
        while (currDay < 7) {
            for (let anime of timeline) {
                if ((anime.day == day && (anime.time >= hour + ":" + minute)) || (currDay > 0 && anime.day == ((day + currDay) % 7))) {
                    if (next.time == undefined || anime.time < next.time) {
                        next = anime;
                    }
                }
            }
            if (next.time) {
                break;
            }
            currDay++;
        }
        callb([next, currDay, hour, minute]);
    }



    getAnimeOffsetVariable(animeOffset => {
        getTimeline(hourOffsetFromJST() + parseFloat(animeOffset), tl => {
            getBookmarkAutoSmartWaitingVariable(info => {
                getNextAnimeInTimeline(tl, ret => {
                    let next = ret[0];
                    if (next.time == undefined) {
                        setBookmarkAutoSmartVariable(false);
                        setBookmarkAutoSmartWaitingVariable({ id: -1, iter: 0 });
                        callb(-1);
                        return;
                    }

                    if (info.id == -1) {
                        next.iter = 0;
                        setBookmarkAutoSmartWaitingVariable(next);
                        let nextTime = ((ret[1] * 1440) + (parseInt(next.time.split(":")[0]) * 60) + parseInt(next.time.split(":")[1])) - (ret[2] * 60 + ret[3]);
                        smartBookmarkLog("Waiting for", next.name, next.time, nextTime);
                        callb(parseInt(nextTime));
                        return;
                    }

                    let nextTime = 1;
                    if (info.iter >= 5) {
                        if (info.iter <= 10) {
                            nextTime = 5;
                        } else {
                            nextTime = 30;
                        }
                    }
                    info.iter++;
                    if (info.iter >= 8) {
                        createAutoBookmarks(true);
                    }

                    let nextDay = ret[1];
                    let nextHour = ret[2];
                    let nextMinute = ret[3] + nextTime;
                    if (nextMinute >= 60) {
                        nextHour++;
                        nextMinute -= 60;
                    }
                    if (nextHour >= 24) {
                        nextDay++;
                        nextHour -= 24;
                    }
                    if (nextDay >= 7) {
                        nextDay = 0;
                    }

                    if ((next.time <= nextHour + ":" + nextMinute) && (next.day == ret[1] && (next.time > ret[2] + ":" + ret[3])) || (next.day == nextDay)) {
                        info = next;
                        info.iter = 0;
                        nextTime = (info.time.split(":")[0] - hour) * 60 + (info.time.split(":")[1] - minute);
                        if (nextTime < 0) {
                            nextTime += 1440;
                        }
                        nextTime = nextTime % 1440;
                        setBookmarkAutoSmartWaitingVariable(info);
                        smartBookmarkLog("Waiting now for", info.name, info.time, nextTime);
                        callb(nextTime);
                    } else {
                        setBookmarkAutoSmartWaitingVariable(info);
                        smartBookmarkLog("Retrying", info.name, [nextHour, nextMinute], nextTime);
                        callb(parseInt(nextTime));
                    }
                });
            });
        });
    });
}

function smartBookmarkLog(prefix, name, time, nextTime) {
    if (typeof time === "object") {
        time = time[0] + ":" + (time[1] < 10 ? "0" : "") + time[1];
    }
    console.log("[Smart Bookmark]: " + prefix + " " + name + " at " + time + " (" + nextTime + " minute" + (nextTime == 1 ? "" : "s") + ")");
}