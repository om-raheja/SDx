import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'https://medical-dx.vercel.app',
    headless: true,
  },
});