import { MobInputEvent } from "../communicators";
import { Component } from "../component";
import { Vector } from "../engine";
import { Serializer } from "../serialize";
import { Animator } from "./animator";
import { Rigidbody } from "./rigidbody";
import { SpriteRenderer } from "./sprite-renderer";

export class Mob extends Component {
    type = 'Mob';

    faceDirection = new Vector(1, 0);
    mobInputEvents: MobInputEvent[] = [];

    speedX = 5;
    speedY = 3;
    visionRange = 300;

    rigidbody!: Rigidbody;
    spriteRenderer!: SpriteRenderer;
    animator!: Animator;

    start() {
        this.rigidbody = this.getComponent(Rigidbody);
        this.spriteRenderer = this.getComponent(SpriteRenderer);
        this.animator = this.getComponent(Animator);
    }

    override update() {
        const inputs: MobInputEvent[] = [];
        for (let i = 0; i < this.mobInputEvents.length; ++i) {
            const event = this.mobInputEvents[i];
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
        inputs.forEach(event => {
            this.handleMobInputEvent(event);
        });
        this.mobInputEvents = inputs;
        this.spriteRenderer.flipX = this.faceDirection.x < 0;
        this.animator.name = this.rigidbody.velocity.magnitude === 0 ? 'idle' : 'moving';
    }

    handleMobInputEvent(event: MobInputEvent) {
        switch (event.eventName) {
            case 'left':
                this.rigidbody.velocity.x = Math.max(-this.speedX, this.rigidbody.velocity.x - this.speedX);
                this.faceDirection.x = -1;
                break;
            case 'right':
                this.rigidbody.velocity.x = Math.min(this.speedX, this.rigidbody.velocity.x + this.speedX);
                this.faceDirection.x = 1;
                break;
            case 'up':
                this.rigidbody.velocity.y = Math.max(-this.speedY, this.rigidbody.velocity.y - this.speedY);
                this.faceDirection.y = -1;
                break;
            case 'down':
                this.rigidbody.velocity.y = Math.min(this.speedY, this.rigidbody.velocity.y + this.speedY);
                this.faceDirection.y = -1;
                break;
        }
    }
}

Serializer.deserializers['Mob'] = Component.deserialize(Mob);
