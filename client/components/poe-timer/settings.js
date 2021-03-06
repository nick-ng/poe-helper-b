export const DATE_FORMAT = "YYYY/MM/DD HH:mm:ss";
export const DISPLAY_DATE_FORMAT = "YYYY/MM/DD hh:mm a";

export const ALWAYS_COUNT_ZONES = [
  "Lioneye's Watch",
  "Forest Encampment",
  "Sarn Encampment",
  "Highgate",
  "Overseer's Tower",
  "Bridge Encampment",
  "Oriath Docks",
  "Aspirants' Plaza",
  "Aspirant's Trial",
];

export const LEVEL_MILESTONES = [
  10,
  20,
  30,
  40,
  50,
  60,
  70,
  80,
  85,
  90,
  91,
  92,
  93,
  94,
  95,
  96,
  97,
  98,
  99,
  100,
];

export const ZONE_BENCHMARKS = [
  {
    id: "ledge_1",
    zone: "Ledge",
    levelRange: [0, 20],
    total: 7.5 * 60,
  },
  {
    id: "prisoners_gate_1",
    zone: "Prisoner's Gate",
    levelRange: [0, 20],
    total: 15 * 60,
  },
  {
    id: "southern_forest_1",
    zone: "Southern Forest",
    levelRange: [0, 30],
    total: 25 * 60,
  },
  {
    id: "vaal_ruins_1",
    zone: "Vaal Ruins",
    levelRange: [0, 30],
    total: 33 * 60,
  },
  {
    id: "city_of_sarn_1",
    zone: "City of Sarn",
    levelRange: [0, 40],
    total: 44 * 60,
  },
  {
    id: "ebony_barracks_1",
    zone: "Ebony Barracks",
    levelRange: [0, 40],
    total: 55 * 60,
  },
  {
    id: "aqueduct_1",
    zone: "Aqueduct",
    levelRange: [0, 40],
    total: 70 * 60,
  },
  {
    id: "belly_1",
    zone: "Belly of the Beast Level 1",
    levelRange: [0, 50],
    total: 90 * 60,
  },
  {
    id: "slave_pens_1",
    zone: "Slave Pens",
    levelRange: [0, 50],
    total: (60 + 42) * 60,
  },
  {
    id: "lioneyes_watch_2",
    zone: "Slave Pens",
    levelRange: [40, 100],
    total: 120 * 60,
  },
].map((benchmark, i, benchmarks) => {
  if (i > 0) {
    return {
      ...benchmark,
      delta: benchmark.total - benchmarks[i - 1].total,
    };
  }
  return {
    ...benchmark,
    delta: benchmark.total,
  };
});
