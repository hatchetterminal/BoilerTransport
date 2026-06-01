export const APP_TAB_IDS = ['parking', 'bus', 'events', 'profile'];

export const getActiveTabFromPath = (pathname) => {
  const pathOnly = pathname.split(/[?#]/)[0];
  const [segment] = pathOnly.split('/').filter(Boolean);
  return APP_TAB_IDS.includes(segment) ? segment : 'parking';
};
