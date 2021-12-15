const fs = require("fs");
const FILEURL = process.env.USERPROFILE + "/Downloads/malCache.json";

importCache(FILEURL);

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
                    console.log("Importing ID:" + id + " || " + site + ": " + imported[id][site]);
                    storage[id][site] = imported[id][site];
                }
            }
        } else {
            for (let site in imported[id])
                console.log("Importing ID:" + id + " || " + site + ": " + imported[id][site]);
            storage[id] = imported[id];
        }
    }

    fs.writeFileSync("./storage.json", JSON.stringify(storage));
}