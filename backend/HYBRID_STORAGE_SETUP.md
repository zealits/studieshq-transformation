# Hybrid File Storage System

This project uses a hybrid approach for file storage to optimize for different use cases:

## Storage Strategy

### 🌥️ **Cloudinary Storage** (External Cloud)

- **Profile Images**: User avatar pictures
- **Verification Documents**: ID verification files (passport, license, etc.)
- **Benefits**:
  - Automatic image optimization and resizing
  - Global CDN delivery
  - No server storage consumption
  - Built-in image transformations

### 💾 **Local Server Storage**

- **Milestone Deliverables**: Project work files and deliverables
- **Benefits**:
  - Complete data control and privacy
  - No external dependencies for critical project files
  - Faster access for large files
  - No cloud storage costs for project deliverables

## File Organization

```
Cloudinary Folders:
├── profile_images/          # User profile pictures
└── verification_documents/  # ID verification files

Local Server Structure:
backend/src/uploads/
└── milestone-deliverables/  # Project deliverable files
```

## File Access URLs

### Cloudinary Files (Profile & Verification)

```
https://res.cloudinary.com/[cloud-name]/image/upload/v[version]/[folder]/[filename]
```

### Local Files (Milestone Deliverables)

```
http://localhost:2001/api/upload/files/milestone-deliverables/[filename]
```

## Configuration

The system is configured in `backend/src/config/config.js`:

- **Cloudinary**: Uses environment variables for cloud credentials
- **Local Storage**: Uses `backend/src/uploads/milestone-deliverables/` directory
- **File Size Limits**:
  - Profile Images: 5MB (JPG, PNG)
  - Verification Docs: 5MB (JPG, PNG, PDF)
  - Milestone Deliverables: 50MB (Multiple formats including ZIP, DOC, PDF, etc.)

## Security

- **Cloudinary files**: Protected by Cloudinary's security features
- **Local files**: Protected by unique filename generation with user ID prefix
- **Access Control**: Authentication required for uploads, public access for file serving (with unique names)

## Environment Variables Required

```env
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## API Endpoints

### Upload Endpoints

- `POST /api/upload/profile-image` - Upload profile image to Cloudinary
- `POST /api/upload/verification-document` - Upload verification doc to Cloudinary
- `POST /api/upload/milestone-deliverable` - Upload deliverables to local server

### File Serving

- Cloudinary files: Served directly by Cloudinary CDN
- Local files: `GET /api/upload/files/milestone-deliverables/:filename`

This hybrid approach ensures optimal performance, cost-effectiveness, and data control for different types of files in the system.
