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

function getCacheByURLAsync(url, callb = () => { }) {
    getSitesVariable((sites) => {
        for (let site in sites) {
            let match = url.match(sites[site].urlPattern);
            if (match != null) {
                getCacheByName(site, match[sites[site].nameMatch], result => {
                    callb(result)
                })
            }
        }
        callb(undefined);
    });
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

        if (query.url) {
            validateSite(query, (site) => {

                if (site === undefined)
                    return;

                let res = query.url.match(site.urlPattern);

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