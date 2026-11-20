import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',use:{baseURL:'http://127.0.0.1:18881',launchOptions:process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}},webServer:{command:'npm run dev -- --host 127.0.0.1 --port 18881',url:'http://127.0.0.1:18881',reuseExistingServer:!process.env.CI}});
