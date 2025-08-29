import React from "react";
import Heading from "./Heading";

interface BoxProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: string;
}

const Box: React.FC<BoxProps> = ({ children, className = "", title, icon, ...props }) => {
  return (
    <div className={`p-5 bg-white rounded-lg shadow-md border border-gray-200 ${className}`} {...props}>
      {title && (
        <Heading level={2} icon={icon} className="mb-4 text-xl">
          {title}
        </Heading>
      )}
      {children}
    </div>
  );
};

export default Box;