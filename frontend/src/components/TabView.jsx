import React from "react";
import { Code2, Eye } from "lucide-react";

const TabView = ({ activeTab, onTabChange }) => (
  <div className="flex border-b border-gray-700">
    {["code", "preview"].map((tab) => (
      <button
        key={tab}
        className={`px-4 py-2 flex items-center gap-2 ${
          activeTab === tab ? "bg-gray-800 text-blue-400 border-b-2 border-blue-400" : "text-gray-400 hover:text-gray-200"
        }`}
        onClick={() => onTabChange(tab)}
      >
        {tab === "code" ? <Code2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        {tab.charAt(0).toUpperCase() + tab.slice(1)}
      </button>
    ))}
  </div>
);

export default TabView;
