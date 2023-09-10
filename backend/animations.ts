import { AnimationMap } from "./common/components";

export const animations: { [name: string]: AnimationMap } = {
    Eevee: {
        idle: [
            { sprite: { name: 'Eevee_idle_1' }, duration: 250 },
            { sprite: { name: 'Eevee_idle_2' }, duration: 250 },
        ],
        moving: [
            { sprite: { name: 'Eevee_moving_1' }, duration: 100 },
            { sprite: { name: 'Eevee_moving_2' }, duration: 100 },
            { sprite: { name: 'Eevee_moving_3' }, duration: 100 },
        ]
    },
    Skitty: {
        idle: [
            { sprite: { name: 'Skitty_idle_1' }, duration: 500 },
            { sprite: { name: 'Skitty_idle_2' }, duration: 250 },
        ],
        moving: [
            { sprite: { name: 'Skitty_moving_1' }, duration: 100 },
            { sprite: { name: 'Skitty_moving_2' }, duration: 75 },
            { sprite: { name: 'Skitty_moving_3' }, duration: 25 },
            { sprite: { name: 'Skitty_moving_4' }, duration: 100 },
        ]
    },
    Chansey: {
        idle: [
            { sprite: { name: 'Chansey_idle_1' }, duration: 500 },
            { sprite: { name: 'Chansey_idle_2' }, duration: 500 },
        ],
        moving: [
            { sprite: { name: 'Chansey_moving_1' }, duration: 100 },
            { sprite: { name: 'Chansey_moving_2' }, duration: 100 },
            { sprite: { name: 'Chansey_moving_3' }, duration: 100 },
            { sprite: { name: 'Chansey_moving_4' }, duration: 100 },
        ]
    },
    Honey: {
        full: [
            { sprite: { name: 'Honey_full' }, duration: 100000 }
        ],
        empty: [
            { sprite: { name: 'Honey_empty' }, duration: 100000 }
        ]
    },
    Honey2: {
        full: [
            { sprite: { name: 'Honey2_full' }, duration: 100000 }
        ],
        empty: [
            { sprite: { name: 'Honey2_empty' }, duration: 100000 }
        ]
    },
    Honey3: {
        full: [
            { sprite: { name: 'Honey3_full' }, duration: 100000 }
        ],
        empty: [
            { sprite: { name: 'Honey3_empty' }, duration: 100000 }
        ]
    }
}
