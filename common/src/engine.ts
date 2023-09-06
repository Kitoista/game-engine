import { Serializable, Serializer } from "./serialize";

export interface VectorLike {
    x: number;
    y: number;
}

export interface DimensionLike {
    width: number;
    height: number;
}

export class Vector implements VectorLike, Serializable {
    type = 'Vector';
    public x: number;
    public y: number;

    public get magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    public get rotate90(): Vector {
        return new Vector(this.y, this.x);
    }

    public get angleRad(): number {
        let angle = 0;
        let normalized = Vector.normalize(this);
        if (Math.sign(normalized.y) > 0) {
            angle = Math.acos(normalized.x);
        } else {
            angle = (2 * Math.PI) - Math.acos(normalized.x);
        }
        return angle;
    }

    public get angreDeg(): number {
        return this.angleRad * 180 / Math.PI;
    }

    constructor();
    constructor(x: number, y: number);
    constructor(vector: VectorLike);
    constructor(xOrVector?: number | any, y?: number) {
        if (typeof xOrVector === 'number') {
            this.x = xOrVector;
            this.y = y!;
        } else if (xOrVector?.type === 'Vector') {
            this.x = xOrVector.x;
            this.y = xOrVector.y;
        } else if (xOrVector?.type === 'Dimension') {
            this.x = (xOrVector as Dimension).width;
            this.y = (xOrVector as Dimension).height;
        } else {
            this.x = 0;
            this.y = 0;
        }
    }

    public static add(a: VectorLike, b: VectorLike): Vector {
        return new Vector(a).add(b);
    }

    public static subtract(a: VectorLike, b: VectorLike): Vector {
        return new Vector(a).subtract(b);
    }

    public static scale(a: VectorLike, s: number): Vector {
        return new Vector(a).scale(s);
    }

    public static multipy(a: VectorLike, b: VectorLike): number {
        return a.x * b.x + a.y * b.y;
    }

    public static normalize(a: VectorLike): Vector {
        return new Vector(a).normalize();
    }

    public add(b: VectorLike) {
        this.x += b.x;
        this.y += b.y;
        return this;
    }

    public subtract(b: VectorLike) {
        this.x -= b.x;
        this.y -= b.y;
        return this;
    }

    public scale(s: number) {
        this.x *= s;
        this.y *= s;
        return this;
    }

    public normalize() {
        this.scale(1 / this.magnitude);
        return this;
    }
}

export class Dimension implements VectorLike, DimensionLike, Serializable {
    type = 'Dimension';
    public width: number;
    public height: number;

    public get x(): number {
        return this.width;
    }
    public get y(): number {
        return this.height;
    }

    constructor();
    constructor(width: number, height: number);
    constructor(vectorLike: VectorLike);
    constructor(widthOrVectorLike?: number | any, height?: number) {
        if (typeof widthOrVectorLike === 'number') {
            this.width = widthOrVectorLike;
            this.height = height!;
        } else if (widthOrVectorLike?.type === 'Dimension') {
            this.width = widthOrVectorLike.width;
            this.height = widthOrVectorLike.height;
        } else if (widthOrVectorLike?.type === 'Vector') {
            this.width = widthOrVectorLike.x;
            this.height = widthOrVectorLike.y;
        } else {
            this.width = 0;
            this.height = 0;
        }
    }
}

export class Rectangle implements VectorLike, DimensionLike, Serializable {
    type = 'Rectangle';
    public position: Vector;
    public dimension: Dimension;

    public get x(): number {
        return this.position.x;
    }
    public get y(): number {
        return this.position.y;
    }
    public get width(): number {
        return this.dimension.width;
    }
    public get height(): number {
        return this.dimension.height;
    }
    public get topLeft(): Vector {
        return new Vector(this.position);
    }
    public get topRight(): Vector {
        return Vector.add(this.position, new Vector(this.dimension.x, 0));
    }
    public get bottomLeft(): Vector {
        return Vector.add(this.position, new Vector(0, this.dimension.y));
    }
    public get bottomRight(): Vector {
        return Vector.add(this.position, this.dimension);
    }
    public get corners(): Vector[] {
        return [this.topLeft, this.topRight, this.bottomLeft, this.bottomRight];
    }
    public get middle(): Vector {
        return new Vector(this.x + this.width / 2, this.y + this.height / 2);
    }
    public set middle(v: Vector) {
        this.position = Vector.subtract(v, new Vector(this.dimension).scale(0.5));
    }

