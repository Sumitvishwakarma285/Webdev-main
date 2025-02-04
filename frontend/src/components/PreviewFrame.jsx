import React, { useEffect, useState, useRef } from "react";

export default function PreviewFrame({ files, webContainer }) {
  const [url, setUrl] = useState("");
  const initialized = useRef(false); // Track if main() has run

  async function main() {
    if (!webContainer || initialized.current) return;
    initialized.current = true; // Prevent multiple executions

    try {
      console.log("Installing dependencies...");
      const installProcess = await webContainer.spawn("npm", ["install"]);

      await installProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            console.log(data);
          },
        })
      );

      console.log("Starting development server...");
      await webContainer.spawn("npm", ["run", "dev"]);

      const handleServerReady = (port, url) => {
        console.log("Server running at:", url);
        setUrl(url);
      };

      webContainer.on("server-ready", handleServerReady);

      return () => {
        webContainer.off("server-ready", handleServerReady); // Cleanup listener
      };
    } catch (error) {
      console.error("Error in WebContainer:", error);
    }
  }

  useEffect(() => {
    main();
  }, [webContainer]); // Runs when webContainer is initialized

  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      {!url ? (
        <div className="text-center">
          <p className="mb-2">Loading...</p>
        </div>
      ) : (
        <iframe width="100%" height="100%" src={url} />
      )}
    </div>
  );
}
