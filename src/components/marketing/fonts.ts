import { Instrument_Serif, Source_Serif_4 } from "next/font/google";

// Used for exactly one editorial word in the landing headline.
export const instrumentSerif = Instrument_Serif({ weight: "400", style: "italic", subsets: ["latin"], display: "swap" });

// The typed letters and emails on the evidence desk (agent-scene.tsx), so they read as paper, not UI.
export const documentSerif = Source_Serif_4({ subsets: ["latin"], display: "swap", variable: "--font-document" });
