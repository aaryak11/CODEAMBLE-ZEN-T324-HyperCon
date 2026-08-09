import { useState, useEffect } from "react";
import { X, Plus, Save, Sparkles, Image, Tag, DollarSign, Layers, Info } from "lucide-react";

const CATEGORIES = [
  "Produce & Veggies",
  "Fresh Fruits",
  "Dairy & Eggs",
  "Bakery & Breads",
  "Organic & Farm",
  "Beverages & Juices",
];

const PRESET_IMAGES = [
  { label: "Tomatoes", url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80" },
  { label: "Bananas", url: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80" },
  { label: "Milk", url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop&q=80" },
  { label: "Apples", url: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=80" },
  { label: "Potatoes", url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80" },
  { label: "Paneer", url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80" },
  { label: "Spinach", url: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&auto=format&fit=crop&q=80" },
  { label: "Avocado", url: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&auto=format&fit=crop&q=80" },
];

export default function InventoryModal({ isOpen, onClose, onSave, itemToEdit }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Produce & Veggies");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("1kg");
  const [stockStatus, setStockStatus] = useState("in_stock");
  const [shelfLocation, setShelfLocation] = useState("Aisle 1 - Shelf A");
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name || "");
      setCategory(itemToEdit.category || "Produce & Veggies");
      setPrice(itemToEdit.price?.toString() || "");
      setUnit(itemToEdit.unit || "1kg");
      setStockStatus(itemToEdit.stockStatus || "in_stock");
      setShelfLocation(itemToEdit.shelfLocation || "Aisle 1 - Shelf A");
      setImageUrl(itemToEdit.imageUrl || PRESET_IMAGES[0].url);
    } else {
      setName("");
      setCategory("Produce & Veggies");
      setPrice("");
      setUnit("1kg");
      setStockStatus("in_stock");
      setShelfLocation("Aisle 1 - Shelf A");
      setImageUrl(PRESET_IMAGES[0].url);
    }
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave({
        _id: itemToEdit?._id,
        name,
        category,
        price: parseFloat(price),
        unit,
        stockStatus,
        shelfLocation,
        imageUrl,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink/60 z-50 flex items-center justify-center p-4">
      <div className="bg-surface border-3 border-ink rounded-xl shadow-brutal-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="p-5 border-b-3 border-ink flex items-center justify-between bg-surface sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-accent text-surface flex items-center justify-center border-2 border-ink shadow-brutal-sm">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold font-display text-ink text-lg">
                {itemToEdit ? "Edit Perishable Item" : "Add New Perishable Item"}
              </h2>
              <p className="text-xs text-ink font-semibold">
                Shelf stock updates reflect in real-time across customer searches
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-surface border-2 border-ink hover:bg-base text-ink shadow-brutal-sm cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold font-display text-ink mb-1">
              Produce / Item Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fresh Farm Tomatoes"
              className="w-full px-3.5 py-2.5 bg-surface border-2 border-ink rounded-lg text-xs font-semibold text-ink placeholder-ink/50 focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold font-display text-ink mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-surface border-2 border-ink rounded-lg text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold font-display text-ink mb-1">
                Unit / Packaging
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. 1kg / 500g / 1 dozen"
                className="w-full px-3 py-2 bg-surface border-2 border-ink rounded-lg text-xs font-semibold text-ink placeholder-ink/50 focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold font-display text-ink mb-1">
                Price (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="34"
                  className="w-full pl-8 pr-3 py-2 bg-surface border-2 border-ink rounded-lg text-xs font-semibold text-ink placeholder-ink/50 focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
                <span className="text-xs font-bold text-ink absolute left-3 top-2.5">₹</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold font-display text-ink mb-1">
                Stock Status
              </label>
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value)}
                className="w-full px-3 py-2 bg-surface border-2 border-ink rounded-lg text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="in_stock">In Stock (Available)</option>
                <option value="low_stock">Low Stock (&lt; 5 left)</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold font-display text-ink mb-1">
              Store Shelf / Rack Location (Camera View Sector)
            </label>
            <input
              type="text"
              value={shelfLocation}
              onChange={(e) => setShelfLocation(e.target.value)}
              placeholder="e.g. Aisle 1 - Shelf B (Veg Rack)"
              className="w-full px-3.5 py-2 bg-surface border-2 border-ink rounded-lg text-xs font-semibold text-ink placeholder-ink/50 focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>

          {/* Image Presets & Custom URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold font-display text-ink">
                Product Image Preview
              </label>
              <span className="text-[10px] font-bold text-accent">
                Image must match product name
              </span>
            </div>

            <div className="p-2.5 bg-amber-50 border-2 border-amber-600 rounded-lg text-[11px] font-semibold text-amber-950 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span><strong>Validation Note:</strong> Please ensure your selected/uploaded photo accurately matches the product name and category (e.g. Alphonso Mangoes must show a mango photo).</span>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={imageUrl}
                alt="Product Preview"
                className="w-16 h-16 rounded-lg object-cover border-2 border-ink bg-base shrink-0"
              />
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 px-3 py-2 bg-surface border-2 border-ink rounded-lg text-xs font-semibold text-ink placeholder-ink/50 focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            {/* Quick preset selector */}
            <div className="pt-1">
              <span className="text-[11px] font-bold text-ink block mb-1">Quick Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_IMAGES.map((img) => (
                  <button
                    key={img.label}
                    type="button"
                    onClick={() => setImageUrl(img.url)}
                    className={`px-2 py-1 rounded text-[10px] font-bold border font-display transition cursor-pointer ${
                      imageUrl === img.url
                        ? "bg-accent text-surface border-ink"
                        : "bg-base text-ink border-ink/40 hover:bg-surface"
                    }`}
                  >
                    {img.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t-2 border-ink/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-surface hover:bg-base text-ink text-xs font-bold font-display rounded-lg border-2 border-ink shadow-brutal-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-accent hover:bg-accent/90 text-surface text-xs font-extrabold font-display rounded-lg border-2 border-ink shadow-brutal active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{submitting ? "Saving..." : itemToEdit ? "Update Item" : "Add to Shelf"}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
