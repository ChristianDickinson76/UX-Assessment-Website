const connectDb = require("./config/db");
const Show = require("./models/Show");

const shows = [
  { showCode: "show-001", artist: "The 1975 Tribute Night", venue: "O2 Academy Leeds", date: "2026-05-12", genre: "Indie Pop", category: "Live Music", price: 38 },
  { showCode: "show-002", artist: "Northern Soul Revival", venue: "Leeds Beckett Students' Union", date: "2026-05-18", genre: "Soul", category: "Concerts", price: 24 },
  { showCode: "show-003", artist: "Warehouse Techno Sessions", venue: "Project House", date: "2026-05-24", genre: "Electronic", category: "Live Music", price: 31 },
  { showCode: "show-004", artist: "Leeds Strings Live", venue: "Leeds Grand Theatre", date: "2026-05-30", genre: "Orchestral", category: "Concerts", price: 45 },
  { showCode: "show-005", artist: "West Yorkshire Rock Festival", venue: "Millennium Square", date: "2026-06-07", genre: "Rock", category: "Live Music", price: 29 },
  { showCode: "show-006", artist: "Acoustic Evenings: City Voices", venue: "Belgrave Music Hall", date: "2026-06-14", genre: "Acoustic", category: "Concerts", price: 20 },
  { showCode: "show-007", artist: "A Midsummer Night's Theatre", venue: "Leeds Playhouse", date: "2026-06-21", genre: "Drama", category: "Theatre", price: 34 },
  { showCode: "show-008", artist: "La Traviata", venue: "Leeds Grand Theatre", date: "2026-06-27", genre: "Opera", category: "Opera", price: 52 },
  { showCode: "show-009", artist: "Swan Lake", venue: "First Direct Arena", date: "2026-07-04", genre: "Dance", category: "Ballet", price: 48 },
  { showCode: "show-010", artist: "Hamilton UK Tour", venue: "Leeds Grand Theatre", date: "2026-07-12", genre: "Musical Theatre", category: "Musicals", price: 58 }
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
