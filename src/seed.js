import 'dotenv/config';
import mongoose from 'mongoose';
import Store from './models/Store.js';
import Product from './models/Product.js';
import StoreInventory from './models/StoreInventory.js';
import MockExternalPrice from './models/MockExternalPrice.js';

const STORES = [
  {
    name: "Fresh Mart",
    location: { lat: 19.2183, lng: 73.0867 },
    address: "Shop 12, Station Road, Dombivli East",
    phone: "9876543210",
    rating: 4.2,
    trustScore: { overall: 4.2, freshness: 4.5, deliveryAccuracy: 4.0, priceConsistency: 4.2, cameraUptime: 92 },
    cameraStreamId: "store1",
    cameraFeedUrl: "https://videos.pexels.com/video-files/4066325/4066325-hd_1920_1080_25fps.mp4",
    cameraStatus: "live",
    feedReliability: "verified",
    operatingHours: { open: "07:00", close: "22:00" },
    avgDeliveryTime: 20,
    deliveryRadius: 5,
    description: "Your neighborhood fresh grocery store with daily farm-direct produce.",
    specialties: ["organic", "farm-fresh", "daily-delivery"]
  },
  {
    name: "Green Basket",
    location: { lat: 19.2215, lng: 73.0890 },
    address: "45, Manpada Road, Dombivli East",
    phone: "9876543211",
    rating: 3.8,
    trustScore: { overall: 3.8, freshness: 3.5, deliveryAccuracy: 4.0, priceConsistency: 4.0, cameraUptime: 78 },
    cameraStreamId: "store2",
    cameraFeedUrl: "https://videos.pexels.com/video-files/4066325/4066325-hd_1920_1080_25fps.mp4",
    cameraStatus: "live",
    feedReliability: "verified",
    operatingHours: { open: "08:00", close: "21:00" },
    avgDeliveryTime: 30,
    deliveryRadius: 4,
    description: "Wholesale prices on everyday essentials. Bulk buying specialists.",
    specialties: ["wholesale", "bulk-deals", "staples"]
  },
  {
    name: "Dombivli Organics",
    location: { lat: 19.2150, lng: 73.0830 },
    address: "78, Tilak Road, Dombivli West",
    phone: "9876543212",
    rating: 4.6,
    trustScore: { overall: 4.6, freshness: 4.8, deliveryAccuracy: 4.5, priceConsistency: 4.2, cameraUptime: 95 },
    cameraStreamId: "store3",
    cameraFeedUrl: "https://videos.pexels.com/video-files/4066325/4066325-hd_1920_1080_25fps.mp4",
    cameraStatus: "offline",
    feedReliability: "offline",
    operatingHours: { open: "06:00", close: "20:00" },
    avgDeliveryTime: 35,
    deliveryRadius: 6,
    description: "100% certified organic produce. Premium quality guaranteed.",
    specialties: ["organic", "certified", "premium"]
  }
];

