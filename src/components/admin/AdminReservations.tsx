import React, { useState, useEffect } from 'react';
import { Reservation } from '../../types';
import {
  Calendar,
  Clock,
  Phone,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Sparkles,
  MessageSquare,
  Leaf
} from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

export const AdminReservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'confirmed' | 'declined'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const reservationsCol = collection(db, 'reservations');
    const unsubscribe = onSnapshot(
      reservationsCol,
      (snapshot) => {
        const list: Reservation[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Reservation, 'id'>) });
        });
        // Sort newest first
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setReservations(list);
      },
      (err) => {
        console.warn('Reservations snapshot warning:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (reservationId: string, newStatus: 'confirmed' | 'declined') => {
    setUpdatingId(reservationId);
    try {
      await updateDoc(doc(db, 'reservations', reservationId), {
        status: newStatus,
        updatedAt: Date.now()
      });
    } catch (err) {
      console.error('Failed to update reservation status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = reservations.filter(r => !r.status || r.status === 'pending').length;
  const confirmedCount = reservations.filter(r => r.status === 'confirmed').length;
  const declinedCount = reservations.filter(r => r.status === 'declined').length;

  const filteredReservations = reservations.filter((r) => {
    const status = r.status || 'pending';
    if (filterTab !== 'all' && status !== filterTab) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesName = r.name?.toLowerCase().includes(q);
      const matchesPhone = r.phone?.includes(q);
      const matchesDate = r.date?.includes(q);
      if (!matchesName && !matchesPhone && !matchesDate) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#e5e1d5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif font-bold text-xl text-[#1b1c15]">
              Table Reservations Management
            </h2>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <p className="text-xs text-[#56423d]">
            Live feed of customer dining bookings • Accept, seat, or manage Jain requirements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-bold text-[#56423d] bg-[#f5f4e8] px-3.5 py-2 rounded-xl border border-[#e5e1d5] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#a03f28]" />
            <span>{reservations.length} Total Bookings</span>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#e5e1d5] shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTab === 'all'
                ? 'bg-[#a03f28] text-white shadow-xs'
                : 'bg-[#f5f4e8] text-[#56423d] hover:bg-[#eae8d8]'
            }`}
          >
            All ({reservations.length})
          </button>
          <button
            onClick={() => setFilterTab('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === 'pending'
                ? 'bg-[#a03f28] text-white shadow-xs'
                : 'bg-[#f5f4e8] text-[#56423d] hover:bg-[#eae8d8]'
            }`}
          >
            <span>Pending</span>
            {pendingCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-stone-950 text-[10px] font-bold flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilterTab('confirmed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTab === 'confirmed'
                ? 'bg-[#a03f28] text-white shadow-xs'
                : 'bg-[#f5f4e8] text-[#56423d] hover:bg-[#eae8d8]'
            }`}
          >
            Confirmed ({confirmedCount})
          </button>
          <button
            onClick={() => setFilterTab('declined')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTab === 'declined'
                ? 'bg-[#a03f28] text-white shadow-xs'
                : 'bg-[#f5f4e8] text-[#56423d] hover:bg-[#eae8d8]'
            }`}
          >
            Declined ({declinedCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#f5f4e8] rounded-xl text-xs text-[#1b1c15] focus:outline-none focus:border-[#a03f28] border border-transparent"
          />
        </div>
      </div>

      {/* Reservation Cards List */}
      {filteredReservations.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#e5e1d5] space-y-3 shadow-xs">
          <Calendar className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="font-serif font-bold text-base text-[#1b1c15]">No Reservations Found</h3>
          <p className="text-xs text-[#56423d]">
            {searchQuery ? 'No bookings match your search query.' : 'There are no bookings under this tab.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReservations.map((res) => {
            const status = res.status || 'pending';
            const isUpdating = updatingId === res.id;

            return (
              <div
                key={res.id}
                className="bg-white rounded-3xl p-5 border border-[#e5e1d5] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#a03f28]/40 transition-colors"
              >
                <div className="space-y-3">
                  {/* Top Bar: Name & Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-serif font-bold text-base text-[#1b1c15]">
                        {res.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-[#56423d] mt-0.5">
                        <Phone className="w-3 h-3 text-[#a03f28]" />
                        <a href={`tel:${res.phone}`} className="hover:underline font-mono">
                          {res.phone}
                        </a>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : status === 'declined'
                          ? 'bg-red-50 text-red-800 border-red-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {status === 'confirmed' ? 'Confirmed' : status === 'declined' ? 'Declined' : 'Pending'}
                    </span>
                  </div>

                  {/* Booking Details Grid */}
                  <div className="bg-[#f5f4e8] p-3 rounded-2xl border border-[#e5e1d5] grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-[#1b1c15]">
                      <Calendar className="w-3.5 h-3.5 text-[#a03f28]" />
                      <span className="font-medium">{res.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#1b1c15]">
                      <Clock className="w-3.5 h-3.5 text-[#a03f28]" />
                      <span className="font-medium">{res.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#1b1c15]">
                      <Users className="w-3.5 h-3.5 text-[#a03f28]" />
                      <span className="font-medium">{res.guests} Guests</span>
                    </div>
                    <div>
                      {res.isJainMeal ? (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-800 bg-[#beead1]/80 px-2 py-0.5 rounded-md">
                          <Leaf className="w-3 h-3" /> Jain Meal
                        </span>
                      ) : (
                        <span className="text-[10.5px] text-stone-500 font-medium">Standard Veg</span>
                      )}
                    </div>
                  </div>

                  {/* Special Requests */}
                  {res.specialRequests && (
                    <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/80 text-xs text-amber-900 flex items-start gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-relaxed">
                        <strong>Request:</strong> {res.specialRequests}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-[#f0eee4] flex items-center gap-2">
                  {status !== 'confirmed' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(res.id, 'confirmed')}
                      className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm Table</span>
                    </button>
                  )}
                  {status !== 'declined' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(res.id, 'declined')}
                      className="flex-1 py-2 px-3 bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-700 border border-stone-200 hover:border-red-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
