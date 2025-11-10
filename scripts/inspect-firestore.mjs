import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getCredentials() {
  const raw = process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (!raw) {
    throw new Error("FIREBASE_ADMIN_CREDENTIALS ist nicht gesetzt.");
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Kann FIREBASE_ADMIN_CREDENTIALS nicht parsen: ${error}`);
  }

  if (!parsed.projectId || !parsed.clientEmail || !parsed.privateKey) {
    throw new Error("FIREBASE_ADMIN_CREDENTIALS ist unvollständig.");
  }

  return {
    projectId: parsed.projectId,
    clientEmail: parsed.clientEmail,
    privateKey: parsed.privateKey.replace(/\\n/g, "\n"),
  };
}

function getDb() {
  const credentials = getCredentials();
  if (!getApps().length) {
    initializeApp({
      credential: cert(credentials),
    });
  }

  return getFirestore(getApp());
}

async function dumpCollection(collection) {
  const db = getDb();
  const snapshot = await db.collection(collection).limit(20).get();
  console.log(`Collection "${collection}" (${snapshot.size} Dokumente, max 20 angezeigt):`);
  snapshot.docs.forEach((doc) => {
    console.log(`- ${collection}/${doc.id}`, JSON.stringify(doc.data(), null, 2));
  });
  console.log("");
}

async function main() {
  const collections = process.argv.slice(2);
  if (!collections.length) {
    console.log("Bitte mindestens eine Collection übergeben, z. B.:");
    console.log("  node scripts/inspect-firestore.mjs users slots venues");
    process.exit(1);
  }

  for (const collection of collections) {
    await dumpCollection(collection);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
