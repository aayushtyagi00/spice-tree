import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  ShoppingBag, 
  Phone, 
  Calendar, 
  Utensils, 
  Menu as MenuIcon, 
  X, 
  User, 
  LogIn, 
  LogOut,
  ShieldCheck, 
  ChevronRight, 
  ChevronDown,
  PackageCheck, 
  ChefHat 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    cartCount,
    setIsCartOpen,
    setIsReservationModalOpen,
    user,
    logout,
    setIsAuthModalOpen,
    latestActiveOrder
  } = useCart();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isTrackerDismissed, setIsTrackerDismissed] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Reset dismissed state whenever active order changes or status updates
  useEffect(() => {
    setIsTrackerDismissed(false);
  }, [latestActiveOrder?.id, latestActiveOrder?.status]);

  // Close profile dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Lock body scroll when mobile drawer is active
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'menu', label: 'Order Online' },
    { id: 'about', label: 'About Spice Tree' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#fbfaee]/95 backdrop-blur-md border-b border-[#e5e1d5] shadow-xs">
      {/* Top micro-announcement bar */}
      <div className="bg-[#1b4332] text-[#c1ecd4] px-4 py-1.5 text-xs font-medium flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold tracking-wide">100% Pure Vegetarian & Jain Kitchen</span>
            <span className="hidden sm:inline text-emerald-300/70">|</span>
            <span className="hidden sm:inline text-emerald-200">G.T. Road, Phagwara • Open Today: 11:00 AM – 11:00 PM</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <a href="tel:+919876543210" className="hover:text-white flex items-center gap-1 transition-colors">
              <Phone className="w-3 text-[#ffdf96]" />
              <span className="hidden md:inline">+91 98765 43210</span>
            </a>
            <span className="bg-[#2d6a4f] text-[#ffdf96] px-2 py-0.5 rounded-full font-semibold">
              ⭐ 4.4 on Google (1,200+ Reviews)
            </span>
          </div>
        </div>
      </div>

      {/* Main navigation container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink min-w-0">
            <button
              id="brand-logo-btn"
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2 sm:gap-3 text-left group transition-transform focus:outline-none min-w-0"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-[#a03f28] to-[#812914] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
                <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-[#ffdad2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-serif text-lg sm:text-2xl font-bold tracking-tight text-[#1b1c15] group-hover:text-[#a03f28] transition-colors whitespace-nowrap">
                    Spice Tree
                  </span>
                  <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-xs border-2 border-emerald-600 flex items-center justify-center p-0.5 flex-shrink-0" title="Pure Veg">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  </span>
                </div>
                <p className="text-[9.5px] sm:text-[11px] font-medium text-[#56423d] tracking-wider uppercase whitespace-nowrap">
                  Pure Veg • Phagwara
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#efeee3]/80 p-1 rounded-full border border-[#e5e1d5]">
            {navLinks.map(link => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  id={`nav-link-${link.id}`}
                  onClick={() => setActiveTab(link.id as any)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#a03f28] text-white shadow-xs'
                      : 'text-[#56423d] hover:text-[#1b1c15] hover:bg-white/60'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Action CTAs & Cart */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {/* Table Reservation Button */}
            <button
              id="reserve-table-nav-btn"
              onClick={() => setIsReservationModalOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-[#1b4332] bg-[#beead1]/60 hover:bg-[#beead1] border border-[#a3d9bc] transition-all cursor-pointer shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Reserve Table</span>
            </button>

            {/* Admin Terminal Button - Visible to super admin or active admin session */}
            {(user?.email?.toLowerCase() === 'tyagiaayush3030@gmail.com' || (typeof window !== 'undefined' && localStorage.getItem('spicetree_admin_session') !== null)) && (
              <button
                id="nav-admin-portal-btn"
                onClick={() => setActiveTab('admin')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-[#56423d] hover:text-[#1b1c15] bg-[#f5f4e8] hover:bg-[#eae8d8] border border-[#e5e1d5] transition-all cursor-pointer"
                title="Access Admin & Kitchen Portal"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#a03f28]" />
                <span>Admin</span>
              </button>
            )}

            {/* Login / Profile Menu Button & Dropdown (Desktop only: on mobile, all profile actions are inside the menu drawer) */}
            <div className="relative hidden md:block" ref={profileDropdownRef}>
              <button
                id="profile-dropdown-trigger-btn"
                onClick={() => setProfileDropdownOpen(prev => !prev)}
                className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-full text-xs font-semibold text-[#1b1c15] bg-white hover:bg-stone-50 border border-[#e5e1d5] hover:border-[#a03f28] transition-all cursor-pointer shadow-2xs flex-shrink-0"
                aria-expanded={profileDropdownOpen}
                aria-label="User profile and orders menu"
              >
                {/* Active live order indicator pulse dot on profile icon */}
                {latestActiveOrder && latestActiveOrder.status !== 'Delivered' && latestActiveOrder.status !== 'Cancelled' && (
                  <span className="absolute -top-1 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600 ring-2 ring-white"></span>
                  </span>
                )}

                {user ? (
                  <>
                    <div className="w-5 h-5 rounded-full bg-[#1b4332] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {(user.displayName?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
                    </div>
                    <span className="truncate max-w-[65px] sm:max-w-[85px] font-semibold text-[#1b1c15]">
                      {user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Account'}
                    </span>
                    <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </>
                ) : (
                  <>
                    <User className="w-3.5 h-3.5 text-[#a03f28] flex-shrink-0" />
                    <span>Profile</span>
                    <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>

              {/* Profile Dropdown Popover */}
              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-[#e5e1d5] overflow-hidden z-50 p-2 space-y-1.5"
                  >
                    {/* User Profile Header */}
                    <div className="p-3 bg-[#fbfaee] rounded-xl border border-[#e5e1d5]/80 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#1b4332] text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-xs">
                        {(user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-[#1b1c15] truncate">
                          {user ? (user.displayName || user.email?.split('@')[0]) : 'Guest Patron'}
                        </h4>
                        <p className="text-[11px] text-[#56423d] truncate font-mono">
                          {user ? user.email : 'Spice Tree Pure Veg'}
                        </p>
                      </div>
                    </div>

                    {/* Active Order Spotlight Banner (if an order is currently cooking or out) */}
                    {latestActiveOrder && latestActiveOrder.status !== 'Delivered' && latestActiveOrder.status !== 'Cancelled' && (
                      <div 
                        id="profile-active-order-spotlight"
                        onClick={() => {
                          setActiveTab('confirmation');
                          setProfileDropdownOpen(false);
                        }}
                        className="p-3 rounded-xl bg-linear-to-br from-[#fef3f0] to-[#fdede8] border border-[#ffdad2] cursor-pointer hover:bg-[#fae4de] transition-colors"
                      >
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                            <span className="text-[11px] font-bold text-[#a03f28]">Live Food Status</span>
                          </div>
                          <span className="text-[10px] font-bold bg-[#a03f28] text-white px-2 py-0.5 rounded-full">
                            {latestActiveOrder.status}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#1b1c15]">Order #{latestActiveOrder.orderNumber}</p>
                        <p className="text-[10.5px] text-[#56423d] flex items-center justify-between mt-1">
                          <span>{latestActiveOrder.estimatedDeliveryTime || 'Kitchen preparing food'}</span>
                          <span className="text-[#a03f28] font-bold">Track Live →</span>
                        </p>
                      </div>
                    )}

                    {/* Menu Options */}
                    <div className="space-y-0.5 pt-1">
                      {/* My Orders & Food Status */}
                      <button
                        id="profile-menu-my-orders-btn"
                        onClick={() => {
                          setActiveTab('orders');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-[#1b1c15] hover:bg-[#f5f4e8] transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#f5f4e8] group-hover:bg-white flex items-center justify-center text-[#a03f28] transition-colors shadow-2xs">
                            <PackageCheck className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <div className="font-bold text-[#1b1c15]">My Orders & Food Status</div>
                            <div className="text-[10px] text-stone-500 font-normal">View order history & live kitchen updates</div>
                          </div>
                        </div>
                        {latestActiveOrder && latestActiveOrder.status !== 'Delivered' && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </button>

                      {/* Reserve a Table */}
                      <button
                        id="profile-menu-reserve-btn"
                        onClick={() => {
                          setIsReservationModalOpen(true);
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#1b1c15] hover:bg-[#f5f4e8] transition-colors cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#f5f4e8] group-hover:bg-white flex items-center justify-center text-[#1b4332] transition-colors shadow-2xs">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-[#1b1c15]">Reserve a Table</div>
                          <div className="text-[10px] text-stone-500 font-normal">Dine-in booking at Phagwara</div>
                        </div>
                      </button>

                      {/* Admin Portal (if admin email) */}
                      {user?.email && user.email.toLowerCase() === 'tyagiaayush3030@gmail.com' && (
                        <button
                          id="profile-menu-admin-btn"
                          onClick={() => {
                            setActiveTab('admin');
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#1b1c15] hover:bg-[#f5f4e8] transition-colors cursor-pointer group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-[#ffdad2] flex items-center justify-center text-[#a03f28] shadow-2xs">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <div className="font-bold text-[#1b1c15]">Admin & Kitchen Portal</div>
                            <div className="text-[10px] text-stone-500 font-normal">Manage orders & inventory</div>
                          </div>
                        </button>
                      )}

                      {/* Profile details / modal */}
                      <button
                        id="profile-menu-account-btn"
                        onClick={() => {
                          setIsAuthModalOpen(true);
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#1b1c15] hover:bg-[#f5f4e8] transition-colors cursor-pointer group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#f5f4e8] group-hover:bg-white flex items-center justify-center text-stone-600 transition-colors shadow-2xs">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-[#1b1c15]">{user ? 'Account Settings' : 'Sign In / Register'}</div>
                          <div className="text-[10px] text-stone-500 font-normal">{user ? 'Manage preferences & profile' : 'Save addresses & track orders'}</div>
                        </div>
                      </button>
                    </div>

                    {/* Sign out button if logged in */}
                    {user && (
                      <div className="pt-1 border-t border-[#e5e1d5]/80">
                        <button
                          id="profile-menu-logout-btn"
                          onClick={async () => {
                            await logout();
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart Trigger Button */}
            <button
              id="cart-drawer-trigger-btn"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center justify-center gap-1.5 md:gap-2 p-2 sm:px-3.5 md:px-4 py-2 rounded-full bg-[#a03f28] hover:bg-[#853420] text-white font-medium text-sm transition-all shadow-sm hover:shadow-md cursor-pointer group flex-shrink-0"
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <ShoppingBag className="w-4 h-4 text-[#ffdad2] group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="hidden md:inline font-semibold">Cart</span>
              {cartCount > 0 && (
                <span className="md:static absolute -top-1 -right-1 md:top-auto md:right-auto bg-[#ffdf96] text-[#6d5100] text-[10px] md:text-xs font-bold min-w-4.5 h-4.5 md:w-5 md:h-5 px-1 rounded-full flex items-center justify-center shadow-xs border border-[#a03f28] md:border-none">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="md:hidden relative p-2.5 rounded-xl text-[#56423d] hover:text-[#1b1c15] bg-[#efeee3]/70 hover:bg-[#efeee3] border border-[#e5e1d5] transition-all cursor-pointer flex-shrink-0 flex items-center justify-center"
              aria-label="Toggle Navigation and Account Menu"
            >
              {/* Active order indicator pulse dot on mobile menu button */}
              {latestActiveOrder && latestActiveOrder.status !== 'Delivered' && latestActiveOrder.status !== 'Cancelled' && (
                <span className="absolute -top-1 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600 ring-2 ring-white"></span>
                </span>
              )}
              <MenuIcon className="w-5 h-5 text-[#1b1c15]" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Animated Mobile Navigation Drawer & Overlay (Mounted via Portal directly to body) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {mobileMenuOpen && (
              <div className="fixed inset-0 z-9999 md:hidden flex justify-end">
                {/* Backdrop Blur Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="fixed inset-0 bg-black/50 backdrop-blur-xs"
                  id="mobile-menu-backdrop"
                />

                {/* Slide-over Drawer Panel */}
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                  className="relative z-10 w-[84vw] max-w-[340px] h-[100dvh] bg-[#fbfaee] shadow-2xl border-l border-[#e5e1d5] flex flex-col justify-between overflow-y-auto"
                  id="mobile-menu-drawer-panel"
                >
                  {/* Drawer Header */}
                  <div>
                    <div className="p-4 border-b border-[#e5e1d5] flex items-center justify-between bg-[#f5f4e8]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#a03f28] to-[#812914] flex items-center justify-center text-white shadow-xs">
                          <Utensils className="w-4 h-4 text-[#ffdad2]" />
                        </div>
                        <div>
                          <h3 className="font-serif font-bold text-base text-[#1b1c15]">Spice Tree</h3>
                          <p className="text-[10px] text-[#56423d] font-medium">Pure Veg • Phagwara</p>
                        </div>
                      </div>
                      <button
                        id="mobile-menu-close-btn"
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-2 rounded-lg text-[#56423d] hover:text-[#1b1c15] hover:bg-[#eae8d8] transition-colors cursor-pointer"
                        aria-label="Close navigation"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* User Profile Card Header */}
                    <div className="p-3.5 bg-[#f5f4e8] border-b border-[#e5e1d5] flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-[#1b4332] text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-xs">
                          {(user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-[#1b1c15] truncate">
                            {user ? (user.displayName || user.email?.split('@')[0]) : 'Guest Patron'}
                          </h4>
                          <p className="text-[10.5px] text-[#56423d] truncate font-mono">
                            {user ? user.email : 'Spice Tree Pure Veg'}
                          </p>
                        </div>
                      </div>
                      <button
                        id="mobile-drawer-account-btn"
                        onClick={() => {
                          setIsAuthModalOpen(true);
                          setMobileMenuOpen(false);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-[#e5e1d5] text-[11px] font-bold text-[#1b1c15] hover:border-[#a03f28] shadow-2xs flex-shrink-0 cursor-pointer"
                      >
                        {user ? 'Settings' : 'Sign In'}
                      </button>
                    </div>

                    {/* Active Order Spotlight Banner */}
                    {latestActiveOrder && latestActiveOrder.status !== 'Delivered' && latestActiveOrder.status !== 'Cancelled' && (
                      <div className="p-3 bg-linear-to-br from-[#fef3f0] to-[#fdede8] border-b border-[#ffdad2]">
                        <div 
                          id="mobile-drawer-live-order-banner"
                          onClick={() => {
                            setActiveTab('confirmation');
                            setMobileMenuOpen(false);
                          }}
                          className="p-3 rounded-xl bg-white/95 border border-[#ffdad2] shadow-2xs cursor-pointer hover:bg-white transition-all"
                        >
                          <div className="flex items-center justify-between gap-1.5 mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                              <span className="text-[11px] font-bold text-[#a03f28]">Live Food Status</span>
                            </div>
                            <span className="text-[10px] font-bold bg-[#a03f28] text-white px-2 py-0.5 rounded-full">
                              {latestActiveOrder.status}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-[#1b1c15]">Order #{latestActiveOrder.orderNumber}</p>
                          <p className="text-[10.5px] text-[#56423d] flex items-center justify-between mt-1">
                            <span>{latestActiveOrder.estimatedDeliveryTime || 'Kitchen preparing food'}</span>
                            <span className="text-[#a03f28] font-bold">Track Live →</span>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Primary Nav Navigation Items */}
                    <div className="p-4 space-y-1.5">
                      <span className="text-[10px] font-bold text-[#56423d] uppercase tracking-wider px-2 block mb-2">
                        Navigation
                      </span>
                      {navLinks.map(link => {
                        const isActive = activeTab === link.id;
                        return (
                          <button
                            key={link.id}
                            id={`mobile-nav-${link.id}`}
                            onClick={() => {
                              setActiveTab(link.id as any);
                              setMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                              isActive
                                ? 'bg-[#a03f28] text-white shadow-xs'
                                : 'text-[#1b1c15] hover:bg-[#efeee3]'
                            }`}
                          >
                            <span>{link.label}</span>
                            <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white/80' : 'text-stone-400'}`} />
                          </button>
                        );
                      })}
                    </div>

                    {/* Profile & Dining Actions */}
                    <div className="px-4 pb-4 space-y-2 border-t border-[#e5e1d5] pt-3">
                      <span className="text-[10px] font-bold text-[#56423d] uppercase tracking-wider px-2 block mb-1">
                        Orders & Dining
                      </span>

                      {/* My Orders & Food Status */}
                      <button
                        id="mobile-my-orders-btn"
                        onClick={() => {
                          setActiveTab('orders');
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold bg-white text-[#1b1c15] border border-[#e5e1d5] hover:bg-[#f5f4e8] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <PackageCheck className="w-4 h-4 text-[#a03f28] flex-shrink-0" />
                          <span>My Orders & Food Status</span>
                        </div>
                        {latestActiveOrder && latestActiveOrder.status !== 'Delivered' && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </button>

                      {/* Reserve a Table */}
                      <button
                        id="mobile-reserve-btn"
                        onClick={() => {
                          setIsReservationModalOpen(true);
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-sm font-semibold bg-[#beead1]/70 hover:bg-[#beead1] text-[#1b4332] border border-[#a3d9bc] transition-colors cursor-pointer text-left"
                      >
                        <Calendar className="w-4 h-4 text-[#1b4332] flex-shrink-0" />
                        <span>Reserve a Table</span>
                      </button>

                      {/* View Food Cart */}
                      <button
                        id="mobile-cart-btn"
                        onClick={() => {
                          setIsCartOpen(true);
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold bg-[#f5f4e8] hover:bg-[#eae8d8] text-[#1b1c15] border border-[#e5e1d5] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <ShoppingBag className="w-4 h-4 text-[#a03f28] flex-shrink-0" />
                          <span>View Food Cart</span>
                        </div>
                        {cartCount > 0 && (
                          <span className="bg-[#a03f28] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {cartCount} items
                          </span>
                        )}
                      </button>

                      {/* Staff & Kitchen Terminal */}
                      {(user?.email?.toLowerCase() === 'tyagiaayush3030@gmail.com' || (typeof window !== 'undefined' && localStorage.getItem('spicetree_admin_session') !== null)) && (
                        <button
                          id="mobile-admin-btn"
                          onClick={() => {
                            setActiveTab('admin');
                            setMobileMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-sm font-semibold bg-[#1b1c15] hover:bg-stone-800 text-white transition-colors cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 text-[#ffdf96] flex-shrink-0" />
                          <span>Staff & Kitchen Terminal</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Drawer Footer with Sign Out / Sign In */}
                  <div className="p-4 border-t border-[#e5e1d5] bg-[#f5f4e8]">
                    {user ? (
                      <button
                        id="mobile-logout-btn"
                        onClick={async () => {
                          await logout();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    ) : (
                      <button
                        id="mobile-login-btn"
                        onClick={() => {
                          setIsAuthModalOpen(true);
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#a03f28] hover:bg-[#853420] transition-all cursor-pointer shadow-xs"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Sign In / Create Account</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Floating Active Order Live Tracker Pill - Mounted via React Portal directly to document.body to prevent any header backdrop-filter or stacking context overlap */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {!isTrackerDismissed &&
             latestActiveOrder &&
             latestActiveOrder.status !== 'Delivered' &&
             latestActiveOrder.status !== 'Cancelled' &&
             activeTab !== 'confirmation' &&
             activeTab !== 'orders' && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md pointer-events-auto"
                style={{ position: 'fixed', bottom: '1.25rem', zIndex: 9990 }}
              >
                <div
                  id="floating-live-order-pill"
                  onClick={() => setActiveTab('confirmation')}
                  className="bg-[#1b1c15] text-white p-3 sm:px-4 sm:py-3 rounded-2xl shadow-2xl border border-stone-700/80 flex items-center justify-between gap-3 cursor-pointer hover:bg-black transition-all group ring-1 ring-white/10"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#a03f28] flex items-center justify-center text-white flex-shrink-0 relative">
                      <ChefHat className="w-4 h-4 text-[#ffdad2] animate-bounce" />
                      <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold truncate">Order #{latestActiveOrder.orderNumber}</span>
                        <span className="text-[10px] bg-amber-400 text-amber-950 font-bold px-1.5 py-0.2 rounded-xs uppercase">
                          {latestActiveOrder.status}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-stone-300 truncate">
                        {latestActiveOrder.estimatedDeliveryTime || 'Kitchen preparing food'} • Tap to track live
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs font-bold text-[#ffdad2] group-hover:translate-x-0.5 transition-transform">
                      <span>Track</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                    <button
                      type="button"
                      id="dismiss-live-tracker-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsTrackerDismissed(true);
                      }}
                      className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                      title="Dismiss tracker notification"
                      aria-label="Dismiss order tracker"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </header>
  );
};
