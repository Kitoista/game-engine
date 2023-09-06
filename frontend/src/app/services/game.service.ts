import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { Line, Rectangle, Vector } from 'src/common/engine';
import { Game, GameMessage } from 'src/common/game';
import { GameObject } from 'src/common/game-object';
import { Serializer } from 'src/common/serialize';
import { ImageLoaderService } from './image-loader.service';
import { SpriteRenderer } from 'src/common/components';
import { ClientCommunicator } from 'src/common/communicators';
import { BrowserEventHandler } from 'src/common/browser-event-handler';

@Injectable({
    providedIn: 'root'
})
export class GameService {
    private renderer!: Observable<number>;

    isPredictAllowed = true;
    areLinesAllowed = false;
    isCursorDetailsShown = false;

    game!: Game;
    communicator: ClientCommunicator;
    eventHandler!: BrowserEventHandler;

    camera = new Rectangle();
    get playerObject(): GameObject | null {
        return Game.instance.playerObject;
    };

    lastGameMessage?: GameMessage;

    canvas!: HTMLCanvasElement;
    context!: CanvasRenderingContext2D;

    mousePosition = new Vector();

    cursorObject: Line[] = [
        new Line(-10, 0, -4, 0),
        new Line(-1, 0, 1, 0),
        new Line(10, 0, 4, 0),
        new Line(0, -10, 0, -4),
        new Line(0, 10, 0, 4),
    ];

    get mouseWorldPosition(): Vector {
        return Vector.subtract(this.mousePosition, Vector.scale(this.camera.position, -1));
    }

    constructor(
        private httpClient: HttpClient,
        private imageLoaderService: ImageLoaderService
    ) {
        Game.smoothness = 1;
        Game.isServer = false;
        this.communicator = new ClientCommunicator();
        this.communicator.registerGet(this.httpClient.get.bind(this.httpClient));
        this.communicator.registerPost(this.httpClient.post.bind(this.httpClient));
    }

    start(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
        const source = new EventSource('http://localhost:8000/streaming');
        this.canvas = canvas;
        this.context = context;
        this.renderer = interval(Game.baseTickRate);

        this.canvas.onmousemove = event => {
            var rect = canvas.getBoundingClientRect();
            this.mousePosition.x = event.clientX - rect.left;
            this.mousePosition.y = event.clientY - rect.top;
        };

        this.renderer.subscribe(() => {
            this.render();
        });
        
        this.camera = new Rectangle(0, 0, canvas.width, canvas.height);
        
        source.onerror = val => {
            console.error(val)
            source.close();
        }
        
        let messageCount = 0;
        source.onmessage = val => {
            switch (messageCount) {
                case 0: this.imageLoaderService.loadImages(JSON.parse(val.data)).subscribe(() => {
                    console.log('Loaded images');
                });
                break;
                default: this.onNewGameMessage(Serializer.deserialize(JSON.parse(val.data)));
            }
            ++messageCount;
        }
    }

    onInit() {
        this.game = new Game();
        this.eventHandler = new BrowserEventHandler(this.game);
        this.eventHandler.init();
    }

    onNewGameMessage(gameMessage: GameMessage) {
        this.lastGameMessage = gameMessage;
        if (!this.game) {
            this.onInit();
        }
        this.game.applyState(gameMessage.state);
    }

    render() {
        if (!this.lastGameMessage || !this.game) {
            return;
        }
        if (this.isPredictAllowed) {
            this.game.tick();
        }

        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.context.beginPath();
        this.context.strokeStyle = 'black';
        this.context.strokeRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.closePath();

        // this.renderRect(new Rectangle(100, 400, 600, 50), this.context);
        
        this.setCamera();

        this.game.gameObjects.filter(go => go.collisionLayer !== 0).forEach(obj => {
            this.renderObject(obj);
        });
        
        if (this.areLinesAllowed) {
            this.renderLines();
        }

        this.game.gameObjects.filter(go => go.collisionLayer === 0).forEach(obj => {
            this.renderObject(obj);
        });

        if (this.isCursorDetailsShown) {
            this.cursorDetails();
        }

        this.cursor();
    }

    cursor() {
        this.context.beginPath();
        this.context.strokeStyle = 'black';
        this.cursorObject.forEach(line => {
            const displayedLine = Line.offset(line, this.mousePosition);
            this.drawLine(displayedLine);
        });
        this.context.stroke();
        this.context.closePath();
    }

