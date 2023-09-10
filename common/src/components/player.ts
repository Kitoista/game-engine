import { BrowserEventHandler } from "../browser-event-handler";
import { ClientCommunicator, GameEvent, GameEventType, movementEventTypes } from "../communicators";
import { Component } from "../component";
import { Vector } from "../engine";
import { Game } from "../game";
import { GameObject } from "../game-object";
import { Serializer } from "../serialize";
import { Collider } from "./collider";
import { Mob } from "./mob";
import { Pickable } from "./pickable";
import { SpriteRenderer } from "./sprite-renderer";

export class Player extends Component {
    type = 'Player';

    movementKeyMap: { [key: string]: GameEventType } = {
        'a': 'left',
        'd': 'right',
        'w': 'up',
        's': 'down',
        ' ': 'grab'
    }

    grabDistance = 100;
    grabbedObjectId?: number;

    collider!: Collider;
    mob!: Mob;

    override start() {
        this.collider = this.getComponent(Collider);
        this.mob = this.getComponent(Mob);
    }

    onMouseEvent(mouseEvent: MouseEvent) {
        if (!Game.isServer && Game.instance.playerObject === this.gameObject) {
            if (mouseEvent.type !== 'mousemove') {
                const eventName: GameEventType = this.movementKeyMap['mouseButton' + mouseEvent.button];
                const status = mouseEvent.type === 'mousedown';
            }
        }
    }

    onKeyboardEvent(keyEvent: KeyboardEvent) {
        if (!Game.isServer && Game.instance.playerObject === this.gameObject) {
            const eventName: GameEventType = this.movementKeyMap[keyEvent.key];
            const status = keyEvent.type === 'keydown';
            if (eventName) {
                if (movementEventTypes.includes(eventName)) {
                    this.mob.movement(eventName, status);
                } else if (eventName === 'grab') {
                    this.mob.interactWithClosest(status);
                }
            }
        }
    }
}

Serializer.deserializers['Player'] = Component.deserialize(Player);
