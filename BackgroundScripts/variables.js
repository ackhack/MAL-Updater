var sites = {};
var active;
var checkLastEpisodeBool;
var binge = new Set();
var animeCache;
var displayMode;

var client;
var code_verifier;
var stateID;
var auth_token;
var usertoken = {
    access: undefined,
    refresh: undefined,
    access_time: undefined,
    refresh_time: undefined,
    access_req_time: undefined,
    refresh_req_time: undefined
} ;

var bookmarkID;
var bookmarkActive;
var preferredSiteName;
var bookmarkautoActive;
var bookmarkAutoRunning = false;

var discordActive;
var lastUpdate = Date.now();
var updateQueue = undefined;
var discordPort;
var recentName = "";
var recentEpisode = 0;

var historyObj = [];

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
        "https:\\/\\/vidstream\\.pro\\/(e|embed)\\/.*",
        "https:\\/\\/www\\.dailymotion\\.com\\/embed\\/video\\/.*",
        "https:\\/\\/betaplayer\\.life\\/api\\/embed\\/.*",
        "https:\\/\\/streamani\\.net\\/.*",
        "https:\\/\\/vidstreamz\\.online\\/embed\\/.*",
        "https:\\/\\/beststremo\\.(xyz|com)\\/[a-zA-Z0-9-]+\\/(pref|player\\d*)\\.php\\?.*",
        "https:\\/\\/kaaplayer\\.com\\/[a-zA-Z0-9-]+\\/(pref|player\\d*)\\.php\\?.*",
        "https:\\/\\/videovard\\.sx\\/e\\/.*",
        "https:\\/\\/streamtape\\.com\\/e\\/.*",
        "https:\\/\\/www\\.mp4upload\\.com\\/embed-.*"
    ],
    "js": [
        "InjectScripts/playerInject.js"
    ]
}
]