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

    isStatic = false;
    
    get worldBounds() {
        return this.simulateColliderWorldBounds(this.transform.position)
    }

    private static collisionsInThisTick: Collision[] = [];

    private static collisions: Collision[] = [];

    static get colliders(): Collider[] {
        return Game.instance.gameObjects
            .map(go => [...go.getComponents(Collider)])
            .reduce((arr, value) => {
                arr.push(...value);
                return arr
            }, [])
            .filter(collider => collider);
    }

    public constructor(gameObject: GameObject, id?: number) {
        super(gameObject, id);
        this.bounds = new Rectangle(new Vector(), this.transform.dimension);
    }

    simulateColliderWorldBounds(position: Vector): Rectangle {
        if (this.isStatic) {
            return this.bounds;
        }
        return Rectangle.offset(this.bounds, position);

    }

    static canCollideWith(collider: Collider): Collider[] {
        if (!collider) {
            return [];
        }
        return this.colliders.filter(other => {
            return collider.gameObject.id !== other.gameObject.id &&
                // collider.isTrigger === other.isTrigger &&
                Game.instance.areLayersColliding(collider.gameObject.collisionLayer, other.gameObject.collisionLayer);
        });
    }

    static wouldCollideWithTheseHere(collider: Collider, others: Collider[], newTransform: Rectangle): Collider[] {
        if (!collider) {
            return [];
        }
        const colliderWorldBounds = collider.simulateColliderWorldBounds(newTransform.position);
        return others.filter(other => {
            return colliderWorldBounds.intersects(other.worldBounds);
        });
    }

    static addCollision(collider: Collider, otherCollider: Collider): void {
        const collision = { collider, otherCollider };
        if (this.collisionsInThisTick.every(co => !this.collisionEquals(collision, co))) {
            this.collisionsInThisTick.push({
                collider,
                otherCollider
            })
        }
    }

    static beforeUpdate() {
        this.collisionsInThisTick = [];
    }

    static afterUpdate() {
        const collisionEnters = this.collisionsInThisTick.filter(a => !this.collisions.some(b => this.collisionEquals(a, b)));
        const collisionContinues = this.collisionsInThisTick.filter(a => this.collisions.some(b => this.collisionEquals(a, b)));
        const collisionLeaves = this.collisions.filter(a => !this.collisionsInThisTick.some(b => this.collisionEquals(a, b)));
        this.collisions = this.collisionsInThisTick;

        this.sendCollisionMessages(collisionEnters, 'Enter');
        this.sendCollisionMessages(collisionContinues, '');
        this.sendCollisionMessages(collisionLeaves, 'Leave');
    }

    private static collisionEquals(a: Collision, b: Collision) {
        return (a.collider === b.collider && a.otherCollider === b.otherCollider) ||
                (a.otherCollider === b.collider && a.collider === b.otherCollider);
    }

    private static sendCollisionMessages(array: Collision[], postFix = '') {
        array.forEach(collision => {
            let message = 'onTrigger' + postFix;
            if (!collision.collider.isTrigger && !collision.otherCollider.isTrigger) {
                message = 'onCollision' + postFix;
            }
            collision.collider.gameObject.sendMessage(message, collision);
            collision.otherCollider.gameObject.sendMessage(message, { collider: collision.otherCollider, otherCollider: collision.collider });
        });
    }
}

Serializer.deserializers['Collider'] = Component.deserialize(Collider);
