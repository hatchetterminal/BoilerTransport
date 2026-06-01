import React from 'react';
import { Toaster } from "sonner";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        :root {
          --purdue-gold: #CEB888;
          --purdue-black: #000000;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        /* iOS-style safe area padding */
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom);
          }
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        
        /* Leaflet custom styles */
        .leaflet-container {
          font-family: inherit;
          border-radius: 16px;
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        
        .leaflet-popup-tip {
          box-shadow: none;
        }
        
        .lot-popup .leaflet-popup-content {
          margin: 8px;
        }
        
        /* Hide leaflet attribution */
        .leaflet-control-attribution {
          display: none;
        }
        
        /* Animation classes */
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .animate-pulse-soft {
          animation: pulse-soft 2s ease-in-out infinite;
        }
        
        /* Mobile touch optimization */
        @media (hover: none) {
          .hover\\:bg-gray-50:active {
            background-color: rgb(249 250 251);
          }
        }
      `}</style>
      
      {children}
      
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: '16px',
            padding: '16px',
            fontSize: '14px',
          },
        }}
      />
    </div>
  );
}