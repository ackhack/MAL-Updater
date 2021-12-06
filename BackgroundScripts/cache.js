function setCache(req, callb = () => { }) {
    getAnimeCacheVariable((animeCache) => {
        if (animeCache[req.id] === undefined || req.force) {
            getAnimeDetails(req.id, (json) => {

                if (animeCache[req.id] === undefined) {
                    animeCache[req.id] = {};
                }

                json["id"] = req.id;

                animeCache[req.id].meta = json;

                if (req.site !== undefined && req.name !== undefined) {
                    animeCache[req.id][req.site] = req.name;
                }

                setAnimeCacheVariable(animeCache);
                callb(animeCache[req.id]);
            })
        } else {
            animeCache[req.id][req.site] = req.name;
            setAnimeCacheVariable(animeCache);
            callb(animeCache[req.id]);
        }
    });
    return true;
}

function getCacheByName(site, name, callb) {
    getAnimeCacheVariable((animeCache) => {
        for (let elem in animeCache) {
            if (animeCache[elem][site] === name) {
                callb(animeCache[elem]);
                return;
            }
        }
        callb(undefined);
    });
}

function getCacheById(id, callb) {
    getAnimeCacheVariable((animeCache) => {
        callb(animeCache[id]);
    });
}

function getCacheByURL(url, callb = () => { }) {
    getSitesVariable((sites) => {
        for (let site in sites) {
            let match = url.match(sites[site].urlPattern);
            if (match != null) {
                getCacheByName(site, match[sites[site].nameMatch], result => {
                    callb(result)
                })
                return;
            }
        }
        callb(undefined);
    });
    return true;
}

function getCacheByURLs(urls = [], callb = () => { }) {
    let cache = [];
    let finished = 0;
    for (let url of urls) {
        if (url === undefined || url === "") {
            cache.push(undefined);
            finished++;
            if (finished === urls.length) {
                callb(cache);
            }
            continue;
        }
        getCacheByURL(url, (res) => {
            if (res) {
                cache.push(res);
            } else {
                cache.push(undefined);
            }
            finished++;
            if (finished === urls.length) {
                callb(cache);
            }
        });
    }
    return true;
}

function deleteCache(query = {}, callb = () => { }) {
    getAnimeCacheVariable((animeCache) => {
        if (query.all) {
            animeCache = {};
            setAnimeCacheVariable(animeCache);
            callb(true);
            return true;
        }

        if (query.id) {
            delete animeCache[id];
            setAnimeCacheVariable(animeCache);
            callb(true);
            return true;
        }

        if (query.active) {
            chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                if (tabs.length > 0) {
                    validateSite({ url: tabs[0].url }, (site) => {

                        if (site === undefined)
                            return;

                        let res = tabs[0].url.match(site.urlPattern);

                        if (res) {
                            for (let elem in animeCache) {
                                if (animeCache[elem][site.siteName] === res[site.nameMatch]) {
                                    delete animeCache[elem][site.siteName];
                                    setAnimeCacheVariable(animeCache);
                                    callb(true);
                                    return;
                                }
                            }
                        }

                    });
                }
            })
            return true;
        }
        callb(false);
    });
    return false;
}

function exportCache(callb) {
    getAnimeCacheVariable((animeCache) => {
        callb(JSON.stringify(animeCache));
    });
    return true;
}

function importCache(cacheString) {
    try {
        let imported = JSON.parse(cacheString);
        getAnimeCacheVariable((animeCache) => {
            getSitesVariable((sites) => {
                for (let entry in imported) {
                    if (!(entry in animeCache) && 'meta' in imported[entry] && 'id' in imported[entry].meta && 'title' in imported[entry].meta) {
                        animeCache[entry] = imported[entry];
                        continue;
                    }
                    if (entry in animeCache) {
                        for (let site in sites) {
                            if (!(sites[site].siteName in animeCache[entry]) && sites[site].siteName in imported[entry]) {
                                animeCache[entry][sites[site].siteName] = imported[entry][sites[site].siteName];
                            }
                        }
                    }
                }
                setAnimeCacheVariable(animeCache);
            });
        });

    } catch (_) { }
}

function importCacheFile(req) {
    importCache(req.cacheString);
    return true;
}

function deleteActiveCache(callb) {
    deleteCache({ active: true }, callb);
    return true;
}

function dev_redownloadCache(minID = -1) {
    getAnimeCacheVariable((animeCache) => {
        let finished = 0;
        for (let elem in animeCache) {
            let anime = animeCache[elem];
            if (anime.meta.id > minID) {
                getAnimeDetails(anime.meta.id, (json) => {
                    anime.meta = json;
                    finished++;
                    if (finished === Object.keys(animeCache).length) {
                        setAnimeCacheVariable(animeCache);
                    }
                })
            } else {
                finished++;
            }
        }
    });
    return true;
}