package models

import (
	"time"

	"gorm.io/gorm"
)

type UserRole string

const (
	RoleAdmin   UserRole = "admin"
	RoleStudent UserRole = "student"
)

type ComplaintStatus string

const (
	StatusPending   ComplaintStatus = "pending"
	StatusInProcess ComplaintStatus = "in_process"
	StatusCompleted ComplaintStatus = "completed"
	StatusRejected  ComplaintStatus = "rejected"
)

type AnnouncementStatus string

const (
	AnnouncementDraft     AnnouncementStatus = "draft"
	AnnouncementPublished AnnouncementStatus = "published"
	AnnouncementArchived  AnnouncementStatus = "archived"
)

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Username  string    `gorm:"uniqueIndex;not null" json:"username"`
	StudentID string    `gorm:"uniqueIndex" json:"student_id"`
	Email     string    `gorm:"uniqueIndex" json:"email"`
	Password  string    `gorm:"not null" json:"-"`
	Name      string    `json:"name"`
	Role      UserRole  `gorm:"type:enum('admin','student');default:'student'" json:"role"`
	Phone     string    `json:"phone"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type Category struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"uniqueIndex;not null" json:"name"`
	Slug      string    `gorm:"uniqueIndex;not null" json:"slug"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Complaint struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	TicketID    string         `gorm:"uniqueIndex;not null" json:"ticket_id"`
	UserID      uint           `gorm:"not null;index" json:"user_id"`
	User        User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	CategoryID  uint           `gorm:"not null;index" json:"category_id"`
	Category    Category       `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Title       string         `gorm:"not null" json:"title"`
	Description string         `gorm:"type:text;not null" json:"description"`
	Status      ComplaintStatus `gorm:"type:enum('pending','in_process','completed','rejected');default:'pending'" json:"status"`
	AdminResponse string        `gorm:"type:text" json:"admin_response"`
	EvidencePath  string        `json:"evidence_path"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type Announcement struct {
	ID        uint               `gorm:"primaryKey" json:"id"`
	Title     string             `gorm:"not null" json:"title"`
	Content   string             `gorm:"type:text;not null" json:"content"`
	AuthorID uint               `gorm:"not null;index" json:"author_id"`
	Author    User               `gorm:"foreignKey:AuthorID" json:"author,omitempty"`
	Status    AnnouncementStatus `gorm:"type:enum('draft','published','archived');default:'draft'" json:"status"`
	CreatedAt time.Time          `json:"created_at"`
	UpdatedAt time.Time          `json:"updated_at"`
	DeletedAt gorm.DeletedAt     `gorm:"index" json:"-"`
}

type NotificationType string

const (
	NotificationComplaintUpdate NotificationType = "complaint_update"
	NotificationAnnouncement    NotificationType = "announcement"
	NotificationSystem         NotificationType = "system"
	NotificationOther          NotificationType = "other"
)

type Notification struct {
	ID        uint             `gorm:"primaryKey" json:"id"`
	UserID    uint             `gorm:"not null;index" json:"user_id"`
	User      User             `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Title     string           `gorm:"not null" json:"title"`
	Message   string           `gorm:"type:text;not null" json:"message"`
	Type      NotificationType `gorm:"type:enum('complaint_update','announcement','system','other');default:'other'" json:"type"`
	RelatedID *uint            `json:"related_id,omitempty"`
	IsRead    bool             `gorm:"default:false;index" json:"is_read"`
	CreatedAt time.Time        `json:"created_at"`
	UpdatedAt time.Time        `json:"updated_at"`
}

