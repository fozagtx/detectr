import type { CaseInput } from "./types";

/** Baked-in Oak Street Incident demo — original Detectr copy, Veridical-style structure. */
export function createOakStreetDemo(): CaseInput {
  const now = new Date().toISOString();
  return {
    id: `DET-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-001`,
    caseName: "Oak Street Incident",
    location: "Oak Street & 5th Avenue",
    dateTime: "December 15, 2024, approximately 9:15 PM",
    description:
      "A disturbance near the intersection of Oak Street and 5th Avenue. A subject allegedly confronted a pedestrian, fled toward an alley, and was observed by multiple bystanders under low evening lighting. Investigators need to reconcile conflicting witness accounts and validate what could physically be perceived at the reported distances and lux levels.",
    status: "DRAFT",
    createdAt: now,
    witnesses: [
      {
        id: "w1",
        name: "Maria Santos",
        position: "Bus stop, ~50 ft north of intersection",
        statement:
          "I was waiting at the bus stop about fifty feet away. It was dark — streetlights were dim. I heard a man shout something, then a short scream. I saw someone in a dark jacket running toward the alley on the left. He had a distinctive limp in his right leg. I think I saw a scar on his left cheek when he turned under the streetlight, but he was moving fast — maybe forty feet from me.",
      },
      {
        id: "w2",
        name: "James Cooper",
        position: "Corner café patio, ~30 ft east",
        statement:
          "I was finishing coffee on the patio. Lighting was low, maybe around five lux away from the lamp. I clearly heard shouting from the intersection. The subject wore dark clothing — jacket and jeans. He fled toward the left, toward the alley. I could tell general clothing but not fine facial detail. Motion was obvious in my peripheral vision before I looked up.",
      },
      {
        id: "w3",
        name: "Aisha Rahman",
        position: "Second-floor apartment window overlooking Oak Street",
        statement:
          "From my window I heard a scream around 9:17 PM. I saw a person run left into the alley. Dark jacket. I did not see a limp from that angle. I could not make out a facial scar. The street was poorly lit.",
      },
      {
        id: "w4",
        name: "Derek Okonkwo",
        position: "Walking south on 5th Avenue, ~60 ft away",
        statement:
          "I was walking toward Oak. At about sixty feet I heard shouting — not clear words, just raised voices. Then someone sprinted left toward the alley. Dark clothes. I thought I saw a tattoo on the neck when he passed a brighter patch near the lamp, but I'm not certain. He was running hard.",
      },
    ],
  };
}
