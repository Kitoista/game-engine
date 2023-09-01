import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { Rectangle, Vector } from 'src/common/engine';
import { GameState, GameObject, Game } from 'src/common/game';

@Injectable({
    providedIn: 'root'
})
export class GameService {
    private renderer!: Observable<number>;
    private pinger = interval(1000);
    private _ping$ = new BehaviorSubject<number>(0);
    ping$ = this._ping$.asObservable();

    isPredictAllowed = true;

    game!: Game;
    camera = new Rectangle();
    player?: GameObject;

    lastGameState?: GameState;

    canvas!: HTMLCanvasElement;
    context!: CanvasRenderingContext2D;

    constructor(
        private httpClient: HttpClient
    ) {
        Game.smoothness = 1;
    }

    start(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
        this.pinger.subscribe(() => {
            const timeA = Date.now();
            this.httpClient.get('http://localhost:8000/ping').subscribe(() => {
                const timeB = Date.now();
                this._ping$.next(timeB - timeA);
            });
        });
        const source = new EventSource('http://localhost:8000/streaming');
        this.canvas = canvas;
        this.context = context;
        this.renderer = interval(Game.baseTickRate);
        
        this.renderer.subscribe(() => {
            this.render();
        });
        
        this.camera = new Rectangle(0, 0, canvas.width, canvas.height);
        
        source.onerror = val => {
            console.error(val)
            source.close();
        }
        
        source.onmessage = val => {
            this.onNewGameState(JSON.parse(val.data));
        }
    }

    onNewGameState(gameState: GameState) {
        this.lastGameState = gameState;
        if (!this.game) {
            this.game = new Game([]);
        }
        if (this.player) {
            // console.log('Message');
            // console.log(this.player.transform.position);
        }
        this.game.gameObjects = this.lastGameState!.gameObjects.map(go => GameObject.from(go));
        if (this.player) {
            // console.log(this.player!.transform.position);
        }
        if (typeof this.lastGameState!.cameraOn === 'number') {
            this.player = this.game.gameObjects.find(obj => this.lastGameState!.cameraOn === obj.id);
            if (this.player) {
                this.game.initPlayers([this.player.id]);
            }
        }
        // console.log('predictTicks', this.ping * Game.refreshRate / Game.baseTickRate);
    }

    render() {
        if (!this.lastGameState || !this.game) {
            return;
        }
        if (this.isPredictAllowed) {
            this.game.tick();
        }

        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.strokeRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.context.strokeStyle = 'green';
        // this.renderRect(new Rectangle(100, 400, 600, 50), this.context);
        
        this.setCamera();

        this.game.gameObjects.forEach(obj => {
            this.renderObject(obj);
            
        });
    }
    
    renderObject(go: GameObject) {
        const rect = go.transform;
        const renderedRect = Rectangle.offset(rect, Vector.scale(this.camera.position, -1));
        this.context.strokeRect(renderedRect.x, renderedRect.y, renderedRect.width, renderedRect.height);
        const textPosition = renderedRect.middle.add(new Vector(-2.5, 2.5));
        this.context.strokeText(go.id + '', textPosition.x, textPosition.y);
    }

    setCamera() {
        const cameraOn = this.lastGameState!.cameraOn;
        let position: Vector;
        let followObject = null;
        if (typeof cameraOn === 'number') {
            followObject = this.game.gameObjects.find(go => go.id === cameraOn);
        }

        if (followObject) {
            position = new Vector(followObject.transform.position);
            position.add(Vector.scale(followObject.transform.dimension, 0.5));
        } else if (typeof cameraOn === 'object') {
            position = new Vector(cameraOn);
        } else {
            position = new Vector();
        }
        position.subtract(Vector.scale(this.camera.dimension, 0.5));

        this.camera.position = position;
    }

}
