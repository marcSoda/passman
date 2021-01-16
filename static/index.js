var vault
var syncInterval
var connected
var hardwareKey //key based on hardware info used to encrypt/decrypt local storage
var masterPassword
var openedClumpIndex = -1 //clump opened in the clump editor. -1 when no clump opened -2 when new clump menu is opened
var masterPassMenuOpened = true

function queryPassword() {
    var input = document.getElementById("masterPassInput")
    input.focus()
    //toggling the svg and password hide/show
    var masterPassSVG = document.getElementById("masterPassSVG")
    masterPassSVG.addEventListener("click", () => {
	svgValue = masterPassSVG.firstChild
	if (svgValue.href.baseVal === "#viewPassword-svg") {
	    svgValue.setAttribute("href", "#hidePassword-svg")
	    input.type = "text"
	} else {
	    svgValue.setAttribute("href", "#viewPassword-svg")
	    input.type = "password"
	}
    })
    //submit password event listener
    document.getElementById("submitMasterPass").addEventListener("click", () => {
	masterPassword = input.value
	authenticate(localStorage.getItem('login'), masterPassword)
    })
}

//ensure correct password entered.
function authenticate(login, password) {
    console.log("authenticating...")
    let url = '/login'
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
	    console.log("succussful auth")
	    document.getElementById("popup").style.visibility = "hidden" //hide popup
	    document.getElementById("masterPassMenu").style.display = "none" //don't display password menu on next popup
	    document.getElementById("clumpEditor").style.display = "flex" //display clump editor on next popup
	    masterPassMenuOpened = false
	    startup()
	} else {
	    console.log("unsuccusful auth")
	    title = document.querySelector("#masterPassMenu h1")
	    title.innerHTML = "Master Password Required: Authentication Failed"
	    title.style.color = "red"
	}
    }).catch(err =>{
        console.log("Authentication error: " + err)
    })
}

async function startup() {
    syncInterval = setInterval(sync, 300000); //sync every 5 minutes
    vault = []
    hardwareKey = await genEncryptionKey(navigator.userAgent)
    sync()
}

async function sync() {
    console.log("%csyncing...", "color:white; background:green")
    await ping()
    if (!connected) {
        console.log("%cunable to sync: offline. will sync once a connection is established", "background:red")
        displayClumps()
        return
    }
    var localLastUpdateTime = localStorage.getItem('localLastUpdateTime')
    var serverLastUpdateTime = await checkServerLastUpdate()
    if (localLastUpdateTime > serverLastUpdateTime) {
        console.log("%csync required. updating server", "color:white; background:green")
        postClumps()
    } else if ((localLastUpdateTime < serverLastUpdateTime)
    || (localStorage.getItem('clumps') === null)
    || (decrypt(localStorage.getItem('clumps'), hardwareKey) === '[]')) {
        console.log("%csync required. updating client", "color:white; background:green")
        await fetchClumps()
    } else {
        console.log("%csync not required", "color:white; background:green")
    }
    loadClumps()
    displayClumps()
    console.log("%csuccussful sync", "color:white; background:green")
}

function updateLocalStorage() {
    localStorage.setItem('clumps', encrypt(JSON.stringify(vault), hardwareKey).toString())
    localStorage.setItem('localLastUpdateTime', new Date().getTime())
    sync()
}

//check network connection and set global var
async function ping() {
    console.log("%cpinging...", "color:white; background:purple")
    clearInterval(syncInterval)
    let url = '/static/ping.jpg?_='+(new Date().getTime());//date stuff added to force redownload (bypass cache)
    await fetch(url)
        .then(resesponse => {
            if (resesponse.ok) {
                connected = true
                syncInterval = setInterval(sync, 300000)
                console.log("%cserver up and running", "color:white; background:purple")
            } else {
                connected = false
                syncInterval = setInterval(sync, 5000)
                console.log("%cserver is down", "background:red")
            }
        }).catch(err=>{
            connected = false
            syncInterval = setInterval(sync, 5000)
            console.log("%cserver is down: " + err, "background:red")
        })
}

//returns a promise containing the last time the server was updated
async function checkServerLastUpdate() {
    console.log("%cchecking the time of server last update", "color:white; background:orange")
    let url = '/lastUpdate'
    var serverLastUpdateTime
    await fetch(url)
        .then(response => {
            if (response.ok) {
                console.log("%csuccessful server time check", "color:white; background:orange")
                serverLastUpdateTime = response.json()
            } else {
                console.log("%cunsuccussful server time check", "background:red")
                ping()
                return null
            }
        }).catch(err=>{
            console.log("%cError checking server last update" + err, "background:red")
            ping()
            return null
        })
    return serverLastUpdateTime
}

