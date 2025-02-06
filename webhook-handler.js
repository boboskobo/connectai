import RockGHLIntegration from './rock-ghl-integration.js';

export async function handleWebhook(req, res) {
    try {
        const contactData = {
            firstName: req.body.contact.first_name,
            lastName: req.body.contact.last_name,
            phone: req.body.contact.phone,
            email: req.body.contact.email,
            gender: req.body.contact.gender,
            campus: req.body.contact.campus
        };

        const integration = new RockGHLIntegration();
        const result = await integration.handleContact(contactData);
        
        res.json({ success: true, personId: result });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
} 