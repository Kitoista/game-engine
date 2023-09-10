import { ClientCommunicator, GameEvent, GameEventType, MovementEventType, interactionEventTypes, movementEventTypes } from "../communicators";
import { Component } from "../component";
import { Vector } from "../engine";
import { Game } from "../game";
import { GameObject } from "../game-object";
import { Serializer } from "../serialize";
import { Animator } from "./animator";
import { Collider } from "./collider";
import { Interactable } from "./interactable";
import { Pickable } from "./pickable";
import { Rigidbody } from "./rigidbody";
import { SpriteRenderer } from "./sprite-renderer";

export class Mob extends Component {
    type = 'Mob';

    rigidbody!: Rigidbody;
    spriteRenderer!: SpriteRenderer;
    animator!: Animator;
    collider!: Collider;

    speedX = 5;
    speedY = 3;
    visionRange = 300;
    interactionRange = 50;

    gameEvents: GameEvent[] = [];
    faceDirection = new Vector(1, 0);

    get currentInteractionEvent(): GameEvent | null {
        return this.gameEvents.find((event, i) => {
            return event.status && // event is active
                event.objectId === this.gameObject.id &&
                interactionEventTypes.includes(event.eventName) && // it's an interaction
                this.gameEvents.filter(otherEvent => { // all the other events that's
                    return otherEvent.eventName === event.eventName &&  // the same type and deactivate and is mine
                        !otherEvent.status &&
                        event.objectId === this.gameObject.id;
                }).every((otherEvent, j) => {
                    return  j < i; // needs to be sooner in the list
                });
        }) ?? null;
    }

    get heldObject(): GameObject | null {
        return GameObject.getById(this.currentInteractionEvent?.data?.otherObjectId);
    }

    get closestInteractable(): GameObject | null {
        const re = Game.instance.gameObjects.filter(go => {
            const interactable = go.getComponent(Interactable);
            return go !== this.gameObject && interactable && interactable.canInteract(this.gameObject);
        }).map(obj => {
            const collider = obj.getComponent(Collider);
            let preferredBounds = obj.transform;
            if (collider) {
                preferredBounds = collider.worldBounds;
            }
            return {
                obj,
                distance: Vector.subtract(preferredBounds.middle, this.collider.worldBounds.middle).magnitude
            }
        });
        re.sort((a, b) => a.distance - b.distance);
        return re.find(combo => combo.distance < this.interactionRange)?.obj ?? null;
    }

    override start() {
        this.rigidbody = this.getComponent(Rigidbody);
        this.spriteRenderer = this.getComponent(SpriteRenderer);
        this.animator = this.getComponent(Animator);
        this.collider = this.getComponent(Collider);
    }

    override update() {
        this.cleanEvents();
        this.gameEvents.forEach(event => {
            this.handleGameEvent(event);
        });
        this.spriteRenderer.flipX = this.faceDirection.x < 0;
        this.animator.name = this.rigidbody.velocity.magnitude === 0 ? 'idle' : 'moving';
    }

    onGameEvent(gameEvent: GameEvent) {
        this.gameEvents.push(gameEvent);
    }

    handleGameEvent(event: GameEvent) {
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
            // case 'grab':
            //     console.log(event)
        }
    }

    cleanEvents() {
        const inputs: GameEvent[] = [];
        for (let i = 0; i < this.gameEvents.length; ++i) {
            const event = this.gameEvents[i];
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
        this.gameEvents = inputs;
    }

    turnOffEvents(types: GameEventType[]) {
        const toTurnOff = this.gameEvents.filter(event => event.status && types.includes(event.eventName));
        toTurnOff.forEach(event => this.sendEvent({
            ...event,
            status: false
        }));
    }

    turnOffEvent(event: GameEvent) {
        this.sendEvent({
            ...event,
            status: false
        });
    }

    movement(direction: MovementEventType, status: boolean) {
        this.sendEvent({
            eventName: direction,
            objectId: this.gameObject.id,
            status,
        });
    }

    drop() {
        const currentInteractionEvent = this.currentInteractionEvent;
        if (currentInteractionEvent && currentInteractionEvent.eventName === 'grab') {
            this.turnOffEvent(currentInteractionEvent);
        }
    }

    applyEvent(gameEvent: GameEvent) {
        this.gameObject.sendMessage('onGameEvent', gameEvent);
        if (gameEvent.data?.otherObjectId) {
            const otherObject = GameObject.getById(gameEvent.data.otherObjectId);
            if (otherObject) {
                otherObject.sendMessage('onGameEvent', gameEvent);
            }
        }
    }

    sendEvent(gameEvent: GameEvent) {
        if (Game.isServer) {
            this.applyEvent(gameEvent);
        } else {
            ClientCommunicator.instance.sendGameEvent(gameEvent).subscribe(res => {
                if (res.status === "pingDelay") {
                    this.applyEvent(gameEvent);
                }
            });
        }
    }

    interactWithClosest(status: boolean) {
        let closest: GameObject | null = null;
        if (status) {
            closest = this.closestInteractable;
        }
        this.interactWith(status, closest);
    }

    interactWith(status: boolean, other: GameObject | null) {
        const currentInteractionEvent = this.currentInteractionEvent;

        if (currentInteractionEvent) {
            this.turnOffEvent(currentInteractionEvent);
        }
        
        if (status && other) {
            const interactable = other.getComponent(Interactable)!;
            if (interactable instanceof Pickable) {
                this.sendEvent({
                    eventName: 'grab',
                    objectId: this.gameObject.id,
                    status,
                    data: {
                        otherObjectId: other.id
                    }
                });
            }
        }
    }
}

Serializer.deserializers['Mob'] = Component.deserialize(Mob);
