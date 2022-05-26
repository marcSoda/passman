//search button
document.getElementById("search-clumps-link").addEventListener("click", extendSearchBar)

//addClump
document.getElementById("add-clump-link").addEventListener("click", openCreator);

//sync before logout
document.getElementById("logout-link").addEventListener("click", logout);
async function logout() {
    await sync();
    localStorage.clear();
    window.location.href = '/logout';
}

//elevate user
document.getElementById("elevate-link").addEventListener("click", elevate);
function elevate() {
    let url = '/elevate';
    fetch(url)
    .then(res => {
        if (res.ok) {
            alert("Successfully Elevated");
        } else {
            alert("Problem During Elevation");
        }
    }).catch(err => {
        console.log("Error during elevation");
        ping();
    });
    checkPrivilage();
}

document.getElementById("bug-link").addEventListener("click", openBugReporter);

//Theme toggling
document.getElementById('themeTog').addEventListener('click', () => {
    if (localStorage.getItem('theme') === 'light') {
        localStorage.setItem('theme', 'dark');
        document.body.className = 'dark';
    } else {
        localStorage.setItem('theme', 'light');
        document.body.className = 'light';
    }
})

//sync button
document.getElementById("sync-link").addEventListener("click", sync);
