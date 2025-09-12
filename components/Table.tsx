"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface Inspection {
  id: number;
  inspectionName: string;
  date: string;
  status: "Pending" | "In Progress" | "Completed" | "Cancelled";
}

interface TableProps {
  inspections: Inspection[];
  onRowClick: (id: number) => void;
}

const Table: React.FC<TableProps> = ({ inspections, onRowClick }) => {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleActionClick = (e: React.MouseEvent, action: string, id: number) => {
    e.stopPropagation(); // Prevent row click when clicking action buttons
    if (action === "edit") {
      onRowClick(id);
    } else if (action === "document") {
      // Handle document action - you can implement this later
      console.log("Document action for inspection:", id);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Inspection Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {inspections.map((inspection) => (
            <tr
              key={inspection.id}
              className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
              onClick={() => onRowClick(inspection.id)}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {inspection.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {inspection.inspectionName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {inspection.date}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    inspection.status
                  )}`}
                >
                  {inspection.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => handleActionClick(e, "edit", inspection.id)}
                    className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                    title="Edit"
                  >
                    <i className="fas fa-pencil-alt"></i>
                  </button>
                  <button
                    onClick={(e) => handleActionClick(e, "document", inspection.id)}
                    className="text-green-600 hover:text-green-900 p-1 rounded transition-colors"
                    title="Document"
                  >
                    <i className="fas fa-file-alt"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
