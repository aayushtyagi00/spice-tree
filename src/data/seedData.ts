import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { MenuItem, DeliveryZone, Category } from '../types';

export const CATEGORIES: Category[] = [
  { id: 'thalis', name: 'Thalis & Set Meals', icon: 'Utensils', description: 'Complete royal vegetarian meals' },
  { id: 'starters', name: 'Starters & Platters', icon: 'Flame', description: 'Tandoori sizzlers & crunchy bites' },
  { id: 'mains', name: 'North Indian Mains', icon: 'Soup', description: 'Slow-simmered rich curries' },
  { id: 'breads', name: 'Tandoori Breads & Rice', icon: 'Wheat', description: 'Fresh from our clay tandoor' },
  { id: 'chinese', name: 'Indo-Chinese Delights', icon: 'CookingPot', description: 'Wok-tossed noodles & gravies' },
  { id: 'continental', name: 'Pizzas & Pastas', icon: 'Pizza', description: 'Wood-fired pizzas & creamy pastas' },
  { id: 'snacks', name: 'Chaat & Street Flavours', icon: 'Sparkles', description: 'Crisp, tangy & refreshing' },
  { id: 'beverages', name: 'Beverages & Desserts', icon: 'Coffee', description: 'Chilled coolers & traditional sweets' },
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // Thalis
  {
    id: 'thali-royal-spice-tree',
    name: 'Spice Tree Special Thali',
    category: 'thalis',
    description: 'Our signature feast: Dal Makhani, Paneer Butter Masala, Mix Veg, Dum Aloo, Jeera Rice, 2 Butter Naans, Raita, Salad & Hot Gulab Jamun.',
    price: 450,
    isBestseller: true,
    isJainFriendly: false,
    portion: 'Serves 1-2',
    image: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=800&q=80',
    tags: ['Signature', 'Royal']
  },
  {
    id: 'thali-deluxe-north-indian',
    name: 'Deluxe North Indian Thali',
    category: 'thalis',
    description: 'Dal Tadka, Shahi Paneer, Aloo Gobi Matar, Steamed Basmati Rice, 3 Butter Tandoori Rotis, Boondi Raita, Pickle & Rasgulla.',
    price: 320,
    isBestseller: false,
    isJainFriendly: true,
    portion: 'Serves 1',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    tags: ['Value Meal']
  },
  {
    id: 'thali-jain-special',
    name: 'Royal Jain Maharaja Thali',
    category: 'thalis',
    description: '100% strictly No-Onion No-Garlic special: Jain Paneer Korma, Green Peas Dal, Dudhi Chana Masala, Jeera Rice, 3 Phulkas, Fresh Salad & Kheer.',
    price: 380,
    isBestseller: true,
    isJainFriendly: true,
    portion: 'Serves 1',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
    tags: ['Pure Jain']
  },

  // Starters
  {
    id: 'starter-paneer-tikka-shashlik',
    name: 'Tandoori Paneer Tikka Shashlik',
    category: 'starters',
    description: 'Succulent malai paneer cubes marinated in hung curd, Kashmiri deghi mirch & spices, charred with bell peppers in tandoor.',
    price: 290,
    isBestseller: true,
    isJainFriendly: true,
    portion: '8 Pieces',
    image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80',
    tags: ['Tandoor Special']
  },
  {
    id: 'starter-hara-bhara-kebab',
    name: 'Hara Bhara Kebab',
    category: 'starters',
    description: 'Crispy melt-in-mouth emerald patties crafted from fresh spinach, green peas, mashed potato, and roasted cashews.',
    price: 220,
    isBestseller: false,
    isJainFriendly: false,
    portion: '6 Pieces',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
    tags: ['Crispy']
  },
  {
    id: 'starter-soya-malai-chaap',
    name: 'Afghani Soya Malai Chaap',
    category: 'starters',
    description: 'Tender soya chaap roasted over glowing charcoal with rich cashew cream, green cardamom, and freshly crushed black pepper.',
    price: 270,
    isBestseller: true,
    isJainFriendly: false,
    portion: '8 Pieces',
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
    tags: ['Creamy']
  },
  {
    id: 'starter-dahi-ke-kebab',
    name: 'Dahi Ke Kebab (Jain Friendly)',
    category: 'starters',
    description: 'Silken hung curd infused with green chilies, coriander, and crushed spices, flash-fried to golden perfection with mint dip.',
    price: 260,
    isBestseller: false,
    isJainFriendly: true,
    portion: '6 Pieces',
    image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=800&q=80',
    tags: ['Chef Special']
  },

  // Mains
  {
    id: 'main-dal-makhani',
    name: 'Dal Makhani',
    category: 'mains',
    description: 'Slow-cooked whole black lentils and kidney beans simmered overnight on low charcoal heat with hand-churned white butter and cream.',
    price: 240,
    isBestseller: true,
    isJainFriendly: true,
    portion: '500 ml',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    tags: ['Legendary']
  },
  {
    id: 'main-paneer-tikka-butter-masala',
    name: 'Paneer Tikka Butter Masala',
    category: 'mains',
    description: 'Charcoal-grilled paneer cubes simmered in a velvety, mildly spiced makhani gravy enriched with cashew paste and Kasuri methi.',
    price: 320,
    isBestseller: true,
    isJainFriendly: true,
    portion: '500 ml',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
    tags: ['Bestseller']
  },
  {
    id: 'main-kadai-paneer',
    name: 'Kadai Paneer',
    category: 'mains',
    description: 'Fresh paneer tossed with crunchy bell peppers, diced onions, and freshly ground Kadai spices in a robust coriander-tomato gravy.',
    price: 290,
    isBestseller: false,
    isJainFriendly: false,
    portion: '500 ml',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
    tags: ['Spicy']
  },
  {
    id: 'main-cheese-tomato',
    name: 'Cheese Tomato (Phagwara Special)',
    category: 'mains',
    description: 'Punjab’s all-time iconic delicacy: Fresh paneer batons bathed in a tangy, sweet-and-sour spiced red tomato gravy with a hint of butter.',
    price: 310,
    isBestseller: true,
    isJainFriendly: true,
    portion: '500 ml',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
    tags: ['Punjab Iconic']
  },
  {
    id: 'main-mushroom-do-pyaza',
    name: 'Mushroom Do Pyaza',
    category: 'mains',
    description: 'Fresh button mushrooms cooked with double quantities of caramelized onion rings and aromatic whole Punjabi garam masala.',
    price: 280,
    isBestseller: false,
    isJainFriendly: false,
    portion: '500 ml',
    image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80',
    tags: ['Mushroom']
  },
  {
    id: 'main-malai-kofta',
    name: 'Shahi Malai Kofta',
    category: 'mains',
    description: 'Silken paneer and khoya dumplings stuffed with dry fruits, served gently over a rich golden saffron and cashew gravy.',
    price: 330,
    isBestseller: true,
    isJainFriendly: true,
    portion: '500 ml',
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
    tags: ['Sweet & Mild']
  },
  {
    id: 'main-yellow-dal-tadka',
    name: 'Yellow Dal Double Tadka',
    category: 'mains',
    description: 'Arhar and moong dal tempered twice with desi ghee, cumin seeds, heeng, garlic, and whole dried red chilies.',
    price: 190,
    isBestseller: false,
    isJainFriendly: false,
    portion: '500 ml',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
    tags: ['Desi Ghee']
  },

  // Breads & Rice
  {
    id: 'bread-garlic-naan',
    name: 'Butter Garlic Naan',
    category: 'breads',
    description: 'Leavened refined flour dough baked crisp in tandoor, slathered with roasted minced garlic, coriander, and melted butter.',
    price: 70,
    isBestseller: true,
    isJainFriendly: false,
    portion: '1 Piece',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
    tags: ['Tandoor']
  },
  {
    id: 'bread-butter-roti',
    name: 'Tandoori Butter Roti (Jain Friendly)',
    category: 'breads',
    description: 'Traditional 100% whole wheat flatbread made fresh in tandoor with a generous brush of amul butter.',
    price: 25,
    isBestseller: false,
    isJainFriendly: true,
    portion: '1 Piece',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
    tags: ['Wheat']
  },
  {
    id: 'bread-amritsari-kulcha',
    name: 'Amritsari Paneer Aloo Kulcha',
    category: 'breads',
    description: 'Flaky layered Punjabi kulcha stuffed with spiced paneer, potatoes, pomegranate seeds, served with tangy imli chutney.',
    price: 120,
    isBestseller: true,
    isJainFriendly: false,
    portion: '1 Piece',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
    tags: ['Crispy Crust']
  },
  {
    id: 'rice-jeera-rice',
    name: 'Shahi Jeera Rice',
    category: 'breads',
    description: 'Fragrant long-grain aged Basmati rice tempered in pure ghee with roasted whole cumin and bay leaves.',
    price: 150,
    isBestseller: false,
    isJainFriendly: true,
    portion: 'Serves 1-2',
    image: 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?auto=format&fit=crop&w=800&q=80',
    tags: ['Basmati']
  },

  // Indo-Chinese
  {
    id: 'chinese-veg-hakka-noodles',
    name: 'Veg Hakka Noodles',
    category: 'chinese',
    description: 'Wok-tossed thin eggless noodles loaded with shredded cabbage, crunchy carrots, bell peppers, soy, and white pepper.',
    price: 210,
    isBestseller: true,
    isJainFriendly: true,
    portion: 'Serves 1-2',
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80',
    tags: ['Wok Tossed']
  },
  {
    id: 'chinese-chilli-paneer-dry',
    name: 'Chilli Paneer (Dry)',
    category: 'chinese',
    description: 'Crispy batter-coated paneer tossed in high flame wok with green chilies, spring onions, capsicum, and spicy garlic-soy sauce.',
    price: 260,
    isBestseller: true,
    isJainFriendly: false,
    portion: 'Serves 2',
    image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80',
    tags: ['Zesty']
  },
  {
    id: 'chinese-veg-manchurian',
    name: 'Veg Manchurian Gravy',
    category: 'chinese',
    description: 'Deep-fried minced vegetable rounds simmered in a dark, luscious garlic, ginger, and scallion sauce.',
    price: 230,
    isBestseller: false,
    isJainFriendly: false,
    portion: '500 ml',
    image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=800&q=80',
    tags: ['Saucy']
  },

  // Continental & Pizzas
  {
    id: 'continental-margherita-pizza',
    name: 'Margherita Pizza (Wood Fired)',
    category: 'continental',
    description: 'Hand-stretched sourdough crust with San Marzano style tomato concasse, fresh mozzarella cheese, fresh basil & extra virgin olive oil.',
    price: 299,
    isBestseller: true,
    isJainFriendly: true,
    portion: '10 Inch (6 Slices)',
    image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80',
    tags: ['100% Mozzarella']
  },
  {
    id: 'continental-farmhouse-pizza',
    name: 'Spice Tree Farmhouse Feast Pizza',
    category: 'continental',
    description: 'Loaded with herb-marinated paneer chunks, sweet corn, black olives, bell peppers, red paprika, and stretchy cheese.',
    price: 360,
    isBestseller: false,
    isJainFriendly: true,
    portion: '10 Inch (6 Slices)',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    tags: ['Loaded']
  },
  {
    id: 'continental-penne-arrabbiata',
    name: 'Penne Arrabbiata Pasta',
    category: 'continental',
    description: 'Al dente Italian penne tossed in spicy garlic tomato basil sauce with zucchini, black olives, chili flakes, and parmesan.',
    price: 260,
    isBestseller: false,
    isJainFriendly: false,
    portion: 'Serves 1',
    image: 'https://images.unsplash.com/photo-1621996346565-e3adc6d64619?auto=format&fit=crop&w=800&q=80',
    tags: ['Italian']
  },

  // Snacks & Chaat
  {
    id: 'snack-dahi-bhalla',
    name: 'Dahi Bhalla Papdi Chaat',
    category: 'snacks',
    description: 'Velvety lentil dumplings soaked in sweet whipped curd, topped with crunchy papdi, roasted cumin, saunth and fresh mint chutney.',
    price: 140,
    isBestseller: true,
    isJainFriendly: true,
    portion: '2 Pieces + Papdi',
    image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=800&q=80',
    tags: ['Refreshing']
  },
  {
    id: 'snack-crispy-corn',
    name: 'Crispy Corn Salt & Pepper',
    category: 'snacks',
    description: 'Tender American sweet corn tossed in spices and herbs until golden and ultra crunchy.',
    price: 180,
    isBestseller: false,
    isJainFriendly: true,
    portion: 'Serves 2',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
    tags: ['Crunchy']
  },

  // Beverages & Desserts
  {
    id: 'bev-punjabi-sweet-lassi',
    name: 'Kulhad Punjabi Malai Lassi',
    category: 'beverages',
    description: 'Thick, creamy yogurt lassi hand-blended and served in earthen clay kulhad with a thick slab of malai and roasted pistachios.',
    price: 90,
    isBestseller: true,
    isJainFriendly: true,
    portion: '350 ml',
    image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80',
    tags: ['Kulhad']
  },
  {
    id: 'bev-gulab-jamun-ice-cream',
    name: 'Hot Gulab Jamun with Kulfi',
    category: 'beverages',
    description: 'Two warm, syrup-soaked khoya gulab jamuns paired with a scoop of artisanal malai kesar kulfi.',
    price: 120,
    isBestseller: true,
    isJainFriendly: true,
    portion: '2 Pieces + Kulfi',
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
    tags: ['Dessert']
  },
  {
    id: 'bev-masala-chaas',
    name: 'Spiced Buttermilk (Masala Chaas)',
    category: 'beverages',
    description: 'Refreshing light churned curd drink tempered with roasted cumin, black salt, fresh ginger, mint, and green chili.',
    price: 60,
    isBestseller: false,
    isJainFriendly: true,
    portion: '300 ml',
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
    tags: ['Digestive']
  }
];

