import { Component } from "../component";
import type { GameObject } from "../game-object";
import { Rectangle, Vector } from "../engine";
import { Serializer } from "../serialize";
import { Game } from "../game";

export interface Collision {
    collider: Collider;
    otherCollider: Collider;
}

export class Collider extends Component {
    type = 'Collider';

    bounds: Rectangle;
    isTrigger: boolean = false;
    
    get worldBounds() {
        return Rectangle.offset(this.bounds, this.transform.position);
    }

    static get colliders(): Collider[] {
        return Game.instance.gameObjects
            .map(go => go.getComponent(Collider))
            .filter(collider => collider);
    }


    public constructor(gameObject: GameObject, id?: number) {
        super(gameObject, id);
        this.bounds = new Rectangle(new Vector(), this.transform.dimension);
    }

    static canCollideWith(collider: Collider): Collider[] {
        if (!collider) {
            return [];
        }
        return this.colliders.filter(other => {
            return collider.gameObject.id !== other.gameObject.id &&
                collider.isTrigger === other.isTrigger &&
                Game.instance.areLayersColliding(collider.gameObject.collisionLayer, other.gameObject.collisionLayer);
        });
    }

    static wouldCollideWithTheseHere(collider: Collider, others: Collider[], newTransform: Rectangle): Collider[] {
        if (!collider) {
            return [];
        }
        return others.filter(other => {
            const colliderWorldBounds = Rectangle.offset(collider.bounds, newTransform.position);
            return colliderWorldBounds.intersects(other.worldBounds);
        });
    }
}

Serializer.deserializers['Collider'] = Component.deserialize(Collider);