//fetch clumps from server then call loadClumps()
async function fetchClumps() {
    console.log("%cfetching clumps...", "background:pink")
    let url = '/clumps'
    await fetch(url)
        .then(response => {
            if (response.ok) {
                console.log("%csuccessful clump fetch", "background:pink")
                return response.json()
            } else {
                console.log("%cunsuccussful clump fetch", "background:red")
            }
        }).then(data => {
            if (data.clumps == null) {
                localStorage.setItem('clumps', encrypt("[]", hardwareKey).toString())
            } else {
                let decryptedData = decryptVault(data.clumps)
                localStorage.setItem('clumps', encrypt(JSON.stringify(decryptedData), hardwareKey).toString())
            }
            localStorage.setItem('localLastUpdateTime', data.time)
        }).catch(err=>{
            console.log("%cError fetching clumps: " + err, "background:red")
            ping()
        })
    loadClumps()
}

//take json string in local storage and write it to the vault
function loadClumps() {
    var strVault = decrypt(localStorage.getItem('clumps'), hardwareKey)
    vault = JSON.parse(strVault)
    vault.sort(vaultComparator)
    console.log("clumps loaded")
}

//comparator for alphabetizing the vault based on the clump name
function vaultComparator(a, b) {
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
}

//display clumps in local storage
function displayClumps() {
    if (document.querySelectorAll("#clumps .clumpContainer .id").length == 0) { //if the clumps have not yet been displayed
	vault.forEach(async function(clump) { //update all clumps display if needed
	    await displayClump(clump)
	})
    }
    console.log("clumps displayed")
}

async function updateClumpDisplay(clump) { //update a single clump container.
    var clumpContainer = getClumpContainerByID(clump.id)
    clumpContainer.querySelector(".id").value = clump.id //keep an eye on this for a bit
    clumpContainer.querySelector(".name").value = clump.name
    clumpContainer.querySelector(".url").value = clump.url
    clumpContainer.querySelector(".login").value = clump.login
    clumpContainer.querySelector(".email").value = clump.email
    clumpContainer.querySelector(".password").value = clump.password
    clumpContainer.querySelector(".previewContainer .imgLogo").src = await getLogo(clump.url)
    clumpContainer.querySelector(".previewContainer h").innerHTML = clump.name
}

async function displayClump(clump) { //create clumpContainer
    var clumpsDiv = document.getElementById('clumps')
    var img = document.createElement("IMG")
    img.className = "imgLogo"
    img.src = await getLogo(clump.url)
    var clumpContainer = document.createElement('A')
        clumpContainer.className = "clumpContainer"
        clumpContainer.href = "#"
        clumpContainer.id = clump.name
        clumpContainer.addEventListener('click', function() { openClumpEditor(clump, img) }) //On click, open the clumpEditor menu and populate it with the clump info
    var previewContainer = document.createElement("DIV");
         previewContainer.appendChild(img)
        previewContainer.className = "previewContainer"
    //add each clump element to the clump entry
    for(var value in clump) {
        let clumpElement = document.createElement("A")
            clumpElement.id = value
            clumpElement.className = "clumpElement " + value
       	    clumpElement.setAttribute("value", clump[value])
        if (value === 'name') {
	    let nameH = document.createElement("H")
	    nameH.innerHTML = clump[value]
	    previewContainer.appendChild(nameH)
        }
        clumpContainer.appendChild(clumpElement)
    }
    clumpContainer.appendChild(previewContainer)
    clumpsDiv.appendChild(clumpContainer)
}

async function getLogo(companyURL) {
    console.log("%cfetching logo for " + companyURL + "...", "background:magenta")
    var url = "https://logo.clearbit.com/" + companyURL
    var img
    await fetch(url)
        .then(response => {
            if (response.ok) {
                console.log("%csuccussful logo fetch", "background:magenta")
                return response.blob()
            } else {
                console.log("%cunsuccussful logo fetch.", "background:red")
                img = "/static/imgNotFound.png"
            }
        }).then(blob => {
            img = URL.createObjectURL(blob)
        }).catch(async err=>{
            console.log("%cError fetching logo: " + err, "background:red")
            img = "/static/imgNotFound.png"
        })
    return img
}

