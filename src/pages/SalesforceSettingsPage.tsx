import { useState, useEffect } from 'react';
import { Database, Check, AlertCircle, Loader2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { db, supabase } from '../lib/supabase';

interface SfConnectionForm {
  consumer_key: string;
  consumer_secret: string;
}

export function SalesforceSettingsPage() {
  const [form, setForm] = useState<SfConnectionForm>({
    consumer_key: '',
    consumer_secret: '',
  });
  const [showSecrets, setShowSecrets] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [instanceUrl, setInstanceUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      // Wait for auth to be ready
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await loadConnection();

      // Check for OAuth callback
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code) {
        // Clean up URL first
        window.history.replaceState({}, '', window.location.pathname);
        await handleOAuthCallback(code);
      }
    };
    init();
  }, []);

  const loadConnection = async () => {
    try {
      const { data } = await db.sfConnection().select('*').single();
      if (data) {
        const sfData = data as {
          consumer_key?: string;
          instance_url?: string;
          access_token_encrypted?: string;
        };
        setForm({
          consumer_key: sfData.consumer_key || '',
          consumer_secret: '',
        });
        setInstanceUrl(sfData.instance_url || null);
        setConnected(!!sfData.access_token_encrypted);
      }
    } catch {
      // No connection yet
    }
  };

  const handleOAuthCallback = async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      const redirectUri = window.location.origin + '/salesforce';

      // Exchange code for tokens via Edge Function (to avoid CORS)
      const { data, error } = await supabase.functions.invoke('salesforce-oauth-callback', {
        body: {
          code,
          redirect_uri: redirectUri,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error_description || data.error);

      setSuccess('Salesforce connected successfully!');
      setConnected(true);
      setInstanceUrl(data.instance_url);
      loadConnection(); // Reload to get updated state
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete OAuth');
    } finally {
      setLoading(false);
    }
  };

  const saveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Check if record exists
      const { data: existing } = await db.sfConnection().select('id').single();

      if (existing) {
        // Update existing
        const { error } = await db.sfConnection()
          .update({
            consumer_key: form.consumer_key,
            consumer_secret_encrypted: form.consumer_secret,
            updated_at: new Date().toISOString(),
          })
          .eq('id', (existing as { id: string }).id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await db.sfConnection()
          .insert({
            consumer_key: form.consumer_key,
            consumer_secret_encrypted: form.consumer_secret,
            username: '',
            password_encrypted: '',
          });

        if (error) throw error;
      }

      setSuccess('Credentials saved! Click "Connect with Salesforce" to authorize.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save credentials');
    } finally {
      setLoading(false);
    }
  };

  const startOAuth = () => {
    if (!form.consumer_key) {
      setError('Please enter and save your Consumer Key first');
      return;
    }

    const redirectUri = encodeURIComponent(window.location.origin + '/salesforce');
    const clientId = encodeURIComponent(form.consumer_key);
    const authUrl = `https://login.salesforce.com/services/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=api%20refresh_token`;

    window.location.href = authUrl;
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

  const disconnect = async () => {
    setLoading(true);
    try {
      const { error } = await db.sfConnection()
        .update({
          access_token_encrypted: null,
          refresh_token_encrypted: null,
          instance_url: null,
        })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      setConnected(false);
      setInstanceUrl(null);
      setSuccess('Disconnected from Salesforce');
    } catch {
      setError('Failed to disconnect');
    } finally {
      setLoading(false);
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
          <div className="flex-1">
            <p className="font-medium text-neutral-900">
              {connected ? 'Connected' : 'Not Connected'}
            </p>
            <p className="text-sm text-neutral-500">
              {connected && instanceUrl
                ? `Connected to ${instanceUrl}`
                : 'Enter your credentials and authorize access'}
            </p>
          </div>
          {connected && (
            <div className="flex gap-2">
              <button
                onClick={testConnection}
                disabled={testing}
                className="px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-2"
              >
                {testing && <Loader2 className="w-4 h-4 animate-spin" />}
                Test
              </button>
              <button
                onClick={disconnect}
                className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Credentials Form */}
      <form onSubmit={saveCredentials} className="bg-white rounded-xl border border-neutral-200 p-6">
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
              placeholder="From your External Client App"
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
                placeholder={connected ? '••••••••' : 'From your External Client App'}
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
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-green-50 border green-200 rounded-lg flex items-start gap-2">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {!connected && (
            <>
              <button
                type="submit"
                disabled={loading || !form.consumer_key || !form.consumer_secret}
                className="w-full py-2.5 bg-neutral-100 text-neutral-700 font-medium rounded-lg hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Credentials
              </button>
              <button
                type="button"
                onClick={startOAuth}
                disabled={!form.consumer_key}
                className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Connect with Salesforce
              </button>
            </>
          )}
          {connected && (
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Update Credentials
            </button>
          )}
        </div>
      </form>

      {/* Help section */}
      <div className="mt-8 p-6 bg-neutral-50 rounded-xl border border-neutral-200">
        <h3 className="font-medium text-neutral-900 mb-3">Setup Instructions</h3>
        <ol className="space-y-2 text-sm text-neutral-600">
          <li>1. In Salesforce Setup, go to External Client App Manager</li>
          <li>2. Create or edit your External Client App</li>
          <li>3. Add OAuth scopes: <code className="bg-neutral-200 px-1 rounded">api</code>, <code className="bg-neutral-200 px-1 rounded">refresh_token</code></li>
          <li>4. <strong>Important:</strong> Set Callback URL to:</li>
          <li className="ml-4"><code className="bg-neutral-200 px-1 rounded text-xs break-all">{window.location.origin}/salesforce</code></li>
          <li>5. Enable "Authorization Code and Credentials Flow"</li>
          <li>6. Copy Consumer Key and Secret from the Settings tab</li>
          <li>7. Save credentials here, then click "Connect with Salesforce"</li>
        </ol>
      </div>
    </div>
  );
}
