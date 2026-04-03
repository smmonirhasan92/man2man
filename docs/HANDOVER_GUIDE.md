# PROJECT LOTTERY PRO - VERSION 1 M
**Handover Date:** February 02, 2026

## 1. System Requirements
To run this system, ensure the following are installed:
- **Node.js**: Version 18.0.0 or higher.
- **MongoDB**: Version 6.0 or higher.
- **PowerShell**: For running startup scripts (Windows).

## 2. Environment Setup
1. Define your environment variables in `.env` files.
2. A template is provided at `.env.example`. Rename it to `.env` in the root (and backend/frontend if needed) and fill in your details (Database URL, Secrets, etc.).

## 3. Database Restoration
This package includes a full JSON dump of the database in `/assets/db_dump`.
Since `mongodump` tools vary by version, we have provided universal **JSON** exports.

**Restore Command (using mongoimport):**
You will need to import each JSON file into your MongoDB instance.
We recommend using **MongoDB Compass** (GUI):
1. Open MongoDB Compass and connect to your DB.
2. Create a database named `usa-affiliate` (or your preferred name).
3. For each file in `/assets/db_dump` (e.g., `users.json`), create a collection (e.g., `users`) and click "Import Data" -> Select JSON file.

**Alternative (CLI):**
```bash
mongoimport --db usa-affiliate --collection users --file assets/db_dump/users.json --jsonArray
# Repeat for all files
```

## 4. Launching the System
**One-Click Start (Windows):**
- Double-click `start_dev.bat` in the root directory.

**Manual Start:**
1. **Backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 5. URLs
- **Frontend / Admin Panel:** http://localhost:3000
- **Backend API:** http://localhost:5050
