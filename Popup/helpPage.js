init();

function init() {
    document.onkeydown = function (evt) {
        evt = evt || window.event;
        if (evt.key == "Escape") {
            closedMeta();
        }
    };

    document.getElementById("btnClose").onclick = closedMeta;

    fetch(chrome.runtime.getURL('Popup/helpJson.json'))
        .then((response) => {
            response.json().then(responseJson => {
                createCards(responseJson);
            });
        }).catch(err => console.log(err));
}

function createCards(array) {
    let mainDiv = document.getElementById("mainDiv");
    for (let i = 0; i < array.length; i++) {
        mainDiv.appendChild(createCard(array[i]));
    }
}

function createCard(entry) {
    let div = document.createElement("div");
    div.className = "card";
    div.innerText = entry?.name;
    let info = document.createElement("span");
    info.style = "display:none";
    info.innerText = entry?.info;
    div.appendChild(info);
    div.onclick = (ev) => clickedCard(ev);
    return div;
}

function clickedCard(event) {
    document.getElementById("metaDiv").style = "display: block;position:fixed;";
    document.getElementById("metaInfo").innerText = event.target.children[0].innerText;
}

function closedMeta() {
    document.getElementById("metaDiv").style = "display: none";
}