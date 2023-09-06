import { Player, Rigidbody } from "../components";
import { Animator } from "../components/animator";
import { Collider } from "../components/collider";
import { Rectangle } from "../engine";
import { GameObject } from "../game-object";

export const playerPrefab = (): GameObject => {
    const playerObject = new GameObject();
    playerObject.transform = new Rectangle(200, 200, 50, 50);
    playerObject.collisionLayer = 1;
    
    const collider = playerObject.addComponent(Collider);
    const rigidbody = playerObject.addComponent(Rigidbody);
    const animator = playerObject.addComponent(Animator);
    const player = playerObject.addComponent(Player);
    
    animator.animationMap = {
        'idle': [
            { sprite: { name: 'Ebisu1' }, duration: 1000 },
            { sprite: { name: 'Ebisu2' }, duration: 1000 },
        ]
    }
    animator.name = 'idle';

    return playerObject;
}
