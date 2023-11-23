package db

type Vector struct {
	ID         int       `json:"ID" gorm:"primaryKey;autoIncrement"`
	Content       string   `json:"content"`
	Title 			string		`json:"title"`
	Url 			string		`json:"url"`
	Vec 			string		`json:"vec"`
}