package main

import (
	"encoding/gob"
	"fmt"
	"log"
	"net/http"

	"./database"
	"./routes"
	"./templates"
)

func main() {
	gob.Register(&database.User{})
	database.Init()
	templates.LoadTemplates("templates/*.html")
	r := routes.NewRouter()
	fmt.Println("Running...")
	log.Fatal(http.ListenAndServeTLS(":8000", "cert/cert.pem", "cert/key.pem", r))
}
