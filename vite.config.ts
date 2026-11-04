/**
 * LEEWAY HEADER — DO NOT REMOVE
 * REGION: LEEWAY.CONTENT_VAULT.BUILD
 * TAG: LEEWAY.CONTENT_VAULT.BUILD.VITE
 * WHAT: Configure the canonical Vite bundle for local and GitHub Pages.
 * WHY: Deploy compiled assets beneath the Content Vault project prefix.
 * WHO: LeeWay Content Vault engineering.
 * WHERE: vite.config.ts
 * WHEN: 2026-11-04
 * HOW: Set a project-base path only during Actions execution.
 * LICENSE: Original Foundry source attribution preserved.
 */
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
 base: process.env.GITHUB_ACTIONS === 'true' ? '/Leeway-Content-Vault/' : '/',
 plugins:[react(),tailwindcss()]
});
