import React, { useState, useCallback, useMemo } from "react";
import { FolderTree, File, ChevronRight, ChevronDown } from "lucide-react";

const FileNode = ({ item, depth, onFileClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = useCallback(() => {
    if (item.type === "folder") {
      setIsExpanded((prev) => !prev);
    } else {
      onFileClick(item);
    }
  }, [item, onFileClick]);

  return (
    <div className="select-none">
      <div
        className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-md cursor-pointer transition-all duration-200"
        style={{ paddingLeft: `${depth * 1.5}rem` }}
        onClick={handleClick}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
        role="button"
        tabIndex={0}
      >
        {item.type === "folder" && (
          <span className="text-gray-400">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </span>
        )}
        {item.type === "folder" ? (
          <FolderTree className="w-4 h-4 text-blue-400" />
        ) : (
          <File className="w-4 h-4 text-gray-400" />
        )}
        <span className="text-gray-200">{item.name}</span>
      </div>
      {item.type === "folder" && isExpanded && item.children.length > 0 && (
        <div className="pl-4 border-l border-gray-700">
          {item.children.map((child) => (
            <FileNode key={child.path} item={child} depth={depth + 1} onFileClick={onFileClick} />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Convert steps into files and merge with existing files.
 * If a file exists in both, keep the content from `files` and discard `steps` content.
 */
const buildFileTree = (existingFiles, steps) => {
  const root = [];
  const pathMap = {};
  const allFiles = [...existingFiles];

  steps.forEach((step) => {
    if (step.type === "CreateFile" && step.path) {
      const existingFile = allFiles.find((file) => file.path === step.path);
      if (!existingFile) {
        // Add new file if it doesn't exist in existing files
        allFiles.push({
          name: step.title || "Untitled Step",
          path: step.path,
          type: "file",
          content: step.code || "",
        });
      }
    }
  });

  allFiles.forEach((file) => {
    const parts = file.path.split("/");
    let currentLevel = root;

    parts.forEach((part, index) => {
      const fullPath = parts.slice(0, index + 1).join("/");
      let node = pathMap[fullPath];

      if (!node) {
        node = {
          name: part,
          path: fullPath,
          type: index === parts.length - 1 ? "file" : "folder",
          content: index === parts.length - 1 ? file.content || "" : "",
          children: [],
        };
        pathMap[fullPath] = node;

        if (index === 0) {
          root.push(node);
        } else {
          const parentPath = parts.slice(0, index).join("/");
          if (!pathMap[parentPath]) {
            pathMap[parentPath] = {
              name: parts[index - 1],
              path: parentPath,
              type: "folder",
              children: [],
            };
            root.push(pathMap[parentPath]);
          }
          pathMap[parentPath].children.push(node);
        }
      }
    });
  });

  return root;
};

const FileExplorer = ({ files, steps, onFileSelect }) => {
  const structuredFiles = useMemo(() => buildFileTree(files, steps), [files, steps]);

  return (
    <div className="bg-gray-900 rounded-lg shadow-lg p-4 h-full overflow-auto">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-100">
        <FolderTree className="w-5 h-5" />
        File Explorer
      </h2>
      <div className="space-y-1">
        {structuredFiles.length > 0 ? (
          structuredFiles.map((file) => <FileNode key={file.path} item={file} depth={0} onFileClick={onFileSelect} />)
        ) : (
          <p className="text-gray-500 text-sm">No files available</p>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
