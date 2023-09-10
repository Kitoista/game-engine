import { Component } from "../component";
import { Serializer } from "../serialize";

export class Nurse extends Component {
    type = 'Nurse';

    
}

Serializer.deserializers['Nurse'] = Component.deserialize(Nurse);
