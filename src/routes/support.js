import { Router } from "express";
import mongoose from "mongoose";
import SupportTicket from "../models/SupportTicket.js";
import { authenticateAdminToken } from "./adminAuth.js";

const router = Router();

// In-memory support tickets
export const MEMORY_SUPPORT_TICKETS = [
  {
    ticketId: "TICK-4820",
    customerName: "Sneha Patil",
    email: "sneha.p@gmail.com",
    phone: "+91 98201 44552",
    orderId: "ORD-99381",
    storeName: "Green Basket Fresh Organics",
    category: "produce_freshness",
    subject: "Spinach freshness verification confirmation",
    message: "I watched the live camera stream and the spinach looks very fresh. Just wanted to verify if it will arrive within 20 minutes?",
    status: "resolved",
    createdAt: new Date("2026-08-05T14:20:00Z"),
    updatedAt: new Date("2026-08-05T15:00:00Z")
  },
  {
    ticketId: "TICK-4821",
    customerName: "Aakash Mehta",
    email: "aakash.m@outlook.com",
    phone: "+91 97690 12839",
    orderId: "ORD-99384",
    storeName: "Green Basket Fresh Organics",
    category: "produce_freshness",
    subject: "Tomato batch batch timing inquiry",
    message: "Can you let me know what time the morning fresh tomato crate is stocked on shelf A?",
    status: "in_progress",
    createdAt: new Date("2026-08-06T09:15:00Z"),
    updatedAt: new Date("2026-08-06T10:00:00Z")
  },
  {
    ticketId: "TICK-4822",
    customerName: "Pooja Deshmukh",
    email: "pooja.d@yahoo.com",
    phone: "+91 98192 33441",
    orderId: "",
    storeName: "General Inquiry",
    category: "payment_issue",
    subject: "UPI QR payment confirmation receipt",
    message: "Payment completed successfully for my order, please share the invoice copy.",
    status: "open",
    createdAt: new Date("2026-08-07T08:30:00Z"),
    updatedAt: new Date("2026-08-07T08:30:00Z")
  }
];

// POST /api/support/ticket (Public Customer Form)
router.post("/ticket", async (req, res) => {
  try {
    const { customerName, email, phone, orderId, storeName, category, subject, message } = req.body;

    if (!customerName || !email || !subject || !message) {
      return res.status(400).json({ error: "Customer name, email, subject, and message are required." });
    }

    const ticketId = `TICK-${Math.floor(1000 + Math.random() * 9000)}`;

    let newTicket;
    if (mongoose.connection.readyState === 1) {
      newTicket = await SupportTicket.create({
        ticketId,
        customerName,
        email: email.trim().toLowerCase(),
        phone: phone || "",
        orderId: orderId || "",
        storeName: storeName || "General Store",
        category: category || "produce_freshness",
        subject,
        message,
        status: "open"
      });
    } else {
      newTicket = {
        ticketId,
        customerName,
        email: email.trim().toLowerCase(),
        phone: phone || "",
        orderId: orderId || "",
        storeName: storeName || "General Store",
        category: category || "produce_freshness",
        subject,
        message,
        status: "open",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      MEMORY_SUPPORT_TICKETS.unshift(newTicket);
    }

    res.status(201).json({
      message: "Customer support ticket submitted successfully. Our store team will review it shortly.",
      ticket: newTicket
    });
  } catch (err) {
    console.error("Support ticket submission error:", err);
    res.status(500).json({ error: "Failed to submit support ticket." });
  }
});

// GET /api/support/tickets (Store Owner / Admin Panel)
router.get("/tickets", authenticateAdminToken, async (req, res) => {
  try {
    const { storeName } = req.adminUser;

    let tickets = [];
    if (mongoose.connection.readyState === 1) {
      tickets = await SupportTicket.find().sort({ createdAt: -1 }).lean();
    } else {
      tickets = MEMORY_SUPPORT_TICKETS;
    }

    res.json({
      totalCount: tickets.length,
      tickets
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch support tickets." });
  }
});

// PUT /api/support/tickets/:ticketId/status (Store Owner Updates status)
router.put("/tickets/:ticketId/status", authenticateAdminToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    if (!["open", "in_progress", "resolved", "closed"].includes(status)) {
      return res.status(400).json({ error: "Invalid ticket status." });
    }

    let updatedTicket = null;
    if (mongoose.connection.readyState === 1) {
      updatedTicket = await SupportTicket.findOneAndUpdate(
        { ticketId },
        { status, updatedAt: new Date() },
        { new: true }
      ).lean();
    } else {
      const ticket = MEMORY_SUPPORT_TICKETS.find((t) => t.ticketId === ticketId);
      if (ticket) {
        ticket.status = status;
        ticket.updatedAt = new Date();
        updatedTicket = ticket;
      }
    }

    if (!updatedTicket) {
      return res.status(404).json({ error: "Support ticket not found." });
    }

    res.json({
      message: "Ticket status updated successfully.",
      ticket: updatedTicket
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update ticket status." });
  }
});

export default router;