    drawLine(line: Line) {
        this.context.moveTo(line.start.x, line.start.y);
        this.context.lineTo(line.end.x, line.end.y);
    }

    drawRectangle(renderedRect: Rectangle, text = '', color = 'green') {
        this.context.beginPath();
        this.context.strokeStyle = color;
        this.context.fillStyle = 'white';
        this.context.strokeRect(renderedRect.x, renderedRect.y, renderedRect.width, renderedRect.height);
        const textPosition = renderedRect.middle.add(new Vector(-2.5, 2.5));
        this.context.strokeText(text + '', textPosition.x, textPosition.y);
        this.context.stroke();
        this.context.closePath();
    }

    drawImage(imageName: string, bounds: Rectangle, alt: string = '') {
        const image = this.imageLoaderService.loadedImages[imageName];
        if (image) {
            this.context.drawImage(image, bounds.x, bounds.y, bounds.width, bounds.height);
        } else {
            this.drawRectangle(bounds, alt ?? imageName, 'red');
        }
    }

    drawSpriteRenderer(spriteRenderer: SpriteRenderer) {
        const bounds = this.cameraShiftRectangle(Rectangle.offset(spriteRenderer.bounds, spriteRenderer.transform.position));
        this.drawImage(spriteRenderer.sprite?.name || '', bounds, spriteRenderer.gameObject.id + '');
    }

    cursorDetails() {
        this.context.beginPath();
        this.context.fillStyle = 'black';
        
        const line = new Line(this.cameraShiftVector(Game.instance.playerObject!.transform.middle), this.mousePosition);
        const mouseWorldPosition = this.mouseWorldPosition;

        this.context.fillText(
            `(${Math.floor(mouseWorldPosition.x * 100) / 100}, ${Math.floor(mouseWorldPosition.y * 100) / 100})`,
            line.end.x + 5,
            line.end.y + 15
        );
        this.context.fillText(Math.floor(line.v.angreDeg * 100) / 100 + '°', line.end.x + 5, line.end.y + 25);
        this.context.moveTo(line.start.x, line.start.y);
        this.context.lineTo(line.end.x, line.end.y);

        this.context.strokeStyle = 'red';

        this.context.stroke();
        this.context.fill();
        this.context.closePath();
    }
    
    cameraShiftRectangle(rect: Rectangle): Rectangle {
        return Rectangle.offset(rect, Vector.scale(this.camera.position, -1));
    }

    cameraShiftVector(vector: Vector): Vector {
        return Vector.add(vector, Vector.scale(this.camera.position, -1));
    }

    cameraShiftLine(line: Line): Line {
        return Line.offset(line, Vector.scale(this.camera.position, -1));
    }

    renderObject(go: GameObject) {
        const renderedRect = this.cameraShiftRectangle(go.transform);
        const spriteRenderer = go.getComponent(SpriteRenderer);
        if (spriteRenderer) {
            this.drawSpriteRenderer(spriteRenderer);
        } else {
            this.drawRectangle(renderedRect, go.id + '');
        }
    }

    // test() {
    //     this.context.beginPath();
        
    //     const l1 = new Line(1, 2, 50, 130);
    //     const l2 = new Line(100, 5, 0, 50);
        
    //     const point = l1.intersectionPoint(l2);
    //     this.context.strokeStyle = l1.intersectsWith(l2) ? 'red' : 'gray';

    //     if (!this.logged) {
    //         this.logged = true;
    //         console.log(point);
    //     }

    //     this.context.moveTo(l1.start.x, l1.start.y);
    //     this.context.lineTo(l1.end.x, l1.end.y);
    //     this.context.stroke();

    //     this.context.moveTo(l2.start.x, l2.start.y);
    //     this.context.lineTo(l2.end.x, l2.end.y);
    //     this.context.stroke();

    //     if (point) {
    //         this.context.beginPath();
    //         // this.context.fillStyle = 'lightblue';
    //         this.context.fillText('X', point.x, point.y);
    //         this.context.fill();
    //     }
    // }

