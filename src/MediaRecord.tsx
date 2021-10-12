import React, {useRef, useState} from 'react';
import './MediaRecord.scss';

const MediaRecord = () => {

    const [isRecord, setIsRecord] = useState(false);

    let mediaSource = new MediaSource();
    mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
    let mediaRecorder: any;
    let recordedBlobs: any;
    let sourceBuffer: any;

    let vidRef = useRef(null) as any;
    let recRef = useRef(null) as any;



// window.isSecureContext could be used for Chrome
    // eslint-disable-next-line no-restricted-globals
    let isSecureOrigin = location.protocol === 'https:' ||
        // eslint-disable-next-line no-restricted-globals
        location.hostname === 'localhost';
    if (!isSecureOrigin) {
        alert('getUserMedia() must be run from a secure origin: HTTPS or localhost.' +
            '\n\nChanging protocol to HTTPS');
        // eslint-disable-next-line no-restricted-globals
        location.protocol = 'HTTPS';
    }

    let constraints = {
        audio: true,
        video: true
    };

    function handleSuccess(stream: any) {
        console.log('getUserMedia() got stream: ', stream);
        (window as any).stream = stream;
        recRef.srcObject = stream;
    }

    function handleError(error: any) {
        console.log('navigator.getUserMedia error: ', error);
        if (error.name === "NotAllowedError") {
            alert(`You need to allow access to your camera and microphone for this page.`);
        }
    }

    navigator.mediaDevices.getUserMedia(constraints).
    then(handleSuccess).catch(handleError);

    function handleSourceOpen(event: any) {
        console.log('MediaSource opened');
        sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
        console.log('Source buffer: ', sourceBuffer);
    }

    // vidRef.addEventListener('error', function(ev: any) {
    //     console.error('MediaRecording.recordedMedia.error()');
    //     alert('Your browser can not play\n\n' + vidRef.src
    //         + '\n\n media clip. event: ' + JSON.stringify(ev));
    // }, true);

    function handleDataAvailable(event: any) {
        if (event.data && event.data.size > 0) {
            recordedBlobs.push(event.data);
        }
    }

    function handleStop(event: any) {
        console.log('Recorder stopped: ', event);
    }

    function toggleRecording() {
        if (!isRecord) {
            startRecording();
        } else {
            stopRecording();
           setIsRecord(true)
        }
    }

    function startRecording() {
        recordedBlobs = [];
        let options = {mimeType: 'video/webm;codecs=vp9'};
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.log(options.mimeType + ' is not Supported');
            options = {mimeType: 'video/webm;codecs=vp8'};
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.log(options.mimeType + ' is not Supported');
                options = {mimeType: 'video/webm'};
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    console.log(options.mimeType + ' is not Supported');
                    options = {mimeType: ''};
                }
            }
        }
        try {
            mediaRecorder = new MediaRecorder((window as any).stream, options);
        } catch (e) {
            console.error('Exception while creating MediaRecorder: ' + e);
            alert('Exception while creating MediaRecorder: '
                + e + '. mimeType: ' + options.mimeType);
            return;
        }
        console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
        setIsRecord(false)
        mediaRecorder.onstop = handleStop;
        mediaRecorder.ondataavailable = handleDataAvailable;
        mediaRecorder.start(10); // collect 10ms of data
        console.log('MediaRecorder started', mediaRecorder);
    }

    function stopRecording() {
        mediaRecorder.stop();
        console.log('Recorded Blobs: ', recordedBlobs);
        vidRef.controls = true;
    }

    function play() {
        let superBuffer = new Blob(recordedBlobs, {type: 'video/webm'});
        vidRef.src = window.URL.createObjectURL(superBuffer);
        // workaround for non-seekable video taken from
        // https://bugs.chromium.org/p/chromium/issues/detail?id=642012#c23
        vidRef.addEventListener('loadedmetadata', function() {
            if (vidRef.duration === Infinity) {
                vidRef.currentTime = 1e101;
                vidRef.ontimeupdate = function() {
                    vidRef.currentTime = 0;
                    vidRef.ontimeupdate = function() {
                        delete vidRef.ontimeupdate;
                        vidRef.play();
                    };
                };
            }
        });
    }

    function download() {
        let blob = new Blob(recordedBlobs, {type: 'video/webm'});
        let url = window.URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'test.webm';
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    }
    return (<div className="layout">
        <div className="layout__video">
            <video className="video__player video__player--recorder"
                   id="js-video-recorder"
                   autoPlay
                   ref={recRef}
                   muted></video>
            <div className="video__buttons">
                <button className="video__buttons video__buttons--record"
                        id="js-button-record"
                        onClick={() => toggleRecording()}
                        >Start Recording</button>
                <button className="video__buttons video__buttons--play"
                        id="js-button-play"
                        onClick={() => play()}
                        >Play</button>
                <button className="video__buttons video__buttons--download"
                        id="js-button-download"
                        onClick={() => download()}
                        >Download</button>
            </div>
        </div>
        <div className="layout__video">
            <video className="video__player video__player--player" id="js-video-player" ref={vidRef} loop controls></video>
        </div>
    </div>)
}

export default MediaRecord;
