import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../utils/apiUrl';
export default function ResetPassword() {
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const submit = async event => {
    event.preventDefault();
    if (password !== confirm) return setError('Hai mật khẩu chưa khớp');
    setBusy(true); setError('');
    try { await axios.post(API_URL + '/reset-password', { token, newPassword: password }); setDone(true); window.history.replaceState(null, '', '/reset-password'); }
    catch (e) { setError(e.response?.data?.message || 'Không thể đặt lại mật khẩu'); }
    finally { setBusy(false); }
  };
  return <main className="max-w-md mx-auto my-16 p-6 border rounded-lg">
    <h1 className="text-2xl font-bold mb-5">Đặt lại mật khẩu</h1>
    {done ? <p role="status">Đã đổi mật khẩu. <Link to="/signin" className="text-blue-600">Đăng nhập lại</Link></p> : !token ? <p>Hãy mở liên kết trong email hoặc <Link to="/forgot-password" className="text-blue-600">yêu cầu liên kết mới</Link>.</p> : <form onSubmit={submit}>
      <label className="block mb-4">Mật khẩu mới<input className="border p-2 w-full" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={password} onChange={e => setPassword(e.target.value)} /></label>
      <label className="block mb-4">Nhập lại mật khẩu<input className="border p-2 w-full" type="password" autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
      {error && <p role="alert" className="text-red-600 mb-3">{error}</p>}
      <button className="bg-blue-600 text-white p-2 rounded" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu mật khẩu'}</button>
    </form>}
  </main>;
}
