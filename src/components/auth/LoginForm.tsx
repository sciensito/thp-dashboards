import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Loader2, LayoutDashboard } from 'lucide-react';

export function LoginForm() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      }
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for the confirmation link.');
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <LayoutDashboard className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">SF Dashboards</h1>
              <p className="text-sm text-neutral-500">Salesforce Report Visualizer</p>
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-neutral-500 mb-6">
            {isLogin
              ? 'Sign in to access your dashboards'
              : 'Get started with your dashboard today'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {message && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setMessage(null);
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
