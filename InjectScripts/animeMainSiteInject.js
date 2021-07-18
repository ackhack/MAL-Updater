//Add Button to filter List

//Filter List

//gaming

var site;
var cache;

chrome.runtime.sendMessage(
    {
        type: "VALIDATE_MAIN_SITE",
        url: window.location.toString(),
        mainPage: true
    },
    data => {
        if (data) {
            site = data['site'];
            cache = data['cache'];
            insertButton();
        }
    }
);

function insertButton() {
    let btnFilter = document.createElement("button");
    btnFilter.id = "MAL_UPDATER_BUTTON_1";
    btnFilter.style = "width: 20em;height: 3em;background-color: " + site.bgColor + ";border: 3px solid " + site.pageColor + ";color: white;";
    btnFilter.textContent = "Filter List";
    btnFilter.onclick = () => { filterList(); };
    let navbar = getButtonParent();
    for (let i = 0; i < site.mainPageParentIndex; i++) {
        navbar = navbar.parentElement;
    }
    if (site.buttonInsertBeforeIndex != -1) {
        navbar.insertBefore(btnFilter, navbar.children[site.mainPageButtonInsertBeforeIndex]);
    } else {
        navbar.appendChild(btnFilter);
    }
}

function getButtonParent() {
    switch (site.mainPageButtonParentType) {
        case "id":
            return document.getElementById(site.mainPageButtonParent);
        case "class":
            return document.getElementsByClassName(site.mainPageButtonParent)[0];
        default:
            return null;
    }
}

function filterList() {
    let list = document.getElementsByClassName(site.mainPageListName)[0];

    for (let i = 0; i < list.childElementCount; i++) {
        let inCache = false;
        let item = list.children[i];

        for (let aTag of item.getElementsByTagName("a")) {
            let res = aTag.href.match(site.urlPattern);

            if (res) {
                for (let elem in cache) {
                    if (cache[elem][site.siteName] === res[site.nameMatch]) {
                        inCache = true;
                        break;
                    }
                }
            }
        }
        
        if (!inCache) {
            item.remove();
            i--;
        }
    }
}