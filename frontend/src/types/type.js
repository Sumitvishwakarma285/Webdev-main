// Enum replacement using an object
export const StepType = {
  CreateFile: 'CreateFile',
  CreateFolder: 'CreateFolder',
  EditFile: 'EditFile',
  DeleteFile: 'DeleteFile',
  RunScript: 'RunScript',
};

// Example usage of Step
export const step1 = {
  id: 1,
  title: 'Create a new file',
  description: 'This step creates a new file',
  type: StepType.CreateFile,
  status: 'pending',
  path: '/src/index.js',
};

// Example usage of Project
export const project = {
  prompt: 'Build a simple JS file system',
  steps: [step1],
};

// Example usage of FileItem
export const file1 = {
  name: 'index.js',
  type: 'file',
  content: 'console.log("Hello World");',
  path: '/src/index.js',
};

// Folder Example
export const folder = {
  name: 'src',
  type: 'folder',
  children: [file1],
  path: '/src',
};

// Example usage of FileViewerProps
export const fileViewer = {
  file: file1,
  onClose: () => console.log('File viewer closed'),
};
