import { INITIAL_MENU_ITEMS, INITIAL_DELIVERY_ZONES } from '../src/data/seedData';
import { db } from '../src/firebase/config';
import { doc, setDoc } from 'firebase/firestore';

async function seedDirectly() {
  console.log('Seeding ' + INITIAL_MENU_ITEMS.length + ' menuItems...');
  for (const item of INITIAL_MENU_ITEMS) {
    const itemRef = doc(db, 'menuItems', item.id);
    await setDoc(itemRef, { ...item, isAvailable: item.isAvailable ?? true });
    console.log('  -> Added menu item: ' + item.name);
  }

  console.log('Seeding ' + INITIAL_DELIVERY_ZONES.length + ' deliveryZones...');
  for (const zone of INITIAL_DELIVERY_ZONES) {
    const zoneRef = doc(db, 'deliveryZones', zone.id);
    await setDoc(zoneRef, zone);
    console.log('  -> Added zone: ' + zone.name);
  }

  console.log('ALL ITEMS AND ZONES SEEDED SUCCESSFULLY!');
  process.exit(0);
}

seedDirectly().catch(err => {
  console.error('Direct seed error:', err);
  process.exit(1);
});
