import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Clock, 
  MapPin, 
  Phone, 
  ArrowRight, 
  Search, 
  ChefHat, 
  Bike, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  Utensils, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  PackageCheck,
  Star,
  AlertTriangle
} from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCart } from '../context/CartContext';
import { Order, OrderStatus } from '../types';
import { motion } from 'motion/react';
import { CancelOrderModal } from './CancelOrderModal';
import { OrderFeedbackModal } from './OrderFeedbackModal';

const STATUS_STEPS: OrderStatus[] = [
  'Placed',
  'Preparing',
  'Out for Delivery',
  'Delivered'
];

export const MyOrdersView: React.FC = () => {
  const { 
    activeOrderId, 
    latestActiveOrder, 
    orderHistoryIds, 
    trackOrder, 
    setActiveTab, 
    addToCart, 
    setIsCartOpen,
    user 
  } = useCart();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);

  // Cancellation & Feedback Modal states
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [orderToReview, setOrderToReview] = useState<Order | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const handleOrderUpdated = (updatedOrder: Order) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    if (searchedOrder && searchedOrder.id === updatedOrder.id) {
      setSearchedOrder(updatedOrder);
    }
  };

  // Load all tracked orders
  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      setLoading(true);
      try {
        const fetchedOrders: Order[] = [];
        const seenIds = new Set<string>();

        // 1. Fetch by saved orderHistoryIds
        if (orderHistoryIds && orderHistoryIds.length > 0) {
          // Fetch the most recent 15 orders
          const idsToFetch = orderHistoryIds.slice(0, 15);
          for (const orderId of idsToFetch) {
            try {
              const snap = await getDoc(doc(db, 'orders', orderId));
              if (snap.exists() && !seenIds.has(snap.id)) {
                seenIds.add(snap.id);
                fetchedOrders.push({ id: snap.id, ...snap.data() } as Order);
              }
            } catch (err) {
              console.warn('Could not load order ID:', orderId, err);
            }
          }
        }

        // 2. If logged in, look up orders matching user's UID or verified email
        if (user?.uid) {
          try {
            const ordersRef = collection(db, 'orders');
            const qUid = query(
              ordersRef, 
              where('userId', '==', user.uid),
              limit(15)
            );
            const userSnaps = await getDocs(qUid);
            userSnaps.forEach(docSnap => {
              if (!seenIds.has(docSnap.id)) {
                seenIds.add(docSnap.id);
                fetchedOrders.push({ id: docSnap.id, ...docSnap.data() } as Order);
              }
            });

            // Also check by customerEmail if available
            if (user.email) {
              const qEmail = query(
                ordersRef,
                where('customerEmail', '==', user.email),
                limit(15)
              );
              const emailSnaps = await getDocs(qEmail);
              emailSnaps.forEach(docSnap => {
                if (!seenIds.has(docSnap.id)) {
                  seenIds.add(docSnap.id);
                  fetchedOrders.push({ id: docSnap.id, ...docSnap.data() } as Order);
                }
              });
            }
          } catch (err) {
            console.warn('User order query note:', err);
          }
        }

        // Sort by createdAt descending
        fetchedOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        if (isMounted) {
          setOrders(fetchedOrders);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load orders list:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [orderHistoryIds, user]);

  // Handle Lookup by Order Number or Phone
  const handleLookupOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = searchQuery.trim();
    if (!cleanQuery) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchedOrder(null);

    try {
      const upperQuery = cleanQuery.toUpperCase();
      const numQuery = upperQuery.startsWith('ST') ? upperQuery : `ST${upperQuery}`;

      // Check 1: Check in already loaded orders (instant local search, guest or user)
      const localMatch = orders.find(
        o => o.id === cleanQuery ||
             (o.orderNumber && o.orderNumber.toUpperCase() === numQuery) ||
             o.phone === cleanQuery
      );
      if (localMatch) {
        setSearchedOrder(localMatch);
        setIsSearching(false);
        return;
      }

      // Check 2: Direct doc ID match via single document lookup
      if (cleanQuery.startsWith('order_')) {
        const snap = await getDoc(doc(db, 'orders', cleanQuery));
        if (snap.exists()) {
          const found = { id: snap.id, ...snap.data() } as Order;
          setSearchedOrder(found);
          setIsSearching(false);
          return;
        }
      }

      // Check 3: Scoped Firestore query if user is logged in
      if (user?.uid) {
        const ordersRef = collection(db, 'orders');

        // Match by orderNumber scoped to current user
        const qByOrderNum = query(
          ordersRef,
          where('userId', '==', user.uid),
          where('orderNumber', '==', numQuery),
          limit(1)
        );
        const snapByNum = await getDocs(qByOrderNum);
        if (!snapByNum.empty) {
          const docSnap = snapByNum.docs[0];
          setSearchedOrder({ id: docSnap.id, ...docSnap.data() } as Order);
          setIsSearching(false);
          return;
        }

        // Match by phone scoped to current user
        const qByPhone = query(
          ordersRef,
          where('userId', '==', user.uid),
          where('phone', '==', cleanQuery),
          limit(1)
        );
        const snapByPhone = await getDocs(qByPhone);
        if (!snapByPhone.empty) {
          const docSnap = snapByPhone.docs[0];
          setSearchedOrder({ id: docSnap.id, ...docSnap.data() } as Order);
          setIsSearching(false);
          return;
        }
      }

      setSearchError(`No order found matching "${cleanQuery}". Please check your order reference (e.g. ST48291) or phone number.`);
    } catch (err) {
      console.error('Order search error:', err);
      setSearchError('Could not find order. Please verify the order number or document reference.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleReorder = (order: Order) => {
    if (!order.items || order.items.length === 0) return;
    order.items.forEach(item => {
      addToCart(item.menuItemId, item.quantity);
    });
    setIsCartOpen(true);
  };

  // Determine active order to spotlight
  const featuredOrder = latestActiveOrder || orders.find(o => o.status !== 'Delivered' && o.status !== 'Cancelled') || orders[0];

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Placed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            Placed • Waiting for Kitchen
          </span>
        );
      case 'Preparing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200">
            <ChefHat className="w-3.5 h-3.5 text-orange-600 animate-bounce" />
            Preparing in Kitchen
          </span>
        );
      case 'Out for Delivery':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <Bike className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            Out for Delivery
          </span>
        );
      case 'Delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Delivered
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-200">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e5e1d5] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#a03f28] text-white flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-5 h-5 text-[#ffdad2]" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1b1c15]">
              My Orders & Live Tracker
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#56423d] mt-1.5">
            Monitor real-time kitchen progress, track delivery, and review your previous orders.
          </p>
        </div>

        <button
          id="my-orders-browse-menu-btn"
          onClick={() => setActiveTab('menu')}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1b4332] hover:bg-[#153427] text-white rounded-full text-xs font-bold transition-all shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Explore Menu</span>
        </button>
      </div>

      {/* Quick Lookup Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e5e1d5] shadow-xs">
        <div className="max-w-xl">
          <h2 className="font-serif font-bold text-base text-[#1b1c15] flex items-center gap-2">
            <Search className="w-4 h-4 text-[#a03f28]" />
            Track Any Order (Quick Lookup)
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Ordered from another device or guest checkout? Enter your 5-digit Order ID (e.g. ST51829) or Phone Number:
          </p>

          <form onSubmit={handleLookupOrder} className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <input
                id="order-lookup-input"
                type="text"
                placeholder="Enter Order ID (e.g. ST49281) or Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#e5e1d5] text-xs font-mono uppercase placeholder:normal-case placeholder:font-sans bg-[#fbfaf3] focus:bg-white focus:outline-none focus:border-[#a03f28] transition-all"
              />
            </div>
            <button
              id="order-lookup-submit-btn"
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-5 py-2.5 bg-[#a03f28] hover:bg-[#853420] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              {isSearching ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              <span>Track</span>
            </button>
          </form>

          {searchError && (
            <div className="mt-3 text-xs p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {/* Searched Order Result Card */}
          {searchedOrder && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-2xl bg-[#f5f4e8] border border-[#dedbc8] space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[#1b1c15]">
                    Order #{searchedOrder.orderNumber}
                  </span>
                  {getStatusBadge(searchedOrder.status)}
                </div>
                <div className="flex items-center gap-2">
                  {searchedOrder.status === 'Placed' && (
                    <button
                      id="cancel-searched-order-btn"
                      onClick={() => {
                        setOrderToCancel(searchedOrder);
                        setIsCancelModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      <span>Cancel</span>
                    </button>
                  )}
                  {searchedOrder.status === 'Delivered' && (
                    <button
                      id="review-searched-order-btn"
                      onClick={() => {
                        setOrderToReview(searchedOrder);
                        setIsFeedbackModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>{searchedOrder.rating ? `${searchedOrder.rating}★ Review` : 'Rate Meal'}</span>
                    </button>
                  )}
                  <button
                    id="view-searched-order-btn"
                    onClick={() => trackOrder(searchedOrder.id)}
                    className="px-4 py-1.5 bg-[#a03f28] hover:bg-[#853420] text-white rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>Open Live Status & Bill</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-xs text-stone-600 flex flex-wrap gap-x-4 gap-y-1">
                <span>Customer: <strong className="text-[#1b1c15]">{searchedOrder.customerName}</strong></span>
                <span>Type: <strong className="text-[#1b1c15] uppercase">{searchedOrder.orderType}</strong></span>
                <span>Total: <strong className="text-[#a03f28]">₹{searchedOrder.total}</strong></span>
                <span>Placed: <strong>{new Date(searchedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Active Order Spotlight / Live Tracker */}
      {featuredOrder && featuredOrder.status !== 'Delivered' && featuredOrder.status !== 'Cancelled' && (
        <div className="bg-linear-to-br from-white to-[#fbfaf3] rounded-3xl p-6 sm:p-8 border-2 border-[#a03f28]/30 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-40 h-40 bg-[#ffdad2]/30 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e1d5] pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-red-100 text-[#a03f28] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                  Active Order In Progress
                </span>
                <span className="font-mono text-xs text-stone-500">
                  #{featuredOrder.orderNumber}
                </span>
              </div>
              <h2 className="font-serif font-bold text-xl text-[#1b1c15]">
                Live Status: <span className="text-[#a03f28]">{featuredOrder.status}</span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {featuredOrder.status === 'Placed' && (
                <button
                  id="active-order-cancel-btn"
                  onClick={() => {
                    setOrderToCancel(featuredOrder);
                    setIsCancelModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  <span>Cancel Order</span>
                </button>
              )}

              <button
                id="active-order-full-details-btn"
                onClick={() => trackOrder(featuredOrder.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#a03f28] hover:bg-[#853420] text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>View Full Screen Tracker</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="py-6">
            <div className="grid grid-cols-4 gap-2 relative">
              {/* Connecting line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#f0eee4] -translate-y-1/2 z-0 hidden sm:block"></div>
              
              {STATUS_STEPS.map((step, idx) => {
                const stepIndex = STATUS_STEPS.indexOf(featuredOrder.status);
                const isCompleted = stepIndex >= idx;
                const isCurrent = featuredOrder.status === step;

                return (
                  <div key={step} className="relative z-10 flex flex-col items-center text-center">
                    <div 
                      className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all shadow-2xs ${
                        isCurrent
                          ? 'bg-[#a03f28] text-white ring-4 ring-[#ffdad2]'
                          : isCompleted
                          ? 'bg-[#1b4332] text-white'
                          : 'bg-[#efeee3] text-stone-400'
                      }`}
                    >
                      {idx === 0 && <PackageCheck className="w-4 h-4 sm:w-5 sm:h-5" />}
                      {idx === 1 && <ChefHat className="w-4 h-4 sm:w-5 sm:h-5" />}
                      {idx === 2 && <Bike className="w-4 h-4 sm:w-5 sm:h-5" />}
                      {idx === 3 && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </div>
                    <span className={`text-[11px] sm:text-xs font-bold mt-2 ${isCurrent ? 'text-[#a03f28]' : isCompleted ? 'text-[#1b4332]' : 'text-stone-400'}`}>
                      {step}
                    </span>
                    <span className="text-[9.5px] sm:text-[10px] text-stone-500 hidden sm:block">
                      {idx === 0 && 'Kitchen acknowledged'}
                      {idx === 1 && 'Simmering & baking'}
                      {idx === 2 && (featuredOrder.orderType === 'delivery' ? 'On its way' : 'Counter ready')}
                      {idx === 3 && 'Order fulfilled'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#e5e1d5] text-xs">
            <div className="bg-white p-3 rounded-2xl border border-[#f0eee4]">
              <span className="text-stone-400 text-[10px] uppercase font-bold block">Estimated Arrival</span>
              <div className="font-bold text-[#1b1c15] mt-0.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#a03f28]" />
                <span>{featuredOrder.estimatedDeliveryTime || '30-40 mins'}</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-[#f0eee4]">
              <span className="text-stone-400 text-[10px] uppercase font-bold block">Fulfillment</span>
              <div className="font-bold text-[#1b1c15] mt-0.5 truncate uppercase">
                {featuredOrder.orderType} • {featuredOrder.locality || 'Phagwara'}
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-[#f0eee4]">
              <span className="text-stone-400 text-[10px] uppercase font-bold block">Total Amount</span>
              <div className="font-bold text-[#a03f28] mt-0.5">
                ₹{featuredOrder.total} ({featuredOrder.paymentMethod.toUpperCase()})
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders History List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-bold text-lg text-[#1b1c15]">
            Order History ({orders.length})
          </h2>
          {orders.length > 0 && (
            <span className="text-xs text-stone-500">
              Synced with restaurant cloud
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center bg-white rounded-3xl border border-[#e5e1d5]">
            <div className="w-8 h-8 border-3 border-[#a03f28] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-[#56423d] mt-3 font-medium">Fetching your orders history...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-[#e5e1d5] space-y-4 shadow-2xs">
            <div className="w-16 h-16 rounded-full bg-[#f5f4e8] text-[#a03f28] flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="font-serif font-bold text-lg text-[#1b1c15]">
                No Orders Placed Yet
              </h3>
              <p className="text-xs text-[#56423d]">
                When you order our signature Dal Makhani, Paneer Lababdar, or Tandoori Kulchas, you will be able to track live food status right here.
              </p>
            </div>
            <button
              id="empty-orders-start-order-btn"
              onClick={() => setActiveTab('menu')}
              className="px-6 py-2.5 bg-[#a03f28] hover:bg-[#853420] text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Browse Menu & Order</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => {
              const dateStr = ord.createdAt 
                ? new Date(ord.createdAt).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                : 'Recent';
              const timeStr = ord.createdAt
                ? new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div
                  key={ord.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e5e1d5] shadow-xs hover:border-[#a03f28]/40 transition-all space-y-4"
                >
                  {/* Order header row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0eee4] pb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#f5f4e8] text-[#a03f28] flex items-center justify-center font-bold text-xs">
                        #{ord.orderNumber.slice(-3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#1b1c15]">
                            Order #{ord.orderNumber}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                            {ord.orderType}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500">
                          {dateStr} at {timeStr}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(ord.status)}
                    </div>
                  </div>

                  {/* Order items summary */}
                  <div className="space-y-2">
                    <div className="text-xs text-[#1b1c15] font-medium">
                      {ord.items?.map((it, idx) => (
                        <span key={idx} className="inline-block mr-3">
                          {it.name} <strong className="text-stone-500">×{it.quantity}</strong>
                          {idx < (ord.items?.length || 1) - 1 ? ',' : ''}
                        </span>
                      ))}
                    </div>
                    {ord.address && (
                      <div className="text-[11px] text-stone-500 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-stone-400 flex-shrink-0" />
                        <span className="truncate">{ord.address}</span>
                      </div>
                    )}
                    {ord.status === 'Cancelled' && ord.cancelReason && (
                      <div className="text-[11px] text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 inline-block font-medium">
                        Cancelled: {ord.cancelReason}
                      </div>
                    )}
                    {ord.status === 'Delivered' && ord.feedbackComment && (
                      <div className="text-[11px] text-stone-600 bg-[#fbfaf3] p-2.5 rounded-xl border border-[#dedbc8] italic leading-relaxed">
                        "{ord.feedbackComment}"
                      </div>
                    )}
                  </div>

                  {/* Order footer row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#f0eee4]">
                    <div className="text-xs">
                      <span className="text-stone-400">Total: </span>
                      <strong className="text-sm font-bold text-[#1b1c15]">₹{ord.total}</strong>
                      <span className="text-stone-500 ml-1.5">({ord.paymentMethod.toUpperCase()})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Cancel Order Button (Active while Placed) */}
                      {ord.status === 'Placed' && (
                        <button
                          id={`cancel-order-btn-${ord.id}`}
                          onClick={() => {
                            setOrderToCancel(ord);
                            setIsCancelModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-full text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer flex items-center gap-1"
                          title="Cancel order before cooking begins"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                          <span>Cancel</span>
                        </button>
                      )}

                      {/* Feedback & Rating Button (For Delivered Orders) */}
                      {ord.status === 'Delivered' && (
                        ord.rating ? (
                          <button
                            id={`view-review-btn-${ord.id}`}
                            onClick={() => {
                              setOrderToReview(ord);
                              setIsFeedbackModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer flex items-center gap-1"
                            title="Click to view or edit your review"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            <span>{ord.rating}★ Rated</span>
                          </button>
                        ) : (
                          <button
                            id={`rate-order-btn-${ord.id}`}
                            onClick={() => {
                              setOrderToReview(ord);
                              setIsFeedbackModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 rounded-full text-xs font-bold text-[#1b4332] bg-[#beead1]/60 hover:bg-[#beead1] border border-[#a3d9bc] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>Rate & Review</span>
                          </button>
                        )
                      )}

                      <button
                        id={`reorder-btn-${ord.id}`}
                        onClick={() => handleReorder(ord)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#1b4332] bg-[#beead1]/50 hover:bg-[#beead1] border border-[#a3d9bc] transition-colors cursor-pointer flex items-center gap-1"
                        title="Add these items back to your cart"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reorder</span>
                      </button>

                      <button
                        id={`track-status-btn-${ord.id}`}
                        onClick={() => trackOrder(ord.id)}
                        className="px-4 py-1.5 rounded-full text-xs font-bold text-white bg-[#a03f28] hover:bg-[#853420] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <span>{ord.status === 'Delivered' ? 'View Bill' : 'Track Live'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Restaurant counter contact card */}
      <div className="bg-[#f5f4e8] rounded-3xl p-6 border border-[#e5e1d5] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="font-serif font-bold text-sm text-[#1b1c15]">
            Need special assistance with your order?
          </h4>
          <p className="text-xs text-stone-600">
            For modifications, live delivery rider coordination, or catering inquiries, call our Phagwara counter.
          </p>
        </div>
        <a
          href="tel:+919876543210"
          className="px-5 py-2.5 bg-[#1b4332] hover:bg-[#153427] text-white rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-2 flex-shrink-0"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Call +91 98765 43210</span>
        </a>
      </div>

      {/* Cancel Order Dialog Modal */}
      <CancelOrderModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        order={orderToCancel}
        onCancelled={handleOrderUpdated}
      />

      {/* Feedback & Rating Modal */}
      <OrderFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        order={orderToReview}
        onFeedbackSubmitted={handleOrderUpdated}
      />
    </div>
  );
};
