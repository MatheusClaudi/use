import { Component, OnInit } from "@angular/core";
// Tensorflow imports
import * as tf from "@tensorflow/tfjs";
import { loadGraphModel } from "@tensorflow/tfjs-converter";
import { DetectionReport } from "src/app/models/detection/detection_report";
import { ToastService } from 'src/app/services/toast/toaster.service';

@Component({
  selector: "app-detectionv1",
  templateUrl: "./detectionv1.component.html",
  styleUrls: ["./detectionv1.component.css"],
})
export class Detectionv1Component implements OnInit {
  // tag responsable to show video from webcam
  private video: HTMLVideoElement;
  videoStream;
  // promisses to load video and canvas tags
  streamPromise: any = null;
  modelPromise: any = null;
  // execution identificators
  isVideoStreamReady: any = false;
  isModelReady: any = false;
  initFailMessage: any = "";
  buttonPressed: boolean = false;
  // model loaded
  model: any = null;
  continueWithPredictions = false;
  // video configurations
  videoRatio: any = 1;
  resultWidth: any = 0;
  resultHeight: any = 0;
  // reference to server that contains the model
  MODEL_URL: string = "";
  // peformance data
  framePerSecondAtual: number = 0;
  framePerSecondMax: number = 0;
  framePerSecondMin: number = 0;
  numPredictions: number = 0;
  // labelmap
  maping: Map<any, any> = new Map([
    [1, "Mouse"],
    [2, "Remote Control"],
  ]);

  confirmedObjectInScreenCount: Map<string, number>;
  currentObjectInScreenCount: Map<string, number>;
  detectionReports: Array<DetectionReport>;
  endDetection: boolean = false;

  constructor(public toastService: ToastService){

  }

  ngOnInit() {
    // when the page be open, use bellow reference to server as suggest
    this.MODEL_URL = "http://192.168.1.105/almir2/model.json";
    this.setToUse();
  }

  setToUse() {
    this.currentObjectInScreenCount = new Map();
    this.confirmedObjectInScreenCount = new Map();
    this.detectionReports = new Array();

    Array.from(this.maping.values()).forEach((value) => {
      this.currentObjectInScreenCount.set(value, 0);
      this.confirmedObjectInScreenCount.set(value, 0);
    });
  }

  // be activate when a user click a button, to send server address, and try init detection
  userPressedButton() {
    this.setToUse();
    this.buttonPressed = true;
    this.streamPromise = this.initWebcamStream();
    this.continueWithPredictions = true;
    this.loadModelAndDetection();
    this.endDetection = false;
  }

  // used to update report performance information
  framePerSecondMakeReport(frame: number) {
    this.framePerSecondAtual = frame;

    if (this.numPredictions == 0) {
      this.framePerSecondMin = frame;
      this.framePerSecondAtual = frame;
      this.numPredictions++;
    } else {
      if (this.framePerSecondMin > frame) {
        this.framePerSecondMin = frame;
      }
      if (this.framePerSecondMax < frame && this.numPredictions > 2) {
        this.framePerSecondMax = frame;
      }
      this.numPredictions++;
    }
  }

