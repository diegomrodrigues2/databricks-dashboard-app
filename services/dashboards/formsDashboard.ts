import type { AppConfig } from '../../types';

export const formsDashboardConfig: AppConfig = {
    name: "forms_demo_dashboard",
    version: "1.0.0",
    datasources: [],
    dashboard: {
        title: "Forms Demo",
        widgets: [
            {
                id: 'user-profile-form',
                type: 'form',
                dataSource: '',
                title: 'User Profile',
                description: 'A demonstration of various form fields.',
                gridWidth: 12,
                gridHeight: 12,
                submitButtonText: 'Save Profile',
                fields: [
                    { name: 'fullName', label: 'Full Name (Single Line Text)', type: 'text', required: true, placeholder: 'John Doe', defaultValue: '' },
                    { name: 'bio', label: 'Biography (Multi-line Text)', type: 'textarea', rows: 4, placeholder: 'Tell us about yourself...', defaultValue: '' },
                    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'Enter a secure password', defaultValue: '' },
                    { name: 'accountType', label: 'Account Type (Radio Buttons)', type: 'radio', required: true, options: [{value: 'personal', label: 'Personal'}, {value: 'business', label: 'Business'}], defaultValue: 'personal'},
                    { name: 'interests', label: 'Interests (Checkboxes)', type: 'checkbox', options: [{value: 'sports', label: 'Sports'}, {value: 'music', label: 'Music'}, {value: 'tech', label: 'Technology'}], defaultValue: ['music']},
                    { name: 'country', label: 'Country (Dropdown)', type: 'select', required: true, options: [{value: 'us', label: 'United States'}, {value: 'ca', label: 'Canada'}, {value: 'mx', label: 'Mexico'}], defaultValue: 'us'},
                    { name: 'birthDate', label: 'Date of Birth (Date Picker)', type: 'date', required: true, defaultValue: '1990-01-01'},
                    { name: 'notificationVolume', label: 'Notification Volume (Slider)', type: 'slider', min: 0, max: 100, step: 1, defaultValue: 50 },
                    { name: 'profilePicture', label: 'Profile Picture (File Upload)', type: 'file', accept: 'image/*', description: 'Upload a PNG or JPG file.'},
                    { name: 'article', label: 'Your Article (Rich Text)', type: 'richtext', rows: 8, defaultValue: 'Start writing **your** story here...'},
                    { name: 'shippingAddress', label: 'Shipping Address (Address Autocomplete)', type: 'address', placeholder: 'Start typing your address...', defaultValue: ''}
                ]
            }
        ]
    }
};
