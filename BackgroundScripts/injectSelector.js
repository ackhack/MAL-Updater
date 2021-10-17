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
            chrome.tabs.executeScript(sender.tab.id,
                {
                    file: script,
                    allFrames: true,
                    runAt: site.run_at ?? "document_idle"
                });
        } else {
            chrome.tabs.executeScript(sender.tab.id,
                {
                    file: script,
                    frameId: sender.frameId,
                    runAt: site.run_at ?? "document_idle"
                });
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
        "https:\\/\\/kaa-play\\.me\\/dust\\/.*",
        "https:\\/\\/beststremo\\.(xyz|com)\\/dust\\/player\\.php\\?.*",
        "https:\\/\\/kaaplayer\\.com\\/dust\\/player\\.php\\?.*"
    ],
    "js": [
        "InjectScripts/kaa-pick-server.js"
    ]
},
{
    "matches": [
        "https:\\/\\/kaa-play\\.me\\/.*",
        "https:\\/\\/gogo-play\\.tv\\/.*",
        "https:\\/\\/www.mp4upload\\.com\\/.*",
        "https:\\/\\/mcloud\\.to\\/embed\\/.*",
        "https:\\/\\/vidstream\\.pro\\/e\\/.*",
        "https:\\/\\/www\\.dailymotion\\.com\\/embed\\/video\\/.*",
        "https:\\/\\/betaplayer\\.life\\/api\\/embed\\/.*",
        "https:\\/\\/streamani\\.net\\/.*",
        "https:\\/\\/vidstreamz\\.online\\/embed\\/.*",
        "https:\\/\\/beststremo\\.(xyz|com)\\/[a-zA-Z0-9-]+\\/(pref|player\\d*)\\.php\\?.*",
        "https:\\/\\/kaaplayer\\.com\\/[a-zA-Z0-9-]+\\/(pref|player\\d*)\\.php\\?.*"
    ],
    "js": [
        "InjectScripts/playerInject.js"
    ]
}
]