import { ClientCommunicator, PlayerInputEvent, PlayerInputEventType } from "../communicators";
import { Component } from "../component";
import { Vector } from "../engine";
import { Game } from "../game";
import { Serializer } from "../serialize";
import { Rigidbody } from "./rigidbody";

export class Player extends Component {
    type = 'Player';

    keyMap: { [key: string]: PlayerInputEventType } = {
        'a': 'left',
        'd': 'right',
        'w': 'up',
        's': 'down'
    }

    faceDirection = new Vector();
    playerInputEvents: PlayerInputEvent[] = [];

    get rigidbody(): Rigidbody {
        return this.gameObject.getComponent(Rigidbody);
    }

    override start() {
    }

    override update() {
        const inputs: PlayerInputEvent[] = [];
        for (let i = 0; i < this.playerInputEvents.length; ++i) {
            const event = this.playerInputEvents[i];
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
            this.handlePlayerInputEvent(event);
        });
    }


    handlePlayerInputEvent(event: PlayerInputEvent) {
        switch (event.eventName) {
            case 'left': this.rigidbody.velocity.x = Math.max(-5 / Game.smoothness, this.rigidbody.velocity.x - 5 / Game.smoothness); break;
            case 'right': this.rigidbody.velocity.x = Math.min(5 / Game.smoothness, this.rigidbody.velocity.x + 5 / Game.smoothness); break;
            case 'up': this.rigidbody.velocity.y = Math.max(-5 / Game.smoothness, this.rigidbody.velocity.y - 5 / Game.smoothness); break;
            case 'down': this.rigidbody.velocity.y = Math.min(5 / Game.smoothness, this.rigidbody.velocity.y + 5 / Game.smoothness); break;
        }
    }

    onKeyboardEvent(keyEvent: KeyboardEvent) {
        if (!Game.isServer && Game.instance.playerObject === this.gameObject) {
            const eventType: PlayerInputEventType = this.keyMap[keyEvent.key];
            if (eventType) {
                const playerInputEvent = new PlayerInputEvent(eventType, keyEvent.type === 'keydown', this.gameObject.id);
                ClientCommunicator.instance.sendPlayerInputEvent(playerInputEvent).subscribe(res => {
                    if (res.status === "pingDelay") {
                        this.playerInputEvents.push(playerInputEvent);
                    }
                });
            }
        }
    }
}

Serializer.deserializers['Player'] = Component.deserialize(Player);
