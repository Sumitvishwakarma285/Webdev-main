import React from "react";
import { CheckCircle, Circle, Clock, FilePlus, FileText, Folder } from "lucide-react";

const StepsList = ({ steps, currentStep, onStepClick, files }) => {
  // Combine steps and files into a single list
  const combinedItems = [
    ...steps.map(step => ({ ...step, type: 'step' })),
    ...files.map(file => ({ 
      ...file, 
       type: 'step',
       title: `Create ${file.path}`
    }))
  ].sort((a, b) => (a.id || 0) - (b.id || 0));

  return (
    <div className="bg-gray-900 rounded-lg shadow-lg p-4 h-full overflow-auto">
      <h2 className="text-lg font-semibold mb-4 text-gray-100">Build Steps & Files</h2>
      
      {combinedItems.length === 0 ? (
        <p className="text-gray-500 text-center">No steps or files available</p>
      ) : (
        <div className="space-y-4">
          {combinedItems.map((item) => (
            <div
              key={item.id}
              className={`p-2 rounded-lg cursor-pointer transition-colors ${
                currentStep === item.id
                  ? "bg-gray-800 border border-gray-700"
                  : "hover:bg-gray-800"
              }`}
              onClick={() => onStepClick(item.id)}
            >
              <div className="flex items-center gap-3">
                {item.type === 'step' ? (
                  item.status === "completed" ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : item.status === "in-progress" ? (
                    <Clock className="w-5 h-5 text-blue-400" />
                  ) : item.type === "CreateFile" ? (
                    <FilePlus className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-600" />
                  )
                ) : item.type === 'folder' ? (
                  <Folder className="w-5 h-5 text-blue-300" />
                ) : (
                  <FileText className="w-5 h-5 text-gray-400" />
                )}
                 
                <div className="flex-1">
                  <h3 className="font-medium text-gray-100">
                    {item.title || item.name || "Untitled"}
                  </h3>
                </div>
              </div>
              
              {item.description && (
                <p className="text-sm text-gray-400 mt-2">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StepsList;