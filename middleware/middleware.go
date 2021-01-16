package middleware

import (
	"net/http"

	"../database"
	"../sessions"
)

//AuthRequired ensures that the session is valid
func AuthRequired(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session, err := sessions.Store.Get(r, "session")
		if err != nil {
			http.Redirect(w, r, "login", 302)
			return
		}
		_, ok := session.Values["user"].(*database.User)
		if !ok {
			http.Redirect(w, r, "login", 302)
			return
		}
		handler.ServeHTTP(w, r)
	}
}
