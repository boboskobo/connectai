export const churchConfigs = {
    "flatirons": {
        campuses: {
            '1': 'Lafayette',
            '2': 'Longmont',
            '3': 'Denver',
            '4': 'Aurora',
            '5': 'West',
            '6': 'Online'
        },
        maritalStatus: {
            '1': { rockId: 143, hasChildren: false }, // Single
            '2': { rockId: 144, hasChildren: false }, // Married
            '3': { rockId: 143, hasChildren: true },  // Single w/ kids
            '4': { rockId: 144, hasChildren: true }   // Married w/ kids
        },
        gender: {
            '1': 1, // Male
            '2': 2  // Female
        },
        ageRanges: {
            '1': 'under 18',
            '2': '18-25',
            '3': '26-35',
            '4': '36-45',
            '5': '46-54',
            '6': '55 plus'
        }
    },
    // Add other churches with their specific mappings
    "otherChurch": {
        campuses: {
            // Their campus mapping
        },
        maritalStatus: {
            // Their status mapping
        }
        // etc...
    }
}; 