import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.jsx';
import LaunchExperience from '@/components/common/LaunchExperience';
import '@/index.css';
import 'maplibre-gl/dist/maplibre-gl.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <LaunchExperience>
    <App />
  </LaunchExperience>,
);
