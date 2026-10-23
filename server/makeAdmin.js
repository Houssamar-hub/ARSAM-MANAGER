import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "./config/db.js";
import User from "./models/User.js";

const run = async () => {
  try {
    await connectDB();

    const email = process.argv[2];

    if (!email) {
      console.log("\n📋 Liste des utilisateurs dans la base de données :");
      const users = await User.find({}, "name email role status createdAt");
      if (users.length === 0) {
        console.log("Aucun utilisateur trouvé.");
      } else {
        console.table(
          users.map((u) => ({
            ID: u._id.toString(),
            Nom: u.name,
            Email: u.email,
            Role: u.role,
            Statut: u.status,
          }))
        );
      }
      console.log(
        "\nPour attribuer le rôle admin à un compte, exécutez :"
      );
      console.log("node makeAdmin.js <email-de-l-utilisateur>\n");
      process.exit(0);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.error(`\n❌ Utilisateur avec l'email "${normalizedEmail}" introuvable.\n`);
      process.exit(1);
    }

    user.role = "admin";
    await user.save();

    console.log(
      `\n✅ Succès ! L'utilisateur "${user.name}" (${user.email}) est désormais ADMIN.\n`
    );
    process.exit(0);
  } catch (err) {
    console.error("Erreur:", err.message);
    process.exit(1);
  }
};

run();
