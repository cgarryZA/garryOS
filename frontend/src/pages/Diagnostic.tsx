/**
 * Diagnostic page to test API connectivity and debug issues
 */
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function DiagnosticPage() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [backendMessage, setBackendMessage] = useState('');
  const [apiTests, setApiTests] = useState<Record<string, any>>({});

  useEffect(() => {
    testBackend();
  }, []);

  const testBackend = async () => {
    // Test 1: Health check
    try {
      const response = await axios.get('http://localhost:8000/health');
      setBackendStatus('connected');
      setBackendMessage(JSON.stringify(response.data, null, 2));

      setApiTests(prev => ({
        ...prev,
        health: { status: 'success', data: response.data }
      }));

      // Test 2: List programs
      testListPrograms();
    } catch (error: any) {
      setBackendStatus('error');
      setBackendMessage(error.message || 'Failed to connect');

      setApiTests(prev => ({
        ...prev,
        health: { status: 'error', error: error.message }
      }));
    }
  };

  const testListPrograms = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/degrees/programs');
      setApiTests(prev => ({
        ...prev,
        programs: { status: 'success', data: response.data }
      }));
    } catch (error: any) {
      setApiTests(prev => ({
        ...prev,
        programs: { status: 'error', error: error.message }
      }));
    }
  };

  const testCreateProgram = async () => {
    try {
      const response = await axios.post('http://localhost:8000/api/degrees/programs', {
        name: 'Test Degree Program',
        target_grade: 70,
        total_credits_required: 360
      });

      setApiTests(prev => ({
        ...prev,
        createProgram: { status: 'success', data: response.data }
      }));

      alert('Program created successfully! Check the console.');
    } catch (error: any) {
      setApiTests(prev => ({
        ...prev,
        createProgram: { status: 'error', error: error.message, details: error.response?.data }
      }));

      alert('Failed to create program. Check the console.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">HomeOS Diagnostic Page</h1>

      {/* Backend Status */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Backend Status</h2>
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${
            backendStatus === 'checking' ? 'bg-yellow-500 animate-pulse' :
            backendStatus === 'connected' ? 'bg-green-500' :
            'bg-red-500'
          }`}></div>
          <span className="font-semibold">
            {backendStatus === 'checking' ? 'Checking...' :
             backendStatus === 'connected' ? 'Connected' :
             'Not Connected'}
          </span>
        </div>

        {backendMessage && (
          <pre className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto">
            {backendMessage}
          </pre>
        )}
      </div>

      {/* API Tests */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">API Tests</h2>

        <div className="space-y-4">
          {Object.entries(apiTests).map(([key, result]) => (
            <div key={key} className="border-b pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${
                  result.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="font-semibold capitalize">{key}</span>
              </div>

              <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>

      {/* Test Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Test Actions</h2>

        <div className="space-y-3">
          <button
            onClick={testBackend}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Re-test Backend Connection
          </button>

          <button
            onClick={testCreateProgram}
            className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Test Create Program
          </button>

          <button
            onClick={() => window.location.href = 'http://localhost:8000/docs'}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Open API Docs (Swagger)
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
        <h3 className="font-bold text-yellow-800 mb-2">Troubleshooting Steps:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-800">
          <li>Check if Docker containers are running: <code className="bg-yellow-100 px-1">docker ps</code></li>
          <li>Verify backend is accessible: <code className="bg-yellow-100 px-1">curl http://localhost:8000/health</code></li>
          <li>Check frontend console for errors (F12 → Console tab)</li>
          <li>Verify CORS is configured correctly in backend</li>
          <li>Check if buttons have event listeners (inspect element → Event Listeners)</li>
        </ol>
      </div>

      {/* Browser Info */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-xl font-bold mb-4">Browser Information</h2>
        <pre className="text-sm bg-gray-50 p-4 rounded overflow-auto">
{`User Agent: ${navigator.userAgent}
Platform: ${navigator.platform}
Language: ${navigator.language}
Online: ${navigator.onLine}
Cookies Enabled: ${navigator.cookieEnabled}`}
        </pre>
      </div>
    </div>
  );
}
