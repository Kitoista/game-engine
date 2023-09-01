import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { interval } from 'rxjs';
import { Game, GameState, GameObject, PlayerInputEvent } from './common/game';
import { Rectangle } from './common/engine';

const cors = require('cors');

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

const player = new GameObject();
const wall2 = new GameObject();
const wall3 = new GameObject();
const wall4 = new GameObject();
const wall5 = new GameObject();
const wall6 = new GameObject();
const wall7 = new GameObject();

player.transform = new Rectangle(200, 200, 50, 50);
wall2.transform = new Rectangle(100, 400, 500, 50);
wall3.transform = new Rectangle(50, 300, 50, 150);
wall4.transform = new Rectangle(600, 300, 50, 150);
wall5.transform = new Rectangle(50, 100, 600, 50);
wall6.transform = new Rectangle(150, 200, 50, 150);
wall7.transform = new Rectangle(650, 100, 50, 150);

player.solid = true;
wall2.solid = true;
wall3.solid = true;
wall4.solid = true;
wall5.solid = true;
wall6.solid = true;
wall7.solid = true;

player.collisionLayers = [0];
wall2.collisionLayers = [0];
wall3.collisionLayers = [0];
wall4.collisionLayers = [0];
wall5.collisionLayers = [0];
wall6.collisionLayers = [0];
wall7.collisionLayers = [0];

player.gravity = true;

const game = new Game([
    player,
    wall2,
    wall3,
    wall4,
    wall5,
    wall6,
    wall7,
]);

const lag = 25;

const lagSimulator = (callback: () => void, multiplier = 1) => {
    if (lag) {
        setTimeout(callback, lag * (1 + Math.random() * 0.5) * multiplier);
    } else {
        callback();
    }
}

const createGameState = (timestamp?: number) => {
    const gameState: GameState = {
        cameraOn: player.id,
        gameObjects: game.gameObjects,
        timestamp: timestamp || Date.now()
    };
    return gameState;
}

const mainThread = interval(Game.baseTickRate);
const eventStreams: Record<string, any>[] = [];

const broadcast = () => {
    const gameState = createGameState();
    eventStreams.forEach((eventStream, i) => {
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

    game.initPlayers([ player.id ]);

    eventStreams.push(res);

    // If client closes connection, stop sending events
    res.on('close', () => {
        console.log('client dropped me');
        eventStreams.splice(eventStreams.indexOf(res), 1);
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
