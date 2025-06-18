# Escrow Refund & Display Testing Guide

## Issue: Excess Budget Refund Not Working

### The Problem

When a freelancer is hired for less than the maximum budget, the excess amount should be refunded to the client and reflected in the frontend.

### Example Scenario

- Client wallet: $2,000
- Job max budget: $1,200
- Platform fee: 10%
- **Step 1**: Client posts job → Blocks $1,320 ($1,200 + $120 fee)
- **Step 2**: Freelancer hired at $1,000 → Should refund $220 excess
- **Step 3**: Client wallet should show $900 ($680 + $220 refund)

### Test the Calculation Logic

1. **Start your backend server**:

```bash
cd backend
npm start
```

2. **Test the refund calculation** (after logging in):

```bash
# Use your browser or Postman to POST to:
# http://localhost:2001/api/escrow/test/excess-refund

# Request Body:
{
  "maxBudget": 1200,
  "agreedAmount": 1000,
  "platformFeePercentage": 10
}
```

**Expected Response:**

```json
{
  "success": true,
  "scenario": "Excess Budget Refund Test",
  "data": {
    "step1_job_posting": {
      "maxBudget": 1200,
      "clientFee": 120,
      "totalBlocked": 1320,
      "description": "Amount blocked when client posts job"
    },
    "step2_freelancer_hired": {
      "agreedAmount": 1000,
      "clientFee": 100,
      "totalNeeded": 1100,
      "description": "Amount actually needed for agreed price"
    },
    "step3_refund": {
      "excessAmount": 220,
      "shouldRefund": true,
      "description": "Client should receive refund"
    }
  }
}
```

### Debug Real Escrow Creation

1. **Check current escrow data**:

   - Visit: `http://localhost:2001/api/escrow/debug`
   - Look for existing escrows and their amounts

2. **Create a test scenario**:

   - Post a job with max budget $1,200
   - Hire a freelancer for $1,000
   - Check if refund transaction is created

3. **Monitor backend logs** for:
   - `Original blocked: 1320, Current needed: 1100`
   - `Refund amount calculated: 220`

## Issue: Escrow Amount Not Showing in Frontend

### The Problem

The "In Escrow" amount near the "Add Funds" button in client payment page is not updating properly.

### Debug Steps

1. **Check API Response**:

```javascript
// In browser console on client payments page:
fetch("/api/escrow/client/data", {
  headers: {
    Authorization: "Bearer " + localStorage.getItem("token"),
  },
})
  .then((r) => r.json())
  .then((d) => {
    console.log("Client escrow data:", d);
    console.log("In escrow amount:", d.data.inEscrow);
  })
  .catch((e) => console.error("API Error:", e));
```

2. **Check backend logs** when visiting client payments page:

   - Look for: `Client {id}: Active escrows: X, In escrow: $Y, Total spent: $Z`
   - Each escrow should show: `Escrow {id}: X milestones, Y pending, unreleased: $Z`

3. **Verify data structure** at `/api/escrow/debug`:
   - Check if `escrows` array has data
   - Verify `milestones` have correct `amount` and `status` values

### Expected Frontend Display

The client payments page should show:

- **Available Balance**: Current wallet balance
- **In Escrow**: Total pending milestone amounts
- **Active Escrows section**: List of projects with pending/released breakdown

## Issue: Release and Pending Amounts Not Updating

### The Problem

Milestone release and pending amounts don't update properly for both client and freelancer dashboards.

### Debug Steps

1. **Check milestone structure** in database:

```javascript
// At /api/escrow/debug, look for:
{
  "milestones": [
    {
      "amount": 500,           // Client pays this
      "freelancerReceives": 450, // Freelancer gets this
      "platformFee": 100,      // Platform takes this
      "status": "pending",     // or "released"
      "releasedAt": null
    }
  ]
}
```

2. **Test milestone release**:

   - Complete a milestone in your app
   - Check if milestone `status` changes from "pending" to "released"
   - Verify `releasedAt` timestamp is set

3. **Check calculation logic**:
   - **For clients**: `inEscrow` = sum of `amount` where status = "pending"
   - **For freelancers**: `inEscrow` = sum of `freelancerReceives` where status = "pending"

### Common Issues & Fixes

#### Issue 1: No Escrow Data

**Symptoms**: All amounts show $0.00
**Solution**: Create test data by posting job and hiring freelancer

#### Issue 2: Milestone Status Not Updating

**Symptoms**: Amounts don't change after milestone completion
**Solution**: Check if `releaseMilestonePayment` function is being called

#### Issue 3: Wrong Field Calculations

**Symptoms**: Numbers are inconsistent
**Solution**: Verify using `amount` for client, `freelancerReceives` for freelancer

#### Issue 4: Frontend Not Refreshing

**Symptoms**: Backend logs show correct data, but frontend doesn't update
**Solution**: Check if API calls are being made and responses received

## Testing Checklist

- [ ] Test excess refund calculation with test endpoint
- [ ] Verify backend logs show correct amounts
- [ ] Check `/api/escrow/debug` shows proper data structure
- [ ] Test client payments page shows "In Escrow" amount
- [ ] Test freelancer payments page shows pending amounts
- [ ] Verify milestone completion updates amounts
- [ ] Check transaction history includes refund entries

## Expected Console Output

When working correctly, you should see:

```
Original blocked: 1320, Current needed: 1100
Refund amount calculated: 220
Client 123: Active escrows: 1, In escrow: $500, Total spent: $0
Escrow ESC-ABC123: 2 milestones, 2 pending, unreleased: 500
Freelancer 456: Active escrows: 1, In escrow: $450
Freelancer Escrow ESC-ABC123: 2 pending milestones, 0 released milestones
```

## If Still Not Working

Send me:

1. **Test endpoint response** from `/api/escrow/test/excess-refund`
2. **Debug endpoint data** from `/api/escrow/debug`
3. **Backend console logs** when visiting payments pages
4. **Frontend API response** from browser console
5. **Screenshots** of current vs expected display
