import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X, Sparkles, Check, Heart, ThumbsUp } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Order } from '../types';
import confetti from 'canvas-confetti';

interface OrderFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onFeedbackSubmitted?: (updatedOrder: Order) => void;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Needs Improvement',
  2: 'Fair Experience',
  3: 'Good & Satisfying',
  4: 'Very Good Taste!',
  5: 'Outstanding & Delicious! ⭐'
};

const COMPLIMENT_TAGS = [
  '😋 Authentic Punjabi Taste',
  '🔥 Served Hot & Fresh',
  '⚡ Fast & Timely Delivery',
  '📦 Hygienic Packaging',
  '🍛 Generous Portions',
  '🌿 Pure Jain Preparation',
  '✨ Great Hospitality'
];

export const OrderFeedbackModal: React.FC<OrderFeedbackModalProps> = ({
  isOpen,
  onClose,
  order,
  onFeedbackSubmitted
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customComment, setCustomComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Pre-fill existing rating/feedback if order already reviewed
  useEffect(() => {
    if (order) {
      if (order.rating) {
        setRating(order.rating);
      } else {
        setRating(5);
      }
      setSelectedTags(order.feedbackTags || []);
      setCustomComment(order.feedbackComment || '');
      setIsSuccess(false);
      setErrorMsg(null);
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      if (selectedTags.length < 5) {
        setSelectedTags([...selectedTags, tag]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    if (rating < 1 || rating > 5) {
      setErrorMsg('Please tap a star to give a rating between 1 and 5.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const feedbackPayload = {
        rating,
        feedbackComment: customComment.trim().slice(0, 500),
        feedbackTags: selectedTags,
        feedbackAt: Date.now()
      };

      await updateDoc(doc(db, 'orders', order.id), feedbackPayload);

      // Trigger celebratory confetti on good ratings
      if (rating >= 4) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch {
          // ignore
        }
      }

      setIsSuccess(true);
      const updated: Order = {
        ...order,
        ...feedbackPayload
      };

      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(updated);
      }

      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: unknown) {
      console.error('Feedback submit error:', err);
      const message = err instanceof Error ? err.message : 'Failed to save feedback.';
      if (message.includes('permission-denied')) {
        setErrorMsg('Feedback can only be submitted for completed/delivered orders.');
      } else {
        setErrorMsg('Could not submit feedback. Please check your internet connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedRating = hoverRating !== null ? hoverRating : rating;

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

        {/* Modal Content */}
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

          {isSuccess ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="font-serif font-bold text-2xl text-[#1b1c15]">
                Thank You for Your Feedback!
              </h3>
              <p className="text-xs text-[#56423d] max-w-sm mx-auto">
                Your review helps the Spice Tree kitchen maintain our pure vegetarian hospitality standards in Phagwara.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              {/* Header */}
              <div className="flex items-start gap-3.5 pr-8">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100 shadow-xs">
                  <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#1b1c15]">
                    Rate Your Meal • #{order.orderNumber}
                  </h3>
                  <p className="text-xs text-[#56423d] mt-0.5">
                    How was your dining experience with Spice Tree?
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="mt-5 space-y-5 overflow-y-auto pr-1 flex-1">
                {/* 5-Star Interactive Rating */}
                <div className="p-4 rounded-2xl bg-[#fbfaf3] border border-[#e5e1d5] text-center space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                    Tap to Rate (1 to 5 Stars)
                  </span>

                  <div className="flex items-center justify-center gap-2 py-1">
                    {[1, 2, 3, 4, 5].map((starValue) => {
                      const isFilled = starValue <= displayedRating;
                      return (
                        <button
                          key={starValue}
                          type="button"
                          onClick={() => setRating(starValue)}
                          onMouseEnter={() => setHoverRating(starValue)}
                          onMouseLeave={() => setHoverRating(null)}
                          className="p-1 rounded-xl hover:scale-115 transition-transform cursor-pointer focus:outline-none"
                          title={`${starValue} Stars`}
                        >
                          <Star
                            className={`w-8 h-8 transition-colors ${
                              isFilled
                                ? 'fill-amber-400 text-amber-500 drop-shadow-xs'
                                : 'text-stone-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <div className="font-serif font-bold text-sm text-[#a03f28] min-h-[20px]">
                    {RATING_LABELS[displayedRating] || 'Select your rating'}
                  </div>
                </div>

                {/* Quick Compliment Tags */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#1b1c15] block">
                    What did you like the most? (Tap to select)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {COMPLIMENT_TAGS.map(tag => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-[#beead1] border-[#1b4332] text-[#1b4332] font-bold shadow-2xs'
                              : 'bg-white hover:bg-stone-50 border-[#e5e1d5] text-[#56423d]'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Review Feedback Text Box */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#1b1c15]">
                      Custom Feedback / Review:
                    </label>
                    <span className="text-[10px] text-stone-400">
                      {customComment.length}/500
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={customComment}
                    onChange={(e) => setCustomComment(e.target.value)}
                    placeholder="Tell us what you loved about our Dal Makhani, Paneer, or delivery speed..."
                    className="w-full p-3 rounded-xl border border-[#e5e1d5] text-xs bg-[#fbfaf3] focus:bg-white focus:outline-none focus:border-[#a03f28] transition-all resize-none leading-relaxed"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                    {errorMsg}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-6 pt-4 border-t border-[#f0eee4] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-[#56423d] hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#a03f28] hover:bg-[#853420] text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{order.rating ? 'Update Feedback' : 'Submit Review'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
