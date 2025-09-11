const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { createServer } = require("http");
const path = require("path");
const { initializeSocket } = require("./sockets/chatSocket");

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const projectRoutes = require("./routes/projectRoutes");
const jobRoutes = require("./routes/jobRoutes");
const proposalRoutes = require("./routes/proposalRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const userManagementRoutes = require("./routes/userManagementRoutes");
const adminRoutes = require("./routes/adminRoutes");
const messageRoutes = require("./routes/messageRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const escrowRoutes = require("./routes/escrowRoutes");
const contactRoutes = require("./routes/contactRoutes");
const otpRoutes = require("./routes/otpRoutes");
const supportRoutes = require("./routes/supportRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

// Create Express app
const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure MIME types for JavaScript modules
app.use((req, res, next) => {
  if (req.url.endsWith(".js")) {
    res.type("application/javascript");
  }
  next();
});

// Serve static files from the frontend/dist directory
app.use(
  express.static(path.join(__dirname, "../../frontend/dist"), {
    setHeaders: (res, path) => {
      if (path.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      }
    },
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin/users", userManagementRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/escrow", escrowRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/reviews", reviewRoutes);

// Handle React routing, return all requests to React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || "Server Error",
  });
});

// Initialize Socket.io
initializeSocket(httpServer);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/studieshq")
  .then(async () => {
    console.log("Connected to MongoDB");

    // Initialize platform settings
    const initializeSettings = require("./utils/initializeSettings");
    await initializeSettings();

    // Start server
    const PORT = process.env.PORT || 2001;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.io enabled for real-time messaging`);
      console.log(`Escrow system initialized with platform fee settings`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