    renderLines() {
        const playerObjectCenter = this.playerObject!.transform.middle;
        const stepSize = 0.5;
        const screenSize = new Vector(this.camera.dimension).magnitude / 2;
        const visionRange = new Vector(this.camera.dimension).magnitude / 5;
        
        const walls = this.game.gameObjects.filter(go => go.id !== this.playerObject?.id && go.collisionLayer === 0);

        const grayLines: Line[] = [];

        const angles: number[] = [];
        for (let angle = 0 + stepSize / 2; angle < 360 + stepSize / 2; angle += stepSize) {
            angles.push(angle);
        }

        // walls.forEach((go) => {
        //     angles.push(...go.transform.corners.map(corner => {
        //         return Vector.subtract(corner, playerObjectCenter);
        //     }).map(vector => {
        //         return vector.angreDeg;
        //     }));
        // });
        // angles.sort((a, b) => a - b);
        

        angles.forEach(angle => {
            const angleRad = angle * Math.PI / 180;
            const vector = new Vector(Math.cos(angleRad), Math.sin(angleRad));
            const line = new Line(playerObjectCenter, Vector.add(playerObjectCenter, Vector.scale(vector, screenSize)));

            const intersections: Vector[] = walls.map(wall => line.intersectionPointWithRectangle(wall.transform)!).filter(a => !!a);
            intersections.push(Vector.scale(vector, visionRange).add(playerObjectCenter));
            intersections.sort((a, b) => {
                return Vector.subtract(a, line.start).magnitude - Vector.subtract(b, line.start).magnitude;
            });

            const grayLine = new Line(intersections[0], line.end);
            grayLines.push(grayLine);
        });

        grayLines.forEach((grayLine, i) => {
            const nextGrayLine = grayLines[(i + 1) % grayLines.length];
            this.context.beginPath();
            
            const displayedGrayLine = this.cameraShiftLine(grayLine);
            const displayedNextGrayLine = this.cameraShiftLine(nextGrayLine);

            this.context.strokeStyle = 'gray';
            this.context.fillStyle = 'gray';
            this.context.moveTo(displayedGrayLine.start.x, displayedGrayLine.start.y);
            this.context.lineTo(displayedGrayLine.end.x, displayedGrayLine.end.y);
            this.context.lineTo(displayedNextGrayLine.end.x, displayedNextGrayLine.end.y);
            this.context.lineTo(displayedNextGrayLine.start.x, displayedNextGrayLine.start.y);
            this.context.stroke();
            this.context.fill();
            this.context.closePath();
        });
    }

    // renderLines() {
    //     const playerObjectCenter = this.player!.transform.middle;
    //     const renderedPlayerCenter = this.cameraShiftVector(playerObjectCenter);
    //     const length = new Vector(this.camera.dimension).magnitude;

    //     const vectors: Vector[] = [];

    //     this.game.gameObjects.forEach((go, i) => {
    //         if (go === this.player) {
    //             return;
    //         }
    //         vectors.push(...go.transform.corners.map(corner => {
    //             return Vector.subtract(corner, playerObjectCenter);
    //         }).filter(vector => {
    //             return vector.magnitude <= length;
    //         }).map(vector => {
    //             vector.normalize();
    //             vector.scale(length);
    //             return vector;
    //         }));
    //     });

    //     vectors.sort((a, b) => {
    //         if (a.y < 0 && b.y > 0) {
    //             return 1;
    //         } else if (a.y > 0 && b.y < 0) {
    //             return -1;
    //         }
    //         if (a.y < 0) {
    //             return b.x - a.x;
    //         }
    //         return a.x - b.x;
    //     });

    //     vectors.forEach((vector, i) => {
    //         this.context.beginPath();
    //         // const vector = Vector.subtract(corner, playerObjectCenter);
    //         this.context.strokeStyle = 'gray';

    //         const textPosition = this.cameraShiftVector(new Vector(vector).scale(0.25).add(playerObjectCenter));
    //         const end = this.cameraShiftVector(new Vector(vector).add(playerObjectCenter));

    //         this.context.fillText(i + '', textPosition.x, textPosition.y);

    //         this.context.moveTo(renderedPlayerCenter.x, renderedPlayerCenter.y);
    //         this.context.lineTo(end.x, end.y);
    //         this.context.stroke();
    //     });
    // }

    setCamera() {
        const cameraOn = this.lastGameMessage!.state.cameraOn;
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
