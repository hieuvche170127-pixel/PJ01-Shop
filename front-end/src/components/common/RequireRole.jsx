import { useSelector } from 'react-redux';
import { Link, Navigate, useLocation } from 'react-router-dom';

export default function RequireRole({ role, children }) {
  const { token, user } = useSelector(state => state.auth);
  const location = useLocation();
  if (!token || !user) return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  if (user.role !== role) return (
    <main className="max-w-xl mx-auto p-10 text-center">
      <h1 className="text-2xl font-bold mb-4">Không có quyền truy cập</h1>
      <p className="mb-6">Tài khoản hiện tại không được phép sử dụng trang này.</p>
      <Link className="text-blue-700 underline" to="/">Về trang chủ</Link>
    </main>
  );
  return children;
}
