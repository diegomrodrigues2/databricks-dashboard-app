import React, { useState, useCallback } from 'react';
import type { FormWidgetConfig, FormFieldConfig } from '../../types';

// Import all the new form field components
import FormFieldWrapper from '../forms/FormFieldWrapper';
import TextInput from '../forms/TextInput';
import TextareaInput from '../forms/TextareaInput';
import RadioGroup from '../forms/RadioGroup';
import CheckboxGroup from '../forms/CheckboxGroup';
import SelectInput from '../forms/SelectInput';
import DateInput from '../forms/DateInput';
import SliderInput from '../forms/SliderInput';
import FileInput from '../forms/FileInput';
import RichTextInput from '../forms/RichTextInput';
import AddressInput from '../forms/AddressInput';


interface FormComponentProps {
  config: FormWidgetConfig;
}

const FormComponent: React.FC<FormComponentProps> = ({ config }) => {
    
    const initialFormState = config.fields.reduce((acc, field) => {
        if (field.type === 'checkbox') {
            acc[field.name] = Array.isArray(field.defaultValue) ? field.defaultValue : [];
        } else {
            acc[field.name] = field.defaultValue ?? '';
        }
        return acc;
    }, {} as { [key: string]: any });

    const [formState, setFormState] = useState(initialFormState);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const handleChange = useCallback((name: string, value: any) => {
        setFormState(prevState => ({
            ...prevState,
            [name]: value,
        }));
        if (errors[name]) {
            setErrors(prevErrors => {
                const newErrors = {...prevErrors};
                delete newErrors[name];
                return newErrors;
            });
        }
    }, [errors]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: { [key: string]: string } = {};
        config.fields.forEach(field => {
            if (field.required && !formState[field.name]) {
                newErrors[field.name] = `${field.label} is required.`;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        console.log('Form Submitted:', formState);
        alert('Form submitted successfully! Check the console for the data.');
        setErrors({});
    };

    const renderField = (field: FormFieldConfig) => {
        const commonProps = {
            name: field.name,
            value: formState[field.name],
            onChange: handleChange,
            error: errors[field.name],
        };

        switch (field.type) {
            case 'text':
            case 'password':
                return <TextInput {...commonProps} type={field.type} placeholder={field.placeholder} />;
            case 'textarea':
                return <TextareaInput {...commonProps} rows={field.rows} placeholder={field.placeholder} />;
            case 'radio':
                return <RadioGroup {...commonProps} options={field.options} />;
            case 'checkbox':
                 return <CheckboxGroup {...commonProps} options={field.options} />;
            case 'select':
                return <SelectInput {...commonProps} options={field.options} />;
            case 'date':
                return <DateInput {...commonProps} />;
            case 'slider':
                return <SliderInput {...commonProps} min={field.min} max={field.max} step={field.step} />;
            case 'file':
                return <FileInput {...commonProps} accept={field.accept} />;
            case 'richtext':
                return <RichTextInput {...commonProps} rows={field.rows} />;
            case 'address':
                return <AddressInput {...commonProps} placeholder={field.placeholder} />;
            default:
                return null;
        }
    };
    
    const gridClasses = `col-span-12 md:col-span-${config.gridWidth || 12} row-span-${config.gridHeight || 12}`;
    
    return (
        <div className={`${gridClasses} p-6 bg-gray-900 border border-gray-700 rounded-lg flex flex-col relative`}>
             <div>
                <h4 className="text-xl font-semibold text-white pr-8">{config.title}</h4>
                <p className="text-md text-gray-400 mb-6">{config.description}</p>
            </div>
            <form onSubmit={handleSubmit} className="flex-grow min-h-0 overflow-y-auto pr-4 space-y-6">
                {config.fields.map(field => (
                    <FormFieldWrapper key={field.name} label={field.label} name={field.name} description={field.description} error={errors[field.name]} required={field.required}>
                         {renderField(field)}
                    </FormFieldWrapper>
                ))}
                 <div className="pt-4">
                    <button type="submit" className="w-full md:w-auto px-6 py-3 bg-white hover:bg-gray-200 text-black font-bold rounded-md focus:outline-none focus:shadow-outline transition-colors">
                        {config.submitButtonText || 'Submit'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FormComponent;