# Twilio OTP Verification Setup Guide

This guide will help you set up Twilio OTP (One-Time Password) verification for mobile phone numbers in the StudiesHQ platform.

## Prerequisites

1. A Twilio account ([Sign up here](https://www.twilio.com/try-twilio))
2. Twilio Phone Number or Verify Service
3. Access to the project's environment variables

## Twilio Setup

### Step 1: Create a Twilio Account

1. Go to [Twilio Console](https://console.twilio.com/)
2. Sign up for a new account or log in to existing one
3. Complete the verification process

### Step 2: Get Account Credentials

1. In the Twilio Console, go to **Account > API keys & tokens**
2. Find your **Account SID** and **Auth Token**
3. Keep these secure - you'll need them for environment variables

### Step 3: Create a Verify Service

1. In the Twilio Console, navigate to **Verify > Services**
2. Click **Create new Service**
3. Enter a service name (e.g., "StudiesHQ Phone Verification")
4. Configure the settings:
   - **Code Length**: 6 digits (recommended)
   - **Code Expiry**: 10 minutes (recommended)
   - **Max Check Attempts**: 5 (recommended)
5. Save the service and note the **Service SID**

## Environment Configuration

### Backend Environment Variables

Add the following variables to your `backend/.env` file:

```env
# Twilio Configuration for OTP
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_VERIFY_SERVICE_SID=your_twilio_verify_service_sid_here
```

Replace the placeholder values with your actual Twilio credentials:

- `TWILIO_ACCOUNT_SID`: Your Account SID from Twilio Console
- `TWILIO_AUTH_TOKEN`: Your Auth Token from Twilio Console
- `TWILIO_VERIFY_SERVICE_SID`: The Service SID from your Verify Service

## Features Implemented

### Backend Features

1. **OTP Service** (`backend/src/services/otpService.js`)

   - Send OTP via SMS using Twilio Verify API
   - Verify OTP codes
   - Phone number formatting utilities

2. **OTP Controller** (`backend/src/controllers/otpController.js`)

   - `POST /api/otp/send-verification` - Send OTP to phone number
   - `POST /api/otp/verify` - Verify OTP code
   - `GET /api/otp/verification-status` - Get phone verification status

3. **Enhanced Profile Model**
   - Added phone verification fields to Profile schema
   - `phone.isVerified` - Boolean indicating verification status
   - `phone.verifiedAt` - Timestamp of verification

### Frontend Features

1. **OTP Verification Component** (`frontend/src/components/OTPVerification.jsx`)

   - Modal-based OTP input interface
   - Auto-send OTP when modal opens
   - Resend functionality with cooldown timer
   - Real-time validation and error handling

2. **Enhanced Profile Pages**
   - Phone verification status display
   - "Verify Phone" button for unverified numbers
   - Visual indicators (verified/not verified)
   - Integration with OTP verification modal

## API Endpoints

### Send OTP Verification

```http
POST /api/otp/send-verification
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "countryCode": "+1",
  "phoneNumber": "1234567890"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP sent successfully to your phone number",
  "data": {
    "phoneNumber": "+11234567890",
    "status": "pending"
  }
}
```

### Verify OTP

```http
POST /api/otp/verify
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "countryCode": "+1",
  "phoneNumber": "1234567890",
  "otpCode": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Phone number verified successfully",
  "data": {
    "phoneNumber": "+11234567890",
    "verifiedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### Get Verification Status

```http
GET /api/otp/verification-status
Authorization: Bearer <jwt_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "phone": {
      "countryCode": "+1",
      "number": "1234567890",
      "isVerified": true,
      "verifiedAt": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

## Usage Flow

1. **User enters phone number** in profile settings
2. **User clicks "Verify Phone"** button
3. **System sends OTP** via Twilio SMS
4. **User enters OTP** in the modal
5. **System verifies OTP** with Twilio
6. **Phone number marked as verified** in database
7. **UI updates** to show verification status

## Security Features

1. **Phone number uniqueness** - Prevents same number being verified by multiple users
2. **Rate limiting** - Built-in Twilio rate limiting for SMS
3. **Expiring codes** - OTP codes expire after 10 minutes
4. **Attempt limits** - Maximum 5 verification attempts per phone number
5. **Authenticated endpoints** - All OTP endpoints require JWT authentication

## Error Handling

The system handles various error scenarios:

- Invalid phone number format
- Phone number already verified by another user
- Invalid or expired OTP codes
- Twilio service errors
- Network connectivity issues

## Testing

### Test Phone Numbers (Development)

Twilio provides test phone numbers for development:

- `+15005550006` - Valid phone number (sends SMS)
- `+15005550001` - Invalid phone number
- `+15005550008` - Unroutable phone number

### Test OTP Codes

For Twilio test credentials, any 6-digit code will work for verification.

## Troubleshooting

### Common Issues

1. **"Invalid phone number format"**

   - Ensure phone number is in correct format
   - Include country code without spaces or special characters

2. **"Failed to send OTP"**

   - Check Twilio credentials in environment variables
   - Verify Twilio account has sufficient balance
   - Ensure phone number can receive SMS

3. **"Invalid or expired OTP code"**
   - OTP codes expire after 10 minutes
   - Ensure correct code is entered
   - Maximum 5 attempts allowed per phone number

### Debugging

1. Check backend logs for Twilio API responses
2. Verify environment variables are loaded correctly
3. Test with Twilio test phone numbers first
4. Check Twilio Console for delivery logs

## Production Considerations

1. **Phone Number Verification**: Implement additional validation for business requirements
2. **Rate Limiting**: Consider implementing additional rate limiting on your API
3. **Cost Management**: Monitor Twilio usage and costs
4. **International Numbers**: Test with international phone numbers
5. **Backup**: Consider backup SMS providers for reliability

## Support

For issues related to:

- **Twilio Integration**: Check [Twilio Documentation](https://www.twilio.com/docs/verify/api)
- **StudiesHQ Platform**: Contact the development team

## Dependencies

### Backend

- `twilio`: Twilio SDK for Node.js
- `express-validator`: Request validation
- `mongoose`: MongoDB integration

### Frontend

- `react-toastify`: Toast notifications
- `axios`: HTTP client for API calls

---

**Note**: Remember to never commit your Twilio credentials to version control. Always use environment variables for sensitive configuration.
