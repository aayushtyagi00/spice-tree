import React from 'react';
import { 
  Leaf, 
  ChefHat, 
  Heart, 
  MapPin, 
  Clock, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Award, 
  Calendar,
  Sparkles,
  Utensils
} from 'lucide-react';
import { useCart } from '../context/CartContext';

export const AboutView: React.FC = () => {
  const { setActiveTab, setIsReservationModalOpen } = useCart();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16 pb-28">
      {/* Hero Banner */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#e5e1d5] shadow-xs text-center max-w-4xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#beead1] text-[#1b4332] text-xs font-bold">
          <Leaf className="w-3.5 h-3.5 text-emerald-700" />
          <span>OUR PURE VEGETARIAN LEGACY IN PHAGWARA</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#1b1c15] leading-tight">
          Crafting Flavours with Heart, Desi Ghee & Tradition.
        </h1>

        <p className="text-sm sm:text-base text-[#56423d] leading-relaxed max-w-2xl mx-auto">
          Founded with a commitment to pure vegetarian excellence, <strong>Spice Tree</strong> has grown into Phagwara’s favourite multi-cuisine restaurant, celebrating Punjab’s rich culinary heritage alongside handcrafted world flavours.
        </p>
      </div>

      {/* Story and Philosophy Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-6 rounded-3xl overflow-hidden shadow-lg border border-[#e5e1d5] relative aspect-4/3">
          <img
            src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80"
            alt="Spice Tree Restaurant Interior Phagwara"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent flex items-end p-6 text-white">
            <div>
              <h4 className="font-serif font-bold text-lg">Spice Tree Dining & Family Hall</h4>
              <p className="text-xs text-stone-200">G.T. Road, Phagwara, Punjab</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#a03f28]">The Spice Tree Philosophy</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1b1c15]">
              Pure Vegetarian, Without Compromise
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-[#56423d] leading-relaxed">
            At Spice Tree, we believe that pure vegetarian food has infinite richness when prepared with fresh farm produce, pure desi ghee, and authentic whole spices ground in-house.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3 bg-[#f5f4e8] p-3.5 rounded-2xl border border-[#e5e1d5]">
              <div className="w-8 h-8 rounded-xl bg-[#beead1] flex items-center justify-center text-[#1b4332] flex-shrink-0 mt-0.5">
                <ChefHat className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1b1c15]">Dedicated Jain Kitchen Section</h4>
                <p className="text-xs text-[#56423d] mt-0.5">
                  We use separate cookware and gravies without onion or garlic to cater with utmost reverence to our Jain patrons.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-[#f5f4e8] p-3.5 rounded-2xl border border-[#e5e1d5]">
              <div className="w-8 h-8 rounded-xl bg-[#ffdad2] flex items-center justify-center text-[#a03f28] flex-shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1b1c15]">Dairy & Farm Fresh Ingredients</h4>
                <p className="text-xs text-[#56423d] mt-0.5">
                  Our Malai Paneer is churned fresh daily and we source local Punjab seasonal vegetables and pure dairy.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-[#f5f4e8] p-3.5 rounded-2xl border border-[#e5e1d5]">
              <div className="w-8 h-8 rounded-xl bg-[#ffdf96] flex items-center justify-center text-[#917321] flex-shrink-0 mt-0.5">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1b1c15]">Multi-Cuisine Mastery</h4>
                <p className="text-xs text-[#56423d] mt-0.5">
                  From traditional North Indian clay-tandoor dishes to wood-fired style pizzas and high-flame wok Chinese.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location & Timings Card */}
      <div className="bg-[#1b4332] text-white rounded-3xl p-8 sm:p-12 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs font-bold tracking-wider uppercase text-[#ffdf96]">Visit Us in Person</span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white">
              Centrally Located on G.T. Road, Phagwara
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              Drop by for a memorable lunch or dinner with family and friends. Ample parking, full air-conditioning, and baby-friendly seating available.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 text-xs">
              <div className="bg-white/10 p-3.5 rounded-xl border border-white/15 space-y-1">
                <div className="font-bold text-[#ffdf96] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>Restaurant Address</span>
                </div>
                <p className="text-stone-200">
                  Spice Tree Pure Veg, G.T. Road, Near Town Hall, Phagwara, Punjab 144401
                </p>
              </div>

              <div className="bg-white/10 p-3.5 rounded-xl border border-white/15 space-y-1">
                <div className="font-bold text-[#ffdf96] flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Opening Hours</span>
                </div>
                <p className="text-stone-200">
                  Monday – Sunday: 11:00 AM to 11:00 PM (Lunch & Dinner)
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => setIsReservationModalOpen(true)}
                className="px-6 py-3 rounded-full bg-[#ffdf96] hover:bg-[#ffe7b3] text-[#1b4332] font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Reserve a Table
              </button>
              <button
                onClick={() => setActiveTab('menu')}
                className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/30 transition-all cursor-pointer"
              >
                Order for Home Delivery
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white/10 p-6 rounded-2xl border border-white/15 space-y-4">
            <h4 className="font-serif font-bold text-base text-[#ffdf96]">Quick Contact & Inquiries</h4>
            <div className="space-y-3 text-xs text-stone-200">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#ffdf96]" />
                <span>+91 98765 43210 / +91 1824 220000</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#ffdf96]" />
                <span>orders@spicetreephagwara.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-[#ffdf96]" />
                <span>Special Banquet & Birthday Party bookings available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
