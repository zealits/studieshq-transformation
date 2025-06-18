const jwt = require("jsonwebtoken");
const config = require("./src/config/config");

// Create a test user payload
const testUser = {
  user: {
    id: "test-user-id-12345",
    role: "freelancer",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
  },
};

// Generate test token
const token = jwt.sign(testUser, config.jwtSecret, { expiresIn: "1h" });

console.log("🔑 Test JWT Token generated successfully!");
console.log("📋 Token details:");
console.log("   User ID:", testUser.user.id);
console.log("   Role:", testUser.user.role);
console.log("   Email:", testUser.user.email);
console.log("   Expires in: 1 hour");
console.log("\n🎯 Use this token for testing:");
console.log(token);

console.log("\n💡 Usage examples:");
console.log('curl -H "x-auth-token: ' + token + '" http://localhost:2001/api/payments/gift-cards/campaigns');
console.log("\nOr in frontend localStorage:");
console.log("localStorage.setItem('token', '" + token + "');");

// Test the token by decoding it
try {
  const decoded = jwt.verify(token, config.jwtSecret);
  console.log("\n✅ Token verification successful!");
  console.log("   Decoded user:", decoded.user);
} catch (error) {
  console.log("\n❌ Token verification failed:", error.message);
}
