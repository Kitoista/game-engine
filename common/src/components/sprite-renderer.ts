import { Component } from "../component";
import { Rectangle, Vector } from "../engine";
import type { GameObject } from "../game-object";
import { Serializer } from "../serialize";

export interface Sprite {
    name: string;
    src?: string;
}

export class SpriteRenderer extends Component {
    type = 'SpriteRenderer';

    sprite: Sprite | null = null;
    bounds: Rectangle;

    public constructor(gameObject: GameObject, id?: number) {
        super(gameObject, id);
        this.bounds = new Rectangle(new Vector(), this.transform.dimension);
    }
}

Serializer.deserializers['SpriteRenderer'] = Component.deserialize(SpriteRenderer);