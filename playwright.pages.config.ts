import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'pages.smoke.ts',
  use: {
    baseURL: 'http://127.0.0.1:4175/superAsh/',
    launchOptions: { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' },
  },
  webServer: {
    command: 'npm run preview:pages -- --port 4175 --strictPort',
    url: 'http://127.0.0.1:4175/superAsh/',
    reuseExistingServer: false,
  },
  reporter: 'list',
});
