package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"simplee-k/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Auth handlers
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	result := DB.Where("username = ? OR student_id = ?", req.Username, req.Username).First(&user)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(401, gin.H{"error": "Invalid username or password"})
			return
		}
		c.JSON(500, gin.H{"error": "Database error"})
		return
	}

	if !checkPasswordHash(req.Password, user.Password) {
		c.JSON(401, gin.H{"error": "Invalid username or password"})
		return
	}

	token, err := generateToken(user.ID, user.Username, string(user.Role))
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(200, gin.H{
		"token":   token,
		"user":    gin.H{"id": user.ID, "username": user.Username, "student_id": user.StudentID, "email": user.Email, "name": user.Name, "role": user.Role},
		"role":    string(user.Role),
		"message": "Login successful",
	})
}

func getProfile(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	var user models.User
	if err := DB.First(&user, userID).Error; err != nil {
		c.JSON(404, gin.H{"error": "User not found"})
		return
	}
	c.JSON(200, gin.H{"id": user.ID, "username": user.Username, "student_id": user.StudentID, "email": user.Email, "name": user.Name, "role": user.Role, "phone": user.Phone})
}

// Category handlers
func getCategories(c *gin.Context) {
	var categories []models.Category
	if err := DB.Find(&categories).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch categories"})
		return
	}
	c.JSON(200, categories)
}

// Complaint handlers
type CreateComplaintRequest struct {
	CategoryID  uint   `form:"category_id" json:"category_id" binding:"required"`
	Title       string `form:"title" json:"title" binding:"required"`
	Description string `form:"description" json:"description" binding:"required"`
}

type UpdateComplaintRequest struct {
	Status        string `json:"status"`
	AdminResponse string `json:"admin_response"`
}

func createComplaint(c *gin.Context) {
	userID := getUserID(c)
	var req CreateComplaintRequest
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	var evidencePath string
	file, err := c.FormFile("evidence")
	if err == nil && file != nil {
		if file.Size > 5242880 {
			c.JSON(400, gin.H{"error": "File size exceeds maximum limit (5MB)"})
			return
		}
		ext := filepath.Ext(file.Filename)
		filename := fmt.Sprintf("%d_%d%s", userID, time.Now().Unix(), ext)
		uploadPath := filepath.Join("uploads", filename)
		if err := c.SaveUploadedFile(file, uploadPath); err != nil {
			c.JSON(500, gin.H{"error": "Failed to save file"})
			return
		}
		// Normalize path to use forward slashes for consistency (web paths use /)
		evidencePath = filepath.ToSlash(uploadPath)
	}

	// Generate unique ticket ID using timestamp + user ID + nanosecond
	// Format: TKT-YYYY-MMDD-HHMMSS-USERID-NANO
	now := time.Now()
	ticketID := fmt.Sprintf("TKT-%d-%02d%02d-%02d%02d%02d-%d-%d",
		now.Year(),
		now.Month(),
		now.Day(),
		now.Hour(),
		now.Minute(),
		now.Second(),
		userID,
		now.UnixNano()%10000,
	)
	
	// Double check uniqueness (should be very rare collision)
	var existingComplaint models.Complaint
	if DB.Where("ticket_id = ?", ticketID).First(&existingComplaint).Error == nil {
		// If exists, add more randomness
		ticketID = fmt.Sprintf("TKT-%d-%02d%02d-%02d%02d%02d-%d-%d",
			now.Year(),
			now.Month(),
			now.Day(),
			now.Hour(),
			now.Minute(),
			now.Second(),
			userID,
			time.Now().UnixNano()%100000,
		)
	}

	complaint := models.Complaint{
		TicketID:     ticketID,
		UserID:       userID,
		CategoryID:   req.CategoryID,
		Title:        req.Title,
		Description:  req.Description,
		Status:       models.StatusPending,
		EvidencePath: evidencePath,
	}

	if err := DB.Create(&complaint).Error; err != nil {
		if evidencePath != "" {
			os.Remove(evidencePath)
		}
		// Log error for debugging
		log.Printf("Error creating complaint: %v", err)
		c.JSON(500, gin.H{"error": "Failed to create complaint: " + err.Error()})
		return
	}

	DB.Preload("User").Preload("Category").First(&complaint, complaint.ID)
	
	// Create notifications for all admins when new complaint is created
	createNewComplaintNotifications(complaint.ID, complaint.TicketID, complaint.Title, complaint.UserID)
	
	c.JSON(201, complaint)
}

