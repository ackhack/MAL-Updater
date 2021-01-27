var auth_code = "No Auth Code found";

document.addEventListener('DOMContentLoaded', () => {
    let para = window.location.search.slice(1);

    if (para.startsWith("code=")) {
        auth_code = para.slice(5);
    }

    document.getElementById("btnGrant").addEventListener("click", accepted);
}, false);

function accepted() {
    document.getElementById("show").innerText = "Please copy following Code into the popup: " + auth_code;
}