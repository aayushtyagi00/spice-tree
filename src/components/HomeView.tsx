import React, { useState } from 'react';
import { 
  Utensils, 
  Sparkles, 
  MapPin, 
  Search, 
  CheckCircle2, 
  Clock, 
  Heart, 
  Star, 
  ShieldCheck, 
  Flame, 
  Calendar, 
  ArrowRight, 
  Plus, 
  Minus,
  ChefHat,
  Leaf,
  Users
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion } from 'motion/react';

export const HomeView: React.FC = () => {
  const {
    menuItems,
    addToCart,
    updateQuantity,
    getItemQuantity,
    setActiveTab,
    setIsCartOpen,
    setIsReservationModalOpen,
    checkDeliveryServiceability,
    setSelectedLocality,
    setSelectedPincode,
    selectedLocality
  } = useCart();

  const [pincodeInput, setPincodeInput] = useState('144401');
  const [serviceabilityResult, setServiceabilityResult] = useState<{
    isServiceable: boolean;
    message: string;
    zone?: any;
  } | null>(null);

  const bestsellers = menuItems.filter(item => item.isBestseller).slice(0, 6);

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincodeInput) return;
    const res = checkDeliveryServiceability(pincodeInput);
    setServiceabilityResult(res);
    if (res.isServiceable) {
      if (res.zone) {
        setSelectedLocality(res.zone.name);
        setSelectedPincode(res.zone.pincode);
      } else {
        setSelectedPincode(pincodeInput);
      }
    }
  };

  const quickLocalitySelect = (locName: string, pin: string) => {
    setPincodeInput(pin);
    setSelectedLocality(locName);
    setSelectedPincode(pin);
    const res = checkDeliveryServiceability(locName);
    setServiceabilityResult(res);
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-[#f5f4e8] to-[#fbfaee] pt-8 sm:pt-14 pb-12 sm:pb-20 border-b border-[#e5e1d5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            {/* Left Column: Heading & Value Proposition */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
            >
              {/* Pure veg trust badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#beead1] border border-[#a3d9bc] text-[#1b4332] text-xs font-bold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>100% PURE VEGETARIAN & SEPARATE JAIN KITCHEN</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-[#1b1c15] leading-[1.15] tracking-tight">
                Authentic Flavours, <br className="hidden sm:inline" />
                <span className="text-[#a03f28] italic">Simmered to Perfection</span> in Phagwara.
              </h1>

              <p className="text-base sm:text-lg text-[#56423d] max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Welcome to <strong className="text-[#1b1c15]">Spice Tree</strong> — Phagwara's cherished pure-vegetarian multi-cuisine dining destination. From overnight slow-simmered Dal Makhani and clay-tandoor Paneer Tikkas to royal Thalis and sizzling Chinese woks.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  id="hero-order-online-btn"
                  onClick={() => setActiveTab('menu')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#a03f28] hover:bg-[#812914] text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <Utensils className="w-5 h-5 text-[#ffdad2] group-hover:rotate-12 transition-transform" />
                  <span>Order Online Now</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  id="hero-reserve-table-btn"
                  onClick={() => setIsReservationModalOpen(true)}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white hover:bg-[#f5f4e8] text-[#1b4332] border-2 border-[#1b4332] font-bold text-base transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Calendar className="w-4 h-4 text-[#1b4332]" />
                  <span>Reserve a Table</span>
                </button>
              </div>

              {/* Social proof points */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-[#56423d]">
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#e5e1d5] shadow-2xs">
                  <div className="flex text-amber-500">
                    {'★'.repeat(5)}
                  </div>
                  <span className="font-bold text-[#1b1c15]">4.4 / 5.0</span>
                  <span className="text-stone-400">• Google Reviews</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#e5e1d5] shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-[#a03f28]" />
                  <span>30-40 Mins Express Delivery</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#e5e1d5] shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>FSSAI Certified Hygiene</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Visual Hero Collage */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-5 relative"
            >
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Main Hero Card */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-4/3 sm:aspect-square">
                  <img
                    src="https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=1000&q=80"
                    alt="Spice Tree Royal Punjabi Thali"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#a03f28] text-white text-xs font-bold w-fit mb-2">
                      Royal Thali Feast
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold">
                      Spice Tree Special Maharaja Thali
                    </h3>
                    <p className="text-xs text-stone-200 mt-1">
                      Dal Makhani, Shahi Paneer, 2 Butter Naans, Raita, Salad & Gulab Jamun
                    </p>
                  </div>
                </div>

                {/* Floating Rating Pill */}
                <div className="absolute -top-4 -left-4 sm:-left-6 bg-white p-3 rounded-2xl shadow-xl border border-[#e5e1d5] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#beead1] flex items-center justify-center text-[#1b4332]">
                    <Leaf className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1b1c15]">Pure Vegetarian</div>
                    <div className="text-[11px] text-emerald-800 font-medium">Jain Menu Available</div>
                  </div>
                </div>

                {/* Floating Delivery Tag */}
                <div className="absolute -bottom-4 -right-4 sm:-right-6 bg-[#1b4332] text-white p-3.5 rounded-2xl shadow-xl flex items-center gap-3 border-2 border-white">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#ffdf96]">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Hot & Fresh Delivery</div>
                    <div className="text-[11px] text-[#c1ecd4]">Across All Phagwara Sectors</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pincode & Locality Instant Delivery Checker */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e5e1d5] shadow-lg relative -mt-8 sm:-mt-12 z-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-5 space-y-1">
              <div className="flex items-center gap-2 text-[#a03f28] text-xs font-bold tracking-wider uppercase">
                <MapPin className="w-4 h-4" />
                <span>Express Doorstep Delivery</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#1b1c15]">
                Check Delivery at your Phagwara Locality
              </h3>
              <p className="text-xs text-[#56423d]">
                Enter your area or pincode to check minimum order & delivery time.
              </p>
            </div>

            <div className="md:col-span-7 space-y-3">
              <form onSubmit={handleCheckPincode} className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="pincode-checker-input"
                    type="text"
                    placeholder="Enter Pincode (e.g. 144401) or Area (e.g. Model Town)"
                    value={pincodeInput}
                    onChange={(e) => setPincodeInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e5e1d5] text-sm focus:outline-none focus:border-[#a03f28] focus:ring-1 focus:ring-[#a03f28]"
                  />
                </div>
                <button
                  id="pincode-check-submit-btn"
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#a03f28] hover:bg-[#853420] text-white font-bold text-sm shadow-xs transition-colors whitespace-nowrap cursor-pointer"
                >
                  Check Area
                </button>
              </form>

              {/* Quick Area Chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#56423d]">
                <span className="text-[11px] font-semibold text-stone-400">Popular:</span>
                {[
                  { name: 'Model Town', pin: '144401' },
                  { name: 'Guru Hargobind Ngr', pin: '144401' },
                  { name: 'Palahi Road', pin: '144401' },
                  { name: 'Law Gate / LPU', pin: '144411' },
                  { name: 'Satnampura', pin: '144402' },
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => quickLocalitySelect(item.name, item.pin)}
                    className="px-2.5 py-1 rounded-full bg-[#f5f4e8] hover:bg-[#efeee3] text-xs text-[#1b1c15] border border-[#e5e1d5] transition-colors"
                  >
                    {item.name}
                  </button>
                ))}
              </div>

              {/* Result box */}
              {serviceabilityResult && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                    serviceabilityResult.isServiceable
                      ? 'bg-[#beead1]/40 border border-[#a3d9bc] text-[#1b4332]'
                      : 'bg-amber-50 border border-amber-200 text-amber-900'
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${serviceabilityResult.isServiceable ? 'text-emerald-600' : 'text-amber-600'}`} />
                  <div>
                    <span className="font-semibold">{serviceabilityResult.message}</span>
                    {serviceabilityResult.isServiceable && (
                      <div className="mt-1">
                        <button
                          onClick={() => setActiveTab('menu')}
                          className="font-bold text-[#a03f28] hover:underline"
                        >
                          Browse Menu & Order Now →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1b1c15]">
            Why Foodies in Phagwara Love Spice Tree
          </h2>
          <p className="text-sm text-[#56423d]">
            Pure ingredients, authentic family recipes, and uncompromising culinary hygiene.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#e5e1d5] shadow-xs hover:border-[#a03f28]/30 transition-all text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#beead1] flex items-center justify-center text-[#1b4332] mx-auto">
              <Leaf className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-base text-[#1b1c15]">100% Pure Vegetarian</h4>
            <p className="text-xs text-[#56423d] leading-relaxed">
              Strictly vegetarian kitchen with high quality dairy, fresh malai paneer, and farmhouse vegetables.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#e5e1d5] shadow-xs hover:border-[#a03f28]/30 transition-all text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#ffdad2] flex items-center justify-center text-[#a03f28] mx-auto">
              <ChefHat className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-base text-[#1b1c15]">Dedicated Jain Menu</h4>
            <p className="text-xs text-[#56423d] leading-relaxed">
              Specialized No-Onion No-Garlic preparation adhering strictly to traditional Jain dietary guidelines.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#e5e1d5] shadow-xs hover:border-[#a03f28]/30 transition-all text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#ffdf96] flex items-center justify-center text-[#917321] mx-auto">
              <Flame className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-base text-[#1b1c15]">Desi Ghee & Clay Tandoor</h4>
            <p className="text-xs text-[#56423d] leading-relaxed">
              Charcoal-roasted kebabs, smoky butter rotis, and gravies tempered with hand-churned white butter.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#e5e1d5] shadow-xs hover:border-[#a03f28]/30 transition-all text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#c1ecd4] flex items-center justify-center text-[#1b4332] mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-base text-[#1b1c15]">30-40 Min Hot Delivery</h4>
            <p className="text-xs text-[#56423d] leading-relaxed">
              Special insulated packaging ensures your curries and naans arrive piping hot at your doorstep.
            </p>
          </div>
        </div>
      </section>

      {/* Customer Favourites & Bestsellers Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#a03f28] tracking-wider uppercase mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Customer Favourites</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1b1c15]">
              Most Loved Dishes at Spice Tree
            </h2>
          </div>

          <button
            id="view-full-menu-btn"
            onClick={() => setActiveTab('menu')}
            className="text-sm font-bold text-[#a03f28] hover:text-[#812914] flex items-center gap-1 group"
          >
            <span>Explore Full 30+ Dish Menu</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bestsellers.map(dish => {
            const qty = getItemQuantity(dish.id);
            return (
              <div
                key={dish.id}
                id={`bestseller-card-${dish.id}`}
                className="bg-white rounded-2xl border border-[#e5e1d5] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                {/* Image */}
                <div className="relative aspect-16/10 overflow-hidden bg-stone-100">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="bg-[#a03f28] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                      ★ Bestseller
                    </span>
                    {dish.isJainFriendly && (
                      <span className="bg-[#1b4332] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                        Jain
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-xs font-bold text-[#1b1c15] shadow-xs">
                    ₹{dish.price}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-2xs border border-emerald-600 flex items-center justify-center p-0.5 flex-shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      </span>
                      <h3 className="font-serif font-bold text-base text-[#1b1c15] group-hover:text-[#a03f28] transition-colors">
                        {dish.name}
                      </h3>
                    </div>
                    <p className="text-xs text-[#56423d] mt-1 line-clamp-2 leading-relaxed">
                      {dish.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-[#f0eee4] flex items-center justify-between">
                    <span className="text-xs text-stone-500 font-medium">
                      {dish.portion || 'Freshly made'}
                    </span>

                    {qty === 0 ? (
                      <button
                        id={`add-bestseller-${dish.id}`}
                        onClick={() => addToCart(dish.id)}
                        className="px-4 py-1.5 rounded-lg bg-[#a03f28] hover:bg-[#853420] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ADD</span>
                      </button>
                    ) : (
                      <div className="flex items-center bg-[#f5f4e8] border border-[#a03f28]/40 rounded-lg p-0.5">
                        <button
                          id={`decrease-bestseller-${dish.id}`}
                          onClick={() => updateQuantity(dish.id, -1)}
                          className="w-7 h-7 rounded flex items-center justify-center text-[#56423d] hover:bg-white hover:text-[#a03f28] transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-[#1b1c15]">
                          {qty}
                        </span>
                        <button
                          id={`increase-bestseller-${dish.id}`}
                          onClick={() => updateQuantity(dish.id, 1)}
                          className="w-7 h-7 rounded flex items-center justify-center text-[#56423d] hover:bg-white hover:text-[#a03f28] transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dine-In & Ambience Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#1b4332] text-white rounded-3xl overflow-hidden shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 space-y-6 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#ffdf96] text-xs font-bold w-fit">
                <Users className="w-3.5 h-3.5" />
                <span>Family Dining & Banquet in Phagwara</span>
              </div>

              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white leading-tight">
                Celebrate Moments Over Warm North Indian Feasts
              </h2>

              <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
                Whether you're planning a family weekend dinner, celebrating a birthday, or hosting a gathering, our comfortable air-conditioned halls and courteous service create memories around every plate.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                  <div className="text-lg font-bold text-[#ffdf96]">120+</div>
                  <div className="text-xs text-emerald-100">Seating Capacity</div>
                </div>
                <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
                  <div className="text-lg font-bold text-[#ffdf96]">100%</div>
                  <div className="text-xs text-emerald-100">Pure Veg Kitchen</div>
                </div>
                <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 col-span-2 sm:col-span-1">
                  <div className="text-lg font-bold text-[#ffdf96]">Private</div>
                  <div className="text-xs text-emerald-100">Family Cabins</div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-4">
                <button
                  id="ambience-book-table-btn"
                  onClick={() => setIsReservationModalOpen(true)}
                  className="px-6 py-3 rounded-full bg-[#ffdf96] hover:bg-[#ffe7b3] text-[#1b4332] font-bold text-sm transition-all shadow-md cursor-pointer"
                >
                  Book a Table for Tonight
                </button>
                <button
                  id="ambience-menu-btn"
                  onClick={() => setActiveTab('menu')}
                  className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all border border-white/30 cursor-pointer"
                >
                  View Food Menu
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 relative min-h-[300px]">
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80"
                alt="Spice Tree Restaurant Interior Dining"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-[#1b4332] via-transparent to-transparent lg:hidden" />
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials from Phagwara */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#a03f28] tracking-wider uppercase">
            <Star className="w-3.5 h-3.5 fill-[#a03f28]" />
            <span>Google Reviews</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1b1c15]">
            Loved by Families & Students Across Phagwara
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#e5e1d5] shadow-xs space-y-3">
            <div className="flex text-amber-500 gap-1 text-sm">
              {'★'.repeat(5)}
            </div>
            <p className="text-xs text-[#56423d] italic leading-relaxed">
              "The Dal Makhani and Garlic Naan here are hands down the best in Phagwara. We ordered online for our family dinner and it arrived hot within 35 minutes to Model Town."
            </p>
            <div className="pt-2 border-t border-[#f0eee4] flex items-center justify-between">
              <span className="font-bold text-xs text-[#1b1c15]">Harpreet Singh</span>
              <span className="text-[11px] text-stone-400">Model Town, Phagwara</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#e5e1d5] shadow-xs space-y-3">
            <div className="flex text-amber-500 gap-1 text-sm">
              {'★'.repeat(5)}
            </div>
            <p className="text-xs text-[#56423d] italic leading-relaxed">
              "Being strictly Jain, finding authentic Jain Paneer Butter Masala without garlic in the area used to be tough. Spice Tree’s Jain Maharaja Thali is a lifesaver!"
            </p>
            <div className="pt-2 border-t border-[#f0eee4] flex items-center justify-between">
              <span className="font-bold text-xs text-[#1b1c15]">Ananya Jain</span>
              <span className="text-[11px] text-stone-400">Guru Hargobind Nagar</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#e5e1d5] shadow-xs space-y-3">
            <div className="flex text-amber-500 gap-1 text-sm">
              {'★'.repeat(5)}
            </div>
            <p className="text-xs text-[#56423d] italic leading-relaxed">
              "Great portion sizes and reasonable prices. We often order the Hakka noodles, Cheese Tomato, and Paneer Tikka to Law Gate. Super friendly staff."
            </p>
            <div className="pt-2 border-t border-[#f0eee4] flex items-center justify-between">
              <span className="font-bold text-xs text-[#1b1c15]">Rohit Verma</span>
              <span className="text-[11px] text-stone-400">LPU Campus Vicinity</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
