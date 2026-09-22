import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, Tag, ArrowRight, ShoppingBag, Truck, ShoppingCart, Utensils, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    menuItems,
    orderType,
    setOrderType,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    deliveryFee,
    freeDeliveryThreshold,
    taxes,
    total,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    setActiveTab,
    settings,
    isStoreOpen
  } = useCart();

  const [promoInput, setPromoInput] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  if (!isCartOpen) return null;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const res = applyPromoCode(promoInput);
    setPromoFeedback({
      msg: res.message,
      type: res.success ? 'success' : 'error'
    });
    if (res.success) {
      setPromoInput('');
    }
  };

  const handleCheckoutClick = () => {
    if (!isStoreOpen) return;
    setIsCartOpen(false);
    setActiveTab('checkout');
  };

  const amountNeededForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);


  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsCartOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        />

        {/* Drawer panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className="relative z-10 w-full max-w-md bg-[#fbfaee] shadow-2xl flex flex-col h-full overflow-hidden border-l border-[#e5e1d5]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#e5e1d5] bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#a03f28]/10 flex items-center justify-center text-[#a03f28]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-lg text-[#1b1c15]">Your Meal Cart</h2>
                <p className="text-xs text-[#56423d]">Spice Tree Phagwara</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  id="clear-cart-btn"
                  onClick={clearCart}
                  className="text-xs text-stone-500 hover:text-red-700 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                id="close-cart-drawer-btn"
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Fulfillment Mode Toggle */}
          <div className="px-4 py-3 bg-[#f5f4e8] border-b border-[#e5e1d5]">
            <div className="text-[11px] font-semibold text-[#56423d] uppercase tracking-wider mb-1.5">
              Select Fulfillment Option:
            </div>
            <div className="grid grid-cols-3 gap-1.5 bg-white p-1 rounded-xl border border-[#e5e1d5]">
              <button
                id="cart-fulfillment-delivery-btn"
                onClick={() => setOrderType('delivery')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  orderType === 'delivery'
                    ? 'bg-[#a03f28] text-white shadow-xs'
                    : 'text-[#56423d] hover:bg-stone-50'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Delivery</span>
              </button>
              <button
                id="cart-fulfillment-takeaway-btn"
                onClick={() => setOrderType('takeaway')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  orderType === 'takeaway'
                    ? 'bg-[#a03f28] text-white shadow-xs'
                    : 'text-[#56423d] hover:bg-stone-50'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Takeaway</span>
              </button>
              <button
                id="cart-fulfillment-dinein-btn"
                onClick={() => setOrderType('dinein')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  orderType === 'dinein'
                    ? 'bg-[#a03f28] text-white shadow-xs'
                    : 'text-[#56423d] hover:bg-stone-50'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Dine-in</span>
              </button>
            </div>
          </div>

          {/* Free delivery progress prompt for delivery mode */}
          {orderType === 'delivery' && cart.length > 0 && (
            <div className="bg-[#beead1]/40 border-b border-[#a3d9bc] px-4 py-2 text-xs text-[#1b4332] flex items-center justify-between">
              {amountNeededForFreeDelivery > 0 ? (
                <span>
                  Add <strong className="text-[#a03f28]">₹{amountNeededForFreeDelivery}</strong> more for <strong>FREE Delivery!</strong>
                </span>
              ) : (
                <span className="flex items-center gap-1 font-semibold text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  You've unlocked FREE Delivery across Phagwara!
                </span>
              )}
              <span className="text-[10px] uppercase font-bold bg-[#1b4332] text-white px-2 py-0.5 rounded-full">
                {amountNeededForFreeDelivery === 0 ? 'Unlocked' : `₹${subtotal}/₹${freeDeliveryThreshold}`}
              </span>
            </div>
          )}

          {/* Cart Content Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#f5f4e8] border border-[#e5e1d5] flex items-center justify-center text-stone-400">
                  <ShoppingBag className="w-8 h-8 text-[#a03f28]/40" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#1b1c15]">Your cart is hungry!</h3>
                  <p className="text-sm text-[#56423d] max-w-xs mt-1">
                    Explore our authentic pure vegetarian Punjabi dishes, rich thalis, and sizzling starters.
                  </p>
                </div>
                <button
                  id="empty-cart-browse-menu-btn"
                  onClick={() => {
                    setIsCartOpen(false);
                    setActiveTab('menu');
                  }}
                  className="px-5 py-2.5 rounded-full bg-[#a03f28] hover:bg-[#853420] text-white text-sm font-semibold transition-all shadow-sm"
                >
                  Explore Spice Tree Menu
                </button>
              </div>
            ) : (
              <>
                {/* List of items */}
                <div className="space-y-2.5">
                  {cart.map(cartItem => {
                    const dish = menuItems.find(m => m.id === cartItem.menuItemId);
                    if (!dish) return null;

                    return (
                      <div
                        key={dish.id}
                        id={`cart-item-${dish.id}`}
                        className="bg-white rounded-xl p-3 border border-[#e5e1d5] flex items-center justify-between gap-3 shadow-2xs hover:border-[#a03f28]/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Dish Image */}
                          <img
                            src={dish.image}
                            alt={dish.name}
                            className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-[#e5e1d5]"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="w-3.5 h-3.5 rounded-2xs border border-emerald-600 flex items-center justify-center p-0.5 flex-shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              </span>
                              <h4 className="text-sm font-bold text-[#1b1c15] truncate">{dish.name}</h4>
                            </div>
                            <p className="text-xs text-[#56423d] font-semibold mt-0.5">
                              ₹{dish.price} {dish.portion && <span className="text-[11px] font-normal text-stone-400">({dish.portion})</span>}
                            </p>
                            {dish.isJainFriendly && (
                              <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded font-medium">
                                Jain friendly
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stepper & Total */}
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <div className="flex items-center bg-[#f5f4e8] border border-[#e5e1d5] rounded-lg p-0.5">
                            <button
                              id={`decrease-qty-${dish.id}`}
                              onClick={() => updateQuantity(dish.id, -1)}
                              className="w-6 h-6 rounded flex items-center justify-center text-[#56423d] hover:bg-white hover:text-[#a03f28] transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-[#1b1c15]">
                              {cartItem.quantity}
                            </span>
                            <button
                              id={`increase-qty-${dish.id}`}
                              onClick={() => updateQuantity(dish.id, 1)}
                              className="w-6 h-6 rounded flex items-center justify-center text-[#56423d] hover:bg-white hover:text-[#a03f28] transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-xs font-bold text-[#1b1c15]">
                            ₹{dish.price * cartItem.quantity}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add more items link */}
                <button
                  id="add-more-dishes-btn"
                  onClick={() => {
                    setIsCartOpen(false);
                    setActiveTab('menu');
                  }}
                  className="w-full py-2 px-3 border border-dashed border-[#a03f28]/40 rounded-xl text-xs font-semibold text-[#a03f28] hover:bg-[#a03f28]/5 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add more authentic Punjabi dishes</span>
                </button>

                {/* Promo Code Box */}
                <div className="bg-white p-3.5 rounded-xl border border-[#e5e1d5] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#1b1c15]">
                    <Tag className="w-3.5 h-3.5 text-[#917321]" />
                    <span>Have a Promo Coupon?</span>
                  </div>

                  {appliedPromo ? (
                    <div className="flex items-center justify-between bg-[#beead1]/40 border border-[#a3d9bc] p-2.5 rounded-lg text-xs">
                      <div>
                        <span className="font-bold text-[#1b4332]">{appliedPromo.code}</span>
                        <p className="text-[11px] text-emerald-800">{appliedPromo.label}</p>
                      </div>
                      <button
                        onClick={removePromoCode}
                        className="text-xs text-red-600 font-semibold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyPromo} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Try: SPICE50 or WELCOME10"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#e5e1d5] uppercase font-mono tracking-wider focus:outline-none focus:border-[#a03f28]"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-[#1b4332] hover:bg-[#153427] text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        Apply
                      </button>
                    </form>
                  )}

                  {promoFeedback && (
                    <p className={`text-[11px] ${promoFeedback.type === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>
                      {promoFeedback.msg}
                    </p>
                  )}
                </div>

                {/* Bill Breakdown */}
                <div className="bg-white p-4 rounded-xl border border-[#e5e1d5] space-y-2 text-xs">
                  <div className="font-bold text-stone-700 pb-1 border-b border-[#f0eee4]">
                    Bill Details
                  </div>

                  <div className="flex justify-between text-[#56423d]">
                    <span>Item Total</span>
                    <span className="font-semibold text-[#1b1c15]">₹{subtotal}</span>
                  </div>

                  {orderType === 'delivery' && (
                    <div className="flex justify-between text-[#56423d]">
                      <span className="flex items-center gap-1">
                        Delivery Partner Fee
                        {deliveryFee === 0 && <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1 rounded">FREE</span>}
                      </span>
                      <span className={deliveryFee === 0 ? 'line-through text-stone-400 font-semibold' : 'font-semibold text-[#1b1c15]'}>
                        ₹{deliveryFee === 0 ? settings.deliveryFee : deliveryFee}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-[#56423d]">
                    <span>GST & Restaurant Packaging ({settings.taxRate}%)</span>
                    <span className="font-semibold text-[#1b1c15]">₹{taxes}</span>
                  </div>

                  {appliedPromo && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Promo Discount ({appliedPromo.code})</span>
                      <span>-₹{appliedPromo.discountAmount}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#e5e1d5] flex justify-between items-center text-sm font-bold text-[#1b1c15]">
                    <span>Grand Total</span>
                    <span className="text-base text-[#a03f28]">₹{total}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Checkout CTA */}
          {cart.length > 0 && (
            <div className="p-4 bg-white border-t border-[#e5e1d5] shadow-lg space-y-2">
              {!isStoreOpen && (
                <div className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2 text-center">
                  Restaurant is currently paused for online orders.
                </div>
              )}
              <button
                id="cart-proceed-checkout-btn"
                onClick={handleCheckoutClick}
                disabled={!isStoreOpen}
                className="w-full py-3.5 px-4 bg-[#a03f28] hover:bg-[#853420] disabled:bg-stone-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="text-left">
                  <div className="text-xs text-[#ffdad2] font-normal">
                    {orderType === 'delivery' ? 'Delivery to Phagwara' : orderType === 'takeaway' ? 'Self Takeaway' : 'Dine-In Table'}
                  </div>
                  <div className="text-base font-bold">₹{total}</div>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold bg-[#812914] px-3 py-1.5 rounded-lg group-hover:bg-[#691f0e] transition-colors">
                  <span>{isStoreOpen ? 'Proceed to Checkout' : 'Store Closed'}</span>
                  {isStoreOpen && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </div>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
