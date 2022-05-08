init();
let mainDiv = document.getElementById("mainDiv");

function init() {
    Array.from(document.getElementsByClassName("dropdownOptionTimezone")).forEach(option => option.onclick = (ev) => { clickedTimezone(ev) });
    document.getElementById("btnTimezone").innerText = "Timezone: " + document.getElementById("divTimezone").children[0].innerText;
    createTimeline(hourOffsetFromJST());
}

function createTimeline(hourOffset = 0) {

    clearTimeline();
    getTimeline(hourOffset, tl => {
        if (tl.length == 0)
            return;
        for (let anime of tl) {
            createTimelineElement(anime);
        }
    });
}

function createTimelineElement(anime) {
    if (anime.time == undefined || anime.day == undefined) {
        let element = document.createElement("div");
        element.classList.add("timeline-element");
        element.innerText = "??:??: " + anime.name;
        document.getElementById("divUnknown").children[1].appendChild(element);
        return;
    }

    let parentDiv = mainDiv.children[anime.day];
    if (parentDiv == undefined)
        return;

    let element = document.createElement("div");
    element.classList.add("timeline-element");
    element.innerText = anime.time + ": " + anime.name;
    element.name = anime.time;
    parentDiv.children[1].appendChild(element);
}

function clearTimeline() {
    Array.from(document.getElementsByClassName("divElements")).forEach(element => { element.innerHTML = ""; });
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