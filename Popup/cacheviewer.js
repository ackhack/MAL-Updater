var animeCache;
var currFilter = "all";
var currSort = "name";
var currCard;
var mainDiv;
var metaVisible = false;

init();

function init() {

    Array.from(document.getElementsByClassName("dropdownOptionFilter")).forEach(option => option.onclick = (ev) => { clickedFilter(ev) });
    Array.from(document.getElementsByClassName("dropdownOptionSort")).forEach(option => option.onclick = (ev) => { clickedSort(ev) });

    mainDiv = document.getElementById("mainDiv");
    document.onkeydown = function (evt) {
        evt = evt || window.event;
        if (evt.key == "Escape") {
            closedMeta();
        }
    };

    document.getElementById("btnClose").onclick = closedMeta;
    document.getElementById("btnDelete").onclick = deleteMeta;

    chrome.storage.local.get("MAL_AnimeCache", function (result) {
        animeCache = result ? result["MAL_AnimeCache"] ?? {} : {};

        createCards();
    });
}

function createCards() {
    let cards = [];

    for (let id in animeCache) {
        if (currFilter == "all") {
            cards.push(createCard(id + ": " + getAnimeTitle(animeCache[id]), animeCache[id]));
            continue;
        }
        if (animeCache[id][currFilter].length > 0)
            cards.push(createCard(id + ": " + animeCache[id][currFilter][0].replace(/^(.)|-(.)/g, (_, g1, g2) => { return g1 ? " " + g1.toLocaleUpperCase() : g2 ? " " + g2.toLocaleUpperCase() : "Unknown" }).slice(1), animeCache[id]));
    }

    switch (currSort) {

        case "id":
            break;
        case "name":

            cards.sort((a, b) => a.innerText.slice(a.innerText.indexOf(" ") + 1).localeCompare(b.innerText.slice(b.innerText.indexOf(" ") + 1)));

            break;

        default:
    }

    cards.forEach(x => mainDiv.appendChild(x));
}

function createCard(title, metaData) {
    let div = document.createElement("div");
    div.id = metaData.meta.id;
    div.className = "card";
    div.innerText = title;
    let info = document.createElement("span");
    info.style = "display:none";
    info.innerText = JSON.stringify(metaData);
    div.appendChild(info);
    div.onclick = (ev) => clickedCard(ev);
    return div;
}

function clearCards() {
    mainDiv.innerHTML = "";
}

function updateCards() {
    clearCards();
    createCards();
}

function clickedFilter(event) {
    if (currFilter == event.target.innerText.toLowerCase())
        return;

    document.getElementById("btnFilter").innerText = "Filter: " + event.target.innerText;
    currFilter = event.target.innerText.toLowerCase();
    updateCards();
}

function clickedSort(event) {
    if (currSort == event.target.innerText.toLowerCase())
        return;

    document.getElementById("btnSort").innerText = "Sort: " + event.target.innerText;
    currSort = event.target.innerText.toLowerCase();
    updateCards();
}

function clickedCard(event) {
    currCard = JSON.parse(event.target.children[0].innerText);
    document.getElementById("metaDiv").style = "display: block;position:fixed;";
    document.getElementById("metaInfo").innerHTML = "";
    document.getElementById("metaInfo").appendChild(createListFromMeta(event.target.children[0].innerText));
}

function closedMeta() {
    currCard = undefined;
    document.getElementById("metaDiv").style = "display: none";
}

function deleteMeta() {
    if (!confirm("Do you really want to delete this Entry"))
        return;

    delete animeCache[currCard.meta.id];
    syncCache();
    clearCards();
    createCards(currFilter, currSort);
    closedMeta();
}

function syncCache() {
    chrome.storage.local.set({ "MAL_AnimeCache": animeCache });
}

function createListFromMeta(cardString) {
    let card = JSON.parse(cardString);

    let ul = document.createElement("ul");
    ul.style = "font-size: x-large;";

    for (let elem in card) {

        if (elem == "meta") {
            for (let subelem in card[elem]) {

                let li = document.createElement("li");

                if (subelem == "id") {
                    li.innerText = "ID: " + card[elem][subelem];
                    ul.insertBefore(li, ul.children[0]);
                    continue;
                }

                li.innerText += subelem + ": " + JSON.stringify(card[elem][subelem]);
                if (li.innerText.length > 500) {
                    li.innerText = li.innerText.slice(0, 500) + "...";
                    li.style = "font-size: small;";
                }
                ul.appendChild(li);
            }
            continue;
        }
        let li = document.createElement("li");
        li.innerText += elem + ": " + card[elem];
        ul.appendChild(li);
    }

    return ul;
}