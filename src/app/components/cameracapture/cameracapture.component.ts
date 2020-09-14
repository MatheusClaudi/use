import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-cameracapture',
  templateUrl: './cameracapture.component.html',
  styleUrls: ['./cameracapture.component.css']
})
export class CameracaptureComponent implements OnInit {

  // tag responsable to show video from webcam
  private video: HTMLVideoElement;  
  
  // promisses to load video and canvas tags
  streamPromise: any =  null;
  // execution identificators
  isVideoStreamReady: any =  false;
  isModelReady: any =  false;
  initFailMessage: any =  '';

  // video configurations
  videoRatio: any = 1;
  resultWidth: any =  0;
  resultHeight: any =  0;

  constructor() { }

  ngOnInit(): void {
  }

  initWebcamStream () {
    
    this.video = <HTMLVideoElement> document.getElementById("vid")
    // if the browser supports mediaDevices.getUserMedia API
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      return navigator.mediaDevices.getUserMedia({
        audio: false, // don't capture audio
        video: { facingMode: 'environment' } // use the rear camera if there is
      })
        .then(stream => {
          // set <video> source as the webcam input
          let video = this.video
          try {
            video.srcObject = stream
          } catch (error) {
            // support older browsers
            video.src = URL.createObjectURL(stream)
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
              this.videoRatio = video.offsetHeight / video.offsetWidth
              // add event listener on resize to reset the <video> and <canvas> sizes
              window.addEventListener('resize', this.setResultSize)
              // set the initial size
              this.setResultSize()
              this.isVideoStreamReady = true
              console.log('webcam stream initialized')
              resolve()
            }
          })
        })
        .catch(error => {
          console.log('failed to initialize webcam stream', error)
          throw (error)
        })
    } else {
      return Promise.reject(new Error('Your browser does not support mediaDevices.getUserMedia API'))
    }
  }

  setResultSize () {

    this.video = <HTMLVideoElement> document.getElementById("vid")

    // get the current browser window size
    let clientWidth = document.documentElement.clientWidth
    // set max width as 600
    this.resultWidth = Math.min(600, clientWidth)
    // set the height according to the video ratio
    this.resultHeight = this.resultWidth * this.videoRatio
    // set <video> width and height
    /*
      Doesn't use vue binding :width and :height,
        because the initial value of resultWidth and resultHeight
        will affect the ratio got from the initWebcamStream()
    */
    let video = this.video
    video.width = this.resultWidth
    video.height = this.resultHeight
  }

}
