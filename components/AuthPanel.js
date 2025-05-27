import React, { useState, useEffect } from 'react';

const AuthPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginVisible, setIsLoginVisible] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check authentication status on component mount
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    const authTimestamp = localStorage.getItem('authTimestamp');
    
    // Check if authentication is still valid (24 hour session)
    if (authStatus === 'true' && authTimestamp) {
      const now = new Date().getTime();
      const authTime = parseInt(authTimestamp);
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      if (now - authTime < twentyFourHours) {
        setIsAuthenticated(true);
      } else {
        // Session expired
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authTimestamp');
      }
    }
  }, []);

  // Secure authentication function
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Create a hash of the credentials for secure comparison
      const encoder = new TextEncoder();
      const data = encoder.encode(credentials.username + ':' + credentials.password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Hardcoded secure hash for your credentials: alainfornes:199277Bobopeekosensei$
      const validHash = 'c9d31b3400431e3d22bc26ac43ef03ae97e1d0281715094dae7dcc78cc18c951';
      
      if (hashHex === validHash) {
        setIsAuthenticated(true);
        setIsLoginVisible(false);
        setCredentials({ username: '', password: '' });
        
        // Store authentication with timestamp
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('authTimestamp', new Date().getTime().toString());
        
        console.log('Authentication successful');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Authentication failed');
      console.error('Auth error:', err);
    }
    
    setIsLoading(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsLoginVisible(false);
    setCredentials({ username: '', password: '' });
    setError('');
    
    // Clear authentication from storage
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('authTimestamp');
    
    console.log('Logged out successfully');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user types
  };

  return (
    <div className="fixed bottom-8 left-8 z-50">
      {/* Authentication Status Indicator */}
      <div className="flex items-center space-x-3 mb-3">
        <div className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
        <span className="text-white text-sm font-medium">
          {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
        </span>
      </div>

      {/* Login/Logout Button */}
      {!isAuthenticated ? (
        <button
          onClick={() => setIsLoginVisible(!isLoginVisible)}
          className="px-4 py-2 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg border border-white border-opacity-20 text-white text-sm hover:bg-opacity-20 transition-all duration-200"
        >
          {isLoginVisible ? 'Cancel' : 'Admin Login'}
        </button>
      ) : (
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 bg-opacity-20 backdrop-blur-sm rounded-lg border border-red-400 border-opacity-30 text-white text-sm hover:bg-opacity-30 transition-all duration-200"
        >
          Logout
        </button>
      )}

      {/* Login Form */}
      {isLoginVisible && !isAuthenticated && (
        <div className="mt-3 p-4 bg-black bg-opacity-80 backdrop-blur-sm rounded-lg border border-white border-opacity-20 min-w-[250px]">
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={credentials.username}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded text-white placeholder-gray-400 text-sm focus:outline-none focus:border-opacity-40"
                required
              />
            </div>
            <div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={credentials.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded text-white placeholder-gray-400 text-sm focus:outline-none focus:border-opacity-40"
                required
              />
            </div>
            
            {error && (
              <div className="text-red-400 text-xs">{error}</div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-3 py-2 bg-blue-500 bg-opacity-20 border border-blue-400 border-opacity-30 rounded text-white text-sm hover:bg-opacity-30 transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Authenticating...' : 'Login'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AuthPanel; 