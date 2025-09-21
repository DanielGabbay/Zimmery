const fs = require('fs');
require('dotenv').config();

const targetPath = './src/environments/environment.prod.ts';
const envConfigFile = `
export const environment = {
  production: true,
  supabaseUrl: '${process.env.SUPABASE_URL}',
  supabaseKey: '${process.env.SUPABASE_KEY}'
};
`;

const envDir = './src/environments';
if (!fs.existsSync(envDir)){
    fs.mkdirSync(envDir);
}

fs.writeFileSync(targetPath, envConfigFile, 'utf8');
console.log(`Production environment config file generated at ${targetPath}`);
