const clumpCreatorEl = document.getElementById("clumpCreator")

//open the clump creator menu
function openCreator() {
    extendShade();
    popupState = 1;
    openedClumpId = -1;
    clumpCreatorEl.style.display = "initial";
    clump = getVaultClumpByID(openedClumpId);
    clumpCreatorEl.querySelector(".creatorHeader .name").focus();
    clumpCreatorEl.querySelector(".creatorHeader .name").value = "";
    clumpCreatorEl.querySelector(".website-line .url").value = "";
    clumpCreatorEl.querySelector(".login-line .login").value = "";
    clumpCreatorEl.querySelector(".email-line .email").value = "";
    passwordElement = clumpCreatorEl.querySelector(".password-line .password");
    passwordElement.value = "";
    passwordElement.type = "password";
}

//close clump creator menu
document.getElementById("closeCreator").addEventListener('click', closeClumpCreator);
function closeClumpCreator() {
    retractShade();
    clumpCreatorEl.style.display = "none";
    hideCreatorPass;
}

//save values in creator menu as a new clump
document.getElementById("saveCreator").addEventListener('click', saveCreator);
async function saveCreator() {
    //if not privilaged, user can't post more than 5 clumps
    if (localStorage.getItem('privilaged') !== 'true' && vault.length >= 5) {
        alert("You are not privilaged");
        return;
    }
    //get clump attribute values
    var id; //choose a unique id value
    exit:
    for (id = 0; id <= vault.length; id++) {
        for (var i = 0; i < vault.length; i++) {
            if (vault[i].id === id) break;
            if (i === vault.length - 1) break exit;
        }
    }
    var name = document.querySelector("#clumpCreator .creatorHeader .name").value;
    var url = document.querySelector("#clumpCreator .website-line .url").value;
    var login = document.querySelector("#clumpCreator .login-line .login").value;
    var email = document.querySelector("#clumpCreator .email-line .email").value;
    var password = document.querySelector("#clumpCreator .password-line .password").value;
    //check if entry exists
    for(var i in vault) {
        let cName = vault[i].name;
        let cUrl = vault[i].url;
        if(cName === name || cUrl === url) {
            console.log("%clump already exists", "background:red");
            return;
        }
    }
    //add entry to vault
    clump = {
        "id" : id,
        "name" : name,
        "url" : url,
        "login" : login,
        "email" : email,
        "password" : password
    }
    vault.push(clump);
    displayClumps(true);
    closePopup();
    updateLocalStorage();
}

//toggle password view/hide
const creatorToggleViewPassEl = document.getElementById("creator-view-toggle-svg");

creatorToggleViewPassEl.addEventListener("click", creatorToggleViewPass);
function creatorToggleViewPass() {
    passwordField = document.getElementById("creator-password-input");
    if (creatorToggleViewPassEl.firstChild.href.baseVal === "#viewPassword-symbol") showCreatorPass();
    else hideCreatorPass();
}

function showCreatorPass() {
    passwordField = document.getElementById("creator-password-input");
    passwordField.type = "text";
    creatorToggleViewPassEl.firstChild.setAttribute("href", "#hidePassword-symbol");
}

function hideCreatorPass() {
    passwordField = document.getElementById("creator-password-input");
    passwordField.type = "password";
    creatorToggleViewPassEl.firstChild.setAttribute("href", "#viewPassword-symbol");
}
