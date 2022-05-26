package database

type Bug struct {
	BugUser     *User  `json:"user"`
	BugID       int    `json:"id"`
	Bug         string `json:"bug"`
}

//AddBug adds a clump to the database
func AddBug(bug Bug) error {
	statement, err := db.Prepare(`
		INSERT INTO bugs (bug, userID)
		VALUES (?, ?)
	`)
	if err != nil {
		return err
	}
	_, sErr := statement.Exec(bug.Bug, bug.BugUser.UserID)
	if sErr != nil {
		return sErr
	}
	return nil
}
