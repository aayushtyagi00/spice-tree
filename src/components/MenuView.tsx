import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Flame, 
  Sparkles, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Check, 
  Leaf, 
  Utensils, 
  Truck, 
  ShoppingCart, 
  Tag, 
  ArrowRight,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { CATEGORIES } from '../data/seedData';
import { CategoryId, MenuItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export const MenuView: React.FC = () => {
  const {
    menuItems,
    addToCart,
    updateQuantity,
    getItemQuantity,
    cartCount,
    total,
    setIsCartOpen,
    orderType,
    setOrderType,
    selectedLocality,
    setActiveTab,
    isStoreOpen,
    settings
  } = useCart();

  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [jainOnly, setJainOnly] = useState(false);
  const [bestsellerOnly, setBestsellerOnly] = useState(false);

  // Filtered dishes
  const filteredDishes = useMemo(() => {
    return menuItems.filter(dish => {
      // Category filter
      if (selectedCategory !== 'all' && dish.category !== selectedCategory) {
        return false;
      }
      // Jain filter
      if (jainOnly && !dish.isJainFriendly) {
        return false;
      }
      // Bestseller filter
      if (bestsellerOnly && !dish.isBestseller) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = dish.name.toLowerCase().includes(q);
        const matchesDesc = dish.description.toLowerCase().includes(q);
        const matchesTags = dish.tags?.some(t => t.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesTags) return false;
      }
      return true;
    });
  }, [menuItems, selectedCategory, jainOnly, bestsellerOnly, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-32">
      {/* Store Closed Announcement Banner */}
      {!isStoreOpen && (
        <div className="bg-amber-50 border border-amber-300 p-4 sm:p-5 rounded-2xl flex items-center gap-3.5 shadow-xs text-amber-900">
          <div className="w-9 h-9 rounded-xl bg-amber-200/80 flex items-center justify-center flex-shrink-0 font-bold">
            ⚠️
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-amber-950">Restaurant Currently Closed for New Orders</h4>
            <p className="text-xs text-amber-800">
              {settings.closedNotice || 'We are temporarily paused taking orders. Menu browsing is available!'}
            </p>
          </div>
        </div>
      )}

      {/* Top Banner & Title */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e5e1d5] shadow-xs">

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#beead1] text-[#1b4332] text-xs font-bold w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>100% PURE VEGETARIAN MENU</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#1b1c15]">
              Spice Tree Culinary Menu
            </h1>
            <p className="text-xs sm:text-sm text-[#56423d]">
              Freshly prepared with pure desi ghee and signature Punjabi spices in Phagwara.
            </p>
          </div>

          {/* Fulfillment Toggle Selector */}
          <div className="bg-[#f5f4e8] p-1.5 rounded-2xl border border-[#e5e1d5] flex flex-wrap sm:flex-nowrap gap-1">
            <button
              id="menu-toggle-delivery"
              onClick={() => setOrderType('delivery')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                orderType === 'delivery'
                  ? 'bg-[#a03f28] text-white shadow-xs'
                  : 'text-[#56423d] hover:text-[#1b1c15]'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Delivery ({selectedLocality || 'Phagwara'})</span>
            </button>
            <button
              id="menu-toggle-takeaway"
              onClick={() => setOrderType('takeaway')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                orderType === 'takeaway'
                  ? 'bg-[#a03f28] text-white shadow-xs'
                  : 'text-[#56423d] hover:text-[#1b1c15]'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Takeaway (Self-Pickup)</span>
            </button>
            <button
              id="menu-toggle-dinein"
              onClick={() => setOrderType('dinein')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                orderType === 'dinein'
                  ? 'bg-[#a03f28] text-white shadow-xs'
                  : 'text-[#56423d] hover:text-[#1b1c15]'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Dine-In</span>
            </button>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="mt-6 pt-6 border-t border-[#f0eee4] flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="dish-search-input"
              type="text"
              placeholder="Search dishes (e.g. Dal Makhani, Paneer Tikka, Naan)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#e5e1d5] text-sm focus:outline-none focus:border-[#a03f28] focus:ring-1 focus:ring-[#a03f28] bg-[#fbfaee]/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Dietary Toggles */}
          <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {/* Jain Toggle */}
            <button
              id="filter-jain-toggle"
              onClick={() => setJainOnly(!jainOnly)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer border ${
                jainOnly
                  ? 'bg-[#1b4332] text-white border-[#1b4332] shadow-xs'
                  : 'bg-white text-[#1b4332] border-[#a3d9bc] hover:bg-[#beead1]/30'
              }`}
            >
              <Leaf className="w-3.5 h-3.5" />
              <span>Jain Friendly (No Onion/Garlic)</span>
              {jainOnly && <Check className="w-3.5 h-3.5" />}
            </button>

            {/* Bestseller Toggle */}
            <button
              id="filter-bestseller-toggle"
              onClick={() => setBestsellerOnly(!bestsellerOnly)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer border ${
                bestsellerOnly
                  ? 'bg-[#a03f28] text-white border-[#a03f28] shadow-xs'
                  : 'bg-white text-[#a03f28] border-[#ffdad2] hover:bg-[#ffdad2]/30'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bestsellers Only</span>
              {bestsellerOnly && <Check className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Category Navigation Pills */}
      <div className="sticky top-20 z-30 bg-[#fbfaee]/95 backdrop-blur-md py-2 border-y border-[#e5e1d5] -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            id="cat-pill-all"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#1b1c15] text-white shadow-xs'
                : 'bg-white text-[#56423d] border border-[#e5e1d5] hover:bg-[#f5f4e8]'
            }`}
          >
            All Items ({menuItems.length})
          </button>
          {CATEGORIES.map(cat => {
            const count = menuItems.filter(m => m.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`cat-pill-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#a03f28] text-white shadow-xs'
                    : 'bg-white text-[#56423d] border border-[#e5e1d5] hover:bg-[#f5f4e8]'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dishes Grid */}
      {filteredDishes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#e5e1d5] space-y-4 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-full bg-[#f5f4e8] flex items-center justify-center text-[#a03f28] mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-bold text-lg text-[#1b1c15]">No dishes match your filters</h3>
          <p className="text-xs text-[#56423d]">
            Try adjusting your search keywords, category, or turning off the Jain filter to explore the full menu.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setJainOnly(false);
              setBestsellerOnly(false);
            }}
            className="px-4 py-2 bg-[#a03f28] text-white rounded-full text-xs font-bold"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDishes.map(dish => {
            const qty = getItemQuantity(dish.id);
            const isSoldOut = dish.isAvailable === false;
            return (
              <motion.div
                key={dish.id}
                id={`menu-dish-${dish.id}`}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`bg-white rounded-2xl border border-[#e5e1d5] overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group ${isSoldOut ? 'opacity-85' : ''}`}
              >
                {/* Dish Picture & Badges */}
                <div className="relative aspect-16/10 overflow-hidden bg-stone-100">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className={`w-full h-full object-cover transition-transform duration-300 ${isSoldOut ? 'grayscale-50' : 'group-hover:scale-105'}`}
                    loading="lazy"
                  />

                  {/* Badges container */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {isSoldOut ? (
                      <span className="bg-stone-900/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                        Sold Out
                      </span>
                    ) : (
                      <>
                        {dish.isBestseller && (
                          <span className="bg-[#a03f28] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                            ★ Bestseller
                          </span>
                        )}
                        {dish.isJainFriendly && (
                          <span className="bg-[#1b4332] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                            Jain Friendly
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {dish.portion && (
                    <span className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md">
                      {dish.portion}
                    </span>
                  )}

                  <div className="absolute bottom-2.5 right-2.5 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg text-xs font-bold text-[#1b1c15] shadow-xs">
                    ₹{dish.price}
                  </div>
                </div>

                {/* Dish Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start gap-1.5 mb-1">
                      <span className="w-3.5 h-3.5 mt-0.5 rounded-2xs border border-emerald-600 flex items-center justify-center p-0.5 flex-shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      </span>
                      <h3 className="font-serif font-bold text-base text-[#1b1c15] group-hover:text-[#a03f28] transition-colors leading-snug">
                        {dish.name}
                      </h3>
                    </div>

                    <p className="text-xs text-[#56423d] line-clamp-2 leading-relaxed">
                      {dish.description}
                    </p>

                    {dish.tags && dish.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {dish.tags.map(tag => (
                          <span
                            key={tag}
                            className="text-[10px] font-medium text-stone-500 bg-[#f5f4e8] px-2 py-0.5 rounded-md"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add / Stepper CTA */}
                  <div className="pt-3 border-t border-[#f0eee4] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#1b1c15]">₹{dish.price}</span>
                      <span className="text-[11px] text-stone-400 ml-1">inc. GST</span>
                    </div>

                    {isSoldOut ? (
                      <span className="px-3 py-1.5 rounded-lg bg-stone-100 text-stone-400 text-xs font-bold border border-stone-200 cursor-not-allowed">
                        Sold Out
                      </span>
                    ) : qty === 0 ? (
                      <button
                        id={`menu-add-btn-${dish.id}`}
                        onClick={() => addToCart(dish.id)}
                        disabled={!isStoreOpen}
                        className="px-4 py-1.5 rounded-lg bg-[#a03f28] hover:bg-[#853420] disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ADD</span>
                      </button>
                    ) : (
                      <div className="flex items-center bg-[#f5f4e8] border border-[#a03f28]/40 rounded-lg p-0.5 shadow-2xs">
                        <button
                          id={`menu-decrease-${dish.id}`}
                          onClick={() => updateQuantity(dish.id, -1)}
                          className="w-7 h-7 rounded flex items-center justify-center text-[#56423d] hover:bg-white hover:text-[#a03f28] transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-[#1b1c15]">
                          {qty}
                        </span>
                        <button
                          id={`menu-increase-${dish.id}`}
                          onClick={() => updateQuantity(dish.id, 1)}
                          className="w-7 h-7 rounded flex items-center justify-center text-[#56423d] hover:bg-white hover:text-[#a03f28] transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Floating Bottom Quick Cart Sticky Banner */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-40"
          >
            <div className="bg-[#1b1c15] text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-stone-700 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#a03f28] flex items-center justify-center text-white font-bold text-sm">
                  {cartCount}
                </div>
                <div>
                  <div className="text-xs text-stone-300 font-medium">
                    {cartCount} item{cartCount > 1 ? 's' : ''} added • {orderType.toUpperCase()}
                  </div>
                  <div className="text-sm font-bold text-white">
                    ₹{total} <span className="text-xs font-normal text-stone-400">Total</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="floating-cart-view-btn"
                  onClick={() => setIsCartOpen(true)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
                >
                  View Cart
                </button>
                <button
                  id="floating-cart-checkout-btn"
                  onClick={() => setActiveTab('checkout')}
                  className="px-5 py-2 rounded-xl bg-[#a03f28] hover:bg-[#853420] text-xs font-bold text-white flex items-center gap-1.5 shadow-md transition-all group"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
