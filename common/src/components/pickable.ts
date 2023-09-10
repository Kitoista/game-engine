import { GameEvent } from "../communicators";
import { Component } from "../component";
import { Vector } from "../engine";
import { GameObject } from "../game-object";
import { Serializer } from "../serialize";
import { Bed } from "./bed";
import { Interactable } from "./interactable";
import { Nurse } from "./nurse";
import { Prankster } from "./prankster";
import { Rigidbody } from "./rigidbody";
import { SpriteRenderer } from "./sprite-renderer";

export class Pickable extends Interactable {
    type = 'Pickable';

    owner: GameObject | null = null;

    private originalYOffset = 0;
    pickedRenderPriority = 0;
    spriteRenderer!: SpriteRenderer;

    override start() {
        this.spriteRenderer = this.getComponent(SpriteRenderer);
        this.originalYOffset = this.spriteRenderer.yOffset;
    }

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
                this.spriteRenderer.yOffset = this.originalYOffset;
            }
            if (gameEvent.status) {
                this.spriteRenderer.yOffset = this.pickedRenderPriority;
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
            this.transform.position = Vector.subtract(this.owner!.transform.middle, Vector.scale(this.transform.dimension, 0.5));
            // this.transform.position = this.owner!.transform.middle;
        }
    }

    override canInteract(go: GameObject): boolean {
        const owner = go.getComponent(Pickable)?.owner;
        return (!owner || owner.getComponent(Bed)) && 
            (!this.getComponent(Prankster) || go.getComponent(Nurse) || go.getComponent(Bed)) &&
            !this.getComponent(Nurse);
    }
}

Serializer.deserializers['Pickable'] = Component.deserialize(Pickable);
