 import React, { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import Editor from "@monaco-editor/react";
import StepsList from '../components/StepsList';
import  FileExplorer  from '../components/FileExplorer';
import TabView  from '../components/TabView';
import  PreviewFrame  from '../components/PreviewFrame';
import axios from 'axios';
import { parseXml } from '../steps';
import { useWebContainer } from '../hooks/useWebContainer';
import  Loader  from '../components/Loader';
// import { BACKEND_URL } from '../config';

const Builder = () => {
  const location = useLocation();
  const prompt = location.state?.prompt;
  const [userPrompt, setPrompt] = useState("");
  const [llmMessages, setLlmMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  const webcontainer = useWebContainer();

  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState('code');
  const [selectedFile, setSelectedFile] = useState(null);
  const [steps, setSteps] = useState([]);
  const [files, setFiles] = useState([]);

  if (!prompt) return <Navigate to="/" replace />;

  useEffect(() => {
    let isMounted = true;
    let originalFiles = [...files];
    let updateHappened = false;

    steps.filter(({ status }) => status === "pending").forEach(step => {
      updateHappened = true;
      if (step?.type === 'CREATE_FILE') {
        // Use let instead of const to allow mutation
        let parsedPath = step.path?.split("/") ?? [];
        let currentFileStructure = [...originalFiles];
        let currentFolder = "";

        while (parsedPath.length) {
          currentFolder = `${currentFolder}/${parsedPath[0]}`;
          let currentFolderName = parsedPath[0];
          let remainingPath = parsedPath.slice(1);

          if (!remainingPath.length) {
            // Create/update file
            const existingFile = currentFileStructure.find(x => x.path === currentFolder);
            if (!existingFile) {
              currentFileStructure.push({
                name: currentFolderName,
                type: 'file',
                path: currentFolder,
                content: step.code,
                id: Date.now()
              });
            } else {
              existingFile.content = step.code;
            }
          } else {
            // Create/update folder
            const existingFolder = currentFileStructure.find(x => x.path === currentFolder);
            if (!existingFolder) {
              currentFileStructure.push({
                name: currentFolderName,
                type: 'folder',
                path: currentFolder,
                children: [],
                id: Date.now()
              });
            }
            currentFileStructure = currentFileStructure.find(x => x.path === currentFolder).children;
          }
          // Reassign parsedPath to remainingPath
          parsedPath = remainingPath;
        }
        originalFiles = currentFileStructure;
      }
    });

    if (updateHappened && isMounted) {
      setFiles(originalFiles);
      setSteps(steps => steps.map(s => ({ ...s, status: "completed" })));
    }

    return () => { isMounted = false; };
  }, [steps, files]);

  useEffect(() => {
    if (!webcontainer || (files.length === 0 && steps.length === 0)) return;

    const mountFiles = async () => {
      let allFiles = [...files, ...steps];
      
      // Ensure package.json exists
      const packageJsonExists = allFiles.some(file => file.path === "package.json");
      if (!packageJsonExists) {
        const defaultPackageJson = {
          id: Date.now(),
          path: "package.json",
          name: "package.json",
          type: "file",
          content: JSON.stringify({
            name: "react-app",
            version: "1.0.0",
            private: true,
            dependencies: {
              react: "^18.2.0",
              "react-dom": "^18.2.0",
              "react-router-dom": "^6.14.1",
              axios: "^1.3.5",
              tailwindcss: "^3.3.5"
            },
            devDependencies: {
              vite: "^4.4.0"
            },
            scripts: {
              start: "vite",
              build: "vite build",
              serve: "vite preview"
            }
          }, null, 2),
          status: "completed"
        };
        allFiles = [...allFiles, defaultPackageJson];
      }
      
      const fileSystem = {};
      allFiles.forEach(file => {
        const pathParts = file.path.split('/').filter(Boolean);
        let currentDirectory = fileSystem;

        pathParts.forEach((part, index) => {
          if (!currentDirectory[part]) {
            if (index === pathParts.length - 1) {
              currentDirectory[part] = {
                file: {
                  contents: file.content || ''
                }
              };
            } else {
              currentDirectory[part] = {};
            }
          }
          if (index === pathParts.length - 1) {
            currentDirectory[part] = {
              file: {
                contents: file.content || ''
              }
            };
          } else {
            currentDirectory = currentDirectory[part];
          }
        });
      });

      console.log('File System:', fileSystem);
      await webcontainer.mount(fileSystem);

      // Ensure dependencies are installed after mounting
      await webcontainer.spawn("npm", ["install"]).catch(console.error);
    };

    mountFiles().catch(console.error);
  }, [files, steps, webcontainer]);
const init = async () => {
  try {
    setLoading(true);

    // Fetch template
    const response = await axios.post("http://localhost:3000/template", {
      prompt: prompt.trim(),
    });

    if (!response.data.uiPrompts?.[0]) {
      throw new Error("No UI prompts received");
    }

    setTemplateSet(true);
    const { prompts, uiPrompts } = response.data;

    setSteps(
      parseXml(uiPrompts[0]).map((x, index) => ({
        ...x,
        status: "pending",
        id: index + 1,
      }))
    );

    // Fetch AI-generated response
    const stepsResponse = await axios.post("http://localhost:3000/chat", {
      messages: [...prompts, prompt].map((content) => ({
        role: "user",
        content,
      })),
    });

    const cleanedResponse = stepsResponse.data.response
      .replace(/<think>.*?<\/think>/gs, "")
      .trim();

    console.log("Extracted Response:", cleanedResponse);

    // Regex to match **filename** followed by a code block
    const fileRegex = /\*\*(.+?)\*\*\s*```(\w+)?\s*([\s\S]+?)```/g;
    let extractedFiles = [];
    let packageJsonContent = null;

    let match;
    while ((match = fileRegex.exec(cleanedResponse)) !== null) {
      const filePath = match[1].trim();
      const fileContent = match[3].trim();

      // Special handling for package.json
      if (filePath === "package.json") {
        try {
          packageJsonContent = JSON.parse(fileContent);
        } catch (err) {
          console.error("Error parsing package.json:", err);
        }
      }

      extractedFiles.push({
        id: Date.now() + extractedFiles.length,
        path: filePath,
        name: filePath.split("/").pop(),
        type: "file",
        content: fileContent,
        status: "completed",
      });
    }

    // Check if package.json already exists, if not, add a default one
    const packageExists = extractedFiles.some(file => file.path === "package.json");
    
    if (!packageExists) {
      if (!packageJsonContent) {
        packageJsonContent = {
          name: "react-app",
          version: "1.0.0",
          private: true,
          dependencies: {
            react: "^18.2.0",
            "react-dom": "^18.2.0",
            "react-router-dom": "^6.14.1",
            axios: "^1.3.5",
            tailwindcss: "^3.3.5",
          },
          devDependencies: {
            vite: "^4.4.0",
          },
          scripts: {
            start: "vite",
            build: "vite build",
            serve: "vite preview",
          },
        };
      }

      extractedFiles.push({
        id: Date.now() + extractedFiles.length,
        path: "package.json",
        name: "package.json",
        type: "file",
        content: JSON.stringify(packageJsonContent, null, 2),
        status: "completed",
      });
    }

    console.log("Extracted Files:", extractedFiles);
    setFiles((prevFiles) => [...prevFiles, ...extractedFiles]);
  } catch (error) {
    console.error("Error in initialization:", error);
  } finally {
    setLoading(false);
  }
};



  useEffect(() => {
    init();
  }, []);

  const handleSendMessage = async () => {
    try {
      setLoading(true);
      const newMessage = { role: "user", content: userPrompt };
      const stepsResponse = await axios.post(`http://localhost:3000/chat`, {
        messages: [...llmMessages, newMessage]
      });

      const newSteps = parseXml(stepsResponse.data.response).map((x, index) => ({
        ...x,
        status: "pending",
        id: steps.length + index + 1
      }));

      setSteps(s => [...s, ...newSteps]);
      setLlmMessages(x => [...x, newMessage, {
        role: "assistant",
        content: stepsResponse.data.response
      }]);
      
      // Clear the user prompt after sending
      setPrompt("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col text-gray-100">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Website Builder</h1>
        <p className="text-sm text-gray-400">Prompt: {prompt}</p>
      </header>
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar for Steps List */}
        <div className="w-1/5 border-r border-gray-700 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <StepsList steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} files={files} />
          </div>
          <div className="p-4 border-t border-gray-700">
            <textarea value={userPrompt} onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-2 bg-gray-800 text-gray-100 rounded border border-gray-700" rows={3} />
            <button onClick={() => {}} className="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded transition-colors">Send</button>
          </div>
        </div>
        {/* File Explorer */}
        <div className="w-1/5 border-r border-gray-700 overflow-y-auto">
          <FileExplorer files={files} onFileSelect={setSelectedFile} steps={steps} />
        </div>
        {/* Code Editor / Preview */}
        <div className="flex-1 flex flex-col">
          <TabView activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex-1">
            {activeTab === 'code' ? (
              selectedFile ? (
                <Editor height="100%" theme="vs-dark" language={selectedFile.name.split('.').pop() || 'plaintext'}
                  value={selectedFile.content || ''} onChange={(newValue) => { setFiles(prevFiles => prevFiles.map(file => file.path === selectedFile.path ? { ...file, content: newValue } : file)); }}
                  options={{ readOnly: false, minimap: { enabled: false }, fontSize: 14, lineNumbers: "on", scrollBeyondLastLine: false }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">Select a file to view its content</div>
              )
            ) : (
              <PreviewFrame webContainer={webcontainer} files={files} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Builder;