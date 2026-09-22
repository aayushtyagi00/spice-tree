import React, { useEffect } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { MenuView } from './components/MenuView';
import { CheckoutView } from './components/CheckoutView';
import { OrderConfirmationView } from './components/OrderConfirmationView';
import { MyOrdersView } from './components/MyOrdersView';
import { AboutView } from './components/AboutView';
import { CartDrawer } from './components/CartDrawer';
import { ReservationModal } from './components/ReservationModal';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { AdminView } from './components/admin/AdminView';

const AppContent: React.FC = () => {
  const { activeTab } = useCart();

  // Scroll to top whenever active tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  if (activeTab === 'admin') {
    return (
      <div className="min-h-screen bg-[#1b1c15]">
        <AdminView />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfaee] text-[#1b1c15]">
      {/* Sticky Top Header */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'home' && <HomeView />}
        {activeTab === 'menu' && <MenuView />}
        {activeTab === 'checkout' && <CheckoutView />}
        {activeTab === 'confirmation' && <OrderConfirmationView />}
        {activeTab === 'orders' && <MyOrdersView />}
        {activeTab === 'about' && <AboutView />}
      </main>

      {/* Slide-over Cart Drawer */}
      <CartDrawer />

      {/* Reserve a Table Modal */}
      <ReservationModal />

      {/* User Login & Profile Modal */}
      <AuthModal />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}