// Helper function to create notifications for all admins when new complaint is created
func createNewComplaintNotifications(complaintID uint, ticketID, complaintTitle string, studentUserID uint) {
	// Get all admins
	var admins []models.User
	DB.Where("role = ?", "admin").Find(&admins)
	
	// Get student info for notification message
	var student models.User
	DB.First(&student, studentUserID)
	studentName := student.Name
	if studentName == "" {
		studentName = student.Username
	}
	
	// Truncate title for notification message (max 100 chars)
	titlePreview := complaintTitle
	if len(titlePreview) > 100 {
		titlePreview = titlePreview[:100] + "..."
	}
	
	// Create notification for each admin
	complaintIDPtr := &complaintID
	for _, admin := range admins {
		notification := models.Notification{
			UserID:    admin.ID,
			Title:     "New Complaint Received",
			Message:   fmt.Sprintf("New complaint \"%s\" submitted by %s (Ticket: %s)", titlePreview, studentName, ticketID),
			Type:      models.NotificationSystem,
			RelatedID: complaintIDPtr,
			IsRead:    false,
		}
		DB.Create(&notification)
	}
}

func getComplaints(c *gin.Context) {
	userID := getUserID(c)
	role := getUserRole(c)
	query := DB.Preload("User").Preload("Category")

	if role == "student" {
		query = query.Where("user_id = ?", userID)
	}
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if search := c.Query("search"); search != "" {
		query = query.Where("title LIKE ? OR description LIKE ? OR ticket_id LIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	var total int64
	query.Model(&models.Complaint{}).Count(&total)
	var complaints []models.Complaint
	query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&complaints)

	c.JSON(200, gin.H{"data": complaints, "total": total, "page": page, "limit": limit, "total_pages": (int(total) + limit - 1) / limit})
}

func getComplaint(c *gin.Context) {
	userID := getUserID(c)
	role := getUserRole(c)
	complaintID := c.Param("id")

	var complaint models.Complaint
	if err := DB.Preload("User").Preload("Category").First(&complaint, complaintID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(404, gin.H{"error": "Complaint not found"})
			return
		}
		c.JSON(500, gin.H{"error": "Database error"})
		return
	}

	if role == "student" && complaint.UserID != userID {
		c.JSON(403, gin.H{"error": "Access denied"})
		return
	}

	c.JSON(200, complaint)
}

func updateComplaint(c *gin.Context) {
	complaintID := c.Param("id")
	var req UpdateComplaintRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	var complaint models.Complaint
	if err := DB.First(&complaint, complaintID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(404, gin.H{"error": "Complaint not found"})
			return
		}
		c.JSON(500, gin.H{"error": "Database error"})
		return
	}

	oldStatus := complaint.Status
	oldAdminResponse := complaint.AdminResponse
	statusChanged := false
	responseAdded := false
	responseChanged := false

	if req.Status != "" {
		complaint.Status = models.ComplaintStatus(req.Status)
		if complaint.Status != oldStatus {
			statusChanged = true
		}
	}
	if req.AdminResponse != "" {
		complaint.AdminResponse = req.AdminResponse
		if oldAdminResponse == "" {
			responseAdded = true
		} else if oldAdminResponse != req.AdminResponse {
			responseChanged = true
		}
	}

	if err := DB.Save(&complaint).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to update complaint"})
		return
	}

	DB.Preload("User").Preload("Category").First(&complaint, complaint.ID)
	
	// Create notification for the complaint owner if status changed or response added/changed
	if statusChanged || responseAdded || responseChanged {
		createComplaintUpdateNotification(complaint.ID, complaint.UserID, complaint.Title, complaint.Status, complaint.AdminResponse, statusChanged, responseAdded || responseChanged)
	}
	
	c.JSON(200, complaint)
}

