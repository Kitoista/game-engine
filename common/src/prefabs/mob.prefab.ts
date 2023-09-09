import { Rigidbody, SpriteRenderer } from "../components";
import { Animator } from "../components/animator";
import { Collider } from "../components/collider";
import { Rectangle } from "../engine";
import { GameObject } from "../game-object";

export const mobPrefab = (): GameObject => {
    const mobObject = new GameObject();
    mobObject.transform = new Rectangle(250, 250, 50, 50);
    mobObject.collisionLayer = 1;

    const collider = mobObject.addComponent(Collider);
    const rigidbody = mobObject.addComponent(Rigidbody);
    const spriteRenderer = mobObject.addComponent(SpriteRenderer);
    const animator = mobObject.addComponent(Animator);
    const trigger = mobObject.addComponent(Collider);

    collider.bounds.dimension.height = 20;
    collider.bounds.dimension.width = 20;
    collider.bounds.position.x = 15;
    collider.bounds.position.y = 30;

    spriteRenderer.affectedByVision = true;

    animator.animationMap = {
        'idle': [
            { sprite: { name: 'Eevee_idle_1' }, duration: 250 },
            { sprite: { name: 'Eevee_idle_2' }, duration: 250 },
        ],
        'moving': [
            { sprite: { name: 'Eevee_moving_1' }, duration: 100 },
            { sprite: { name: 'Eevee_moving_2' }, duration: 100 },
            { sprite: { name: 'Eevee_moving_3' }, duration: 100 },
        ]
    }
    animator.name = 'idle';

    trigger.bounds.position.x -= 5;
    trigger.bounds.position.y -= 5;
    trigger.bounds.dimension.width += 10;
    trigger.bounds.dimension.height += 10;
    trigger.isTrigger = true;

    return mobObject;
}
