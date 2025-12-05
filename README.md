# Link ATS Tracker

A full-stack web application for tracking job applications. Store, manage, and organize job links with status tracking, priority levels, and notes. All data is persisted in an Excel file.

## Features

- 📋 **Bulk Link Import**: Paste multiple job links at once
- 📊 **Status Tracking**: Track applications through TODO → APPLIED → INTERVIEW → OFFER/REJECTED → ARCHIVED
- 🎯 **Priority Levels**: Mark applications as LOW, MEDIUM, or HIGH priority
- 📝 **Notes & Metadata**: Add company names, role titles, locations, and notes
- 🔍 **Search & Filter**: Filter by status and search across all fields
- 💾 **Excel Persistence**: All data stored in `data/applications.xlsx`
- 🗑️ **Soft & Hard Delete**: Archive applications or permanently delete them

## Tech Stack

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Storage**: ExcelJS for reading/writing `.xlsx` files

## Project Structure

```
Application_tracker/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── types.ts
│   ├── package.json
│   └── vite.config.ts
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic & Excel service
│   │   ├── models/         # TypeScript types
│   │   └── index.ts
│   └── package.json
├── data/                   # Excel file storage
│   └── applications.xlsx  # Auto-created on first use
├── package.json            # Root scripts
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher recommended)
- npm

### Installation

1. **Install all dependencies** (root, client, and server):
   ```bash
   npm run install:all
   ```

   Or install manually:
   ```bash
   npm install
   cd client && npm install && cd ..
   cd server && npm install && cd ..
   ```

### Running the Application

**Start both frontend and backend concurrently:**
```bash
npm run dev
```

This will start:
- Frontend on `http://localhost:5173`
- Backend on `http://localhost:4000`

**Or run them separately:**

Frontend only:
```bash
npm run dev:client
```

Backend only:
```bash
npm run dev:server
```

## Usage

1. **Add Job Links**:
   - Use the "Paste Links" button to bulk import multiple URLs (one per line)
   - Or use the single link input field at the top

2. **Manage Applications**:
   - Click "Edit" to update company, role title, and notes
   - Use the status dropdown to change application status
   - Set priority levels (LOW, MEDIUM, HIGH)
   - Use quick action buttons: "Mark Applied", "Mark TODO", "Archive", "Delete"

3. **Filter & Search**:
   - Use the status filter dropdown to show specific statuses
   - Use the search box to find applications by company, role, notes, or URL

4. **Delete Applications**:
   - **Archive (Soft Delete)**: Marks the application as ARCHIVED but keeps it in the system
   - **Delete (Hard Delete)**: Permanently removes the application from the Excel file

## Data Model

Each application record contains:

- `id`: Unique UUID
- `url`: Job application link
- `company`: Company name (optional)
- `roleTitle`: Job title (optional)
- `location`: Job location (optional)
- `status`: TODO | APPLIED | INTERVIEW | OFFER | REJECTED | ARCHIVED
- `priority`: LOW | MEDIUM | HIGH
- `notes`: Free-form notes (optional)
- `createdAt`: ISO timestamp
- `updatedAt`: ISO timestamp

## API Endpoints

- `GET /api/applications` - Get all applications (with optional `?status=` and `?search=` query params)
- `POST /api/applications/links` - Create applications from an array of URLs
- `PATCH /api/applications/:id` - Update an application
- `DELETE /api/applications/:id` - Soft delete (archive) an application
- `DELETE /api/applications/:id/hard` - Hard delete (permanently remove) an application

## Excel File

The Excel file (`data/applications.xlsx`) is automatically created on first use. It contains a single sheet named "Applications" with a header row and all application data. The file is read and written atomically to ensure data consistency.

## Development

- Frontend uses Vite for fast HMR (Hot Module Replacement)
- Backend uses `tsx` for TypeScript execution with watch mode
- Both frontend and backend support TypeScript strict mode

## Troubleshooting

- **Port conflicts**: If ports 4000 or 5173 are in use, modify the ports in `server/src/index.ts` and `client/vite.config.ts`
- **Excel file errors**: Ensure the `data/` directory has write permissions
- **CORS issues**: Verify the CORS origin in `server/src/index.ts` matches your frontend URL

## License

MIT

