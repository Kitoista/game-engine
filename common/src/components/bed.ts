import { Component } from "../component";
import { Vector } from "../engine";
import { Game } from "../game";
import { GameObject } from "../game-object";
import { Serializer } from "../serialize";
import { Mob } from "./mob";
import { Nurse } from "./nurse";
import { Pickable } from "./pickable";
import { Prankster } from "./prankster";

export class Bed extends Component {
    type = 'Bed';

    range = 50;

    override update() {
        if (Game.isServer) {
            const nearbyNurses = Game.instance.gameObjects.filter(go => {
                return go.getComponent(Nurse) && Vector.subtract(go.transform.middle, this.transform.middle).magnitude < this.range;
            });
            const nearbyPranksters = Game.instance.gameObjects.filter(go => {
                return go.getComponent(Prankster) && Vector.subtract(go.transform.middle, this.transform.middle).magnitude < this.range;
            });
    
            if (nearbyNurses.length > 0 && nearbyPranksters.length > 0 && !nearbyPranksters[0].getComponent(Pickable).owner) {
                nearbyPranksters[0].getComponent(Mob).sendEvent({
                    eventName: 'grab',
                    objectId: this.gameObject.id,
                    status: true,
                    data: {
                        otherObjectId: nearbyPranksters[0].id
                    }
                })
            }
        }
    }

}

Serializer.deserializers['Bed'] = Component.deserialize(Bed);
