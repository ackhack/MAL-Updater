chrome.alarms.onAlarm.addListener(
    function (alarm) {

        if (alarm.name.startsWith("force_close")) {
            chrome.tabs.get(parseInt(alarm.name.substring(11)), (newTab) => {
                if (!chrome.runtime.lastError) {
                    chrome.tabs.remove(newTab.id);
                }
            })
            return;
        }

        switch (alarm.name) {
            case "cycle10min":
                console.log("[Alarm] 10Min Cycle");
                checkUpdateCycle();
                getBookmarkAutoSmartVariable(active => {
                    if (!active) {
                        createAutoBookmarks();
                    }
                })
                return;
            case "newAccessToken":
                console.log("[Alarm] New Access Token");
                refreshAccessToken();
                return;
            case "smartBookmark":
                console.log("[Alarm] Smart Bookmark");
                smartBookmarkLoop();
                return;
        }
    }
)

function startAlarms() {
    chrome.alarms.create("cycle10min", { delayInMinutes: 0, periodInMinutes: 10 });
}