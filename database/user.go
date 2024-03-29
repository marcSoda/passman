package database

import (
	"errors"
	"strconv"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	UserID             int    `json:"id"`
	UserLogin          string `json:"login"`
	UserHashedPassword []byte `json:"hashword"`
}

var (
	//ErrUserExists thrown when user already exists in database
	ErrUserExists = errors.New("User already exists")
	//ErrLoginNotFound thrown when user is not found in the database
	ErrLoginNotFound = errors.New("Login Not Found")
	//ErrInvalidLogin thrown when credentials are invalid
	ErrInvalidLogin = errors.New("Login and password do not match")
)

//GetLastUpdateTime returns the last time that the user's clumps have been updated
func GetLastUpdateTime(user *User) (string, error) {
	rows, err := db.Query(`
		SELECT userLastUpdateTime
		FROM userData
		WHERE userID = '` + strconv.Itoa(user.UserID) + `'
	`)
	defer rows.Close()
	if err != nil {
		return "", err
	}
	var lastUpdateTime string
	for rows.Next() {
		rows.Scan(&lastUpdateTime)
	}
	return lastUpdateTime, err
}

//UpdateLastUpdateTime sets updates the time of the last update (user table) to the current time
func UpdateLastUpdateTime(user *User, time string) error {
	statement, err := db.Prepare(`
		UPDATE userData
			SET userLastUpdateTime = ` + time + `
			WHERE userID = ` + strconv.Itoa(user.UserID) + `
	`)
	// SET userLastUpdateTime = ` + strconv.FormatInt(time, 10) + `
	if err != nil {
		return err
	}
	_, eErr := statement.Exec()
	if eErr != nil {
		return eErr
	}
	return nil
}

//Login validates a user based on their username and password
func Login(login string, password string) (*User, error) {
	user, err := getUserByLogin(login)
	if err != nil {
		return nil, err
	}
	compErr := bcrypt.CompareHashAndPassword(user.UserHashedPassword, []byte(password))
	if compErr != nil {
		if compErr == bcrypt.ErrMismatchedHashAndPassword {
			return nil, ErrInvalidLogin
		}
		return nil, compErr
	}
	return user, nil
}

//RegisterUser adds all user elements to a database if they are valid
func RegisterUser(login string, password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	addErr := AddUser(User{
		UserLogin:          login,
		UserHashedPassword: hashedPassword})
	return addErr
}

//GetUserByLogin takes a user login and returns the user's hashed password
func getUserByLogin(login string) (*User, error) {
	//Check if the specified user exists in the database. Return if not
	userExists, err := userExistsInDB(&User{UserLogin: login})
	if err != nil {
		return nil, err
	}
	if !userExists {
		return nil, ErrLoginNotFound
	}
	// Get the user's hashed password. Will need to be scanned
	userRows, err := db.Query(`
		SELECT userID, userLogin, userHashedPassword
		FROM userData
		WHERE userLogin = '` + login + `'
	`)
	defer userRows.Close()
	if err != nil {
		return nil, err
	}
	var user User
	for userRows.Next() {
		userRows.Scan(&user.UserID, &user.UserLogin, &user.UserHashedPassword)
	}
	return &user, err
}

//AddUser takes a user struct. Returns nil if good, else returns error.
func AddUser(user User) error {
	userExists, err := userExistsInDB(&user)
	if err != nil {
		return err
	}
	if userExists {
		return ErrUserExists
	}

	//Since everything checks out, add the user to the database
	statement, err := db.Prepare(`
		INSERT INTO userData (userLogin, userHashedPassword) VALUES (?, ?)
	`)
	if err != nil {
		return err
	}
	_, sErr := statement.Exec(user.UserLogin, user.UserHashedPassword)
	if sErr != nil {
		return sErr
	}
	return nil
}

//GetAllUsers returns an array of user structs
func GetAllUsers() ([]*User, error) {
	var users []*User //read users into this slice of User
	userInfoRows, err := db.Query(`
		SELECT userID, userLogin, userHashedPassword FROM userData
	`)
	defer userInfoRows.Close()
	if err != nil {
		return nil, err
	}
	var userID int
	var userLogin string
	var userHashedPassword []byte
	for userInfoRows.Next() {
		userInfoRows.Scan(&userID, &userLogin, &userHashedPassword)
		user := User{
			UserID:             userID,
			UserLogin:          userLogin,
			UserHashedPassword: userHashedPassword}
		users = append(users, &user)
	}
	return users, err
}

//userExistsInDB is used internally to determine if a user exists
func userExistsInDB(user *User) (bool, error) {
	//Result is 0 (is unique) or 1 (not unique).
	result, err := db.Query(`
		SELECT COUNT(1)
			FROM userData
			WHERE userLogin = '` + user.UserLogin + `'
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

//ElevateUser changes userPrivilaged to true. allows them to post more passwords than the "unpaid" limit
func ElevateUser(user *User) error {
	statement, err := db.Prepare(`
        UPDATE userData
			SET userPrivilaged = TRUE
			WHERE userID = '` + strconv.Itoa(user.UserID) + `'
	`)
	if err != nil {
		return err
	}
	_, serr := statement.Exec()
	if serr != nil {
		return serr
	}
	return nil
}

//Privilaged returns true if user is privilaged, false otherwise. also returns an err
func Privilaged(user *User) (bool, error) {
	//Result is 0 (is unique) or 1 (not unique).
	result, err := db.Query(`
		SELECT userPrivilaged
			FROM userData
			WHERE userID = '` + strconv.Itoa(user.UserID) + `'
	`)
	defer result.Close()
	if err != nil {
		return false, err
	}
	//scan the result into the res variable to be returned
	var privilaged bool
	for result.Next() {
		result.Scan(&privilaged)
	}
	return privilaged, nil
}
