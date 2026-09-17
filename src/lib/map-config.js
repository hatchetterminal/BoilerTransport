const configuredStyle = String(import.meta.env.VITE_MAP_STYLE_URL || '').trim();

export const MAP_STYLE_URL = configuredStyle || 'https://tiles.openfreemap.org/styles/positron';
export const CAMPUS_MAP_CENTER = Object.freeze([-86.9212, 40.4237]);
