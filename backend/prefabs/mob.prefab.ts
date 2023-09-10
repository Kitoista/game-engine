import { animations } from "../animations";
import { Animator, Collider, Mob, Prankster, Rigidbody, SpriteRenderer } from "../common/components";
import { Pickable } from "../common/components/pickable";
import { Rectangle } from "../common/engine";
import { GameObject } from "../common/game-object";

export const mobPrefab = (): GameObject => {
    const mobObject = new GameObject();
    mobObject.transform = new Rectangle(250, 250, 50, 50);
    mobObject.collisionLayer = 1;
    
    const collider = mobObject.addComponent(Collider);
    const rigidbody = mobObject.addComponent(Rigidbody);
    const spriteRenderer = mobObject.addComponent(SpriteRenderer);
    const animator = mobObject.addComponent(Animator);
    const trigger = mobObject.addComponent(Collider);
    const mob = mobObject.addComponent(Mob);
    const pickable = mobObject.addComponent(Pickable);
    const prankster = mobObject.addComponent(Prankster);

    collider.bounds.dimension.height = 20;
    collider.bounds.dimension.width = 20;
    collider.bounds.position.x = 15;
    collider.bounds.position.y = 30;

    spriteRenderer.affectedByVision = true;

    animator.animationMap = animations.Eevee;
    animator.name = 'idle';

    trigger.bounds.position.x -= 5;
    trigger.bounds.position.y -= 5;
    trigger.bounds.dimension.width += 10;
    trigger.bounds.dimension.height += 10;
    trigger.isTrigger = true;

    return mobObject;
}
