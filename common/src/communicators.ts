import { interval, timer, ReplaySubject, BehaviorSubject, Observable, take, switchMap } from "rxjs";

export const mobInputEventTypes = [
    'left', 'right', 'up', 'down'
] as const;
export type MobInputEventType = typeof mobInputEventTypes[number];

export class MobInputEvent { 
    type = 'MobInputEvent';

    public constructor(public eventName: MobInputEventType, public status: boolean, public objectId: number) {
    }
}

export class ServerCommunicator {
    
}

type Response<T> = { status: 'pingDelay' } | { status: 'serverResponse'; data?: T; }

export type GetRequest<T> = (url: string, options?: {}) => Observable<T>;
export type PostRequest<T> = (url: string, body: any | null, options?: {}) => Observable<T>;

export class ClientCommunicator {
    static instance: ClientCommunicator;

    private pinger = interval(1000);
    private _ping$ = new BehaviorSubject<number>(0);
    ping$ = this._ping$.asObservable();

    _get!: <T>(url: string, options?: {}) => Observable<T>;
    _post!: <T>(url: string, body: any | null, options?: {}) => Observable<T>;

    get!: <T>(url: string, options?: {}) => Observable<Response<T>>;
    post!: <T>(url: string, body: any | null, options?: {}) => Observable<Response<T>>;

    constructor() {
        ClientCommunicator.instance = this;
    }

    registerGet(get: GetRequest<any>): void {
        this._get = (url, options) => get(`http://localhost:8000/${url}`, options);
        this.get = (url, options) => this.wrapPingDelay(this._get(url, options));
    }
    
    registerPost<T>(post: PostRequest<any>): void {
        this._post = (url, body, options) => post(`http://localhost:8000/${url}`, body, options);
        this.post = (url, body, options) => this.wrapPingDelay(this._post(url, body, options));
    }

    startPinging() {
        this.pinger.subscribe(() => {
            const timeA = Date.now();
            this._get('ping').subscribe(() => {
                const timeB = Date.now();
                this._ping$.next(timeB - timeA);
            });
        });
    }

    wrapPingDelay<T>(obs: Observable<T>): Observable<Response<T>> {
        const subject = new ReplaySubject<Response<T>>(1);

        this.ping$.pipe(
            take(1),
            switchMap(ping => timer(ping / 2))
        ).subscribe(() => subject.next({ status: 'pingDelay' }));

        obs.subscribe(res => subject.next({ status: 'serverResponse', data: res }));

        return subject.asObservable();
    }

    sendMobInputEvent(event: MobInputEvent): Observable<Response<void>> {
        return this.post('mob-input-event', event);
    }

}
