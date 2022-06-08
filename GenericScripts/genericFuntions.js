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
        return { name: getAnimeTitle(anime), time: runTime[1], day: runTime[0], id: anime.meta.id };
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
        timeline.push({ name: "Test", time: "16:40", day: 2, id: 69420 });
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

    if (weekday == -1 || offset == 0)
        return [weekday, hour];

    while (offset > 24) {
        offset -= 24;
        weekday++;
    }
    weekday = weekday % 7;

    let returnHour = parseInt(hour.split(":")[0]);
    let returnMinute = parseInt(hour.split(":")[1]);

    if (offset % 1 !== 0) {
        returnMinute = returnMinute + (offset % 1) * 60;
        if (returnMinute >= 60) {
            returnMinute -= 60;
            returnHour++;
        }
        if (returnMinute < 0) {
            returnMinute += 60;
            //returnHour--;
        }
    }

    returnHour = returnHour + Math.floor(offset);

    while (returnHour >= 24) {
        weekday = (weekday + 1) % 7;
        returnHour -= 24;
    }
    while (returnHour < 0) {
        weekday = (weekday + 6) % 7;
        returnHour += 24;
    }

    returnHour = returnHour.toString().padStart(2, "0");
    returnMinute = returnMinute.toString().padStart(2, "0");

    return [weekday, returnHour + ":" + returnMinute];
}

function hourOffsetFromJST() {
    return -9 - (new Date().getTimezoneOffset() / 60);
}