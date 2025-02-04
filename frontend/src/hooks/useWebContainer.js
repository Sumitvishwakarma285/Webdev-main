import { useEffect, useState, useRef } from "react";
import { WebContainer } from "@webcontainer/api";

export function useWebContainer() {
  const webContainerRef = useRef(null); // Store the WebContainer instance
  const [webContainer, setWebContainer] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function bootWebContainer() {
      try {
        if (!webContainerRef.current) { // Ensure only one instance is created
          const instance = await WebContainer.boot();
          if (isMounted) {
            webContainerRef.current = instance;
            setWebContainer(instance);
          }
        }
      } catch (error) {
        console.error("Error booting WebContainer:", error);
      }
    }

    bootWebContainer();

    return () => {
      isMounted = false;
      if (webContainerRef.current) {
        webContainerRef.current.teardown().catch((error) => console.error("Error tearing down WebContainer:", error));
        webContainerRef.current = null;
      }
    };
  }, []);

  return webContainer;
}
