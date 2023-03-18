const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      fileName: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: player_id,
    PlayerName: player_name,
  };
};

const convertMatchDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: match_id,
    match: match,
    year: year,
  };
};

const convertPlayerMatchDbObjectToResponseObject = (dbObject) => {
  return {
    playerMatchId: player_match_id,
    playerId: player_id,
    matchId: match_id,
    score: score,
    fours: fours,
    sixes: sixes,
  };
};

// Returns a list of all the players in the player table

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
        SELECT
            *
        FROM
            player_details;`;
  const playersArray = await database.all(getPlayersQuery);
  response.send(convertPlayerDbObjectToResponseObject(playersArray));
});

// Returns a specific player based on the player ID

app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
        SELECT
            *
        FROM
            player_details
        WHERE
            player_id = ${playerId};`;
  const player = await database.get(getPlayerQuery);
  response.send(convertPlayerDbObjectToResponseObject(player));
});

// Updates the details of a specific player based on the player ID

app.put("players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE
        player_details
    SET 
        player_name = ${playerName}
    WHERE 
        player_id = ${playerId};`;
});
await database.run(updatePlayerQuery);
response.send("Player Details Updated");

// Returns the match details of a specific match

app.get("/matches/:matchId", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
        SELECT
            *
        FROM
            match_details
        WHERE
            match_id = ${matchId};`;
  const match = await database.get(getMatchQuery);
  response.send(convertMatchDbObjectToResponseObject(match));
});

//Returns a list of all the matches of a player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
    SELECT
        *
    FROM player_match_score
        NATURAL JOIN match_details
    WHERE
        player_id = ${playerId};`;
  const playerMatches = await database.get(getPlayerMatchesQuery);
  response.send(
    playerMatches.map((eachMatch) =>
      convertMatchDbObjectToResponseObject(eachMatch)
    )
  );
});

// Returns a list of players of a specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    SELECT
        *
    FROM player_match_score
        NATURAL JOIN player_details
    WHERE
        match_id = ${matchId};`;
  const matchPlayers = await database.get(getMatchPlayersQuery);
  response.send(
    matchPlayers.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

// Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatsOfPlayer = `
    SELECT
        player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(player_match_score.score) AS totalScore,
        SUM(player_match_score.fours) AS totalFours,
        SUM(player_match_score.sixes) AS totalSixes
    FROM player_match_score
        INNER JOIN player_details
    ON player_details.player_id = player_match_score.player_id
    WHERE
        player_id = ${playerId};`;
  const statsOfPlayer = await database.get(getStatsOfPlayer);
  response.send({
    playerId: statsOfPlayer.playerId,
    playerName: statsOfPlayer.playerName,
    totalScore: statsOfPlayer.totalScore,
    totalFours: statsOfPlayer.totalFours,
    totalSixes: statsOfPlayer.totalSixes,
  });
});

module.exports = app;
