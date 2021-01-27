var auth_code = "No Auth Code found";

document.addEventListener('DOMContentLoaded', () => {
    let para = window.location.search.slice(1);

    if (para.includes("code=") && para.includes("state=")) {
        auth_code = para;
    }

    document.getElementById("btnGrant").addEventListener("click", accepted);
}, false);

function accepted() {
    let tb = document.getElementById("code");
    tb.innerText = auth_code;
    tb.focus();
    tb.select();
}