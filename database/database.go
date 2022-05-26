package database

import (
	"database/sql"

	_ "github.com/mattn/go-sqlite3"
)

var db *sql.DB

//Init loads a database
func Init() {
	db, _ = loadDatabase("database/database.db")
}

//loadDatabase returns a sqlite database struct given a path
func loadDatabase(path string) (*sql.DB, error) {
	db, err := sql.Open("sqlite3", path)
	return db, err
}
