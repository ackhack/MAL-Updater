const fs = require("fs");
const nonExistent = [
    { "id": 6862, "site": "kickassanime" },
    { "id": 9734, "site": "gogoanimehub" },
    { "id": 9734, "site": "kickassanime" },
    { "id": 31711, "site": "kickassanime" },
    { "id": 35000, "site": "gogoanimehub" },
    { "id": 35000, "site": "kickassanime" },
    { "id": 37773, "site": "kickassanime" },
    { "id": 38963, "site": "kickassanime" },
    { "id": 40176, "site": "kickassanime" },
    { "id": 44931, "site": "kickassanime" },
    { "id": 48614, "site": "kickassanime" }
]

run();

function run() {
    getStorageAsObject((storage) => {
        let imported = importCache(process.env.USERPROFILE + "/Downloads/malCache.json");
        let missing = getMissingEntries(storage);
        getStorageInfo(storage);
        console.log("Imported Cache: " + imported);
        console.log("Missing Entries: " + missing);
        console.log("Non Existent Entries : " + nonExistent.length);
    });
}

function getMissingEntries(storage) {

    console.log("Missing Entries:\n");
    let count = 0;
    for (let id in storage) {
        if (id == "meta")
            continue;
        for (let siteName of storage["meta"]) {
            if (storage[id][siteName] === undefined && !nonExistent.find(pair => pair.id == id && pair.site == siteName)) {
                console.log("Missing Entry ID:" + id + " || " + siteName + ": ");
                count++;
            }
        }
    }
    return count;
}

function getStorageAsObject(callb) {
    let storage = {};
    let sites = [];

    fs.opendir("./storage", (err, dir) => {
        if (err) throw err;
        let direntLetter = dir.readSync();
        while (direntLetter !== null) {
            let directorySites = fs.opendirSync("./storage/" + direntLetter.name);
            let direntSite = directorySites.readSync();
            while (direntSite !== null) {
                let file = require("./storage/" + direntLetter.name + "/" + direntSite.name);
                for (let name in file) {
                    if (!storage[file[name]]) {
                        storage[file[name]] = {};
                    }
                    let site = direntSite.name.split(".")[0];
                    storage[file[name]][site] = name;
                    if (!sites.includes(site)) {
                        sites.push(site);
                    }
                }
                direntSite = directorySites.readSync();
            }
            directorySites.closeSync();
            direntLetter = dir.readSync();
        }
        dir.closeSync();
        storage["meta"] = sites;
        callb(storage);
    });
}

function getStorageInfo(storage) {
    console.log("Storage Info:\nNumber of IDs: " + Object.keys(storage).length + "\nNumber of Sites: " + storage["meta"].length);
}

function importCache(file) {
    if (!fs.existsSync(file)) {
        console.log("File not found: " + file);
        return 0;
    }
    let content = require(file);
    console.log("Importing Cache:\n");
    let count = 0;
    for (let id in content) {
        for (let site in content[id]) {

            if (site == "meta")
                continue;

            for (let name of content[id][site]) {

                let firstLetter = name[0].toLowerCase();
                let fileName = "./storage/" + firstLetter + "/" + site + ".json";

                if (!fs.existsSync("./storage/" + firstLetter)) {
                    fs.mkdirSync("./storage/" + firstLetter);
                }

                let file = fs.existsSync(fileName) ? require(fileName) : {};

                if (!file[name]) {
                    console.log("Importing New Entry ID:" + id + " || " + site + ": " + name);
                    file[name] = id;
                    count++;
                }
                fs.writeFileSync(fileName, JSON.stringify(file));
            }
        }
    }
    return count;
}