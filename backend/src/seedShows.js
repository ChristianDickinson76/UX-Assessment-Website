const connectDb = require("./config/db");
const Show = require("./models/Show");

const shows = [
  { showCode: "show-001", artist: "The 1975 Tribute Night", venue: "O2 Academy Leeds", date: "2026-05-12", genre: "Indie Pop", price: 38 },
  { showCode: "show-002", artist: "Northern Soul Revival", venue: "Leeds Beckett Students' Union", date: "2026-05-18", genre: "Soul", price: 24 },
  { showCode: "show-003", artist: "Warehouse Techno Sessions", venue: "Project House", date: "2026-05-24", genre: "Electronic", price: 31 },
  { showCode: "show-004", artist: "Leeds Strings Live", venue: "Leeds Grand Theatre", date: "2026-05-30", genre: "Orchestral", price: 45 },
  { showCode: "show-005", artist: "West Yorkshire Rock Festival", venue: "Millennium Square", date: "2026-06-07", genre: "Rock", price: 29 },
  { showCode: "show-006", artist: "Acoustic Evenings: City Voices", venue: "Belgrave Music Hall", date: "2026-06-14", genre: "Acoustic", price: 20 }
];

async function seed() {
  await connectDb();

  for (const show of shows) {
    await Show.updateOne(
      { showCode: show.showCode },
      { $set: show },
      { upsert: true }
    );
  }

  // eslint-disable-next-line no-console
  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Seed failed:", error.message);
  process.exit(1);
});
