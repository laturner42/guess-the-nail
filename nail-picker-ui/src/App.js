import { RgbColorPicker } from 'react-colorful';
import { useEffect, useState, useCallback } from 'react';
import { MessageTypes } from './constants';

import './App.css';

const server = '192.168.4.36';

function App() {
  const [socket, setSocket] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [myName, setMyName] = useState('');
  const [showNail, setShowNail] = useState(false);

  const changeName = (e) => {
    setMyName(e.target.value);
  }

  const [selectedColor, setSelectedColor] = useState({ r: 230, g: 100, b: 90 })

  const sendMessage = (data, forceSocket) => (forceSocket || socket).send(JSON.stringify({ name: myName, ...data }));

  const sendChangeColor = () => {
    if (gameData.guessing) {
      sendMessage({ type: MessageTypes.GUESS, guess: selectedColor });
    }
  }

  const startNextRound = () => {
    sendMessage({
      type: MessageTypes.NEXT,
    })
  }

  const endRound = () => {
    sendMessage({
      type: MessageTypes.FINISHED,
    })
  }

  const join = () => {
    if (myName.length > 12) {
      alert('Kenny, your name can\'t be that long. Sorry.');
      return;
    }
    sendMessage({
      type: MessageTypes.JOIN,
    })
  }

  const connect = useCallback(() => {
    const ws = new WebSocket(`ws://${server}:9898/`);
    ws.onopen = () => {
      setSocket(ws);
    };
    ws.onmessage = (e) => {
      setGameData(JSON.parse(e.data));
    };
    ws.onclose = (e) => {
      setSocket(null);
      console.error(e);
    }
  }, []);

  useEffect(() => {
    connect();
  }, []);

  const askForName = () => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          // alignItems: 'center',
        }}
      >
        <span>Name:</span>
        <input autoFocus type="text" onChange={changeName} style={{ marginTop: 5 }} />
        <button disabled={!socket || !myName} onClick={join} style={{ marginTop: 5 }}>Join</button>
        {!socket && <span style={{ color: 'red' }}>not connected<br />(try refreshing)</span>}
      </div>
    )
  };

  const renderGame = () => {
    return (
      <div
        style={{
          flex: '1 0 0',
          overflowY: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div
          style={{
            flex: '1 0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ marginBottom: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', }}>
            <span>{gameData.colorName}</span>
            <span style={{ fontSize: 12, color: '#bbb' }}>by {gameData.colorBrand}</span>
          </div>
          {
            gameData.guessing ? <RgbColorPicker disabled color={selectedColor} onChange={setSelectedColor} /> : (
              <div
                onClick={() => setShowNail(!showNail)}
                style={{
                  userSelect: 'none',
                  width: 200,
                  height: 200,
                  overflow: 'hidden',
                  borderRadius: 8,
                }}
              >
                {
                  showNail ?
                    <img src={gameData.nailPhoto} width={200} height={200} /> :
                    <div
                      style={{
                        width: 200,
                        height: 200,
                        backgroundColor: `rgb(${gameData.color.r},${gameData.color.g},${gameData.color.b})`,
                      }}
                    />
                }
              </div>
            )
          }
          <div style={{ width: '100%', marginTop: gameData.guessing ? 20 : 17 }}>
            {
              gameData.guessing ?
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-around' }}>
                  <button onClick={sendChangeColor}>Lock In</button>
                  <button onClick={endRound} disabled={gameData.leader !== myName}>End Round</button>
                </div> :
                <button onClick={startNextRound} disabled={gameData.leader !== myName}>Next Round</button>
            }
          </div>
        </div>
        <div style={{ flex: '1 1 auto', overflowY: 'scroll' }}>
          {Object.values(gameData.players).sort((p1, p2) => p1.total - p2.total).map((player) => (
            <div
              style={{
                minWidth: 200,
                backgroundColor: '#666',
                borderRadius: 10,
                borderColor: 'white',
                borderWidth: 5,
                padding: 1,
                margin: 3,
              }}
            >
              <div style={{ margin: 10, marginTop: 5 }}>
                <span>{player.name}</span>
                <span style={{ fontSize: 10, color: '#bbb', marginLeft: 6 }}>{player.total} Δ</span>
              </div>
              <div
                style={{
                  borderRadius: 10,
                  margin: 10,
                  height: 40,
                  backgroundColor: player.name === myName || !gameData.guessing ?
                    `rgb(${player.guess.r},${player.guess.g},${player.guess.b})`
                    : '#789',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {!gameData.guessing && <span>{player.lastLoss} Δ</span>}
                {!!gameData.guessing && player.guess.r + player.guess.g + player.guess.b === 0 && <span>Waiting</span>}
              </div>
            </div>
          ))}
          {!socket && <span style={{ color: 'red' }}>Lost Connection</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="App">
      {
        gameData ? renderGame() : askForName()
      }
    </div>
  );
}

export default App;
