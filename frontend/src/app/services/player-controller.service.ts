import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GameObject, GameState, PlayerInputEvent, PlayerInputEventType, playerInputEventTypes } from 'src/common/game';
import { GameService } from './game.service';
import { take } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PlayerControllerService {
    get player(): GameObject | undefined {
        return this.gameService.player;
    }

    keyMap: { [key: string]: PlayerInputEventType } = {
        'a': 'left',
        'd': 'right',
        'w': 'up',
        's': 'down'
    }

    public constructor(
        protected httpClient: HttpClient,
        protected gameService: GameService
    ) {}

    onKeyboardEvent(keyEvent: KeyboardEvent) {
        if (!this.player) {
            return;
        }
        const eventType: PlayerInputEventType = this.keyMap[keyEvent.key];
        if (eventType) {
            const playerInputEvent = new PlayerInputEvent(eventType, keyEvent.type === 'keydown', this.player.id);
            this.sendPlayerInputEvent(playerInputEvent);
        }
    }

    private sendPlayerInputEvent(event: PlayerInputEvent) {
        this.gameService.ping$.pipe(take(1)).subscribe(ping => {
            setTimeout(() => {
                this.gameService.game.playerInputMap[this.player!.id].push(event);
            }, ping / 2);
        });
        this.httpClient.post<GameState>('http://localhost:8000/player-input-event', event).subscribe();
    }
}
