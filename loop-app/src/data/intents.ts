import type { IntentKey } from "@/types/domain";

export interface IntentMeta {
  key: IntentKey;
  label: string;
  description: string;
  defaultDuration: number;
}

export const intents: IntentMeta[] = [
  {
    key: "smalltalk",
    label: "Smalltalk",
    description: "Lockeres Kennenlernen in öffentlichen Bereichen.",
    defaultDuration: 10,
  },
  {
    key: "coStudy",
    label: "Co-Study",
    description: "Gemeinsame Lernsession mit klarer Zeitbox.",
    defaultDuration: 15,
  },
  {
    key: "walkTalk",
    label: "Walk & Talk",
    description: "Kurzer Spaziergang am Campusufer.",
    defaultDuration: 15,
  },
  {
    key: "coffeeBreak",
    label: "Kaffee & kurze Pause",
    description: "Match direkt an Café-Partner gekoppelt.",
    defaultDuration: 10,
  },
];

export const intentIndex = intents.reduce<Record<IntentKey, IntentMeta>>(
  (acc, intent) => {
    acc[intent.key] = intent;
    return acc;
  },
  {} as Record<IntentKey, IntentMeta>,
);
