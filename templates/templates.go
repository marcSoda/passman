package templates

import (
	"html/template"
	"net/http"
)

var templates *template.Template

//LoadTemplates loads html templates in a given directory
func LoadTemplates(path string) {
	templates = template.Must(template.ParseGlob(path))
}

//Execute passes data to and executes an html template
func Execute(w http.ResponseWriter, tmpl string, data interface{}) {
	templates.ExecuteTemplate(w, tmpl, data)
}
