package main

import (
	"encoding/gob"
	"fmt"
	"log"
	"net/http"

	"passman/database"
	"passman/routes"
	"passman/templates"
)

func main() {
	gob.Register(&database.User{})
	database.Init()
	templates.LoadTemplates("templates/*.html")
	r := routes.NewRouter()
	fmt.Println("Running...")
	log.Fatal(http.ListenAndServe(":8000", r))
}
