import React, { useEffect, useState } from "react";
import moment from "moment";
import styled from "styled-components";
import io from "socket.io-client";

import {
  ALWAYS_COUNT_ZONES,
  DISPLAY_DATE_FORMAT,
  LEVEL_MILESTONES,
  ZONE_BENCHMARKS,
} from "./settings";
import { isWithin, secondsToBiggerTime } from "./utils";
import EventItem from "./event-item";
import { LogTextArea } from "./log-combiner";
import SplitsTable from "./splits-table";
import WhisperDisplay from "./whisper-display";
import WhisperVoice from "./whisper-voice";
import PoeRacingWidget from "../poe-racing-widget";

const SPLIT_IGNORE_LIST = "POE_SPLIT_IGNORE_LIST";
const PLAYER_NAME = "POE_PLAYER_NAME";
const START_TIMESTAMP = "POE_START_TIMESTAMP";
const LEVEL_THRESHOLD = "POE_LEVEL_THRESHOLD";
const BEST_ZONE_SPLITS = "POE_BEST_ZONE_SPLITS";
const BUILD_NAME = "POE_BUILD_NAME";

const PageColumns = styled.div`
  margin-top: 1rem;
  display: grid;
  grid-template-columns: 4fr 3fr 4fr;
  gap: 0.5rem;

  & > * {
    border: 1px solid grey;
    padding: 0.5rem;
  }
`;

const ControlBar = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 1rem;
`;

const ControlsContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  & + & {
    margin-top: 0.3rem;
  }
`;

const nextSplit = (splits, event) => {
  if (splits.length > 0) {
    const timestamps = splits.map((split) => split.timestamp);
    return {
      delta: event.timestamp - Math.max(...timestamps),
      total: event.timestamp - Math.min(...timestamps),
    };
  }

  return {
    delta: 0,
    total: 0,
  };
};

