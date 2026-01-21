
# Production Database & Security Architecture

## 1. Database Schema (PostgreSQL Recommended)

### Table: `users`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique identifier |
| `email` | String (Unique) | User's primary login |
| `password_hash` | String | Argon2 or BCrypt hashed password |
| `full_name` | String | Display name |
| `role` | Enum | STUDENT, WARDEN, CHECKER, ADMIN |
| `auth_method` | Enum | LOCAL, GOOGLE |
| `google_id` | String (Index) | OAuth unique identifier |
| `created_at` | Timestamp | Account creation date |

### Table: `leave_requests`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique identifier |
| `student_id` | UUID (FK) | Reference to users table |
| `reason` | Text | Full leave explanation |
| `start_date` | Date | Start of leave |
| `end_date` | Date | End of leave |
| `status` | Enum | PENDING_WARDEN, etc. |
| `document_url` | String | URL to S3/Cloud storage |
| `rejection_reason` | Text | Optional comment from admin |

### Table: `approval_history`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique identifier |
| `request_id` | UUID (FK) | Reference to leave_requests |
| `actor_id` | UUID (FK) | Admin/Warden who acted |
| `action` | String | Approved, Rejected, Forwarded |
| `comment` | Text | Audit log comment |
| `timestamp` | Timestamp | When it happened |

## 2. Security Measures
1.  **Password Hashing**: NEVER store plain text. Use `Argon2` or `PBKDF2`.
2.  **Row Level Security (RLS)**: Enable in Postgres so Students can only SELECT rows where `student_id = current_user_id`.
3.  **JWT Tokens**: Use Secure HTTP-Only cookies for session management to prevent XSS.
4.  **Google OAuth**: Always verify the `id_token` on the backend using Google's public keys.

## 3. Email Flow Logic
The system uses a background worker (Celery in Django or BullMQ in Node.js) to send emails asynchronously so the UI remains fast. 
- **Trigger**: `leave_request.create` -> Send to Warden.
- **Trigger**: `leave_request.status_change` -> Send to Student.
