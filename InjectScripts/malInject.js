init();

function init() {
    let btn = document.createElement("button");
    btn.innerText = "Remove Not Aired";
    btn.style.marginTop = "2%";
    btn.style.color = "inherit";
    btn.style.backgroundColor = "inherit";
    btn.onclick = removeNotAired;
    document.getElementsByClassName("header")[0].appendChild(btn);
}

function removeNotAired() {
    Array.from(document.getElementsByClassName("list-table")[0].children).forEach(tbody => {
        if (tbody.classList.contains("list-item") && tbody.children[0].children[3].children[2].innerText.includes("Not Yet Aired")) {
            tbody.remove()
        }
    })
}