import inquirer from 'inquirer';
import RockApiClient from '../integrations/rock/api.js';
import churchConfig from '../services/church-config.js';
import { logError, logInfo } from '../utils/logger.js';

async function setupWizard() {
    try {
        // Initialize church config service
        await churchConfig.init();

        console.log('\n=== Church Integration Setup Wizard ===\n');

        // Get basic church information
        const churchInfo = await inquirer.prompt([
            {
                type: 'input',
                name: 'churchName',
                message: 'What is your church name?',
                validate: input => input.length > 0
            },
            {
                type: 'input',
                name: 'rockRmsUrl',
                message: 'Enter your Rock RMS API URL (e.g., https://rock.yourchurch.com/api):',
                validate: input => input.includes('http') && input.includes('/api')
            },
            {
                type: 'input',
                name: 'rockApiKey',
                message: 'Enter your Rock RMS API Key:',
                validate: input => input.length > 0
            }
        ]);

        // Test Rock RMS connection and get campuses
        console.log('\nTesting Rock RMS connection...');
        const rockApi = new RockApiClient(churchInfo.rockRmsUrl, churchInfo.rockApiKey);
        
        try {
            await rockApi.getDefinedType(1); // Test connection
            console.log('✓ Successfully connected to Rock RMS');
            
            // Fetch campuses
            const campuses = await rockApi.getCampuses();
            console.log(`\nFound ${campuses.length} campuses in Rock RMS`);
            
            if (campuses.length === 0) {
                throw new Error('No campuses found in Rock RMS. Please configure at least one campus.');
            }
        } catch (error) {
            console.error('✗ Failed to connect to Rock RMS or fetch campuses. Please verify your credentials and campus setup.');
            throw error;
        }

        // Get campus configuration
        const campusConfig = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'isMultiCampus',
                message: 'Does your church have multiple campuses?',
                default: campuses.length > 1
            }
        ]);

        let selectedCampuses = [];
        let defaultCampusId;

        if (campusConfig.isMultiCampus) {
            // Show all campuses and let them select which ones they use
            const campusChoices = campuses.map(campus => ({
                name: campus.Name,
                value: campus.Id
            }));

            const campusSelections = await inquirer.prompt([
                {
                    type: 'checkbox',
                    name: 'selectedCampuses',
                    message: 'Select the campuses you want to use:',
                    choices: campusChoices,
                    validate: input => input.length > 0 ? true : 'Please select at least one campus'
                },
                {
                    type: 'list',
                    name: 'defaultCampus',
                    message: 'Which campus should be used as the default?',
                    choices: (answers) => answers.selectedCampuses.map(id => ({
                        name: campuses.find(c => c.Id === id).Name,
                        value: id
                    }))
                }
            ]);

            selectedCampuses = campusSelections.selectedCampuses;
            defaultCampusId = campusSelections.defaultCampus;
        } else {
            // Single campus - use the first one or let them select if there are multiple
            if (campuses.length === 1) {
                defaultCampusId = campuses[0].Id;
                selectedCampuses = [defaultCampusId];
            } else {
                const campusSelection = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'campusId',
                        message: 'Select your campus:',
                        choices: campuses.map(campus => ({
                            name: campus.Name,
                            value: campus.Id
                        }))
                    }
                ]);
                defaultCampusId = campusSelection.campusId;
                selectedCampuses = [defaultCampusId];
            }
        }

        // If multi-campus, set up GHL location/tag mapping
        let campusMappings = {};
        if (campusConfig.isMultiCampus) {
            console.log('\nNow, let\'s map your GHL locations or tags to Rock campuses.');
            console.log('For each campus, enter the corresponding GHL location/tag name.');
            
            for (const campusId of selectedCampuses) {
                const campus = campuses.find(c => c.Id === campusId);
                const mapping = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'ghlLocation',
                        message: `Enter the GHL location/tag for ${campus.Name}:`,
                        validate: input => input.length > 0
                    }
                ]);
                campusMappings[mapping.ghlLocation] = campusId;
            }
        }

        // Get custom field mappings
        const customFields = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'hasCustomFields',
                message: 'Do you want to configure custom field mappings?',
                default: false
            }
        ]);

        // Create configuration object
        const config = {
            ...churchInfo,
            defaultCampusId,
            isMultiCampus: campusConfig.isMultiCampus,
            campuses: selectedCampuses,
            connectionStatusId: 1949,
            fieldMappings: {
                firstName: 'firstName',
                lastName: 'lastName',
                email: 'email',
                phone: 'phone',
                gender: 'gender',
                campus: 'location' // Using GHL's location field for campus
            },
            customMappings: {
                campus: campusMappings
            }
        };

        if (customFields.hasCustomFields) {
            console.log('\nCustom field mapping will be configured in the admin interface.');
        }

        // Generate a unique church ID (you might want to use a more sophisticated method)
        const churchId = Buffer.from(churchInfo.churchName)
            .toString('base64')
            .replace(/[^a-zA-Z0-9]/g, '')
            .toLowerCase();

        // Save configuration
        await churchConfig.saveConfig(churchId, config);

        console.log('\n=== Setup Complete ===');
        console.log('Your church ID:', churchId);
        console.log('\nNext steps:');
        console.log('1. Configure your GHL webhook URL:');
        console.log(`   https://your-domain.com/webhook/ghl?churchId=${churchId}`);
        console.log('2. Add the following to your GHL webhook configuration:');
        console.log('   - Contact Created');
        console.log('   - Contact Updated');
        console.log('3. Test the integration by creating a contact in GHL');

        await logInfo('Church setup completed', { churchId, churchName: churchInfo.churchName });

    } catch (error) {
        await logError('Setup failed', error);
        console.error('\nSetup failed:', error.message);
        process.exit(1);
    }
}

// Run the wizard
setupWizard(); 