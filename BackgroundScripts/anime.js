function getAnime(req, callb, nTry = 0) {
    getActiveVariable(active => {
        if (!active) {
            callb({ inactive: true });
        }
        nTry++;

        getUserTokenVariable(usertoken => {
            getCacheBySiteId(req.site, req.name, result => {
                let cached = nTry == 1 ? result : undefined;

                if (cached !== undefined) {
                    console.log("[Cache] Loaded from Cache: " + getAnimeTitle(cached));
                    checkLastEpisode(cached.meta.id, req.episode, usertoken, (lastWatched, episode) => {
                        callb({
                            meta: cached.meta,
                            cache: 'local',
                            lastWatched: lastWatched,
                            lastEpisode: episode
                        });
                    })
                    return true;
                }

                function getAnimesFromAPI() {
                    //API max charNumber is 64
                    let name = req.name.length > 64 ? req.name.substring(0, 64) : req.name;

                    fetch("https://api.myanimelist.net/v2/anime?fields=alternative_titles?limit=10&q=" + name, {
                        headers: {
                            Authorization: "Bearer " + usertoken.access
                        }
                    })
                        .then(response => response.json())
                        .then(responseJSON => {
                            if (responseJSON.error) {
                                if (nTry > 9) {
                                    callb({ error: "Couldn`t get Result from API: " + JSON.stringify(responseJSON) });
                                } else {
                                    getAnime(req, callb, nTry);
                                }
                            } else {
                                checkLastEpisode(responseJSON.id, req.episode, usertoken, (lastWatched, episode) => {
                                    responseJSON.lastWatched = lastWatched;
                                    responseJSON.lastEpisode = episode;
                                    console.log("[Cache] Loaded Animes from API: " + name);
                                    callb(responseJSON);
                                });
                            }
                        });
                }

                getIdFromGlobalCache(req.site, req.name, id => {
                    if (id === undefined) {
                        getAnimesFromAPI();
                    } else {
                        req.id = id;
                        loadIntoCache(req, cached => {
                            checkLastEpisode(cached.meta.id, req.episode, usertoken, (lastWatched, episode) => {
                                console.log("[Cache] Loaded from Global Storage: " + req.name);
                                callb({
                                    meta: cached.meta,
                                    cache: 'global',
                                    lastWatched: lastWatched,
                                    lastEpisode: episode
                                });
                            })
                        });
                    }
                });
            });
        });
    });
    return true;
}

function checkLastEpisode(id, episode, usertoken, callb) {
    if (episode == 1 || episode == 0 || id === undefined) {
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

    getUserTokenVariable(usertoken => {
        getCacheById(req.id, result => {
            let anime = result;
            if (anime === undefined) {
                callb({ num_episodes_watched: -1 });
                return;
            }

            console.log("[Anime] Finished " + getAnimeTitle(anime) + " : " + req.episode);

            // callb({last:false,num_episodes_watched:req.episode});
            // return;

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
                            req.force = true;
                            loadIntoCache(req,callb(responseJSON));
                        });
                    });
            } else {

                function updateEpisode() {
                    if (anime.meta.num_episodes == req.episode && req.force == false) {
                        callb({ last: true, next: getAnimeSequels(anime.meta.related_anime) });
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
                                    callb(responseJSON)
                                });
                            });
                    }
                }

                if (anime.meta.num_episodes == undefined || anime.meta.num_episodes == 0) {
                    loadIntoCache({ id: req.id, force: true }, () => { updateEpisode() });
                } else {
                    updateEpisode();
                }
            }
        });
    });
    return true;
}

function getAnimeDetails(id, callb) {
    getUserTokenVariable(usertoken => {
        //Gets the episode number of an anime
        fetch("https://api.myanimelist.net/v2/anime/" + id + "?fields=num_episodes,related_anime,alternative_titles,start_date,end_date,broadcast", {
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
    });
    return true;
}

function getAnimeSequels(related) {
    let list = [];
    for (let rel of related) {
        if (rel.relation_type == "sequel") {
            list.push(rel.node.title);
        }
    }
    let retString = "";
    for (let sequel of list) {
        retString += sequel + "\n";
    }
    return retString.length > 0 ? retString : undefined;
}

function getActiveAnime(callb = () => { }) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0]) {
            getCacheByURL(tabs[0].url, callb);
        }
    });
    return true;
}