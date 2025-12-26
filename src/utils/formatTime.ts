// utils/formatTime.ts (hoặc helpers/formatTime.ts)

/**
 * Format datetime string to readable Vietnamese format
 * @param dateTimeString - ISO datetime string (e.g., "2025-12-23T10:12:00")
 * @param options - Formatting options
 * @returns Formatted string (e.g., "23/12/2025 10:12" or "23 Tháng 12, 2025 - 10:12")
 */
export const formatDateTime = (
  dateTimeString: string | undefined | null,
  options?: {
    format?: 'short' | 'long' | 'date-only' | 'time-only';
    locale?: string;
  }
): string => {
  if (!dateTimeString) return '-';

  const date = new Date(dateTimeString);
  
  // Check if valid date
  if (isNaN(date.getTime())) return '-';

  const format = options?.format || 'short';

  switch (format) {
    case 'short':
      // Format: 23/12/2025 10:12
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date);

    case 'long':
      // Format: 23 Tháng 12, 2025 - 10:12
      return new Intl.DateTimeFormat('vi-VN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date).replace(' lúc ', ' - ');

    case 'date-only':
      // Format: 23/12/2025
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);

    case 'time-only':
      // Format: 10:12
      return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date);

    default:
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date);
  }
};

/**
 * Format datetime for display with custom separator
 */
export const formatDateTimeSeparate = (
  dateTimeString: string | undefined | null
): { date: string; time: string } => {
  if (!dateTimeString) return { date: '-', time: '-' };

  const date = new Date(dateTimeString);
  
  if (isNaN(date.getTime())) return { date: '-', time: '-' };

  return {
    date: new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date),
    time: new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date)
  };
};

/**
 * Get relative time (e.g., "2 giờ trước", "3 ngày trước")
 */
export const getRelativeTime = (dateTimeString: string | undefined | null): string => {
  if (!dateTimeString) return '-';

  const date = new Date(dateTimeString);
  if (isNaN(date.getTime())) return '-';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  
  return formatDateTime(dateTimeString, { format: 'short' });
};