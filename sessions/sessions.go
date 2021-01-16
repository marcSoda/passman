package sessions

import "github.com/gorilla/sessions"

//Store holds all session data
var Store = sessions.NewCookieStore([]byte("secret_password")) //CHANGE THE PASSWORD. NOT SURE HOW YET. BCRYPT?
