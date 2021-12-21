const fs = require("fs");
const FILEURL = process.env.USERPROFILE + "/Downloads/malCache.json";

//importCache(FILEURL);
getMissingEntries();
//Missing Entry ID:6862 || kickassanime: OK
//Missing Entry ID:9734 || gogoanimehub: OK
//Missing Entry ID:9734 || kickassanime: OK
//Missing Entry ID:31711 || kickassanime:OK
//Missing Entry ID:35000 || gogoanimehub:OK
//Missing Entry ID:35000 || kickassanime:OK
//Missing Entry ID:37773 || kickassanime:OK
//Missing Entry ID:38963 || kickassanime:OK
//Missing Entry ID:40176 || kickassanime:OK
//Missing Entry ID:44931 || kickassanime:OK
//Missing Entry ID:48614 || kickassanime:OK

function importCache(file) {
    let content = require(file);
    let imported = {};
    for (let id in content) {
        let anime = {};
        for (let site in content[id]) {
            if (site == "meta")
                continue;
            anime[site] = content[id][site];
        }
        imported[id] = anime;
    }

    let storage = require("./storage.json");

    for (let id in imported) {
        if (storage[id]) {
            for (let site in imported[id]) {
                if (!(site in storage[id])) {
                    console.log("Importing New Site     ID:" + id + " || " + site + ": " + imported[id][site]);
                    storage[id][site] = imported[id][site];
                } else {
                    for (let name of imported[id][site]) {
                        if (!storage[id][site].includes(name)) {
                            console.log("Importing Existing     ID:" + id + " || " + site + ": " + name);
                            storage[id][site].push(name);
                        }
                    }
                }
            }
        } else {
            for (let site in imported[id]) {
                console.log("Importing New Entry    ID:" + id + " || " + site + ": " + imported[id][site]);
                storage[id] = imported[id];
            }
        }
    }

    fs.writeFileSync("./storage.json", JSON.stringify(storage));
}

function getMissingEntries() {
    let storage = require("./storage.json");

    for (let id in storage) {
        for (let siteName in storage[id]) {
            if (storage[id][siteName].length == 0) {
                console.log("Missing Entry ID:" + id + " || " + siteName + ": ");
            }
        }
    }
}