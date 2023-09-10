import { Ai, Pickable, Prankster } from "../common/components";
import { GameObject } from "../common/game-object";
import { mobPrefab } from "./mob.prefab";

export const aiPrefab = (target?: GameObject): GameObject => {
    const aiObject = mobPrefab();
    const ai = aiObject.addComponent(Ai);

    aiObject.addComponent(Prankster);
    const pickable = aiObject.addComponent(Pickable);
    // pickable.pickedRenderPriority = 20;

    ai.target = target;

    return aiObject;
}
