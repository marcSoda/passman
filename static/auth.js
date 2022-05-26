var menuState = 0; //0 for login 1 for register
document.getElementById('login-button').addEventListener('click', authenticate); //authenticate when login button pressed
document.getElementById('register-button').addEventListener('click', register); //register when register button pressed

//authenticates with server
async function authenticate() {
    console.log("authenticating...");
    var login = document.getElementById('login').value;
    var password = document.getElementById('password').value;
    let url = '/login'
    await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            login: login,
            password: password
        })
    }).then(response => {
        if (response.ok) {
            localStorage.setItem('login', login);
            window.location.replace('/');
        } else {
            console.log("unsuccussful auth");
            return;
        }
    }).catch(err =>{
        console.log("Authentication error: " + err);
    })
}

//register new user
function register() {
    console.log("registering...");
    var login = document.getElementById('reg-login').value;
    var password = document.getElementById('reg-password').value;
    var password2 = document.getElementById('reg-password-again').value;
    var checkbox = document.getElementById('checkbox');
    if (password !== password2) {
        alert("Passwords do not match");
        return;
    }
    if (!checkbox.checked) {
        alert("You must accept the terms and conditions.");
        return;
    }
    let url = '/register'
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
            location.reload();
            console.log("succussful registration");
        } else {
            console.log("unsuccussful registration");
            return;
        }
    }).catch(err =>{
        console.log("Registration error: " + err);
    })
}

//event listeners
var loginMenu = document.getElementById("login-form");
var regMenu = document.getElementById("register-form");

document.getElementById("register-toggle").addEventListener("click", () => {
    loginMenu.style.transform = "translate(-26em, 0)"
    regMenu.style.transform = "translate(-26em, 0)"
    btn.style.left = "50%";
    container.classList.toggle('active')
    menuState = 1
});

document.getElementById("login-toggle").addEventListener("click", () => {
    loginMenu.style.transform = "translate(0, 0)"
    regMenu.style.transform = "translate(0, 0)"
    btn.style.left = "0";
    container.classList.toggle('active')
    menuState = 0
});

document.addEventListener("keydown", event => {
    if (event.code === "Enter") {
        if (menuState === 0) authenticate();
        else register();
    }
});
