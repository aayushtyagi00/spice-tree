import React, { useState } from 'react';
import { X, Calendar, Clock, Users, Leaf, CheckCircle2, ShieldCheck } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCart } from '../context/CartContext';
import { Reservation } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export const ReservationModal: React.FC = () => {
  const { isReservationModalOpen, setIsReservationModalOpen } = useCart();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('19:30');
  const [guests, setGuests] = useState(4);
  const [isJainMeal, setIsJainMeal] = useState(false);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isReservationModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide your name');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setError('Please provide a 10-digit mobile number for confirmation SMS');
      return;
    }

    setIsSubmitting(true);
    try {
      const reservationId = `res_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      const reservationData: Reservation = {
        id: reservationId,
        name: name.trim(),
        phone: phone.trim(),
        date,
        time,
        guests: Number(guests),
        isJainMeal,
        specialRequests: specialRequests.trim(),
        status: 'pending',
        createdAt: Date.now()
      };

      const docRef = doc(db, 'reservations', reservationId);
      await setDoc(docRef, reservationData);

      setIsBooked(true);
      setIsSubmitting(false);
    } catch (err) {
      console.error('Error saving reservation:', err);
      setError('Could not record reservation. Please contact the front desk directly.');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsReservationModalOpen(false);
    setIsBooked(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-lg bg-[#fbfaee] rounded-3xl shadow-2xl border border-[#e5e1d5] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 bg-white border-b border-[#e5e1d5] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#beead1] flex items-center justify-center text-[#1b4332]">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1b1c15]">
                  Reserve a Table at Spice Tree
                </h3>
                <p className="text-xs text-[#56423d]">G.T. Road, Phagwara • Pure Vegetarian</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isBooked ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#beead1] flex items-center justify-center text-[#1b4332] mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-xl text-[#1b1c15]">Table Reserved Successfully!</h4>
                <p className="text-xs text-[#56423d] max-w-sm mx-auto">
                  We look forward to welcoming you on <strong>{date}</strong> at <strong>{time}</strong> for <strong>{guests} guests</strong>.
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-[#e5e1d5] text-xs text-stone-600 text-left space-y-1">
                <div><strong>Primary Contact:</strong> {name} ({phone})</div>
                <div><strong>Dietary Requirement:</strong> {isJainMeal ? 'Pure Jain Food (No Onion/Garlic)' : 'Regular Pure Veg'}</div>
                <div><strong>Address:</strong> Spice Tree, G.T. Road, Near Town Hall, Phagwara</div>
              </div>
              <button
                onClick={handleClose}
                className="w-full py-3 bg-[#a03f28] hover:bg-[#853420] text-white rounded-xl font-bold text-xs shadow-xs"
              >
                Close & Continue
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1b1c15] mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Gurinder Sahota"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e1d5] text-xs bg-white focus:outline-none focus:border-[#a03f28]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1b1c15] mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e1d5] text-xs bg-white focus:outline-none focus:border-[#a03f28]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1b1c15] mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e5e1d5] text-xs bg-white focus:outline-none focus:border-[#a03f28]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1b1c15] mb-1">
                    Time *
                  </label>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e5e1d5] text-xs bg-white focus:outline-none focus:border-[#a03f28]"
                  >
                    <option value="12:30">12:30 PM (Lunch)</option>
                    <option value="13:30">01:30 PM (Lunch)</option>
                    <option value="14:30">02:30 PM (Lunch)</option>
                    <option value="19:00">07:00 PM (Dinner)</option>
                    <option value="19:30">07:30 PM (Dinner)</option>
                    <option value="20:30">08:30 PM (Dinner)</option>
                    <option value="21:30">09:30 PM (Dinner)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1b1c15] mb-1">
                    Guests *
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e5e1d5] text-xs bg-white focus:outline-none focus:border-[#a03f28]"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Jain Diet Checkbox */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#a3d9bc] bg-[#beead1]/30 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={isJainMeal}
                  onChange={(e) => setIsJainMeal(e.target.checked)}
                  className="accent-[#1b4332] w-4 h-4 rounded"
                />
                <div>
                  <span className="font-bold text-[#1b4332] flex items-center gap-1">
                    <Leaf className="w-3 h-3 text-emerald-700" />
                    Request Jain Food (Strictly No Onion / No Garlic)
                  </span>
                  <p className="text-[11px] text-[#56423d]">
                    Our chef will prepare separate kitchen vessels & Jain gravies for your table.
                  </p>
                </div>
              </label>

              <div>
                <label className="block text-xs font-semibold text-[#1b1c15] mb-1">
                  Special Occasion / Table Request
                </label>
                <input
                  type="text"
                  placeholder="e.g. Birthday Celebration, High Chair required, Quiet booth"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#e5e1d5] text-xs bg-white focus:outline-none focus:border-[#a03f28]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-[#a03f28] hover:bg-[#853420] text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{isSubmitting ? 'Confirming Reservation...' : 'Confirm Table Booking'}</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
