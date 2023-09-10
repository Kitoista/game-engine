import { Ai } from "../common/components";
import { GameObject } from "../common/game-object";
import { mobPrefab } from "./mob.prefab";

export const aiPrefab = (target?: GameObject): GameObject => {
    const aiObject = mobPrefab();
    const ai = aiObject.addComponent(Ai);

    ai.target = target;

    return aiObject;
}
