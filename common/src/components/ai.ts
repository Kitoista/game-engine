import { GameEventType, movementEventTypes } from "../communicators";
import { Component } from "../component";
import { Vector } from "../engine";
import { Game } from "../game";
import { GameObject } from "../game-object";
import { Serializer } from "../serialize";
import { Mob } from "./mob";

export class Ai extends Component {
    type = 'Ai';

    target?: GameObject;
    followDistance = 50;

    mob!: Mob;
    randomPosition = new Vector();
    walksThereUntil = 0;

    duration = 2000;

    override start() {
        this.mob = this.getComponent(Mob);
    }

    override update() {
        if (Game.isServer) {
            this.mob.turnOffEvents(movementEventTypes);
            
            let diff: Vector;
            if (this.target) {
                diff = Vector.subtract(this.target.transform.position, this.transform.position);
            } else {
                if (Game.time > this.walksThereUntil) {
                    this.walksThereUntil = Game.time + this.duration * (Math.random() * 3 / 4 + 0.25);
                    this.randomPosition = new Vector(
                        (Math.random() * 2 - 1) * 1000,
                        (Math.random() * 2 - 1) * 1000,
                    ).add(this.transform.position);
                }
                diff = Vector.subtract(this.randomPosition, this.transform.position);
            }
            if (diff.magnitude > this.followDistance) {
                this.makeGameEvents(diff);
            }
        }
    }

    makeGameEvents(diff: Vector) {
        if (Math.abs(diff.x) > 5) {
            const eventName = diff.x < 0 ? 'left' : 'right';
            this.mob.movement(eventName, true);
        }
        if (Math.abs(diff.y) > 5) {
            const eventName = diff.y < 0 ? 'up' : 'down';
            this.mob.movement(eventName, true);
        }
    }

    hasGameEvent(eventName: GameEventType, status: boolean): boolean {
        return this.mob.gameEvents.some(event => event.eventName === eventName && event.status === status);
    }

}

Serializer.deserializers['Ai'] = Component.deserialize(Ai);
