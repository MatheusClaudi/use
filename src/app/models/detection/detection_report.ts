import { DetectionAction } from '../enum/detection_action';


export class DetectionReport{

    action: DetectionAction;
    label: string;
    previousNumberObjects: number;
    newNumberObjects: number;
    moment: Date;

    makeEntryReport(label, previousNumberObjects, newNumberObjects, moment){
        this.action = DetectionAction.ENTRY;
        this.label = label;
        this.previousNumberObjects = previousNumberObjects;
        this.newNumberObjects = newNumberObjects;
        this.moment = moment;
    }   

    makeExitReport(label, previousNumberObjects, newNumberObjects,  moment){
        this.action = DetectionAction.EXIT;
        this.label = label;
        this.previousNumberObjects = previousNumberObjects;
        this.newNumberObjects = newNumberObjects;
        this.moment = moment;
    }
}