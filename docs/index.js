var auth_code;

document.addEventListener('DOMContentLoaded', () => {
    let para = window.location.search.slice(1);

    if (para.startsWith("code=")) {
        auth_code = para.slice(5);
    }

    document.getElementById("btnGrant").addEventListener("click", accepted);
}, false);

function accepted() {
    saveToken(auth_code);
    window.close();
}

function saveToken(t) {
    chrome.storage.local.set({ "mal_updater_token": t}, function(){
    });
}