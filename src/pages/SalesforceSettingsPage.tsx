import { useState, useEffect } from 'react';
import { Database, Check, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { db, supabase } from '../lib/supabase';

interface SfConnectionForm {
  consumer_key: string;
  consumer_secret: string;
  username: string;
  password: string;
  security_token: string;
}

export function SalesforceSettingsPage() {
  const [form, setForm] = useState<SfConnectionForm>({
    consumer_key: '',
    consumer_secret: '',
    username: '',
    password: '',
    security_token: '',
  });
  const [showSecrets, setShowSecrets] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadConnection();
  }, []);

  const loadConnection = async () => {
    try {
      const { data } = await db.sfConnection().select('*').single();
      if (data) {
        const sfData = data as {
          consumer_key?: string;
          username?: string;
          access_token_encrypted?: string;
        };
        setForm({
          consumer_key: sfData.consumer_key || '',
          consumer_secret: '', // Don't load encrypted secrets
          username: sfData.username || '',
          password: '',
          security_token: '',
        });
        setConnected(!!sfData.access_token_encrypted);
      }
    } catch {
      // No connection yet, that's fine
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Call Edge Function to save credentials securely and test connection
      const { data, error } = await supabase.functions.invoke('salesforce-connect', {
        body: {
          consumer_key: form.consumer_key,
          consumer_secret: form.consumer_secret,
          username: form.username,
          password: form.password + form.security_token,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSuccess('Salesforce connection saved successfully!');
      setConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save connection');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('salesforce-test', {
        body: {},
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSuccess('Connection test successful!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Salesforce Connection</h1>
        <p className="text-neutral-500 mt-1">
          Connect your Salesforce org to import reports and data
        </p>
      </div>

      {/* Connection status */}
      <div
        className={`p-4 rounded-xl border mb-6 ${
          connected
            ? 'bg-green-50 border-green-200'
            : 'bg-neutral-50 border-neutral-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              connected ? 'bg-green-100' : 'bg-neutral-200'
            }`}
          >
            {connected ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <Database className="w-5 h-5 text-neutral-500" />
            )}
          </div>
          <div>
            <p className="font-medium text-neutral-900">
              {connected ? 'Connected' : 'Not Connected'}
            </p>
            <p className="text-sm text-neutral-500">
              {connected
                ? 'Your Salesforce org is connected and ready'
                : 'Enter your credentials below to connect'}
            </p>
          </div>
          {connected && (
            <button
              onClick={testConnection}
              disabled={testing}
              className="ml-auto px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-2"
            >
              {testing && <Loader2 className="w-4 h-4 animate-spin" />}
              Test Connection
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Consumer Key
            </label>
            <input
              type="text"
              value={form.consumer_key}
              onChange={(e) => setForm({ ...form, consumer_key: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="From your Connected App"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Consumer Secret
            </label>
            <div className="relative">
              <input
                type={showSecrets ? 'text' : 'password'}
                value={form.consumer_secret}
                onChange={(e) => setForm({ ...form, consumer_secret: e.target.value })}
                required={!connected}
                className="w-full px-4 py-2.5 pr-10 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={connected ? '••••••••' : 'From your Connected App'}
              />
              <button
                type="button"
                onClick={() => setShowSecrets(!showSecrets)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showSecrets ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Username
            </label>
            <input
              type="email"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="admin@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Password
            </label>
            <input
              type={showSecrets ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!connected}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={connected ? '••••••••' : 'Your Salesforce password'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Security Token
            </label>
            <input
              type={showSecrets ? 'text' : 'password'}
              value={form.security_token}
              onChange={(e) => setForm({ ...form, security_token: e.target.value })}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional - required for some orgs"
            />
            <p className="mt-1 text-xs text-neutral-500">
              Found in Salesforce under Settings → Reset Security Token
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {connected ? 'Update Connection' : 'Connect Salesforce'}
          </button>
        </div>
      </form>

      {/* Help section */}
      <div className="mt-8 p-6 bg-neutral-50 rounded-xl border border-neutral-200">
        <h3 className="font-medium text-neutral-900 mb-3">Setup Instructions</h3>
        <ol className="space-y-2 text-sm text-neutral-600">
          <li>1. In Salesforce, go to Setup → Apps → App Manager</li>
          <li>2. Click "New Connected App"</li>
          <li>3. Enable OAuth Settings and add "Full access" scope</li>
          <li>4. Set Callback URL to: <code className="bg-neutral-200 px-1 rounded">https://login.salesforce.com/services/oauth2/callback</code></li>
          <li>5. Save and copy the Consumer Key and Consumer Secret</li>
        </ol>
      </div>
    </div>
  );
}
