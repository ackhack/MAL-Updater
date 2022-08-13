function bookmarkLoop() {
    getBookmarkAutoActiveVariable(bookmarkautoActive => {
        if (!bookmarkautoActive) {
            return;
        }

        console.log("[Bookmark] Checking for new bookmarks");

        getSitesVariable(sites => {
            getPreferredSiteNameVariable(preferredSiteName => {
                processBookmarkLoop(sites[preferredSiteName]);
            });
        });

    });
}

async function processBookmarkLoop(site) {
    getAnimeCacheVariable(async animeCache => {
        getHistoryVariable(async historyObj => {
            getBookmarkAutoNotificationVariable(async bookmarkAutoNotification => {
                async function tryAddAnime(url) {
                    let res = url.match(site.urlPattern);
                    if (res) {
                        for (let elem in animeCache) {
                            if (animeCache[elem][site.siteName].includes(res[site.nameMatch])) {
                                for (let i = historyObj.length - 1; i >= 0; i--) {
                                    if (animeCache[elem].meta.id == historyObj[i].id) {
                                        if (historyObj[i].episode == res[site.episodeMatch] - 1) {
                                            return new Promise(resolve => {
                                                addBookmark(getBookmarkName(animeCache[elem], res[site.episodeMatch]), url, (added) => {
                                                    resolve(added && bookmarkAutoNotification ? {
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
                }

                let addedAnimes = await bookmarkFetches[site.siteName](site, 1, tryAddAnime);

                if (addedAnimes.length > 0 && bookmarkAutoNotification) {
                    let notification = "Bookmarks: Added " + addedAnimes.length + "\n";
                    for (let anime of addedAnimes) {
                        notification += anime.name.slice(0, 10) + " | Ep " + anime.episode + "\n";
                    }
                    sendNotification(notification);
                }
                console.log("[Bookmark] Finished checking for new bookmarks");
            });
        });
    });
}

let bookmarkFetches = {
    "kickassanime": async (site, page, tryAddAnime) => {

        return fetch('https://www2.kickassanime.ro/api/get_anime_list/sub/' + page, {
            method: 'GET'
        })
            .then(async response => response.json())
            .then(async response => {
                let addedAnimes = [];
                for (let anime of response.data) {
                    let ret = await tryAddAnime(site.prefixURL + anime.slug);
                    if (ret) {
                        addedAnimes.push(ret);
                    }
                }
                return addedAnimes;
            })
            .catch(err => { console.error(err); return []; });
    },

    "9anime": async (site, page, tryAddAnime) => {

        return fetch('https://9anime.id/ajax/home/widget/updated-sub?page=' + page, {
            method: 'GET',
            headers: { cookie: 'session=qMmVFNmjiK1GXm12A2gGboNnLoqH5fykSv6Nif6T' }
        })
            .then(async response => response.json())
            .then(async response => {
                let addedAnimes = [];
                let regex = /<a\s+href="(.*?)".*?>/g
                let match = undefined;
                while (match = regex.exec(response.result)) {
                    let ret = await tryAddAnime(site.prefixURL + match[1]);
                    if (ret) {
                        addedAnimes.push(ret);
                    }
                }
                return addedAnimes;
            })
            .catch(err => { console.error(err); return []; });
    },

    "gogoanimehub": async (site, page, tryAddAnime) => {

        return fetch('https://gogoanimeapp.com//page-recent-release.html?type=1&page=' + page, {
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
                    if (!checkedUrls.includes(match[1])) {
                        checkedUrls.push(match[1]);
                        let ret = await tryAddAnime(site.prefixURL + match[1]);
                        if (ret) {
                            addedAnimes.push(ret);
                        }
                    }
                }
                return addedAnimes;
            })
            .catch(err => { console.error(err); return []; });
    }
};