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
const messageRoutes = require("./routes/messageRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

// Create Express app
const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "../../frontend/dist")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/payments", paymentRoutes);
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
  .then(() => {
    console.log("Connected to MongoDB");

    // Start server
    const PORT = process.env.PORT || 2001;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Frontend served at http://localhost:${PORT}`);
      console.log(`Socket.io enabled for real-time messaging`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
