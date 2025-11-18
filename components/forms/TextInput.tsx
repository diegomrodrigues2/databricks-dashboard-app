import React from 'react';

interface TextInputProps {
    name: string;
    value: string;
    onChange: (name: string, value: string) => void;
    type?: 'text' | 'password';
    placeholder?: string;
    error?: string;
}

const TextInput: React.FC<TextInputProps> = ({ name, value, onChange, type = 'text', placeholder, error }) => {
    return (
        <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={(e) => onChange(name, e.target.value)}
            placeholder={placeholder}
            className={`w-full px-3 py-2 bg-gray-800 border rounded-md text-white focus:outline-none focus:ring-2  ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-white'}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : undefined}
        />
    );
};

export default TextInput;
