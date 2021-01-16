package database

import (
	"fmt"
	"strconv"
)

//NOTE: CLUMPS ARE NOT ADDED TO THE DATABASE DIRECTLY FROM THE CLIENT. CLUMPS ARE ADDED TO A "DATABASE" IN THE CLIENT AND THEN THE ENTIRE
//CLIENT "DATABASE" IS DUMPED TO THE SERVER WHEN A SESSION ENDS. THEREFORE THERE IS NO REASON WHY THE SERVER DB PK CAN'T BE CONCATINATED
//WITH userID AND clientID WITH REPEATING clientIDs IN THE SERVER DB.

//Clump is a Database Clump Entry TODO: fix/remove/add json tags
type Clump struct {
	ClumpUser     *User  `json:"user"`
	ClumpID       int    `json:"id"`
	ClumpName     string `json:"name"`
	ClumpURL      string `json:"url"`
	ClumpLogin    string `json:"login"`
	ClumpEmail    string `json:"email"`
	ClumpPassword string `json:"password"`
}

//ErrClumpExists is thrown when a user attemps to add a clump that has an existing name or url
var ErrClumpExists = fmt.Errorf("Clump already exists")

//RetrieveUserClumps takes a user and returns a json file of the user's clumps
func RetrieveUserClumps(user *User) ([]*Clump, error) {
	// Get the user's hashed password. Will need to be scanned
	clumpRows, err := db.Query(`
		SELECT clumpID, clumpName, clumpURL, clumpLogin, clumpEmail, clumpPassword
		FROM clumps
		WHERE userID = ` + strconv.Itoa(user.UserID) + `
	`)
	defer clumpRows.Close()
	if err != nil {
		return nil, err
	}
	var clumps []*Clump
	for clumpRows.Next() {
		var clump Clump
		clumpRows.Scan(&clump.ClumpID, &clump.ClumpName, &clump.ClumpURL, &clump.ClumpLogin, &clump.ClumpEmail, &clump.ClumpPassword)
		clumps = append(clumps, &clump)
	}
	return clumps, err
}

//ClearUserClumps removes all clumps for a specified user
func ClearUserClumps(user *User) error {
	statement, err := db.Prepare(`
		delete from clumps
		where UserID = ` + strconv.Itoa(user.UserID) + `
	`)
	if err != nil {
		return err
	}
	_, err = statement.Exec()
	if err != nil {
		return err
	}
	return nil
}

//AddClump adds a clump to the database
//this function will be removed later and replaced with a function that reads a json file of clumps from the client into the db
func AddClump(clump Clump) error {
	clumpExists, err := clumpExistsInDB(clump)
	if err != nil {
		return err
	}
	if clumpExists {
		return ErrClumpExists
	}

	//Since everything checks out, add the clump to the database
	statement, err := db.Prepare(`
		INSERT INTO clumps (userID, clumpID, clumpName, clumpURL, clumpLogin, clumpEmail, clumpPassword)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return err
	}
	_, sErr := statement.Exec(clump.ClumpUser.UserID, clump.ClumpID, clump.ClumpName, clump.ClumpURL, clump.ClumpLogin, clump.ClumpEmail, clump.ClumpPassword)
	if sErr != nil {
		return sErr
	}
	return nil
}

//clumpExistsInDB is used internally to determine if a clump exists in the clumps table. Returns true or false and an err.
//this function will be removed later
func clumpExistsInDB(clump Clump) (bool, error) {
	//Result is 0 (is unique) or 1 (not unique). Note that result must later be scanned into a variable
	result, err := db.Query(`
		SELECT COUNT(1)
			FROM clumps
			WHERE (userID = ` + strconv.Itoa(clump.ClumpUser.UserID) + `) AND
				((clumpName = '` + clump.ClumpName + `') OR (clumpURL = '` + clump.ClumpURL + `'))
	`)
	defer result.Close()
	if err != nil {
		return false, err
	}
	//scan the result into the res variable to be returned
	var res int
	for result.Next() {
		result.Scan(&res)
	}

	if res == 1 {
		return true, nil
	}
	return false, nil
}
