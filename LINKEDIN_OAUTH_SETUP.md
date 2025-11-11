# LinkedIn OAuth Integration Setup

## Overview

This implementation replaces the manual LinkedIn URL input with LinkedIn OAuth/OIDC authentication to verify freelancer LinkedIn accounts.

## What Was Implemented

### Backend

1. **LinkedIn OAuth Controller** (`backend/src/controllers/linkedinController.js`)

   - `initiateLinkedInAuth`: Generates LinkedIn authorization URL
   - `handleLinkedInCallback`: Handles OAuth callback from LinkedIn
   - `getLinkedInStatus`: Returns verification status
   - `disconnectLinkedIn`: Disconnects LinkedIn account

2. **LinkedIn Routes** (`backend/src/routes/linkedinRoutes.js`)

   - `GET /api/linkedin/auth` - Initiate OAuth flow (Private)
   - `GET /api/linkedin/callback` - Handle callback (Public)
   - `GET /api/linkedin/status` - Get verification status (Private)
   - `DELETE /api/linkedin/disconnect` - Disconnect account (Private)

3. **Profile Model Update** (`backend/src/models/Profile.js`)
   - Added `linkedinVerification` field to store:
     - `isVerified`: Boolean
     - `linkedinId`: LinkedIn 'sub' identifier
     - `verifiedAt`: Verification timestamp
     - `profileData`: User profile data from LinkedIn

### Frontend

1. **ProfilePage Updates** (`frontend/src/pages/freelancer/ProfilePage.jsx`)
   - Replaced LinkedIn text input with "Sign in with LinkedIn" button
   - Added verification status display with checkmark
   - Added disconnect functionality
   - Handles OAuth callback redirects

## Environment Variables Required

Add these to your `.env` file:

```env
# LinkedIn OAuth Configuration
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Optional - if different from defaults
LINKEDIN_REDIRECT_URI=http://localhost:2001/api/linkedin/callback
BACKEND_URL=http://localhost:2001
FRONTEND_URL=http://localhost:5173
```

## LinkedIn Developer Portal Configuration

### 1. Redirect URI Setup

In your LinkedIn Developer Portal, add the following redirect URI:

```
http://localhost:2001/api/linkedin/callback
```

(For production, use your production backend URL)

### 2. Required Scopes

Ensure your LinkedIn app has access to:

- `openid` (required for OIDC)
- `profile` (required for name and profile picture)
- `email` (optional, for email address)

### 3. Product Access

Make sure you have requested access to "Sign in with LinkedIn using OpenID Connect" product in the LinkedIn Developer Portal.

## OAuth Flow

1. **User clicks "Sign in with LinkedIn"**

   - Frontend calls `GET /api/linkedin/auth`
   - Backend generates authorization URL with state parameter
   - User is redirected to LinkedIn

2. **User authorizes on LinkedIn**

   - LinkedIn redirects to `GET /api/linkedin/callback` with authorization code
   - Backend exchanges code for access token and ID token
   - Backend validates ID token
   - Backend fetches user info from LinkedIn UserInfo endpoint

3. **Backend saves verification data**

   - Stores LinkedIn ID (sub), profile data, and verification status
   - Updates profile with verified LinkedIn URL
   - Redirects to frontend with success/error

4. **Frontend displays verification status**
   - Shows verified checkmark
   - Displays LinkedIn profile URL
   - Shows verification date

## Data Retrieved from LinkedIn

From the **ID Token**:

- `sub`: LinkedIn user identifier
- `iss`: Issuer (https://www.linkedin.com)
- `aud`: Client ID
- `iat`: Token issued time
- `exp`: Token expiration time

From the **UserInfo Endpoint**:

- `sub`: LinkedIn user identifier
- `name`: Full name
- `given_name`: First name
- `family_name`: Last name
- `picture`: Profile picture URL
- `locale`: User locale
- `email`: Primary email (optional)
- `email_verified`: Email verification status (optional)

## Security Notes

1. **State Parameter**: Currently encodes userId in state parameter. For production, consider using Redis or session storage for better security.

2. **ID Token Verification**: Currently does basic validation. For production, implement full JWT signature verification using LinkedIn's JWKS endpoint (`https://www.linkedin.com/oauth/openid/jwks`).

3. **Rate Limits**:
   - Member: 500 requests/day
   - Application: 100,000 requests/day

## Testing

1. Start your backend server
2. Ensure environment variables are set
3. Configure redirect URI in LinkedIn Developer Portal
4. Navigate to freelancer profile page
5. Click "Sign in with LinkedIn" button
6. Complete authorization on LinkedIn
7. Verify that LinkedIn account is marked as verified

## Troubleshooting

### "LinkedIn Client ID not configured"

- Ensure `LINKEDIN_CLIENT_ID` is set in `.env`

### "LinkedIn credentials not configured"

- Ensure both `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` are set

### "Invalid redirect_uri"

- Ensure the redirect URI in LinkedIn Developer Portal matches exactly: `http://localhost:2001/api/linkedin/callback`
- Check that `LINKEDIN_REDIRECT_URI` in `.env` matches

### "User session expired"

- The state parameter may have been corrupted or expired
- Try the authentication flow again

## Next Steps (Optional Enhancements)

1. Implement full JWT signature verification using JWKS
2. Use Redis/session storage for state->userId mapping
3. Add LinkedIn profile picture to user avatar
4. Auto-populate profile fields from LinkedIn data
5. Add LinkedIn verification badge to public profile view

