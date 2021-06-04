var sites = {};
var active;
var checkLastEpisodeBool;
var binge = new Set();
var animeCache;

function getAnime(req, callb, nTry = 0) {
    if (!active) {
        callb({ inactive: true });
    }
    nTry++;

    let cached = nTry == 1 ? getCache(req.site, req.name) : undefined;

    if (cached !== undefined) {

        console.log("Cached: " + req.name);
        checkLastEpisode(cached.meta.id, req.episode, (lastWatched, episode) => {
            callb({
                meta: cached.meta,
                cache: true,
                lastWatched: lastWatched,
                lastEpisode: episode
            });
        })

        return true;

    } else {

        //API max charNumber is 64
        if (req.name.length > 64)
            req.name = req.name.substring(0, 64);

        fetch("https://api.myanimelist.net/v2/anime?fields=alternative_titles?limit=10&q=" + req.name, {
            headers: {
                Authorization: "Bearer " + usertoken.access
            }
        })
            .then(response => response.json())
            .then(responseJSON => {
                if (responseJSON.error) {
                    if (nTry > 9) {
                        callb({ error: "Couldn`t get Result from API:" + JSON.stringify(responseJSON) });
                    } else {
                        getAnime(req, callb, nTry);
                    }
                } else {
                    checkLastEpisode(responseJSON.id, req.episode, (lastWatched, episode) => {
                        responseJSON.lastWatched = lastWatched;
                        responseJSON.lastEpisode = episode;
                        getDisplayMode(displayMode => {
                            responseJSON.displayMode = displayMode;
                            callb(responseJSON);
                        })
                    });
                }
            });
        return true;
    }
}

function checkLastEpisode(id, episode, callb) {
    if (checkLastEpisodeBool == false) {
        callb(undefined, undefined);
        return;
    }
    if (episode == 1 || episode == 0 || id === undefined) {
        callb(true, undefined);
        return;
    }
    if (binge.has(id)) {
        callb(true, undefined);
        return;
    }

    fetch("https://api.myanimelist.net/v2/anime/" + id + "?fields=my_list_status", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + usertoken.access,
        },
    })
        .then(response => {
            response.json().then((json) => {
                if (json.my_list_status) {
                    if (json.my_list_status.num_episodes_watched)
                        callb(episode - 1 == json.my_list_status.num_episodes_watched, json.my_list_status.num_episodes_watched);
                    else
                        callb(true, undefined);
                } else {
                    callb(undefined, undefined);
                }
            })
        });
}

function finishedEpisode(req, callb) {

    removeBinge(req.id);

    //rating only exists if anime was finished
    if (req.rating) {
        fetch("https://api.myanimelist.net/v2/anime/" + req.id + "/my_list_status", {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + usertoken.access,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: 'status=completed&num_watched_episodes=' + req.episode + '&score=' + req.rating
        })
            .then(response => {
                response.json().then(responseJSON => {
                    if (req.episode == responseJSON.num_episodes_watched) {
                        setBookmark(req.id, req.url, undefined);
                    }
                    callb(responseJSON);
                });
            });
        return true;
    } else {
        console.log(req);
        let anime = getCacheById(req.id);

        console.log(anime);

        if (anime === undefined) {
            callb({ num_episodes_watched: -1 });
            return;
        }

        if (anime.meta.num_episodes == req.episode && req.force == false) {
            callb({ last: true, next: getSequel(anime.meta.related_anime) });
        } else {
            fetch("https://api.myanimelist.net/v2/anime/" + req.id + "/my_list_status", {
                method: "PUT",
                headers: {
                    "Authorization": "Bearer " + usertoken.access,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: 'status=watching&num_watched_episodes=' + req.episode
            })
                .then(response => {
                    response.json().then(responseJSON => {
                        if (req.episode == responseJSON.num_episodes_watched) {
                            setBookmark(req.id, req.url, req.nextURL);
                        }
                        callb(responseJSON)
                    });
                });
        }
        return true;
    }
}

function getDisplayMode(callb) {
    chrome.storage.local.get(["MAL_Settings_DisplayMode"], function (result) {

        if (result != {} && result["MAL_Settings_DisplayMode"] != undefined) {
            callb(result["MAL_Settings_DisplayMode"]);
            return;
        }
        chrome.storage.local.set({ ["MAL_Settings_DisplayMode"]: true }, function () { });
        callb(true);
    });
}

function getAnimeDetails(id, callb) {
    //Gets the episode number of an anime
    fetch("https://api.myanimelist.net/v2/anime/" + id + "?fields=num_episodes,related_anime,alternative_titles", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + usertoken.access,
        },
    })
        .then(response => {
            response.json().then((json) => {
                callb(json);
            })
        });
}

function getSequel(related) {
    for (let rel of related) {
        if (rel.relation_type == "sequel") {
            return rel.node.title;
        }
    }
    return undefined;
}

function getTitle(anime) {
    if (anime.meta.alternative_titles) {
        if (anime.meta.alternative_titles.en) {
            return anime.meta.alternative_titles.en;
        }
    }
    return anime.meta.title;
}