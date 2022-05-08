function getAnimeTitle(anime) {
    if (anime.meta.alternative_titles) {
        if (anime.meta.alternative_titles.en) {
            return anime.meta.alternative_titles.en;
        }
    }
    return anime.meta.title ?? "Unnamed Anime";
}

const week = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function getTimeline(houroffset = 0, callb = () => { }) {
    function createTimelineElement(anime, houroffset = 0) {
        if (anime.meta.broadcast === undefined || anime.meta.broadcast.day_of_the_week === undefined || anime.meta.broadcast.start_time === undefined) {
            return { name: getAnimeTitle(anime), time: undefined, day: undefined, id: anime.id };
        }
        let runTime = addHourOffset(week.indexOf(anime.meta.broadcast.day_of_the_week), anime.meta.broadcast.start_time, houroffset);
        return { name: getAnimeTitle(anime), time: runTime[1], day: runTime[0], id: anime.id };
    }

    chrome.storage.local.get("MAL_AnimeCache", function (result) {
        let animeCache = result ? result["MAL_AnimeCache"] ?? {} : {};
        if (animeCache == {})
            return;

        let timeline = [];
        let now = Date.now();

        for (let name in animeCache) {
            let anime = animeCache[name];
            if (anime.meta.end_date !== undefined && new Date(anime.meta.end_date) < now)
                continue;
            if (anime.meta.start_date === undefined || new Date(anime.meta.start_date) > now)
                continue;

            timeline.push(createTimelineElement(anime, houroffset));
        }
        callb(timeline.sort((a, b) => {
            if (a.day === b.day) {
                return a.time.localeCompare(b.time);
            }
            return a.day - b.day;

        }));
        return;
    });

}

function addHourOffset(weekday, hour, offset) {
    let index = weekday;
    if (index == -1 || offset == 0)
        return [weekday, hour];

    let returnHour = hour.split(":")[0];

    returnHour = parseInt(returnHour) + offset;

    if (returnHour >= 24) {
        index = (index + 1) % 7;
        returnHour -= 24;
    } else if (returnHour < 0) {
        index = (index + 6) % 7;
        returnHour += 24;
    }

    return [index, returnHour + ":" + hour.split(":")[1]];
}

function hourOffsetFromJST() {
    return -9 - (new Date().getTimezoneOffset() / 60);
}