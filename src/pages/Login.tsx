import React, { useState } from 'react';

const inputClass = "w-full px-4 py-3 border rounded-lg outline-none transition focus:border-blue-500 focus:shadow";

const Login = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [remember, setRemember] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: replace with real authentication (call API, redux action, etc.)
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
      </form>
    </div>
  );
};

export default Login;
