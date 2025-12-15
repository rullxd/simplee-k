# API Documentation

## Base URL
```
http://localhost:8080/api
```

## Authentication

Semua endpoint kecuali `/login` memerlukan JWT token di header:
```
Authorization: Bearer <token>
```

## Endpoints

### 1. Login
**POST** `/api/login`

Request Body:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "student_id": "ADMIN001",
    "email": "admin@simplee-k.com",
    "name": "Admin User",
    "role": "admin"
  },
  "role": "admin",
  "message": "Login successful"
}
```

### 2. Get Profile
**GET** `/api/profile`

Headers:
```
Authorization: Bearer <token>
```

Response:
```json
{
  "id": 1,
  "username": "admin",
  "student_id": "ADMIN001",
  "email": "admin@simplee-k.com",
  "name": "Admin User",
  "role": "admin",
  "phone": ""
}
```

### 3. Get Categories
**GET** `/api/categories`

Response:
```json
[
  {
    "id": 1,
    "name": "Facilities",
    "slug": "facilities"
  },
  {
    "id": 2,
    "name": "Academics",
    "slug": "academics"
  }
]
```

### 4. Create Complaint
**POST** `/api/complaints`

Content-Type: `multipart/form-data`

Form Data:
- `category_id` (int, required)
- `title` (string, required)
- `description` (string, required)
- `evidence` (file, optional, max 5MB)

Response:
```json
{
  "id": 1,
  "ticket_id": "TKT-2024-001",
  "user_id": 1,
  "category_id": 1,
  "title": "Broken AC",
  "description": "AC is not working",
  "status": "pending",
  "evidence_path": "uploads/1_1234567890.jpg",
  "created_at": "2024-01-01T10:00:00Z",
  "user": {...},
  "category": {...}
}
```

### 5. Get Complaints
**GET** `/api/complaints`

Query Parameters:
- `page` (int, default: 1)
- `limit` (int, default: 10)
- `status` (string, optional: pending, in_process, completed, rejected)
- `search` (string, optional)

Response:
```json
{
  "data": [...],
  "total": 50,
  "page": 1,
  "limit": 10,
  "total_pages": 5
}
```

### 6. Get Complaint Stats
**GET** `/api/complaints/stats`

Response:
```json
{
  "total": 50,
  "pending": 10,
  "in_process": 5,
  "completed": 35
}
```

### 7. Get Complaint by ID
**GET** `/api/complaints/:id`

Response:
```json
{
  "id": 1,
  "ticket_id": "TKT-2024-001",
  "user_id": 1,
  "category_id": 1,
  "title": "Broken AC",
  "description": "AC is not working",
  "status": "pending",
  "admin_response": "",
  "evidence_path": "uploads/1_1234567890.jpg",
  "created_at": "2024-01-01T10:00:00Z",
  "user": {...},
  "category": {...}
}
```

### 8. Update Complaint
**PUT** `/api/complaints/:id`

Request Body:
```json
{
  "status": "in_process",
  "admin_response": "We have dispatched a technician."
}
```

Response: Updated complaint object

### 9. Delete Complaint
**DELETE** `/api/complaints/:id`

Response:
```json
{
  "message": "Complaint deleted successfully"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Error Response Format

```json
{
  "error": "Error message here"
}
```

