import { Ai } from "../components";
import { GameObject } from "../game-object";
import { mobPrefab } from "./mob.prefab";

export const aiPrefab = (target: GameObject): GameObject => {
    const aiObject = mobPrefab();
    const ai = aiObject.addComponent(Ai);

    ai.target = target;

    return aiObject;
}
