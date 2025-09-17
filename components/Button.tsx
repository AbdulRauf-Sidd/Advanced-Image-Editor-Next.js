"use client";
import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  type?: "primary" | "success" | "warning" | "danger" | "info" | "upload";
  disabled?: boolean;
  icon?: string;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = "primary",
  disabled = false,
  icon,
  className = "",
  ...props
}) => {
  const typeClasses = {
    primary: "bg-blue-500 hover:bg-blue-600 text-white",
    // Use a richer green gradient to match main buttons
    success: "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white",
    warning: "bg-yellow-500 hover:bg-yellow-600 text-white",
    danger: "bg-red-500 hover:bg-red-600 text-white",
    info: "bg-blue-400 hover:bg-blue-500 text-white",
    upload: "bg-purple-500 hover:bg-purple-600 text-white",
  };

  return (
    <button
      className={`px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 ${typeClasses[type]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {icon && <i className={icon}></i>}
      {children}
    </button>
  );
};

export default Button;