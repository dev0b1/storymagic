// Debug script to check auth configuration
console.log('=== DEBUG AUTH CONFIGURATION ===');

// Check environment variables
console.log('Environment Variables:');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'SET (length: ' + process.env.VITE_SUPABASE_ANON_KEY.length + ')' : 'NOT SET');

// Check system time
console.log('\nSystem Time:');
console.log('Local Time:', new Date().toISOString());
console.log('Timestamp:', Date.now());
console.log('Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);

// Check URLs
if (typeof window !== 'undefined') {
  console.log('\nBrowser Environment:');
  console.log('Current URL:', window.location.href);
  console.log('Origin:', window.location.origin);
  console.log('User Agent:', navigator.userAgent);
}
