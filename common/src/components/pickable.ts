import { GameEvent } from "../communicators";
import { Component } from "../component";
import { Vector } from "../engine";
import { GameObject } from "../game-object";
import { Serializer } from "../serialize";
import { Interactable } from "./interactable";
import { Rigidbody } from "./rigidbody";

export class Pickable extends Interactable {
    type = 'Pickable';

    owner: GameObject | null = null;

    offset = new Vector(0, 5);

    override update() {
        this.setPosition();
    }

    onGameEvent(gameEvent: GameEvent) {
        if (gameEvent.eventName === 'grab' && gameEvent.data?.otherObjectId === this.gameObject.id) {
            const rigidbody = this.getComponent(Rigidbody);
            if (rigidbody) {
                rigidbody.setFreeze(gameEvent.status);
            }
            if (!gameEvent.status && this.owner) {
                this.transform.position.subtract(this.offset);
            }
            const owner = GameObject.getById(gameEvent.objectId);
            if (owner) {
                if (gameEvent.status) {
                    if (this.owner) {
                        this.gameObject.sendMessage('onDroppedBy', this.owner);
                        this.owner.sendMessage('onDrop', this.gameObject);
                    }
                    this.gameObject.sendMessage('onPickedBy', owner);
                    owner.sendMessage('onPick', this.gameObject);
                } else {
                    this.gameObject.sendMessage('onDroppedBy', owner);
                    owner.sendMessage('onDrop', this.gameObject);
                }
            }
            this.owner = gameEvent.status ? owner : null;
        }
    }

    setPosition() {
        if (this.owner) {
            this.transform.position = Vector.subtract(this.owner!.transform.middle, Vector.scale(this.transform.dimension, 0.5)).add(this.offset);
        }
    }

    override canInteract(go: GameObject): boolean {
        return !go.getComponent(Pickable)?.owner;
    }
}

Serializer.deserializers['Pickable'] = Component.deserialize(Pickable);
