# GoHighLevel App Setup Guide

## 1. Initial Form Setup
- Create a new form in GHL
- Add these fields:
  - First Name (required)
  - Last Name (required)
  - Phone Number (required)
  - Email (optional)
  - Gender (optional dropdown: Male/Female)

## 2. Workflow Configuration
1. Go to Workflows in GHL
2. Create new workflow:
   - Trigger: "When form is submitted"
   - Action: "Send to webhook"
   - URL: https://connectai.click/api/webhook
   - Method: POST

## 3. Field Mapping
Map these fields in the webhook:
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
1. Fill out test form
2. Check Rock RMS for new contact
3. Verify "Connect App Contact" status 