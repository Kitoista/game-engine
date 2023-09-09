import { Component } from "./component";
import { Serializable, Serializer } from "./serialize";
import { Rectangle } from "./engine";
import { Animator, Collider, Player, Rigidbody, SpriteRenderer } from "./components";
import { Door } from "./components/door";

export class GameObject implements Serializable {
    type = 'GameObject';

    /** This only has an effect on the server */
    static _nextId = 0;

    static gameObjects: GameObject[] = [];
    id!: number;

    transform = new Rectangle(0, 0, 30, 50);
    displayedLayer: number = 0;
    collisionLayer: number = -1;

    components: Component[] = [];

    /** without id it's on server */
    public constructor();
    /** with id it's on client */
    public constructor(id: number);
    public constructor(id?: number) {
        if (id) {
            this.id = id;
            if (id > GameObject._nextId) {
                GameObject._nextId = id;
            }
        } else {
            this.id = ++GameObject._nextId;
        }
        GameObject.gameObjects.push(this);
    }

    start() {
        this.components.forEach(component => component.start());
    }

    update() {
        this.components.forEach(component => component.update());
    }

    public static getById(id: number): GameObject | null {
        return this.gameObjects.find(go => go.id === id) ?? null;
    }

    public static deserialize(value: any) {
        if (value instanceof GameObject) {
            return value;
        }
        let gameObject = GameObject.gameObjects.find(go => go.id === value.id);
        if (!gameObject) {
            gameObject = new GameObject(value.id);
        }
        Object.keys(value).forEach(key => {
            if (value[key] !== undefined) {
                (gameObject as any)[key] = Serializer.deserialize(value[key])
            }
        });
        return gameObject;
    }

    semiSerialize(): any {
        return {
            type: this.type,
            id: this.id,
        };
    }

    addComponent<T extends Component>(componentOrConstructor: (new (gameObject: GameObject) => T) | T): T {
        let component: T;
        if (typeof componentOrConstructor === 'function') {
            component = new componentOrConstructor(this);
        } else {
            component = componentOrConstructor;
            componentOrConstructor.gameObject = this;
        }
        this.components.push(component);
        return component;
    }

    getComponent<T extends Component>(constr: new (...agrs: any[]) => T): T {
        const re = this.components.find(component => component instanceof constr);
        return re as T ?? null;
    }

    getComponents<T extends Component>(constr: new (...agrs: any[]) => T): T[] {
        const re = this.components.filter(component => component instanceof constr);
        return re as T[];
    }

    sendMessage(functionName: string, ...args: any[]) {
        this.components.forEach(component => {
            const func = (component as any)[functionName];
            if (typeof func === 'function') {
                func.bind(component)(...args);
            }
        });
    }
}

Serializer.deserializers['GameObject'] = GameObject.deserialize;