const PRODUCTS = [
  { name: "Tomatoes", category: "vegetables", unit: "kg", tags: ["fresh","perishable","salad"], isPerishable: true, avgShelfLife: 5 },
  { name: "Onions", category: "vegetables", unit: "kg", tags: ["fresh","staple","cooking"], isPerishable: true, avgShelfLife: 14 },
  { name: "Potatoes", category: "vegetables", unit: "kg", tags: ["fresh","staple","root"], isPerishable: true, avgShelfLife: 21 },
  { name: "Green Chillies", category: "vegetables", unit: "250g", tags: ["fresh","perishable","spicy"], isPerishable: true, avgShelfLife: 7 },
  { name: "Spinach (Palak)", category: "vegetables", unit: "bunch", tags: ["fresh","perishable","leafy","green"], isPerishable: true, avgShelfLife: 2 },
  { name: "Capsicum", category: "vegetables", unit: "kg", tags: ["fresh","perishable","salad","bell-pepper"], isPerishable: true, avgShelfLife: 5 },
  { name: "Cucumber", category: "vegetables", unit: "kg", tags: ["fresh","perishable","salad"], isPerishable: true, avgShelfLife: 5 },
  { name: "Cauliflower", category: "vegetables", unit: "piece", tags: ["fresh","perishable","gobi"], isPerishable: true, avgShelfLife: 4 },
  { name: "Bananas", category: "fruits", unit: "dozen", tags: ["fresh","perishable","tropical"], isPerishable: true, avgShelfLife: 5 },
  { name: "Apples", category: "fruits", unit: "kg", tags: ["fresh","perishable","imported"], isPerishable: true, avgShelfLife: 14 },
  { name: "Mangoes (Alphonso)", category: "fruits", unit: "kg", tags: ["fresh","seasonal","perishable","premium"], isPerishable: true, avgShelfLife: 4 },
  { name: "Grapes", category: "fruits", unit: "kg", tags: ["fresh","perishable"], isPerishable: true, avgShelfLife: 5 },
  { name: "Pomegranate", category: "fruits", unit: "kg", tags: ["fresh","perishable"], isPerishable: true, avgShelfLife: 10 },
  { name: "Watermelon", category: "fruits", unit: "piece", tags: ["fresh","seasonal","summer"], isPerishable: true, avgShelfLife: 7 },
  { name: "Paneer (Fresh)", category: "dairy", unit: "200g", tags: ["fresh","perishable","protein"], isPerishable: true, avgShelfLife: 3 },
  { name: "Curd (Dahi)", category: "dairy", unit: "400g", tags: ["fresh","perishable","probiotic"], isPerishable: true, avgShelfLife: 5 },
  { name: "Milk (Full Cream)", category: "dairy", unit: "1L", tags: ["fresh","perishable","daily"], isPerishable: true, avgShelfLife: 2 },
  { name: "Butter", category: "dairy", unit: "100g", tags: ["fresh","perishable"], isPerishable: true, avgShelfLife: 14 },
  { name: "Cheese Slices", category: "dairy", unit: "pack", tags: ["processed","perishable"], isPerishable: true, avgShelfLife: 30 },
  { name: "Bread (White)", category: "bakery", unit: "pack", tags: ["fresh","perishable","daily"], isPerishable: true, avgShelfLife: 3 },
  { name: "Pav", category: "bakery", unit: "pack of 6", tags: ["fresh","perishable","local"], isPerishable: true, avgShelfLife: 2 },
  { name: "Cake (Chocolate)", category: "bakery", unit: "500g", tags: ["fresh","perishable","dessert"], isPerishable: true, avgShelfLife: 3 },
  { name: "Cookies (Butter)", category: "bakery", unit: "pack", tags: ["snack"], isPerishable: false, avgShelfLife: 60 },
  { name: "Chicken (Whole)", category: "meat", unit: "kg", tags: ["fresh","perishable","protein","non-veg"], isPerishable: true, avgShelfLife: 1 },
  { name: "Eggs", category: "meat", unit: "dozen", tags: ["fresh","protein","daily"], isPerishable: true, avgShelfLife: 14 },
  { name: "Fish (Pomfret)", category: "seafood", unit: "kg", tags: ["fresh","perishable","seafood","non-veg"], isPerishable: true, avgShelfLife: 1 },
  { name: "Prawns", category: "seafood", unit: "500g", tags: ["fresh","perishable","seafood","premium"], isPerishable: true, avgShelfLife: 1 },
  { name: "Marigold Garland", category: "flowers", unit: "string", tags: ["fresh","perishable","puja","decoration"], isPerishable: true, avgShelfLife: 1 },
  { name: "Rose Bunch", category: "flowers", unit: "bunch", tags: ["fresh","perishable","gift"], isPerishable: true, avgShelfLife: 2 },
  { name: "Mogra (Jasmine)", category: "flowers", unit: "string", tags: ["fresh","perishable","fragrant","puja"], isPerishable: true, avgShelfLife: 1 },
  { name: "Rice (Basmati)", category: "staples", unit: "kg", tags: ["staple","grain"], isPerishable: false, avgShelfLife: 365 },
  { name: "Atta (Wheat Flour)", category: "staples", unit: "5kg", tags: ["staple","flour"], isPerishable: false, avgShelfLife: 90 },
  { name: "Sugar", category: "staples", unit: "kg", tags: ["staple","sweetener"], isPerishable: false, avgShelfLife: 365 },
  { name: "Fresh Coconut Water", category: "beverages", unit: "piece", tags: ["fresh","perishable","healthy","natural"], isPerishable: true, avgShelfLife: 1 },
  { name: "Sugarcane Juice", category: "beverages", unit: "glass", tags: ["fresh","perishable","street-food"], isPerishable: true, avgShelfLife: 0 }
];

