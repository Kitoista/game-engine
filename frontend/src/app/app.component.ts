import { Component, ElementRef, ViewChild } from '@angular/core';
import { GameService } from './services/game.service';
import { Dimension, Rectangle, Vector } from 'src/common/engine';
import { interval } from 'rxjs';
import { PlayerControllerService } from './services/player-controller.service';
import { fromEvent, merge, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { Game } from 'src/common/game';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @ViewChild('canvas') canvasElement!: ElementRef<HTMLCanvasElement>;

  private canvas!: HTMLCanvasElement;
  private context!: CanvasRenderingContext2D;

  Game = Game;

  constructor(
    public gameService: GameService,
    public playerControllerService: PlayerControllerService,
  ) {}

  ngAfterViewInit() {
    this.canvas = this.canvasElement.nativeElement;
    this.context = this.canvas.getContext('2d')!;
    this.gameService.start(this.canvas, this.context);

    merge(
      fromEvent<KeyboardEvent>(document, 'keydown'),
      fromEvent<KeyboardEvent>(document, 'keyup')
    ).pipe(
      distinctUntilChanged((a, b) => {
        return a.type === b.type && a.key === b.key;
      })
    ).subscribe(
      (e: any) => this.playerControllerService.onKeyboardEvent(e)
    );
  }

}
