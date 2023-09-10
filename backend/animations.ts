import { AnimationMap } from "./common/components";
import { getSprite } from "./sprites";

export const animations: { [name: string]: AnimationMap } = {
    Eevee: {
        idle: [
            { sprite: getSprite('Eevee_idle_1'), duration: 250 },
            { sprite: getSprite('Eevee_idle_2'), duration: 250 },
        ],
        moving: [
            { sprite: getSprite('Eevee_moving_1'), duration: 100 },
            { sprite: getSprite('Eevee_moving_2'), duration: 100 },
            { sprite: getSprite('Eevee_moving_3'), duration: 100 },
        ]
    },
    Skitty: {
        idle: [
            { sprite: getSprite('Skitty_idle_1'), duration: 500 },
            { sprite: getSprite('Skitty_idle_2'), duration: 250 },
        ],
        moving: [
            { sprite: getSprite('Skitty_moving_1'), duration: 100 },
            { sprite: getSprite('Skitty_moving_2'), duration: 75 },
            { sprite: getSprite('Skitty_moving_3'), duration: 25 },
            { sprite: getSprite('Skitty_moving_4'), duration: 100 },
        ]
    },
    Chansey: {
        idle: [
            { sprite: getSprite('Chansey_idle_1'), duration: 500 },
            { sprite: getSprite('Chansey_idle_2'), duration: 500 },
        ],
        moving: [
            { sprite: getSprite('Chansey_moving_1'), duration: 100 },
            { sprite: getSprite('Chansey_moving_2'), duration: 100 },
            { sprite: getSprite('Chansey_moving_3'), duration: 100 },
            { sprite: getSprite('Chansey_moving_4'), duration: 100 },
        ]
    },
    Honey: {
        full: [
            { sprite: getSprite('Honey_full'), duration: 100000 }
        ],
        empty: [
            { sprite: getSprite('Honey_empty'), duration: 100000 }
        ]
    },
    Honey2: {
        full: [
            { sprite: getSprite('Honey2_full'), duration: 100000 }
        ],
        empty: [
            { sprite: getSprite('Honey2_empty'), duration: 100000 }
        ]
    },
    Honey3: {
        full: [
            { sprite: getSprite('Honey3_full'), duration: 100000 }
        ],
        empty: [
            { sprite: getSprite('Honey3_empty'), duration: 100000 }
        ]
    }
}
