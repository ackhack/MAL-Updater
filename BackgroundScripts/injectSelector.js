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
    alert("Injecting script for ");
    for (let script of site.js) {
        if (site.all_frames === true) {
            chrome.scripting.executeScript({
                target: {
                    tabId: sender.tab.id,
                    allFrames: true
                },
                files: [script]
            });
        } else {
            chrome.scripting.executeScript({
                target: {
                    tabId: sender.tab.id,
                    frameId: sender.frameId,
                },
                files: [script]
            });
        }
    }
}