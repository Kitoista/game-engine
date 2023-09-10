import { AnimationMap, Collider, SpriteRenderer } from "../common/components";
import { Bed } from "../common/components/bed";
import { Dimension, Rectangle, Vector } from "../common/engine";
import { GameObject } from "../common/game-object";

export const bedPrefab = (position: Vector): GameObject => {
    const re = new GameObject();
    const width = 38;
    const height = 48;
    re.transform = new Rectangle(position, new Dimension(width, height));
    re.collisionLayer = 0;

    const sp1 = re.addComponent(SpriteRenderer);
    const sp2 = re.addComponent(SpriteRenderer);
    const collider1 = re.addComponent(Collider);
    const collider2 = re.addComponent(Collider);
    const bed = re.addComponent(Bed);

    collider1.bounds.position.y += height - 5;
    collider1.bounds.dimension.height = 5;

    collider2.bounds.dimension.height = 5;

    sp1.sprite = { name: 'Bed_back' };
    sp2.sprite = { name: 'Bed_front' };
    
    sp1.yOffset = -24;

    return re;
}
