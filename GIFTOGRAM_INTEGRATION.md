# Giftogram Gift Card Integration

## Overview

The Giftogram integration allows freelancers to withdraw their earnings as gift cards from various brands and retailers. This provides an additional withdrawal option alongside traditional payment methods.

## Features

- **Gift Card Campaigns**: Browse available gift card options from different brands
- **Withdrawal Processing**: Convert available balance to gift cards
- **Transaction Tracking**: Monitor gift card withdrawal history
- **Email Delivery**: Gift cards are sent directly to specified recipients
- **Real-time Status**: Track gift card order status and delivery

## Architecture

### Backend Components

1. **Giftogram Service** (`backend/src/services/giftogramService.js`)

   - Handles API communication with Giftogram
   - Manages campaign retrieval and order creation
   - Provides validation utilities

2. **Payment Controller Extensions** (`backend/src/controllers/paymentController.js`)

   - `getGiftCardCampaigns`: Fetch available gift card options
   - `withdrawAsGiftCard`: Process gift card withdrawals
   - `getGiftCardWithdrawals`: Retrieve withdrawal history
   - `checkGiftCardOrderStatus`: Monitor order status

3. **Route Configuration** (`backend/src/routes/paymentRoutes.js`)
   - Protected routes for freelancer-only access
   - Input validation and authentication middleware

### Frontend Components

1. **Gift Card Service** (`frontend/src/services/giftCardService.js`)

   - API client for Giftogram endpoints
   - Error handling and response formatting

2. **Gift Card Withdrawal Modal** (`frontend/src/components/payments/GiftCardWithdrawModal.jsx`)

   - Form interface for gift card withdrawals
   - Campaign selection and validation
   - Real-time balance checking

3. **Payment Page Integration** (`frontend/src/pages/freelancer/PaymentsPage.jsx`)
   - Gift card withdrawal button
   - Transaction history display
   - Balance management

## API Endpoints

### Get Gift Card Campaigns

```
GET /api/payments/gift-cards/campaigns
```

- **Access**: Freelancers only
- **Response**: List of available gift card campaigns

### Process Gift Card Withdrawal

```
POST /api/payments/gift-cards/withdraw
```

- **Access**: Freelancers only
- **Body**:
  ```json
  {
    "campaignId": "string",
    "amount": number,
    "recipientEmail": "string",
    "recipientName": "string",
    "message": "string (optional)"
  }
  ```

### Get Withdrawal History

```
GET /api/payments/gift-cards/history?page=1&limit=10
```

- **Access**: Freelancers only
- **Response**: Paginated gift card withdrawal history

### Check Order Status

```
GET /api/payments/gift-cards/order/:orderId/status
```

- **Access**: Freelancers only
- **Response**: Current gift card order status

## Configuration

### Environment Variables

Add the following to your `.env` file:

```env
# Giftogram API Configuration
GIFTOGRAM_API_URL=https://api.giftogram.com/v1
GIFTOGRAM_API_KEY=your_giftogram_api_key
GIFTOGRAM_API_SECRET=your_giftogram_api_secret
GIFTOGRAM_ENVIRONMENT=sandbox
```

### Database Changes

Gift card withdrawals are stored as regular transactions with:

- **Type**: `gift_card_withdrawal`
- **Metadata**: Contains Giftogram order ID and recipient details
- **Amount**: Negative value (withdrawal from balance)

## Security Considerations

1. **Access Control**: Only freelancers can access gift card endpoints
2. **Balance Validation**: Prevents withdrawals exceeding available balance
3. **Input Sanitization**: All user inputs are validated and sanitized
4. **API Authentication**: Secure communication with Giftogram API
5. **Transaction Atomicity**: Database transactions ensure data consistency

## Error Handling

- **API Failures**: Graceful handling of Giftogram API errors
- **Insufficient Balance**: Clear error messages for balance issues
- **Network Issues**: Retry mechanisms and timeout handling
- **Validation Errors**: User-friendly form validation feedback

## User Experience

### Freelancer Workflow

1. **Access Payment Dashboard**: Navigate to freelancer payments page
2. **Check Available Balance**: View current withdrawable amount
3. **Select Gift Card Option**: Click "🎁 Gift Card" button
4. **Choose Campaign**: Select from available gift card brands
5. **Enter Details**: Specify amount, recipient email/name, and optional message
6. **Confirm Withdrawal**: Process the gift card order
7. **Track Status**: Monitor order status and delivery

### UI Features

- **Real-time Balance Display**: Shows available withdrawal amount
- **Campaign Selection**: Dropdown with available gift card options
- **Form Validation**: Client and server-side validation
- **Loading States**: Visual feedback during processing
- **Success Notifications**: Confirmation of successful withdrawals
- **Transaction History**: Display gift card withdrawals with special styling

## Testing

### Test Scenarios

1. **Campaign Retrieval**: Verify gift card options load correctly
2. **Successful Withdrawal**: Process valid gift card orders
3. **Insufficient Balance**: Handle low balance scenarios
4. **Invalid Recipients**: Test email validation
5. **API Errors**: Simulate Giftogram API failures
6. **Network Issues**: Test timeout and retry behavior

### Test Data

For testing, use Giftogram's sandbox environment with test campaigns and orders.

## Monitoring and Analytics

- **Transaction Logs**: All gift card withdrawals are logged
- **Success Rates**: Monitor successful vs failed withdrawals
- **Popular Campaigns**: Track most requested gift card types
- **Error Rates**: Monitor API failures and user errors

## Maintenance

### Regular Tasks

1. **API Key Rotation**: Update Giftogram credentials periodically
2. **Campaign Updates**: Refresh available gift card options
3. **Status Monitoring**: Check order delivery status
4. **Performance Review**: Monitor response times and success rates

### Troubleshooting

- **Failed Orders**: Check Giftogram API status and order details
- **Missing Gift Cards**: Verify email delivery and spam folders
- **Balance Discrepancies**: Audit transaction history and wallet balance
- **API Errors**: Review logs and contact Giftogram support if needed

## Future Enhancements

- **Bulk Withdrawals**: Process multiple gift cards at once
- **Scheduled Deliveries**: Allow future delivery dates
- **Gift Card Templates**: Custom message templates
- **Recipient Management**: Save frequent recipient details
- **Campaign Filters**: Filter by brand, amount, or category
- **Mobile Optimization**: Enhanced mobile experience

## Support

For integration issues:

1. Check API documentation: [Giftogram API Docs](https://developers.giftogram.com)
2. Review error logs and transaction history
3. Contact Giftogram support for API-specific issues
4. Check system health and network connectivity