export const INITIAL_DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: 'zone-guru-hargobind-nagar',
    name: 'Guru Hargobind Nagar',
    pincode: '144401',
    isServiceable: true,
    minOrder: 150,
    deliveryFee: 30,
    estimatedMins: '25-35 mins',
    areaDescription: 'Prime locality near restaurant'
  },
  {
    id: 'zone-model-town',
    name: 'Model Town',
    pincode: '144401',
    isServiceable: true,
    minOrder: 150,
    deliveryFee: 30,
    estimatedMins: '30-40 mins',
    areaDescription: 'Residential & Commercial Hub'
  },
  {
    id: 'zone-palahi-road',
    name: 'Palahi Road',
    pincode: '144401',
    isServiceable: true,
    minOrder: 150,
    deliveryFee: 30,
    estimatedMins: '30-40 mins',
    areaDescription: 'Palahi Gate & Extension'
  },
  {
    id: 'zone-gt-road',
    name: 'G.T. Road & Town Hall',
    pincode: '144401',
    isServiceable: true,
    minOrder: 150,
    deliveryFee: 30,
    estimatedMins: '30-40 mins',
    areaDescription: 'Central Phagwara'
  },
  {
    id: 'zone-satnampura',
    name: 'Satnampura',
    pincode: '144402',
    isServiceable: true,
    minOrder: 200,
    deliveryFee: 30,
    estimatedMins: '35-45 mins',
    areaDescription: 'Railway Station & Satnampura'
  },
  {
    id: 'zone-hadiabad',
    name: 'Hadiabad',
    pincode: '144402',
    isServiceable: true,
    minOrder: 200,
    deliveryFee: 30,
    estimatedMins: '35-45 mins',
    areaDescription: 'Historic Phagwara Old Sector'
  },
  {
    id: 'zone-law-gate-lpu',
    name: 'Law Gate / LPU Campus Area',
    pincode: '144411',
    isServiceable: true,
    minOrder: 250,
    deliveryFee: 30,
    estimatedMins: '40-50 mins',
    areaDescription: 'Student Hub & Outer G.T. Road'
  },
  {
    id: 'zone-sugar-mill',
    name: 'Sugar Mill Colony & Banga Road',
    pincode: '144401',
    isServiceable: true,
    minOrder: 200,
    deliveryFee: 30,
    estimatedMins: '35-45 mins',
    areaDescription: 'Banga Road Sector'
  },
  {
    id: 'zone-urban-estate',
    name: 'Urban Estate Phase 1 & 2',
    pincode: '144402',
    isServiceable: true,
    minOrder: 200,
    deliveryFee: 30,
    estimatedMins: '35-45 mins',
    areaDescription: 'Urban Estate Enclave'
  },
  // Non-serviceable test localities/pincodes to demonstrate auto-switch to Takeaway
  {
    id: 'zone-jalandhar-cantt',
    name: 'Jalandhar Cantt (Out of Zone)',
    pincode: '144005',
    isServiceable: false,
    minOrder: 0,
    deliveryFee: 0,
    estimatedMins: 'Unavailable',
    areaDescription: 'Beyond 15km delivery boundary'
  },
  {
    id: 'zone-goraya-outer',
    name: 'Goraya Outer Bypass',
    pincode: '144409',
    isServiceable: false,
    minOrder: 0,
    deliveryFee: 0,
    estimatedMins: 'Unavailable',
    areaDescription: 'Beyond delivery radius'
  }
];

