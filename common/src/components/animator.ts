import { Component } from "../component";
import { Game } from "../game";
import { GameObject } from "../game-object";
import { Serializer } from "../serialize";
import { Sprite, SpriteRenderer } from "./sprite-renderer";

export interface AnimationState {
    sprite: Sprite;
    duration: number;
}

export type Animation = AnimationState[];

export interface AnimationMap {
    [name: string]: Animation;
}

export class Animator extends Component {
    type = 'Animator';
    
    spriteRenderer!: SpriteRenderer;
    
    name?: string;
    animationMap?: AnimationMap;
    previousName?: string;
    
    currentIndex = 0;
    currentStartTime = 0;

    get currentAnimation(): Animation | null {
        if (this.name && this.animationMap && this.animationMap[this.name] && this.animationMap[this.name].length > 0) {
            return this.animationMap[this.name];
        }
        return null;
    }

    get currentState(): AnimationState | null {
        return this.currentAnimation?.[this.currentIndex] ?? null;
    }

    public constructor(gameObject: GameObject, id?: number) {
        super(gameObject, id);
        this.spriteRenderer = gameObject.getComponent(SpriteRenderer);
        if (Game.isServer && !this.spriteRenderer) {
            this.spriteRenderer = gameObject.addComponent(SpriteRenderer);
        }
    }

    override start() {
        this.currentStartTime = Game.time;
    }

    override update() {
        // if (!Game.isServer) {
        //     return;
        // }
        
        if (this.name !== this.previousName) {
            this.currentIndex = 0;
            this.currentStartTime = Game.time;
            this.previousName = this.name;
        }
        const animation = this.currentAnimation;
        const state = this.currentState;
        
        if (state && Game.time - this.currentStartTime > state.duration) {
            this.currentStartTime = Game.time;
            this.currentIndex = (this.currentIndex + 1) % animation!.length;
        }
        this.spriteRenderer.sprite = this.currentState?.sprite ?? null;
    }
}

Serializer.deserializers['Animator'] = Component.deserialize(Animator);
