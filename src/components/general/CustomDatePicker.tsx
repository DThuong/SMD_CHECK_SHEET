import React from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale/vi';
import { enUS } from 'date-fns/locale/en-US';
import { ko } from 'date-fns/locale/ko';
import 'react-datepicker/dist/react-datepicker.css';
import { useTranslation } from 'react-i18next';
import { FaCalendarAlt } from 'react-icons/fa';

registerLocale('vi', vi);
registerLocale('en', enUS);
registerLocale('ko', ko);

interface CustomDatePickerProps {
    value: string;
    onChange: (dateStr: string) => void;
    placeholder?: string;
    className?: string;
    showTimeSelect?: boolean;
    dateFormat?: string;
    isClearable?: boolean;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
    value,
    onChange,
    placeholder = 'Chọn thời gian...',
    className = '',
    showTimeSelect = true,
    dateFormat = "dd/MM/yyyy HH:mm",
    isClearable = true
}) => {
    const { i18n } = useTranslation();
    
    // Parse value string to Date object
    const selectedDate = value ? new Date(value) : null;
    
    // Determine locale based on i18n language
    const currentLang = i18n.language || 'vi';
    const localeMapping: Record<string, string> = {
        'vn': 'vi',
        'vi': 'vi',
        'en': 'en',
        'us': 'en',
        'kr': 'ko',
        'ko': 'ko'
    };
    const mappedLocale = localeMapping[currentLang.toLowerCase()] || 'vi';

    const handleChange = (date: Date | null) => {
        if (!date) {
            onChange('');
            return;
        }
        
        // Format to local ISO string (YYYY-MM-DDTHH:mm) suitable for input type="datetime-local" and backend
        const offset = date.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
        onChange(localISOTime);
    };

    const datePickerRef = React.useRef<DatePicker>(null);
    const allowScrollCloseRef = React.useRef(true);

    return (
        <div className="relative w-full">
            <DatePicker
                ref={datePickerRef}
                selected={selectedDate}
                onCalendarOpen={() => {
                    allowScrollCloseRef.current = false;
                    setTimeout(() => {
                        allowScrollCloseRef.current = true;
                    }, 500);
                }}
                onChange={handleChange}
                customInput={<input inputMode="none" />}
                showTimeSelect={showTimeSelect}
                timeFormat="HH:mm"
                timeIntervals={1}
                dateFormat={dateFormat}
                locale={mappedLocale}
                placeholderText={placeholder}
                isClearable={isClearable}
                portalId="datepicker-portal"
                closeOnScroll={(e: Event) => {
                    if (!allowScrollCloseRef.current) return false;
                    const target = e.target as HTMLElement;
                    if (target && target.closest && target.closest('.react-datepicker')) {
                        return false;
                    }
                    return true;
                }}
                className={`w-full h-[40px] pl-9 pr-8 border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white transition-all shadow-sm hover:border-blue-300 ${className}`}
                wrapperClassName="w-full"
                calendarClassName="shadow-xl border-gray-200 rounded-xl overflow-hidden font-sans text-sm"
            />
            <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            
            <style>{`
                /* Popup định vị absolute trong cột filter hẹp sẽ bị bó chiều rộng
                   (shrink-to-fit) làm cột Time rớt xuống dưới — ép rộng theo nội dung. */
                .react-datepicker-popper {
                    min-width: max-content;
                    z-index: 9999;
                }
                .react-datepicker-wrapper input {
                    padding-left: 2.25rem !important;
                }
                .react-datepicker__header {
                    background-color: #f8fafc;
                    border-bottom: 1px solid #e2e8f0;
                    padding-top: 12px;
                }
                .react-datepicker__current-month, .react-datepicker-time__header, .react-datepicker-year-header {
                    color: #1e293b;
                    font-weight: 700;
                }
                .react-datepicker__day-name {
                    color: #64748b;
                    font-weight: 600;
                }
                .react-datepicker__day--selected, .react-datepicker__day--in-selecting-range, .react-datepicker__day--in-range, .react-datepicker__month-text--selected, .react-datepicker__month-text--in-selecting-range, .react-datepicker__month-text--in-range, .react-datepicker__quarter-text--selected, .react-datepicker__quarter-text--in-selecting-range, .react-datepicker__quarter-text--in-range, .react-datepicker__year-text--selected, .react-datepicker__year-text--in-selecting-range, .react-datepicker__year-text--in-range {
                    background-color: #2563eb;
                    color: #fff;
                    border-radius: 6px;
                }
                .react-datepicker__day--keyboard-selected {
                    background-color: #bfdbfe;
                    color: #1d4ed8;
                    border-radius: 6px;
                }
                .react-datepicker__day:hover {
                    border-radius: 6px;
                    background-color: #f1f5f9;
                }
                .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item--selected {
                    background-color: #2563eb;
                }
                .react-datepicker__close-icon::after {
                    background-color: #94a3b8;
                    padding: 0;
                    font-size: 16px;
                    height: 18px;
                    width: 18px;
                    line-height: 16px;
                }
                .react-datepicker__close-icon {
                    right: 4px;
                    padding: 0 6px 0 0;
                }
            `}</style>
        </div>
    );
};

export default CustomDatePicker;
