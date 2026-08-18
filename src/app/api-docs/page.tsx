'use client';

import { useEffect, useRef } from 'react';

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SwaggerUIBundle: any;
  }
}

export default function ApiDocsPage() {
  const swaggerContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // Prevent double loading
    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    // Check if Swagger UI is already loaded
    if (window.SwaggerUIBundle && swaggerContainerRef.current) {
      initializeSwagger();
      return;
    }

    // Load Swagger UI CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css';
    document.head.appendChild(link);

    // Load Swagger UI JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js';
    script.async = true;
    
    script.onload = () => {
      initializeSwagger();
    };

    script.onerror = () => {
      console.error('Failed to load Swagger UI');
      if (swaggerContainerRef.current) {
        swaggerContainerRef.current.innerHTML = 
          '<div class="p-8 text-center"><p class="text-red-600">Failed to load API documentation. Please refresh the page.</p></div>';
      }
    };

    document.body.appendChild(script);

    function initializeSwagger() {
      if (window.SwaggerUIBundle && swaggerContainerRef.current) {
        window.SwaggerUIBundle({
          url: '/api-docs/spec',
          dom_id: '#swagger-ui',
          presets: [
            window.SwaggerUIBundle.presets.apis,
            window.SwaggerUIBundle.presets.standalone,
          ],
          layout: 'BaseLayout',
          deepLinking: true,
          showExtensions: true,
          showCommonExtensions: true,
        });
      }
    }

    return () => {
      // Cleanup - only remove if they exist
      const existingLink = document.querySelector('link[href*="swagger-ui.css"]');
      const existingScript = document.querySelector('script[src*="swagger-ui-bundle.js"]');
      
      if (existingLink && existingLink.parentNode) {
        existingLink.parentNode.removeChild(existingLink);
      }
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
      
      scriptLoadedRef.current = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div id="swagger-ui" ref={swaggerContainerRef}></div>
    </div>
  );
}

