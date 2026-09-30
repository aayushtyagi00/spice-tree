import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X, Check, Phone, ArrowRight } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Order } from '../types';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onCancelled?: (updatedOrder: Order) => void;
}

const CANCEL_REASONS = [
  'Placed by mistake / want to re-order',
  'Want to change delivery address or phone',
  'Want to change items or quantities',
  'Wait time is longer than anticipated',
  'Change of dining plans',
  'Other reason'
];

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  onCancelled
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const isEligibleToCancel = order.status === 'Placed';

  const handleConfirmCancellation = async () => {
    if (!order) return;

    if (!isEligibleToCancel) {
      setErrorMsg(
        'Our kitchen has already begun preparing your food. Please contact our counter at +91 98765 43210 for special assistance.'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const reasonToRecord = selectedReason === 'Other reason'
      ? (customReason.trim() || 'Other reason')
      : (customReason.trim() ? `${selectedReason} - ${customReason.trim()}` : selectedReason);

    try {
      const cancelPayload = {
        status: 'Cancelled' as const,
        cancelledAt: Date.now(),
        cancelReason: reasonToRecord.slice(0, 300),
        cancelledBy: 'customer' as const
      };

      await updateDoc(doc(db, 'orders', order.id), cancelPayload);

      const updated: Order = {
        ...order,
        ...cancelPayload
      };

      if (onCancelled) {
        onCancelled(updated);
      }

      onClose();
    } catch (err: unknown) {
      console.error('Cancellation error:', err);
      const message = err instanceof Error ? err.message : 'Failed to cancel order.';
      if (message.includes('permission-denied') || message.includes('Missing or insufficient permissions')) {
        setErrorMsg('Cancellation window has closed or kitchen has started preparation. Please call the restaurant counter.');
      } else {
        setErrorMsg('Unable to cancel at this moment. Please check your internet connection or call +91 98765 43210.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#e5e1d5] overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-start gap-3.5 pr-8">
            <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 border border-red-100 shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#1b1c15]">
                Cancel Order #{order.orderNumber}?
              </h3>
              <p className="text-xs text-[#56423d] mt-0.5">
                Total: <strong className="text-[#1b1c15]">₹{order.total}</strong> • {order.items.length} dishes
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4 overflow-y-auto pr-1 flex-1">
            {!isEligibleToCancel ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-3">
                <p className="font-semibold text-amber-900">
                  Notice: Your order status is already <span className="font-bold underline">{order.status}</span>.
                </p>
                <p className="text-amber-800 leading-relaxed">
                  Automatic client cancellation is only available while the kitchen has not begun simmering or baking. Since preparation is already underway, please call our counter directly for any urgent stop:
                </p>
                <a
                  href="tel:+919876543210"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#1b4332] text-white font-bold rounded-xl text-xs hover:bg-[#153427] transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Phagwara Counter (+91 98765 43210)</span>
                </a>
              </div>
            ) : (
              <>
                <div className="p-3.5 rounded-2xl bg-[#fbfaf3] border border-[#e5e1d5] text-xs text-[#56423d]">
                  <p>
                    Orders can be cancelled free of charge while in the <strong className="text-[#a03f28]">"Placed"</strong> state before kitchen preparation begins.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#1b1c15] block">
                    Please select a reason for cancellation:
                  </label>
                  <div className="space-y-1.5">
                    {CANCEL_REASONS.map(reason => {
                      const isSelected = selectedReason === reason;
                      return (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => setSelectedReason(reason)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer border ${
                            isSelected
                              ? 'bg-red-50/70 border-red-300 text-red-950 font-bold'
                              : 'bg-white hover:bg-stone-50 border-stone-200 text-[#56423d]'
                          }`}
                        >
                          <span>{reason}</span>
                          {isSelected && <Check className="w-4 h-4 text-red-600 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Additional / Custom reason text box */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1b1c15] block">
                    Additional notes or feedback (Optional):
                  </label>
                  <textarea
                    rows={2}
                    maxLength={250}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Provide any details to help our team improve..."
                    className="w-full p-3 rounded-xl border border-[#e5e1d5] text-xs bg-[#fbfaf3] focus:bg-white focus:outline-none focus:border-[#a03f28] transition-all resize-none"
                  />
                  <div className="text-[10px] text-stone-400 text-right">
                    {customReason.length}/250
                  </div>
                </div>
              </>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {errorMsg}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-6 pt-4 border-t border-[#f0eee4] flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-bold text-[#56423d] hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Keep My Order
            </button>

            {isEligibleToCancel && (
              <button
                type="button"
                onClick={handleConfirmCancellation}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Yes, Cancel Order</span>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
