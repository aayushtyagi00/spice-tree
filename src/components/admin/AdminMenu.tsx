import React, { useState, useRef } from 'react';
import { MenuItem, CategoryId } from '../../types';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Sparkles,
  Leaf,
  Star,
  Image as ImageIcon,
  Save,
  X,
  Upload,
  AlertTriangle
} from 'lucide-react';
import { collection, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { seedFirestoreIfEmpty } from '../../data/seedData';

interface AdminMenuProps {
  menuItems: MenuItem[];
}

const CATEGORIES: { id: CategoryId; name: string }[] = [
  { id: 'thalis', name: 'Royal Thalis' },
  { id: 'starters', name: 'Starters & Tandoor' },
  { id: 'mains', name: 'Royal Punjabi Gravies' },
  { id: 'breads', name: 'Tandoori Breads & Rice' },
  { id: 'chinese', name: 'Indo-Chinese Delights' },
  { id: 'continental', name: 'Continental & Pastas' },
  { id: 'snacks', name: 'Quick Bites & Snacks' },
  { id: 'beverages', name: 'Beverages & Lassi' }
];

const PRESET_DISH_IMAGES: { label: string; url: string }[] = [
  {
    label: 'Paneer Tikka',
    url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Dal Makhani',
    url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Paneer Butter Masala',
    url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Garlic Naan',
    url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Veg Hakka Noodles',
    url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Gulab Jamun / Kulfi',
    url: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Punjabi Sweet Lassi',
    url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80'
  }
];

export const AdminMenu: React.FC<AdminMenuProps> = ({ menuItems }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlinePriceEditId, setInlinePriceEditId] = useState<string | null>(null);
  const [inlinePriceValue, setInlinePriceValue] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const addFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Maximum file size limit: 2MB
  const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

  // Helper to convert and compress local file to high-efficiency data URL
  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        reject(new Error(`File size is ${(file.size / (1024 * 1024)).toFixed(2)} MB. Maximum allowed size is 2.0 MB.`));
        return;
      }

      if (!file.type.startsWith('image/')) {
        reject(new Error('Please select a valid image file (JPG, PNG, WebP).'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Resize if wider than 1200px to optimize storage & rendering
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Output high quality WebP / JPEG
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            resolve(compressedDataUrl);
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => reject(new Error('Failed to load selected image.'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file from disk.'));
      reader.readAsDataURL(file);
    });
  };

  const handleAddImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsProcessingImage(true);
    try {
      const dataUrl = await processImageFile(file);
      setNewItem(prev => ({ ...prev, image: dataUrl }));
    } catch (err: any) {
      setUploadError(err.message || 'Image upload failed.');
    } finally {
      setIsProcessingImage(false);
      // Reset input so re-selecting same file triggers change
      if (e.target) e.target.value = '';
    }
  };

  const handleEditImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingItem) return;
    setUploadError(null);
    setIsProcessingImage(true);
    try {
      const dataUrl = await processImageFile(file);
      setEditingItem(prev => (prev ? { ...prev, image: dataUrl } : null));
    } catch (err: any) {
      setUploadError(err.message || 'Image upload failed.');
    } finally {
      setIsProcessingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  // Add Item Form State
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    category: 'starters',
    description: '',
    price: 250,
    portion: '500 ml',
    image: PRESET_DISH_IMAGES[0].url,
    isBestseller: false,
    isJainFriendly: false,
    isAvailable: true,
    tags: []
  });

  // Filter menu items
  const filteredItems = menuItems.filter(item => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesName = item.name.toLowerCase().includes(q);
      const matchesDesc = item.description.toLowerCase().includes(q);
      if (!matchesName && !matchesDesc) return false;
    }
    return true;
  });

  // Toggle availability (86 a dish) with 1 click
  const handleToggleAvailability = async (item: MenuItem) => {
    const nextAvailability = !(item.isAvailable ?? true);
    try {
      await setDoc(doc(db, 'menuItems', item.id), {
        ...item,
        isAvailable: nextAvailability
      }, { merge: true });
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  };

  // Inline price update
  const handleSaveInlinePrice = async (itemId: string) => {
    const num = parseFloat(inlinePriceValue);
    if (isNaN(num) || num <= 0) {
      setInlinePriceEditId(null);
      return;
    }
    try {
      await updateDoc(doc(db, 'menuItems', itemId), {
        price: num
      });
      setInlinePriceEditId(null);
    } catch (err) {
      console.error('Failed to update price:', err);
    }
  };

  // Add new item
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name?.trim() || !newItem.price) return;

    setIsSubmitting(true);
    try {
      const itemId = `dish_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const payload: MenuItem = {
        id: itemId,
        name: newItem.name.trim(),
        category: (newItem.category as CategoryId) || 'starters',
        description: newItem.description?.trim() || '',
        price: Number(newItem.price),
        portion: newItem.portion?.trim() || 'Serves 1-2',
        image: newItem.image || PRESET_DISH_IMAGES[0].url,
        isBestseller: Boolean(newItem.isBestseller),
        isJainFriendly: Boolean(newItem.isJainFriendly),
        isAvailable: true,
        tags: newItem.tags || []
      };

      await setDoc(doc(db, 'menuItems', itemId), payload);
      setIsAddModalOpen(false);
      setNewItem({
        name: '',
        category: 'starters',
        description: '',
        price: 250,
        portion: '500 ml',
        image: PRESET_DISH_IMAGES[0].url,
        isBestseller: false,
        isJainFriendly: false,
        isAvailable: true,
        tags: []
      });
    } catch (err) {
      console.error('Failed to create menu item:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save edit modal
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'menuItems', editingItem.id), {
        name: editingItem.name,
        category: editingItem.category,
        description: editingItem.description,
        price: Number(editingItem.price),
        portion: editingItem.portion || '',
        image: editingItem.image,
        isBestseller: Boolean(editingItem.isBestseller),
        isJainFriendly: Boolean(editingItem.isJainFriendly),
        isAvailable: editingItem.isAvailable ?? true
      }, { merge: true });
      setEditingItem(null);
    } catch (err) {
      console.error('Failed to update menu item:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete item with confirmation
  const handleDeleteItem = async (itemId: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete "${name}" from the menu?`)) {
      try {
        await deleteDoc(doc(db, 'menuItems', itemId));
      } catch (err) {
        console.error('Failed to delete item:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#e5e1d5] shadow-xs">
        <div>
          <h2 className="font-serif font-bold text-xl text-[#1b1c15]">
            Menu & Price Management
          </h2>
          <p className="text-xs text-[#56423d]">
            Total {menuItems.length} dishes in database • Edit prices, availability & culinary details.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              if (window.confirm('Upload and synchronize default menu dishes and delivery zones to Firestore?')) {
                setIsSubmitting(true);
                await seedFirestoreIfEmpty();
                setIsSubmitting(false);
                alert('Successfully synced menu items and delivery zones to Cloud Firestore!');
              }
            }}
            disabled={isSubmitting}
            className="px-3.5 py-2.5 bg-[#f5f4e8] hover:bg-[#eae8d8] text-[#56423d] text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Push default dishes and zones to Firestore database"
          >
            <Sparkles className="w-4 h-4 text-[#a03f28]" />
            <span>Sync Default Menu</span>
          </button>

          <button
            id="admin-add-item-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-[#a03f28] hover:bg-[#883420] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Delicacy</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-4 rounded-2xl border border-[#e5e1d5] shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by dish name, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#f5f4e8] rounded-xl text-xs text-[#1b1c15] focus:outline-none focus:border-[#a03f28]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#a03f28] text-white'
                : 'bg-[#f5f4e8] text-[#56423d] hover:bg-[#eae8d8]'
            }`}
          >
            All ({menuItems.length})
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#a03f28] text-white'
                  : 'bg-[#f5f4e8] text-[#56423d] hover:bg-[#eae8d8]'
              }`}
            >
              {cat.name} ({menuItems.filter(m => m.category === cat.id).length})
            </button>
          ))}
        </div>
      </div>

      {/* Menu Table */}
      <div className="bg-white rounded-3xl border border-[#e5e1d5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#f8f7ee] border-b border-[#e5e1d5] text-[#56423d] font-bold">
                <th className="py-3.5 px-4">Dish</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price (₹)</th>
                <th className="py-3.5 px-4">Special Flags</th>
                <th className="py-3.5 px-4">Live Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0eee4]">
              {filteredItems.map(item => {
                const isAvailable = item.isAvailable ?? true;
                const isEditingPrice = inlinePriceEditId === item.id;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-[#faf9f0] transition-colors ${
                      !isAvailable ? 'bg-stone-50/70 opacity-80' : ''
                    }`}
                  >
                    {/* Dish Name & Image */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover border border-[#e5e1d5] flex-shrink-0"
                        />
                        <div>
                          <div className="font-bold text-[#1b1c15] text-sm flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {item.portion && (
                              <span className="text-[10px] text-stone-400 font-normal">
                                ({item.portion})
                              </span>
                            )}
                          </div>
                          <p className="text-[#56423d] text-[11px] line-clamp-1 max-w-sm">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-md bg-[#f5f4e8] text-[11px] font-semibold text-[#56423d] capitalize">
                        {item.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 font-bold text-[#1b1c15]">
                      {isEditingPrice ? (
                        <div className="flex items-center gap-1">
                          <span className="text-stone-400">₹</span>
                          <input
                            type="number"
                            value={inlinePriceValue}
                            onChange={(e) => setInlinePriceValue(e.target.value)}
                            className="w-16 px-1.5 py-1 border border-[#a03f28] rounded text-xs focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveInlinePrice(item.id)}
                            className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                            title="Save"
                          >
                            <Save className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setInlinePriceEditId(null)}
                            className="p-1 bg-stone-200 text-stone-600 rounded hover:bg-stone-300"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setInlinePriceEditId(item.id);
                            setInlinePriceValue(item.price.toString());
                          }}
                          className="cursor-pointer hover:text-[#a03f28] flex items-center gap-1 group py-1"
                          title="Click to quickly edit price"
                        >
                          <span>₹{item.price}</span>
                          <Edit2 className="w-3 h-3 text-stone-300 group-hover:text-[#a03f28]" />
                        </div>
                      )}
                    </td>

                    {/* Flags */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {item.isBestseller && (
                          <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px] font-bold flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-orange-500 text-orange-500" />
                            Bestseller
                          </span>
                        )}
                        {item.isJainFriendly && (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                            <Leaf className="w-2.5 h-2.5" />
                            Jain Friendly
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Availability One-Tap 86 Toggle */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isAvailable
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                            : 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-300'
                        }`}
                        title="Click to toggle Available vs Sold Out instantly"
                      >
                        {isAvailable ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Available</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                            <span>Sold Out</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-1.5 text-stone-600 hover:text-[#a03f28] hover:bg-[#f5f4e8] rounded-lg transition-colors cursor-pointer"
                          title="Full Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete from Menu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 border border-[#e5e1d5] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#f0eee4] pb-3">
              <h3 className="font-serif font-bold text-lg text-[#1b1c15]">
                Add New Menu Delicacy
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#1b1c15] mb-1">Dish Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Paneer Lababdar"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e1d5] focus:outline-none focus:border-[#a03f28]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1b1c15] mb-1">Category *</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value as CategoryId })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e1d5] focus:outline-none focus:border-[#a03f28]"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1b1c15] mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e1d5] focus:outline-none focus:border-[#a03f28]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1b1c15] mb-1">Description *</label>
                <textarea
                  rows={2}
                  placeholder="Authentic cottage cheese cooked with chopped onions, tomatoes, cashew paste..."
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#e5e1d5] focus:outline-none focus:border-[#a03f28]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#1b1c15] mb-1">Portion Size</label>
                <input
                  type="text"
                  placeholder="e.g. 500 ml or Serves 1-2"
                  value={newItem.portion}
                  onChange={(e) => setNewItem({ ...newItem, portion: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e1d5] focus:outline-none focus:border-[#a03f28]"
                />
              </div>

              {/* Local File Image Upload & Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-[#1b1c15]">
                    Dish Image
                  </label>
                  <span className="text-[10px] text-stone-400 font-medium">
                    Max file size: 2.0 MB (JPG, PNG, WebP)
                  </span>
                </div>

                {uploadError && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-[11px] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Upload Box with Preview */}
                <div className="flex items-start gap-3">
                  <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-[#d9d5c5] bg-[#f5f4e8] flex-shrink-0 overflow-hidden relative group">
                    {newItem.image ? (
                      <>
                        <img
                          src={newItem.image}
                          alt="Dish Preview"
                          className="w-full h-full object-cover"
                        />
                        <div
                          onClick={() => addFileInputRef.current?.click()}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-[10px] font-bold text-center p-1"
                        >
                          Change
                        </div>
                      </>
                    ) : (
                      <div
                        onClick={() => addFileInputRef.current?.click()}
                        className="w-full h-full flex flex-col items-center justify-center text-stone-400 cursor-pointer p-1 text-center"
                      >
                        <ImageIcon className="w-6 h-6 mb-0.5" />
                        <span className="text-[9px] font-medium">No Image</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      ref={addFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleAddImageFileChange}
                      className="hidden"
                      id="add-dish-file-input"
                    />

                    <button
                      type="button"
                      onClick={() => addFileInputRef.current?.click()}
                      disabled={isProcessingImage}
                      className="w-full py-2.5 px-3 rounded-xl border border-[#d9d5c5] bg-[#faf9f0] hover:bg-[#eae8d8] text-[#1b1c15] font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4 text-[#a03f28]" />
                      <span>{isProcessingImage ? 'Optimizing image...' : 'Upload Image from Device'}</span>
                    </button>

                    {/* Quick presets option */}
                    <div>
                      <span className="text-[10px] text-stone-500 font-semibold block mb-1">
                        Or pick from chef presets:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {PRESET_DISH_IMAGES.map((img, i) => (
                          <button
                            type="button"
                            key={i}
                            onClick={() => {
                              setUploadError(null);
                              setNewItem({ ...newItem, image: img.url });
                            }}
                            className="px-2 py-0.5 bg-[#f5f4e8] hover:bg-[#e8e6d5] border border-[#e5e1d5] rounded text-[10px] font-medium text-[#56423d] transition-colors"
                          >
                            {img.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2 border-t border-[#f0eee4]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(newItem.isBestseller)}
                    onChange={(e) => setNewItem({ ...newItem, isBestseller: e.target.checked })}
                    className="accent-[#a03f28] w-4 h-4"
                  />
                  <span className="font-bold text-[#1b1c15]">★ Bestseller</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(newItem.isJainFriendly)}
                    onChange={(e) => setNewItem({ ...newItem, isJainFriendly: e.target.checked })}
                    className="accent-emerald-600 w-4 h-4"
                  />
                  <span className="font-bold text-[#1b1c15]">Jain-Friendly (No Onion/Garlic)</span>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-[#f0eee4]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#e5e1d5] text-stone-600 font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#a03f28] hover:bg-[#883420] text-white font-bold"
                >
                  {isSubmitting ? 'Saving...' : 'Add to Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 border border-[#e5e1d5] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#f0eee4] pb-3">
              <h3 className="font-serif font-bold text-lg text-[#1b1c15]">
                Edit Menu Item: {editingItem.name}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#1b1c15] mb-1">Dish Name *</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e1d5] focus:outline-none focus:border-[#a03f28]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1b1c15] mb-1">Category *</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, category: e.target.value as CategoryId })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e1d5] focus:outline-none focus:border-[#a03f28]"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1b1c15] mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    value={editingItem.price}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, price: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e1d5] focus:outline-none focus:border-[#a03f28]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1b1c15] mb-1">Description *</label>
                <textarea
                  rows={2}
                  value={editingItem.description}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-[#e5e1d5] focus:outline-none focus:border-[#a03f28]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#1b1c15] mb-1">Portion Size</label>
                <input
                  type="text"
                  value={editingItem.portion || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, portion: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e1d5] focus:outline-none focus:border-[#a03f28]"
                />
              </div>

              {/* Local File Image Upload & Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-[#1b1c15]">
                    Dish Image
                  </label>
                  <span className="text-[10px] text-stone-400 font-medium">
                    Max file size: 2.0 MB (JPG, PNG, WebP)
                  </span>
                </div>

                {uploadError && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-[11px] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Upload Box with Preview */}
                <div className="flex items-start gap-3">
                  <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-[#d9d5c5] bg-[#f5f4e8] flex-shrink-0 overflow-hidden relative group">
                    {editingItem.image ? (
                      <>
                        <img
                          src={editingItem.image}
                          alt={editingItem.name}
                          className="w-full h-full object-cover"
                        />
                        <div
                          onClick={() => editFileInputRef.current?.click()}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-[10px] font-bold text-center p-1"
                        >
                          Change
                        </div>
                      </>
                    ) : (
                      <div
                        onClick={() => editFileInputRef.current?.click()}
                        className="w-full h-full flex flex-col items-center justify-center text-stone-400 cursor-pointer p-1 text-center"
                      >
                        <ImageIcon className="w-6 h-6 mb-0.5" />
                        <span className="text-[9px] font-medium">No Image</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleEditImageFileChange}
                      className="hidden"
                      id="edit-dish-file-input"
                    />

                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      disabled={isProcessingImage}
                      className="w-full py-2.5 px-3 rounded-xl border border-[#d9d5c5] bg-[#faf9f0] hover:bg-[#eae8d8] text-[#1b1c15] font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4 text-[#a03f28]" />
                      <span>{isProcessingImage ? 'Optimizing image...' : 'Upload New Image from Device'}</span>
                    </button>

                    {/* Quick presets option */}
                    <div>
                      <span className="text-[10px] text-stone-500 font-semibold block mb-1">
                        Or pick from chef presets:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {PRESET_DISH_IMAGES.map((img, i) => (
                          <button
                            type="button"
                            key={i}
                            onClick={() => {
                              setUploadError(null);
                              setEditingItem({ ...editingItem, image: img.url });
                            }}
                            className="px-2 py-0.5 bg-[#f5f4e8] hover:bg-[#e8e6d5] border border-[#e5e1d5] rounded text-[10px] font-medium text-[#56423d] transition-colors"
                          >
                            {img.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-[#f0eee4]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingItem.isBestseller)}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, isBestseller: e.target.checked })
                    }
                    className="accent-[#a03f28] w-4 h-4"
                  />
                  <span className="font-bold text-[#1b1c15]">★ Bestseller</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingItem.isJainFriendly)}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, isJainFriendly: e.target.checked })
                    }
                    className="accent-emerald-600 w-4 h-4"
                  />
                  <span className="font-bold text-[#1b1c15]">Jain-Friendly</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.isAvailable !== false}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, isAvailable: e.target.checked })
                    }
                    className="accent-emerald-600 w-4 h-4"
                  />
                  <span className="font-bold text-[#1b1c15]">Available for Orders</span>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-[#f0eee4]">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl border border-[#e5e1d5] text-stone-600 font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#a03f28] hover:bg-[#883420] text-white font-bold"
                >
                  {isSubmitting ? 'Saving...' : 'Update Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
