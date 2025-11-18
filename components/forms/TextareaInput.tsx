import React from 'react';

interface TextareaInputProps {
    name: string;
    value: string;
    onChange: (name: string, value: string) => void;
    rows?: number;
    placeholder?: string;
    error?: string;
}

const TextareaInput: React.FC<TextareaInputProps> = ({ name, value, onChange, rows = 4, placeholder, error }) => {
    return (
        <textarea
            id={name}
            name={name}
            value={value}
            onChange={(e) => onChange(name, e.target.value)}
            rows={rows}
            placeholder={placeholder}
            className={`w-full px-3 py-2 bg-gray-800 border rounded-md text-white focus:outline-none focus:ring-2  ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-white'}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : undefined}
        />
    );
};

export default TextareaInput;
