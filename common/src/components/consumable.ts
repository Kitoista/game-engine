import { Component } from "../component";
import { Game } from "../game";
import { GameObject } from "../game-object";
import { Serializer } from "../serialize";
import { Animator } from "./animator";
import { Prankster } from "./prankster";

export class Consumable extends Component {
    type = 'Consumable';

    animator!: Animator;
    consumeDuration = 3000;

    consumeProgress = 0;

    consumer: Prankster | null = null;

    override start() {
        this.animator = this.getComponent(Animator);
    }

    override update() {
        if (!Game.isServer) {
            return;
        }
        if (this.consumer && this.consumer.canConsume()) {
            this.consumeProgress += Game.timeDiff / this.consumeDuration * this.consumer.consumptionMultiplier;
            if (this.consumeProgress >= 1) {
                this.consumed();
            }
        }
    }

    onPickedBy(obj: GameObject) {
        if (!Game.isServer) {
            return;
        }
        if (this.consumeProgress >= 1) {
            return;
        }
        const prankster = obj.getComponent(Prankster);
        if (!prankster) {
            return;
        }
        this.consumer = prankster;
    }
    
    onDroppedBy() {
        if (!Game.isServer) {
            return;
        }
        this.consumeProgress = 0;
        this.consumer = null;
    }

    consumed() {
        this.animator.name = 'empty';
    }
}

Serializer.deserializers['Consumable'] = Component.deserialize(Consumable);
