import { Component } from "../component";
import { Rectangle, Vector } from "../engine";
import type { GameObject } from "../game-object";
import { Serializer } from "../serialize";

export interface Sprite {
    name: string;
    src?: string;
    pivot?: Vector;
}

export class SpriteRenderer extends Component {
    type = 'SpriteRenderer';

    sprite: Sprite | null = null;
    bounds: Rectangle;

    flipX = false;
    flipY = false;

    zIndex = 0;
    zIndexUpdate = false;
    affectedByVision = false;
    affectedByVisionRange = false;

    get worldBounds() {
        return Rectangle.offset(this.bounds, this.transform.position);
    }

    public constructor(gameObject: GameObject, id?: number) {
        super(gameObject, id);
        this.bounds = new Rectangle(new Vector(), this.transform.dimension);
    }
}

Serializer.deserializers['SpriteRenderer'] = Component.deserialize(SpriteRenderer);
