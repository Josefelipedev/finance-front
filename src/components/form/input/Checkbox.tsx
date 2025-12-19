import { forwardRef } from "react";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    checked?: boolean;
    className?: string;
    id?: string;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    (
        {
            label,
            checked,
            id,
            onChange,
            className = "",
            disabled = false,
            ...props
        },
        ref
    ) => {
        // Determinar o valor de checked (pode vir de props ou do register)
        const isChecked = checked !== undefined ? checked : props.value === "true" || props.value === true;

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (onChange) {
                onChange(e.target.checked);
            }
            // Se houver onChange nativo (do register), ele será chamado automaticamente
        };

        return (
            <label
                className={`flex items-center space-x-3 group cursor-pointer ${
                    disabled ? "cursor-not-allowed opacity-60" : ""
                }`}
            >
                <div className="relative w-5 h-5">
                    <input
                        id={id}
                        type="checkbox"
                        className={`w-5 h-5 appearance-none cursor-pointer dark:border-gray-700 border border-gray-300 checked:border-transparent rounded-md checked:bg-brand-500 disabled:opacity-60 
            ${className}`}
                        checked={isChecked}
                        onChange={handleChange}
                        disabled={disabled}
                        ref={ref}
                        {...props}
                    />
                    {isChecked && (
                        <svg
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none top-1/2 left-1/2"
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                        >
                            <path
                                d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                                stroke="white"
                                strokeWidth="1.94437"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    )}
                    {disabled && (
                        <svg
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none top-1/2 left-1/2"
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                        >
                            <path
                                d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                                stroke="#E4E7EC"
                                strokeWidth="2.33333"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    )}
                </div>
                {label && (
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {label}
          </span>
                )}
            </label>
        );
    }
);

Checkbox.displayName = "Checkbox";

export default Checkbox;