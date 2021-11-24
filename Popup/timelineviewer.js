var animeCache;
init();

function init() {
    chrome.storage.local.get("MAL_AnimeCache", function (result) {
        animeCache = result ? result["MAL_AnimeCache"] ?? {} : {};
        createTimeline();
        sortTimeline();
    });
}

function createTimeline() {
    if (animeCache == {})
        return;

    let now = Date.now();
    for (let name in animeCache) {
        let anime = animeCache[name];
        if (anime.meta.end_date !== undefined && new Date(anime.meta.end_date) < now)
            continue;
        if (anime.meta.start_date === undefined || new Date(anime.meta.start_date) > now)
            continue;
        
        createTimelineElement(anime);
    }
}

function createTimelineElement(anime) {
    if (anime.meta.broadcast === undefined || anime.meta.broadcast.day_of_the_week === undefined || anime.meta.broadcast.start_time === undefined) {
        let element = document.createElement("div");
        element.classList.add("timeline-element");
        element.innerText = "??:??: " + getAnimeTitle(anime);
        document.getElementById("divUnknown").appendChild(element);
        return;
    }

    let parentDiv = document.getElementsByName(anime.meta.broadcast.day_of_the_week)[0];
    if (parentDiv == undefined)
        return;
    let element = document.createElement("div");
    element.classList.add("timeline-element");
    element.innerText = anime.meta.broadcast.start_time + ": " + getAnimeTitle(anime);
    element.name = anime.meta.broadcast.start_time;
    parentDiv.children[1].appendChild(element);
}

function sortTimeline() {
    for (let weekDiv of document.getElementsByClassName("weekDiv")) {
        let children = weekDiv.children[1].children;
        let sortedChildren = Array.from(children).sort((a, b) => {
            if (a.name == "00:00")
                return -1;
            if (b.name == "00:00")
                return 1;
            return a.name - b.name;
        });
        weekDiv.children[1].innerHTML = "";
        for (let child of sortedChildren) {
            weekDiv.children[1].appendChild(child);
        }
    }
}

function getAnimeTitle(anime) {
    if (anime.meta.alternative_titles) {
        if (anime.meta.alternative_titles.en) {
            return anime.meta.alternative_titles.en;
        }
    }
    return anime.meta.title ?? "Unnamed Anime";
}
