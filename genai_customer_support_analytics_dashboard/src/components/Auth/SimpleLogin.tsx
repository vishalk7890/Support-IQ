import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithRedirect } from '@aws-amplify/auth';

const SimpleLogin: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOAuthLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🚀 Starting OAuth login with Cognito...');
      await signInWithRedirect({ provider: 'Cognito' });
    } catch (err: any) {
      console.error('❌ OAuth login error:', err);
      setError('Failed to start OAuth login. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-md p-4"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-4"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              GenAI-supportIQ
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mx-auto"></div>
          </motion.div>
          <p className="text-gray-300 text-lg font-medium">Intelligent Customer Support Analytics</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="backdrop-blur-xl bg-white/10 shadow-2xl rounded-3xl p-8 border border-white/20"
        >
          <h2 className="text-xl font-semibold text-white mb-6 text-center">Welcome Back!</h2>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-200 p-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <button
              onClick={handleOAuthLogin}
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 font-semibold shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Connecting...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Sign In with AWS Cognito
                </div>
              )}
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Secure authentication powered by AWS Cognito
            </p>
            <p className="text-gray-500 text-xs mt-1">
              You'll be redirected to authenticate with your credentials
            </p>
            <p className="text-gray-500 text-xs mt-2">
              <strong>Note:</strong> If you see a red warning message, you can safely ignore it and proceed to login
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SimpleLogin;