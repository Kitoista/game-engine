import { merge, fromEvent, distinctUntilChanged } from 'rxjs';
import { Game } from './game';
import { Vector } from './engine';

export class BrowserEventHandler {
    static instance: BrowserEventHandler;
    
    constructor(public game: Game) {
        BrowserEventHandler.instance = this;
    }

    canvasToWorldCoordinates!: (vector: Vector) => Vector;

    init(canvas: HTMLCanvasElement) {
        merge(
            fromEvent<KeyboardEvent>(document, 'keydown'),
            fromEvent<KeyboardEvent>(document, 'keyup')
        ).pipe(
            distinctUntilChanged((a, b) => {
                return a.type === b.type && a.key === b.key;
            })
        ).subscribe(
            (e: any) => this.onEvent('onKeyboardEvent', e)
        );
        merge(
            fromEvent<MouseEvent>(canvas, 'mousemove'),
            fromEvent<MouseEvent>(canvas, 'mousedown'),
            fromEvent<MouseEvent>(canvas, 'mouseup')
        ).subscribe(
            (e: any) => this.onEvent('onMouseEvent', e)
        );
    }

    onEvent(message: string, e: Event): void {
        this.game.gameObjects.forEach(go => go.sendMessage(message, e));
    }


}
