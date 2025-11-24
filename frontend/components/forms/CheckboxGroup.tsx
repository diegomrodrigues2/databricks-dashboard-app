import React from 'react';
import type { FormFieldOption } from '../../types';

interface CheckboxGroupProps {
    name: string;
    value: string[];
    onChange: (name: string, value: string[]) => void;
    options: FormFieldOption[];
    error?: string;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ name, value = [], onChange, options, error }) => {
    
    const handleChange = (optionValue: string) => {
        const newValue = value.includes(optionValue)
            ? value.filter(v => v !== optionValue)
            : [...value, optionValue];
        onChange(name, newValue);
    };

    return (
        <fieldset>
            <div className="space-y-2">
                {options.map(option => (
                    <div key={option.value} className="flex items-center">
                        <input
                            id={`${name}-${option.value}`}
                            name={`${name}-${option.value}`}
                            type="checkbox"
                            value={option.value}
                            checked={value.includes(option.value)}
                            onChange={() => handleChange(option.value)}
                            className="h-4 w-4 text-white bg-gray-700 border-gray-600 rounded focus:ring-white"
                             aria-invalid={!!error}
                             aria-describedby={error ? `${name}-error` : undefined}
                        />
                        <label htmlFor={`${name}-${option.value}`} className="ml-3 block text-sm font-medium text-gray-300">
                            {option.label}
                        </label>
                    </div>
                ))}
            </div>
        </fieldset>
    );
};

export default CheckboxGroup;
