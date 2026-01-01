import { hashPassword } from "./server/auth.js";
import { getDb } from "./server/db.js";
import { users } from "./drizzle/schema.js";
import { eq } from "drizzle-orm";

async function addPassword() {
  const db = await getDb();
  const allUsers = await db.select().from(users);
  
  if (allUsers.length === 0) {
    console.log("No users found");
    process.exit(0);
  }
  
  const user = allUsers[0];
  console.log("Found user:", user.email);
  
  const passwordHash = await hashPassword("password123");
  
  await db.update(users)
    .set({ 
      passwordHash,
      loginMethod: "email"
    })
    .where(eq(users.id, user.id));
  
  console.log("Password added successfully!");
  console.log("You can now login with:");
  console.log("Email:", user.email);
  console.log("Password: password123");
  
  process.exit(0);
}

addPassword().catch(console.error);
