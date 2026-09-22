import React, { useState, useEffect } from 'react';
import { RestaurantSettings, AdminRecord } from '../../types';
import {
  Store,
  IndianRupee,
  Percent,
  Truck,
  ShieldCheck,
  Save,
  UserPlus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Info,
  Crown,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { doc, setDoc, updateDoc, collection, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface AdminSettingsProps {
  settings: RestaurantSettings;
  currentAdmin?: AdminRecord | null;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ settings, currentAdmin }) => {
  const [isStoreOpen, setIsStoreOpen] = useState(settings.isStoreOpen ?? true);
  const [closedNotice, setClosedNotice] = useState(settings.closedNotice || '');
  const [deliveryFee, setDeliveryFee] = useState(settings.deliveryFee ?? 30);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(
    settings.freeDeliveryThreshold ?? 499
  );
  const [taxRate, setTaxRate] = useState(settings.taxRate ?? 5);

  const [adminsList, setAdminsList] = useState<AdminRecord[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('Restaurant Manager');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Check if active admin has Super Admin privileges
  const isSuperAdmin = Boolean(
    currentAdmin &&
    (currentAdmin.role === 'Super Admin' ||
     currentAdmin.email?.toLowerCase() === 'tyagiaayush3030@gmail.com')
  );

  // Real-time live listener for admins list from Firestore
  useEffect(() => {
    const adminsCol = collection(db, 'admins');
    const unsubscribe = onSnapshot(
      adminsCol,
      (snapshot) => {
        const list = snapshot.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<AdminRecord, 'id'>)
        }));
        setAdminsList(list);
      },
      (err) => {
        console.error('Failed to listen to admins list:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  // Update local state when prop changes
  useEffect(() => {
    setIsStoreOpen(settings.isStoreOpen ?? true);
    setClosedNotice(settings.closedNotice || '');
    setDeliveryFee(settings.deliveryFee ?? 30);
    setFreeDeliveryThreshold(settings.freeDeliveryThreshold ?? 499);
    setTaxRate(settings.taxRate ?? 5);
  }, [settings]);

  // Save restaurant configuration
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSaveSuccessMsg(null);
    setErrorNotice(null);

    try {
      const payload: RestaurantSettings = {
        isStoreOpen,
        closedNotice: closedNotice.trim(),
        deliveryFee: Number(deliveryFee),
        freeDeliveryThreshold: Number(freeDeliveryThreshold),
        taxRate: Number(taxRate)
      };

      await setDoc(doc(db, 'settings', 'general'), payload);
      setSaveSuccessMsg('Restaurant configuration saved successfully!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setErrorNotice('Failed to update store settings in Firestore.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Add new authorized admin email (SUPER ADMIN ONLY)
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);

    if (!isSuperAdmin) {
      setErrorNotice('Permission Denied: Only the Super Admin is authorized to add new administrators.');
      return;
    }

    const cleanEmail = newAdminEmail.trim().toLowerCase();
    if (!cleanEmail) return;

    if (adminsList.some(a => a.email && a.email.toLowerCase() === cleanEmail)) {
      setErrorNotice(`An administrator with email "${cleanEmail}" is already registered.`);
      return;
    }

    try {
      const docId = cleanEmail;
      const newAdmin: AdminRecord = {
        id: docId,
        email: cleanEmail,
        name: newAdminName.trim() || 'Staff Member',
        role: newAdminRole,
        addedAt: Date.now()
      };

      await setDoc(doc(db, 'admins', docId), newAdmin);
      setNewAdminEmail('');
      setNewAdminName('');
      setSaveSuccessMsg(`Granted ${newAdminRole} permissions to ${cleanEmail}.`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to add admin:', err);
      setErrorNotice('Failed to add admin record to database.');
    }
  };

  // Remove admin (SUPER ADMIN ONLY)
  const handleRemoveAdmin = async (adminId: string, email: string) => {
    setErrorNotice(null);

    if (!isSuperAdmin) {
      setErrorNotice('Permission Denied: Only the Super Admin can revoke administrator access.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'tyagiaayush3030@gmail.com') {
      setErrorNotice('Security Rule: The primary Super Admin (Owner) account cannot be removed.');
      return;
    }

    if (currentAdmin && cleanEmail === currentAdmin.email.toLowerCase()) {
      setErrorNotice('Security Rule: You cannot revoke your own currently active administrator session.');
      return;
    }

    if (adminsList.length <= 1) {
      setErrorNotice('Cannot remove the only remaining administrator account.');
      return;
    }

    if (window.confirm(`Revoke administrator access for "${cleanEmail}" immediately?\n\nTheir access will be immediately terminated in real-time on all active devices.`)) {
      try {
        await deleteDoc(doc(db, 'admins', adminId));
        setSaveSuccessMsg(`Revoked administrator access for "${cleanEmail}". Session terminated.`);
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      } catch (err) {
        console.error('Failed to remove admin:', err);
        setErrorNotice('Failed to remove admin document from Firestore.');
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-[#e5e1d5] shadow-xs">
        <h2 className="font-serif font-bold text-xl text-[#1b1c15]">
          Store Settings & Configuration
        </h2>
        <p className="text-xs text-[#56423d]">
          Manage online store ordering status, delivery costs, taxation, and admin security permissions.
        </p>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Store Open / Closed Status */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e5e1d5] shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-[#f0eee4] pb-3">
            <Store className="w-5 h-5 text-[#a03f28]" />
            <h3 className="font-serif font-bold text-base text-[#1b1c15]">
              Online Ordering & Store Availability
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#fbfaf3] border border-[#e5e1d5]">
            <div>
              <div className="font-bold text-sm text-[#1b1c15] flex items-center gap-2">
                <span>Accepting Online Orders</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isStoreOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isStoreOpen ? 'Active' : 'Paused'}
                </span>
              </div>
              <p className="text-xs text-[#56423d] mt-0.5">
                When turned off, customers can browse dishes but order checkout will be paused with your custom notice.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isStoreOpen}
                onChange={(e) => setIsStoreOpen(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {!isStoreOpen && (
            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-[#1b1c15]">
                Custom Closed Notice for Customers:
              </label>
              <textarea
                rows={2}
                value={closedNotice}
                onChange={(e) => setClosedNotice(e.target.value)}
                placeholder="e.g. Spice Tree is temporarily closed for routine kitchen sanitization. We will reopen today at 5:00 PM."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e1d5] text-xs focus:outline-none focus:border-[#a03f28]"
              />
            </div>
          )}
        </div>

        {/* Section 2: Delivery & Taxation Rates */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e5e1d5] shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-[#f0eee4] pb-3">
            <Truck className="w-5 h-5 text-[#a03f28]" />
            <h3 className="font-serif font-bold text-base text-[#1b1c15]">
              Delivery Fee & Tax Calculations
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Standard Delivery Fee */}
            <div className="p-4 rounded-2xl bg-[#fbfaf3] border border-[#e5e1d5] space-y-2">
              <label className="block font-bold text-[#1b1c15]">
                Standard Delivery Fee (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-stone-400 font-bold">₹</span>
                <input
                  type="number"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 bg-white rounded-xl border border-[#e5e1d5] font-bold text-[#1b1c15] focus:outline-none focus:border-[#a03f28]"
                  required
                />
              </div>
              <p className="text-[11px] text-stone-500">
                Applied to customer delivery orders below free delivery threshold.
              </p>
            </div>

            {/* Free Delivery Threshold */}
            <div className="p-4 rounded-2xl bg-[#fbfaf3] border border-[#e5e1d5] space-y-2">
              <label className="block font-bold text-[#1b1c15]">
                Free Delivery Above (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-stone-400 font-bold">₹</span>
                <input
                  type="number"
                  value={freeDeliveryThreshold}
                  onChange={(e) => setFreeDeliveryThreshold(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 bg-white rounded-xl border border-[#e5e1d5] font-bold text-[#1b1c15] focus:outline-none focus:border-[#a03f28]"
                  required
                />
              </div>
              <p className="text-[11px] text-stone-500">
                Orders equal or exceeding this value get free delivery automatically.
              </p>
            </div>

            {/* GST Rate */}
            <div className="p-4 rounded-2xl bg-[#fbfaf3] border border-[#e5e1d5] space-y-2">
              <label className="block font-bold text-[#1b1c15]">
                GST & Packaging Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-[#e5e1d5] font-bold text-[#1b1c15] focus:outline-none focus:border-[#a03f28]"
                  required
                />
                <span className="absolute right-3 top-2.5 text-stone-400 font-bold">%</span>
              </div>
              <p className="text-[11px] text-stone-500">
                Standard restaurant GST rate calculated at checkout (e.g. 5%).
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              id="admin-save-settings-btn"
              type="submit"
              disabled={isSavingSettings}
              className="px-6 py-2.5 bg-[#a03f28] hover:bg-[#883420] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSettings ? 'Saving to Firestore...' : 'Save Store Controls'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Error and Success Notices */}
      {errorNotice && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Security Alert</div>
            <p className="mt-0.5">{errorNotice}</p>
          </div>
        </div>
      )}

      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-xs text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Success</div>
            <p className="mt-0.5">{saveSuccessMsg}</p>
          </div>
        </div>
      )}

      {/* Section 3: Authorized Admin Accounts */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e5e1d5] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0eee4] pb-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#a03f28]" />
            <div>
              <h3 className="font-serif font-bold text-base text-[#1b1c15]">
                Authorized Admin Accounts
              </h3>
              <p className="text-[11px] text-[#56423d]">
                Staff authorized to access orders, menu pricing & store controls
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSuperAdmin ? (
              <span className="px-3 py-1 bg-amber-100 border border-amber-300 text-amber-950 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs">
                <Crown className="w-3.5 h-3.5 text-amber-700" />
                Super Admin Controls
              </span>
            ) : (
              <span className="px-3 py-1 bg-stone-100 border border-stone-300 text-stone-700 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-stone-500" />
                Staff View (Read-Only)
              </span>
            )}
            <span className="text-xs text-[#56423d] font-semibold bg-[#f5f4e8] px-2.5 py-1 rounded-full border border-[#e5e1d5]">
              {adminsList.length} Active
            </span>
          </div>
        </div>

        {/* Status explanation notice */}
        {isSuperAdmin ? (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Super Admin Mode Active:</strong> Only you have authority to grant administrator access or revoke staff credentials. Revoking an admin will terminate their session in real-time across all their devices.
            </p>
          </div>
        ) : (
          <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
            <Lock className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Admin Management Restricted</div>
              <p className="mt-0.5 text-amber-800">
                Only the designated <strong>Super Admin</strong> (<span className="font-mono font-bold">tyagiaayush3030@gmail.com</span>) can add or delete administrators. As a staff member, you can view the active team below.
              </p>
            </div>
          </div>
        )}

        {/* Existing Admins List */}
        <div className="space-y-2">
          {adminsList.map(adm => {
            const isOwnerAccount = adm.email && adm.email.toLowerCase() === 'tyagiaayush3030@gmail.com';
            const isSelf = currentAdmin && adm.email && adm.email.toLowerCase() === currentAdmin.email.toLowerCase();

            return (
              <div
                key={adm.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#fbfaf3] border border-[#e5e1d5] text-xs transition-colors hover:border-[#d5cfbe]"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    isOwnerAccount
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-[#a03f28]/10 text-[#a03f28]'
                  }`}>
                    {adm.name ? adm.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1b1c15]">{adm.name || 'Staff Member'}</span>
                      {isOwnerAccount && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300 flex items-center gap-0.5">
                          <Crown className="w-3 h-3 text-amber-700" />
                          Owner
                        </span>
                      )}
                      {isSelf && !isOwnerAccount && (
                        <span className="px-1.5 py-0.5 rounded bg-stone-200 text-stone-700 text-[10px] font-semibold">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-stone-500 font-mono text-[11px]">{adm.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                    adm.role === 'Super Admin'
                      ? 'bg-amber-100 text-amber-900 font-bold'
                      : 'bg-[#f5f4e8] text-[#56423d]'
                  }`}>
                    {adm.role || 'Staff Admin'}
                  </span>

                  {/* Revoke button: ONLY visible and usable by Super Admin, and protected for owner & self */}
                  {isSuperAdmin ? (
                    isOwnerAccount || isSelf ? (
                      <span className="text-[11px] text-stone-400 font-medium px-2 py-1 rounded bg-stone-100">
                        Protected
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRemoveAdmin(adm.id, adm.email)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-xl transition-all text-xs font-bold cursor-pointer"
                        title={`Revoke administrator access for ${adm.email}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Revoke</span>
                      </button>
                    )
                  ) : (
                    <span className="text-[11px] text-stone-400 flex items-center gap-1 px-2">
                      <Lock className="w-3 h-3 text-stone-400" />
                      Authorized
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add New Admin Form - ONLY RENDERED FOR SUPER ADMIN */}
        {isSuperAdmin ? (
          <form onSubmit={handleAddAdmin} className="p-4 rounded-2xl bg-[#f5f4e8] border border-[#e5e1d5] space-y-3">
            <div className="font-bold text-xs text-[#1b1c15] flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-[#a03f28]" />
              <span>Grant Admin Access to New Staff Member</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <input
                type="text"
                placeholder="Staff Name (e.g. Gurpreet Singh)"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                className="px-3 py-2 bg-white rounded-xl border border-[#e5e1d5] focus:outline-none focus:border-[#a03f28]"
                required
              />
              <input
                type="email"
                placeholder="Email (e.g. staff@spicetree.com)"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="px-3 py-2 bg-white rounded-xl border border-[#e5e1d5] focus:outline-none focus:border-[#a03f28]"
                required
              />
              <select
                value={newAdminRole}
                onChange={(e) => setNewAdminRole(e.target.value)}
                className="px-3 py-2 bg-white rounded-xl border border-[#e5e1d5] focus:outline-none focus:border-[#a03f28]"
              >
                <option value="Restaurant Manager">Restaurant Manager</option>
                <option value="Kitchen Lead">Kitchen Lead</option>
                <option value="Super Admin">Super Admin</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-[#1b1c15] hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Grant Admin Access</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-stone-600 text-xs text-center">
            Adding or removing admin accounts requires Super Admin credentials.
          </div>
        )}
      </div>
    </div>
  );
};
