import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String },
  orderId: { type: String },
  storeName: { type: String },
  category: {
    type: String,
    enum: ["produce_freshness", "order_delay", "wrong_item", "payment_issue", "general"],
    default: "produce_freshness"
  },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ["open", "in_progress", "resolved", "closed"],
    default: "open"
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("SupportTicket", supportTicketSchema);
