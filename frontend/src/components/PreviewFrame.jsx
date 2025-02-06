// import React, { useEffect, useState, useRef } from "react";

// export default function PreviewFrame({ files, webContainer }) {
//   const [url, setUrl] = useState("");
//   const initialized = useRef(false); // Track if main() has run

//   async function main() {
//     if (!webContainer || initialized.current) return;
//     initialized.current = true; // Prevent multiple executions

//     try {
//       console.log("Installing dependencies...");
//       const installProcess = await webContainer.spawn("npm", ["install"]);

//       await installProcess.output.pipeTo(
//         new WritableStream({
//           write(data) {
//             console.log(data);
//           },
//         })
//       );

//       console.log("Starting development server...");
//       await webContainer.spawn("npm", ["run", "dev"]);

//       const handleServerReady = (port, url) => {
//         console.log("Server running at:", url);
//         setUrl(url);
//       };

//       webContainer.on("server-ready", handleServerReady);

//       return () => {
//         webContainer.off("server-ready", handleServerReady); // Cleanup listener
//       };
//     } catch (error) {
//       console.error("Error in WebContainer:", error);
//     }
//   }

//   useEffect(() => {
//     main();
//   }, [webContainer]); // Runs when webContainer is initialized

//   return (
//     <div className="h-full flex items-center justify-center text-gray-400">
//       {!url ? (
//         <div className="text-center">
//           <p className="mb-2">Loading...</p>
//         </div>
//       ) : (
//         <iframe width="100%" height="100%" src={url} />
//       )}
//     </div>
//   );
// }
import React, { useEffect, useState, useRef } from "react";

const PreviewFrame = ({ files, webContainer }) => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState(null);
  const initialized = useRef(false);

  useEffect(() => {
    async function main() {
      if (!webContainer || !files?.length || initialized.current) return;
      initialized.current = true;

      try {
        // Helper function to ensure proper file system structure
        const buildFileSystem = (files) => {
          const fileSystem = {};

          // First, add package.json
          const packageJsonContent = JSON.stringify({
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
              dev: "vite",
              build: "vite build",
              preview: "vite preview"
            }
          }, null, 2);

          fileSystem["package.json"] = {
            file: {
              contents: packageJsonContent
            }
          };

          // Then add index.html if it doesn't exist
          const indexHtmlContent = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

          fileSystem["index.html"] = {
            file: {
              contents: indexHtmlContent
            }
          };

          // Add main.tsx if it doesn't exist
          const mainTsxContent = `
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`;

          fileSystem.src = {
            "main.tsx": {
              file: {
                contents: mainTsxContent
              }
            }
          };

          // Add files from the files array
          files.forEach(file => {
            if (!file.path || !file.content) return;

            const parts = file.path.split('/').filter(Boolean);
            let current = fileSystem;

            for (let i = 0; i < parts.length; i++) {
              const part = parts[i];
              const isLast = i === parts.length - 1;

              if (isLast) {
                // It's a file
                current[part] = {
                  file: {
                    contents: file.content
                  }
                };
              } else {
                // It's a directory
                current[part] = current[part] || {};
                current = current[part];
              }
            }
          });

          return fileSystem;
        };

        const fileSystem = buildFileSystem(files);
        console.log("Mounting file system:", fileSystem);

        await webContainer.mount(fileSystem);

        console.log("Installing dependencies...");
        const installProcess = await webContainer.spawn("npm", ["install"]);

        await installProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              console.log("npm install:", data);
            },
          })
        );

        console.log("Starting development server...");
        const devProcess = await webContainer.spawn("npm", ["run", "dev"]);

        devProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              console.log("Dev server:", data);
              const match = data.match(/Local:\s+(http:\/\/localhost:\d+)/);
              if (match) {
                const serverUrl = match[1];
                console.log("Server URL found:", serverUrl);
                setUrl(serverUrl);
              }
            },
          })
        );

      } catch (error) {
        console.error("Error in WebContainer:", error);
        setError(error.message);
        initialized.current = false;
      }
    }

    main();

    return () => {
      initialized.current = false;
    };
  }, [webContainer, files]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-500">
        <div className="text-center">
          <p className="font-semibold">Error:</p>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      {!url ? (
        <div className="text-center flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          <p>Starting development server...</p>
        </div>
      ) : (
        <iframe 
          src={url} 
          width="100%" 
          height="100%" 
          className="border-none"
          title="Preview"
          sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-top-navigation"
        />
      )}
    </div>
  );
};

export default PreviewFrame;