//sends clumps in local storage to the server
function postClumps() {
    console.log("%cposting...", "color:white; background:blue")
    let clumpString = decrypt(localStorage.getItem('clumps'), hardwareKey)
    let encryptedVault = encryptVault(JSON.parse(clumpString))
    let url = '/clumps'
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            clumps: encryptedVault,
            time: localStorage.getItem('localLastUpdateTime')
        })
    })
    .then(response => {
        if (response.ok) {
            console.log("%csuccussful post", "color:white; background:blue")
        } else {
            console.log("%cunsuccussful post", "background:red")
        }
    }).catch(err =>{
        console.log("%cerror posting clumps: " + err, "background:red")
        ping()
    })
}

//encrypt each vault attribute
function encryptVault(decryptedVault) {
    var encryptedVault = []
    for (const i in decryptedVault) {
        encryptedVault[i] = {}
        for (const j in decryptedVault[i]) {
	    if (j !== 'id') {
		encryptedVault[i][j] = encrypt(decryptedVault[i][j], masterPassword)
	    } else if (j=== 'id') {
		encryptedVault[i][j] = decryptedVault[i][j]
	    }
        }
    }
    return encryptedVault
}

//decrypt each vault attribute
function decryptVault(encryptedVault) {
    var decryptedVault = []
    for (const i in encryptedVault) {
        decryptedVault[i] = {}
        for (const j in encryptedVault[i]) {
            if (j !== 'user' && j !== 'id') {
		decryptedVault[i][j] = decrypt(encryptedVault[i][j], masterPassword)
            } else if (j === 'id')
		decryptedVault[i][j] = encryptedVault[i][j]
        }
    }
    return decryptedVault
}

//PBKDF2
async function genEncryptionKey(password) {
    var algo = {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password)),
        iterations: 10000
    }
    var args = { name: 'AES-GCM', length: 256 }
    var encoded = new TextEncoder().encode(password)
    var key = await crypto.subtle.importKey('raw', encoded, { name: 'PBKDF2' }, false, ['deriveKey'])
    var derived = await crypto.subtle.deriveKey(algo, key, args, true, ['encrypt', 'decrypt'])
    var keyExport = await crypto.subtle.exportKey("jwk", derived)
    return keyExport.k
}

function encrypt(secretString, password) {
    return CryptoJS.AES.encrypt(secretString, password).toString()
}

function decrypt(encryptionKey, password) {
    return CryptoJS.AES.decrypt(encryptionKey, password).toString(CryptoJS.enc.Utf8)
}

function getClumpContainerByID(clumpID) {
    var ret
    document.querySelectorAll("#clumps .clumpContainer .id").forEach(idElement => { //find the clump container
	if (idElement.getAttribute("value") == clumpID) ret = idElement.parentElement
    })
    return ret
}

function getVaultClumpByID(clumpID) {
    var ret
    vault.forEach(clump => {
	if (parseInt(clump.id) == openedClumpIndex) ret = clump
    })
    return ret
}

function openClumpEditor(clump, img) {
    openedClumpIndex = clump.id
    popup = document.getElementById('popup')
    popup.style.visibility = "visible"
    clumpEditor = document.getElementById('clumpEditor')
    clump = getVaultClumpByID(openedClumpIndex)
    clumpEditor.querySelector(".editorHeader .name").value = clump.name
    clumpEditor.querySelector(".website-line .url").value = clump.url
    clumpEditor.querySelector(".login-line .login").value = clump.login
    clumpEditor.querySelector(".email-line .email").value = clump.email
    clumpEditor.querySelector(".editorHeader .imgLogo").src = img.src
    var passwordField = clumpEditor.querySelector(".password-line .password")
    passwordField.value = "••••••••••••••"
    passwordField.readOnly = true
}

function openClumpEditorForNew() {
    openedClumpIndex = -2
    popup = document.getElementById('popup')
    popup.style.visibility = "visible"
    clumpEditor = document.getElementById('clumpEditor')
    clump = getVaultClumpByID(openedClumpIndex)
    clumpEditor.querySelector(".editorHeader .name").focus()
    clumpEditor.querySelector(".editorHeader .name").value = ""
    clumpEditor.querySelector(".website-line .url").value = ""
    clumpEditor.querySelector(".login-line .login").value = ""
    clumpEditor.querySelector(".email-line .email").value = ""
    clumpEditor.querySelector(".editorHeader .imgLogo").src = ""
    passwordElement = clumpEditor.querySelector(".password-line .password")
    passwordElement.value = ""
    passwordElement.type = "password"
    passwordElement.readOnly = false
    clumpEditor.querySelector("#deleteClump").style.display = "none"
}

