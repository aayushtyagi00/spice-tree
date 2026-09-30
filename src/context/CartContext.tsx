import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, getDocs, doc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from '../firebase/config';
import { CartItem, MenuItem, DeliveryZone, OrderType, AppUser, ActiveTab, RestaurantSettings, Order } from '../types';
import { INITIAL_MENU_ITEMS, INITIAL_DELIVERY_ZONES, DEFAULT_SETTINGS, seedFirestoreIfEmpty } from '../data/seedData';

interface PromoState {
  code: string;
  discountAmount: number;
  label: string;
}

interface CartContextType {
  cart: CartItem[];
  menuItems: MenuItem[];
  deliveryZones: DeliveryZone[];
  isLoadingMenu: boolean;
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  selectedLocality: string;
  setSelectedLocality: (loc: string) => void;
  selectedPincode: string;
  setSelectedPincode: (pin: string) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeOrderId: string | null;
  setActiveOrderId: (id: string | null) => void;
  orderHistoryIds: string[];
  latestActiveOrder: Order | null;
  trackOrder: (orderId: string) => void;
  
  // Settings
  settings: RestaurantSettings;
  isStoreOpen: boolean;
  
  // Cart Actions
  addToCart: (menuItemId: string, qty?: number) => void;
  removeFromCart: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, delta: number) => void;
  clearCart: () => void;
  getItemQuantity: (menuItemId: string) => number;
  
  // Calculations
  cartCount: number;
  subtotal: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  taxes: number;
  total: number;
  appliedPromo: PromoState | null;
  applyPromoCode: (code: string) => { success: boolean; message: string };
  removePromoCode: () => void;
  
  // Zone helper
  checkDeliveryServiceability: (input: string) => {
    isServiceable: boolean;
    zone?: DeliveryZone;
    message: string;
  };
  
  // Table reservation modal
  isReservationModalOpen: boolean;
  setIsReservationModalOpen: (open: boolean) => void;

  // Authentication
  user: AppUser | null;
  setAppUser: (user: AppUser | null) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  logout: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'spicetree_cart_v1';
