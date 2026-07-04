/* eslint-disable @typescript-eslint/no-explicit-any */
import Select, { type StylesConfig, type GroupBase } from 'react-select';

export interface SelectOption {
    value: string;
    label: string;
}

interface CustomSelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    isSearchable?: boolean;
    isClearable?: boolean;
    isDisabled?: boolean;
    menuPlacement?: 'auto' | 'top' | 'bottom';
    className?: string;
}

const customStyles: StylesConfig<SelectOption, false, GroupBase<SelectOption>> = {
    control: (base, state) => ({
        ...base,
        // index.css ép mọi input min-height 44px → control phải 44px mới cao bằng các input khác
        minHeight: '44px',
        height: '44px',
        borderRadius: '0.5rem',
        border: state.isFocused ? '1px solid #60a5fa' : '1px solid #e5e7eb',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(191,219,254,0.6)' : 'none',
        backgroundColor: '#fff',
        fontSize: '0.875rem',
        cursor: 'pointer',
        boxSizing: 'border-box',
        alignItems: 'center',
        '&:hover': {
            borderColor: '#93c5fd',
        },
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    }),
    // KHÔNG override display — react-select dùng grid để chồng singleValue lên input ẩn
    valueContainer: (base) => ({
        ...base,
        padding: '0 12px',
    }),
    singleValue: (base) => ({
        ...base,
        color: '#1f2937',
        fontWeight: 500,
        margin: 0,
        lineHeight: '1.25rem',
    }),
    // Input ẩn của react-select: reset margin/padding để không bị CSS global đẩy lệch
    input: (base) => ({
        ...base,
        margin: 0,
        padding: 0,
        fontSize: '0.875rem',
        color: '#1f2937',
        lineHeight: '1.25rem',
    }),
    indicatorsContainer: (base) => ({
        ...base,
        height: '42px', // 44px - 2px border
        alignItems: 'center',
    }),
    placeholder: (base) => ({
        ...base,
        color: '#9ca3af',
        fontSize: '0.875rem',
        margin: 0,
        lineHeight: '1.25rem',
    }),
    indicatorSeparator: () => ({
        display: 'none',
    }),
    dropdownIndicator: (base, state) => ({
        ...base,
        color: state.isFocused ? '#3b82f6' : '#9ca3af',
        padding: '6px 8px',
        transition: 'color 0.15s ease, transform 0.2s ease',
        transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        '&:hover': {
            color: '#3b82f6',
        },
    }),
    clearIndicator: (base) => ({
        ...base,
        color: '#9ca3af',
        padding: '4px',
        '&:hover': {
            color: '#ef4444',
        },
    }),
    menuPortal: (base) => ({
        ...base,
        zIndex: 9999,
    }),
    menu: (base) => ({
        ...base,
        borderRadius: '0.75rem',
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        zIndex: 9999,
        marginTop: '4px',
        animation: 'selectFadeIn 0.15s ease-out',
    }),
    menuList: (base) => ({
        ...base,
        padding: '4px',
        maxHeight: '220px',
    }),
    option: (base, state) => ({
        ...base,
        borderRadius: '0.5rem',
        padding: '8px 12px',
        fontSize: '0.875rem',
        fontWeight: state.isSelected ? 600 : 400,
        cursor: 'pointer',
        backgroundColor: state.isSelected
            ? '#eff6ff'
            : state.isFocused
                ? '#f3f4f6'
                : 'transparent',
        color: state.isSelected ? '#1d4ed8' : '#374151',
        transition: 'background-color 0.1s ease',
        '&:active': {
            backgroundColor: state.isSelected ? '#dbeafe' : '#e5e7eb',
        },
    }),
    noOptionsMessage: (base) => ({
        ...base,
        fontSize: '0.8125rem',
        color: '#9ca3af',
    }),
};

const CustomSelect: React.FC<CustomSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Chọn...',
    isSearchable = false,
    isClearable = false,
    isDisabled = false,
    menuPlacement = 'auto',
    className = '',
}) => {
    const selectedOption = options.find(opt => opt.value === value) || null;

    return (
        <>
            <Select<SelectOption, false>
                options={options}
                value={selectedOption}
                onChange={(opt) => onChange(opt ? opt.value : '')}
                placeholder={placeholder}
                isSearchable={isSearchable}
                isClearable={isClearable}
                isDisabled={isDisabled}
                menuPlacement={menuPlacement}
                menuPortalTarget={document.body}
                styles={customStyles}
                className={className}
                noOptionsMessage={() => 'Không có kết quả'}
                classNamePrefix="cs"
            />
            <style>{`
                @keyframes selectFadeIn {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                /* index.css có rule global: input { min-height: 44px; font-size: 16px !important }
                   → input ẩn của react-select bị cao 44px làm lệch chữ khỏi tâm.
                   Override cứng theo classNamePrefix="cs" để vô hiệu hóa. */
                .cs__value-container input {
                    min-height: 0 !important;
                    height: auto !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    font-size: 0.875rem !important;
                    line-height: 1.25rem !important;
                }
                .cs__input-container {
                    margin: 0 !important;
                    padding: 0 !important;
                }
            `}</style>
        </>
    );
};

export default CustomSelect;