//clumpEditor button animation
document.querySelectorAll("#clumpEditor input").forEach(input => { //for each input
    input.addEventListener('input', editorButtonController)
})

function editorButtonController() {
    if (openedClumpIndex !== -2) { //if an old clump is being edited
	clump = getVaultClumpByID(openedClumpIndex)
	if (document.getElementById("show-hide-svg").firstChild.href.baseVal === "#hidePassword-svg") { //if the password is visible
	    if (document.querySelector("#clumpEditor .editorBody .password-line .password").value !== clump.password) { //if password has been changed
		extendEditorButtons()
		return
	    } else revertEditorButtons()
	}
	if (document.querySelector("#clumpEditor .editorHeader .name").value !== clump.name ||
	    document.querySelector("#clumpEditor .editorBody .website-line .url").value !== clump.url ||
	    document.querySelector("#clumpEditor .editorBody .login-line .login").value !== clump.login ||
	    document.querySelector("#clumpEditor .editorBody .email-line .email").value !== clump.email) extendEditorButtons()
	else revertEditorButtons()
    } else { //if a new clump is being defined
	if (document.querySelector("#clumpEditor .editorHeader .name").value !== "" &&
	    document.querySelector("#clumpEditor .editorBody .website-line .url").value !== "" &&
	    document.querySelector("#clumpEditor .editorBody .login-line .login").value !== "" &&
	    document.querySelector("#clumpEditor .editorBody .email-line .email").value !== "" &&
	    document.querySelector("#clumpEditor .editorBody .password-line .password").value !== "") extendEditorButtons()
	else revertEditorButtons()
    }
}

//keyboard listener
document.addEventListener("keydown", event => {
    if (event.code === "Escape") {
	retractSearchBar(true) //close the search bar and reset results
	if (openedClumpIndex >= 0 || openedClumpIndex == -2) closeClumpEditor()
    } else if (event.code === "Enter")  {
	retractSearchBar(false) //close the search bar but dont reset results
	if (openedClumpIndex >= 0 || openedClumpIndex == -2 && document.getElementById("saveClumpEdit").style.visibility === "visible") saveClick()
	if (masterPassMenuOpened) document.getElementById("submitMasterPass").click()
    }
})
document.getElementById("closeEdit").addEventListener('click', closeClumpEditor)
function closeClumpEditor() {
    document.getElementById("popup").style.visibility = "hidden" //hide the editor
    revertEditorButtons(false) //ensures that the buttons are reset if cancel is pressed
    clumpEditor.querySelector("#deleteClump").style.display = "initial" //ensure that the delete button is displayed
    hideEditorPassword(true);
    openedclumpindex = -1 //clump is no longer open
}
function extendEditorButtons() {
    document.getElementById("saveClumpEdit").style.visibility = "visible"
    document.getElementById("closeEdit").style.transform = "translate(0,0)"
    document.getElementById("closeEdit").textContent = "Cancel"
    document.getElementById("deleteClump").style.transform = "translate(0,0)"
}
function revertEditorButtons() { //hide save button and change
    document.getElementById("saveClumpEdit").style.visibility = "hidden"
    document.getElementById("closeEdit").style.transform = "translate(45%,0)"
    document.getElementById("closeEdit").textContent = "Close"
    document.getElementById("deleteClump").style.transform = "translate(-45%,0)"
}

