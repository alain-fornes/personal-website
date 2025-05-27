// Utility to generate secure hash for your credentials
// Run this in the browser console to generate your hash

async function generateAuthHash(username, password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(username + ':' + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  console.log('Generated hash for', username + ':' + password);
  console.log('Hash:', hashHex);
  console.log('Copy this hash and replace the validHash in AuthPanel.js');
  
  return hashHex;
}

// Example usage (run in browser console):
// generateAuthHash('yourusername', 'yourpassword')

export default generateAuthHash; 