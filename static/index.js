var vault; //object of all password manager entries
var hardwareKey; //key based on hardware info used to encrypt/decrypt local storage
var openedClumpId = -1; //clump opened in the clump editor. -1 when no clump opened
var popupState = 4; //0 hidden; 1: new clump; 2 existing clump; 3: password generator; 4: master pass menu; 5: bug reporter
var syncInterval; //current sync interval
var connected; //connection status
var standardSyncInterval = 60000; //when connection is good
var franticSyncInterval = 5000; //when connection is bad

//called after user enters master password
async function startup() {
    closePopup(); //close all popups
    syncInterval = setInterval(sync, standardSyncInterval); //sync every one minute
    vault = []; //set vault to empty
    hardwareKey = await genEncryptionKey(navigator.userAgent); //generates a hash based on the userAgent. only used client side
    sync(); //sync with server
}

//ensure data is up to date both on the client and server
async function sync() {
    console.log("%csyncing...", "color:white; background:green");
    await ping();
    if (!connected) {
        console.log("%cunable to sync: offline. will sync once a connection is established", "background:red");
        displayClumps();
        return;
    }
    var localLastUpdateTime = localStorage.getItem('localLastUpdateTime');
    var serverLastUpdateTime = await checkServerLastUpdate();
    if (localLastUpdateTime > serverLastUpdateTime) {
        console.log("%csync required. updating server", "color:white; background:green");
        postClumps();
    } else if ((localLastUpdateTime < serverLastUpdateTime)
    || (localStorage.getItem('clumps') === null)
    || (decrypt(localStorage.getItem('clumps'), hardwareKey) === '[]')) {
        console.log("%csync required. updating client", "color:white; background:green");
        await fetchClumps();
    } else {
        console.log("%csync not required", "color:white; background:green");
    }
    loadClumps();
    displayClumps();
    console.log("%csuccussful sync", "color:white; background:green");
}

//update the clumps and the time in local storage
function updateLocalStorage() {
    localStorage.setItem('clumps', encrypt(JSON.stringify(vault), hardwareKey).toString());
    localStorage.setItem('localLastUpdateTime', new Date().getTime());
    sync();
}

//check network connection and set global var
async function ping() {
    console.log("%cpinging...", "color:white; background:purple");
    clearInterval(syncInterval);
    let url = '/static/ping.jpg?_='+(new Date().getTime()); //date stuff added to force redownload (bypass cache)
    await fetch(url)
        .then(resesponse => {
            if (resesponse.ok) {
                connected = true;
                syncInterval = setInterval(sync, standardSyncInterval);
                console.log("%cserver up and running", "color:white; background:purple")
            } else {
                connected = false;
                syncInterval = setInterval(sync, franticSyncInterval); //sync every 5 seconds until network back
                console.log("%cserver is down", "background:red");
            }
        }).catch(err=>{
            connected = false;
            syncInterval = setInterval(sync, franticSyncInterval);
            console.log("%cserver is down: " + err, "background:red");
        });
}

//returns a promise containing the last time the server was updated
async function checkServerLastUpdate() {
    console.log("%cchecking the time of server last update", "color:white; background:orange");
    let url = '/lastUpdate';
    var serverLastUpdateTime;
    await fetch(url)
        .then(response => {
            if (response.ok) {
                console.log("%csuccessful server time check", "color:white; background:orange");
                serverLastUpdateTime = response.json();
            } else {
                console.log("%cunsuccussful server time check", "background:red");
                ping();
                return null;
            }
        }).catch(err=>{
            console.log("%cError checking server last update" + err, "background:red");
            ping();
            return null;
        });
    return serverLastUpdateTime;
}

//fetch clumps from server then call loadClumps()
async function fetchClumps() {
    console.log("%cfetching clumps...", "background:pink");
    let url = '/clumps';
    await fetch(url)
        .then(response => {
            if (response.ok) {
                console.log("%csuccessful clump fetch", "background:pink");
                return response.json();
            } else {
                console.log("%cunsuccussful clump fetch", "background:red");
            }
        }).then(data => {
            if (data.clumps == null) {
                localStorage.setItem('clumps', encrypt("[]", hardwareKey).toString());
            } else {
                let decryptedData = decryptVault(data.clumps);
                localStorage.setItem('clumps', encrypt(JSON.stringify(decryptedData), hardwareKey).toString());
            }
            localStorage.setItem('localLastUpdateTime', data.time);
        }).catch(err=>{
            console.log("%cError fetching clumps: " + err, "background:red");
            ping();
        })
    loadClumps();
}

//set privilage value in localStorage
function checkPrivilage() {
    console.log("checking privilage");
    let url = '/privilage';
    fetch(url)
        .then(response => {
            if (response.ok) {
                console.log("successful privilage check");
                return response.json();
            } else {
                console.log("unsuccessful privilage check");
            }
        }).then(data => {
            localStorage.setItem('privilaged', data);
        }).catch(err=>{
            console.log("error checking privilage");
        })
}


//take json string in local storage and write it to the vault
function loadClumps() {
    var strVault = decrypt(localStorage.getItem('clumps'), hardwareKey);
    vault = JSON.parse(strVault);
    vault.sort(vaultComparator);
    console.log("clumps loaded");
}

//comparator for alphabetizing the vault based on the clump name
function vaultComparator(a, b) {
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
}

//display clumps in local storage
function displayClumps(force) {
    if (document.querySelectorAll("#clumps .clumpContainer .id").length == 0 || force) { //if the clumps have not yet been displayed
        document.getElementById("clumps").innerHTML = "";
        vault.sort(vaultComparator);
        vault.forEach(async function(clump) { //update all clumps display if needed
            await displayClump(clump);
        })
        console.log("clumps displayed");
    }
}

