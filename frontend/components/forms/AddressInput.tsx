import React from 'react';

interface AddressInputProps {
    name: string;
    value: string;
    onChange: (name: string, value: string) => void;
    placeholder?: string;
    error?: string;
}

// NOTE: This is a basic implementation. A real-world version would
// integrate with an API like Google Places for autocomplete suggestions.
const AddressInput: React.FC<AddressInputProps> = ({ name, value, onChange, placeholder, error }) => {
    return (
        <input
            id={name}
            name={name}
            type="text"
            value={value}
            onChange={(e) => onChange(name, e.target.value)}
            placeholder={placeholder}
            className={`w-full px-3 py-2 bg-gray-800 border rounded-md text-white focus:outline-none focus:ring-2  ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-white'}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : undefined}
        />
    );
};

export default AddressInput;
