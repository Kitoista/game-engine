import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, interval } from 'rxjs';
import { Line, Rectangle, Vector } from 'src/common/engine';
import { Game, GameMessage } from 'src/common/game';
import { GameObject } from 'src/common/game-object';
import { Serializer } from 'src/common/serialize';
import { ImageLoaderService } from './image-loader.service';
import { Collider, Mob, Pickable, Player, SpriteRenderer } from 'src/common/components';
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
    get playerMob(): Mob | null {
        return this.playerObject?.getComponent(Mob) ?? null;
    }
    get player(): Player | null {
        return this.playerObject?.getComponent(Player) ?? null;
    }

    lastGameMessage?: GameMessage;

    canvas!: HTMLCanvasElement;
    context!: CanvasRenderingContext2D;

    mousePosition = new Vector();
    playerCenter!: Vector;
    vision: Path2D = new Path2D();

    cursorObject: Line[] = [
        new Line(-10, 0, -4, 0),
        new Line(-1, 0, 1, 0),
        new Line(10, 0, 4, 0),
        new Line(0, -10, 0, -4),
        new Line(0, 10, 0, 4),
    ];

    sortedSpriteRenderers: SpriteRenderer[] = [];

    get mouseWorldPosition(): Vector {
        return Vector.subtract(this.mousePosition, Vector.scale(this.camera.position, -1));
    }

    get hoveredObject(): GameObject | null {
        const hoveredSpriteRenderers = this.sortedSpriteRenderers.filter(spriteRenderer => {
            return spriteRenderer.worldBounds.contains(this.mouseWorldPosition);
        });
        return hoveredSpriteRenderers[hoveredSpriteRenderers.length - 1]?.gameObject ?? null;
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
        this.communicator.startPinging();
        const source = new EventSource('http://localhost:8000/streaming');
        this.canvas = canvas;
        this.context = context;
        this.renderer = interval(Game.baseTickRate);

        this.canvas.onmousemove = event => {
            var rect = canvas.getBoundingClientRect();
            this.mousePosition.x = event.clientX - rect.left;
            this.mousePosition.y = event.clientY - rect.top;
        };

        this.canvas.onmousedown = event => {
            console.log(this.hoveredObject);
        }

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
        this.eventHandler.canvasToWorldCoordinates = (vector: Vector) => Vector.add(vector, this.camera.position);
        this.eventHandler.init(this.canvas);
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

        this.setPlayerCenter();

        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);        

        this.context.beginPath();
        this.context.strokeStyle = 'black';
        this.context.strokeRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.closePath();

        // this.renderRect(new Rectangle(100, 400, 600, 50), this.context);
        
        this.setCamera();

        if (this.areLinesAllowed) {
            this.calculateVision();
            this.renderVision();
        }

        this.sortSpriteRenderers();

        this.sortedSpriteRenderers.forEach(sp => {
            // this.renderObject(sp.gameObject, sp);
            this.renderSprite(sp);
        });

        if (this.isCursorDetailsShown) {
            this.cursorDetails();
        }

        this.cursor();
    }

    setPlayerCenter() {
        if (this.playerObject) {
            const collider = this.playerObject.getComponent(Collider);
            if (collider) {
                this.playerCenter = collider.worldBounds.middle;
            } else {
                this.playerCenter = this.playerObject.transform.middle;
            }
        } else {
            this.playerCenter = this.camera.middle;
        }
    }

    sortSpriteRenderers() {
        this.sortedSpriteRenderers = this.game.gameObjects.map(go => go.getComponents(SpriteRenderer))
            .reduce((arr, value) => {
                arr.push(...value);
                return arr;
            }, []);
        this.sortedSpriteRenderers.sort((a, b) => {
            const zDiff = b.zIndex - a.zIndex;
            if (zDiff !== 0) {
                return zDiff;
            }
            return a.sortValue - b.sortValue;
        });
        // const sp = this.sortedSpriteRenderers.find(sp => sp.gameObject.id === 16)!;
        // let holder: SpriteRenderer | null = null;
        // if (sp.getComponent(Pickable).owner) {
        //     holder = sp.getComponent(Pickable).owner!.getComponent(SpriteRenderer)!;
        //     const aV = sp.sortValue;
        //     const bV = holder.sortValue;
        //     const cV = GameObject.getById(8)!.getComponent(SpriteRenderer).sortValue;
        //     console.log('honey: ' + aV + ' holder ' + bV + ' diff ' + (bV - aV) + ' wall8 ' + cV);
        // }
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
        this.context.fillStyle = '#281b0d';
        this.context.strokeRect(renderedRect.x, renderedRect.y, renderedRect.width, renderedRect.height);
        this.context.fillRect(renderedRect.x, renderedRect.y, renderedRect.width, renderedRect.height);
        const textPosition = renderedRect.middle.add(new Vector(-2.5, 2.5));
        this.context.strokeText(text + '', textPosition.x, textPosition.y);
        this.context.stroke();
        this.context.closePath();
    }

    drawImage(imageName: string, bounds: Rectangle, alt: string = '', flipX = false, flipY = false) {
        const image = this.imageLoaderService.loadedImages[imageName];
        if (image) {
            // this.context.drawImage(image, bounds.x, bounds.y, bounds.width, bounds.height);
            this.context.save();  // save the current canvas state
            this.context.setTransform(
                flipX ? -1 : 1, 0, // set the direction of x axis
                0, flipY ? -1 : 1,   // set the direction of y axis
                bounds.x + (flipX ? bounds.width : 0), // set the x origin
                bounds.y + (flipY ? bounds.height : 0)   // set the y origin
            );
            this.context.drawImage(image, 0, 0, bounds.width, bounds.height);
            this.context.restore(); // restore the state as it was when this function was called
        } else {
            this.drawRectangle(bounds, alt ?? imageName, 'red');
        }
    }

    renderSprite(spriteRenderer: SpriteRenderer) {
        const bounds = this.cameraShiftRectangle(spriteRenderer.worldBounds);
        const collider = spriteRenderer.getComponent(Collider);
        const visionBounds = collider ? this.cameraShiftRectangle(collider.worldBounds) : bounds;
        const isAffectedByVision = this.areLinesAllowed && spriteRenderer.affectedByVision && this.playerObject && spriteRenderer.gameObject !== this.playerObject;
        const isAffectedByVisionRange = this.areLinesAllowed && spriteRenderer.affectedByVisionRange && this.playerObject && spriteRenderer.gameObject !== this.playerObject;
        if (isAffectedByVisionRange) {
            this.context.save();
            const playerWorldCenter = this.cameraShiftVector(this.playerCenter);
            this.context.arc(playerWorldCenter.x, playerWorldCenter.y, this.playerMob!.visionRange, 0, 2 * Math.PI, false);
            this.context.clip();
        }
        if (!isAffectedByVision || this.clipVision(visionBounds)) {
            this.drawImage(spriteRenderer.sprite?.name || '', bounds, spriteRenderer.gameObject.id + '', spriteRenderer.flipX, spriteRenderer.flipY);
        }
        if (isAffectedByVisionRange) {
            this.context.restore();
        }
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

        const hoveredSpriteRenderer = this.hoveredObject?.getComponent(SpriteRenderer);
        if (hoveredSpriteRenderer) {
            this.context.fillText('object ' + hoveredSpriteRenderer.gameObject.id, line.end.x + 15, line.end.y + 5);
        }

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

    renderObject(go: GameObject, sp: SpriteRenderer) {
        if (go.getComponents(SpriteRenderer).indexOf(sp) > 0) {
            this.renderSprite(sp);
            return;
        }
        const colliders = go.getComponents(Collider);
        colliders.forEach(collider => {
            const renderedColliderRect = this.cameraShiftRectangle(collider.worldBounds);
            this.drawRectangle(renderedColliderRect, go.id + '', collider.isTrigger ? 'blue' : 'red');
        });
        const renderedRect = this.cameraShiftRectangle(go.transform);
        const spriteRenderer = go.getComponent(SpriteRenderer);
        if (spriteRenderer) {
            this.renderSprite(spriteRenderer);
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

    clipVision(bounds: Rectangle): boolean {
        // this.context.save();
        return this.context.isPointInPath(this.vision, bounds.topLeft.x, bounds.topLeft.y, 'evenodd') ||
            this.context.isPointInPath(this.vision, bounds.topRight.x, bounds.topRight.y, 'evenodd') ||
            this.context.isPointInPath(this.vision, bounds.bottomLeft.x, bounds.bottomLeft.y, 'evenodd') ||
            this.context.isPointInPath(this.vision, bounds.bottomRight.x, bounds.bottomRight.y, 'evenodd');
        // this.context.clip(this.vision);
    }

    renderVision() {
        const path = new Path2D();
        path.rect(0, 0, this.canvas.width, this.canvas.height);
        path.addPath(this.vision);
        this.context.fillStyle = 'gray';
        this.context.fill(path, 'evenodd');
    }

    calculateVision() {
        const playerObjectCenter = this.playerCenter;
        const stepSize = 0.5;
        const screenSize = new Vector(this.camera.dimension).magnitude / 1.5;
        const visionRange = this.playerMob!.visionRange!;
        
        const wallRectangles = this.game.gameObjects.filter(go => go.id !== this.playerObject?.id && go.collisionLayer === 0).map(go => {
            const collider = go.getComponent(Collider);
            if (collider) {
                return collider.worldBounds;
            }
            return go.transform;
        });

        const visionPoints: Vector[] = [];

        const angles: number[] = [];
        for (let angle = 0; angle < 360 + stepSize / 2; angle += stepSize) {
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

            const intersections: Vector[] = wallRectangles.map(rect => line.intersectionPointWithRectangle(rect)!).filter(a => !!a);
            intersections.push(Vector.scale(vector, visionRange).add(playerObjectCenter));
            intersections.sort((a, b) => {
                return Vector.subtract(a, line.start).magnitude - Vector.subtract(b, line.start).magnitude;
            });

            // const grayLine = new Line(line.start, intersections[0]);
            visionPoints.push(intersections[0]);
        });

        const vision = new Path2D();

        const point = this.cameraShiftVector(visionPoints[visionPoints.length - 1]);
        vision.moveTo(point.x, point.y);

        visionPoints.forEach((visionPoint, i) => {
            const displayedVisionPoint = this.cameraShiftVector(visionPoint);
            vision.lineTo(displayedVisionPoint.x, displayedVisionPoint.y);
        });
        vision.closePath();

        this.vision = vision;
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
