import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { interval } from 'rxjs';
import { Game, GameMessage } from './common/game';
import { Rectangle, Vector } from './common/engine';
import { GameObject } from './common/game-object';
import { Serializer } from './common/serialize';
import { sprites } from './sprites';
import { Animator, Mob, Nurse, Pickable, Prankster } from './common/components';
import { GameEvent } from './common/communicators';
import { animations } from './animations';
import { aiPrefab, bedPrefab, doorPrefab, honey2Prefab, honey3Prefab, honeyPrefab, playerPrefab, wallPrefab } from './prefabs';

const cors = require('cors');

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

enum Layer {
    WALLS = 0,
    PLAYERS = 1
};
const layers: number[] = Object.values(Layer).filter(v => typeof v === 'number') as any;

const leader1 = aiPrefab();
const leader2 = aiPrefab(leader1);
const leader3 = aiPrefab(leader2);
const leader4 = aiPrefab(leader3);

const game = new Game(layers);
const mainThread = interval(Game.baseTickRate);
const eventStreams: Record<string, any>[] = [];
const players: GameObject[] = [];
const ais: GameObject[] = [];

const addFollower = false;

const gameObjects: GameObject[] = [
    wallPrefab(new Rectangle(100, 400, 500, 50)),
    wallPrefab(new Rectangle(50, 300, 50, 150)),
    wallPrefab(new Rectangle(600, 260, 50, 190)),
    wallPrefab(new Rectangle(50, 100, 600, 50)),
    wallPrefab(new Rectangle(150, 200, 50, 150)),
    wallPrefab(new Rectangle(650, 100, 50, 150)),

    wallPrefab(new Rectangle(0, 0, 1000, 50)),
    wallPrefab(new Rectangle(0, 0, 50, 1050)),
    wallPrefab(new Rectangle(950, 0, 50, 1050)),
    wallPrefab(new Rectangle(0, 1000, 1000, 50)),
    
    doorPrefab(new Rectangle(650, 250, 20, 50), new Vector(650, 300)),
    honeyPrefab(new Vector(300, 200)),
    honey2Prefab(new Vector(330, 200)),
    honey3Prefab(new Vector(340, 200)),
    bedPrefab(new Vector(500, 250)),
    leader1,
    leader2,
    leader3,
    leader4,
    aiPrefab(leader1),
    aiPrefab(leader2),
    aiPrefab(leader3),
    aiPrefab(leader4),
];


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
    const animator = player.getComponent(Animator);
    animator.animationMap = Object.values(animations)[players.length % Object.values(animations).length];
    if (animator.animationMap === animations.Chansey) {
        player.addComponent(Nurse);
    } else {
        player.addComponent(Prankster);
        const pickable = player.addComponent(Pickable);
        pickable.pickedRenderPriority = 5;
    }
    players.push(player);
    if (addFollower) {
        const ai = aiPrefab(player);
        game.addGameObject(ai);
        ais.push(ai);
    }
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


const broadcast = () => {
    eventStreams.forEach((eventStream, i) => {
        const gameState = createGameMessage(i);
        lagSimulator(() => {
            eventStream.write(`data: ${JSON.stringify(Serializer.serialize(gameState))}\n\n`);
        });
    });
}

const mainSub = mainThread.subscribe(i => {
    if (Game.time) {
        Game.timeDiff = Date.now() - Game.time;
    }
    Game.time = Date.now();
    game.tick();
    if (i % (Game.refreshRate / Game.baseTickRate) === 0) {
        broadcast();
    }
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
        if (addFollower) {
            const ai = ais.splice(connectionId, 1)[0];
            game.gameObjects.splice(game.gameObjects.indexOf(ai), 1);
        }
        res.end();
    });
});

app.post('/game-event', (req, res) => {
    lagSimulator(() => {
        const event: GameEvent = req.body;
        const go = GameObject.getById(event.objectId);
        const other = GameObject.getById(event.data?.otherObjectId);
        if (go) {
            go.sendMessage('onGameEvent', event);
        }
        if (other) {
            other.sendMessage('onGameEvent', event);
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