export default function PoeTimer() {
  const [allEvents, setAllEvents] = useState([]);
  const [newestEvent, setNewestEvent] = useState({
    timestamp: 0,
    type: null,
    data: null,
  });
  const [splits, setSplits] = useState([]);
  const [splitsOther, setSplitsOther] = useState([]);
  const [splitsBenchmark, setSplitsBenchmark] = useState([]);
  const [splitIgnoreList, setSplitIgnoreList] = useState(
    JSON.parse(localStorage.getItem(SPLIT_IGNORE_LIST) || "[]")
  );
  const [startTimestamp, setStartTimestamp] = useState(
    parseInt(localStorage.getItem(START_TIMESTAMP) || Date.now(), 10)
  );
  const [bestZoneSplits, setBestZoneSplits] = useState(
    JSON.parse(localStorage.getItem(BEST_ZONE_SPLITS) || "{}")
  );
  const [league, setLeague] = useState(null);
  const [character, setCharacter] = useState(
    localStorage.getItem(PLAYER_NAME) || null
  );
  const [playerLevel, setPlayerLevel] = useState(1);
  const [levelThreshold, setLevelThreshold] = useState(
    parseInt(localStorage.getItem(LEVEL_THRESHOLD) || 10),
    10
  );
  const [socketConnected, setSocketConnected] = useState(false);
  const [eventFilter, setEventFilter] = useState("");
  const [buildName, setBuildName] = useState(
    localStorage.getItem(BUILD_NAME) || ""
  );

  const reloadEvents = (start = 0) => {
    setSplits([]);
    setSplitsOther([]);
    setSplitsBenchmark([]);
    setAllEvents([]);
    setPlayerLevel(1);
    setBestZoneSplits(
      JSON.parse(localStorage.getItem(BEST_ZONE_SPLITS) || "{}")
    );
    fetch(`/clienttxt?start=${start}`);
  };

  useEffect(() => {
    setCharacter(localStorage.getItem(PLAYER_NAME) || null);

    (async () => {
      const res = await fetch("/api/env");
      const { league: fetchedLeague } = await res.json();

      setLeague(fetchedLeague);
    })();
    // register socket
    const socket = io("http://localhost:33223");

    socket.on("connect", () => {
      console.log("connected");
      setSocketConnected(true);
    });

    socket.on("clientObject", (data) => {
      setAllEvents((es) => [data, ...es].filter((a) => a.type).slice(-5000));
      setNewestEvent(data);
    });

    return () => {
      // unregister socket
      socket.off("clientLine");
    };
  }, []);

  useEffect(() => {
    if (startTimestamp > newestEvent.timestamp) {
      return;
    }
    const fullEvent = `${newestEvent.type}-${newestEvent.data}`;
    if (newestEvent.type === "enter") {
      const zone = newestEvent.data.replace("The ", "");
      const reCountZone =
        zone.includes(" Hideout") ||
        ALWAYS_COUNT_ZONES.includes(zone) ||
        splits.every(
          (split) =>
            split.details !== newestEvent.details ||
            playerLevel - split.playerLevel > levelThreshold
        );
      if (!splitIgnoreList.includes(fullEvent) && reCountZone) {
        const { delta, total } = nextSplit(splits, newestEvent);
        setSplits([
          {
            ...newestEvent,
            playerLevel,
            zone,
            data: `${zone} (${playerLevel})`,
            delta,
            total,
            fullerEvent: `${fullEvent}-${playerLevel}`,
          },
          ...splits,
        ]);
      }

      const zoneBenchmark = ZONE_BENCHMARKS.find(
        (benchmark) =>
          benchmark.zone === zone &&
          isWithin(playerLevel, benchmark.levelRange) &&
          !splitsBenchmark.some((split) => split?.details?.id === benchmark?.id)
      );
      if (zoneBenchmark) {
        const { delta, total } = nextSplit(splitsBenchmark, newestEvent);
        const newBestZoneSplits = {
          ...bestZoneSplits,
        };

        const deltaDifference = (
          (delta / 1000 - zoneBenchmark.delta) /
          60
        ).toFixed(1);
        const sign = deltaDifference < 0 ? "" : "+";
        let progress = `${sign}${deltaDifference}`;

        if (bestZoneSplits[buildName]) {
          if (bestZoneSplits[buildName][zoneBenchmark.id]) {
            newBestZoneSplits[buildName][zoneBenchmark.id] = {
              delta: Math.min(
                bestZoneSplits[buildName][zoneBenchmark.id].delta,
                delta
              ),
              total: Math.min(
                bestZoneSplits[buildName][zoneBenchmark.id].total,
                total
              ),
            };

            const deltaDifference2 = (
              (delta - bestZoneSplits[buildName][zoneBenchmark.id].delta) /
              60000
            ).toFixed(1);
            const sign2 = deltaDifference2 < 0 ? "" : "+";
            progress = `${sign2}${deltaDifference2}, ${progress}`;
          } else {
            newBestZoneSplits[buildName][zoneBenchmark.id] = {
              delta,
              total,
            };
          }
        } else {
          newBestZoneSplits[buildName] = {
            [zoneBenchmark.id]: {
              delta,
              total,
            },
          };
        }

        setBestZoneSplits(newBestZoneSplits);
        setSplitsBenchmark([
          {
            data: `${zone} (${progress})`,
            details: { ...zoneBenchmark },
            delta,
            total,
            timestamp: newestEvent.timestamp,
          },
          ...splitsBenchmark,
        ]);
      }

      if (splits.length === 0) {
        setSplitsOther([
          {
            data: "Start",
            delta: 0,
            total: 0,
            timestamp: newestEvent.timestamp,
          },
        ]);
        setSplitsBenchmark([
          {
            data: "Start",
            delta: 0,
            total: 0,
            timestamp: newestEvent.timestamp,
          },
        ]);
      }
    }
    if (newestEvent.type === "kitava") {
      const { delta, total } = nextSplit(splits, newestEvent);
      setSplitsOther([
        {
          data: `Act 5 Kitava`,
          delta,
          total,
          timestamp: newestEvent.timestamp,
        },
        ...splitsOther,
      ]);
    }
    if (newestEvent.type === "level") {
      const { details } = newestEvent;
      const rightPlayer = !character || character === details.player;
      if (rightPlayer) {
        setPlayerLevel(details.level);
      }

      if (rightPlayer && LEVEL_MILESTONES.includes(details.level)) {
        const { delta, total } = nextSplit(splitsOther, newestEvent);
        setSplitsOther([
          {
            data: `Level ${details.level}`,
            delta,
            total,
            timestamp: newestEvent.timestamp,
          },
          ...splitsOther,
        ]);
      }
    }
  }, [newestEvent]);

  useEffect(() => {
    if (socketConnected) {
      reloadEvents(startTimestamp);
    }
  }, [socketConnected]);

  useEffect(() => {
    localStorage.setItem(SPLIT_IGNORE_LIST, JSON.stringify(splitIgnoreList));
  }, [splitIgnoreList]);
  useEffect(() => {
    localStorage.setItem(START_TIMESTAMP, startTimestamp);
  }, [startTimestamp]);
  useEffect(() => {
    localStorage.setItem(PLAYER_NAME, character);
  }, [character]);
  useEffect(() => {
    localStorage.setItem(LEVEL_THRESHOLD, levelThreshold);
  }, [levelThreshold]);
  useEffect(() => {
    localStorage.setItem(BUILD_NAME, buildName);
  }, [buildName]);

  const startDate = moment(startTimestamp).format(DISPLAY_DATE_FORMAT);
  const markdownTable = [
    ...splits.map((split) =>
      [
        split.data,
        secondsToBiggerTime(split.delta / 1000),
        secondsToBiggerTime(split.total / 1000),
      ].join("|")
    ),
  ];
  markdownTable.reverse();

  const logCSV = [
    ...splits.map((split) =>
      [
        split.zone,
        split.playerLevel,
        Math.round(split.delta / 1000),
        Math.round(split.total / 1000),
      ].join("\t")
    ),
  ];
  logCSV.reverse();

  return (
    <div>
      <h1>Timer</h1>
      <ControlBar>
        <div>
          <p>{`Starting from ${startDate}`}</p>
          <ControlsContainer>
            <button onClick={() => reloadEvents(startTimestamp)}>
              {`Reload from ${startDate}`}
            </button>
            <button
              onClick={() => {
                const now = Date.now();
                setStartTimestamp(now);
                reloadEvents(now);
              }}
            >
              Now
            </button>
            <button
              onClick={() => {
                const hourAgo = startTimestamp - 1000 * 60 * 60;
                setStartTimestamp(hourAgo);
                reloadEvents(hourAgo);
              }}
            >
              -1 hour
            </button>
            <button
              onClick={() => {
                localStorage.setItem(
                  BEST_ZONE_SPLITS,
                  JSON.stringify(bestZoneSplits)
                );
                reloadEvents(startTimestamp);
              }}
            >
              Update best splits
            </button>
            <button
              onClick={() => {
                if (confirm(`Really clear best splits for ${buildName}?`)) {
                  const newZoneSplits = { ...bestZoneSplits };
                  delete newZoneSplits[buildName];
                  if (Object.keys(newZoneSplits).length > 0) {
                    setBuildName(Object.keys(newZoneSplits)[0]);
                  } else {
                    setBuildName(Object.keys(""));
                  }
                  localStorage.setItem(
                    BEST_ZONE_SPLITS,
                    JSON.stringify(newZoneSplits)
                  );
                  setBestZoneSplits(newZoneSplits);
                  reloadEvents(startTimestamp);
                }
              }}
            >
              {`Clear ${buildName} splits`}
            </button>
            {/* <label>
              Player:{" "}
              <input
                value={character}
                onChange={(e) => {
                  setCharacter(e.target.value);
                }}
              />
            </label> */}
          </ControlsContainer>
          <ControlsContainer>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                reloadEvents(startTimestamp);
              }}
            >
              <label>
                Build Name:{" "}
                <input
                  value={buildName}
                  onChange={(e) => {
                    setBuildName(e.target.value.replace(/[^\w]/g, "_"));
                  }}
                />
              </label>
            </form>
            <select
              value={buildName}
              onChange={(e) => {
                setBuildName(e.target.value);
                reloadEvents(startTimestamp);
              }}
            >
              {Object.keys(bestZoneSplits).map((build) => (
                <option key={build} value={build}>
                  {build}
                </option>
              ))}
            </select>
          </ControlsContainer>
        </div>
        <PoeRacingWidget league={league} character={character} size={2} />
        <div>
          {/* <LogTextArea
            value={
              splits.length > 0
                ? `### ${startDate} - ${secondsToBiggerTime(
                    splits[0].total / 1000
                  )}\nZone|Split|Time\n--|--|--\n${markdownTable.join("\n")}`
                : ""
            }
          /> */}
          <LogTextArea
            value={
              splits.length > 0
                ? `${startDate}\t\t${secondsToBiggerTime(
                    splits[0].total / 1000
                  )}\t${
                    splits[0].total / 1000
                  }\nZone\tLevel\tSplit\tTime\n${logCSV.join("\n")}`
                : ""
            }
          />
        </div>
      </ControlBar>
      <PageColumns>
        <div>
          <SplitsTable splits={splitsBenchmark} splitName="Zone" positiveEdge />
        </div>
        <div>
          <SplitsTable
            splits={splits}
            splitName="Zone"
            positiveEdge
            hideSplit
          />
        </div>
        <div
          style={{
            height: "70vh",
            overflowY: "scroll",
          }}
        >
          <label>
            Zone-Level Threshold:
            <input
              style={{
                width: "2rem",
                marginRight: "1rem",
              }}
              type="text"
              value={levelThreshold}
              onChange={(e) => {
                setLevelThreshold(e.target.value);
              }}
            />
          </label>
          <label>
            Filter:
            <input
              type="text"
              value={eventFilter}
              onChange={(e) => {
                setEventFilter(e.target.value);
              }}
            />
          </label>
          <button
            onClick={() => {
              setEventFilter("");
            }}
          >
            Clear
          </button>
          {allEvents
            .filter(
              (event) =>
                event.type !== "level" &&
                event.data.toUpperCase().includes(eventFilter.toUpperCase())
            )
            .map((event) => {
              const fullEvent = `${event.type}-${event.data}`;
              return (
                <EventItem
                  key={event.timestamp}
                  event={event}
                  isIgnored={!splitIgnoreList.includes(fullEvent)}
                  startChangeHandler={() => {
                    setStartTimestamp(event.timestamp);
                  }}
                  splitIgnoreChangeHandler={() => {
                    if (!splitIgnoreList.includes(fullEvent)) {
                      setSplitIgnoreList(
                        splitIgnoreList.filter((e) => e !== fullEvent)
                      );
                    } else {
                      setSplitIgnoreList([...splitIgnoreList, fullEvent]);
                    }
                  }}
                />
              );
            })}
        </div>
      </PageColumns>
      <WhisperDisplay allEvents={allEvents} />
      <WhisperVoice event={allEvents[0]} />
    </div>
  );
}
