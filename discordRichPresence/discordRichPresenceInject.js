const injectionCode = () => {
	const originalWebSocket = window.WebSocket, originalWebSocketProperties = ["binaryType", "bufferedAmount", "extensions", "onclose", "onmessage", "onopen", "protocol", "readyState", "url"]
	let status = "online", since = 0, afk = false, timer
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
			console.log(d)
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
},
	injectScript = text => {
		let script = document.createElement("script")
		script.innerHTML = text
		script = document.documentElement.appendChild(script)
		setTimeout(() => {
			document.documentElement.removeChild(script)
		}, 10)
	},
	encodeString = str => str ? str.split("\\").join("\\\\").split("\"").join("\\\"") : str

injectScript("(" + injectionCode.toString() + ")()")

let port = chrome.runtime.connect({ name: "discord" }), closeOK = false
port.onMessage.addListener(msg => {
	console.log(msg)
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
		injectScript(`window.SetDiscordActivityData={
			sendUpdate:true,
			activityType:`+ msg.type + `,
			activityName:\"`+ encodeString(msg.name) + `\",
			activityUrl:\"`+ encodeString(msg.streamurl) + `\",
			activityDetails:\"`+ encodeString(msg.details) + `\",
			activityState:\"`+ encodeString(msg.state) + `\",
			activityPartyCur:\"`+ encodeString(msg.partycur) + `\",
			activityPartyMax:\"`+ encodeString(msg.partymax) + `\"
		}`)
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

// init();

// function init(nTry = 0) {
// 	let deafend = false;
// 	let btns = document.getElementsByTagName("button");
// 	for (let btn of btns) {
// 		//Site is loaded when Deafen-button is found
// 		if (btn.ariaLabel === "Deafen") {
// 			deafenSound();
// 			deafend = true;
// 			break;
// 		}
// 	}
// 	if (nTry < 10 && !deafend) {
// 		console.log("breh");
// 		setTimeout(() => {
// 			init(nTry + 1);
// 		}, 2000);
// 	}
// }

// function deafenSound() {
// 	injectScript("(" + deafenCode.toString() + ")()");
// }

// function deafenCode() {
// 	for (let btn of document.getElementsByTagName("button")) {
// 		if (btn.ariaLabel === "User Settings") {
// 			btn.click();
// 			console.log("Pressed Settings Button");
// 			setTimeout(() => {
// 				for (let div of document.getElementsByTagName("div")) {
// 					if (div.innerHTML === "Voice &amp; Video") {
// 						div.click();
// 						console.log("Pressed V&V Button");
// 						setTimeout(() => {
// 							for (let header of document.getElementsByTagName("h5")) {
// 								if (header.innerHTML === "Output Volume") {
// 									let div = header.parentElement.children[1];
// 									var reactHandlerKey = Object.keys(div).filter(function (item) {
// 										return item.indexOf('__reactEventHandlers') >= 0
// 									});
// 									let startValue = div.ariaValueNow;
// 									if (reactHandlerKey)
// 										for (let i = 0; i < startValue; i++) {
// 											div[reactHandlerKey[0]].onKeyDown({ key: "ArrowLeft", preventDefault: () => { }, stopPropagation: () => { } });
// 										}

// 									console.log("Set Slider to silence");
// 									break;
// 								}
// 							}
// 						}, 1000);
// 					}
// 				}
// 			}, 1000);
// 		}
// 	}
// }