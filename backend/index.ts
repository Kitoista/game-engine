import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { interval } from 'rxjs';
import { Game, GameMessage } from './common/game';
import { Rectangle, Vector } from './common/engine';
import { GameObject } from './common/game-object';
import { playerPrefab } from './common/prefabs/player.prefab';
import { Serializer } from './common/serialize';
import { wallPrefab } from './common/prefabs/wall.prefab';
import { sprites } from './sprites';
import { Animator, Player } from './common/components';
import { MobInputEvent } from './common/communicators';
import { doorPrefab } from './common/prefabs/door.prefab';
import { aiPrefab } from './common/prefabs/ai.prefab';

const cors = require('cors');

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

enum Layer {
    WALLS = 0,
    PLAYERS = 1
};
const layers: number[] = Object.values(Layer).filter(v => typeof v === 'number') as any;

const wall1 = wallPrefab(new Rectangle(100, 400, 500, 50));
const wall2 = wallPrefab(new Rectangle(50, 300, 50, 150));
const wall3 = wallPrefab(new Rectangle(600, 260, 50, 190));
const wall4 = wallPrefab(new Rectangle(50, 100, 600, 50));
const wall5 = wallPrefab(new Rectangle(150, 200, 50, 150));
const wall6 = wallPrefab(new Rectangle(650, 100, 50, 150));

const door = doorPrefab(new Rectangle(650, 250, 20, 50), new Vector(650, 300));

const gameObjects: GameObject[] = [
    wall1,
    wall2,
    wall3,
    wall4,
    wall5,
    wall6,
    door,
];

const game = new Game(layers);

game.setCollisionPair(Layer.WALLS, Layer.PLAYERS, true);

gameObjects.forEach(go => game.addGameObject(go));

game.applyState({
    cameraOn: new Vector(),
    timestamp: Date.now(),
    gameObjects,
    collisionMatrix: game.collisionMatrix
});

const createPlayer = () => {
    const player = playerPrefab();
    game.addGameObject(player);
    players.push(player);
    if (players.length % 2 === 0) {
        player.getComponent(Animator).animationMap = {
            'idle': [
                { sprite: { name: 'Skitty_idle_1' }, duration: 500 },
                { sprite: { name: 'Skitty_idle_2' }, duration: 250 },
            ],
            'moving': [
                { sprite: { name: 'Skitty_moving_1' }, duration: 100 },
                { sprite: { name: 'Skitty_moving_2' }, duration: 75 },
                { sprite: { name: 'Skitty_moving_2' }, duration: 25 },
                { sprite: { name: 'Skitty_moving_4' }, duration: 100 },
            ]
        }
    }
    const ai = aiPrefab(player);
    game.addGameObject(ai);
    ais.push(ai);
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
const ais: GameObject[] = [];

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
        const ai = ais.splice(connectionId, 1)[0];
        game.gameObjects.splice(game.gameObjects.indexOf(ai), 1);
        res.end();
    });
});

app.post('/mob-input-event', (req, res) => {
    lagSimulator(() => {
        const event: MobInputEvent = req.body;
        const player = GameObject.getById(event.objectId)?.getComponent(Player);
        if (player) {
            player.mobInputEvents.push(event);
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
