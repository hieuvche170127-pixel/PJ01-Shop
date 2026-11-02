import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { MdClose } from "react-icons/md";
import { HiMenuAlt2 } from "react-icons/hi";
import { useDispatch, useSelector } from "react-redux";
import { logo } from "../../../assets/images";
import { navBarList } from "../../../constants";
import { logout } from "../../../features/auth/authSlice";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  useEffect(() => { setMenuOpen(false); }, [location.pathname, location.search]);

  const links = [...navBarList];
  if (isAuthenticated && user?.role === "seller") links.push({ _id: "seller", title: "Seller Dashboard", link: "/overview" });
  if (isAuthenticated && user?.role === "admin") links.push({ _id: "admin", title: "Admin Dashboard", link: "/admin" });
  const signOut = () => { dispatch(logout()); setMenuOpen(false); navigate("/signin"); };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <nav aria-label="Main navigation" className="max-w-container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
        <Link to="/" aria-label="Shopii home"><img src={logo} alt="Shopii" className="w-32" /></Link>
        <button type="button" className="lg:hidden p-2 text-[#0F52BA]" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="main-menu" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <MdClose size={26} /> : <HiMenuAlt2 size={26} />}
        </button>
        <div id="main-menu" className={`${menuOpen ? "flex" : "hidden"} w-full lg:w-auto lg:flex flex-col lg:flex-row lg:items-center gap-4`}>
          <ul className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {links.map(({ _id, title, link }) => <li key={_id}>
              <NavLink end={link === "/"} to={link} onClick={() => setMenuOpen(false)} className={({ isActive }) => `block py-2 hover:text-[#0F52BA] ${isActive ? "text-[#0F52BA] font-semibold" : "text-gray-600"}`}>{title}</NavLink>
            </li>)}
          </ul>
          {isAuthenticated ? <div className="flex flex-wrap items-center gap-3 lg:border-l lg:pl-5">
            <span className="text-gray-700 break-all">Hello, {user?.username}</span>
            {user?.role === "buyer" && <Link to="/store-registration" className="border border-[#0F52BA] text-[#0F52BA] px-3 py-2 rounded">Become a Seller</Link>}
            <button onClick={signOut} className="bg-[#0F52BA] text-white px-4 py-2 rounded hover:bg-[#0A3C8A]">Logout</button>
          </div> : <div className="flex gap-3">
            <Link to="/signin" className="bg-[#0F52BA] text-white px-4 py-2 rounded hover:bg-[#0A3C8A]">Sign In</Link>
            <Link to="/signup" className="border border-[#0F52BA] text-[#0F52BA] px-4 py-2 rounded">Sign Up</Link>
          </div>}
        </div>
      </nav>
    </header>
  );
};
export default Header;
