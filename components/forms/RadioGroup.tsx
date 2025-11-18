import React from 'react';
import type { FormFieldOption } from '../../types';

interface RadioGroupProps {
    name: string;
    value: string;
    onChange: (name: string, value: string) => void;
    options: FormFieldOption[];
    error?: string;
}

const RadioGroup: React.FC<RadioGroupProps> = ({ name, value, onChange, options, error }) => {
    return (
        <fieldset>
            <div className="space-y-2">
                {options.map(option => (
                    <div key={option.value} className="flex items-center">
                        <input
                            id={`${name}-${option.value}`}
                            name={name}
                            type="radio"
                            value={option.value}
                            checked={value === option.value}
                            onChange={(e) => onChange(name, e.target.value)}
                            className="h-4 w-4 text-white bg-gray-700 border-gray-600 focus:ring-white"
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

export default RadioGroup;
