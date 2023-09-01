import { Rectangle, Vector } from "./engine";

export class GameObject {
    /** This only has an effect on the server */
    static _nextId = 0;

    static gameObjects: GameObject[] = [];
    id!: number;

    transform = new Rectangle(0, 0, 30, 50);
    velocity = new Vector(0, 0);
    displayedLayer: number = 0;
    collisionLayers: number[] = [];

    gravity = false;
    solid = false;

    /** without id it's on server */
    public constructor();
    /** with id it's on client */
    public constructor(id: number);
    public constructor(id?: number) {
        if (id) {
            this.id = id;
        } else {
            this.id = ++GameObject._nextId;
        }
        GameObject.gameObjects.push(this);
    }

    public static from(value: any) {
        let gameObject = GameObject.gameObjects.find(go => go.id === value.id);
        if (!gameObject) {
            gameObject = new GameObject();
        }
        Object.keys(value).forEach(key => (gameObject as any)[key] = value[key]);
        gameObject.transform = new Rectangle(value.transform);
        return gameObject;
    }
}

export interface GameState {
    gameObjects: GameObject[];
    /** gameObject id or Vector */
    cameraOn: number | Vector;
    timestamp: number;
}

export class Game {
    static baseTickRate = 10;
    static refreshRate = 30;
    static smoothness = 1;
    public gameObjects: GameObject[] = [];
    get solidObjects(): GameObject[] {
        return this.gameObjects.filter(g => g.solid);
    }
    playerInputMap: { [id: number]: PlayerInputEvent[] } = {};

    constructor(gameObjects: GameObject[]);
    constructor(gameObjectsJson: string);
    constructor(arg: string | GameObject[]) {
        if (typeof arg === 'object') {
            this.gameObjects = arg;
        } else {
            this.gameObjects = JSON.parse(arg).map((gameObjectJson: any) => GameObject.from(gameObjectJson));
        }
    }

    initPlayers(ids: number[]) {
        ids.forEach(id => this.playerInputMap[id] = this.playerInputMap[id] ?? []);
    }

    handlePlayerInputEvents() {
        Object.keys(this.playerInputMap).forEach((id: any) => {
            const inputs: PlayerInputEvent[] = [];
            for (let i = 0; i < this.playerInputMap[id].length; ++i) {
                const event = this.playerInputMap[id][i];
                const existingOnEventIndex = inputs.findIndex(e => event.eventName === e.eventName && e.status);

                if (event.status) {
                    if (existingOnEventIndex === -1) {
                        inputs.push(event);
                    }
                } else {
                    if (existingOnEventIndex > -1) {
                        inputs.splice(existingOnEventIndex, 1)
                    }
                }
            }
            const playerObject = this.gameObjects.find(go => go.id == id)!;
            inputs.forEach(event => {
                this.handlePlayerInputEvent(playerObject, event);
            });
        });
    }

    handlePlayerInputEvent(go: GameObject, event: PlayerInputEvent) {
        if (!event.status) console.log(event);
        
        switch (event.eventName) {
            case 'left': go.velocity.x = Math.max(-5 / Game.smoothness, go.velocity.x - 5 / Game.smoothness); break;
            case 'right': go.velocity.x = Math.min(5 / Game.smoothness, go.velocity.x + 5 / Game.smoothness); break;
            case 'up': go.velocity.y = Math.max(-5 / Game.smoothness, go.velocity.y - 5 / Game.smoothness); break;
            case 'down': go.velocity.y = Math.min(5 / Game.smoothness, go.velocity.y + 5 / Game.smoothness); break;
        }
    }

    tick() {
        this.handlePlayerInputEvents();
        this.gameObjects.forEach(gameObject => {
            if ((gameObject.velocity.x === 0 && gameObject.velocity.y === 0)) {
                return;
            }
            const others = this.canCollideWith(gameObject);
            const newTransform = new Rectangle(gameObject.transform);
            const velocity = Vector.scale(gameObject.velocity, 1);
            for (let i = 0; i < Math.abs(velocity.x); ++i) {
                newTransform.position.x += Math.sign(velocity.x);
                if (!this.canMoveThere(others, newTransform)) {
                    newTransform.position.x -= Math.sign(velocity.x);
                    velocity.x = 0;
                    break;
                }
            }
            for (let j = 0; j < Math.abs(velocity.y); ++j) {
                const pre = new Vector(newTransform.position);
                newTransform.position.y += Math.sign(velocity.y);
                if (!this.canMoveThere(others, newTransform)) {
                    newTransform.position.y -= Math.sign(velocity.y);
                    velocity.y = 0;
                    break;
                }
            }
            gameObject.transform = newTransform;

            gameObject.velocity = new Vector();

            // gameObject.velocity.x -= Math.sign(gameObject.velocity.x) * Math.min(1, Math.abs(gameObject.velocity.x)) / Game.smoothness;
            // gameObject.velocity.y -= Math.sign(gameObject.velocity.y) * Math.min(1, Math.abs(gameObject.velocity.y)) / Game.smoothness;
            
            // if (Math.abs(gameObject.velocity.x) < 0.1) {
            //     gameObject.velocity.x = 0;
            // }
            // if (Math.abs(gameObject.velocity.y) < 0.1) {
            //     gameObject.velocity.y = 0;
            // }
        });
    }

    canCollideWith(obj: GameObject) {
        return this.gameObjects.filter(g => {
            return g.solid && g.id !== obj.id && obj.collisionLayers.findIndex(layer => g.collisionLayers.includes(layer)) !== -1;
        });
    }

    canMoveThere(others: GameObject[], newTransform: Rectangle): boolean {
        let re = true;
        others.forEach(other => {
            if (other.transform.intersects(newTransform)) {
                re = false;
                return;
            }
        });
        return re;
    }
}

export const playerInputEventTypes = [
    'left', 'right', 'up', 'down'
] as const;
export type PlayerInputEventType = typeof playerInputEventTypes[number];

export class PlayerInputEvent {
    type = 'PlayerInputEvent';
    
    public constructor(public eventName: PlayerInputEventType, public status: boolean, public objectId: number) {
    }
}
