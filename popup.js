var auth_code;

document.addEventListener('DOMContentLoaded', () => {
    let para = window.location.search.slice(1);

    if (para.startsWith("code=")) {
        auth_code = para.slice(5);
    }

    document.getElementById("btnGrant").addEventListener("click", accepted);
}, false);

function accepted() {
    chrome.storage.local.set({ "mal_updater_token": document.getElementById("inputCode").innerText}, function(){
    });
    alert("Reload Page");
}