var firstS = false;

init();

function init() {
    addKeyListener();
}

function addKeyListener(nTry = 0) {
    if (document.getElementById("MAL-Updater Player Inject") != null) {
        return;
    }
    if (document.getElementsByTagName("video").length > 0) {
        let div = document.createElement("div");
        div.style.display = "none";
        div.id = "MAL-Updater Player Inject";
        document.body.appendChild(div);
        document.addEventListener("keypress", (ev) => keyListener(ev));
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
            vids[0].currentTime += 87;
    }
}
