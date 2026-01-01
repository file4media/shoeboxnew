import { registerUser } from "./server/auth.js";

async function test() {
  try {
    const user = await registerUser("admin@test.com", "password123", "Admin User");
    console.log("User created successfully:", user);
  } catch (error) {
    console.error("Error:", error.message);
  }
  process.exit(0);
}

test();
