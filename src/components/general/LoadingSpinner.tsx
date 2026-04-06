// src/components/general/LoadingSpinner.tsx
import { FaSpinner } from "react-icons/fa";

interface LoadingSpinnerProps {
  message?: string;
  size?: "full" | "sm";
}

const LoadingSpinner = ({ message = "Loading...", size = "full" }: LoadingSpinnerProps) => {
  if (size === "sm") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FaSpinner className="animate-spin text-blue-500 text-4xl mb-3" />
        <p className="text-slate-600 text-sm">{message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <FaSpinner className="animate-spin text-blue-500 text-5xl mx-auto mb-4" />
        <p className="text-slate-600 text-lg">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;