# Rock RMS - GHL Integration Setup Guide

## Overview
This integration connects GoHighLevel (GHL) with Rock RMS to automatically:
- Create/update contacts in Rock RMS
- Manage connection statuses
- Handle contact information syncing

## GHL Marketplace App Configuration
1. **Required Contact Fields:**
   - First Name
   - Last Name
   - Phone Number

2. **Optional Fields:**
   - Email
   - Gender
   - Campus (if multi-campus setup)
   
3. **Campus Handling:**
   - Single Campus: No campus field needed
   - Multi-Campus: Use dropdown or custom field
   - Default: Primary campus if none specified

4. **Workflow Setup:**
   - Trigger: When contact is created/updated
   - Action: Send to webhook
   - URL: https://connectai.click/api/webhook
   - Method: POST

5. **Field Mapping:**
   ```json
   {
     "contact": {
       "first_name": "{{contact.first_name}}",
       "last_name": "{{contact.last_name}}",
       "phone": "{{contact.phone}}",
       "email": "{{contact.email}}",
       "gender": "{{contact.gender}}",
       "campus": "{{contact.campus}}"
     }
   }
   ```

## Testing the Integration
1. First, run connection test:
```bash
node test-rock-connection.js
```

2. Run full integration test:
```bash
node test-integration.js
```

3. Verify in Rock RMS that:
- Person was created
- Campus ID is correct
- Marital status is correct
- Gender is correct

## Troubleshooting
Common issues:
1. Contact not appearing in Rock:
   - Check webhook logs
   - Verify required fields are filled
   - Ensure connection status ID is correct (1949)

2. Wrong status assigned:
   - Run status cleanup script
   - Verify workflow configuration

3. Campus Issues:
   - Check campus ID mapping
   - Verify campus exists in Rock RMS
   - Default to primary campus if needed

## Support
For technical support:
1. Check the logs in Hostinger
2. Contact system administrator 

# Church Integration Setup

## 1. Run Setup Wizard
```bash
node setup-wizard.js
```

## 2. Configure GHL
The wizard will show you:
- Your campus IDs
- Your marital status IDs
- Gender IDs (1=Male, 2=Female)

## 3. Test Integration
Create a test contact to verify everything works 

public_html/
  ├── package.json           # npm package file
  ├── .env                  # environment variables
  ├── setup-wizard.js       # setup script
  ├── rock-ghl-integration.js
  ├── test-integration.js
  └── test-webhook-data.js 