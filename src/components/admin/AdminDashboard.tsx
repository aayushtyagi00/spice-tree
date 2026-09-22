import React from 'react';
import { Order, MenuItem, RestaurantSettings, OrderStatus } from '../../types';
import {
  ShoppingBag,
  IndianRupee,
  Clock,
  UtensilsCrossed,
  ArrowRight,
  Truck,
  Bike,
  Store,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface AdminDashboardProps {
  orders: Order[];
  menuItems: MenuItem[];
  settings: RestaurantSettings;
  onNavigateTab: (tab: 'dashboard' | 'menu' | 'orders' | 'settings') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  menuItems,
  settings,
  onNavigateTab
}) => {
  // Compute Stats for "Today"
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const todayOrders = orders.filter(o => o.createdAt >= startOfDay);
  const todayRevenue = todayOrders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const pendingOrders = orders.filter(
    o => o.status === 'Placed' || o.status === 'Preparing'
  );

  const availableDishesCount = menuItems.filter(m => m.isAvailable !== false).length;
  const soldOutDishesCount = menuItems.length - availableDishesCount;

  // 5 Most recent orders
  const recentOrders = [...orders]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: Date.now()
      });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const formatOrderTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8">
      {/* Welcome & Store Status Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#e5e1d5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-xl text-[#1b1c15]">
            Welcome to Spice Tree Terminal
          </h2>
          <p className="text-xs text-[#56423d]">
            G.T. Road, Phagwara • Pure Vegetarian Punjabi Kitchen
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border ${
              settings.isStoreOpen
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                settings.isStoreOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>Store Status: {settings.isStoreOpen ? 'Accepting Orders' : 'Store Closed'}</span>
          </div>

          <button
            onClick={() => onNavigateTab('settings')}
            className="px-3 py-1.5 bg-[#f5f4e8] hover:bg-[#efeee3] border border-[#e5e1d5] text-xs font-bold text-[#56423d] rounded-xl transition-colors cursor-pointer"
          >
            Configure
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Orders */}
        <div className="bg-white p-5 rounded-2xl border border-[#e5e1d5] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#56423d] uppercase tracking-wider">
              Today's Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#a03f28] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif font-bold text-2xl text-[#1b1c15]">
              {todayOrders.length}
            </span>
            <span className="text-xs text-stone-500">orders logged</span>
          </div>
          <p className="text-[11px] text-stone-500">
            {todayOrders.filter(o => o.status === 'Delivered').length} successfully delivered
          </p>
        </div>

        {/* Today's Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-[#e5e1d5] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#56423d] uppercase tracking-wider">
              Today's Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-serif font-bold text-2xl text-[#1b1c15]">
              ₹{todayRevenue.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[11px] text-stone-500">
            Avg. ₹{todayOrders.length > 0 ? Math.round(todayRevenue / todayOrders.length) : 0} per order
          </p>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-5 rounded-2xl border border-[#e5e1d5] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#56423d] uppercase tracking-wider">
              Pending in Kitchen
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif font-bold text-2xl text-[#a03f28]">
              {pendingOrders.length}
            </span>
            <span className="text-xs font-bold text-amber-700">active now</span>
          </div>
          <p className="text-[11px] text-stone-500">
            {pendingOrders.filter(o => o.status === 'Placed').length} Placed •{' '}
            {pendingOrders.filter(o => o.status === 'Preparing').length} in Tandoor/Wok
          </p>
        </div>

        {/* Total Menu Items */}
        <div className="bg-white p-5 rounded-2xl border border-[#e5e1d5] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#56423d] uppercase tracking-wider">
              Menu Dishes
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif font-bold text-2xl text-[#1b1c15]">
              {menuItems.length}
            </span>
            <span className="text-xs text-stone-500">delicacies</span>
          </div>
          <p className="text-[11px] text-stone-500">
            <span className="text-emerald-700 font-semibold">{availableDishesCount} Live</span> •{' '}
            <span className="text-red-700 font-semibold">{soldOutDishesCount} Sold Out</span>
          </p>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigateTab('orders')}
          className="p-5 rounded-2xl bg-[#a03f28] text-white text-left hover:bg-[#883420] transition-colors shadow-xs group cursor-pointer flex items-center justify-between"
        >
          <div>
            <div className="font-serif font-bold text-base">Live Order Dispatch</div>
            <p className="text-xs text-[#ffdad2] mt-1">
              Manage incoming tickets, update statuses & dispatch riders.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => onNavigateTab('menu')}
          className="p-5 rounded-2xl bg-white border border-[#e5e1d5] text-left hover:border-[#a03f28]/40 hover:shadow-xs transition-all group cursor-pointer flex items-center justify-between"
        >
          <div>
            <div className="font-serif font-bold text-base text-[#1b1c15]">Manage Menu & Prices</div>
            <p className="text-xs text-[#56423d] mt-1">
              Quickly 86 dishes, change prices, or add new tandoori specialties.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-stone-400 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => onNavigateTab('settings')}
          className="p-5 rounded-2xl bg-white border border-[#e5e1d5] text-left hover:border-[#a03f28]/40 hover:shadow-xs transition-all group cursor-pointer flex items-center justify-between"
        >
          <div>
            <div className="font-serif font-bold text-base text-[#1b1c15]">Store & Delivery Controls</div>
            <p className="text-xs text-[#56423d] mt-1">
              Toggle store open/closed, change delivery fee & tax rates.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-stone-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* 5 Most Recent Orders */}
      <div className="bg-white rounded-3xl p-6 border border-[#e5e1d5] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#f0eee4] pb-4">
          <div>
            <h3 className="font-serif font-bold text-base text-[#1b1c15]">
              Recent 5 Incoming Orders
            </h3>
            <p className="text-xs text-[#56423d]">
              Live updates synced with customer trackers.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-bold text-[#a03f28] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Orders ({orders.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-xs">
            No orders placed yet today. Orders placed through customer checkout will stream here in real time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#f0eee4] text-[#56423d] font-bold">
                  <th className="pb-3 pr-4">Order Ref</th>
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Items Summary</th>
                  <th className="pb-3 pr-4">Total</th>
                  <th className="pb-3 pr-4">Placed At</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Quick Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eee4]">
                {recentOrders.map(order => {
                  const statusColors: Record<OrderStatus, string> = {
                    Placed: 'bg-amber-100 text-amber-800 border-amber-300',
                    Preparing: 'bg-orange-100 text-orange-800 border-orange-300',
                    'Out for Delivery': 'bg-blue-100 text-blue-800 border-blue-300',
                    Delivered: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                    Cancelled: 'bg-red-100 text-red-800 border-red-300'
                  };

                  return (
                    <tr key={order.id} className="hover:bg-[#faf9f0] transition-colors">
                      <td className="py-3.5 pr-4 font-bold text-[#1b1c15]">
                        #{order.orderNumber}
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="font-bold text-[#1b1c15]">{order.customerName}</div>
                        <div className="text-stone-400 text-[11px]">{order.phone}</div>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="capitalize px-2 py-0.5 rounded-md bg-[#f5f4e8] font-semibold text-[#56423d] text-[11px]">
                          {order.orderType}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 max-w-xs truncate text-[#56423d]">
                        {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      </td>
                      <td className="py-3.5 pr-4 font-bold text-[#1b1c15]">
                        ₹{order.total}
                      </td>
                      <td className="py-3.5 pr-4 text-stone-500 whitespace-nowrap">
                        {formatOrderTime(order.createdAt)}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            statusColors[order.status] || 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)
                          }
                          className="px-2.5 py-1 rounded-lg bg-white border border-[#e5e1d5] text-xs font-semibold text-[#1b1c15] cursor-pointer focus:outline-none focus:border-[#a03f28]"
                        >
                          <option value="Placed">Placed</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Out for Delivery">
                            {order.orderType === 'takeaway'
                              ? 'Ready for Pickup'
                              : order.orderType === 'dinein'
                              ? 'Plating'
                              : 'Out for Delivery'}
                          </option>
                          <option value="Delivered">
                            {order.orderType === 'dinein' ? 'Served' : 'Delivered'}
                          </option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
