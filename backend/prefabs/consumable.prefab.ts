import { animations } from "../animations";
import { AnimationMap, Animator, SpriteRenderer } from "../common/components";
import { Consumable } from "../common/components/consumable";
import { Pickable } from "../common/components/pickable";
import { Dimension, Rectangle, Vector } from "../common/engine";
import { GameObject } from "../common/game-object";

export const consumablePrefab = (transform: Rectangle, animationMap: AnimationMap): GameObject => {
    const re = new GameObject();
    re.transform = new Rectangle(transform);

    const pickable = re.addComponent(Pickable);
    const consumable = re.addComponent(Consumable);
    
    const spriteRenderer = re.addComponent(SpriteRenderer);
    const animator = re.addComponent(Animator);
    
    spriteRenderer.affectedByVision = true;
    animator.animationMap = animationMap;
    animator.name = 'full';

    return re;
}

export const honeyPrefab = (position: Vector): GameObject => {
    const transform = new Rectangle(position, new Dimension(18, 23));
    const re = consumablePrefab(transform, animations.Honey);
    return re;
}

export const honey2Prefab = (position: Vector): GameObject => {
    const transform = new Rectangle(position, new Dimension(14, 14));
    const re = consumablePrefab(transform, animations.Honey2);
    return re;
}

export const honey3Prefab = (position: Vector): GameObject => {
    const transform = new Rectangle(position, new Dimension(16, 22));
    const re = consumablePrefab(transform, animations.Honey3);
    return re;
}
