function openPopup() {
    const popup = document.getElementById("popup");
    popup.classList.add("open-popup");
}

function closePopup() {
    const popup = document.getElementById("popup");
    popup.classList.remove("open-popup");
}

export { openPopup, closePopup };