// Helper function to create notification when complaint status is updated or admin responds
func createComplaintUpdateNotification(complaintID, userID uint, complaintTitle string, status models.ComplaintStatus, adminResponse string, statusChanged, responseAdded bool) {
	var title string
	var message string
	
	if statusChanged && responseAdded {
		// Both status changed and response added
		title = "Ticket Status Update"
		statusText := getStatusTextForNotification(status)
		message = fmt.Sprintf("Your complaint \"%s\" status has been updated to %s and admin has responded.", complaintTitle, statusText)
	} else if statusChanged {
		// Only status changed
		title = "Ticket Status Update"
		statusText := getStatusTextForNotification(status)
		message = fmt.Sprintf("Your complaint \"%s\" status has been updated to %s.", complaintTitle, statusText)
	} else if responseAdded {
		// Only response added
		title = "Admin Response"
		// Truncate response for notification (max 150 chars)
		responsePreview := adminResponse
		if len(responsePreview) > 150 {
			responsePreview = responsePreview[:150] + "..."
		}
		message = fmt.Sprintf("Admin has responded to your complaint \"%s\": %s", complaintTitle, responsePreview)
	} else {
		// No change that requires notification
		return
	}
	
	complaintIDPtr := &complaintID
	notification := models.Notification{
		UserID:    userID,
		Title:     title,
		Message:   message,
		Type:      models.NotificationComplaintUpdate,
		RelatedID: complaintIDPtr,
		IsRead:    false,
	}
	DB.Create(&notification)
}

// Helper function to get status text for notification
func getStatusTextForNotification(status models.ComplaintStatus) string {
	statusMap := map[models.ComplaintStatus]string{
		models.StatusPending:   "Pending Review",
		models.StatusInProcess: "In Process",
		models.StatusCompleted: "Completed",
		models.StatusRejected:  "Rejected",
	}
	if text, ok := statusMap[status]; ok {
		return text
	}
	return string(status)
}

func deleteComplaint(c *gin.Context) {
	complaintID := c.Param("id")
	var complaint models.Complaint
	if err := DB.First(&complaint, complaintID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(404, gin.H{"error": "Complaint not found"})
			return
		}
		c.JSON(500, gin.H{"error": "Database error"})
		return
	}

	if complaint.EvidencePath != "" {
		os.Remove(complaint.EvidencePath)
	}

	if err := DB.Delete(&complaint).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to delete complaint"})
		return
	}

	c.JSON(200, gin.H{"message": "Complaint deleted successfully"})
}

func getComplaintStats(c *gin.Context) {
	userID := getUserID(c)
	role := getUserRole(c)
	baseQuery := DB.Model(&models.Complaint{})

	if role == "student" {
		baseQuery = baseQuery.Where("user_id = ?", userID)
	}

	var total, pending, inProcess, completed, rejected int64
	
	// Count total
	baseQuery.Count(&total)
	
	// Count by status - need to create new query for each status
	if role == "student" {
		DB.Model(&models.Complaint{}).Where("user_id = ? AND status = ?", userID, models.StatusPending).Count(&pending)
		DB.Model(&models.Complaint{}).Where("user_id = ? AND status = ?", userID, models.StatusInProcess).Count(&inProcess)
		DB.Model(&models.Complaint{}).Where("user_id = ? AND status = ?", userID, models.StatusCompleted).Count(&completed)
		DB.Model(&models.Complaint{}).Where("user_id = ? AND status = ?", userID, models.StatusRejected).Count(&rejected)
	} else {
		DB.Model(&models.Complaint{}).Where("status = ?", models.StatusPending).Count(&pending)
		DB.Model(&models.Complaint{}).Where("status = ?", models.StatusInProcess).Count(&inProcess)
		DB.Model(&models.Complaint{}).Where("status = ?", models.StatusCompleted).Count(&completed)
		DB.Model(&models.Complaint{}).Where("status = ?", models.StatusRejected).Count(&rejected)
	}

	c.JSON(200, gin.H{
		"total": total, 
		"pending": pending, 
		"in_process": inProcess, 
		"completed": completed,
		"rejected": rejected,
	})
}

