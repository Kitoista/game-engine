import { Sprite } from "./common/components";
import { Vector } from "./common/engine";

export const sprites: Sprite[] = [
    { name: 'Lux', src: 'assets/Lux.png' },
    { name: 'Ebisu1', src: 'assets/ebisu1.png' },
    { name: 'Ebisu2', src: 'assets/ebisu2.png' },
    { name: 'Eevee_idle_1', src: 'assets/Eevee_idle_1.png' },
    { name: 'Eevee_idle_2', src: 'assets/Eevee_idle_2.png' },
    { name: 'Eevee_moving_1', src: 'assets/Eevee_moving_1.png' },
    { name: 'Eevee_moving_2', src: 'assets/Eevee_moving_2.png' },
    { name: 'Eevee_moving_3', src: 'assets/Eevee_moving_3.png' },
    { name: 'Skitty_idle_1', src: 'assets/Skitty_idle_1.png' },
    { name: 'Skitty_idle_2', src: 'assets/Skitty_idle_2.png' },
    { name: 'Skitty_moving_1', src: 'assets/Skitty_moving_1.png' },
    { name: 'Skitty_moving_2', src: 'assets/Skitty_moving_2.png' },
    { name: 'Skitty_moving_3', src: 'assets/Skitty_moving_3.png' },
    { name: 'Skitty_moving_4', src: 'assets/Skitty_moving_4.png' },
    { name: 'Chansey_idle_1', src: 'assets/Chansey_idle_1.png' },
    { name: 'Chansey_idle_2', src: 'assets/Chansey_idle_2.png' },
    { name: 'Chansey_moving_1', src: 'assets/Chansey_moving_1.png' },
    { name: 'Chansey_moving_2', src: 'assets/Chansey_moving_2.png' },
    { name: 'Chansey_moving_3', src: 'assets/Chansey_moving_3.png' },
    { name: 'Chansey_moving_4', src: 'assets/Chansey_moving_4.png' },
    { name: 'Honey_full', src: 'assets/Honey_full.png' },
    { name: 'Honey_empty', src: 'assets/Honey_empty.png' },
    { name: 'Honey2_full', src: 'assets/Honey2_full.png' },
    { name: 'Honey2_empty', src: 'assets/Honey2_empty.png' },
    { name: 'Honey3_full', src: 'assets/Honey3_full.png' },
    { name: 'Honey3_empty', src: 'assets/Honey3_empty.png' },
    { name: 'Bed_back', src: 'assets/Bed_back.png', pivot: new Vector(0, 10) },
    { name: 'Bed_front', src: 'assets/Bed_front.png', pivot: new Vector(0, 10) },
];

export const getSprite = (name: string): Sprite => {
    const re = sprites.find(sprite => name === sprite.name);
    if (!re) {
        throw 'No sprite called ' + name;
    }
    return re;
}
