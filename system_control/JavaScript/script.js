const form = document.getElementById("form");
const name = document.getElementById("name");
const email = document.getElementById("email");
const msg = document.getElementById("msg");
const btn = document.getElementById("btn");
const status = document.getElementById("status");

function validate() {
    if (name.value.trim() && email.value.trim() && msg.value.trim()) {
        btn.disabled = false;
        btn.classList.add("active");
    } else {
        btn.disabled = true;
        btn.classList.remove("active");
    }
}

name.addEventListener("input", validate);
email.addEventListener("input", validate);
msg.addEventListener("input", validate);

form.addEventListener("submit", (e) => {
    e.preventDefault();

    status.textContent = "Request sent successfully ✔";
    status.style.color = "#4caf7a";

    form.reset();
    validate();

    setTimeout(() => {
        status.textContent = "";
    }, 3000);
});