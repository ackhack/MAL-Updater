var firstS = false;

init();

function init() {
    if (window.location.toString().includes("https://kaa-play.me/dust/")) {
        return;
    }

    addKeyListener();
}

function addKeyListener(nTry = 0) {
    if (document.getElementsByTagName("video").length > 0) {
        if (!window.location.toString().includes("gogo-play.tv") && !window.location.toString().includes("kaa-play.me"))
            document.body.addEventListener("keypress", (ev) => keyListener(ev));
        else
            document.getElementsByTagName("video")[0].addEventListener("keypress", (ev) => keyListener(ev));
    }
    else {
        if (nTry < 20) {
            nTry++;
            setTimeout(() => { addKeyListener(nTry) }, 500);
        }
    }
}

function keyListener(event) {
    if (event.key == 's' && !event.metaKey) {
        handleSkip();
    }
}

function handleSkip() {
    if (!firstS) {
        firstS = true;
        setTimeout(() => { firstS = false; }, 500);
    } else {
        let vids = document.getElementsByTagName("video");
        if (vids.length > 0)
            vids[0].currentTime += 90;
    }
}
