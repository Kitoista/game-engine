import { Rectangle } from "./engine";
import { GameObject } from "./game-object";
import { Serializable, Serializer } from "./serialize";

export abstract class Component implements Serializable  {
    abstract type: string;

    /** This only has an effect on the server */
    static _nextId = 0;

    static components: Component[] = [];
    id!: number;

    get transform(): Rectangle {
        return this.gameObject.transform;
    }

    public constructor(public gameObject: GameObject, id?: number) {
        if (id) {
            this.id = id;
            if (id > Component._nextId) {
                Component._nextId = id;
            }
        } else {
            this.id = ++Component._nextId;
        }
        Component.components.push(this);
    }

    start() {
    }

    update() {
    }

    getComponent<T extends Component>(constr: new (...agrs: any[]) => T): T {
        return this.gameObject.getComponent(constr);
    }

    getComponents<T extends Component>(constr: new (...agrs: any[]) => T): T[] {
        return this.gameObject.getComponents(constr);
    }

    serialize(): any {
        const re: any = {};
        Object.entries(this).forEach(([key, value]) => {
            if (typeof value === 'object' && value instanceof GameObject) {
                re[key] = value.semiSerialize();
            } else {
                re[key] = Serializer.serialize(value);
            }
        });
        return re;
    }
    public static deserialize(type: new (gameObject: GameObject, id: number) => Component): (value: any) => Component {
        return (value) => {
            if (value instanceof Component) {
                return value;
            }
            const gameObject = Serializer.deserialize(value.gameObject);

            let component = Component.components.find(go => go.id === value.id);
            if (!component) {
                component = new type(gameObject, value.id);
            }
            Object.keys(value).forEach(key => {
                if (value[key] !== undefined) {
                    (component as any)[key] = Serializer.deserialize(value[key]);
                }
            });
            return component;
        }
    }

    static beforeUpdate() {}
    static afterUpdate() {}
}