document.getElementById("saveClumpEdit").addEventListener('click', saveClick)
function saveClick() { //update vault, upload to server
    if (openedClumpIndex != -2) { //if an existing clump is being saved
	clump = getVaultClumpByID(openedClumpIndex)
	clump.name = document.querySelector("#clumpEditor .editorHeader .name").value
	clump.url = document.querySelector("#clumpEditor .editorBody .website-line .url").value
	clump.login = document.querySelector("#clumpEditor .editorBody .login-line .login").value
	clump.email = document.querySelector("#clumpEditor .editorBody .email-line .email").value
	if (document.querySelector("#clumpEditor .editorBody .password-line .password").readOnly === false) //only change password if it has been changed
	    clump.password = document.querySelector("#clumpEditor .editorBody .password-line .password").value
	updateClumpDisplay(clump)
    } else { //if a new clump is being saved
	//get clump attribute values
	var id //choose a unique id value
	exit:
	for (id = 0; id <= vault.length; id++) {
	    for (var i = 0; i < vault.length; i++) {
		if (vault[i].id === id) break
		if (i === vault.length - 1) break exit
	    }
	}
	var name = document.querySelector("#clumpEditor .editorHeader .name").value
	var url = document.querySelector("#clumpEditor .website-line .url").value
	var login = document.querySelector("#clumpEditor .login-line .login").value
	var email = document.querySelector("#clumpEditor .email-line .email").value
	var password = document.querySelector("#clumpEditor .password-line .password").value
	//check if entry exists
	for(var i in vault) {
	    let cName = vault[i].name
	    let cUrl = vault[i].url
	    if(cName === name || cUrl === url) {
		console.log("%clump already exists", "background:red")
		return
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
	vault.push(clump)
	displayClump(clump)
    }
    closeClumpEditor()
    updateLocalStorage()
}

document.getElementById("deleteClump").addEventListener('click', deleteClick);
function deleteClick() {
    getClumpContainerByID(openedClumpIndex).remove();
    var index
    vault.forEach(clump => {
	if (clump.id === openedClumpIndex) index = vault.indexOf(clump)
    })
    vault.splice(index, 1);
    updateLocalStorage()
    closeClumpEditor();
}

//Toggle password view/hidden
document.getElementById("show-hide-svg").addEventListener("click", function() {
    viewHide = document.getElementById("show-hide-svg")
    passwordField = document.querySelector(".password-line input")
    if (openedClumpIndex != -2) { //if a NEW clump is being created
	if (viewHide.firstChild.href.baseVal === "#viewPassword-svg") { //if password not shown
            passwordField.type = "text"
            passwordField.readOnly = false
            passwordField.value = getVaultClumpByID(openedClumpIndex).password
	    viewHide.firstChild.setAttribute("href", "#hidePassword-svg")
	} else hideEditorPassword(false) //turned into a function because closeClumpEditor() also uses it
    } else {
	if (passwordField.type === "text") { //if password not shown
	    passwordField.type = "password"
    viewHide.firstChild.setAttribute("href", "#viewPassword-svg")
	} else {
	    passwordField.type = "text"
	    viewHide.firstChild.setAttribute("href", "#hidePassword-svg")
	}
    }
})
function hideEditorPassword(force) {
    passwordField = document.querySelector(".password-line input")
    var clump = getVaultClumpByID(openedClumpIndex)
    if ((clump === undefined) || (passwordField.value !== clump.password && !force)) return //do nothing if password has been edited
    viewHide = document.getElementById("show-hide-svg")
    passwordField.type = "text"
    passwordField.readOnly = true
    passwordField.value = "••••••••••••••"
    viewHide.firstChild.setAttribute("href", "#viewPassword-svg")
}

//search
document.querySelector("#search-bar .search-input").addEventListener("input", function() {
    searchText = document.querySelector("#search-bar input").value
    vault.forEach(clump => {
	if (!clump.name.toLowerCase().includes(searchText.toLowerCase())) {
	    getClumpContainerByID(clump.id).style.display = "none"
	} else {
	    getClumpContainerByID(clump.id).style.display = "flex"
	}
    })
})

//addClump
document.getElementById("add-clump-link").addEventListener("click", openClumpEditorForNew)

//sync before logout
document.getElementById("logout-link").addEventListener("click", logout)
async function logout() {
    await sync()
    window.location.href = '/logout'
}

//sync button
document.getElementById("sync-link").addEventListener("click", sync)

//search button
document.getElementById("search-clumps-link").addEventListener("click", extendSearchBar)
function extendSearchBar() {
    searchBar = document.getElementById("search-bar")
    searchInput = searchBar.querySelector("input")
    if (searchBar.style.transform === "translate(-50%)") retractSearchBar()
    else {
	searchBar.style.transform = "translate(-50%, 0)"
	searchInput.focus()
    }
}
function retractSearchBar(resetResults) {
    searchBar = document.getElementById("search-bar")
    searchInput = searchBar.querySelector("input")
    searchBar.style.transform = "translate(-50%, -200%)"
    searchInput.blur()
    if (resetResults) {
	searchInput.value = ""
	searchInput.dispatchEvent(new Event('input')) //trigger 'input' event. ie simulate keypress within the search bar to get the clumps shown to update
    }
}

//Theme toggling
document.getElementById('themeTog').addEventListener('click', () => {
    document.body.classList.toggle('light')
})

document.addEventListener('DOMContentLoaded', queryPassword)