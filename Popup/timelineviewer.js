const week = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
var animeCache;
init();

function init() {
    Array.from(document.getElementsByClassName("dropdownOptionTimezone")).forEach(option => option.onclick = (ev) => { clickedTimezone(ev) });
    document.getElementById("btnTimezone").innerText = "Timezone: " + document.getElementById("divTimezone").children[0].innerText;
    chrome.storage.local.get("MAL_AnimeCache", function (result) {
        animeCache = result ? result["MAL_AnimeCache"] ?? {} : {};
        createTimeline(hourOffsetFromJST());
    });
}

function createTimeline(houroffset = 0) {
    if (animeCache == {})
        return;

    let now = Date.now();
    clearTimeline();
    for (let name in animeCache) {
        let anime = animeCache[name];
        if (anime.meta.end_date !== undefined && new Date(anime.meta.end_date) < now)
            continue;
        if (anime.meta.start_date === undefined || new Date(anime.meta.start_date) > now)
            continue;

        createTimelineElement(anime, houroffset);
    }
    sortTimeline();
}

function createTimelineElement(anime, houroffset) {
    if (anime.meta.broadcast === undefined || anime.meta.broadcast.day_of_the_week === undefined || anime.meta.broadcast.start_time === undefined) {
        let element = document.createElement("div");
        element.classList.add("timeline-element");
        element.innerText = "??:??: " + getAnimeTitle(anime);
        document.getElementById("divUnknown").children[1].appendChild(element);
        return;
    }
    let runTime = addHourOffset(anime.meta.broadcast.day_of_the_week, anime.meta.broadcast.start_time, houroffset);

    let parentDiv = document.getElementsByName(runTime[0])[0];
    if (parentDiv == undefined)
        return;

    let element = document.createElement("div");
    element.classList.add("timeline-element");
    element.innerText = runTime[1] + ": " + getAnimeTitle(anime);
    element.name = runTime[1];
    parentDiv.children[1].appendChild(element);
}

function clearTimeline() {
    Array.from(document.getElementsByClassName("divElements")).forEach(element => { element.innerHTML = ""; });
}

function sortTimeline() {
    for (let weekDiv of document.getElementsByClassName("weekDiv")) {
        let children = weekDiv.children[1].children;
        let sortedChildren = Array.from(children).sort((a, b) => {
            return a.name.split(" ")[0].localeCompare(b.name.split(" ")[0]);
        });
        weekDiv.children[1].innerHTML = "";
        for (let child of sortedChildren) {
            weekDiv.children[1].appendChild(child);
        }
    }
}

function clickedTimezone(event) {
    document.getElementById("btnTimezone").innerText = "Timezone: " + event.target.innerText;
    let timezone = event.target.name;
    if (timezone == "current") {
        createTimeline(hourOffsetFromJST());
        return;
    }
    createTimeline(parseInt(timezone));
}

function addHourOffset(weekday, hour, offset) {
    let index = week.indexOf(weekday);
    if (index == -1 || offset == 0)
        return [weekday, hour];

    let returnHour = hour.split(":")[0];

    returnHour = parseInt(returnHour) + offset;

    if (returnHour >= 24) {
        index = (index + 1) % week.length;
        returnHour -= 24;
    } else if (returnHour < 0) {
        index = (index + week.length - 1) % week.length;
        returnHour += 24;
    }

    return [week[index], returnHour + ":" + hour.split(":")[1]];
}

function hourOffsetFromJST() {
    return -9 - (new Date().getTimezoneOffset() / 60);
}