# Link ATS Tracker - Improved Version

A modern, full-stack web application for tracking job applications with enhanced features, better error handling, and improved UX.

## ✨ Features

- 📋 **Bulk Link Import**: Paste multiple job links at once with preview
- 📊 **Status Tracking**: Track applications through TODO → APPLIED → INTERVIEW → OFFER/REJECTED → ARCHIVED
- 🎯 **Priority Levels**: Mark applications as LOW, MEDIUM, or HIGH priority
- 📝 **Rich Notes**: Add detailed notes for each application
- 🔍 **Advanced Search & Filter**: Filter by status, priority, and search across all fields
- 💾 **Excel Persistence**: All data stored in Excel file (local) or Vercel Blob (deployed)
- 🗑️ **Smart Delete Options**: Clear links, archive, or permanently delete
- 🔗 **Link Management**: Click links to open, edit titles, clear links
- 📈 **Statistics Dashboard**: Real-time stats with auto-refresh
- ⚡ **Improved Performance**: Better state management and error handling
- 🎨 **Modern UI**: Clean, responsive design with TailwindCSS

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Storage**: ExcelJS for reading/writing `.xlsx` files
- **Deployment**: Vercel (with Blob storage support)

## 📁 Project Structure

```
Application_tracker/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── services/       # Business logic & Excel service
│   │   ├── models/         # TypeScript types
│   │   ├── utils/          # Utility functions
│   │   ├── config/         # Configuration
│   │   └── ...
│   └── package.json
├── api/                    # Vercel serverless functions
│   └── applications/
├── data/                   # Excel file storage (local)
└── package.json            # Root scripts
```

## 🛠️ Setup

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

```bash
# Install all dependencies
npm run install:all
```

Or install manually:
```bash
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
```

### Running the Application

**Start both frontend and backend:**
```bash
npm run dev
```

This starts:
- Frontend on `http://localhost:5173`
- Backend on `http://localhost:4000`

**Or run separately:**

Frontend:
```bash
npm run dev:client
```

Backend:
```bash
npm run dev:server
```

## 📖 Usage

1. **Add Links**:
   - Single link: Use the form at the top
   - Bulk import: Click "Paste Links" button
   - Supports "Title|URL" format

2. **Manage Applications**:
   - Click fields to edit inline (company, role, location, URL)
   - Use dropdowns to change status and priority
   - Click "Notes" to add detailed notes
   - Click links to open in new tab

3. **Filter & Search**:
   - Filter by status using the dropdown
   - Search across all fields using the search box

4. **Actions**:
   - **Clear Link**: Removes only the URL and title
   - **Archive**: Marks as ARCHIVED
   - **Delete**: Permanently removes the application

## 📊 Data Model

Each application contains:

- `id`: Unique UUID
- `url`: Job application link
- `linkTitle`: Optional title for the link
- `company`: Company name (optional)
- `roleTitle`: Job title (optional)
- `location`: Job location (optional)
- `status`: TODO | APPLIED | INTERVIEW | OFFER | REJECTED | ARCHIVED
- `priority`: LOW | MEDIUM | HIGH
- `notes`: Free-form notes (optional)
- `appliedDate`: Auto-set when status → APPLIED
- `interviewDate`: Auto-set when status → INTERVIEW
- `offerDate`: Auto-set when status → OFFER
- `rejectedDate`: Auto-set when status → REJECTED
- `createdAt`: ISO timestamp
- `updatedAt`: ISO timestamp

## 🔌 API Endpoints

- `GET /api/applications` - Get all applications (with filters)
- `GET /api/applications/:id` - Get single application
- `POST /api/applications/links` - Create applications from URLs
- `PATCH /api/applications/:id` - Update an application
- `DELETE /api/applications/:id` - Archive (soft delete)
- `DELETE /api/applications/:id/hard` - Permanently delete
- `DELETE /api/applications/:id/clear-link` - Clear link only
- `GET /api/applications/stats` - Get statistics
- `GET /api/applications/excel-path` - Get storage path
- `POST /api/applications/restore` - Restore Excel file

## 🚀 Deployment to Vercel

1. Push code to GitHub
2. Import to Vercel
3. Set `BLOB_READ_WRITE_TOKEN` environment variable
4. Enable Vercel Blob storage
5. Deploy!

## 🎯 Improvements in This Version

- ✅ Better error handling with custom error classes
- ✅ Improved UI/UX with modern design
- ✅ Custom React hooks for state management
- ✅ Enhanced statistics dashboard
- ✅ Better code organization and structure
- ✅ Improved TypeScript types
- ✅ Enhanced Excel service with better error recovery
- ✅ Preview feature for bulk link import
- ✅ Auto-refreshing statistics
- ✅ Better loading states and user feedback
- ✅ Improved API error handling
- ✅ More robust data validation

## 📝 License

MIT
