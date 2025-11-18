import React from 'react';
import type { FormFieldOption } from '../../types';

interface SelectInputProps {
    name: string;
    value: string;
    onChange: (name: string, value: string) => void;
    options: FormFieldOption[];
    error?: string;
}

const SelectInput: React.FC<SelectInputProps> = ({ name, value, onChange, options, error }) => {
    return (
        <select
            id={name}
            name={name}
            value={value}
            onChange={(e) => onChange(name, e.target.value)}
            className={`w-full px-3 py-2 bg-gray-800 border rounded-md text-white focus:outline-none focus:ring-2 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-white'}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : undefined}
        >
            {options.map(option => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
};

export default SelectInput;