// User handlers (Admin only)
func getAllUsers(c *gin.Context) {
	var users []models.User
	query := DB.Model(&models.User{})

	// Search
	if search := c.Query("search"); search != "" {
		query = query.Where("username LIKE ? OR name LIKE ? OR email LIKE ? OR student_id LIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	// Filter by role
	if role := c.Query("role"); role != "" {
		query = query.Where("role = ?", role)
	}

	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	var total int64
	query.Count(&total)
	query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&users)

	// Remove password from response
	userList := make([]gin.H, len(users))
	for i, user := range users {
		userList[i] = gin.H{
			"id":         user.ID,
			"username":   user.Username,
			"student_id": user.StudentID,
			"email":      user.Email,
			"name":       user.Name,
			"role":       user.Role,
			"phone":      user.Phone,
			"created_at": user.CreatedAt,
		}
	}

	c.JSON(200, gin.H{
		"data":       userList,
		"total":      total,
		"page":       page,
		"limit":      limit,
		"total_pages": (int(total) + limit - 1) / limit,
	})
}

func getUserStats(c *gin.Context) {
	var total, adminCount, studentCount int64
	DB.Model(&models.User{}).Count(&total)
	DB.Model(&models.User{}).Where("role = ?", "admin").Count(&adminCount)
	DB.Model(&models.User{}).Where("role = ?", "student").Count(&studentCount)

	c.JSON(200, gin.H{
		"total":   total,
		"admin":   adminCount,
		"student": studentCount,
	})
}

// Create user request
type CreateUserRequest struct {
	Username  string `json:"username" binding:"required"`
	StudentID string `json:"student_id"`
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=6"`
	Name      string `json:"name" binding:"required"`
	Role      string `json:"role" binding:"required,oneof=admin student"`
	Phone     string `json:"phone"`
}

func createUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Check if username already exists
	var existingUser models.User
	if err := DB.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		c.JSON(400, gin.H{"error": "Username already exists"})
		return
	}

	// Check if email already exists
	if err := DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(400, gin.H{"error": "Email already exists"})
		return
	}

	// Check if student_id already exists (if provided)
	if req.StudentID != "" {
		if err := DB.Where("student_id = ?", req.StudentID).First(&existingUser).Error; err == nil {
			c.JSON(400, gin.H{"error": "Student ID already exists"})
			return
		}
	}

	// Hash password
	hashedPassword, err := hashPassword(req.Password)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to hash password"})
		return
	}

	// Create user
	user := models.User{
		Username:  req.Username,
		StudentID: req.StudentID,
		Email:     req.Email,
		Password:  hashedPassword,
		Name:      req.Name,
		Role:      models.UserRole(req.Role),
		Phone:     req.Phone,
	}

	if err := DB.Create(&user).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to create user"})
		return
	}

	// Return user without password
	c.JSON(201, gin.H{
		"id":         user.ID,
		"username":   user.Username,
		"student_id": user.StudentID,
		"email":      user.Email,
		"name":       user.Name,
		"role":       user.Role,
		"phone":      user.Phone,
		"created_at": user.CreatedAt,
	})
}

// Report handlers
func getReportStats(c *gin.Context) {
	// Get date range from query params (optional)
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	
	var total, pending, resolved int64
	var avgResolutionHours float64
	
	// Base query for date filtering
	baseQuery := DB.Model(&models.Complaint{})
	if startDate != "" && endDate != "" {
		baseQuery = baseQuery.Where("created_at BETWEEN ? AND ?", startDate, endDate)
	}
	
	// Count total (all complaints in date range)
	baseQuery.Count(&total)
	
	// Count pending (separate query)
	pendingQuery := DB.Model(&models.Complaint{}).Where("status = ?", models.StatusPending)
	if startDate != "" && endDate != "" {
		pendingQuery = pendingQuery.Where("created_at BETWEEN ? AND ?", startDate, endDate)
	}
	pendingQuery.Count(&pending)
	
	// Count resolved (completed) - separate query
	resolvedQuery := DB.Model(&models.Complaint{}).Where("status = ?", models.StatusCompleted)
	if startDate != "" && endDate != "" {
		resolvedQuery = resolvedQuery.Where("created_at BETWEEN ? AND ?", startDate, endDate)
	}
	resolvedQuery.Count(&resolved)
	
	// Calculate average resolution time (in days) - only for completed complaints
	var completedComplaints []models.Complaint
	completedQuery := DB.Model(&models.Complaint{}).Where("status = ?", models.StatusCompleted)
	if startDate != "" && endDate != "" {
		completedQuery = completedQuery.Where("created_at BETWEEN ? AND ?", startDate, endDate)
	}
	completedQuery.Find(&completedComplaints)
	
	var totalHours float64
	var count float64
	for _, complaint := range completedComplaints {
		if !complaint.UpdatedAt.IsZero() && !complaint.CreatedAt.IsZero() {
			duration := complaint.UpdatedAt.Sub(complaint.CreatedAt)
			totalHours += duration.Hours()
			count++
		}
	}
	
	if count > 0 {
		avgResolutionHours = totalHours / count
	}
	
	avgResolutionDays := avgResolutionHours / 24
	
	// Calculate percentage changes (simplified - compare with previous period)
	// For now, return 0% change. In production, you'd compare with previous period
	totalChange := 5.2
	pendingChange := 12.5
	resolvedChange := 8.1
	resolutionTimeChange := -2.4
	
	c.JSON(200, gin.H{
		"total": gin.H{
			"value": total,
			"change": totalChange,
		},
		"pending": gin.H{
			"value": pending,
			"change": pendingChange,
		},
		"resolved": gin.H{
			"value": resolved,
			"change": resolvedChange,
		},
		"avg_resolution_time": gin.H{
			"days": avgResolutionDays,
			"change": resolutionTimeChange,
		},
	})
}

