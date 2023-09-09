import { Component } from "../component";
import { Vector } from "../engine";
import { Serializer } from "../serialize";
import { Collider, Collision } from "./collider";
import { Mob } from "./mob";
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

    mobsNear: Mob[] = [];

    start() {
        this.rigidbody = this.getComponent(Rigidbody);
        if (!this.closedPosition) {
            this.closedPosition = new Vector(this.transform.position);
        }
    }

    update() {        
        if (this.mobsNear.length > 0) {
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
        this.mobsNear = [];
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
            const mob = collision.otherCollider.gameObject.getComponent(Mob);
            if (mob && !this.mobsNear.includes(mob)) {
                this.mobsNear.push(mob);
            }
        }
    }

    onTriggerLeave(collision: Collision) {
        if (!collision.otherCollider.isTrigger) {
            const mob = collision.otherCollider.gameObject.getComponent(Mob);
            if (mob && this.mobsNear.includes(mob)) {
                this.mobsNear.splice(this.mobsNear.indexOf(mob), 1);
                if (this.mobsNear.length === 0 && this.currentState === DoorState.open) {
                    this.currentState = DoorState.closing;
                }
            }
        }
    }
}

Serializer.deserializers['Door'] = Component.deserialize(Door);