    constructor();
    constructor(x: number, y: number, width: number, height: number);
    constructor(rectangle: Rectangle);
    constructor(vector: Vector, dimenstion: Dimension);
    constructor(rectangle: { position: VectorLike, dimension: DimensionLike });
    constructor(...args: any[]) {
        if (typeof args[0] === 'number') {
            this.position = new Vector(args[0], args[1]);
            this.dimension = new Dimension(args[2], args[3]);
        } else if (args[0]?.type === 'Vector') {
            this.position = new Vector(args[0]);
            this.dimension = new Dimension(args[1]);
        } else if (args[0]) {
            this.position = new Vector(args[0].position.x ,args[0].position.y);
            this.dimension = new Dimension(args[0].dimension.width, args[0].dimension.height);
        } else {
            this.position = new Vector();
            this.dimension = new Dimension();
        }
    }

    public static contains(r: Rectangle, v: Vector): boolean {
        return r.contains(v);
    }

    public contains(v: Vector): boolean {
        const bottomRight = this.bottomRight;
        return (v.x >= this.position.x && v.y >= this.position.y) && (v.x <= bottomRight.x && v.y <= bottomRight.y);
    }

    public static intersects(a: Rectangle, b: Rectangle): boolean {
        const first = b.x <= a.x && a.x < b.bottomRight.x || a.x <= b.x && b.x < a.bottomRight.x;
        const second = b.y <= a.y && a.y < b.bottomRight.y || a.y <= b.y && b.y < a.bottomRight.y;
        return first && second;
    }

    public intersects(b: Rectangle): boolean {
        return Rectangle.intersects(this, b);
    }

    public static offset(r: Rectangle, v: Vector): Rectangle {
        return new Rectangle(r).offset(v);
    }

    public offset(v: Vector): Rectangle {
        this.position.add(v);
        return this;
    }
}

export class Line {
    type = 'Line';
    public start: Vector;
    public end: Vector;

    public get middle(): Vector {
        return Vector.add(this.start, this.end).scale(0.5);
    }

    public get boundingRectangle(): Rectangle {
        const topLeft = new Vector(Math.min(this.start.x, this.end.x), Math.min(this.start.y, this.end.y));
        const bottomRight = new Vector(Math.max(this.start.x, this.end.x), Math.max(this.start.y, this.end.y));
        const dimension = new Dimension(bottomRight.subtract(topLeft));
        return new Rectangle(topLeft, dimension);
    }

    public get v(): Vector {
        return Vector.subtract(this.end, this.start).normalize();
    }

    public get n(): Vector {
        return this.v.rotate90;
    }

    constructor();
    constructor(startX: number, startY: number, endX: number, endY: number);
    constructor(start: VectorLike, end: VectorLike);
    constructor(line: Line);
    constructor(...args: any[]) {
        if (typeof args[0] === 'number') {
            this.start = new Vector(args[0], args[1]);
            this.end = new Vector(args[2], args[3]);
        } else if (typeof args[0] === 'object') {
            if (args[0].type === 'Line') {
                this.start = new Vector(args[0].start);
                this.end = new Vector(args[0].end);
            } else {
                this.start = new Vector(args[0]);
                this.end = new Vector(args[1]);
            }
        } else {
            this.start = new Vector();
            this.end = new Vector();
        }
    }

    public offset(v: VectorLike): Line {
        this.start.add(v);
        this.end.add(v);
        return this;
    }

    public static offset(line: Line, v: VectorLike): Line {
        return new Line(line).offset(v);
    }

    public isPointOnLine(v: VectorLike): boolean {
        const boundingRect = this.boundingRectangle;
        const v2 = Vector.subtract(this.start, v);
        const scale = v2.x / boundingRect.dimension.x;
        return scale === v2.y / boundingRect.dimension.y;
    }

