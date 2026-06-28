# API Reference Documentation

Base URL: `http://localhost:5000/api`

This document lists all available endpoints in the AI-Native Test Automation Platform.

---

## Authentication Service
Endpoints to manage user logins and registrations. All private endpoints require a `Bearer <token>` string inside the standard `Authorization` header.

### Sign Up User
* **URL**: `/auth/signup`
* **Method**: `POST`
* **Access**: Public
* **Payload**:
```json
{
  "name": "John Tester",
  "email": "user@test.com",
  "password": "password123",
  "role": "user"
}
```
* **Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "_id": "60b9c...",
    "name": "John Tester",
    "email": "user@test.com",
    "role": "user",
    "token": "eyJhbGciOi..."
  }
}
```

### Log In User
* **URL**: `/auth/login`
* **Method**: `POST`
* **Access**: Public
* **Payload**:
```json
{
  "email": "user@test.com",
  "password": "password123"
}
```
* **Response (200 OK)**: Same structure as signup.

### Fetch Active Session Profile
* **URL**: `/auth/me`
* **Method**: `GET`
* **Access**: Private (Requires token)
* **Response (200 OK)**: Returns the user object excluding password.

---

## Project Management Service
Endpoints to manage multi-user application contexts.

### Get Projects
* **URL**: `/projects`
* **Method**: `GET`
* **Access**: Private
* **Response (200 OK)**: Returns list of projects owned by this user (or all projects if logged user is admin).

### Create Project
* **URL**: `/projects`
* **Method**: `POST`
* **Access**: Private
* **Payload**:
```json
{
  "name": "Cart Services App",
  "description": "API & UI check logs"
}
```

### Delete Project
* **URL**: `/projects/:id`
* **Method**: `DELETE`
* **Access**: Private
* **Response (200 OK)**: Cascades delete to remove all test cases and run logs.

---

## Test Case Management Service

### Get Test Cases
* **URL**: `/testcases`
* **Method**: `GET`
* **Access**: Private
* **Query Parameters**:
  - `project` (Required)
  - `search` (Optional)
  - `type` (Optional: manual, api, playwright)
  - `priority` (Optional: high, medium, low)

### Create Test Case
* **URL**: `/testcases`
* **Method**: `POST`
* **Access**: Private
* **Payload**:
```json
{
  "project": "60b9c...",
  "title": "Verify gateway timeout",
  "type": "api",
  "priority": "high",
  "apiConfig": {
    "url": "https://httpstat.us/200",
    "method": "GET",
    "expectedStatus": 200
  }
}
```

### Bulk Create Test Cases
* **URL**: `/testcases/bulk`
* **Method**: `POST`
* **Access**: Private
* **Payload**:
```json
{
  "project": "60b9c...",
  "testCases": [
    { "title": "AI Case 1", "steps": ["Step 1"], "assertions": ["A1"], "priority": "medium" }
  ]
}
```

---

## Executions & Reports Service

### Execute Test Case
* **URL**: `/executions/run/:id`
* **Method**: `POST`
* **Access**: Private
* **Response (201 Created)**: Triggers Playwright / API executor, records result, and returns execution run report logs.

### Get Dashboard Statistics
* **URL**: `/executions/dashboard`
* **Method**: `GET`
* **Access**: Private
* **Response (200 OK)**: Returns aggregated project metrics, doughnut charts distributions, and line graph run timeline.

---

## AI Assistant Service

### AI Suite Generation
* **URL**: `/ai/generate`
* **Method**: `POST`
* **Access**: Private
* **Payload**:
```json
{
  "pageDescription": "Checkout payment portal",
  "features": "verify visa validation, print card limits error",
  "type": "playwright"
}
```
* **Response (200 OK)**: Returns a JSON array of generated test objects.

### AI Bug Analyzer
* **URL**: `/ai/analyze-bug`
* **Method**: `POST`
* **Access**: Private
* **Payload**:
```json
{
  "stackTrace": "TimeoutError: locator.click: Timeout 30000ms exceeded."
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "rootCause": "Timeout exceeded while waiting for DOM selectors.",
    "fixSuggestion": "Verify click element loader finishes before click trigger.",
    "confidenceScore": 92
  }
}
```