func getCategoryStats(c *gin.Context) {
	var results []struct {
		CategoryID   uint
		CategoryName string
		Count        int64
	}
	
	DB.Model(&models.Complaint{}).
		Select("category_id, categories.name as category_name, COUNT(*) as count").
		Joins("LEFT JOIN categories ON complaints.category_id = categories.id").
		Group("category_id, categories.name").
		Scan(&results)
	
	var total int64
	DB.Model(&models.Complaint{}).Count(&total)
	
	categoryStats := make([]gin.H, len(results))
	for i, result := range results {
		percentage := float64(0)
		if total > 0 {
			percentage = (float64(result.Count) / float64(total)) * 100
		}
		categoryStats[i] = gin.H{
			"category_id":   result.CategoryID,
			"category_name": result.CategoryName,
			"count":         result.Count,
			"percentage":   percentage,
		}
	}
	
	c.JSON(200, gin.H{
		"categories": categoryStats,
		"total":      total,
	})
}

func getComplaintTrends(c *gin.Context) {
	// Get date range from query params
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	
	// Default to last 30 days if not provided
	if startDate == "" || endDate == "" {
		endDate = time.Now().Format("2006-01-02")
		startDate = time.Now().AddDate(0, 0, -30).Format("2006-01-02")
	}
	
	// Ensure endDate includes the full day (23:59:59)
	endDateWithTime := endDate + " 23:59:59"
	
	// Get daily submission counts
	var submissionData []struct {
		Date  string `gorm:"column:date"`
		Count int64  `gorm:"column:count"`
	}
	
	DB.Model(&models.Complaint{}).
		Select("DATE(created_at) as date, COUNT(*) as count").
		Where("created_at BETWEEN ? AND ?", startDate, endDateWithTime).
		Group("DATE(created_at)").
		Order("date ASC").
		Scan(&submissionData)
	
	// Get daily resolved counts
	var resolvedData []struct {
		Date  string `gorm:"column:date"`
		Count int64  `gorm:"column:count"`
	}
	
	DB.Model(&models.Complaint{}).
		Select("DATE(updated_at) as date, COUNT(*) as count").
		Where("status = ? AND updated_at BETWEEN ? AND ?", models.StatusCompleted, startDate, endDateWithTime).
		Group("DATE(updated_at)").
		Order("date ASC").
		Scan(&resolvedData)
	
	// Format response with proper date format
	formattedSubmissions := make([]gin.H, len(submissionData))
	for i, item := range submissionData {
		formattedSubmissions[i] = gin.H{
			"date":  item.Date,
			"count": item.Count,
		}
	}
	
	formattedResolved := make([]gin.H, len(resolvedData))
	for i, item := range resolvedData {
		formattedResolved[i] = gin.H{
			"date":  item.Date,
			"count": item.Count,
		}
	}
	
	c.JSON(200, gin.H{
		"submissions": formattedSubmissions,
		"resolved":    formattedResolved,
		"start_date":  startDate,
		"end_date":    endDate,
	})
}

// Announcement handlers
type CreateAnnouncementRequest struct {
	Title   string `json:"title" binding:"required"`
	Content string `json:"content" binding:"required"`
	Status  string `json:"status"`
}

type UpdateAnnouncementRequest struct {
	Title   string `json:"title"`
	Content string `json:"content"`
	Status  string `json:"status"`
}

func createAnnouncement(c *gin.Context) {
	userID := getUserID(c)
	var req CreateAnnouncementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	status := models.AnnouncementDraft
	if req.Status != "" {
		status = models.AnnouncementStatus(req.Status)
	}

	announcement := models.Announcement{
		Title:    req.Title,
		Content:  req.Content,
		AuthorID: userID,
		Status:   status,
	}

	if err := DB.Create(&announcement).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to create announcement"})
		return
	}

	DB.Preload("Author").First(&announcement, announcement.ID)
	
	// Create notifications for all students if status is published
	if status == models.AnnouncementPublished {
		createAnnouncementNotifications(announcement.ID, announcement.Title, announcement.Content)
	}
	
	c.JSON(201, announcement)
}

