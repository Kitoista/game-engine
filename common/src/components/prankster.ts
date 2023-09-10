import { Component } from "../component";
import { Game } from "../game";
import { GameObject } from "../game-object";
import { Serializer } from "../serialize";
import { Consumable } from "./consumable";
import { Mob } from "./mob";
import { Pickable } from "./pickable";
import { Rigidbody } from "./rigidbody";

export class Prankster extends Component {
    type = 'Prankster';

    rigidbody!: Rigidbody;
    mob!: Mob;
    
    consumptionMultiplier = 1;
    consumable: Consumable | null = null;

    override start() {
        this.rigidbody = this.getComponent(Rigidbody);
        this.mob = this.getComponent(Mob);
    }

    onPick(obj: GameObject) {
        const consumable = obj.getComponent(Consumable);
        if (consumable) {
            this.consumable;
        }
    }

    onDrop(obj: GameObject) {
        this.consumable = null;
    }

    onPickedBy(obj: GameObject) {
        if (Game.isServer) {
            this.mob.drop();
            // const pickable = this.consumable.getComponent(Pickable);
            // pickable.onGameEvent({
            //     eventName: 'grab',
            //     objectId: this.gameObject.id,
            //     status: false,
            //     data: {
            //         otherObjectId: pickable.gameObject.id
            //     }
            // });
        }
    }

    canConsume() {
        return this.rigidbody.velocity.x === 0 && this.rigidbody.velocity.y === 0;
    }

}

Serializer.deserializers['Prankster'] = Component.deserialize(Prankster);