export const DEFAULT_SETTINGS = {
  deliveryFee: 30,
  freeDeliveryThreshold: 499,
  taxRate: 5,
  isStoreOpen: true,
  closedNotice: 'Spice Tree is temporarily closed for online orders. Please check back shortly or call +91 98765 43210.'
};

export const INITIAL_ADMINS = [
  { id: 'admin-1', email: 'tyagiaayush3030@gmail.com', name: 'Aayush Tyagi', role: 'Super Admin', addedAt: Date.now() },
  { id: 'admin-2', email: 'admin@spicetree.com', name: 'Spice Tree Manager', role: 'Restaurant Manager', addedAt: Date.now() },
  { id: 'admin-3', email: 'manager@spicetree.com', name: 'Kitchen Head', role: 'Kitchen Lead', addedAt: Date.now() }
];

export async function seedFirestoreIfEmpty(): Promise<{ seededMenu: boolean; seededZones: boolean }> {
  let seededMenu = false;
  let seededZones = false;

  try {
    const menuCol = collection(db, 'menuItems');
    const menuSnapshot = await getDocs(menuCol);
    if (menuSnapshot.empty) {
      console.log('Seeding menuItems to Firestore...');
      const batch = writeBatch(db);
      INITIAL_MENU_ITEMS.forEach(item => {
        const itemRef = doc(db, 'menuItems', item.id);
        batch.set(itemRef, { ...item, isAvailable: item.isAvailable ?? true });
      });
      await batch.commit();
      seededMenu = true;
    }

    const zonesCol = collection(db, 'deliveryZones');
    const zonesSnapshot = await getDocs(zonesCol);
    if (zonesSnapshot.empty) {
      console.log('Seeding deliveryZones to Firestore...');
      const batch = writeBatch(db);
      INITIAL_DELIVERY_ZONES.forEach(zone => {
        const zoneRef = doc(db, 'deliveryZones', zone.id);
        batch.set(zoneRef, zone);
      });
      await batch.commit();
      seededZones = true;
    }

    // Seed settings if empty
    const settingsCol = collection(db, 'settings');
    const settingsSnapshot = await getDocs(settingsCol);
    if (settingsSnapshot.empty) {
      const batch = writeBatch(db);
      const settingRef = doc(db, 'settings', 'general');
      batch.set(settingRef, DEFAULT_SETTINGS);
      await batch.commit();
    }

    // Seed admins if empty
    const adminsCol = collection(db, 'admins');
    const adminsSnapshot = await getDocs(adminsCol);
    if (adminsSnapshot.empty) {
      const batch = writeBatch(db);
      INITIAL_ADMINS.forEach(adm => {
        const admRef = doc(db, 'admins', adm.id);
        batch.set(admRef, adm);
      });
      await batch.commit();
    }
  } catch (error) {
    console.warn('Firestore seeding check encountered an issue (using in-memory fallback):', error);
  }

  return { seededMenu, seededZones };
}

