function selectInjector(sender) {
    for (let site of injectObject) {
        for (let match of site.matches) {
            if (sender.url.match(match)) {
                injectScript(sender, site);
            }
        }
    }
}

function injectScript(sender, site) {
    for (let script of site.js) {
        if (site.all_frames === true) {
            chrome.scripting.executeScript({
                target: {
                    tabId: sender.tab.id,
                    allFrames: true
                },
                files: [script]
            }, () => {});
        } else {
            chrome.scripting.executeScript({
                target: {
                    tabId: sender.tab.id
                },
                files: [script]
            }, () => {});
        }
    }
}

var injectObject = [{
    "matches": [
        "https:\\/\\/ackhack\\.github\\.io\\/MAL-Updater\\/\\?.*"
    ],
    "js": [
        "docs/grabCodeAndState.js"
    ]
},
{
    "matches": [
        "https:\\/\\/kaa-play\\.me\\/.*",
        "https:\\/\\/gogo-play\\.tv\\/.*",
        "https:\\/\\/www.mp4upload\\.com\\/.*",
        "https:\\/\\/mcloud\\.to\\/embed\\/.*",
        "https:\\/\\/vidstream\\.pro\\/(e|embed)\\/.*",
        "https:\\/\\/www\\.dailymotion\\.com\\/embed\\/video\\/.*",
        "https:\\/\\/betaplayer\\.life\\/api\\/embed\\/.*",
        "https:\\/\\/streamani\\.net\\/.*",
        "https:\\/\\/vidstreamz\\.online\\/embed\\/.*",
        "https:\\/\\/beststremo\\.(xyz|com)\\/[a-zA-Z0-9-]+\\/(pref|player\\d*)\\.php\\?.*",
        "https:\\/\\/kaaplayer\\.com\\/[a-zA-Z0-9-]+\\/(pref|player\\d*)\\.php\\?.*",
        "https:\\/\\/kaast1\\.com\\/[a-zA-Z0-9-]+\\/(pref|player\\d*)\\.php\\?.*",
        "https:\\/\\/videovard\\.sx\\/e\\/.*",
        "https:\\/\\/streamtape\\.com\\/e\\/.*",
        "https:\\/\\/www\\.mp4upload\\.com\\/embed-.*",
        "https:\\/\\/gogoplay1\\.com\\/streaming\\.php.*"
    ],
    "js": [
        "InjectScripts/playerInject.js"
    ],
    "all_frames": true
},
{
    "matches": [
        "https:\\/\\/myanimelist\\.net\\/animelist\\/.*\\?status=6",
    ],
    "js": [
        "InjectScripts/malInject.js"
    ]
}
]