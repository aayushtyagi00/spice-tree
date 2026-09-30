import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types';
import {
  Clock,
  Phone,
  MapPin,
  Utensils,
  Bike,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Star
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface AdminOrdersProps {
  orders: Order[];
}

type FilterTab = 'all' | 'pending' | 'completed' | 'cancelled';

export const AdminOrders: React.FC<AdminOrdersProps> = ({ orders }) => {
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Compute counts
  const pendingCount = orders.filter(
    o => o.status === 'Placed' || o.status === 'Preparing'
  ).length;
  const completedCount = orders.filter(o => o.status === 'Delivered').length;
  const cancelledCount = orders.filter(o => o.status === 'Cancelled').length;

  // Audio chime alert when a new order arrives
  const previousPlacedCountRef = React.useRef<number>(pendingCount);
  React.useEffect(() => {
    if (pendingCount > previousPlacedCountRef.current) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.45);
        }
      } catch {
        // Safe audio fallback
      }
    }
    previousPlacedCountRef.current = pendingCount;
  }, [pendingCount]);

  // Filter and sort orders (newest first)
  const filteredOrders = orders
    .filter(order => {
      // Tab filter
      if (filterTab === 'pending') {
        if (order.status !== 'Placed' && order.status !== 'Preparing') return false;
      } else if (filterTab === 'completed') {
        if (order.status !== 'Delivered') return false;
      } else if (filterTab === 'cancelled') {
        if (order.status !== 'Cancelled') return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = order.orderNumber?.toLowerCase().includes(q);
        const matchesName = order.customerName?.toLowerCase().includes(q);
        const matchesPhone = order.phone?.includes(q);
        const matchesAddress = order.address?.toLowerCase().includes(q);
        if (!matchesRef && !matchesName && !matchesPhone && !matchesAddress) return false;
      }

      return true;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: Date.now()
      });
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Placed':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Preparing':
        return 'bg-orange-100 text-orange-900 border-orange-300';
      case 'Out for Delivery':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Cancelled':
        return 'bg-red-100 text-red-900 border-red-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-[#e5e1d5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif font-bold text-xl text-[#1b1c15]">
              Live Kitchen & Delivery Dispatch
            </h2>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <p className="text-xs text-[#56423d]">
            Connected live via Firestore listener • Status changes propagate immediately to customer devices.
          </p>
        </div>

        <div className="text-xs font-bold text-[#56423d] bg-[#f5f4e8] px-3 py-1.5 rounded-xl border border-[#e5e1d5] flex items-center gap-2">
          <span>{orders.length} total orders recorded</span>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#e5e1d5] shadow-xs">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              filterTab === 'all'
                ? 'bg-[#a03f28] text-white'
                : 'bg-[#f5f4e8] text-[#56423d] hover:bg-[#eae8d8]'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setFilterTab('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'pending'
                ? 'bg-[#a03f28] text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Kitchen ({pendingCount})</span>
          </button>
          <button
            onClick={() => setFilterTab('completed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'completed'
                ? 'bg-[#a03f28] text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed ({completedCount})</span>
          </button>
          <button
            onClick={() => setFilterTab('cancelled')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'cancelled'
                ? 'bg-[#a03f28] text-white'
                : 'bg-red-50 text-red-800 hover:bg-red-100'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancelled ({cancelledCount})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search order #, customer, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#f5f4e8] rounded-xl text-xs text-[#1b1c15] focus:outline-none focus:border-[#a03f28]"
          />
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#e5e1d5] shadow-xs space-y-2">
          <p className="font-serif font-bold text-base text-[#1b1c15]">No orders found in this filter.</p>
          <p className="text-xs text-[#56423d]">New orders placed through customer checkout will stream here in real time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const isUpdating = updatingOrderId === order.id;

            return (
              <div
                key={order.id}
                id={`admin-order-card-${order.id}`}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e5e1d5] shadow-xs space-y-4 hover:border-[#a03f28]/30 transition-all"
              >
                {/* Card Top: Order Number, Customer, Time, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0eee4] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#a03f28]/10 text-[#a03f28] flex items-center justify-center font-bold text-xs">
                      #{order.orderNumber?.slice(-4) || 'ORD'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif font-bold text-base text-[#1b1c15]">
                          Order #{order.orderNumber}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="text-xs text-[#56423d] flex items-center gap-2 mt-0.5">
                        <span className="font-bold text-[#1b1c15]">{order.customerName}</span>
                        <span>•</span>
                        <a
                          href={`tel:${order.phone}`}
                          className="text-[#a03f28] hover:underline flex items-center gap-0.5 font-medium"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{order.phone}</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end text-xs text-stone-500">
                    <div className="flex items-center gap-1 font-semibold text-[#1b1c15]">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>{formatTime(order.createdAt)}</span>
                    </div>
                    <div className="text-[11px] capitalize text-[#56423d] mt-0.5 flex items-center gap-1">
                      {order.orderType === 'delivery' && <Bike className="w-3 h-3 text-[#a03f28]" />}
                      {order.orderType === 'takeaway' && <ShoppingCart className="w-3 h-3 text-[#a03f28]" />}
                      {order.orderType === 'dinein' && <Utensils className="w-3 h-3 text-[#a03f28]" />}
                      <span className="font-bold">{order.orderType}</span>
                      {order.locality && ` • ${order.locality}`}
                    </div>
                  </div>
                </div>

                {/* Items and Address Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                  {/* Ordered Items List */}
                  <div className="md:col-span-7 bg-[#fbfaf3] p-4 rounded-2xl border border-[#ece8da] space-y-2">
                    <div className="font-bold text-[#1b1c15] uppercase tracking-wider text-[10px] text-stone-500">
                      Dishes Ordered ({order.items.length} items):
                    </div>
                    <div className="space-y-1.5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-[#a03f28] text-white flex items-center justify-center text-[10px] font-bold">
                              {item.quantity}x
                            </span>
                            <span className="font-medium text-[#1b1c15]">{item.name}</span>
                            {item.isJainFriendly && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                Jain
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-[#1b1c15]">
                            ₹{item.price * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-[#e5e1d5] flex items-center justify-between text-xs font-bold text-[#1b1c15]">
                      <span>
                        Total Payable ({order.paymentMethod === 'cod' ? 'Cash/Counter' : 'Prepaid Online'}):
                      </span>
                      <span className="text-sm text-[#a03f28]">₹{order.total}</span>
                    </div>
                  </div>

                  {/* Delivery Details & Instructions */}
                  <div className="md:col-span-5 bg-white p-4 rounded-2xl border border-[#e5e1d5] space-y-2">
                    <div className="font-bold text-[#1b1c15] uppercase tracking-wider text-[10px] text-stone-500">
                      Fulfillment & Location Details:
                    </div>
                    <p className="text-[#56423d] leading-relaxed">
                      {order.address}
                    </p>

                    {order.orderType === 'dinein' && (order.numberOfGuests || order.expectedArrivalTime) && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {order.numberOfGuests && (
                          <span className="px-2 py-0.5 rounded-md bg-[#ffdad2]/40 text-[#a03f28] font-bold text-[10px]">
                            Party: {order.numberOfGuests}
                          </span>
                        )}
                        {order.expectedArrivalTime && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px]">
                            ETA: {order.expectedArrivalTime}
                          </span>
                        )}
                      </div>
                    )}

                    {order.deliveryInstructions && (
                      <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                        <strong>Rider Note:</strong> {order.deliveryInstructions}
                      </div>
                    )}

                    {/* Customer Review / Feedback Box */}
                    {order.rating && (
                      <div className="p-3 bg-[#fbfaf3] rounded-xl border border-amber-200 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          <span>Customer Rating: {order.rating} / 5 Stars</span>
                          {order.feedbackAt && (
                            <span className="text-stone-400 font-normal text-[10px]">
                              • {formatTime(order.feedbackAt)}
                            </span>
                          )}
                        </div>
                        {order.feedbackTags && order.feedbackTags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {order.feedbackTags.map(tag => (
                              <span key={tag} className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {order.feedbackComment && (
                          <p className="text-stone-700 italic pt-0.5">
                            "{order.feedbackComment}"
                          </p>
                        )}
                      </div>
                    )}

                    {/* Cancellation Details Box */}
                    {order.status === 'Cancelled' && (
                      <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-900 text-xs space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                          <span>Cancelled {order.cancelledBy === 'customer' ? 'by Customer' : 'by Restaurant Counter'}</span>
                        </div>
                        {order.cancelReason && (
                          <p className="text-[11px] text-red-700">
                            Reason: {order.cancelReason}
                          </p>
                        )}
                        {order.cancelledAt && (
                          <p className="text-[10px] text-stone-500">
                            Cancelled at: {formatTime(order.cancelledAt)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Update Quick Buttons Row */}
                <div className="pt-3 border-t border-[#f0eee4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-[#56423d] flex items-center gap-1.5">
                    <span>Direct Status Dispatch:</span>
                    {isUpdating && <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#a03f28]" />}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Step 1: Placed */}
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'Placed')}
                      disabled={isUpdating || order.status === 'Placed'}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        order.status === 'Placed'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-[#f5f4e8] hover:bg-[#eae8d8] text-[#56423d]'
                      }`}
                    >
                      1. Placed
                    </button>

                    {/* Step 2: Preparing */}
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'Preparing')}
                      disabled={isUpdating || order.status === 'Preparing'}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        order.status === 'Preparing'
                          ? 'bg-orange-600 text-white shadow-xs'
                          : 'bg-[#f5f4e8] hover:bg-[#eae8d8] text-[#56423d]'
                      }`}
                    >
                      2. Preparing
                    </button>

                    {/* Step 3: Out for Delivery / Ready */}
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'Out for Delivery')}
                      disabled={isUpdating || order.status === 'Out for Delivery'}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        order.status === 'Out for Delivery'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-[#f5f4e8] hover:bg-[#eae8d8] text-[#56423d]'
                      }`}
                    >
                      {order.orderType === 'takeaway'
                        ? '3. Ready for Pickup'
                        : order.orderType === 'dinein'
                        ? '3. Plating'
                        : '3. Out for Delivery'}
                    </button>

                    {/* Step 4: Delivered */}
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'Delivered')}
                      disabled={isUpdating || order.status === 'Delivered'}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        order.status === 'Delivered'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-[#f5f4e8] hover:bg-[#eae8d8] text-[#56423d]'
                      }`}
                    >
                      {order.orderType === 'dinein' ? '4. Served' : '4. Delivered'}
                    </button>

                    {/* Cancel button */}
                    <button
                      onClick={async () => {
                        const reason = window.prompt(`Cancel order #${order.orderNumber}? Enter reason:`, 'Cancelled by restaurant counter');
                        if (reason !== null) {
                          setUpdatingOrderId(order.id);
                          try {
                            await updateDoc(doc(db, 'orders', order.id), {
                              status: 'Cancelled',
                              cancelledAt: Date.now(),
                              cancelledBy: 'admin',
                              cancelReason: reason.trim() || 'Cancelled by restaurant counter',
                              updatedAt: Date.now()
                            });
                          } catch (err) {
                            console.error('Failed to cancel order:', err);
                          } finally {
                            setUpdatingOrderId(null);
                          }
                        }
                      }}
                      disabled={isUpdating || order.status === 'Cancelled'}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        order.status === 'Cancelled'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'text-stone-400 hover:text-red-700 hover:bg-red-50'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
