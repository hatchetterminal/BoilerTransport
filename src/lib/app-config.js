const clean = (value) => String(value || '').trim();

export const APP_CONFIG = Object.freeze({
  name: 'Boiler Transport',
  version: clean(import.meta.env.VITE_APP_VERSION) || '1.0.0',
  supportEmail: clean(import.meta.env.VITE_SUPPORT_EMAIL) || DEFAULT_SUPPORT_EMAIL,
  supportUrl: clean(import.meta.env.VITE_SUPPORT_URL) || '/support',
  privacyPolicyUrl: clean(import.meta.env.VITE_PRIVACY_POLICY_URL) || '/privacy',
  legalName: clean(import.meta.env.VITE_LEGAL_NAME) || 'Boiler Transport',
  dataSourceName: clean(import.meta.env.VITE_DATA_SOURCE_NAME) || 'bundled reference data',
  dataSourceUrl: clean(import.meta.env.VITE_DATA_SOURCE_URL),
  universityAffiliated: clean(import.meta.env.VITE_UNIVERSITY_AFFILIATED).toLowerCase() === 'true',
});

export const isExternalUrl = (value) => /^https?:\/\//i.test(value || '');
import { DEFAULT_SUPPORT_EMAIL } from './contact.js';
