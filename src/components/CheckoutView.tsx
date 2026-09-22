import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  ShoppingCart, 
  Utensils, 
  MapPin, 
  Phone, 
  User, 
  CreditCard, 
  Banknote, 
  QrCode, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ShoppingBag,
  Sparkles,
  Info,
  Users,
  Tag,
  Percent,
  Check
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCart } from '../context/CartContext';
import { Order, OrderItem, PaymentMethod } from '../types';
import confetti from 'canvas-confetti';

export const CheckoutView: React.FC = () => {
  const {
    cart,
    menuItems,
    deliveryZones,
    orderType,
    setOrderType,
    subtotal,
    deliveryFee,
    taxes,
    total,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    clearCart,
    setActiveTab,
    setActiveOrderId,
    selectedLocality,
    setSelectedLocality,
    selectedPincode,
    setSelectedPincode,
    user,
    settings,
    isStoreOpen
  } = useCart();

  // Form State
  const [customerName, setCustomerName] = useState(() => user?.displayName || '');
  const [phone, setPhone] = useState('');
  const [houseNo, setHouseNo] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState('2 People');
  const [customGuests, setCustomGuests] = useState('');
  const [expectedArrivalTime, setExpectedArrivalTime] = useState('In 15 - 20 mins');
  const [specificTime, setSpecificTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync user name when user logs in
  useEffect(() => {
    if (user?.displayName && !customerName) {
      setCustomerName(user.displayName);
    }
  }, [user]);

  // Check if current delivery locality is serviceable
  const currentZone = deliveryZones.find(
    z => z.pincode === selectedPincode || z.name.toLowerCase() === selectedLocality.toLowerCase()
  );
  const isDeliveryLocalityUnserviceable = orderType === 'delivery' && currentZone && !currentZone.isServiceable;

  // Prepare ordered items
  const orderItems: OrderItem[] = cart.map(cartItem => {
    const dish = menuItems.find(m => m.id === cartItem.menuItemId);
    return {
      menuItemId: cartItem.menuItemId,
      name: dish ? dish.name : 'Delicacy',
      price: dish ? dish.price : 0,
      quantity: cartItem.quantity,
      image: dish?.image || '',
      isJainFriendly: Boolean(dish?.isJainFriendly)
    };
  });

  const handleApplyPromo = (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    const codeToApply = (customCode || promoCodeInput).trim().toUpperCase();
    if (!codeToApply) {
      setPromoMessage({ text: 'Please enter a promo code', type: 'error' });
      return;
    }
    const res = applyPromoCode(codeToApply);
    if (res.success) {
      setPromoMessage({ text: res.message, type: 'success' });
      setPromoCodeInput('');
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.65 }
        });
      } catch {
        // fallback
      }
    } else {
      setPromoMessage({ text: res.message, type: 'error' });
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isStoreOpen) {
      setFormError(settings.closedNotice || 'The restaurant is currently closed for new orders.');
      return;
    }


    // Basic Validation
    if (!customerName.trim()) {
      setFormError('Please enter your full name');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setFormError('Please enter a valid 10-digit phone number');
      return;
    }

    if (orderType === 'delivery') {
      if (isDeliveryLocalityUnserviceable) {
        setFormError('Selected address is outside our delivery radius. Please switch to Takeaway or choose a Phagwara delivery zone.');
        return;
      }
      if (!houseNo.trim()) {
        setFormError('Please enter your House / Flat / Building Number');
        return;
      }
      if (!street.trim() && !selectedLocality) {
        setFormError('Please provide street / locality details');
        return;
      }
    }

    const finalGuests = numberOfGuests === '8+ Group' && customGuests.trim() ? customGuests.trim() : numberOfGuests;
    if (orderType === 'dinein' && !finalGuests) {
      setFormError('Please select how many people are dining');
      return;
    }
    const finalArrivalTime = specificTime ? `At ${specificTime}` : expectedArrivalTime;
    if (orderType === 'dinein' && !finalArrivalTime) {
      setFormError('Please specify the expected arrival time at the restaurant');
      return;
    }

    if (cart.length === 0) {
      setFormError('Your cart is empty. Please add items before checkout.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate Order Reference
      const orderRefId = 'ST' + Math.floor(10000 + Math.random() * 90000);
      const docId = `order_${Date.now()}_${orderRefId}`;
      const now = Date.now();

      // Formulate complete address string
      const fullAddress = orderType === 'delivery'
        ? `${houseNo}, ${street ? street + ', ' : ''}${selectedLocality} (${selectedPincode})${landmark ? ' [Landmark: ' + landmark + ']' : ''}`
        : orderType === 'takeaway'
        ? 'Spice Tree Restaurant, G.T. Road, Phagwara, Punjab'
        : `Dine-In • Party: ${finalGuests} • Expected Arrival: ${finalArrivalTime} (Spice Tree Hall)`;

      // Estimated delivery text
      const estimatedDelivery = orderType === 'delivery'
        ? (currentZone?.estimatedMins || '35-45 mins')
        : orderType === 'takeaway'
        ? '20-25 mins (Ready for Pickup)'
        : `${finalArrivalTime} (Table Prepared)`;

      // NOTE: Payment Gateway Integration spot
      // TODO: integrate Razorpay here
      // const rzpOrder = await createRazorpayOrder({ amount: total * 100, currency: 'INR' });
      // await openRazorpayModal(rzpOrder);

      const newOrder: Order = {
        id: docId,
        orderNumber: orderRefId,
        items: orderItems,
        userId: user?.uid || null,
        customerEmail: user?.email || null,
        customerName: customerName.trim(),
        phone: phone.trim(),
        orderType,
        address: fullAddress,
        locality: selectedLocality || '',
        pincode: selectedPincode || '',
        houseNo: houseNo.trim() || '',
        street: street.trim() || '',
        landmark: landmark.trim() || '',
        deliveryInstructions: deliveryInstructions.trim() || '',
        tableNumber: orderType === 'dinein' ? `Dine-In (${finalGuests})` : '',
        numberOfGuests: orderType === 'dinein' ? finalGuests : '',
        expectedArrivalTime: orderType === 'dinein' ? finalArrivalTime : '',
        paymentMethod,
        subtotal,
        deliveryFee,
        taxes,
        discount: appliedPromo?.discountAmount || 0,
        promoCode: appliedPromo?.code || '',
        total,
        status: 'Placed',
        createdAt: now,
        estimatedDeliveryTime: estimatedDelivery
      };

      // Save Order into Firestore
      const orderDocRef = doc(db, 'orders', docId);
      await setDoc(orderDocRef, newOrder);

      // Trigger Confetti Celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // Safe fallback
      }

      // Update state and navigate to Order Confirmation
      setActiveOrderId(docId);
      clearCart();
      setIsSubmitting(false);
      setActiveTab('confirmation');

    } catch (err: any) {
      console.error('Failed to create Firestore order:', err);
      setFormError('Failed to place order. Please try again or call restaurant directly.');
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-[#e5e1d5] text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-[#f5f4e8] flex items-center justify-center text-[#a03f28] mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="font-serif font-bold text-xl text-[#1b1c15]">Your cart is empty</h2>
        <p className="text-xs text-[#56423d]">
          Please select your favorite dishes before proceeding to checkout.
        </p>
        <button
          onClick={() => setActiveTab('menu')}
          className="px-6 py-2.5 bg-[#a03f28] hover:bg-[#853420] text-white rounded-full text-xs font-bold transition-all shadow-xs"
        >
          Return to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      {/* Back button and page title */}
      <div className="flex items-center gap-3">
        <button
          id="checkout-back-to-menu-btn"
          onClick={() => setActiveTab('menu')}
          className="p-2 rounded-xl bg-white border border-[#e5e1d5] text-[#56423d] hover:text-[#1b1c15] hover:bg-[#f5f4e8] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1b1c15]">
            Checkout & Fulfillment
          </h1>
          <p className="text-xs text-[#56423d]">Spice Tree Pure Veg • Phagwara</p>
        </div>
      </div>

      {formError && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3 text-xs text-red-800 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Form: Customer & Delivery Details */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Fulfillment Switcher */}
          <div className="bg-white rounded-3xl p-6 border border-[#e5e1d5] shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#1b1c15] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#a03f28]" />
              <span>1. How would you like to receive your meal?</span>
            </h3>

            <div className="grid grid-cols-3 gap-2 bg-[#f5f4e8] p-1.5 rounded-2xl border border-[#e5e1d5]">
              <button
                type="button"
                id="checkout-mode-delivery"
                onClick={() => setOrderType('delivery')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                  orderType === 'delivery'
                    ? 'bg-[#a03f28] text-white shadow-xs'
                    : 'text-[#56423d] hover:bg-white/60'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Delivery</span>
              </button>

              <button
                type="button"
                id="checkout-mode-takeaway"
                onClick={() => setOrderType('takeaway')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                  orderType === 'takeaway'
                    ? 'bg-[#a03f28] text-white shadow-xs'
                    : 'text-[#56423d] hover:bg-white/60'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Takeaway</span>
              </button>

              <button
                type="button"
                id="checkout-mode-dinein"
                onClick={() => setOrderType('dinein')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                  orderType === 'dinein'
                    ? 'bg-[#a03f28] text-white shadow-xs'
                    : 'text-[#56423d] hover:bg-white/60'
                }`}
              >
                <Utensils className="w-4 h-4" />
                <span>Dine-In Table</span>
              </button>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-white rounded-3xl p-6 border border-[#e5e1d5] shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#1b1c15] flex items-center gap-2">
              <User className="w-4 h-4 text-[#a03f28]" />
              <span>2. Contact Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1b1c15] mb-1.5">
                  Full Name *
                </label>
                <input
                  id="checkout-name-input"
                  type="text"
                  placeholder="e.g. Jaspreet Singh"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e1d5] text-xs focus:outline-none focus:border-[#a03f28]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1b1c15] mb-1.5">
                  Phone Number (for SMS & Rider calls) *
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-[#e5e1d5] bg-[#f5f4e8] text-xs font-bold text-[#56423d]">
                    +91
                  </span>
                  <input
                    id="checkout-phone-input"
                    type="tel"
                    placeholder="98765 43210"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 px-3.5 py-2.5 rounded-r-xl border border-[#e5e1d5] text-xs focus:outline-none focus:border-[#a03f28]"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address / Location Form based on fulfillment mode */}
          {orderType === 'delivery' && (
            <div className="bg-white rounded-3xl p-6 border border-[#e5e1d5] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-base text-[#1b1c15] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#a03f28]" />
                  <span>3. Delivery Address in Phagwara</span>
                </h3>
                <span className="text-[11px] text-emerald-800 bg-[#beead1]/60 px-2 py-0.5 rounded-md font-semibold">
                  30-40 min Delivery
                </span>
              </div>

              {/* Locality Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#1b1c15] mb-1.5">
                  Select Phagwara Locality / Sector *
                </label>
                <select
                  id="checkout-locality-select"
                  value={selectedLocality}
                  onChange={(e) => {
                    const selected = deliveryZones.find(z => z.name === e.target.value);
                    if (selected) {
                      setSelectedLocality(selected.name);
                      setSelectedPincode(selected.pincode);
                    } else {
                      setSelectedLocality(e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e1d5] text-xs font-medium focus:outline-none focus:border-[#a03f28] bg-[#fbfaee]/40"
                >
                  {deliveryZones.map(zone => (
                    <option key={zone.id} value={zone.name}>
                      {zone.name} - Pin: {zone.pincode} ({zone.isServiceable ? 'Express Serviceable' : 'Out of delivery boundary'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Out of zone alert with auto-switch CTA */}
              {isDeliveryLocalityUnserviceable && (
                <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-2xl space-y-2 text-xs text-amber-900">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Out of Delivery Radius</span>
                  </div>
                  <p>
                    Selected locality <strong>{selectedLocality}</strong> is beyond our 15km delivery area. You can switch to Takeaway (self-pickup) or pick a central Phagwara address.
                  </p>
                  <button
                    type="button"
                    onClick={() => setOrderType('takeaway')}
                    className="px-3.5 py-1.5 bg-[#a03f28] hover:bg-[#853420] text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Switch to Takeaway (Self Pickup)
                  </button>
                </div>
              )}

              {/* House & Street inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1b1c15] mb-1.5">
                    House / Flat / Villa / Shop No. *
                  </label>
                  <input
                    id="checkout-houseno-input"
                    type="text"
                    placeholder="e.g. House #42, Lane 3"
                    value={houseNo}
                    onChange={(e) => setHouseNo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e1d5] text-xs focus:outline-none focus:border-[#a03f28]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1b1c15] mb-1.5">
                    Street / Society / Colony
                  </label>
                  <input
                    id="checkout-street-input"
                    type="text"
                    placeholder="e.g. Near Model Town Park"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e1d5] text-xs focus:outline-none focus:border-[#a03f28]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1b1c15] mb-1.5">
                  Landmark (Optional)
                </label>
                <input
                  id="checkout-landmark-input"
                  type="text"
                  placeholder="e.g. Behind Gurudwara Sahib / Next to SBI ATM"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e1d5] text-xs focus:outline-none focus:border-[#a03f28]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1b1c15] mb-1.5">
                  Rider Delivery Instructions
                </label>
                <input
                  id="checkout-instructions-input"
                  type="text"
                  placeholder="e.g. Please do not ring bell / Call when arrived"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e1d5] text-xs focus:outline-none focus:border-[#a03f28]"
                />
              </div>
            </div>
          )}

          {/* Takeaway details */}
          {orderType === 'takeaway' && (
            <div className="bg-white rounded-3xl p-6 border border-[#e5e1d5] shadow-xs space-y-4">
              <h3 className="font-serif font-bold text-base text-[#1b1c15] flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#a03f28]" />
                <span>3. Self-Pickup Location & Timing</span>
              </h3>

              <div className="bg-[#f5f4e8] p-4 rounded-2xl border border-[#e5e1d5] space-y-2">
                <div className="font-bold text-xs text-[#1b1c15]">Pickup Address:</div>
                <p className="text-xs text-[#56423d]">
                  <strong>Spice Tree Restaurant</strong>, G.T. Road, Near Town Hall, Phagwara, Punjab 144401.
                </p>
                <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold pt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Estimated preparation time: 20-25 mins</span>
                </div>
              </div>
            </div>
          )}

          {/* Dine-In details */}
          {orderType === 'dinein' && (
            <div className="bg-white rounded-3xl p-6 border border-[#e5e1d5] shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#f0eee4] pb-3">
                <h3 className="font-serif font-bold text-base text-[#1b1c15] flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-[#a03f28]" />
                  <span>3. Dine-In Seating & Arrival Details</span>
                </h3>
                <span className="text-[11px] bg-amber-50 text-amber-900 border border-amber-200/80 px-2.5 py-0.5 rounded-full font-medium w-fit">
                  We will arrange the perfect table for you
                </span>
              </div>

              {/* 1. Number of People / Members */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#1b1c15]">
                  How many people are dining? (Number of Members) *
                </label>
                <p className="text-[11px] text-stone-500">
                  Select your party size so our staff can prepare and assign the best table for your comfort.
                </p>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                  {['1 Person', '2 People', '3 - 4 People', '5 - 6 People', '7 - 8 People', '8+ Group'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setNumberOfGuests(option)}
                      className={`py-2 px-2 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                        numberOfGuests === option
                          ? 'border-[#a03f28] bg-[#ffdad2]/30 text-[#a03f28] shadow-xs'
                          : 'border-[#e5e1d5] bg-[#fbfaf3] text-stone-700 hover:bg-[#f5f4e8]'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 mx-auto mb-1 opacity-75" />
                      <span className="block text-[11px] truncate">{option}</span>
                    </button>
                  ))}
                </div>

                {numberOfGuests === '8+ Group' && (
                  <div className="pt-1.5">
                    <input
                      id="checkout-custom-guests-input"
                      type="text"
                      placeholder="e.g. 10 adults, 2 kids (or specific party size)"
                      value={customGuests}
                      onChange={(e) => setCustomGuests(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e1d5] text-xs bg-[#fbfaf3] focus:outline-none focus:border-[#a03f28]"
                    />
                  </div>
                )}
              </div>

              {/* 2. Expected Arrival Time */}
              <div className="space-y-2 pt-3 border-t border-[#f0eee4]">
                <label className="block text-xs font-semibold text-[#1b1c15]">
                  What is the expected time you reach the restaurant? *
                </label>
                <p className="text-[11px] text-stone-500">
                  Let us know when you plan to reach so our chef can time your hot food and keep your table ready.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {[
                    'Already at Restaurant',
                    'In 15 - 20 mins',
                    'In 30 mins',
                    'In 45 - 60 mins',
                  ].map((tOption) => (
                    <button
                      key={tOption}
                      type="button"
                      onClick={() => {
                        setExpectedArrivalTime(tOption);
                        setSpecificTime('');
                      }}
                      className={`py-2.5 px-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                        expectedArrivalTime === tOption && !specificTime
                          ? 'border-[#a03f28] bg-[#ffdad2]/30 text-[#a03f28] shadow-xs'
                          : 'border-[#e5e1d5] bg-[#fbfaf3] text-stone-700 hover:bg-[#f5f4e8]'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 mx-auto mb-1 opacity-75" />
                      <span className="block text-[11px]">{tOption}</span>
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-stone-600">
                  <span className="text-[11px] text-stone-500 font-medium">Or choose specific arrival time:</span>
                  <input
                    id="checkout-specific-time-input"
                    type="time"
                    value={specificTime}
                    onChange={(e) => {
                      setSpecificTime(e.target.value);
                      if (e.target.value) {
                        setExpectedArrivalTime(`At ${e.target.value}`);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl border border-[#e5e1d5] text-xs bg-[#fbfaf3] text-[#1b1c15] focus:outline-none focus:border-[#a03f28]"
                  />
                  {specificTime && (
                    <span className="text-[11px] font-bold text-[#a03f28]">
                      Reaching at {specificTime}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="bg-white rounded-3xl p-6 border border-[#e5e1d5] shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#1b1c15] flex items-center gap-2">
              <Banknote className="w-4 h-4 text-[#a03f28]" />
              <span>4. Choose Payment Method</span>
            </h3>

            <div className="space-y-2.5">
              <label
                className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'upi'
                    ? 'border-[#a03f28] bg-[#ffdad2]/15'
                    : 'border-[#e5e1d5] hover:bg-[#f5f4e8]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    className="accent-[#a03f28] w-4 h-4"
                  />
                  <div>
                    <div className="text-xs font-bold text-[#1b1c15] flex items-center gap-1.5">
                      <span>UPI (GPay / PhonePe / Paytm / BHIM)</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">Fastest</span>
                    </div>
                    <p className="text-[11px] text-stone-500">Pay directly via any UPI app or QR code</p>
                  </div>
                </div>
                <QrCode className="w-5 h-5 text-stone-400" />
              </label>

              <label
                className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-[#a03f28] bg-[#ffdad2]/15'
                    : 'border-[#e5e1d5] hover:bg-[#f5f4e8]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="accent-[#a03f28] w-4 h-4"
                  />
                  <div>
                    <div className="text-xs font-bold text-[#1b1c15]">
                      {orderType === 'delivery' ? 'Cash on Delivery (COD)' : 'Pay at Counter / Table'}
                    </div>
                    <p className="text-[11px] text-stone-500">Pay via cash or UPI when receiving your order</p>
                  </div>
                </div>
                <Banknote className="w-5 h-5 text-stone-400" />
              </label>
            </div>
          </div>
        </div>

        {/* Right Form: Order Summary & Place Order CTA */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#e5e1d5] shadow-sm sticky top-24 space-y-5">
            <div className="flex items-center justify-between border-b border-[#f0eee4] pb-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1b1c15]">Order Summary</h3>
                <p className="text-xs text-[#56423d]">{orderItems.length} delicacies in feast</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#f5f4e8] text-xs font-bold text-[#a03f28] uppercase">
                {orderType}
              </span>
            </div>

            {/* Dishes list */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {orderItems.map(item => (
                <div key={item.menuItemId} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-[#a03f28]">{item.quantity}x</span>
                    <span className="font-medium text-[#1b1c15] truncate">{item.name}</span>
                    {item.isJainFriendly && (
                      <span className="text-[9px] text-emerald-800 bg-emerald-50 px-1 rounded">Jain</span>
                    )}
                  </div>
                  <span className="font-bold text-[#1b1c15] whitespace-nowrap ml-2">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Promo Code Option */}
            <div className="bg-[#fbfaf3] p-3.5 rounded-2xl border border-[#e5e1d5] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1b1c15]">
                  <Tag className="w-3.5 h-3.5 text-[#a03f28]" />
                  <span>Have a Promo Code?</span>
                </div>
                {appliedPromo && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-700" /> Applied
                  </span>
                )}
              </div>

              {appliedPromo ? (
                <div className="flex items-center justify-between bg-white border border-emerald-300 p-2.5 rounded-xl shadow-2xs">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs text-emerald-900 tracking-wider">
                        {appliedPromo.code}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {appliedPromo.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-emerald-700 mt-0.5">
                      ₹{appliedPromo.discountAmount} discount applied to this order
                    </p>
                  </div>
                  <button
                    id="remove-promo-checkout-btn"
                    type="button"
                    onClick={() => {
                      removePromoCode();
                      setPromoMessage(null);
                    }}
                    className="text-xs text-red-600 hover:text-red-700 font-bold hover:underline cursor-pointer px-1 py-0.5"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      id="checkout-promo-input"
                      type="text"
                      placeholder="Enter promo code (e.g. SPICE50)"
                      value={promoCodeInput}
                      onChange={(e) => {
                        setPromoCodeInput(e.target.value.toUpperCase());
                        if (promoMessage) setPromoMessage(null);
                      }}
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#e5e1d5] bg-white font-mono uppercase tracking-wider text-[#1b1c15] placeholder:text-stone-400 placeholder:normal-case focus:outline-none focus:border-[#a03f28]"
                    />
                    <button
                      id="apply-promo-checkout-btn"
                      type="submit"
                      disabled={!promoCodeInput.trim()}
                      className="px-4 py-2 bg-[#1b4332] hover:bg-[#153427] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                    >
                      Apply
                    </button>
                  </div>

                  {/* Available codes quick suggestions */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-stone-500 font-medium">Offers:</span>
                    <button
                      type="button"
                      onClick={() => handleApplyPromo(undefined, 'SPICE50')}
                      className="text-[10px] px-2 py-0.5 rounded-md border border-dashed border-[#a03f28]/60 bg-white text-[#a03f28] font-bold hover:bg-[#ffdad2]/30 transition-colors cursor-pointer"
                    >
                      SPICE50 (₹50 OFF)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPromo(undefined, 'WELCOME10')}
                      className="text-[10px] px-2 py-0.5 rounded-md border border-dashed border-emerald-600/60 bg-white text-emerald-800 font-bold hover:bg-emerald-50 transition-colors cursor-pointer"
                    >
                      WELCOME10 (10% OFF)
                    </button>
                  </div>
                </form>
              )}

              {promoMessage && (
                <div
                  className={`text-[11px] p-2 rounded-lg font-medium flex items-center gap-1.5 ${
                    promoMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {promoMessage.type === 'success' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <Percent className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  )}
                  <span>{promoMessage.text}</span>
                </div>
              )}
            </div>

            {/* Bill details */}
            <div className="space-y-2 text-xs pt-3 border-t border-[#f0eee4]">
              <div className="flex justify-between text-[#56423d]">
                <span>Item Subtotal</span>
                <span className="font-semibold text-[#1b1c15]">₹{subtotal}</span>
              </div>

              {orderType === 'delivery' && (
                <div className="flex justify-between text-[#56423d]">
                  <span>Delivery Partner Fee</span>
                  <span className={deliveryFee === 0 ? 'text-emerald-700 font-bold' : 'font-semibold text-[#1b1c15]'}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-[#56423d]">
                <span>GST & Packaging ({settings.taxRate}%)</span>
                <span className="font-semibold text-[#1b1c15]">₹{taxes}</span>
              </div>

              {appliedPromo && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Promo Discount ({appliedPromo.code})</span>
                  <span>-₹{appliedPromo.discountAmount}</span>
                </div>
              )}

              <div className="pt-3 border-t border-[#e5e1d5] flex justify-between items-center text-base font-bold text-[#1b1c15]">
                <span>To Pay</span>
                <span className="text-xl text-[#a03f28]">₹{total}</span>
              </div>
            </div>

            {!isStoreOpen && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                ⚠️ {settings.closedNotice || 'The restaurant is currently closed for new orders.'}
              </div>
            )}

            {/* Place Order CTA Button */}
            <button
              id="confirm-place-order-btn"
              type="button"
              disabled={isSubmitting || !isStoreOpen}
              onClick={handlePlaceOrder}
              className="w-full py-4 px-6 rounded-2xl bg-[#a03f28] hover:bg-[#853420] text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Confirming Order...</span>
                </div>
              ) : !isStoreOpen ? (
                <span>Restaurant Currently Closed</span>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Place Order • ₹{total}</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#56423d]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Safe & Secure 100% Pure Veg Punjabi Feasts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
