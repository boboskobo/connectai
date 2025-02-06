# GoHighLevel Marketplace App Setup Guide

## 1. App Configuration
Your app is already set up in the GHL Marketplace with:
- Webhook URL: https://connectai.click/api/webhook
- Integration with Rock RMS

## 2. Actions Available
1. **Add a New Person**
   - Required Fields:
     - First Name
     - Last Name
     - Phone Number
   - Optional Fields:
     - Email
     - Gender

2. **Update Existing Person**
   - Uses same fields as Add New Person
   - Updates based on matching phone/email

## 3. Field Mapping
Current mapping in the app:
```json
{
  "contact": {
    "first_name": "{{contact.first_name}}",
    "last_name": "{{contact.last_name}}",
    "phone": "{{contact.phone}}",
    "email": "{{contact.email}}",
    "gender": "{{contact.gender}}"
  }
}
```

## 4. Testing
1. Create a new contact in GHL
2. Contact should automatically:
   - Create/update in Rock RMS
   - Get assigned "Connect App Contact" status (ID: 1949)
   - Have all fields properly mapped

## Troubleshooting
If contact doesn't appear in Rock:
1. Check webhook logs in Hostinger
2. Verify contact has required fields
3. Check Rock RMS for any errors 