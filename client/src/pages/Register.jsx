import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileText, UserPlus, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const PRESET_AVATARS = [
  { name: 'Aditya', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aditya' },
  { name: 'Aria', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aria' },
  { name: 'Milo', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo' },
  { name: 'Luna', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna' },
  { name: 'Felix', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix' },
  { name: 'Zara', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Zara' },
];

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0].url);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(name, email, password, selectedAvatar);
      toast.success('Registration successful! Welcome to CollabDocs.');
      navigate('/');
    } catch (err) {
      toast.error(err || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-darkBg flex items-center justify-center p-4 sm:p-6 transition-colors duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-darkCard rounded-3xl border border-gray-100 dark:border-darkBorder shadow-xl p-8 space-y-6 relative overflow-hidden transition-all duration-300">
        
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-400/10 dark:bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-sky-400/10 dark:bg-sky-500/10 rounded-full blur-3xl" />

        {/* Logo and title */}
        <div className="flex flex-col items-center text-center">
          <div className="p-3.5 bg-primary-500 rounded-2xl text-white shadow-lg shadow-primary-500/30 mb-4 animate-bounce">
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Create Account
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
            Sign up to build, edit, and collaborate in real-time
          </p>
        </div>

        {/* SignUp Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                disabled={isSubmitting}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-darkBorder bg-gray-50/50 dark:bg-darkCard/50 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              />
            </div>

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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className="w-full pl-4 pr-12 py-3 rounded-2xl border border-gray-200 dark:border-darkBorder bg-gray-50/50 dark:bg-darkCard/50 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-655 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-darkBorder bg-gray-50/50 dark:bg-darkCard/50 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-mono"
              />
            </div>
          </div>

          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Choose Avatar
            </label>
            <div className="grid grid-cols-6 gap-2 sm:gap-3">
              {PRESET_AVATARS.map((avatar) => (
                <button
                  key={avatar.name}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar.url)}
                  disabled={isSubmitting}
                  className={`relative p-1 rounded-2xl border-2 overflow-hidden transition-all ${
                    selectedAvatar === avatar.url
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20 scale-105'
                      : 'border-gray-200 dark:border-darkBorder hover:border-gray-300 dark:hover:border-darkBorder/80'
                  }`}
                >
                  <img
                    src={avatar.url}
                    alt={avatar.name}
                    className="w-full h-10 object-contain rounded-xl"
                  />
                </button>
              ))}
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
                <UserPlus className="w-5 h-5" />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 font-semibold underline transition-all"
            >
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