const USER_STORAGE_KEY = 'spicetree_user_v1';
const ACTIVE_ORDER_STORAGE_KEY = 'spicetree_active_order_v2';
const ORDER_HISTORY_STORAGE_KEY = 'spicetree_order_history_v2';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(INITIAL_DELIVERY_ZONES);
  const [settings, setSettings] = useState<RestaurantSettings>(DEFAULT_SETTINGS);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);

  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [selectedLocality, setSelectedLocality] = useState<string>('Guru Hargobind Nagar');
  const [selectedPincode, setSelectedPincode] = useState<string>('144401');
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Helper to extract the active tab from window pathname or hash
  const getTabFromLocation = (): ActiveTab => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
    const hash = window.location.hash.toLowerCase().replace(/^#+/, '');

    if (path === 'admin' || hash === 'admin') return 'admin';
    if (path === 'menu' || hash === 'menu') return 'menu';
    if (path === 'orders' || hash === 'orders') return 'orders';
    if (path === 'about' || hash === 'about') return 'about';
    if (path === 'checkout' || hash === 'checkout') return 'checkout';
    if (path === 'confirmation' || hash === 'confirmation') return 'confirmation';
    return 'home';
  };

  // Initial active tab based on real URL pathname or hash
  const [activeTab, setActiveTabState] = useState<ActiveTab>(() => getTabFromLocation());

  const setActiveTab = (tab: ActiveTab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      const currentTab = getTabFromLocation();
      if (currentTab !== tab) {
        const targetPath = tab === 'home' ? '/' : `/${tab}`;
        window.history.pushState({ tab }, '', targetPath);
      }
      // Clean up hash if not in admin tab
      if (tab !== 'admin' && window.location.hash === '#admin') {
        window.location.hash = '';
      }
    }
  };

  // Sync with browser Back and Forward navigation buttons & hash changes
  useEffect(() => {
    const handleNavigationSync = () => {
      const tab = getTabFromLocation();
      setActiveTabState(tab);
    };
    window.addEventListener('popstate', handleNavigationSync);
    window.addEventListener('hashchange', handleNavigationSync);
    return () => {
      window.removeEventListener('popstate', handleNavigationSync);
      window.removeEventListener('hashchange', handleNavigationSync);
    };
  }, []);

  const [activeOrderId, setActiveOrderIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ACTIVE_ORDER_STORAGE_KEY) || sessionStorage.getItem('spicetree_active_order') || null;
    } catch {
      return null;
    }
  });

  const [orderHistoryIds, setOrderHistoryIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(ORDER_HISTORY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [latestActiveOrder, setLatestActiveOrder] = useState<Order | null>(null);

  const setActiveOrderId = (id: string | null) => {
    setActiveOrderIdState(id);
    try {
      if (id) {
        localStorage.setItem(ACTIVE_ORDER_STORAGE_KEY, id);
        sessionStorage.setItem('spicetree_active_order', id);
        setOrderHistoryIds(prev => {
          const updated = [id, ...prev.filter(x => x !== id)];
          localStorage.setItem(ORDER_HISTORY_STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
      } else {
        localStorage.removeItem(ACTIVE_ORDER_STORAGE_KEY);
        sessionStorage.removeItem('spicetree_active_order');
      }
    } catch (err) {
      console.warn('Order storage sync err:', err);
    }
  };

  // Real-time listener for latestActiveOrder
  useEffect(() => {
    if (!activeOrderId) {
      setLatestActiveOrder(null);
      return;
    }

    const orderDocRef = doc(db, 'orders', activeOrderId);
    const unsubscribe = onSnapshot(orderDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const orderData = { id: docSnap.id, ...docSnap.data() } as Order;
        setLatestActiveOrder(orderData);
      } else {
        setLatestActiveOrder(null);
      }
    }, (err) => {
      console.warn('Active order snapshot warning:', err);
    });

    return () => unsubscribe();
  }, [activeOrderId]);

  const trackOrder = (orderId: string) => {
    setActiveOrderId(orderId);
    setActiveTab('confirmation');
  };
  const [appliedPromo, setAppliedPromo] = useState<PromoState | null>(null);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [user, setUserState] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Handle direct modal deep-link paths on initial page load (e.g. /reserve, /cart, /login)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
      if (['reserve', 'reservation', 'book-table'].includes(path)) {
        setIsReservationModalOpen(true);
        window.history.replaceState({ tab: 'home' }, '', '/');
      } else if (['cart', 'bag'].includes(path)) {
        setIsCartOpen(true);
        window.history.replaceState({ tab: 'menu' }, '', '/menu');
      } else if (['login', 'signin', 'account'].includes(path)) {
        setIsAuthModalOpen(true);
        window.history.replaceState({ tab: 'home' }, '', '/');
      } else if (
        path &&
        !['home', 'menu', 'orders', 'about', 'checkout', 'confirmation', 'admin'].includes(path) &&
        !path.startsWith('admin')
      ) {
        // Canonical fallback for unrecognized URLs
        window.history.replaceState({ tab: 'home' }, '', '/');
      }
    }
  }, []);

  const setAppUser = (newUser: AppUser | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const mapped: AppUser = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        };
        setAppUser(mapped);
      } else {
        setAppUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out warning:', err);
    }
    setAppUser(null);
  };

  // Sync active order ID to session storage
  useEffect(() => {
    if (activeOrderId) {
      sessionStorage.setItem('spicetree_active_order', activeOrderId);
    }
  }, [activeOrderId]);

  // Sync cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cart]);

  // Load and subscribe to Firestore menuItems, deliveryZones & settings
  useEffect(() => {
    let unsubscribeMenu: (() => void) | undefined;
    let unsubscribeZones: (() => void) | undefined;
    let unsubscribeSettings: (() => void) | undefined;

    async function initData() {
      try {
        const menuCol = collection(db, 'menuItems');
        unsubscribeMenu = onSnapshot(menuCol, (snapshot) => {
          if (!snapshot.empty) {
            const items: MenuItem[] = [];
            snapshot.forEach(docSnap => {
              const data = docSnap.data();
              items.push({ 
                id: docSnap.id, 
                ...data,
                isAvailable: data.isAvailable !== false
              } as MenuItem);
            });
            setMenuItems(items);
          }
          setIsLoadingMenu(false);
        }, (err) => {
          console.warn('Firestore menuItems snapshot error, fallback to initial items:', err);
          setIsLoadingMenu(false);
        });

        const zonesCol = collection(db, 'deliveryZones');
        unsubscribeZones = onSnapshot(zonesCol, (snapshot) => {
          if (!snapshot.empty) {
            const zones: DeliveryZone[] = [];
            snapshot.forEach(docSnap => {
              zones.push({ id: docSnap.id, ...docSnap.data() } as DeliveryZone);
            });
            setDeliveryZones(zones);
          }
        }, (err) => {
          console.warn('Firestore deliveryZones snapshot error:', err);
        });

        // Listen to settings document
        const settingDocRef = doc(db, 'settings', 'general');
        unsubscribeSettings = onSnapshot(settingDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as RestaurantSettings;
            setSettings({
              deliveryFee: Number(data.deliveryFee ?? DEFAULT_SETTINGS.deliveryFee),
              freeDeliveryThreshold: Number(data.freeDeliveryThreshold ?? DEFAULT_SETTINGS.freeDeliveryThreshold),
              taxRate: Number(data.taxRate ?? DEFAULT_SETTINGS.taxRate),
              isStoreOpen: data.isStoreOpen !== false,
              closedNotice: data.closedNotice || DEFAULT_SETTINGS.closedNotice
            });
          }
        }, (err) => {
          console.warn('Firestore settings snapshot notice:', err);
        });

      } catch (err) {
        console.warn('Data initialization fallback:', err);
        setIsLoadingMenu(false);
      }
    }

    initData();

    return () => {
      if (unsubscribeMenu) unsubscribeMenu();
      if (unsubscribeZones) unsubscribeZones();
      if (unsubscribeSettings) unsubscribeSettings();
    };
  }, []);

  const addToCart = (menuItemId: string, qty = 1) => {
    const item = menuItems.find(m => m.id === menuItemId);
    if (item && item.isAvailable === false) {
      return; // Do not add sold out items
    }
    setCart(prev => {
      const existing = prev.find(item => item.menuItemId === menuItemId);
      if (existing) {
        return prev.map(item =>
          item.menuItemId === menuItemId
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prev, { menuItemId, quantity: qty }];
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(prev => prev.filter(item => item.menuItemId !== menuItemId));
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.menuItemId === menuItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });
  };

  const clearCart = () => {
    setCart([]);
    setAppliedPromo(null);
  };

  const getItemQuantity = (menuItemId: string): number => {
    const item = cart.find(i => i.menuItemId === menuItemId);
    return item ? item.quantity : 0;
  };

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, cartItem) => {
      const dish = menuItems.find(m => m.id === cartItem.menuItemId);
      return sum + (dish ? dish.price * cartItem.quantity : 0);
    }, 0);
  }, [cart, menuItems]);

  const deliveryFee = useMemo(() => {
    if (orderType !== 'delivery' || subtotal === 0) return 0;
    return subtotal >= settings.freeDeliveryThreshold ? 0 : settings.deliveryFee;
  }, [orderType, subtotal, settings.freeDeliveryThreshold, settings.deliveryFee]);

  const taxes = useMemo(() => {
    if (subtotal === 0) return 0;
    const rateDecimal = (settings.taxRate || 5) / 100;
    return Math.round(subtotal * rateDecimal);
  }, [subtotal, settings.taxRate]);

  const total = useMemo(() => {
    if (subtotal === 0) return 0;
    const discount = appliedPromo?.discountAmount || 0;
    const calc = subtotal + deliveryFee + taxes - discount;
    return Math.max(0, calc);
  }, [subtotal, deliveryFee, taxes, appliedPromo]);

  const applyPromoCode = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Please enter a valid promo code' };
    }

    if (cleanCode === 'SPICE50' || cleanCode === 'FEAST50') {
      if (subtotal < 300) {
        return { success: false, message: 'Code requires minimum subtotal of ₹300' };
      }
      setAppliedPromo({
        code: cleanCode,
        discountAmount: 50,
        label: '₹50 Flat Discount'
      });
      return { success: true, message: '₹50 discount applied!' };
    }

    if (cleanCode === 'WELCOME10' || cleanCode === 'SPICETREE10') {
      const discount = Math.round(subtotal * 0.10);
      setAppliedPromo({
        code: cleanCode,
        discountAmount: discount,
        label: '10% Welcome Discount'
      });
      return { success: true, message: `10% discount (-₹${discount}) applied!` };
    }

    if (cleanCode === 'FREEDEL') {
      setAppliedPromo({
        code: cleanCode,
        discountAmount: settings.deliveryFee,
        label: 'Free Delivery Applied'
      });
      return { success: true, message: 'Free delivery perk applied!' };
    }

    return { success: false, message: 'Invalid promo code. Try "SPICE50" or "WELCOME10"' };
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
  };

  const checkDeliveryServiceability = (input: string) => {
    const query = input.trim().toLowerCase();
    if (!query) {
      return {
        isServiceable: false,
        message: 'Please enter a pincode or locality name'
      };
    }

    // Check pincode or locality match in deliveryZones
    const matchedZone = deliveryZones.find(z => {
      const matchPin = z.pincode === query;
      const matchName = z.name.toLowerCase().includes(query);
      return matchPin || matchName;
    });

    if (matchedZone) {
      if (matchedZone.isServiceable) {
        return {
          isServiceable: true,
          zone: matchedZone,
          message: `Great news! We deliver to ${matchedZone.name} (${matchedZone.pincode}) in ~${matchedZone.estimatedMins}.`
        };
      } else {
        return {
          isServiceable: false,
          zone: matchedZone,
          message: `Sorry, ${matchedZone.name} is currently outside our 10km delivery radius. Takeaway & Dine-in available!`
        };
      }
    }

    // Default heuristics for Phagwara pincodes
    if (query === '144401' || query === '144402' || query === '144411') {
      return {
        isServiceable: true,
        message: `Pincode ${query} (Phagwara) is serviceable for Express Delivery!`
      };
    }

    return {
      isServiceable: false,
      message: `Location "${input}" is outside our delivery radius. Takeaway & Dine-in are happily welcomed!`
    };
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        menuItems,
        deliveryZones,
        isLoadingMenu,
        orderType,
        setOrderType,
        selectedLocality,
        setSelectedLocality,
        selectedPincode,
        setSelectedPincode,
        isCartOpen,
        setIsCartOpen,
        activeTab,
        setActiveTab,
        activeOrderId,
        setActiveOrderId,
        orderHistoryIds,
        latestActiveOrder,
        trackOrder,
        settings,
        isStoreOpen: settings.isStoreOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getItemQuantity,
        cartCount,
        subtotal,
        deliveryFee,
        freeDeliveryThreshold: settings.freeDeliveryThreshold,
        taxes,
        total,
        appliedPromo,
        applyPromoCode,
        removePromoCode,
        checkDeliveryServiceability,
        isReservationModalOpen,
        setIsReservationModalOpen,
        user,
        setAppUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        logout
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

