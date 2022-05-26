var masterPassword; //masterpassword received by masterpassword menu. only stored in memory
const masterPassMenuEl = document.getElementById("masterPassMenu"); //master password menu dom element

//waits for password to be entered and calls authenticate
function queryPassword() {
    let inputEl = document.getElementById("master-password-input");
    inputEl.focus();
    document.getElementById("submitMasterPass").addEventListener("click", () => {
        masterPassword = inputEl.value;
        authenticate(localStorage.getItem('login'), masterPassword);
    })
}

//authenticate with server with masterpassword and login stored in localStorage
function authenticate(login, password) {
    console.log("authenticating...");
    let url = '/login';
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            login: login,
            password: password
        })
    })
    .then(response => {
	if (response.ok) {
	    console.log("succussful auth");
	    startup();
	} else {
	    console.log("unsuccusful auth");
	    title = document.querySelector("#masterPassMenu h1");
	    title.innerHTML = "Master Password Required: Authentication Failed";
	    title.style.color = "red";
	}
    }).catch(err =>{
        console.log("Authentication error: " + err);
    })
}

//encrypt each clump in vault
function encryptVault(decryptedVault) {
    var encryptedVault = [];
    for (const i in decryptedVault) {
        encryptedVault[i] = {};
        for (const j in decryptedVault[i]) {
            if (j !== 'id') {
                encryptedVault[i][j] = encrypt(decryptedVault[i][j], masterPassword);
            } else if (j === 'id') {
                encryptedVault[i][j] = decryptedVault[i][j];
            }
        }
    }
    return encryptedVault;
}

//decrypt each clump in vault
function decryptVault(encryptedVault) {
    var decryptedVault = [];
    for (const i in encryptedVault) {
        decryptedVault[i] = {};
        for (const j in encryptedVault[i]) {
            if (j !== 'user' && j !== 'id') {
                decryptedVault[i][j] = decrypt(encryptedVault[i][j], masterPassword);
            } else if (j === 'id')
                decryptedVault[i][j] = encryptedVault[i][j];
        }
    }
    return decryptedVault;
}

//PBKDF2
async function genEncryptionKey(password) {
    var algo = {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password)),
        iterations: 10000
    }
    var args = { name: 'AES-GCM', length: 256 };
    var encoded = new TextEncoder().encode(password);
    var key = await crypto.subtle.importKey('raw', encoded, { name: 'PBKDF2' }, false, ['deriveKey']);
    var derived = await crypto.subtle.deriveKey(algo, key, args, true, ['encrypt', 'decrypt']);
    var keyExport = await crypto.subtle.exportKey("jwk", derived);
    return keyExport.k;
}

//encrypt something via password
function encrypt(secretString, password) {
    return CryptoJS.AES.encrypt(secretString, password).toString();
}

//decrypt something via password
function decrypt(encryptionKey, password) {
    return CryptoJS.AES.decrypt(encryptionKey, password).toString(CryptoJS.enc.Utf8);
}

//handle password view/hide in master pass menu
const masterToggleViewPassEl = document.getElementById("master-view-toggle-svg"); //toggle svg (button)

masterToggleViewPassEl.addEventListener("click", masterToggleViewPass);
function masterToggleViewPass() {
    passwordField = document.getElementById("master-password-input");
    if (masterToggleViewPassEl.firstChild.href.baseVal === "#viewPassword-symbol") showMasterPass();
    else hideMasterPass();
}

function showMasterPass() {
    passwordField = document.getElementById("master-password-input");
    passwordField.type = "text";
    masterToggleViewPassEl.firstChild.setAttribute("href", "#hidePassword-symbol");
}

function hideMasterPass() {
    passwordField = document.getElementById("master-password-input");
    passwordField.type = "password";
    masterToggleViewPassEl.firstChild.setAttribute("href", "#viewPassword-symbol");
}
