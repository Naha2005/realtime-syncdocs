import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { FileText, LogIn, KeyRound, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot Password modal states
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPassword, setForgotPassword] = useState('');
  const [forgotConfirm, setForgotConfirm] = useState('');
  const [resetting, setResetting] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err || 'Failed to login. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail || !forgotPassword || !forgotConfirm) {
      toast.error('All fields are required');
      return;
    }
    if (forgotPassword !== forgotConfirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (forgotPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setResetting(true);
    try {
      const { data } = await authAPI.resetPassword({ email: forgotEmail, password: forgotPassword });
      toast.success(data.message || 'Password reset successfully!');
      setForgotModalOpen(false);
      setForgotEmail('');
      setForgotPassword('');
      setForgotConfirm('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-darkBg flex items-center justify-center p-4 sm:p-6 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-darkCard rounded-3xl border border-gray-100 dark:border-darkBorder shadow-xl p-8 space-y-6 relative overflow-hidden transition-all duration-300">
        
        {/* Aesthetic background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-400/10 dark:bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-sky-400/10 dark:bg-sky-500/10 rounded-full blur-3xl" />

        {/* Header Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="p-3.5 bg-primary-500 rounded-2xl text-white shadow-lg shadow-primary-500/30 mb-4 animate-bounce">
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Welcome Back
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
            Log in to collaborate on documents in real-time
          </p>
        </div>

        {/* Quick Demo Access Callout */}
        <div className="bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 p-4 rounded-2xl text-xs text-sky-700 dark:text-sky-400 select-all space-y-1 font-medium leading-relaxed">
          <span className="font-bold block uppercase tracking-wider text-[10px] text-sky-500 mb-1">
            Quick Sandbox Login (No Database Setup Needed):
          </span>
          <div className="flex justify-between">
            <span>Email: <span className="font-bold font-mono">demo@collabdocs.com</span></span>
            <span>Password: <span className="font-bold font-mono">password123</span></span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              disabled={isSubmitting}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-darkBorder bg-gray-50/50 dark:bg-darkCard/50 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="text-xs text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 font-semibold transition-all hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting}
                className="w-full pl-4 pr-12 py-3 rounded-2xl border border-gray-200 dark:border-darkBorder bg-gray-50/50 dark:bg-darkCard/50 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-655 dark:hover:text-gray-200 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-primary-600 to-sky-500 hover:from-primary-700 hover:to-sky-600 disabled:opacity-50 text-white font-semibold rounded-2xl shadow-lg shadow-primary-500/20 transform hover:-translate-y-0.5 transition-all outline-none"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Log In</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="text-center pt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 font-semibold underline transition-all"
            >
              Sign Up Free
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Reset Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleResetPassword}
            className="w-full max-w-md bg-white dark:bg-darkCard rounded-3xl border border-gray-100 dark:border-darkBorder p-6 space-y-6 shadow-2xl relative animate-scaleUp text-left"
          >
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-6 h-6 text-primary-500" />
                <span>Reset Password</span>
              </h3>
              <p className="text-sm text-gray-400">
                Update password credentials for your account email.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Account Email Address
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@company.com"
                  disabled={resetting}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-darkBorder bg-gray-50 dark:bg-darkCard/50 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      value={forgotPassword}
                      onChange={(e) => setForgotPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={resetting}
                      className="w-full pl-4 pr-12 py-3 rounded-2xl border border-gray-200 dark:border-darkBorder bg-gray-50 dark:bg-darkCard/50 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-655 focus:outline-none"
                    >
                      {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Confirm Password
                  </label>
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    value={forgotConfirm}
                    onChange={(e) => setForgotConfirm(e.target.value)}
                    placeholder="••••••••"
                    disabled={resetting}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-darkBorder bg-gray-50 dark:bg-darkCard/50 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setForgotModalOpen(false);
                  setForgotEmail('');
                  setForgotPassword('');
                  setForgotConfirm('');
                }}
                disabled={resetting}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-darkBorder text-gray-500 hover:bg-gray-150 dark:hover:bg-darkBorder/40 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resetting}
                className="px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-semibold flex items-center space-x-1.5"
              >
                {resetting ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Login;
