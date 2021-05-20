const prios = ["PINK-BIRD", "SAPPHIRE-DUCK", "DAILYMOTION", "BETAPLAYER", "THETA-ORIGINAL", "A-KICKASSANIME", "BETASERVER3"];
initServerPick();

function initServerPick(nTry = 0) {
    if (nTry >= 20) {
        return;
    }

    let list = document.getElementById("server-list");

    if (list !== null) {
        selectServer(list);
    } else {
        nTry++;
        setTimeout(() => { initServerPick(nTry); }, 200);
    }
}

function selectServer(list) {
    let highestprio = prios.length;
    let highestprioIndex = 0;

    for (let opt of list) {
        let index = prios.indexOf(opt.innerText);
        if (index > -1 && index < highestprio) {
            highestprio = index;
            highestprioIndex = opt.index;
        }
    }

    list.selectedIndex = highestprioIndex;
    let e = document.createEvent('HTMLEvents');
    e.initEvent("change", false, true);
    list.dispatchEvent(e);
}