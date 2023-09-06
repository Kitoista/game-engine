export interface Serializable {
    type: string;

    serialize?(): string;
}

export class Serializer {

    static deserializers: {
        [type: string]: (str: string) => any
    } = {};

    static serialize(obj: any): any {
        let toStringify: any = undefined;
        switch (typeof obj) {
            case 'undefined':
            case 'number':
            case 'string':
            case 'boolean': toStringify = obj; break;
            case 'object': {
                if (obj === null) {
                    toStringify = null;
                } else if (Array.isArray(obj)) {
                    toStringify = obj.map(obj => Serializer.serialize(obj));
                } else if (obj.serialize) {
                    toStringify = obj.serialize();
                } else {
                    toStringify = {};
                    Object.keys(obj).forEach(key => toStringify[key] = Serializer.serialize(obj[key]));
                }
                break;
            }
        }
        return toStringify;
    }

    static deserialize(json: any): any {
        switch (typeof json) {
            case 'undefined':
            case 'number':
            case 'string':
            case 'boolean': return json;
            case 'object': {
                if (json === null) {
                    return null;
                } else if (Array.isArray(json)) {
                    return json.map(obj => Serializer.deserialize(obj));
                } else if (json.type && Serializer.deserializers[json.type]) {
                    return Serializer.deserializers[json.type](json);
                } else {
                    const obj: any = {};
                    Object.keys(json).forEach(key => obj[key] = Serializer.deserialize(json[key]));
                    return obj;
                }
            }
        }
        return json;
    }

}
