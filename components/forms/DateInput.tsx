import React from 'react';

interface DateInputProps {
    name: string;
    value: string;
    onChange: (name: string, value: string) => void;
    error?: string;
}

const DateInput: React.FC<DateInputProps> = ({ name, value, onChange, error }) => {
    return (
        <input
            id={name}
            name={name}
            type="date"
            value={value}
            onChange={(e) => onChange(name, e.target.value)}
            className={`w-full px-3 py-2 bg-gray-800 border rounded-md text-white focus:outline-none focus:ring-2 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-white'}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : undefined}
        />
    );
};

export default DateInput;
