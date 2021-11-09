function getAnime(req, callb, nTry = 0) {
    getActiveVariable(active => {
        if (!active) {
            callb({ inactive: true });
        }
        nTry++;

        getUserTokenVariable(usertoken => {
            getCacheByName(req.site, req.name, result => {
                let cached = nTry == 1 ? result : undefined;

                if (cached !== undefined) {

                    console.log("Cached: " + req.name);
                    checkLastEpisode(cached.meta.id, req.episode, usertoken, (lastWatched, episode) => {
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
                                    callb({ error: "Couldn`t get Result from API: " + JSON.stringify(responseJSON) });
                                } else {
                                    getAnime(req, callb, nTry);
                                }
                            } else {
                                checkLastEpisode(responseJSON.id, req.episode, usertoken, (lastWatched, episode) => {
                                    responseJSON.lastWatched = lastWatched;
                                    responseJSON.lastEpisode = episode;
                                    callb(responseJSON);
                                });
                            }
                        });

                }
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
        } else {

            getCacheById(req.id, result => {
                let anime = result;
                if (anime === undefined) {
                    callb({ num_episodes_watched: -1 });
                    return;
                }

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
                                    if (req.episode == responseJSON.num_episodes_watched) {
                                        setBookmark(req.id, req.url, req.nextURL);
                                    }
                                    callb(responseJSON)
                                });
                            });
                    }
                }

                if (anime.meta.num_episodes == undefined || anime.meta.num_episodes == 0) {
                    setCache({ id: req.id, force: true }, () => { updateEpisode() });
                } else {
                    updateEpisode();
                }
            });
        }
    });
    return true;
}

function getAnimeDetails(id, callb) {
    getUserTokenVariable(usertoken => {
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

function getAnimeTitle(anime) {
    if (anime.meta.alternative_titles) {
        if (anime.meta.alternative_titles.en) {
            return anime.meta.alternative_titles.en;
        }
    }
    return anime.meta.title ?? "Unnamed Anime";
}

function getActiveAnime(callb = () => { }) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0]) {
            getCacheByURLAsync(tabs[0].url, callb);
        }
    });
    return true;
}