const clumpEditorEl = document.getElementById("clumpEditor");
const editorToggleViewPassEl = document.getElementById("editor-view-toggle-svg");

//open the editor
function openEditor(clump, img) {
    extendShade();
    popupState = 2;
    openedClumpId = clump.id;
    clumpEditorEl.style.display = "initial";
    clump = getVaultClumpByID(openedClumpId);
    clumpEditorEl.querySelector(".editorHeader .name").value = clump.name;
    clumpEditorEl.querySelector(".website-line .url").value = clump.url;
    clumpEditorEl.querySelector(".login-line .login").value = clump.login;
    clumpEditorEl.querySelector(".email-line .email").value = clump.email;
    clumpEditorEl.querySelector(".editorHeader .imgLogo").src = img.src;
    var passwordField = clumpEditorEl.querySelector(".password-line .password");
    passwordField.value = clump.password;
}

//close editor
document.getElementById("closeEditor").addEventListener('click', closeClumpEditor);
function closeClumpEditor() {
    retractShade();
    clumpEditorEl.style.display = "none"; //hide the editor
    hideEditorPass();

}

//save edits
document.getElementById("saveEditor").addEventListener('click', saveEditor);
function saveEditor() { //update vault, upload to server
    clump = getVaultClumpByID(openedClumpId);
    clump.name = document.querySelector("#clumpEditor .editorHeader .name").value;
    clump.url = document.querySelector("#clumpEditor .editorBody .website-line .url").value;
    clump.login = document.querySelector("#clumpEditor .editorBody .login-line .login").value;
    clump.email = document.querySelector("#clumpEditor .editorBody .email-line .email").value;
    clump.password = document.querySelector("#clumpEditor .editorBody .password-line .password").value;
    updateClumpDisplay(clump);
    closePopup();
    updateLocalStorage();
}

//delete existing clump
document.getElementById("deleteClump").addEventListener('click', deleteClick);
function deleteClick() {
    getClumpContainerByID(openedClumpId).remove();
    var index;
    vault.forEach(clump => {
        if (clump.id === openedClumpId) index = vault.indexOf(clump);
    })
    vault.splice(index, 1);
    updateLocalStorage();
    closePopup();
}

//copy to clipboard
document.getElementById('editor-copy-svg').addEventListener('click', () => {
    navigator.clipboard.writeText(getVaultClumpByID(openedClumpId).password)
	.then(() => {
	    console.log('Password copied to clipboard');
        closePopup;
	})
	.catch(err => {
	    alert('Password copy error: ', err);
	});
})

//toggle password view/hide
editorToggleViewPassEl.addEventListener("click", editorToggleViewPass);
function editorToggleViewPass() {
    passwordField = document.getElementById("editor-password-input");
    if (editorToggleViewPassEl.firstChild.href.baseVal === "#viewPassword-symbol") showEditorPass();
    else hideEditorPass();
}

function showEditorPass() {
    passwordField = document.getElementById("editor-password-input");
    passwordField.type = "text";
    editorToggleViewPassEl.firstChild.setAttribute("href", "#hidePassword-symbol");
}

function hideEditorPass() {
    passwordField = document.getElementById("editor-password-input");
    passwordField.type = "password";
    editorToggleViewPassEl.firstChild.setAttribute("href", "#viewPassword-symbol");
}
