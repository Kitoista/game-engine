import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { interval } from 'rxjs';
import { Game, GameState, GameObject, PlayerInputEvent } from './common/game';
import { Rectangle, Vector } from './common/engine';

const cors = require('cors');

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

enum Layer {
    WALLS = 0,
    PLAYERS = 1
};
const layers: number[] = Object.values(Layer).filter(v => typeof v === 'number') as any;

const wall2 = new GameObject();
const wall3 = new GameObject();
const wall4 = new GameObject();
const wall5 = new GameObject();
const wall6 = new GameObject();
const wall7 = new GameObject();

wall2.transform = new Rectangle(100, 400, 500, 50);
wall3.transform = new Rectangle(50, 300, 50, 150);
wall4.transform = new Rectangle(600, 300, 50, 150);
wall5.transform = new Rectangle(50, 100, 600, 50);
wall6.transform = new Rectangle(150, 200, 50, 150);
wall7.transform = new Rectangle(650, 100, 50, 150);

wall2.solid = true;
wall3.solid = true;
wall4.solid = true;
wall5.solid = true;
wall6.solid = true;
wall7.solid = true;

wall2.collisionLayer = Layer.WALLS;
wall3.collisionLayer = Layer.WALLS;
wall4.collisionLayer = Layer.WALLS;
wall5.collisionLayer = Layer.WALLS;
wall6.collisionLayer = Layer.WALLS;
wall7.collisionLayer = Layer.WALLS;

const game = new Game([
    wall2,
    wall3,
    wall4,
    wall5,
    wall6,
    wall7,
], layers);

game.setCollisionPair(Layer.WALLS, Layer.PLAYERS, true);

const createPlayer = () => {
    const player = new GameObject();
    player.transform = new Rectangle(200, 200, 50, 50);
    player.solid = true;
    player.collisionLayer = Layer.PLAYERS;
    game.gameObjects.push(player);
    game.initPlayers([ player.id ]);
    players.push(player);
};

const lag = 0;

const lagSimulator = (callback: () => void, multiplier = 1) => {
    if (lag) {
        setTimeout(callback, lag * (1 + Math.random() * 0.5) * multiplier);
    } else {
        callback();
    }
}

const createGameState = (connectionId: number, timestamp?: number) => {
    const gameState: GameState = {
        cameraOn: players[connectionId]?.id || new Vector(),
        gameObjects: game.gameObjects,
        collisionMatrix: game.collisionMatrix,
        timestamp: timestamp || Date.now()
    };
    return gameState;
}

const mainThread = interval(Game.baseTickRate);
const eventStreams: Record<string, any>[] = [];
const players: GameObject[] = [];

const broadcast = () => {
    eventStreams.forEach((eventStream, i) => {
        const gameState = createGameState(i);
        lagSimulator(() => {
            eventStream.write(`data: ${JSON.stringify(gameState)}\n\n`);
        });
    });
}

const mainSub = mainThread.subscribe(i => {
    game.tick();
    if (i % (Game.refreshRate / Game.baseTickRate) === 0) {
        // console.log('broadcast');
        broadcast();
    }
    // if (i % (3 * Game.smoothness) === 0) {
    //     console.log('REE');
    //     player.transform.position = new Vector();
    // }
});

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send('Express + TypeScript Server');
});

app.get('/streaming', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // flush the headers to establish SSE with client

    eventStreams.push(res);
    createPlayer();

    // If client closes connection, stop sending events
    res.on('close', () => {
        console.log('client dropped me');
        const connectionId = eventStreams.indexOf(res);
        eventStreams.splice(connectionId, 1);
        const player = players.splice(connectionId, 1)[0];
        game.gameObjects.splice(game.gameObjects.indexOf(player), 1);
        res.end();
    });
});

app.post('/player-input-event', (req, res) => {
    lagSimulator(() => {
        const event: PlayerInputEvent = req.body;
        if (game.playerInputMap[event.objectId]) {
            game.playerInputMap[event.objectId].push(event);
        }
    });

    res.status(200).json();
});

app.get('/ping', (req, res) => {
    lagSimulator(() => {
        res.status(200).json();
    }, 2);
})

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
