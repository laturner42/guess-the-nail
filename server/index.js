const http = require('http');
const WebSocketServer = require('websocket').server;
const { parseImage } = require('./colorParser');
const { MessageTypes } = require('../nail-picker-ui/src/constants');
const allColors = require('./output.json');

let nextIndex = -1;

const connections = {};
const players = {};

const gameState = {
  players,
  guessing: false,
  nailPhoto: null,
  color: { r: 0, g: 0, b: 0 },
  colorName: 'Waiting',
  colorBrand: 'waiting'
};

const nextRound = async () => {
  nextIndex += 1;
  const {
    avgColor,
    imgSrc,
    name,
    brand,
  } = await parseImage(allColors[nextIndex]);
  gameState.color = avgColor;
  gameState.nailPhoto = imgSrc;
  gameState.colorName = name;
  gameState.guessing = true;
  gameState.colorBrand = brand;
  Object.values(players).forEach((player) => {
    player.guess = { r: 0, g: 0, b: 0 };
  });
  updateEveryone();
};

const updateEveryone = () => {
  Object.values(connections).forEach((connection) => {
    connection.sendUTF(JSON.stringify(gameState));
  });
};

const endRound = () => {
  gameState.guessing = false;
  Object.values(players).forEach((player) => {
    const { guess } = player;
    const distance = Math.floor(Math.sqrt(
      (guess.r - gameState.color.r) ** 2 +
      (guess.g - gameState.color.g) ** 2 +
      (guess.b - gameState.color.b) ** 2
    ));
    player.lastLoss = distance;
    player.total += distance;
  });
  updateEveryone();
};

const playerGuess = (name, guess) => {
  if (!gameState.guessing) return;
  players[name].guess = guess;
  updateEveryone();
}

const playerJoin = (name) => {
  if (!players[name]) {
    players[name] = {
      name,
      guess: { r: 0, g: 0, b: 0 },
      total: 0,
      lastLoss: 0,
    }
  }
  updateEveryone();
}

const parseMessage = async (data, connection) => {
  const { type, name } = data;
  console.log(data);
  if (!players[name]) {
    connections[name] = connection;
    playerJoin(name);
  }
  if (type === MessageTypes.JOIN) {
    connections[name] = connection;
    updateEveryone();
  } if (type === MessageTypes.GUESS) {
    const { guess } = data;
    playerGuess(name, guess);
  } else if (type === MessageTypes.FINISHED) {
    endRound();
  } else if (type === MessageTypes.NEXT) {
    nextRound();
  }
};

const server = http.createServer();
const WS_PORT = process.env.WS_PORT || 9898;
server.listen(WS_PORT, () => console.log(`Websocket listening on port ${WS_PORT}`));
const wsServer = new WebSocketServer({
  httpServer: server,
});
wsServer.on('request', (request) => {
  console.debug('new connection');
  const connection = request.accept(null, request.origin);
  connection.on('message', (message) => {
    const data = JSON.parse(message.utf8Data);
    parseMessage(data, connection);
  });
  connection.on('close', (reasonCode, desc) => {
    console.debug('Client lost');
  })
});