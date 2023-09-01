export interface HasType {
    type: string;
}

export interface VectorLike {
    x: number;
    y: number;
}

export interface DimensionLike {
    width: number;
    height: number;
}

export class Vector implements VectorLike, HasType {
    type = 'Vector';
    public x: number;
    public y: number;

    public get magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
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
}

export class Dimension implements VectorLike, DimensionLike, HasType {
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

export class Rectangle implements VectorLike, DimensionLike, HasType {
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
    public get end(): Vector {
        return Vector.add(this.position, this.dimension);
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

    public static intersects(a: Rectangle, b: Rectangle): boolean {
        const first = b.x <= a.x && a.x < b.end.x || a.x <= b.x && b.x < a.end.x;
        const second = b.y <= a.y && a.y < b.end.y || a.y <= b.y && b.y < a.end.y;
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