//update an existing clump container
async function updateClumpDisplay(clump) { //update a single clump container.
    var clumpContainer = getClumpContainerByID(clump.id);
    clumpContainer.querySelector(".id").value = clump.id; //keep an eye on this for a bit
    clumpContainer.querySelector(".name").value = clump.name;
    clumpContainer.querySelector(".url").value = clump.url;
    clumpContainer.querySelector(".login").value = clump.login;
    clumpContainer.querySelector(".email").value = clump.email;
    clumpContainer.querySelector(".password").value = clump.password;
    clumpContainer.querySelector(".previewContainer .imgLogo").src = await getLogo(clump.url);
    clumpContainer.querySelector(".previewContainer h").innerHTML = clump.name;
}

//create a new clump container
async function displayClump(clump) { //create clumpContainer
    var clumpsDiv = document.getElementById('clumps');
    var img = document.createElement("IMG");
    img.className = "imgLogo";
    img.src = await getLogo(clump.url);
    var clumpContainer = document.createElement('A');
    clumpContainer.className = "clumpContainer";
    clumpContainer.href = "#!";
    clumpContainer.id = clump.name;
    clumpContainer.addEventListener('click', function() { openEditor(clump, img) }); //On click, open the clumpEditor menu and populate it with the clump info
    var previewContainer = document.createElement("DIV");
    previewContainer.appendChild(img);
    previewContainer.className = "previewContainer";
    //add each clump element to the clump entry
    for(var value in clump) {
        let clumpElement = document.createElement("A");
        clumpElement.id = value;
        clumpElement.className = "clumpElement " + value;
       	clumpElement.setAttribute("value", clump[value]);
        if (value === 'name') {
	        let nameH = document.createElement("H");
	        nameH.innerHTML = clump[value];
	        previewContainer.appendChild(nameH);
        }
        clumpContainer.appendChild(clumpElement);
    }
    clumpContainer.appendChild(previewContainer);
    clumpsDiv.appendChild(clumpContainer);
}

//fetch the logo for a clump. if no logo exists, return the imgNotFound image
async function getLogo(companyURL) {
    console.log("%cfetching logo for " + companyURL + "...", "background:magenta");
    var url = "https://logo.clearbit.com/" + companyURL;
    var img;
    await fetch(url)
        .then(response => {
            if (response.ok) {
                console.log("%csuccussful logo fetch", "background:magenta");
                return response.blob();
            } else {
                console.log("%cunsuccussful logo fetch.", "background:red");
                img = "/static/imgNotFound.png";
            }
        }).then(blob => {
            img = URL.createObjectURL(blob);
        }).catch(async err=>{
            console.log("%cError fetching logo: " + err, "background:red");
            img = "/static/imgNotFound.png";
        });
    return img;
}

//sends clumps in local storage to the server
function postClumps() {
    console.log("%cposting...", "color:white; background:blue");
    let clumpString = decrypt(localStorage.getItem('clumps'), hardwareKey);
    let encryptedVault = encryptVault(JSON.parse(clumpString));
    let url = '/clumps';
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            clumps: encryptedVault,
            time: localStorage.getItem('localLastUpdateTime')
        })
    }).then(response => {
        if (response.ok) {
            console.log("%csuccussful post", "color:white; background:blue");
        } else {
            console.log("%cunsuccussful post", "background:red");
        }
    }).catch(err =>{
        console.log("%cerror posting clumps: " + err, "background:red");
        ping();
    })
}

//get a clump container using the clumpID
function getClumpContainerByID(clumpID) {
    var ret;
    document.querySelectorAll("#clumps .clumpContainer .id").forEach(idElement => { //find the clump container
        if (idElement.getAttribute("value") == clumpID) ret = idElement.parentElement;
    });
    return ret;
}

//get a clump from the vault by clumpID
function getVaultClumpByID(clumpID) {
    var ret;
    vault.forEach(clump => {
        if (parseInt(clump.id) == openedClumpId) ret = clump;
    });
    return ret;
}

//close all popup menues
function closePopup() {
    closeBugReporter();
    closeClumpCreator();
    closeGen();
    closeClumpEditor();
    masterPassMenuEl.style.display = "none";
    retractSearchBar(true) //close the search bar and reset results
    popupState = 0;
}

function extendShade() {
    document.getElementById("shade").style.display = "initial";
    document.body.style.overflow = "hidden";
}

function retractShade() {
    document.getElementById("shade").style.display = "none";
    document.body.style.overflow = "auto";
}

//keyboard listener
document.addEventListener("keydown", event => {
    if (event.code === "Escape") {
        closePopup();
    } else if (event.code === "Enter")  {
        retractSearchBar(false) //close the search bar but dont reset results
        if      (popupState === 1) saveCreator();
        else if (popupState === 2) saveEditor();
        else if (popupState === 3) useGenPass();
        else if (popupState === 4) document.getElementById("submitMasterPass").click()
        else if (popupState === 5) submitBug();
    }
});

//onload
window.onload = function() {
    //set theme
    if (localStorage.getItem('theme') === 'dark') {
        localStorage.setItem('theme', 'dark');
        document.body.className = 'dark';
    } else {
        localStorage.setItem('theme', 'light');
        document.body.className = 'light';
    }
    //set privilage
    checkPrivilage();
}

//clear sensitive local storage on unload
window.onunload = function() {
	localStorage.removeItem("clumps");
	localStorage.removeItem("localLastUpdateTime");
}


//wait for master password
document.addEventListener('DOMContentLoaded', queryPassword);
