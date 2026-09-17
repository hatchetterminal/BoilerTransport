import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnv } from 'vite';
import { DEFAULT_SUPPORT_EMAIL } from '../src/lib/contact.js';

const root = process.cwd();
const env = loadEnv('production', root, '');
env.VITE_SUPPORT_EMAIL = env.VITE_SUPPORT_EMAIL?.trim() || DEFAULT_SUPPORT_EMAIL;
const blockers = [];
const warnings = [];

const isPlaceholder = (value) => !value || /example\.com|your_|your-|placeholder/i.test(value);
const requireValue = (key, label = key) => {
  if (isPlaceholder(env[key]))
    blockers.push(`${label} is missing or still uses a placeholder (${key}).`);
};

if (!existsSync(resolve(root, '.env.production'))) {
  blockers.push('Create .env.production from .env.production.example.');
}

requireValue('VITE_SUPPORT_EMAIL', 'Support email');
requireValue('VITE_SUPPORT_URL', 'Hosted support URL');
requireValue('VITE_PRIVACY_POLICY_URL', 'Hosted privacy-policy URL');
requireValue('VITE_LEGAL_NAME', 'Legal seller/operator name');
requireValue('VITE_DATA_SOURCE_NAME', 'Transportation data-source name');

for (const key of [
  'VITE_SUPPORT_URL',
  'VITE_PRIVACY_POLICY_URL',
  'VITE_DATA_SOURCE_URL',
  'VITE_MAP_STYLE_URL',
]) {
  if (env[key] && !env[key].startsWith('https://')) blockers.push(`${key} must use HTTPS.`);
}

const projectFile = resolve(root, 'ios/App/App.xcodeproj/project.pbxproj');
const project = existsSync(projectFile) ? readFileSync(projectFile, 'utf8') : '';
if (!project) blockers.push('The native iOS Xcode project is missing.');
if (!/DEVELOPMENT_TEAM = [A-Z0-9]+;/.test(project)) {
  blockers.push('Select an Apple Developer Team in Xcode signing settings.');
}
if (/PRODUCT_BUNDLE_IDENTIFIER = com\.boilertransport\.app;/.test(project)) {
  warnings.push(
    'Confirm that com.boilertransport.app is the permanent Bundle ID before creating the App Store record.',
  );
}

for (const path of [
  'ios/App/App/PrivacyInfo.xcprivacy',
  'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png',
]) {
  if (!existsSync(resolve(root, path))) blockers.push(`Required release file is missing: ${path}`);
}

try {
  const version = execFileSync('xcodebuild', ['-version'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (!/Xcode\s+\d+/i.test(version)) blockers.push('A full Xcode installation is required.');
} catch {
  blockers.push('Install full Xcode and select it with xcode-select before creating an archive.');
}

console.log('\nBoiler Transport release check\n');
if (warnings.length) {
  console.log('Warnings:');
  warnings.forEach((item) => console.log(`  - ${item}`));
  console.log('');
}

if (blockers.length) {
  console.log('Blocking items:');
  blockers.forEach((item) => console.log(`  - ${item}`));
  console.log(`\n${blockers.length} blocking item${blockers.length === 1 ? '' : 's'} remain.\n`);
  process.exitCode = 1;
} else {
  console.log('Project configuration is ready for a signed TestFlight archive.\n');
}
