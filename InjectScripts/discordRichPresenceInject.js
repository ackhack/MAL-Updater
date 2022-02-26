//#region Discord Websocket Override
const encodeString = str => str ? str.split("\\").join("\\\\").split("\"").join("\\\"") : str
let status = "online", since = 0, afk = false, timer, discordSocket = undefined;
WebSocket.prototype.oldSend = WebSocket.prototype.send;
window.discordActivityData = {
	sendUpdate: false,
	activityType: 3,
	activityName: "",
	activityUrl: "",
	activityDetails: "",
	activityState: "",
	activityPartyCur: "",
	activityPartyMax: ""
}
window.WebSocket.prototype.send = function (d) {
    if (this.url.includes("gateway.discord.gg")) {
        console.log("[Override] Discord WebSocket detected");
        discordSocket = this;
        let start = d.substr(0, 8)
        if (start == '{"op":3,') {
            let j = JSON.parse(d)
            status = j.d.status
            since = j.d.since
            afk = j.d.afk
            window.SetDiscordActivitySendStatus()
        } else {
            if (start == '{"op":2,') {
                clearInterval(timer)
                timer = setInterval(() => {
                    if (window.discordActivityData.sendUpdate) {
                        window.discordActivityData.sendUpdate = false
                        window.SetDiscordActivitySendStatus()
                    }
                }, 500)
            }
            WebSocket.prototype.oldSend.apply(this, [d]);
        }
    } else {
        WebSocket.prototype.oldSend.apply(this, [d]);
    }
}
window.SetDiscordActivitySendStatus = () => {
    if (discordSocket && discordSocket.readyState == WebSocket.OPEN) {
        let activity = {
			type: window.discordActivityData.activityType,
			name: window.discordActivityData.activityName
		}
		if (window.discordActivityData.activityType == 1) {
			activity.url = window.activityUrl
		}
		if (window.discordActivityData.activityPartyCur != "" && window.discordActivityData.activityPartyMax != "") {
			activity.party = { size: [window.discordActivityData.activityPartyCur, window.discordActivityData.activityPartyMax] }
		}
		if (window.discordActivityData.activityDetails) {
			activity.details = window.discordActivityData.activityDetails
		}
		if (window.discordActivityData.activityState) {
			activity.state = window.discordActivityData.activityState
		}
        WebSocket.prototype.oldSend.apply(discordSocket, [JSON.stringify({
            op: 3, d: {
                status,
                activities: [activity],
                since,
                afk
            }
        })]);
    }
}

function setDiscordActivity(msg) {
    console.log("[Override] Setting discord activity to " + msg.name);
	window.discordActivityData = {
		sendUpdate: true,
		activityType: msg.type,
		activityName: encodeString(msg.name),
		activityUrl: encodeString(msg.streamurl),
		activityDetails: encodeString(msg.details),
		activityState: encodeString(msg.state),
		activityPartyCur: encodeString(msg.partycur),
		activityPartyMax: encodeString(msg.partymax)
	}
}
//#endregion

let recentName = "", recentEpisode = "", id = "", running = false;
initFetching();

function initFetching() {
    if (running) {
        return;
    }
    let pTag = document.getElementById("MAL-Updater");
    if (pTag != null) {
        id = pTag.innerText;
        running = true;
        fetchStatus();
    } else {
        close();
    }
}

function fetchStatus() {
    console.log("[MAL-Updater] Fetching status");
    chrome.runtime.sendMessage(id, {
        type: "getDiscordStatus"
    }, (response) => {
        if (response != undefined && response.valid) {
            if (response.close) {
                setTimeout(() => {
                    chrome.runtime.sendMessage(id, {
                        type: "closeDiscord"
                    })
                }, 10000);
            }
            else if (!response.empty && (response.msg.details != recentName || response.msg.episode != recentEpisode)) {
                recentName = response.msg.details;
                recentEpisode = response.msg.episode;
                setDiscordActivity(response.msg);
            }
            setTimeout(fetchStatus, 5000);
        } else {
            fetchStatus();
        }
    });
}