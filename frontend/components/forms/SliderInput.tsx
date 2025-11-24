import React from 'react';

interface SliderInputProps {
    name: string;
    value: number;
    onChange: (name: string, value: number) => void;
    min: number;
    max: number;
    step: number;
    error?: string;
}

const SliderInput: React.FC<SliderInputProps> = ({ name, value, onChange, min, max, step, error }) => {
    return (
        <div className="flex items-center gap-4">
            <input
                id={name}
                name={name}
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(name, e.target.valueAsNumber)}
                className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer`}
                aria-invalid={!!error}
                aria-describedby={error ? `${name}-error` : undefined}
            />
            <span className="text-lg font-mono text-white w-12 text-center bg-gray-800 py-1 rounded-md">{value}</span>
        </div>
    );
};

export default SliderInput;
