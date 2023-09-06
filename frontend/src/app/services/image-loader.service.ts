import { Injectable } from "@angular/core";
import { Observable, ReplaySubject } from "rxjs";
import { Sprite } from "src/common/components";

@Injectable({
    providedIn: 'root'
})
export class ImageLoaderService {
    loadedImages: { [name: string]: any } = {};

    loadImages(sprites: Sprite[]): Observable<void> {
        const subject = new ReplaySubject<void>();
        let loadedCount = 0;
        sprites.forEach(sprite => {
            const img = new Image();
            this.loadedImages[sprite.name] = img;
            img.onload = () => {
                ++loadedCount;
                if (loadedCount === sprites.length) {
                    subject.next();
                }
            };
            img.src = sprite.src!;
        });
        if (sprites.length === 0) {
            subject.next();
        }
        return subject.asObservable();
    }
}
