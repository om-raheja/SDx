import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  use: {
    baseURL: 'https://sdxlab.vercel.app',
    headless: true,
  },
});