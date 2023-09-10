import { Component } from "../component";
import { Rectangle, Vector } from "../engine";
import { Game } from "../game";
import { Serializer } from "../serialize";
import { Collider } from "./collider";

export class Rigidbody extends Component {
    type = 'Rigidbody';

    gravity = false;
    velocity = new Vector();

    freezeX = false;
    freezeY = false;

    setFreeze(value: boolean) {
        this.freezeX = value;
        this.freezeY = value;
    }

    override update() {
        const gameObject = this.gameObject;
        const colliders = gameObject.getComponents(Collider);
        const others = Collider.canCollideWith(colliders[0]);
        if (this.freezeX) {
            this.velocity.x = 0;
        }
        if (this.freezeY) {
            this.velocity.y = 0;
        }
        if ((this.velocity.x === 0 && this.velocity.y === 0)) {
            colliders.forEach(collider => {
                const wouldCollideWith = Collider.wouldCollideWithTheseHere(collider, others, collider.transform);
                wouldCollideWith.forEach(other => Collider.addCollision(collider, other));
            });
            this.applyGravity();
            return;
        }

        const newTransform = new Rectangle(this.transform);
        const velocity = Vector.scale(this.velocity, 1);

        let resetX = false;
        let resetY = false;

        for (let i = 0; i < Math.abs(velocity.x); ++i) {
            newTransform.position.x += Math.sign(velocity.x);

            colliders.forEach(collider => {
                const wouldCollideWith = Collider.wouldCollideWithTheseHere(collider, others, newTransform);
    
                wouldCollideWith.forEach(other => Collider.addCollision(collider, other));
                if (!collider.isTrigger && wouldCollideWith.some(other => !other.isTrigger)) {
                    resetX = true;
                }
            });
            if (resetX) {
                newTransform.position.x -= Math.sign(velocity.x);
            }
        }
        for (let i = 0; i < Math.abs(velocity.y); ++i) {
            newTransform.position.y += Math.sign(velocity.y);

            colliders.forEach(collider => {
                const wouldCollideWith = Collider.wouldCollideWithTheseHere(collider, others, newTransform);

                wouldCollideWith.forEach(other => Collider.addCollision(collider, other));
                if (!collider.isTrigger && wouldCollideWith.some(other => !other.isTrigger)) {
                    resetY = true;
                }
            });
            if (resetY) {
                newTransform.position.y -= Math.sign(velocity.y);
            }
        }
        gameObject.transform = newTransform;

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
