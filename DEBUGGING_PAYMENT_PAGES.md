# Debugging Payment Pages - Step by Step Guide

## The Problem
The freelancer and client payment pages are still showing static/mock data instead of real API data.

## What I've Fixed
✅ **Backend Changes:**
- Updated `escrowController.js` with `getFreelancerEscrowData()` and `getClientEscrowData()` functions
- Added routes `/api/escrow/freelancer/data` and `/api/escrow/client/data` in `escrowRoutes.js`
- All models (Payment, Escrow, Transaction) have the required fields

✅ **Frontend Changes:**
- Updated `frontend/src/pages/freelancer/PaymentsPage.jsx` to use real API data
- Updated `frontend/src/pages/client/PaymentsPage.jsx` to use real API data  
- Updated `frontend/src/services/escrowService.js` with new API methods
- Added proper error handling and loading states

## Step-by-Step Debugging

### Step 1: Verify Backend Server is Running
```bash
cd backend
npm start
```
**Expected:** Server should start on port 2001 without errors.

### Step 2: Test API Endpoints
```bash
# From the root directory
node test-api-endpoints.js
```
**Expected:** Should show if server is running and if routes are accessible.

### Step 3: Check Browser Console for Errors
1. Open your app in browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Navigate to freelancer or client payments page
5. Look for any JavaScript errors or failed network requests

### Step 4: Check Network Tab for API Calls
1. In Developer Tools, go to Network tab
2. Navigate to payments page
3. Look for calls to `/api/escrow/freelancer/data` or `/api/escrow/client/data`
4. Check if they return 200 OK or have errors

### Step 5: Verify Authentication
The API endpoints require authentication. Make sure:
1. You're logged in as a freelancer or client
2. The JWT token is being sent with requests
3. Check Local Storage in dev tools for the auth token

### Step 6: Clear Browser Cache
Sometimes cached JavaScript can cause issues:
1. Hard refresh: Ctrl+Shift+R (Chrome) or Ctrl+F5
2. Or clear browser cache completely
3. Restart the frontend dev server

### Step 7: Restart Frontend Dev Server
```bash
cd frontend
npm run dev
```

## Common Issues and Solutions

### Issue 1: "Failed to load payment data" Toast Message
**Cause:** API endpoint is not reachable or returns an error
**Solution:** 
- Check backend server is running
- Check console for network errors
- Verify the API endpoint paths are correct

### Issue 2: 401 Unauthorized Errors
**Cause:** User is not authenticated or token is invalid
**Solution:**
- Login again
- Check if token exists in localStorage
- Verify token is being sent in request headers

### Issue 3: 404 Not Found Errors  
**Cause:** API routes are not properly registered
**Solution:**
- Verify `escrowRoutes.js` is imported in `app.js`
- Check the route paths match what the frontend is calling

### Issue 4: 500 Server Errors
**Cause:** Backend code errors (missing models, database issues, etc.)
**Solution:**
- Check backend console for error logs
- Verify MongoDB is running
- Check if all required models are imported correctly

### Issue 5: Still Seeing Old Mock Data
**Cause:** 
- Browser cache showing old JavaScript
- Frontend dev server not reflecting changes
- Wrong file being loaded

**Solution:**
- Hard refresh browser
- Restart frontend dev server
- Check file timestamps to ensure latest code is being used

## Quick Test Commands

### Test if MongoDB is accessible:
```bash
cd backend
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studieshq')
  .then(() => { console.log('✅ MongoDB connected'); process.exit(0); })
  .catch(err => { console.log('❌ MongoDB error:', err.message); process.exit(1); });
"
```

### Test if all required modules load:
```bash
cd backend
node -c src/controllers/escrowController.js && echo "✅ Escrow controller syntax OK"
node -c src/routes/escrowRoutes.js && echo "✅ Escrow routes syntax OK"  
```

### Check if frontend service compiles:
```bash
cd frontend
npx tsc --noEmit src/services/escrowService.js 2>/dev/null && echo "✅ Escrow service OK" || echo "⚠️ Check escrow service"
```

## What Should Happen When Working

1. **On Page Load:** You should see a loading spinner briefly
2. **API Call:** Network tab shows call to `/api/escrow/freelancer/data` or `/api/escrow/client/data`
3. **Data Display:** Cards show real numbers (may be 0 if no transactions yet)
4. **Error Handling:** If API fails, shows "Failed to load payment data" toast and default values

## If Still Not Working

If after following all steps above the issue persists:

1. **Send me the output of the test script:** `node test-api-endpoints.js`
2. **Send browser console errors:** Any red errors in the console
3. **Send network tab info:** Status codes of the API calls
4. **Backend logs:** Any errors shown in the backend console

This will help me identify the exact issue and provide a targeted fix. 