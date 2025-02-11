# Church Integration Setup Guide

## 1. Run Setup Script
```bash
node setup-church-mappings.js
```

## 2. Configure Field Mappings
Edit `church-config.json`:
1. Map GHL fields to Rock RMS fields
2. Add value mappings for:
   - Gender
   - Marital Status
   - Campus IDs
   - Age Ranges

## 3. Test Integration
```bash
node test-integration.js
``` 