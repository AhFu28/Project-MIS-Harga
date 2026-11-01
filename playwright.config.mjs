import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests/e2e',testMatch:'*.spec.mjs',workers:1,timeout:120000,use:{baseURL:'http://127.0.0.1:4173',acceptDownloads:true,trace:'retain-on-failure'},webServer:{command:'node tests/e2e/server.mjs',url:'http://127.0.0.1:4173',reuseExistingServer:false,timeout:30000}});
