/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react";

type ViewDetailButtonProps = {
  onOpen?: () => void;    
  onClose?: () => void;   
  children?: React.ReactNode; 
  color?: "blue" | "green" | "red" | "yellow" | "gray";
  disabled?: boolean;
};

const colorMap: Record<string, string> = {
  blue: "bg-blue-500 text-white hover:bg-blue-700 focus:ring-blue-400",
  green: "bg-green-500 text-white hover:bg-green-700 focus:ring-green-400",
  red: "bg-red-500 text-white hover:bg-red-700 focus:ring-red-400",
  yellow: "bg-yellow-400 text-black hover:bg-yellow-500 focus:ring-yellow-300",
  gray: "bg-gray-300 text-gray-500 cursor-not-allowed", 
};

const ViewDetailButton = ({
  onOpen,
  onClose,
  children,
  color = "blue",
  disabled = false,
  ...props 
}: ViewDetailButtonProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleOpen = () => {
    if (disabled) return; // ← NGĂN CHẶN CLICK KHI DISABLED
    setOpen(true);
    if (onOpen) onOpen();
  };

  const handleClose = () => {
    setOpen(false);
    if (onClose) onClose();
  };

  // ← SỬ DỤNG MÀU XÁM KHI DISABLED
  const colorClasses = disabled ? colorMap["gray"] : (colorMap[color] ?? colorMap["blue"]);

  return (
    <div>
      <button
        {...props}
        onClick={handleOpen}
        disabled={disabled}
        className={`
          px-4 py-2 rounded-md
          font-medium shadow-sm
          focus:outline-none focus:ring-2 focus:ring-offset-1
          transition-all duration-200
          ${colorClasses}
          ${!disabled && 'active:scale-[0.97]'} 
        `}
      >
        {children ?? "Xem chi tiết"}
      </button>
    </div>
  );
};

export default ViewDetailButton;