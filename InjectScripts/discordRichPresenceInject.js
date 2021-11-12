//#region WebSocket Overrides
const encodeString = str => str ? str.split("\\").join("\\\\").split("\"").join("\\\"") : str
const originalWebSocket = window.WebSocket, originalWebSocketProperties = ["binaryType", "bufferedAmount", "extensions", "onclose", "onmessage", "onopen", "protocol", "readyState", "url"]
let status = "online", since = 0, afk = false, timer, overwriteSuccess = false
window.setDiscordActivityData = {
	sendUpdate: false,
	activityType: 3,
	activityName: "Anime",
	activityUrl: "",
	activityDetails: "Init",
	activityState: "Loading",
	activityPartyCur: "",
	activityPartyMax: ""
}
window.WebSocket = function (u, p) {
	this.downstreamSocket = new originalWebSocket(u, p)
	if (u.indexOf("gateway.discord.gg") > -1) {
		window.SetDiscordActivityActiveSocket = this.downstreamSocket
		malLog("Discord Gateway overwritten");
		overwriteSuccess = true;
		initFetching();
	}
	for (let i in originalWebSocketProperties) {
		Object.defineProperty(this, originalWebSocketProperties[i], {
			get: () => this.downstreamSocket[originalWebSocketProperties[i]],
			set: v => this.downstreamSocket[originalWebSocketProperties[i]] = v
		})
	}
}
window.WebSocket.prototype.send = function (d) {
	if (this.downstreamSocket == window.SetDiscordActivityActiveSocket) {
		const start = d.substr(0, 8)
		if (start == '{"op":3,') {
			const j = JSON.parse(d)
			status = j.d.status
			since = j.d.since
			afk = j.d.afk
			window.SetDiscordActivitySendStatus()
		}
		else {
			if (start == '{"op":2,') {
				clearInterval(timer)
				timer = setInterval(() => {
					if (window.setDiscordActivityData.sendUpdate) {
						window.setDiscordActivityData.sendUpdate = false
						window.SetDiscordActivitySendStatus()
					}
				}, 500)
			}
			this.downstreamSocket.send(d)
		}
	}
	else {
		this.downstreamSocket.send(d)
	}
}
window.WebSocket.prototype.close = function (c, r) {
	this.downstreamSocket.close(c, r)
}
window.WebSocket.CONNECTING = originalWebSocket.CONNECTING
window.WebSocket.OPEN = originalWebSocket.OPEN
window.WebSocket.CLOSING = originalWebSocket.CLOSING
window.WebSocket.CLOSED = originalWebSocket.CLOSED
window.SetDiscordActivitySendStatus = () => {
	if (window.SetDiscordActivityActiveSocket && window.SetDiscordActivityActiveSocket.readyState == originalWebSocket.OPEN) {
		let activity = {
			type: window.setDiscordActivityData.activityType,
			name: window.setDiscordActivityData.activityName
		}
		if (window.setDiscordActivityData.activityType == 1) {
			activity.url = window.activityUrl
		}
		if (window.setDiscordActivityData.activityPartyCur != "" && window.setDiscordActivityData.activityPartyMax != "") {
			activity.party = { size: [window.setDiscordActivityData.activityPartyCur, window.setDiscordActivityData.activityPartyMax] }
		}
		if (window.setDiscordActivityData.activityDetails) {
			activity.details = window.setDiscordActivityData.activityDetails
		}
		if (window.setDiscordActivityData.activityState) {
			activity.state = window.setDiscordActivityData.activityState
		}
		window.SetDiscordActivityActiveSocket.send(JSON.stringify({
			op: 3, d: {
				status,
				activities: [activity],
				since,
				afk
			}
		}))
	}
}

//#endregion

let recentName = "", recentEpisode = "", id = "", running = false;

checkForOverride();

function checkForOverride() {
	setTimeout(() => {
		malLog("Checking for override");
		if (!overwriteSuccess) {
			location.reload();
		}
	}, 5000);
}

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
	malLog("Fetching status");
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

function setDiscordActivity(msg) {
	malLog("Setting discord activity to " + msg.name);
	window.setDiscordActivityData = {
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

function malLog(msg) {
	console.log("[MAL-Updater] " + msg);
}