const encodeString = str => str ? str.split("\\").join("\\\\").split("\"").join("\\\"") : str
const originalWebSocket = window.WebSocket, originalWebSocketProperties = ["binaryType", "bufferedAmount", "extensions", "onclose", "onmessage", "onopen", "protocol", "readyState", "url"]
let status = "online", since = 0, afk = false, timer, portOpen = false
window.SetDiscordActivityData = {
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
		openPort();
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
					if (window.SetDiscordActivityData.sendUpdate) {
						window.SetDiscordActivityData.sendUpdate = false
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
			type: window.SetDiscordActivityData.activityType,
			name: window.SetDiscordActivityData.activityName
		}
		if (window.SetDiscordActivityData.activityType == 1) {
			activity.url = window.activityUrl
		}
		if (window.SetDiscordActivityData.activityPartyCur != "" && window.SetDiscordActivityData.activityPartyMax != "") {
			activity.party = { size: [window.SetDiscordActivityData.activityPartyCur, window.SetDiscordActivityData.activityPartyMax] }
		}
		if (window.SetDiscordActivityData.activityDetails) {
			activity.details = window.SetDiscordActivityData.activityDetails
		}
		if (window.SetDiscordActivityData.activityState) {
			activity.state = window.SetDiscordActivityData.activityState
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

setTimeout(() => {
	if (!portOpen) {
		location.reload()
	}
}, 10000);

function openPort() {
	let pTag = document.getElementById("MAL-Updater")
	if (pTag) {
		let port = chrome.runtime.connect(pTag.innerText, { name: "discord" }), closeOK = false
		portOpen = true

		port.onMessage.addListener(msg => {
			if (msg.action) {
				switch (msg.action) {
					case "close":
						closeOK = true
						break;

					default:
						console.warn("Unknown action", msg.action)
				}
			}
			else if (msg.type !== undefined && msg.name !== undefined) {
				window.SetDiscordActivityData = {
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
		})
		port.onDisconnect.addListener(() => {
			console.info("port closed")
			if (closeOK) {
				closeOK = false
			}
			else {
				location.reload()
			}
		})
	} else {
		close();
	}
}

