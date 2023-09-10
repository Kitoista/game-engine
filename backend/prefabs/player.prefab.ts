import { Player } from "../common/components";
import { GameObject } from "../common/game-object";
import { mobPrefab } from "./mob.prefab";

export const playerPrefab = (): GameObject => {
    const playerObject = mobPrefab();
    const player = playerObject.addComponent(Player);
    return playerObject;
}
