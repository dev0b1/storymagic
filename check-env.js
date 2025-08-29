// Simple environment checker
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Environment Configuration...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

console.log('📁 .env file exists:', envExists ? '✅' : '❌');

if (envExists) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    console.log('\n📋 Environment Variables Found:');
    
    const supabaseVars = lines.filter(line => line.includes('SUPABASE'));
    
    if (supabaseVars.length > 0) {
      supabaseVars.forEach(line => {
        const [key, value] = line.split('=');
        const maskedValue = value && value.length > 10 ? 
          value.substring(0, 10) + '...' + value.substring(value.length - 5) :
          value ? '***' : 'NOT SET';
        console.log(`  ${key}: ${maskedValue}`);
      });
    } else {
      console.log('  ❌ No Supabase variables found!');
    }
    
    // Check critical variables
    const criticalVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];
    
    console.log('\n🔑 Critical Variables Check:');
    criticalVars.forEach(varName => {
      const found = lines.some(line => line.startsWith(varName + '=') && line.split('=')[1]?.trim());
      console.log(`  ${varName}: ${found ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.log('❌ Error reading .env file:', error.message);
  }
} else {
  console.log('\n⚠️  No .env file found. You need to:');
  console.log('1. Copy .env.example to .env');
  console.log('2. Fill in your Supabase credentials');
  console.log('3. Get credentials from: https://supabase.com/dashboard');
}

console.log('\n🌐 System Info:');
console.log('  Node.js version:', process.version);
console.log('  Platform:', process.platform);
console.log('  Current directory:', __dirname);
