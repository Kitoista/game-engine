import { ClientCommunicator, MobInputEvent, MobInputEventType } from "../communicators";
import { Component } from "../component";
import { Game } from "../game";
import { Serializer } from "../serialize";
import { Mob } from "./mob";

export class Player extends Mob {
    type = 'Player';

    keyMap: { [key: string]: MobInputEventType } = {
        'a': 'left',
        'd': 'right',
        'w': 'up',
        's': 'down'
    }

    onKeyboardEvent(keyEvent: KeyboardEvent) {
        if (!Game.isServer && Game.instance.playerObject === this.gameObject) {
            const eventType: MobInputEventType = this.keyMap[keyEvent.key];
            if (eventType) {
                const mobInputEvent = new MobInputEvent(eventType, keyEvent.type === 'keydown', this.gameObject.id);
                ClientCommunicator.instance.sendMobInputEvent(mobInputEvent).subscribe(res => {
                    if (res.status === "pingDelay") {
                        this.mobInputEvents.push(mobInputEvent);
                    }
                });
            }
        }
    }
}

Serializer.deserializers['Player'] = Component.deserialize(Player);
