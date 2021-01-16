const PATH = 'https://passman.soda.fm'

function init() {
    document.getElementById('loginButton').addEventListener('click', () => {
        var login = document.getElementById('login').value
        var password = document.getElementById('password').value
	localStorage.setItem('login', login)
        authenticate(login, password)
    })
}

function authenticate(login, password) {
    console.log("authenticating...")
    let url = PATH + '/login'
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
            window.location.replace(PATH + '/')
            console.log("succussful auth")
        } else {
            console.log("unsuccussful auth")
            return
        }
    }).catch(err =>{
        console.log("Authentication error: " + err)
    })
}

document.addEventListener('DOMContentLoaded', init)
