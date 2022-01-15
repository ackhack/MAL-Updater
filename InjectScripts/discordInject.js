let p = document.createElement('p');
p.id = 'MAL-Updater';
p.innerText = chrome.runtime.id;
p.style.display = 'none';
(document.head || document.documentElement).appendChild(p);

let s = document.createElement('script');
s.src = chrome.runtime.getURL('InjectScripts/discordRichPresenceInject.js');
s.onload = function () {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);