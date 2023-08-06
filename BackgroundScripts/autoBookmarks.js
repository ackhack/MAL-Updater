function bookmarkLoop() {
    getBookmarkAutoActiveVariable(bookmarkautoActive => {
        if (!bookmarkautoActive) {
            return;
        }

        console.log("[Bookmark] Checking for new bookmarks");
        processBookmarkLoop();
    });
}

async function processBookmarkLoop() {
    getBookmarkAutoNotificationVariable(async bookmarkAutoNotification => {
        let addedAnimes = await fetchBookmarks();

        if (addedAnimes.length > 0 && bookmarkAutoNotification) {
            let notification = "Bookmarks: Added " + addedAnimes.length + "\n";
            for (let anime of addedAnimes) {
                notification += anime.name.slice(0, 10) + " | Ep " + anime.episode + "\n";
            }
            sendNotification(notification);
        }
        console.log("[Bookmark] Finished checking for new bookmarks");
    });

}

async function fetchBookmarks() {
    return new Promise(resolve => {
        getAnimeCacheVariable(async animeCache => {
            getHistoryVariable(async historyObj => {
                getSitesVariable(async sites => {
                    async function tryAddAnime(prefix, suffix) {
                        for (let index in sites) {
                            let site = sites[index];
                            if (site.prefixURL == prefix) {
                                let url = prefix + suffix;
                                let res = url.match(site.urlPattern);
                                if (res) {
                                    for (let elem in animeCache) {
                                        if (animeCache[elem][site.id].includes(res[site.nameMatch])) {
                                            for (let i = historyObj.length - 1; i >= 0; i--) {
                                                if (animeCache[elem].meta.id == historyObj[i].id) {
                                                    if (historyObj[i].episode == res[site.episodeMatch] - 1) {
                                                        return new Promise(resolve => {
                                                            addBookmark(getBookmarkName(animeCache[elem], res[site.episodeMatch]), url, (added) => {
                                                                resolve(added ? {
                                                                    "name": getAnimeTitle(animeCache[elem]),
                                                                    "episode": res[site.episodeMatch],
                                                                    "id": animeCache[elem].meta.id
                                                                } : undefined);
                                                            });
                                                        });
                                                    }
                                                    break;
                                                }
                                            }
                                            break;
                                        }
                                    }
                                }
                                break;
                            }
                        }
                    }

                    getPreferredSiteIdVariable(async preferredSiteId => {
                        getBookmarkAutoLastFetchUrlListVariable(async lastFetchUrlList => {

                            let res = await bookmarkFetches[preferredSiteId](sites[preferredSiteId], tryAddAnime, lastFetchUrlList[preferredSiteId]);
                            let addedAnimes = [];
                            let newLastFetchUrlList = {};
                            newLastFetchUrlList[preferredSiteId] = res.lastFetchUrl;

                            for (let index in sites) {
                                let site = sites[index];
                                if (site.id != preferredSiteId) {
                                    let res2 = await bookmarkFetches[site.id](sites[site.id], tryAddAnime, lastFetchUrlList[site.id]);
                                    addedAnimes = addedAnimes.concat(res2.addedAnimes);
                                    newLastFetchUrlList[site.id] = res2.lastFetchUrl;
                                }
                            }

                            setBookmarkAutoLastFetchUrlListVariable(newLastFetchUrlList);
                            resolve(res.addedAnimes);
                        });
                    });
                });
            });
        });
    });
}

const maxPageSearches = 10;
const bookmarkFetches = {
    //kickassanime
    0: async (site, tryAddAnime, lastFetchUrl) => {
        let res = { addedAnimes: [], lastFetchUrl: "" };
        let finished = false;

        for (let page = 1; page < maxPageSearches; page++) {
            if (finished) break;
            await fetch(site.autoBookmarkUrl + page, {
                method: 'GET'
            })
                .then(async response => response.json())
                .then(async response => {

                    let addedAnimes = [];
                    for (let anime of response.result) {

                        if (res.lastFetchUrl == "") res.lastFetchUrl = site.prefixURL + anime.slug;
                        if (lastFetchUrl == site.prefixURL + anime.slug) {
                            res.addedAnimes = res.addedAnimes.concat(addedAnimes);
                            finished = true;
                            return;
                        };

                        let ret = await tryAddAnime(site.prefixURL, anime.slug);
                        if (ret) {
                            addedAnimes.push(ret);
                        }
                    }
                    res.addedAnimes = res.addedAnimes.concat(addedAnimes);
                })
                .catch(err => { console.error(err); });
        }
        if (res.lastFetchUrl == "") res.lastFetchUrl = lastFetchUrl;
        return res;
    },
    //aniwave
    1: async (site, tryAddAnime, lastFetchUrl) => {
        let res = { addedAnimes: [], lastFetchUrl: "" };
        let finished = false;

        for (let page = 1; page < maxPageSearches; page++) {
            if (finished) break;
            await fetch(site.autoBookmarkUrl + page, {
                method: 'GET',
            })
                .then(async response => response.json())
                .then(async response => {

                    let addedAnimes = [];
                    let regex = /<a\s+href="(.*?)".*?>/g
                    let match = undefined;
                    while (match = regex.exec(response.result)) {

                        if (res.lastFetchUrl == "") res.lastFetchUrl = site.prefixURL + match[1];
                        if (lastFetchUrl == site.prefixURL + match[1]) {
                            res.addedAnimes = res.addedAnimes.concat(addedAnimes);
                            finished = true;
                            return;
                        };

                        let ret = await tryAddAnime(site.prefixURL, match[1]);
                        if (ret) {
                            addedAnimes.push(ret);
                        }
                    }
                    res.addedAnimes = res.addedAnimes.concat(addedAnimes);
                })
                .catch(err => { console.error(err); });
        }
        if (res.lastFetchUrl == "") res.lastFetchUrl = lastFetchUrl;
        return res;
    },
    //gogoanime
    2: async (site, tryAddAnime, lastFetchUrl) => {
        let res = { addedAnimes: [], lastFetchUrl: "" };
        let finished = false;

        for (let page = 1; page < maxPageSearches; page++) {
            if (finished) break;
            await fetch(site.autoBookmarkUrl + page, {
                method: 'GET',
                headers: { cookie: 'gogoanime=9o5vj4kvomttllbh8s6s7ilb35' }
            })
                .then(async response => response.text())
                .then(async response => {

                    let addedAnimes = [];
                    let regex = /<a\s+href="(\/.*?)".*?>/g
                    let match = undefined;
                    let checkedUrls = [];
                    while (match = regex.exec(response)) {

                        if (res.lastFetchUrl == "") res.lastFetchUrl = site.prefixURL + match[1];
                        if (lastFetchUrl == site.prefixURL + match[1]) {
                            res.addedAnimes = res.addedAnimes.concat(addedAnimes);
                            finished = true;
                            return;
                        };

                        if (!checkedUrls.includes(match[1])) {
                            checkedUrls.push(match[1]);
                            let ret = await tryAddAnime(site.prefixURL, match[1]);
                            if (ret) {
                                addedAnimes.push(ret);
                            }
                        }
                    }
                    res.addedAnimes = res.addedAnimes.concat(addedAnimes);
                })
                .catch(err => { console.error(err); });
        }
        if (res.lastFetchUrl == "") res.lastFetchUrl = lastFetchUrl;
        return res;
    }
};