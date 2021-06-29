function setCache(req, callb = () => { }) {
    
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
            
            syncCache();
            callb(animeCache[req.id]);
        })
    } else {
        animeCache[req.id][req.site] = req.name;
        syncCache();
        callb(animeCache[req.id]);
    }
    return true;
}

function getCache(site, name) {

    for (let elem in animeCache) {
        if (animeCache[elem][site] === name) {
            return animeCache[elem];
        }
    }
    return undefined;
}

function getCacheById(id) {
    return animeCache[id];
}

function deleteCache(query = {}, callb = () => { }) {
    if (query.all) {
        animeCache = {};
        syncCache();
        callb(true);
        return true;
    }

    if (query.id) {
        delete animeCache[id];
        syncCache();
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
                        syncCache();
                        callb(true);
                        return;
                    }
                }
            }

        });
        return true;
    }
    callb(false);
    return false;
}

function syncCache() {
    //Save to local Storage
    chrome.storage.local.set({ "MAL_AnimeCache": animeCache }, function () { });
}

function getCacheByURL(url) {
    for (let site in sites) {
        let match = url.match(sites[site].urlPattern);
        if (match != null) {
            return getCache(site, match[sites[site].nameMatch]);
        }
    }
    return undefined;
}