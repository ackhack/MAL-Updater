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
            case "updateCheck":
                checkUpdateCycle();
                return;
            case "bookmarkLoop":
                bookmarkLoop();
                return;
            case "newAccessToken":
                refreshAccessToken();
                return;
        }
    }
)

chrome.alarms.create("bookmarkLoop", { delayInMinutes: 0, periodInMinutes: 10 });
chrome.alarms.create("updateCheck", { delayInMinutes: 0, periodInMinutes: 30 });