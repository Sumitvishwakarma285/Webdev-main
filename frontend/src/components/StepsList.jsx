import React from "react";
import { CheckCircle, Circle, Clock, FilePlus } from "lucide-react";

const StepsList = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="bg-gray-900 rounded-lg shadow-lg p-4 h-full overflow-auto">
      <h2 className="text-lg font-semibold mb-4 text-gray-100">Build Steps</h2>
      
      {steps.length === 0 ? (
        <p className="text-gray-500 text-center">No steps available</p>
      ) : (
        <div className="space-y-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`p-2 rounded-lg cursor-pointer transition-colors ${
                currentStep === step.id
                  ? "bg-gray-800 border border-gray-700"
                  : "hover:bg-gray-800"
              }`}
              onClick={() => onStepClick(step.id)}
            >
              <div className="flex items-center gap-3">
                {step.status === "completed" ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : step.status === "in-progress" ? (
                  <Clock className="w-5 h-5 text-blue-400" />
                ) : step.type === "CreateFile" ? (
                  <FilePlus className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-600" />
                )}

                <div className="flex-1">
                  <h3 className="font-medium text-gray-100">
                    {step.title || step.name || "Untitled Step"}
                  </h3>
                  {/* {step.path && (
                    <p className="text-xs text-gray-400">📂 {step.path}</p>
                  )} */}
                </div>
              </div>

              {step.description && (
                <p className="text-sm text-gray-400 mt-2">{step.description}</p>
              )}

              {/* Show file content preview for file creation steps */}
              {/* {step.type === "CreateFile" && step.code && (
                <div className="mt-2">
                  <pre className="text-xs bg-gray-900 p-2 rounded-md overflow-auto text-gray-300 border border-gray-700">
                    <code>
                      {step.code.slice(0, 300)}
                      {step.code.length > 300 ? "..." : ""}
                    </code>
                  </pre>
                </div>
              )} */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StepsList;
