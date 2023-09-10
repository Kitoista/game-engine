import { Component } from "../component";
import { GameObject } from "../game-object";

export abstract class Interactable extends Component {
    type = 'Interactable';

    abstract canInteract(go: GameObject): boolean;

}
