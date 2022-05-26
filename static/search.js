var searching

//search
document.querySelector("#search-bar .search-input").addEventListener("input", function() {
    searching = true;
    searchText = document.querySelector("#search-bar input").value;
    vault.forEach(clump => {
        if (!clump.name.toLowerCase().includes(searchText.toLowerCase())) {
            getClumpContainerByID(clump.id).style.display = "none";
        } else {
            getClumpContainerByID(clump.id).style.display = "flex";
        }
    })
})

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
    searchBar = document.getElementById("search-bar");
    searchInput = searchBar.querySelector("input");
    searchBar.style.transform = "translate(-50%, -200%)";
    searchInput.blur();
    if (resetResults && searching) {
        searchInput.value = "";
        displayClumps(true);
        searching = false;
    }
}
