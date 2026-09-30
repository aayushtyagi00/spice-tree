import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  Bike, 
  PartyPopper, 
  MapPin, 
  Phone, 
  FileText, 
  ArrowRight, 
  Utensils, 
  Sparkles, 
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  PackageCheck,
  Search,
  Star,
  AlertTriangle,
  RotateCcw,
  MessageSquare
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCart } from '../context/CartContext';
import { Order, OrderStatus } from '../types';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';
import { CancelOrderModal } from './CancelOrderModal';
import { OrderFeedbackModal } from './OrderFeedbackModal';

const STATUS_STEPS: OrderStatus[] = [
  'Placed',
  'Preparing',
  'Out for Delivery',
  'Delivered'
];

export const OrderConfirmationView: React.FC = () => {
  const { activeOrderId, setActiveTab, addToCart, setIsCartOpen } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Firestore real-time listener for current order
  useEffect(() => {
    if (!activeOrderId) {
      setLoading(false);
      return;
    }

    const orderDocRef = doc(db, 'orders', activeOrderId);
    const unsubscribe = onSnapshot(orderDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const orderData = { id: docSnap.id, ...docSnap.data() } as Order;
        setOrder(orderData);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching order from Firestore:', error);
      setLoading(false);
    });

    // Launch confetti on mount
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
      });
    } catch {
      // Safe fallback
    }

    return () => unsubscribe();
  }, [activeOrderId]);

  if (loading) {

    return (
      <div className="max-w-xl mx-auto my-20 p-8 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#a03f28] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-medium text-[#56423d]">Loading your order confirmation from Firestore...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl border border-[#e5e1d5] text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-[#f5f4e8] flex items-center justify-center text-[#a03f28] mx-auto">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <h2 className="font-serif font-bold text-xl text-[#1b1c15]">No Active Order Selected</h2>
        <p className="text-xs text-[#56423d] leading-relaxed">
          If you previously placed an order, you can easily view its live status and details in your Orders history or lookup using your Order ID/Phone.
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
          <button
            onClick={() => setActiveTab('orders')}
            className="px-5 py-2.5 bg-[#a03f28] text-white rounded-full text-xs font-bold shadow-xs hover:bg-[#853420] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <PackageCheck className="w-4 h-4" />
            <span>Check My Orders & Status</span>
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className="px-5 py-2.5 bg-[#f5f4e8] hover:bg-[#eae8d8] text-[#1b1c15] border border-[#e5e1d5] rounded-full text-xs font-bold transition-all cursor-pointer"
          >
            Explore Menu
          </button>
        </div>
      </div>
    );
  }

  const currentStepIdx = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      {/* Top Banner Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e5e1d5] shadow-md text-center space-y-4 relative overflow-hidden"
      >
        <div className="w-16 h-16 rounded-full bg-[#beead1] flex items-center justify-center text-[#1b4332] mx-auto shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#a03f28]">
            Order Successfully Placed!
          </span>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#1b1c15]">
            Thank You, {order.customerName}!
          </h1>
          <p className="text-xs sm:text-sm text-[#56423d] max-w-lg mx-auto">
            Your pure vegetarian feast is registered in our kitchen at <strong>Spice Tree, Phagwara</strong>.
          </p>
        </div>

        {/* Order Reference Badge & Estimated Delivery */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <div className="bg-[#f5f4e8] px-4 py-2 rounded-xl border border-[#e5e1d5] text-xs">
            <span className="text-stone-500">Order ID: </span>
            <strong className="text-[#1b1c15] font-mono text-sm">#{order.orderNumber}</strong>
          </div>
          <div className="bg-[#beead1]/50 px-4 py-2 rounded-xl border border-[#a3d9bc] text-xs font-bold text-[#1b4332] flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-700" />
            <span>Estimated {order.orderType === 'delivery' ? 'Delivery' : 'Preparation'}: {order.estimatedDeliveryTime || '35-45 mins'}</span>
          </div>
        </div>
      </motion.div>

      {/* Reassurance & Navigation Hint Banner */}
      <div className="bg-[#f5f4e8] border border-[#e5e1d5] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#1b4332] text-white flex items-center justify-center flex-shrink-0">
            <PackageCheck className="w-4 h-4 text-[#ffdad2]" />
          </div>
          <div>
            <p className="font-bold text-[#1b1c15]">Navigating away? Check your food status anytime!</p>
            <p className="text-[#56423d] text-[11px]">
              Tap <strong className="text-[#a03f28]">"My Orders"</strong> or the top <strong className="text-[#a03f28]">"Track Food: {order.status}"</strong> pill to return here or review previous orders.
            </p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('orders')}
          className="px-4 py-2 bg-white hover:bg-stone-50 border border-[#e5e1d5] text-[#1b1c15] font-bold rounded-full text-xs shadow-2xs cursor-pointer flex-shrink-0 whitespace-nowrap"
        >
          View All Orders
        </button>
      </div>

      {/* Live Status Progression Tracker */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e5e1d5] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#f0eee4] pb-4">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#1b1c15] flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${order.status === 'Cancelled' ? 'bg-red-500' : order.status === 'Delivered' ? 'bg-emerald-500' : 'bg-emerald-500 animate-ping'}`}></span>
              <span>Live Order Status: <span className="text-[#a03f28]">{order.status}</span></span>
            </h3>
            <p className="text-xs text-[#56423d]">
              {order.status === 'Cancelled'
                ? 'This order has been cancelled.'
                : order.status === 'Placed'
                ? 'Order registered. You can cancel free of charge before kitchen starts cooking.'
                : 'Directly linked to live updates from the kitchen.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {order.status === 'Placed' && (
              <button
                id="cancel-order-confirmation-btn"
                onClick={() => setIsCancelModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span>Cancel Order</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#beead1]/60 text-[#1b4332] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Live Sync</span>
            </div>
          </div>
        </div>

        {order.status === 'Cancelled' ? (
          <div className="p-6 bg-red-50/80 border border-red-200 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-lg text-red-900">Order #{order.orderNumber} Cancelled</h4>
            {order.cancelReason && (
              <p className="text-xs text-red-800 max-w-md mx-auto">
                <strong>Cancellation Reason:</strong> {order.cancelReason}
              </p>
            )}
            {order.cancelledAt && (
              <p className="text-[11px] text-stone-500">
                Cancelled on {new Date(order.cancelledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(order.cancelledAt).toLocaleDateString()}
              </p>
            )}
            <p className="text-xs text-stone-600 max-w-md mx-auto">
              If any online payment was deducted, it will be refunded to your source account automatically.
            </p>
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => {
                  order.items.forEach(it => addToCart(it.menuItemId, it.quantity));
                  setIsCartOpen(true);
                }}
                className="px-5 py-2.5 bg-[#a03f28] hover:bg-[#853420] text-white text-xs font-bold rounded-full transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reorder Items Into Cart</span>
              </button>
            </div>
          </div>
        ) : (
          /* 4 Steps Timeline */
          <div className="relative pt-4 pb-2">
            {/* Progress Bar Line */}
            <div className="hidden sm:block absolute top-10 left-12 right-12 h-1 bg-stone-200 -z-0">
              <div
                className="h-full bg-[#a03f28] transition-all duration-500"
                style={{ width: `${currentStepIdx >= 0 ? (currentStepIdx / (STATUS_STEPS.length - 1)) * 100 : 0}%` }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-2 relative z-10">
              {[
                {
                  title: 'Order Placed',
                  desc: 'Received by kitchen',
                  icon: FileText,
                  step: 'Placed'
                },
                {
                  title: 'Preparing',
                  desc: 'Simmering in tandoor',
                  icon: ChefHat,
                  step: 'Preparing'
                },
                {
                  title: order.orderType === 'takeaway' ? 'Ready for Pickup' : order.orderType === 'dinein' ? 'Plating for Table' : 'Out for Delivery',
                  desc: order.orderType === 'takeaway' ? 'Counter ready' : order.orderType === 'dinein' ? 'Serving staff assigned' : 'Rider on the way',
                  icon: Bike,
                  step: 'Out for Delivery'
                },
                {
                  title: order.orderType === 'dinein' ? 'Served' : 'Delivered',
                  desc: 'Enjoy your meal!',
                  icon: PartyPopper,
                  step: 'Delivered'
                }
              ].map((stepItem, idx) => {
                const Icon = stepItem.icon;
                const isPassed = currentStepIdx >= 0 && idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={stepItem.step} className="flex sm:flex-col items-center gap-3 sm:gap-2 text-left sm:text-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isPassed
                          ? 'bg-[#a03f28] text-white shadow-md'
                          : 'bg-[#f5f4e8] text-stone-400 border border-stone-300'
                      } ${isCurrent ? 'ring-4 ring-[#a03f28]/20 scale-105' : ''}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div>
                      <h4 className={`text-xs font-bold ${isPassed ? 'text-[#1b1c15]' : 'text-stone-400'}`}>
                        {stepItem.title}
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        {stepItem.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Feedback & Review Card for Delivered Orders */}
        {order.status === 'Delivered' && (
          <div className="pt-4 border-t border-[#f0eee4]">
            <div className="p-5 bg-[#fbfaf3] rounded-2xl border border-[#dedbc8] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e5e1d5] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
                    <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-base text-[#1b1c15]">
                      {order.rating ? 'Your Feedback & Review' : 'How Was Your Meal? Rate & Review'}
                    </h4>
                    <p className="text-xs text-[#56423d]">
                      {order.rating
                        ? 'Thank you for rating your dining experience with Spice Tree.'
                        : 'Share feedback on dish flavors, warmth, and delivery to help our chefs.'}
                    </p>
                  </div>
                </div>

                <button
                  id="open-feedback-btn-confirmation"
                  onClick={() => setIsFeedbackModalOpen(true)}
                  className="px-4 py-2 bg-[#1b4332] hover:bg-[#153427] text-white rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{order.rating ? 'Edit Your Review' : 'Rate & Write Feedback'}</span>
                </button>
              </div>

              {order.rating ? (
                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map(st => (
                      <Star
                        key={st}
                        className={`w-4 h-4 ${st <= (order.rating || 0) ? 'fill-amber-400 text-amber-500' : 'text-stone-300'}`}
                      />
                    ))}
                    <span className="font-bold text-[#1b1c15] ml-1.5">
                      {order.rating} / 5 Stars
                    </span>
                    {order.feedbackAt && (
                      <span className="text-stone-400 text-[11px] ml-2">
                        • {new Date(order.feedbackAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {order.feedbackTags && order.feedbackTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {order.feedbackTags.map(tag => (
                        <span key={tag} className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#beead1] text-[#1b4332]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {order.feedbackComment && (
                    <p className="text-stone-700 italic bg-white p-3 rounded-xl border border-[#e5e1d5] leading-relaxed">
                      "{order.feedbackComment}"
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                  <span>Tap "Rate & Write Feedback" to submit star rating and compliments.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Order Summary & Delivery Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Ordered Items Breakdown */}
        <div className="md:col-span-7 bg-white rounded-3xl p-6 border border-[#e5e1d5] shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-base text-[#1b1c15] border-b border-[#f0eee4] pb-3">
            Items in This Order ({order.items.length})
          </h3>

          <div className="space-y-3">
            {order.items.map(item => (
              <div key={item.menuItemId} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover border border-[#e5e1d5]"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-2xs border border-emerald-600 flex items-center justify-center p-0.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-600"></span>
                      </span>
                      <span className="font-bold text-[#1b1c15]">{item.name}</span>
                    </div>
                    <span className="text-[11px] text-stone-500">
                      ₹{item.price} × {item.quantity}
                    </span>
                  </div>
                </div>

                <span className="font-bold text-[#1b1c15]">
                  ₹{item.price * item.quantity}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#f0eee4] space-y-1.5 text-xs text-[#56423d]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-[#1b1c15]">₹{order.subtotal}</span>
            </div>
            {order.orderType === 'delivery' && (
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-semibold text-[#1b1c15]">
                  {order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Taxes & GST (5%)</span>
              <span className="font-semibold text-[#1b1c15]">₹{order.taxes}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Discount ({order.promoCode || 'PROMO'})</span>
                <span>-₹{order.discount}</span>
              </div>
            )}
            <div className="pt-2 border-t border-[#e5e1d5] flex justify-between text-sm font-bold text-[#1b1c15]">
              <span>Total Paid / Payable</span>
              <span className="text-base text-[#a03f28]">₹{order.total}</span>
            </div>
          </div>
        </div>

        {/* Delivery / Contact info */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#e5e1d5] shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#1b1c15] border-b border-[#f0eee4] pb-3">
              Delivery & Contact
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-stone-400 font-medium">Customer:</span>
                <div className="font-bold text-[#1b1c15] mt-0.5">{order.customerName}</div>
                <div className="text-stone-600">{order.phone}</div>
              </div>

              <div>
                <span className="text-stone-400 font-medium">Fulfillment Destination:</span>
                <div className="font-semibold text-[#1b1c15] mt-0.5 flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-[#a03f28] flex-shrink-0 mt-0.5" />
                  <span>{order.address}</span>
                </div>
              </div>

              <div>
                <span className="text-stone-400 font-medium">Payment Mode:</span>
                <div className="font-bold text-[#1b1c15] uppercase mt-0.5">
                  {order.paymentMethod} • ₹{order.total}
                </div>
              </div>

              {order.deliveryInstructions && (
                <div>
                  <span className="text-stone-400 font-medium">Rider Note:</span>
                  <p className="text-stone-600 italic mt-0.5">"{order.deliveryInstructions}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Need assistance card */}
          <div className="bg-[#f5f4e8] rounded-3xl p-6 border border-[#e5e1d5] text-xs space-y-3">
            <div className="font-serif font-bold text-sm text-[#1b1c15]">Need assistance with this order?</div>
            <p className="text-stone-600">
              Call our manager at the Phagwara restaurant counter for special dietary additions or directions.
            </p>
            <a
              href="tel:+919876543210"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1b4332] text-white font-bold hover:bg-[#153427] transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call +91 98765 43210</span>
            </a>
          </div>
        </div>
      </div>

      {/* Navigation Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
        <button
          id="order-confirm-all-orders-btn"
          onClick={() => setActiveTab('orders')}
          className="px-6 py-3 bg-[#a03f28] hover:bg-[#853420] text-white text-xs font-bold rounded-full transition-all shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <PackageCheck className="w-4 h-4" />
          <span>Go to My Orders & Tracking</span>
        </button>

        <button
          id="order-confirm-browse-menu-btn"
          onClick={() => setActiveTab('menu')}
          className="px-6 py-3 bg-[#f5f4e8] hover:bg-[#eae8d8] text-[#1b1c15] border border-[#e5e1d5] text-xs font-bold rounded-full transition-all cursor-pointer"
        >
          Browse Menu & Add More
        </button>

        <button
          id="order-confirm-back-home-btn"
          onClick={() => setActiveTab('home')}
          className="px-6 py-3 bg-[#1b1c15] hover:bg-black text-white text-xs font-bold rounded-full transition-all shadow-xs cursor-pointer"
        >
          Return to Home Page
        </button>
      </div>

      {/* Cancel Order Dialog Modal */}
      <CancelOrderModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        order={order}
        onCancelled={(updatedOrder) => setOrder(updatedOrder)}
      />

      {/* Feedback & Rating Modal */}
      <OrderFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        order={order}
        onFeedbackSubmitted={(updatedOrder) => setOrder(updatedOrder)}
      />
    </div>
  );
};
