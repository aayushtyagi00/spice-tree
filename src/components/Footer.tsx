import React from 'react';
import { Utensils, MapPin, Phone, Mail, Clock, Heart, ShieldCheck, Instagram, Facebook } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const Footer: React.FC = () => {
  const { setActiveTab, setIsReservationModalOpen, user } = useCart();

  return (
    <footer className="bg-[#1b1c15] text-[#e5e1d5] border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          
          {/* Column 1: Brand info */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#a03f28] flex items-center justify-center text-white">
                <Utensils className="w-5 h-5 text-[#ffdad2]" />
              </div>
              <div>
                <span className="font-serif text-2xl font-bold text-white tracking-tight">Spice Tree</span>
                <p className="text-[11px] font-medium text-stone-400 tracking-wider uppercase">
                  Pure Veg Multi-Cuisine • Phagwara
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
              Phagwara’s premier pure-vegetarian multi-cuisine dining destination. Serving authentic North Indian curries, tandoori platters, Chinese wok creations, and royal Jain meals.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                100% Pure Veg & Separate Jain Prep
              </span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-serif font-bold text-sm text-white">Quick Navigation</h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <button
                  onClick={() => {
                    setActiveTab('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors"
                >
                  Home Page
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('menu');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors"
                >
                  Order Online (Delivery & Pickup)
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setIsReservationModalOpen(true);
                  }}
                  className="hover:text-white transition-colors"
                >
                  Reserve a Table
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('about');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors"
                >
                  Our Pure Veg Story
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Timings */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="font-serif font-bold text-sm text-white">Contact & Timings</h4>
            <div className="space-y-2.5 text-xs text-stone-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#a03f28] flex-shrink-0 mt-0.5" />
                <span>G.T. Road, Near Town Hall, Phagwara, Punjab 144401</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#a03f28] flex-shrink-0" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#a03f28] flex-shrink-0" />
                <span>11:00 AM – 11:00 PM (Everyday)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-6 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-500">
          <div>
            © {new Date().getFullYear()} Spice Tree Restaurant, Phagwara. All rights reserved.
          </div>
          <div className="flex items-center gap-3">
            <span>FSSAI Lic. No: 12119001000123</span>
            {user?.email && user.email.toLowerCase() === 'tyagiaayush3030@gmail.com' && (
              <>
                <span>•</span>
                <button
                  id="footer-admin-portal-link"
                  onClick={() => {
                    setActiveTab('admin');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-amber-400 hover:text-white transition-colors cursor-pointer font-semibold underline underline-offset-2"
                >
                  Staff & Admin Terminal
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
