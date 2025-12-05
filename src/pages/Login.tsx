import React, { useState } from 'react';
import { useAuth } from './authLoginSample/AuthContext';

const inputClass = "w-full px-4 py-3 border rounded-lg outline-none transition focus:border-blue-500 focus:shadow";

const Login = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [remember, setRemember] = useState<boolean>(false);
  // mới thêm
  const [error, setError] = useState<string>('');
  const {login} = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: replace with real authentication (call API, redux action, etc.)
    setError('');

    const success = login(username, password);
    sessionStorage.setItem("justLoggedIn", "1");
    if (!success) {
      setError('Invalid username or password');
      return;
    }
    console.log({ username, password, remember });
  };

  return (
    <div className="min-h-[50vh] flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl shadow my-4 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-700!">Welcome Back</h1>
          <p className="text-xs text-gray-700!">Please login to your account</p>
        </div>

        <div className="my-3 px-4 flex flex-col gap-3">
          <input
            aria-label="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className={inputClass}
          />

          <input
            aria-label="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className={inputClass}
          />

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 accent-blue-500"
              />
              <span className="text-gray-600">Remember me</span>
            </div>

            <a href="/forgot-password" className="text-blue-400 text-decoration-none font-semibold">Forgot password?</a>
          </div>
        </div>

        <div className='px-4'>
        <button
          type="submit"
          className="w-full bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-500 focus:ring-4 focus:ring-blue-200 transition py-3 mb-2"
        >
          Login
        </button>

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="#support" className="text-blue-500 font-semibold text-decoration-none">Contact IT</a>
        </p>
        </div>
        {/* Hiển thị lỗi nếu có */}
        {error && (
          <div className="mx-4 mt-3 p-3 bg-red-50 border-l-4 border-red-500 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

<div className="my-4 px-4">
  <div className="my-2">
    
    {/* PQC 1 */}
    <div className="flex items-center gap-2 text-sm">
      <span className="w-16 text-right text-gray-500 text-xs">PQC:</span>
      <code className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-semibold">pqc1</code>
      <span className="text-gray-300">/</span>
      <code className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-semibold">123</code>
    </div>

    {/* PQC 2 */}
    <div className="flex items-center gap-2 text-sm">
      <span className="w-16 text-right text-gray-500 text-xs">PQC:</span>
      <code className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-semibold">pqc2</code>
      <span className="text-gray-300">/</span>
      <code className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-semibold">123</code>
    </div>

    {/* ENG */}
    <div className="flex items-center gap-2 text-sm">
      <span className="w-16 text-right text-gray-500 text-xs">ENG:</span>
      <code className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-semibold">eng1</code>
      <span className="text-gray-300">/</span>
      <code className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-semibold">123</code>
    </div>

    {/* SUPERVISOR */}
    <div className="flex items-center gap-2 text-sm">
      <span className="w-16 text-right text-gray-500 text-xs">SUP:</span>
      <code className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-semibold">sup1</code>
      <span className="text-gray-300">/</span>
      <code className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-semibold">123</code>
    </div>

    {/* MANAGER */}
    <div className="flex items-center gap-2 text-sm">
      <span className="w-16 text-right text-gray-500 text-xs">MGR:</span>
      <code className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-semibold">mgr1</code>
      <span className="text-gray-300">/</span>
      <code className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-semibold">123</code>
    </div>

    {/* MANAGER KOREA */}
    <div className="flex items-center gap-2 text-sm">
      <span className="w-16 text-right text-gray-500 text-xs">MGR_KR:</span>
      <code className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-semibold">kmgr1</code>
      <span className="text-gray-300">/</span>
      <code className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-semibold">123</code>
    </div>
  </div>
</div>
      </form>
    </div>
  );
};

export default Login;