const PRICE_RANGES = {
  vegetables: [20, 80], fruits: [40, 200], dairy: [25, 120],
  bakery: [20, 350], meat: [150, 500], seafood: [300, 800],
  flowers: [30, 150], staples: [45, 250], beverages: [20, 60]
};

const EXTERNAL_PLATFORMS = ['Amazon Fresh', 'Blinkit', 'Zepto', 'BigBasket', 'JioMart'];

function randomInRange(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomFreshnessBadge() {
  const options = [
    "Restocked 1 hour ago", "Restocked 2 hours ago", "Restocked 3 hours ago",
    "Restocked this morning", "Fresh batch arrived today", "Restocked yesterday evening"
  ];
  return options[Math.floor(Math.random() * options.length)];
}

function randomShelfLocation() {
  const aisles = ['Aisle 1', 'Aisle 2', 'Aisle 3', 'Aisle 4'];
  const racks = ['Rack A', 'Rack B', 'Rack C', 'Rack D'];
  return `${aisles[Math.floor(Math.random() * aisles.length)]}, ${racks[Math.floor(Math.random() * racks.length)]}`;
}

async function seed() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri || uri.includes('PLACEHOLDER') || uri.includes('xxxxx')) {
      console.log('❌ No valid MongoDB URI. Set MONGODB_URI in server/.env first.');
      console.log('   Server will use in-memory fallback (still demo-safe).');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    await Promise.all([
      Store.deleteMany({}), Product.deleteMany({}),
      StoreInventory.deleteMany({}), MockExternalPrice.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data');

    const stores = await Store.insertMany(STORES);
    console.log(`✅ Seeded ${stores.length} stores`);

    const products = await Product.insertMany(PRODUCTS);
    console.log(`✅ Seeded ${products.length} products`);

    // Guarantee min 15 products per store
    const inventoryDocs = [];
    for (const store of stores) {
      const shuffled = [...products].sort(() => Math.random() - 0.5);
      const guaranteed = shuffled.slice(0, 15);
      const optional = shuffled.slice(15).filter(() => Math.random() > 0.4);
      const storeProducts = [...guaranteed, ...optional];
      
      for (const product of storeProducts) {
        const [minPrice, maxPrice] = PRICE_RANGES[product.category] || [20, 100];
        const price = randomInRange(minPrice, maxPrice);
        const hasDiscount = Math.random() > 0.6;
        
        inventoryDocs.push({
          storeId: store._id,
          productId: product._id,
          price,
          originalPrice: hasDiscount ? Math.round(price * 1.2) : undefined,
          stockStatus: Math.random() > 0.15 ? 'in_stock' : (Math.random() > 0.5 ? 'low_stock' : 'out_of_stock'),
          shelfLocation: randomShelfLocation(),
          lastRestocked: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000),
          freshnessBadge: randomFreshnessBadge(),
          batchDate: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
        });
      }
    }
    await StoreInventory.insertMany(inventoryDocs);
    console.log(`✅ Seeded ${inventoryDocs.length} inventory entries`);

    // Guarantee min 2 platforms per product
    const externalDocs = [];
    for (const product of products) {
      const shuffled = [...EXTERNAL_PLATFORMS].sort(() => Math.random() - 0.5);
      const guaranteed = shuffled.slice(0, 2);
      const optional = shuffled.slice(2).filter(() => Math.random() > 0.4);
      const platforms = [...guaranteed, ...optional];
      
      for (const platform of platforms) {
        const [minPrice, maxPrice] = PRICE_RANGES[product.category] || [20, 100];
        const basePrice = randomInRange(minPrice, maxPrice);
        const markup = 1 + (Math.random() * 0.3 + 0.05);
        
        externalDocs.push({
          productId: product._id,
          source: platform,
          price: Math.round(basePrice * markup),
          deliveryEtaMinutes: (platform === 'Blinkit' || platform === 'Zepto')
            ? Math.round(8 + Math.random() * 12)
            : Math.round(30 + Math.random() * 120),
          inStock: Math.random() > 0.2
        });
      }
    }
    await MockExternalPrice.insertMany(externalDocs);
    console.log(`✅ Seeded ${externalDocs.length} external platform prices`);

    console.log('\n📊 SEED SUMMARY:');
    console.log(`   Stores: ${stores.length}`);
    console.log(`   Products: ${products.length}`);
    console.log(`   Inventory: ${inventoryDocs.length}`);
    console.log(`   External prices: ${externalDocs.length}`);
    
    await mongoose.disconnect();
    console.log('\n✅ Seeding complete.');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
