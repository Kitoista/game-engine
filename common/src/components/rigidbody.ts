import { Component } from "../component";
import { Rectangle, Vector } from "../engine";
import { Game } from "../game";
import { Serializer } from "../serialize";
import { Collider, Collision } from "./collider";

export class Rigidbody extends Component {
    type = 'Rigidbody';

    gravity = false;
    velocity = new Vector();

    override update() {
        if ((this.velocity.x === 0 && this.velocity.y === 0)) {
            this.applyGravity();
            return;
        }
        const gameObject = this.gameObject;
        const collider = gameObject.getComponent(Collider);
        const others = Collider.canCollideWith(collider);
        const isSolid = collider && !collider.isTrigger;

        const newTransform = new Rectangle(this.transform);
        const velocity = Vector.scale(this.velocity, 1);

        const collidedWith: Collider[] = [];
        let resetX = false;
        let resetY = false;

        for (let i = 0; i < Math.abs(velocity.x); ++i) {
            newTransform.position.x += Math.sign(velocity.x);
            const wouldCollideWith = Collider.wouldCollideWithTheseHere(collider, others, newTransform);
            wouldCollideWith.forEach(other => {
                if (!collidedWith.includes(other)) {
                    collidedWith.push(other);
                }
            });
            if (isSolid && wouldCollideWith.length > 0) {
                newTransform.position.x -= Math.sign(velocity.x);
                resetX = true;
                break;
            }
        }
        for (let j = 0; j < Math.abs(velocity.y); ++j) {
            newTransform.position.y += Math.sign(velocity.y);
            const wouldCollideWith = Collider.wouldCollideWithTheseHere(collider, others, newTransform);
            wouldCollideWith.forEach(other => {
                if (!collidedWith.includes(other)) {
                    collidedWith.push(other);
                }
            });
            if (isSolid && wouldCollideWith.length > 0) {
                newTransform.position.y -= Math.sign(velocity.y);
                resetY = true;
                break;
            }
        }
        gameObject.transform = newTransform;

        if (collidedWith.length) {
            const collisions: Collision[] = collidedWith.map(otherCollider => ({ collider, otherCollider }));
            collisions.forEach(collision => {
                if (isSolid) {
                    gameObject.sendMessage('onCollision', collision);
                } else {
                    gameObject.sendMessage('onTrigger', collision);
                }
            });
        }

        if (resetX) {
            velocity.x = 0;
        }
        if (resetY) {
            velocity.y = 0;
        }

        // gameObject.velocity = new Vector();

        this.velocity.x -= Math.sign(this.velocity.x) * Math.min(1, Math.abs(this.velocity.x)) / Game.smoothness;
        this.velocity.y -= Math.sign(this.velocity.y) * Math.min(1, Math.abs(this.velocity.y)) / Game.smoothness;

        if (Math.abs(this.velocity.x) < 0.1) {
            this.velocity.x = 0;
        }
        if (Math.abs(this.velocity.y) < 0.1) {
            this.velocity.y = 0;
        }
        this.applyGravity();
    }

    applyGravity(): void {
        if (this.gravity) {
            this.velocity.y += Game.instance.gravity;
        }
    }
}

Serializer.deserializers['Rigidbody'] = Component.deserialize(Rigidbody);
