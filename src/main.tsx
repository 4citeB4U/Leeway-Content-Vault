/**
 * LEEWAY HEADER — DO NOT REMOVE
 * REGION: LEEWAY.CONTENT_VAULT.UI
 * TAG: LEEWAY.CONTENT_VAULT.UI.BOOT
 * WHAT: Mount the real standalone Vault UI.
 * WHY: Provide one browser entry without the Foundry workflow runtime.
 * WHO: LeeWay Content Vault engineering.
 * WHERE: src/main.tsx
 * WHEN: 2026-11-04
 * HOW: Mount React application into the root element.
 * LICENSE: Original Foundry source provenance preserved.
 */
import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';
const root = document.getElementById('root');
if(!root)throw new Error('Vault root element missing');
createRoot(root).render(<React.StrictMode><App/></React.StrictMode>);
