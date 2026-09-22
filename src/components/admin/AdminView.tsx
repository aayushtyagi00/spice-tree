import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, onSnapshot, getDocs, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { Order, MenuItem, RestaurantSettings, AdminRecord } from '../../types';
import { useCart } from '../../context/CartContext';
import { INITIAL_ADMINS, seedFirestoreIfEmpty } from '../../data/seedData';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { AdminMenu } from './AdminMenu';
import { AdminOrders } from './AdminOrders';
import { AdminReservations } from './AdminReservations';
import { AdminSettings } from './AdminSettings';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Sliders,
  LogOut,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Store,
  Crown,
  Calendar
} from 'lucide-react';

type AdminTab = 'dashboard' | 'menu' | 'orders' | 'reservations' | 'settings';

export const AdminView: React.FC = () => {
  const { menuItems, settings, setActiveTab, user } = useCart();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminRecord, setAdminRecord] = useState<AdminRecord | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState(false);
  const [revocationNotice, setRevocationNotice] = useState<string | null>(null);
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [pendingReservationsCount, setPendingReservationsCount] = useState<number>(0);

  // 1. Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      setCurrentUser(fbUser);
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Real-time live synchronization with the 'admins' collection in Firestore
  // Any deletion or revocation of an admin ID immediately terminates their session
  useEffect(() => {
    let isMounted = true;
    const adminsCol = collection(db, 'admins');

    const unsubscribeAdmins = onSnapshot(
      adminsCol,
      (snapshot) => {
        if (!isMounted) return;

        const adminDocs = snapshot.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<AdminRecord, 'id'>)
        }));

        // Enforce verified Firebase Auth user session
        const verifiedUser = auth.currentUser;
        const activeEmail = (verifiedUser?.email || '').trim().toLowerCase();

        if (activeEmail) {
          const matched = adminDocs.find(
            a => a.email && a.email.toLowerCase() === activeEmail
          );

          const isSuperAdminOwner = activeEmail === 'tyagiaayush3030@gmail.com';

          if (matched) {
            // Document exists in live Firestore admins collection -> Authorized!
            setAdminRecord(matched);
            setIsAuthorizedAdmin(true);
            setRevocationNotice(null);
            localStorage.setItem('spicetree_admin_session', JSON.stringify(matched));
          } else if (isSuperAdminOwner) {
            // Master Super Admin account protection
            const ownerDoc: AdminRecord = {
              id: verifiedUser?.uid || 'admin-super-owner',
              email: 'tyagiaayush3030@gmail.com',
              name: verifiedUser?.displayName || 'Aayush Tyagi',
              role: 'Super Admin',
              addedAt: Date.now()
            };
            setAdminRecord(ownerDoc);
            setIsAuthorizedAdmin(true);
            setRevocationNotice(null);
            localStorage.setItem('spicetree_admin_session', JSON.stringify(ownerDoc));
            setDoc(doc(db, 'admins', 'tyagiaayush3030@gmail.com'), ownerDoc).catch(console.warn);
            seedFirestoreIfEmpty().catch(console.warn);
          } else {
            // NOT in Firestore collection -> IMMEDIATE REVOCATION!
            console.warn(`Admin privilege revoked for: ${activeEmail}`);
            localStorage.removeItem('spicetree_admin_session');
            setIsAuthorizedAdmin(false);
            setAdminRecord(null);
            setRevocationNotice(
              `Administrator access for "${activeEmail}" has been revoked by the Super Admin. You have been logged out.`
            );
          }
        } else {
          // No verified Firebase user credentials present
          localStorage.removeItem('spicetree_admin_session');
          setIsAuthorizedAdmin(false);
          setAdminRecord(null);
        }

        setIsCheckingAuth(false);
      },
      (err) => {
        console.warn('Admins onSnapshot listener error:', err);
        setIsCheckingAuth(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribeAdmins();
    };
  }, [currentUser, user]);

  // 2. Real-time live listener on orders collection
  useEffect(() => {
    const ordersCol = collection(db, 'orders');
    const unsubscribeOrders = onSnapshot(
      ordersCol,
      snapshot => {
        const orderList: Order[] = [];
        snapshot.forEach(docSnap => {
          orderList.push({ id: docSnap.id, ...(docSnap.data() as Omit<Order, 'id'>) });
        });
        setOrders(orderList);
      },
      error => {
        console.warn('Orders snapshot error (using in-memory fallback):', error);
      }
    );

    return () => unsubscribeOrders();
  }, []);

  // 3. Real-time live listener on reservations collection for pending count
  useEffect(() => {
    const resCol = collection(db, 'reservations');
    const unsubscribe = onSnapshot(
      resCol,
      (snapshot) => {
        let count = 0;
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (!data.status || data.status === 'pending') {
            count++;
          }
        });
        setPendingReservationsCount(count);
      },
      (err) => {
        console.warn('Reservations count notice:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('spicetree_admin_session');
      await signOut(auth);
    } catch (err) {
      console.warn('Logout notice:', err);
    } finally {
      setIsAuthorizedAdmin(false);
      setAdminRecord(null);
    }
  };

  // Pending count for badge
  const pendingOrdersCount = orders.filter(
    o => o.status === 'Placed' || o.status === 'Preparing'
  ).length;

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#1b1c15] text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-[#a03f28] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-stone-400">Verifying Admin Privileges...</p>
      </div>
    );
  }

  // If not authorized in live admins collection, show AdminLogin with revocation notice if set
  if (!isAuthorizedAdmin) {
    return (
      <AdminLogin
        revocationNotice={revocationNotice}
        onAdminAuthenticated={() => setRevocationNotice(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f4e8] text-[#1b1c15] flex flex-col">
      {/* Admin Top Header Navigation */}
      <header className="bg-[#1b1c15] text-white sticky top-0 z-40 border-b border-stone-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Terminal Badge */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('home')}
                className="flex items-center gap-2 group text-left cursor-pointer"
                title="Return to Customer Storefront"
              >
                <div className="w-9 h-9 rounded-xl bg-[#a03f28] flex items-center justify-center text-white font-serif font-bold text-lg shadow-sm">
                  ST
                </div>
                <div>
                  <div className="font-serif font-bold text-sm tracking-wide text-white group-hover:text-[#ff8c73] transition-colors">
                    SPICE TREE
                  </div>
                  <div className="text-[10px] text-stone-400 font-sans tracking-widest uppercase">
                    Admin Terminal
                  </div>
                </div>
              </button>

              <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#a03f28]/30 border border-[#a03f28]/60 text-[#ffdad2]">
                Phagwara Kitchen
              </span>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-[#24251c] p-1 rounded-xl border border-stone-800">
              <button
                id="admin-tab-dashboard-btn"
                onClick={() => setActiveAdminTab('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeAdminTab === 'dashboard'
                    ? 'bg-[#a03f28] text-white shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>

              <button
                id="admin-tab-orders-btn"
                onClick={() => setActiveAdminTab('orders')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${
                  activeAdminTab === 'orders'
                    ? 'bg-[#a03f28] text-white shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Live Orders</span>
                {pendingOrdersCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 font-bold text-[10px] flex items-center justify-center">
                    {pendingOrdersCount}
                  </span>
                )}
              </button>

              <button
                id="admin-tab-menu-btn"
                onClick={() => setActiveAdminTab('menu')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeAdminTab === 'menu'
                    ? 'bg-[#a03f28] text-white shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Menu & Prices</span>
              </button>

              <button
                id="admin-tab-reservations-btn"
                onClick={() => setActiveAdminTab('reservations')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${
                  activeAdminTab === 'reservations'
                    ? 'bg-[#a03f28] text-white shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Reservations</span>
                {pendingReservationsCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-stone-950 font-bold text-[10px] flex items-center justify-center">
                    {pendingReservationsCount}
                  </span>
                )}
              </button>

              <button
                id="admin-tab-settings-btn"
                onClick={() => setActiveAdminTab('settings')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeAdminTab === 'settings'
                    ? 'bg-[#a03f28] text-white shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Store Controls</span>
              </button>
            </nav>

            {/* Right User & Logout actions */}
            <div className="flex items-center gap-3">
              {/* Back to customer shop link */}
              <button
                onClick={() => setActiveTab('home')}
                className="hidden lg:flex items-center gap-1 text-xs text-stone-400 hover:text-white transition-colors cursor-pointer"
                title="Switch back to Customer view"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Customer Menu</span>
              </button>

              {/* User badge */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-stone-800">
                <div className="w-7 h-7 rounded-full bg-[#a03f28] text-white flex items-center justify-center font-bold text-xs">
                  {adminRecord?.name?.charAt(0) || currentUser?.email?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white truncate max-w-[120px]">
                    {adminRecord?.name || currentUser?.displayName || 'Admin'}
                  </div>
                  <div className="text-[10px] text-stone-400 truncate max-w-[120px] flex items-center gap-1">
                    {adminRecord?.role === 'Super Admin' || adminRecord?.email?.toLowerCase() === 'tyagiaayush3030@gmail.com' ? (
                      <span className="text-amber-400 font-bold flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5 text-amber-400" /> Super Admin
                      </span>
                    ) : (
                      <span>{adminRecord?.role || 'Staff'}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Log Out Button */}
              <button
                id="admin-logout-btn"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-red-900/60 border border-stone-700 hover:border-red-700 text-stone-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                title="Sign out of Admin Panel"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Sub-bar */}
        <div className="md:hidden flex items-center justify-around bg-[#24251c] py-2 border-t border-stone-800 text-xs">
          <button
            onClick={() => setActiveAdminTab('dashboard')}
            className={`px-3 py-1 rounded-lg font-bold ${
              activeAdminTab === 'dashboard' ? 'bg-[#a03f28] text-white' : 'text-stone-400'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveAdminTab('orders')}
            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 ${
              activeAdminTab === 'orders' ? 'bg-[#a03f28] text-white' : 'text-stone-400'
            }`}
          >
            <span>Orders</span>
            {pendingOrdersCount > 0 && (
              <span className="px-1.5 rounded-full bg-amber-500 text-black text-[9px] font-bold">
                {pendingOrdersCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveAdminTab('menu')}
            className={`px-3 py-1 rounded-lg font-bold ${
              activeAdminTab === 'menu' ? 'bg-[#a03f28] text-white' : 'text-stone-400'
            }`}
          >
            Menu
          </button>
          <button
            onClick={() => setActiveAdminTab('reservations')}
            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 ${
              activeAdminTab === 'reservations' ? 'bg-[#a03f28] text-white' : 'text-stone-400'
            }`}
          >
            <span>Bookings</span>
            {pendingReservationsCount > 0 && (
              <span className="px-1.5 rounded-full bg-emerald-500 text-black text-[9px] font-bold">
                {pendingReservationsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveAdminTab('settings')}
            className={`px-3 py-1 rounded-lg font-bold ${
              activeAdminTab === 'settings' ? 'bg-[#a03f28] text-white' : 'text-stone-400'
            }`}
          >
            Controls
          </button>
        </div>
      </header>

      {/* Main Admin Content View */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {activeAdminTab === 'dashboard' && (
          <AdminDashboard
            orders={orders}
            menuItems={menuItems}
            settings={settings}
            onNavigateTab={setActiveAdminTab}
          />
        )}
        {activeAdminTab === 'orders' && <AdminOrders orders={orders} />}
        {activeAdminTab === 'menu' && <AdminMenu menuItems={menuItems} />}
        {activeAdminTab === 'reservations' && <AdminReservations />}
        {activeAdminTab === 'settings' && (
          <AdminSettings settings={settings} currentAdmin={adminRecord} />
        )}
      </main>
    </div>
  );
};
