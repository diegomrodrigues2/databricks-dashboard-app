import React from 'react';

interface FormFieldWrapperProps {
    children: React.ReactNode;
    label: string;
    name: string;
    description?: string;
    error?: string;
    required?: boolean;
    isFieldset?: boolean;
}

const FormFieldWrapper: React.FC<FormFieldWrapperProps> = ({ children, label, name, description, error, required, isFieldset = false }) => {
    
    const LabelComponent = isFieldset ? 'legend' : 'label';

    const labelClasses = "block text-gray-300 text-sm font-bold mb-2";

    return (
        <div>
            <LabelComponent htmlFor={isFieldset ? undefined : name} className={labelClasses}>
                {label} {required && <span className="text-red-500">*</span>}
            </LabelComponent>
            {description && <p className="text-gray-500 text-xs italic mb-2">{description}</p>}
            {children}
            {error && <p className="text-red-500 text-xs italic mt-2" id={`${name}-error`}>{error}</p>}
        </div>
    );
};

export default FormFieldWrapper;
