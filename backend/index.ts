import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { interval } from 'rxjs';
import { Game, GameMessage } from './common/game';
import { Rectangle, Vector } from './common/engine';
import { GameObject } from './common/game-object';
import { playerPrefab } from './common/prefabs/player';
import { Serializer } from './common/serialize';
import { wallPrefab } from './common/prefabs/wall';
import { sprites } from './sprites';
import { Player } from './common/components';
import { PlayerInputEvent } from './common/communicators';

const cors = require('cors');

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

enum Layer {
    WALLS = 0,
    PLAYERS = 1
};
const layers: number[] = Object.values(Layer).filter(v => typeof v === 'number') as any;

const wall2 = wallPrefab(new Rectangle(100, 400, 500, 50));
const wall3 = wallPrefab(new Rectangle(50, 300, 50, 150));
const wall4 = wallPrefab(new Rectangle(600, 300, 50, 150));
const wall5 = wallPrefab(new Rectangle(50, 100, 600, 50));
const wall6 = wallPrefab(new Rectangle(150, 200, 50, 150));
const wall7 = wallPrefab(new Rectangle(650, 100, 50, 150));

const gameObjects: GameObject[] = [
    wall2,
    wall3,
    wall4,
    wall5,
    wall6,
    wall7,
];

const game = new Game(layers);

game.setCollisionPair(Layer.WALLS, Layer.PLAYERS, true);

game.applyState({
    cameraOn: new Vector(),
    timestamp: Date.now(),
    gameObjects,
    collisionMatrix: game.collisionMatrix
});

const createPlayer = () => {
    const player = playerPrefab();
    game.gameObjects.push(player);
    players.push(player);
};

const sendSprites = (eventStream: any) => {
    eventStream.write(`data: ${JSON.stringify(sprites)}\n\n`);
}

const lag = 0;

const lagSimulator = (callback: () => void, multiplier = 1) => {
    if (lag) {
        setTimeout(callback, lag * (1 + Math.random() * 0.5) * multiplier);
    } else {
        callback();
    }
}

const createGameMessage = (connectionId: number, timestamp?: number): GameMessage => {
    const gameMessage: GameMessage = {
        type: 'GameMessage',
        state: {
            cameraOn: players[connectionId]?.id || new Vector(),
            timestamp: timestamp || Date.now(),
            gameObjects: game.gameObjects,
            collisionMatrix: game.collisionMatrix,
        }
    };
    return gameMessage;
}

const mainThread = interval(Game.baseTickRate);
const eventStreams: Record<string, any>[] = [];
const players: GameObject[] = [];

const broadcast = () => {
    eventStreams.forEach((eventStream, i) => {
        const gameState = createGameMessage(i);
        lagSimulator(() => {
            eventStream.write(`data: ${JSON.stringify(Serializer.serialize(gameState))}\n\n`);
        });
    });
}

const mainSub = mainThread.subscribe(i => {
    Game.time = Date.now();
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
    sendSprites(res);
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
        const player = GameObject.getById(event.objectId)?.getComponent(Player);
        if (player) {
            player.playerInputEvents.push(event);
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
