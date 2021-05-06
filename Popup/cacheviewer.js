var animeCache;
var currSort;
var currCard;

init();

function init() {

    Array.from(document.getElementsByClassName("dropdownOption")).forEach(option => option.onclick = (ev) => { clickedSort(ev) });

    document.getElementById("btnClose").onclick = closedMeta;
    document.getElementById("btnDelete").onclick = deleteMeta;

    chrome.storage.local.get("MAL_AnimeCache", function (result) {
        if (result)
            animeCache = result["MAL_AnimeCache"] ?? {};
        else
            animeCache = {};

        createCards("ID");
    });
}

function createCards(sort = "ID") {
    currSort = sort.toLowerCase();
    document.getElementById("btnSort").innerText = "Sort: " + sort;

    for (let id in animeCache) {
        if (currSort == "id") {
            createCard(id + ": " + getName(animeCache[id].meta), animeCache[id]);
            continue;
        }
        if (animeCache[id][currSort])
            createCard(id + ": " + animeCache[id][currSort].replace(/^(.)|-(.)/g, (_, g1, g2) => { return g1 ? " " + g1.toLocaleUpperCase() : g2 ? " " + g2.toLocaleUpperCase() : "Unknown" }).slice(1), animeCache[id]);
    }
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
    mainDiv.appendChild(div);
}

function clearCards() {
    mainDiv.innerHTML = "";
}

function clickedSort(event) {
    clearCards();
    createCards(event.target.innerText);
}

function getName(meta) {
    if (meta.alternative_titles?.en) {
        return meta.alternative_titles.en;
    }
    return meta.title;
}

function clickedCard(event) {
    currCard = JSON.parse(event.target.children[0].innerText);
    document.getElementById("metaDiv").style = "display: block";
    document.getElementById("metaInfo").innerHTML = "";
    document.getElementById("metaInfo").appendChild(createDivFromMeta(event.target.children[0].innerText));
}

function closedMeta() {
    currCard = undefined;
    document.getElementById("metaDiv").style = "display: none";
}

function deleteMeta() {
    delete animeCache[currCard.meta.id];
    syncCache();
    clearCards();
    createCards(currSort);
    closedMeta();
}

function syncCache() {
    chrome.storage.local.set({ "MAL_AnimeCache": animeCache }, function () {
        chrome.runtime.sendMessage({
            type: "SYNC_CACHE"
        });
    });
}

function createDivFromMeta(cardString) {
    let card = JSON.parse(cardString);

    let div = document.createElement("div");
    div.style = "font-size: x-large;";
    let meta = document.createElement("div");
    let sites = document.createElement("div");
    sites.style = "border-top: 2px solid white;";
    let id = document.createElement("div");

    for (let elem in card) {
        if (elem == "meta") {
            for (let subelem in card[elem]) {
                if (subelem == "id") {
                    id.innerText = "ID: " + card[elem][subelem];
                    continue;
                }
                let metaSub = document.createElement("div");
                metaSub.style = "border-top: 2px solid white;";
                metaSub.innerText += subelem + ": " + JSON.stringify(card[elem][subelem]);
                meta.appendChild(metaSub);
            }
            continue;
        }
        sites.innerText += "\n" + elem + ": " + card[elem];
    }
    div.appendChild(id);
    div.appendChild(sites);
    div.appendChild(meta);
    return div;
}