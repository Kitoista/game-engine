import { merge, fromEvent, distinctUntilChanged } from 'rxjs';
import { Game } from './game';

export class BrowserEventHandler {
    constructor(public game: Game) {}

    init() {
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
    }

    onEvent(message: string, e: Event): void {
        this.game.gameObjects.forEach(go => go.sendMessage(message, e));
    }

}
