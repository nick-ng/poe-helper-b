import React, { useState, useEffect } from "react";
import styled from "styled-components";

import { updateCredentials, PLAYER_NAME, LEAGUE } from "../../utils";

const Container = styled.div`
  table {
    font-size: 16pt;
    input {
      font-size: 16pt;
      margin-left: 0.5em;
    }
  }

  button {
    padding: 0.5em 1em;
    margin: 0.5em 0;
  }
`;

export default function Home() {
  const [character, setCharacter] = useState("");
  const [league, setLeague] = useState("");

  useEffect(() => {
    setCharacter(localStorage.getItem(PLAYER_NAME) || null);
    setLeague(localStorage.getItem(LEAGUE) || null);
  }, []);

  useEffect(() => {
    localStorage.setItem(PLAYER_NAME, character);
  }, [character]);

  return (
    <Container>
      <h1>Path of Exile Tools</h1>
      <p>
        If you need to change your account or POESESSID, check the Settings
        page.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          localStorage.setItem(LEAGUE, league);
          updateCredentials(true);
        }}
      >
        <table>
          <tbody>
            <tr>
              <td>Character</td>
              <td>
                <input
                  value={character}
                  onChange={(event) => {
                    setCharacter(event.target.value);
                  }}
                />
              </td>
            </tr>
            <tr>
              <td>League</td>
              <td>
                <input
                  value={league}
                  onChange={(event) => {
                    setLeague(event.target.value);
                  }}
                />
              </td>
            </tr>
          </tbody>
        </table>
        <button>Save</button>
        <button
          type="button"
          onClick={() => {
            setLeague(localStorage.getItem(LEAGUE) || null);
          }}
        >
          Cancel
        </button>
      </form>
    </Container>
  );
}
