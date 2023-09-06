import { Component, ElementRef, ViewChild } from '@angular/core';
import { GameService } from './services/game.service';
import { Game } from 'src/common/game';
import { ImageLoaderService } from './services/image-loader.service';
import { ClientCommunicator } from 'src/common/communicators';

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
  communicator = ClientCommunicator.instance;

  constructor(
    public gameService: GameService,
    public imageLoaderService: ImageLoaderService
  ) {}

  ngAfterViewInit() {
    this.canvas = this.canvasElement.nativeElement;
    this.context = this.canvas.getContext('2d')!;

    this.gameService.start(this.canvas, this.context);
  }
}