  initWebcamStream() {
    this.video = <HTMLVideoElement>document.getElementById("vid");
    // if the browser supports mediaDevices.getUserMedia API
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      return navigator.mediaDevices
        .getUserMedia({
          audio: false, // don't capture audio
          video: { facingMode: "environment" }, // use the rear camera if there is
        })
        .then((stream) => {
          // set <video> source as the webcam input
          let video = this.video;
          try {
            video.srcObject = stream;
            this.videoStream = stream;
          } catch (error) {
            // support older browsers
            video.src = URL.createObjectURL(stream);
            this.videoStream = stream;
          }
          /*
            model.detect uses tf.fromPixels to create tensors.
            tf.fromPixels api will get the <video> size from the width and height attributes,
              which means <video> width and height attributes needs to be set before called model.detect
            To make the <video> responsive, I get the initial video ratio when it's loaded (onloadedmetadata)
            Then addEventListener on resize, which will adjust the size but remain the ratio
            At last, resolve the Promise.
          */
          return new Promise((resolve, reject) => {
            // when video is loaded
            video.onloadedmetadata = () => {
              // calculate the video ratio
              this.videoRatio = video.offsetHeight / video.offsetWidth;
              // add event listener on resize to reset the <video> and <canvas> sizes
              window.addEventListener("resize", this.setResultSize);
              // set the initial size
              this.setResultSize();
              this.isVideoStreamReady = true;
              console.log("webcam stream initialized");
              resolve();
            };
          });
        })
        .catch((error) => {
          console.log("failed to initialize webcam stream", error);
          throw error;
        });
    } else {
      return Promise.reject(
        new Error("Your browser does not support mediaDevices.getUserMedia API")
      );
    }
  }

  stopStream() {
    this.buttonPressed = false;
    this.isVideoStreamReady = false;
    this.video.pause();
    this.video.src = null;
    this.continueWithPredictions = false;
    this.videoStream.getTracks()[0].stop();
    this.endDetection = true;
    console.log(this.detectionReports);
  }
  setResultSize() {
    this.video = <HTMLVideoElement>document.getElementById("vid");

    // get the current browser window size
    let clientWidth = document.documentElement.clientWidth;
    // set max width as 600
    this.resultWidth = Math.min(600, clientWidth);
    // set the height according to the video ratio
    this.resultHeight = this.resultWidth * this.videoRatio;
    // set <video> width and height
    /*
      Doesn't use vue binding :width and :height,
        because the initial value of resultWidth and resultHeight
        will affect the ratio got from the initWebcamStream()
    */
    let video = this.video;
    video.width = this.resultWidth;
    video.height = this.resultHeight;
  }

  loadCustomModel() {
    this.isModelReady = false;
    // load the model with loadGraphModel
    return loadGraphModel(this.MODEL_URL)
      .then((model) => {
        this.model = model;
        this.isModelReady = true;
        console.log("model loaded: ", model);
      })
      .catch((error) => {
        console.log("failed to load the model", error);
        throw error;
      });
  }

  async detectObjects() {
    if (!this.isModelReady) return;

    const tfImg = tf.browser.fromPixels(this.video);

    const smallImg = tf.image.resizeBilinear(tfImg, [300, 300]); // 600, 450

    const resized = tf.cast(smallImg, "float32");

    const tf4d = tf.tensor4d(
      Array.from(resized.dataSync()),
      [1, 300, 300, 3],
      "int32"
    ); // 600, 450

    var start = new Date().getTime();

    let predictions = await this.model.executeAsync({ image_tensor: tf4d }, [
      "detection_boxes",
      "num_detections",
      "detection_classes",
      "detection_scores",
    ]);

    var end = new Date().getTime();

    this.framePerSecondMakeReport(end - start);

    this.updateCounter(predictions);
    this.renderPredictionBoxes(predictions);
    tfImg.dispose();
    smallImg.dispose();
    resized.dispose();
    tf4d.dispose();
    requestAnimationFrame(() => {
      if (this.continueWithPredictions) {
        this.detectObjects();
      }
    });
  }

  updateCounter(predictions) {
    const scores = Array.from(predictions[3].dataSync());
    const classes = Array.from(predictions[2].dataSync());

    Array.from(this.maping.values()).forEach((value) => {
      this.currentObjectInScreenCount.set(value, 0);
    });

    scores.forEach((scoreO: number, i) => {
      if (scoreO > 0.75) {
        const label = this.maping.get(classes[i]);
        this.currentObjectInScreenCount.set(
          label,
          this.currentObjectInScreenCount.get(label) + 1
        );
      }
    });

    this.checkForCurretChanges();
  }

  checkForCurretChanges() {
    Array.from(this.maping.values()).forEach((value, i) => {
      let confirmedCount = this.confirmedObjectInScreenCount.get(value);
      let currentCount = this.currentObjectInScreenCount.get(value);

      let ref = currentCount - confirmedCount;
      if (ref > 0) {
        setTimeout(
          this.checkEntryValid,
          500,
          value,
          Math.abs(ref),
          this.confirmedObjectInScreenCount,
          this.currentObjectInScreenCount,
          this.detectionReports,
          this.toastService
        );
      }
      if (ref < 0) {
        setTimeout(
          this.checkExitValid,
          500,
          value,
          Math.abs(ref),
          this.confirmedObjectInScreenCount,
          this.currentObjectInScreenCount,
          this.detectionReports,
          this.toastService
        );
      }
    });
  }

  checkEntryValid(
    label,
    dif,
    confirmedObjectInScreenCount,
    currentObjectInScreenCount,
    detectionReports,
    toaster
  ) {
    let confirmedCount = confirmedObjectInScreenCount.get(label);
    let currentCount = currentObjectInScreenCount.get(label);

    let ref = currentCount - confirmedCount;
    if (ref > 0 && Math.abs(ref) >= dif) {
      confirmedObjectInScreenCount.set(label, confirmedCount + dif);
      let report = new DetectionReport();
      report.makeEntryReport(
        label,
        confirmedCount,
        confirmedCount + dif,
        new Date()
      );
      detectionReports.push(report);
      console.log("Entraram " + dif + " objetos");
      toaster.show('Entrada de ', {
        classname: 'bg-success text-light',
        delay: 2000 ,
        autohide: true,
        headertext: 'Entrada de ' + label + ' registrada.'
      });
    }
  }

  checkExitValid(
    label,
    dif,
    confirmedObjectInScreenCount,
    currentObjectInScreenCount,
    detectionReports,
    toaster
  ) {
    let confirmedCount = confirmedObjectInScreenCount.get(label);
    let currentCount = currentObjectInScreenCount.get(label);

    let ref = currentCount - confirmedCount;
    if (ref < 0 && Math.abs(ref) >= dif) {
      confirmedObjectInScreenCount.set(label, confirmedCount - dif);
      let report = new DetectionReport();
      report.makeExitReport(
        label,
        confirmedCount,
        confirmedCount - dif,
        new Date()
      );
      detectionReports.push(report);
      console.log("saiu");
  
      toaster.show("Saíram " + dif + " objetos", {
        classname: 'bg-danger text-light',
        delay: 2000 ,
        autohide: true,
        headertext: 'Saída de ' + label + ' registrada.'
      });
    }
  }

  newDetection() {
    window.location.reload();
  }

  loadModelAndDetection() {
    this.modelPromise = this.loadCustomModel();
    // wait for both stream and model promise finished then start detecting objects
    Promise.all([this.streamPromise, this.modelPromise])
      .then(() => {
        console.log("aa");
        this.detectObjects();
      })
      .catch((error) => {
        console.log("Failed to init stream and/or model: ");
        this.initFailMessage = error;
      });
  }

  renderPredictionBoxes(predictions) {
    const scores = Array.from(predictions[3].dataSync());
    const boxes = predictions[0].arraySync()[0];
    const classes = Array.from(predictions[2].dataSync());

    // get the context of canvas
    let canvas = <HTMLCanvasElement>document.getElementById("canvas");

    canvas.height = this.resultHeight;
    canvas.width = this.resultWidth;

    const ctx = canvas.getContext("2d");
    // clear the canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // draw results

    scores.forEach((scoreO: number, i) => {
      const minY = boxes[i][0] * 450;
      const minX = boxes[i][1] * 600;
      const maxY = boxes[i][2] * 450;
      const maxX = boxes[i][3] * 600;
      const score = scoreO * 100;
      const label = this.maping.get(classes[i]);

      if (score > 75) {
        ctx.beginPath();
        ctx.rect(minX, minY, maxX - minX, maxY - minY);
        ctx.lineWidth = 3;
        ctx.strokeStyle = "red";
        ctx.fillStyle = "red";
        ctx.stroke();
        ctx.shadowColor = "white";
        ctx.shadowBlur = 10;
        ctx.font = "14px Arial bold";
        ctx.fillText(
          `${score.toFixed(1)} - ${label}`,
          minX,
          minY > 10 ? minY - 5 : 10
        );
      }
    });
  }
}
