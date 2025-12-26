import { useEffect, useState } from "react";

type ViewDetailButtonProps = {
  onOpen?: () => void;    
  onClose?: () => void;   
  children?: React.ReactNode; 
  color?: "blue" | "green" | "red" | "yellow"; // thêm color prop
  disabled?: boolean;
};

const colorMap: Record<string, string> = {
  blue: "bg-blue-500 text-white hover:bg-blue-700 focus:ring-blue-400",
  green: "bg-green-500 text-white hover:bg-green-700 focus:ring-green-400",
  red: "bg-red-500 text-white hover:bg-red-700 focus:ring-red-400",
  yellow: "bg-yellow-400 text-black hover:bg-yellow-500 focus:ring-yellow-300",
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
    setOpen(true);
    if (onOpen) onOpen();
  };

  const handleClose = () => {
    setOpen(false);
    if (onClose) onClose();
  };

  const colorClasses = colorMap[color] ?? colorMap["blue"];

  return (
    <div>
      {/* mobile overlay */}
          <button
            {...props}
            onClick={handleOpen}
            className={`
              px-4 py-2 rounded-md
              font-medium shadow-sm
              active:scale-[0.97]
              focus:outline-none focus:ring-2 focus:ring-offset-1
              transition-all duration-200
              ${colorClasses}
            `}
            disabled={disabled}
          >
            {children ?? "Xem chi tiết"}
          </button>
    </div>
  );
};

export default ViewDetailButton;
