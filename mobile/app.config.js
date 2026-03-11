const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const appJson = require('./app.json');

const appEnv = process.env.APP_ENV || process.env.EAS_BUILD_PROFILE || process.env.NODE_ENV || 'development';
const envCandidates = [
  `.env.${appEnv}`,
  process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : null,
  '.env.production',
  '.env.development',
  '.env.local',
  '.env',
].filter(Boolean);

envCandidates.forEach((fileName) => {
  const fullPath = path.join(__dirname, fileName);
  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath, override: false });
  }
});

module.exports = ({ config }) => ({
  ...appJson,
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      appEnv,
      apiUrl: process.env.API_URL || appJson.expo?.extra?.apiUrl || 'http://localhost:3000/api',
      openRouteServiceApiKey: process.env.ORS_API_KEY || '',
      openRouteServiceProfile: process.env.ORS_PROFILE || 'driving-car',
    },
  },
});
