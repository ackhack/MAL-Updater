var auth_code = "No Auth Code found";

document.addEventListener('DOMContentLoaded', () => {
    let para = window.location.search.slice(1);

    if (para.startsWith("code=")) {
        auth_code = para.slice(5);
        auth_code = auth_code.substring(0,auth_code.indexOf("&"));
    }

    document.getElementById("btnGrant").addEventListener("click", accepted);
}, false);

function accepted() {
    document.getElementById("code").innerText = auth_code;
}