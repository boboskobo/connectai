import inquirer from 'inquirer';
import fs from 'fs/promises';

async function setupChurchMappings() {
    const config = {
        rockRmsUrl: '',
        rockApiKey: '',
        fieldMappings: {
            // Rock RMS field : GHL field
            FirstName: 'first_name',
            LastName: 'last_name',
            Email: 'email',
            Gender: 'gender',
            MaritalStatusValueId: 'marital_status',
            CampusId: 'campus',
            AgeRange: 'age_range'
        },
        valueMappings: {
            gender: {
                'Male': 1,
                'Female': 2
            },
            maritalStatus: {
                'Single': 143,
                'Married': 144,
                // They can add more...
            },
            campus: {
                // Their campus IDs
            }
        }
    };

    // Ask for Rock RMS details
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'rockRmsUrl',
            message: 'Enter your Rock RMS API URL:'
        },
        {
            type: 'input',
            name: 'rockApiKey',
            message: 'Enter your Rock RMS API Key:'
        }
    ]);

    config.rockRmsUrl = answers.rockRmsUrl;
    config.rockApiKey = answers.rockApiKey;

    // Save configuration
    await fs.writeFile('church-config.json', JSON.stringify(config, null, 2));
    console.log('Configuration saved!');
}

setupChurchMappings(); 