//#region Load from API by Request

function loadIntoCache(req, callb = () => { }) {
    getAnimeCacheVariable((animeCache) => {
        if (animeCache[req.id] === undefined || req.force) {
            getAnimeDetails(req.id, (json) => {
                getSitesVariable((sites) => {

                    if (animeCache[req.id] === undefined) {
                        animeCache[req.id] = {};
                    }

                    json["id"] = req.id;

                    animeCache[req.id].meta = json;
                    for (let siteName in sites) {
                        if (!(sites[siteName].siteName in animeCache[req.id]))
                            animeCache[req.id][sites[siteName].siteName] = [];
                    }

                    if (req.site !== undefined && req.name !== undefined) {
                        animeCache[req.id][req.site].push(req.name);
                    }

                    setAnimeCacheVariable(animeCache);
                    callb(animeCache[req.id]);
                })
            })
        } else {
            if (req.site !== undefined && req.name !== undefined) {
                if (!animeCache[req.id][req.site].includes(req.name))
                    animeCache[req.id][req.site].push(req.name);
            }
            setAnimeCacheVariable(animeCache);
            callb(animeCache[req.id]);
        }
    });
    return true;
}

//#endregion

//#region Get Cache Variants

function getCacheByName(site, name, callb) {
    getAnimeCacheVariable((animeCache) => {
        for (let elem in animeCache) {
            if (animeCache[elem][site].includes(name)) {
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

//#endregion

//#region Delete From Cache by Settings

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

                        if (site === undefined || site.valid === false)
                            return;

                        let res = tabs[0].url.match(site.urlPattern);

                        if (res) {
                            for (let elem in animeCache) {
                                if (animeCache[elem][site.siteName].includes(res[site.nameMatch])) {
                                    animeCache[elem][site.siteName].splice(animeCache[elem][site.siteName].indexOf(res[site.nameMatch]), 1)
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

//#endregion

//#region Import/Export with Filesystem

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
                            //Support older Caches
                            if (typeof imported[entry][sites[site].siteName] === 'string') {
                                imported[entry][sites[site].siteName] = [imported[entry][sites[site].siteName]];
                            }
                            for (let name of imported[entry][sites[site].siteName]) {
                                if (!animeCache[entry][sites[site].siteName].includes(name)) {
                                    animeCache[entry][sites[site].siteName].push(name);
                                }
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

//#endregion

//#region Global

function getIdFromGlobalCache(site, name, callb) {
    fetch('https://raw.githubusercontent.com/ackhack/MAL-Updater/global-storage/storage/' + name[0].toLowerCase() + '/' + site + '.json')
        .then((response) => {
            if (response.status !== 200) {
                callb(undefined);
                return;
            }
            response.json().then((json) => {
                callb(json[name]);
            });
        });
}

//#endregion

//#region Dev

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

//#endregion