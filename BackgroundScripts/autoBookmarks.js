function bookmarkLoop() {
    getBookmarkAutoActiveVariable(bookmarkautoActive => {
        if (!bookmarkautoActive) {
            return;
        }

        console.log("[Bookmark] Checking for new bookmarks");

        getSitesVariable(sites => {
            getPreferredSiteNameVariable(preferredSiteName => {
                let site = sites[preferredSiteName];
                fetch(site.updatePageURL).then(res => {
                    return res.text();
                }).then(body => {
                    processBookmarkLoopBody(site, body);
                }).catch(err => {
                    console.log(err);
                });
            });
        });

    });
}

async function processBookmarkLoopBody(site, body) {
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

                let regex = undefined;
                let match = undefined;
                let addedAnimes = [];

                switch (site.siteName) {
                    case "kickassanime":
                        regex = /\s*appData\s*=\s*(\{.*\})\s*\|\|\s*\{\}/;
                        match = body.match(regex);
                        if (match != null) {
                            let json = match[1];
                            let list = JSON.parse(json).animeList;
                            for (let anime of list.sub.concat(list.dub)) {
                                let ret = await tryAddAnime(site.prefixURL + anime.slug.substring(1));
                                if (ret) {
                                    addedAnimes.push(ret);
                                }
                            }
                        }
                        break;
                    case "9anime":
                        //new site
                        regex = /<div\s+id="list-items"\s+class="ani items">((.|\n)*)<\/div>(.|\n)+<nav>/;
                        match = regex.exec(body);
                        if (match) {
                            let regexA = /<a\s+href="([^"]+)">((.|\n)*?)<\/a>/g;
                            let regexDS = /data-status-sub="EP (\d+)(\/\d+)?"/gi;
                            let matchA = undefined;
                            let checkURLs = [];
                            while (matchA = regexA.exec(match[1])) {
                                if (matchA[1].startsWith("/watch/")) {
                                    if (!checkURLs.includes(matchA[1])) {
                                        checkURLs.push(matchA[1]);
                                        let matchDS = regexDS.exec(matchA[2]);
                                        if (matchDS) {
                                            let ret = await tryAddAnime(site.prefixURL + matchA[1] + "/ep-" + matchDS[1]);
                                            if (ret) {
                                                addedAnimes.push(ret);
                                            }
                                        }
                                    }
                                }
                            }
                            break;
                        }
                        //old site
                        regex = /<ul\s+class="anime-list">((.|\n)*)<\/ul>\s*\n?\s*<div\s+class="pagenav">/;
                        match = regex.exec(body);
                        if (match) {
                            let regexA = /<a\s+href="([^"]+)"\s+class="poster"(.|\n)*?>((.|\n)*?)<\/a>/g;
                            let regexDS = /Ep (Full|\d+)/g;
                            let matchA = undefined;
                            let checkURLs = [];
                            while (matchA = regexA.exec(match[1])) {
                                if (matchA[1].startsWith("/watch/")) {
                                    if (!checkURLs.includes(matchA[1])) {
                                        checkURLs.push(matchA[1]);
                                        let matchDS = regexDS.exec(matchA[3]);
                                        //without this line, the script won't match every other instance
                                        matchA[3].match(regexDS)
                                        if (matchDS) {
                                            let ret = await tryAddAnime(site.prefixURL + matchA[1] + "/ep-" + matchDS[1]);
                                            if (ret) {
                                                addedAnimes.push(ret);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        break;
                    case "gogoanimehub":
                        regex = /<div\s+class="last_episodes loaddub">((.|\n)*)<\/div>\s+<\/div>\s+<\/div>\s+<div\s+class="clr">/
                        match = regex.exec(body);

                        if (match) {
                            let regexA = /<a\s+href="([^"]+)"\s*\n?\s*title=.*>/g;
                            let matchA = undefined;
                            let checkURLs = [];
                            while (matchA = regexA.exec(match[1])) {
                                if (!checkURLs.includes(matchA[1])) {
                                    checkURLs.push(matchA[1]);
                                    let ret = await tryAddAnime(site.prefixURL + matchA[1]);
                                    if (ret) {
                                        addedAnimes.push(ret);
                                    }
                                }
                            }
                        }
                        break;
                }

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