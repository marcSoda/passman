package routes

import (
	"encoding/json"
	"fmt"
	"net/http"

	"passman/database"
	"passman/middleware"
	"passman/sessions"
	"passman/templates"
	"github.com/gorilla/mux"
)

//ClumpPacket is a struct contining data received from the client in func clumpsPostHandler()
type ClumpPacket struct {
	Clumps []*database.Clump `json:"clumps"`
	Time   string            `json:"time"`
}

//AuthPacket is a struct continaing login data
type AuthPacket struct {
	Login    string `json:"login"`
	Password string `json:"password"`
}

//NewRouter defines routes and returns a mux router
func NewRouter() *mux.Router {
	r := mux.NewRouter()
	r.HandleFunc("/", middleware.AuthRequired(indexGetHandler)).Methods("GET")
	r.HandleFunc("/", middleware.AuthRequired(indexPostHandler)).Methods("POST")
	r.HandleFunc("/login", loginGetHandler).Methods("GET")
	r.HandleFunc("/login", loginPostHandler).Methods("POST")
	r.HandleFunc("/logout", logoutHandler).Methods("GET")
	r.HandleFunc("/register", registerGetHandler).Methods("GET")
	r.HandleFunc("/register", registerPostHandler).Methods("POST")
	r.HandleFunc("/clumps", middleware.AuthRequired(clumpsGetHandler)).Methods("GET")
	r.HandleFunc("/clumps", middleware.AuthRequired(clumpsPostHandler)).Methods("POST")
	r.HandleFunc("/lastUpdate", middleware.AuthRequired(lastUpdateHandler)).Methods("GET")
	r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir("./static/"))))
	return r
}

func lastUpdateHandler(w http.ResponseWriter, r *http.Request) {
	session, err := sessions.Store.Get(r, "session")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	user := session.Values["user"].(*database.User)
	lastUpdate, err := database.GetLastUpdateTime(user)
	if err != nil {
		fmt.Println(err)
		//handle
	}
	json.NewEncoder(w).Encode(lastUpdate)
}

func clumpsGetHandler(w http.ResponseWriter, r *http.Request) {
	session, err := sessions.Store.Get(r, "session")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	user := session.Values["user"].(*database.User)
	clumps, err := database.RetrieveUserClumps(user)
	if err != nil {
		//handle error
		fmt.Println(err)
	}
	time, err := database.GetLastUpdateTime(user)
	if err != nil {
		//handle error
		fmt.Println(err)
	}
	packet := ClumpPacket{
		Clumps: clumps,
		Time:   time,
	}
	json.NewEncoder(w).Encode(packet)
}

func clumpsPostHandler(w http.ResponseWriter, r *http.Request) {
	session, err := sessions.Store.Get(r, "session")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	user := session.Values["user"].(*database.User)

	var packet ClumpPacket
	decoder := json.NewDecoder(r.Body)
	decoder.Decode(&packet)
	err = database.ClearUserClumps(user)
	if err != nil {
		//handle error
		fmt.Println(err)
	}
	for i, clump := range packet.Clumps {
		clump.ClumpUser = user
		clump.ClumpID = i
		err := database.AddClump(*clump)
		if err != nil {
			//handle error
			fmt.Println(err)
		}
	}
	err = database.UpdateLastUpdateTime(user, packet.Time)
	if err != nil {
		//handle error
		fmt.Println(err)
	}
	// database.ClearUserClumps(user)
	// os.Exit(0)
}

func indexGetHandler(w http.ResponseWriter, r *http.Request) { //TODO: make golbal session variable and add manipulation functions to sessions directory
	templates.Execute(w, "index.html", nil)
}

func indexPostHandler(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/", 302)
}

func loginGetHandler(w http.ResponseWriter, r *http.Request) {
	//todo: don't allow login if already logged in
	templates.Execute(w, "auth.html", nil)
}

func loginPostHandler(w http.ResponseWriter, r *http.Request) {
	//decode javascript fetch
	var packet AuthPacket
	decoder := json.NewDecoder(r.Body)
	decoder.Decode(&packet)

	//login user and handle errors
	user, err := database.Login(packet.Login, packet.Password)
	if err != nil {
		switch err {
		case database.ErrLoginNotFound:
			http.Error(w, err.Error(), http.StatusUnauthorized)
		case database.ErrInvalidLogin:
			http.Error(w, err.Error(), http.StatusUnauthorized)
		default:
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}
	//get session
	session, err := sessions.Store.Get(r, "session")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	//add user to session
	session.Values["user"] = &user
	session.Options.Secure = true
	session.Options.HttpOnly = true
	session.Options.SameSite = 3 //strict
	saveErr := session.Save(r, w)
	if saveErr != nil {
		http.Error(w, saveErr.Error(), http.StatusInternalServerError)
		return
	}
}

func logoutHandler(w http.ResponseWriter, r *http.Request) {
	//get session
	session, err := sessions.Store.Get(r, "session")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	//clear user from session and invalidate cookie
	session.Values["user"] = &database.User{}
	session.Options.MaxAge = -1
	err = session.Save(r, w)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	templates.Execute(w, "auth.html", nil)
}

func registerGetHandler(w http.ResponseWriter, r *http.Request) {
	templates.Execute(w, "auth.html", nil)
}

func registerPostHandler(w http.ResponseWriter, r *http.Request) {
	var packet AuthPacket
	decoder := json.NewDecoder(r.Body)
	decoder.Decode(&packet)

	//register user and handle errors
	err := database.RegisterUser(packet.Login, packet.Password)
	if err == database.ErrUserExists {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
