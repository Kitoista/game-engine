import { ClientCommunicator, MobInputEvent, MobInputEventType } from "../communicators";
import { Component } from "../component";
import { Vector } from "../engine";
import { Game } from "../game";
import { GameObject } from "../game-object";
import { Serializer } from "../serialize";
import { Mob } from "./mob";

export class Ai extends Mob {
    type = 'Ai';

    target!: GameObject;
    followDistance = 50;

    movementEventTypes: MobInputEventType[] = ['left', 'right', 'up', 'down'];

    override update() {
        if (Game.isServer) {
            const diff = Vector.subtract(this.target.transform.position, this.transform.position);
            this.movementEventTypes.forEach(eventName => {
                if (this.hasMobInputEvent(eventName, true)) {
                    this.mobInputEvents.push(new MobInputEvent(eventName, false, this.gameObject.id));
                }
            });
            if (diff.magnitude > this.followDistance) {
                this.makeMobInputEvents(diff);
            }
        }
        super.update();
    }

    makeMobInputEvents(diff: Vector) {
        if (Math.abs(diff.x) > 5) {
            const eventName = diff.x < 0 ? 'left' : 'right';
            this.mobInputEvents.push(new MobInputEvent(eventName, true, this.gameObject.id));
            // if (!this.hasMobInputEvent(eventName, true)) {
            // }
        }
        if (Math.abs(diff.y) > 5) {
            const eventName = diff.y < 0 ? 'up' : 'down';
            this.mobInputEvents.push(new MobInputEvent(eventName, true, this.gameObject.id));
            // if (!this.hasMobInputEvent(eventName, true)) {
            // }
        }
    }

    hasMobInputEvent(eventName: MobInputEventType, status: boolean): boolean {
        return this.mobInputEvents.some(event => event.eventName === eventName && event.status === status);
    }

}

Serializer.deserializers['Ai'] = Component.deserialize(Ai);