    public static isPointOnLine(line: Line, v: VectorLike): boolean {
        return line.isPointOnLine(v);
    }

    static logged = false;

    public static intersectionPoint(l1: Line, l2: Line): Vector {
        const A1 = l1.end.y - l1.start.y;
        const B1 = l1.start.x - l1.end.x;
        const C1 = l1.start.y * (l1.end.x - l1.start.x) - l1.start.x * (l1.end.y - l1.start.y);

        if (!Line.logged) {
            console.log(l1);
            console.log(`${A1}*x + ${B1}*y + ${C1} = 0`);
        }

        const A2 = l2.end.y - l2.start.y;
        const B2 = l2.start.x - l2.end.x;
        const C2 = l2.start.y * (l2.end.x - l2.start.x) - l2.start.x * (l2.end.y - l2.start.y);

        if (!Line.logged) {
            Line.logged = true;
            console.log(l2);
            console.log(`${A2}*x + ${B2}*y + ${C2} = 0`);
        }

        const x = ((B2 * C1 - B1 * C2) / (B1 * A2 - B2 * A1));
        const y = ((A2 * C1 - A1 * C2) / (A1 * B2 - A2 * B1));

        return new Vector(x, y);
    }

    public intersectionPoint(line: Line): Vector {
        return Line.intersectionPoint(this, line);
    }

    public orientation(point: VectorLike): number {
        const val = (this.end.y - this.start.y) * (point.x - this.end.x) - (this.end.x - this.start.x) * (point.y - this.end.y);
        return Math.sign(val);
    }

    public onSegment(point: VectorLike): boolean {
        return (
            point.x <= Math.max(this.start.x, this.end.x) && point.x >= Math.min(this.start.x, this.end.x) &&
            point.y <= Math.max(this.start.y, this.end.y) && point.y >= Math.min(this.start.y, this.end.y)
        );
    }

    /** https://www.geeksforgeeks.org/check-if-two-given-line-segments-intersect */
    public static intersectsWith(l1: Line, l2: Line): boolean {
        const o1 = l1.orientation(l2.start);
        const o2 = l1.orientation(l2.end);
        const o3 = l2.orientation(l1.start);
        const o4 = l2.orientation(l1.end);

        if (o1 != o2 && o3 != o4) return true;
        if (o1 == 0 && l1.onSegment(l2.start)) return true;
        if (o2 == 0 && l1.onSegment(l2.end)) return true;
        if (o3 == 0 && l2.onSegment(l1.start)) return true;
        if (o4 == 0 && l2.onSegment(l1.end)) return true;

        return false;
    }

    public intersectsWith(l2: Line): boolean {
        return Line.intersectsWith(this, l2);
    }

    public intersectsWithRectangle(rect: Rectangle): boolean {
        return this.intersectsWith(new Line(rect.topLeft, rect.topRight)) ||
            this.intersectsWith(new Line(rect.topLeft, rect.bottomLeft)) ||
            this.intersectsWith(new Line(rect.bottomLeft, rect.bottomRight)) ||
            this.intersectsWith(new Line(rect.topRight, rect.bottomRight));
    }

    public intersectionPointWithRectangle(rect: Rectangle): Vector | undefined {
        const lines = [
            new Line(rect.topLeft, rect.topRight),
            new Line(rect.topLeft, rect.bottomLeft),
            new Line(rect.bottomLeft, rect.bottomRight),
            new Line(rect.topRight, rect.bottomRight)
        ];
        const points = lines.filter(line => {
            return this.intersectsWith(line);
        }).map(line => {
            return this.intersectionPoint(line);
        });
        points.sort((a, b) => {
            return Vector.subtract(a, this.start).magnitude - Vector.subtract(b, this.start).magnitude;
        });
        return points[0];
    }
}

Serializer.deserializers['Vector'] = (obj: any) => new Vector(obj);
Serializer.deserializers['Dimension'] = (obj: any) => new Dimension(obj);
Serializer.deserializers['Rectangle'] = (obj: any) => new Rectangle(obj);
Serializer.deserializers['Line'] = (obj: any) => new Line(obj);
