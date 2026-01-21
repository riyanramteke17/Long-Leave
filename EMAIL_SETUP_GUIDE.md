# Firebase Email Extension Setup Guide

## Step 1: Install Firebase Extension

1. Open **Firebase Console** → Your Project (`long-leave`)
2. Click **Extensions** in left sidebar
3. Click **Install Extension**
4. Search for **"Trigger Email"** or **"Trigger Email from Firestore"**
5. Click **Install**

## Step 2: Configure Extension

During installation, you'll be asked for:

### Required Settings:

**SMTP Connection URI:**
```
smtps://YOUR_EMAIL@gmail.com:YOUR_APP_PASSWORD@smtp.gmail.com:465
```

**Example:**
```
smtps://riyanramteke17@gmail.com:abcd1234efgh5678@smtp.gmail.com:465
```

> [!IMPORTANT]
> **Gmail App Password Required**
> - You CANNOT use your regular Gmail password
> - You must create an "App Password" from Google Account settings
> - See instructions below

**Default FROM Address:**
```
riyanramteke17@gmail.com
```
(Or whatever email you want to send from)

**Default REPLY-TO Address:**
```
riyanramteke17@gmail.com
```

**Firestore Collection Path:**
```
mail
```

**Email Documents TTL (Time to Live):**
```
86400
```
(This deletes processed emails after 24 hours)

## Step 3: Create Gmail App Password

1. Go to **Google Account** → **Security**
2. Enable **2-Step Verification** (if not already enabled)
3. Go to **App Passwords** section
4. Select **Mail** and **Other (Custom name)**
5. Enter name: "HostelEase Leave System"
6. Click **Generate**
7. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)
8. Remove spaces: `abcdefghijklmnop`
9. Use this in SMTP URI above

## Step 4: Update Firestore Rules

Copy and paste these rules in **Firestore Database → Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (
        request.auth.uid == userId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['superAdmin', 'subAdmin']
      );
    }
    
    match /leaves/{leaveId} {
      allow read, write: if request.auth != null;
    }
    
    // Mail collection for Email Extension
    match /mail/{mailId} {
      allow create: if request.auth != null;
      allow read, delete: if false;
    }
  }
}
```

Click **Publish**

## Step 5: Test Email System

1. **Logout** and **Login** to your app
2. Apply for a leave as a USER
3. Check your email - Admin should receive notification
4. Login as Admin and approve the leave
5. Check email - SubAdmin should receive notification
6. Continue testing the full workflow

## Troubleshooting

### Emails not sending?

1. Check **Firestore Database** → `mail` collection
   - If documents are stuck there, extension is not processing
   - Check extension logs

2. Check **Extensions** → **Trigger Email** → **Logs**
   - Look for errors

3. Verify SMTP credentials are correct

4. Make sure Gmail "Less secure app access" is NOT needed (App Password handles this)

### Common Issues:

**"Invalid login credentials"**
- Double-check App Password
- Make sure no spaces in password
- Verify email address is correct

**"Mail collection not found"**
- Make sure Firestore rules are published
- Collection will be created automatically when first email is sent

**"Permission denied"**
- Update Firestore rules as shown above
- Make sure you're logged in when testing

## Email Flow Summary

✅ **User applies for leave** → Email to all Admins
✅ **Admin approves** → Email to all SubAdmins  
✅ **SubAdmin approves** → Email to all SuperAdmins
✅ **SuperAdmin approves** → Email to User + All Admins (confirmation)
✅ **Any rejection** → Email to User + All Admins (rejection notice)

## Alternative: SendGrid (If Gmail doesn't work)

If you prefer SendGrid:

1. Sign up at sendgrid.com (Free tier: 100 emails/day)
2. Create API Key
3. Use this SMTP URI instead:
```
smtps://apikey:YOUR_SENDGRID_API_KEY@smtp.sendgrid.net:465
```

---

**Ready to proceed?** Follow these steps and let me know if you encounter any issues!