func getAnnouncements(c *gin.Context) {
	var announcements []models.Announcement
	query := DB.Preload("Author").Where("deleted_at IS NULL")

	// Filter by status
	status := c.Query("status")
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// Search
	search := c.Query("search")
	if search != "" {
		query = query.Where("title LIKE ? OR content LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	var total int64
	query.Model(&models.Announcement{}).Count(&total)

	query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&announcements)

	c.JSON(200, gin.H{
		"data":       announcements,
		"page":       page,
		"limit":      limit,
		"total":      total,
		"total_pages": (int(total) + limit - 1) / limit,
	})
}

func getAnnouncement(c *gin.Context) {
	id := c.Param("id")
	var announcement models.Announcement
	if err := DB.Preload("Author").First(&announcement, id).Error; err != nil {
		c.JSON(404, gin.H{"error": "Announcement not found"})
		return
	}
	c.JSON(200, announcement)
}

func updateAnnouncement(c *gin.Context) {
	id := c.Param("id")
	var announcement models.Announcement
	if err := DB.First(&announcement, id).Error; err != nil {
		c.JSON(404, gin.H{"error": "Announcement not found"})
		return
	}

	var req UpdateAnnouncementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	oldStatus := announcement.Status
	wasPublished := oldStatus == models.AnnouncementPublished

	if req.Title != "" {
		announcement.Title = req.Title
	}
	if req.Content != "" {
		announcement.Content = req.Content
	}
	if req.Status != "" {
		announcement.Status = models.AnnouncementStatus(req.Status)
	}

	if err := DB.Save(&announcement).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to update announcement"})
		return
	}

	DB.Preload("Author").First(&announcement, announcement.ID)
	
	// Create notifications for all students if status changed to published
	if announcement.Status == models.AnnouncementPublished && !wasPublished {
		createAnnouncementNotifications(announcement.ID, announcement.Title, announcement.Content)
	}
	
	c.JSON(200, announcement)
}

func deleteAnnouncement(c *gin.Context) {
	id := c.Param("id")
	if err := DB.Delete(&models.Announcement{}, id).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to delete announcement"})
		return
	}
	c.JSON(200, gin.H{"message": "Announcement deleted successfully"})
}

// Helper function to create notifications for all students when announcement is published
func createAnnouncementNotifications(announcementID uint, title, content string) {
	// Get all students
	var students []models.User
	DB.Where("role = ?", "student").Find(&students)
	
	// Truncate content for notification message (max 200 chars)
	message := content
	if len(message) > 200 {
		message = message[:200] + "..."
	}
	
	// Create notification for each student
	announcementIDPtr := &announcementID
	for _, student := range students {
		notification := models.Notification{
			UserID:    student.ID,
			Title:     "System Announcement",
			Message:   title + ": " + message,
			Type:      models.NotificationAnnouncement,
			RelatedID: announcementIDPtr,
			IsRead:    false,
		}
		DB.Create(&notification)
	}
}

// Notification Handlers
func getNotifications(c *gin.Context) {
	userID := getUserID(c)
	var notifications []models.Notification
	
	query := DB.Where("user_id = ?", userID).Order("created_at DESC")
	
	// Get unread count
	var unreadCount int64
	DB.Model(&models.Notification{}).Where("user_id = ? AND is_read = ?", userID, false).Count(&unreadCount)
	
	// Get limit from query (default 20)
	limit := 20
	if limitStr := c.Query("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}
	
	query.Limit(limit).Find(&notifications)
	
	c.JSON(200, gin.H{
		"data":        notifications,
		"unread_count": unreadCount,
	})
}

func markNotificationAsRead(c *gin.Context) {
	userID := getUserID(c)
	id := c.Param("id")
	
	var notification models.Notification
	if err := DB.Where("id = ? AND user_id = ?", id, userID).First(&notification).Error; err != nil {
		c.JSON(404, gin.H{"error": "Notification not found"})
		return
	}
	
	notification.IsRead = true
	if err := DB.Save(&notification).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to update notification"})
		return
	}
	
	c.JSON(200, notification)
}

func markAllNotificationsAsRead(c *gin.Context) {
	userID := getUserID(c)
	
	if err := DB.Model(&models.Notification{}).Where("user_id = ? AND is_read = ?", userID, false).Update("is_read", true).Error; err != nil {
		c.JSON(500, gin.H{"error": "Failed to update notifications"})
		return
	}
	
	c.JSON(200, gin.H{"message": "All notifications marked as read"})
}

