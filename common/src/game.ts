import { Vector } from "./engine";
import { GameObject } from "./game-object";
import { Serializable, Serializer } from "./serialize";
import * as components from './components';

components;

export interface CollisionMatrix {
    [layerA: number]: {
        [layerB: number]: boolean
    }
}

export interface GameState {
    timestamp: number;
    gameObjects: GameObject[];
    collisionMatrix: CollisionMatrix;
    /** gameObject id or Vector */
    cameraOn: number | Vector;
}

export interface GameMessage extends Serializable {
    state: GameState;
}

export class Game {
    static isServer = true;

    static baseTickRate = 10;
    static refreshRate = 30;
    static smoothness = 1;
    static time = 0;

    static instance: Game;

    public gameObjects: GameObject[] = [];
    public newGameObjects: GameObject[] = [];
    
    static beforeUpdateFuncitons: (() => void)[] = [];
    static afterUpdateFuncitons: (() => void)[] = [];

    /** only exists on client */
    playerObject: GameObject | null = null;

    collisionMatrix: CollisionMatrix;
    gravity = 5;

    constructor(layers?: number[]) {
        Game.instance = this;
        this.collisionMatrix = {};
        if (layers) {
            layers.sort();
            layers.forEach((layerA, i) => {
                this.collisionMatrix[layerA] = {};
                for (let j = i; j < layers.length; ++j) {
                    const layerB = layers[j];
                    this.collisionMatrix[layerA][layerB] = false;
                }
            });
        }
    }

    applyState(stateJson: GameState) {
        const state: GameState = Serializer.deserialize(stateJson);
        Game.time = state.timestamp;

        state.gameObjects.forEach(go => {
            if (!this.gameObjects.includes(go)) {
                this.newGameObjects.push(go);
            }
        });

        Object.entries(state).forEach(([key, value]) => {
            if (value) {
                (this as any)[key] = value;
            }
        });

        if (!Game.isServer && typeof state.cameraOn === 'number') {
            this.playerObject = GameObject.getById(state.cameraOn);
        }
    }

    setCollisionPair(layerA: number, layerB: number, value: boolean) {
        const a = layerA < layerB ? layerA : layerB;
        const b = layerA < layerB ? layerB : layerA;
        this.collisionMatrix[a][b] = value;
    }

    tick() {
        this.newGameObjects.forEach(go => go.start());
        this.newGameObjects = [];
        Object.values(components).forEach((component: any) => component.beforeUpdate ? component.beforeUpdate() : null);
        this.gameObjects.forEach(go => go.update());
        Object.values(components).forEach((component: any) => component.beforeUpdate ? component.afterUpdate() : null);
    }

    areLayersColliding(layerA: number, layerB: number): boolean {
        if (layerA === -1 || layerB === -1) {
            return false;
        }
        const a = layerA < layerB ? layerA : layerB;
        const b = layerA < layerB ? layerB : layerA;
        return this.collisionMatrix?.[a]?.[b];
    }

    addGameObject(go: GameObject): void {
        this.gameObjects.push(go);
        this.newGameObjects.push(go);
    }
}
