import { Component } from "../component";
import { Vector } from "../engine";
import { Serializer } from "../serialize";
import { Collider, Collision } from "./collider";
import { Player } from "./player";
import { Rigidbody } from "./rigidbody";

export enum DoorState {
    open, closing, closed, opening
}

export class Door extends Component {
    type = 'Door';

    currentState = DoorState.closed;

    closedPosition!: Vector;
    openedPosition = new Vector();

    maxSpeed = 5;

    rigidbody!: Rigidbody;

    playersNear: Player[] = [];

    start() {
        this.rigidbody = this.getComponent(Rigidbody);
        if (!this.closedPosition) {
            this.closedPosition = new Vector(this.transform.position);
        }
    }

    update() {        
        if (this.playersNear.length > 0) {
            if (this.currentState === DoorState.closed) {
                this.currentState = DoorState.opening;
            }
        } else {
            if (this.currentState === DoorState.open) {
                this.currentState = DoorState.closing;
            }
        }

        if (this.currentState === DoorState.opening || this.currentState === DoorState.closing) {
            const endpos = this.currentState === DoorState.opening ? this.openedPosition : this.closedPosition;
            const vector = Vector.subtract(endpos, this.transform.position);
            if (vector.magnitude > this.maxSpeed) {
                vector.normalize().scale(this.maxSpeed);
            }
            if (vector.magnitude === 0) {
                this.currentState = this.currentState === DoorState.opening ? DoorState.open : DoorState.closed;
            }
            
            this.rigidbody.velocity = vector;
        }
        this.playersNear = [];
    }

    toggle() {
        if (this.currentState === DoorState.closed) {
            this.currentState = DoorState.opening;
        } else if (this.currentState === DoorState.open) {
            this.currentState = DoorState.closing;
        }
    }

    onTrigger(collision: Collision) {
        if (!collision.otherCollider.isTrigger) {
            const player = collision.otherCollider.gameObject.getComponent(Player);
            if (player && !this.playersNear.includes(player)) {
                this.playersNear.push(player);
            }
        }
    }

    onTriggerLeave(collision: Collision) {
        if (!collision.otherCollider.isTrigger) {
            const player = collision.otherCollider.gameObject.getComponent(Player);
            if (player && this.playersNear.includes(player)) {
                this.playersNear.splice(this.playersNear.indexOf(player), 1);
                if (this.playersNear.length === 0 && this.currentState === DoorState.open) {
                    this.currentState = DoorState.closing;
                }
            }
        }
    }
}

Serializer.deserializers['Door'] = Component.deserialize(Door);
