import ARR from './imgArr.js';

let infos = [];
let urlWithoutFaces = [];

const launchApp = (imgUrls, filename, filename2) => {
  Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('./models'),
  ]).then(start);

  const drawResult = (img, faces) => {
    if (faces.length < 0) {
      console.log('No face detected');
    } else {
      let canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      let ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 5;
      let len = faces.length;
      let face;
      for (let index = 0; index < len; index++) {
        face = faces[index].box;
        ctx.rect(face._x, face._y, face._width, face._height);
      }
      ctx.stroke();
      const gridItem = document.createElement('div');
      gridItem.style.position = 'relative';
      gridItem.classList.add('grid-item');
      gridItem.append(canvas);
      const container = document.getElementById('container');
      container.append(gridItem);
      document.body.append(container);
    }
  };
  const processImage = async (url, onReady) => {
    let img = await document.createElement('img');
    img.crossOrigin = 'anonymous';

    img.onload = async () => {
      try {
        let time = Date.now();
        //everything happen in this single line.
        //this is the only part of the code who need to be measured
        let faces = await faceapi.detectAllFaces(img);
        let processTime = Date.now() - time;
        if (faces.length > 0) {
          let imgObj = {
            url,
            nbFaces: faces.length,
            processTime: Math.round(processTime),
            processTimeByFace: Math.round(processTime / faces.length),
            w: img.width,
            h: img.height,
          };
          infos.push(imgObj);
          onReady(img, faces);
        } else {
          let imgObj = {
            url,
            w: img.width,
            h: img.height,
          };
          urlWithoutFaces.push(imgObj);
        }
      } catch (error) {
        console.log(error);
      } finally {
        onReady();
      }
    };
    img.src = url;
  };

  csvExport.onclick = () => {
    let csvHeader = '';
    Object.keys(infos[0]).forEach((item) => (csvHeader += item + ','));

    var csvFile = `${csvHeader}\n`;
    for (let i = 0; i < infos.length; i++) {
      csvFile = '\t' + csvFile;
      csvFile += Object.values(infos[i]).join(',') + '\n';
    }
    var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
    console.log(blob);
    if (navigator.msSaveBlob) {
      navigator.msSaveBlob(blob, filename);
    } else {
      var link = document.createElement('a');
      if (link.download !== undefined) {
        var url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  csvUrlWithoutFaces.onclick = () => {
    let csvHeader = '';
    Object.keys(urlWithoutFaces[0]).forEach((item) => (csvHeader += item + ','));

    var csvFile = `${csvHeader}\n`;
    for (let i = 0; i < urlWithoutFaces.length; i++) {
      csvFile = '\t' + csvFile;
      csvFile += Object.values(urlWithoutFaces[i]).join(',') + '\n';
    }
    var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) {
      navigator.msSaveBlob(blob, filename2);
    } else {
      var link = document.createElement('a');
      if (link.download !== undefined) {
        var url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename2);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  async function start() {
    console.log('Start Working');
    let processImageAndDrawResult = (url) => {
      processImage(url, (img, faces) => {
        // drawResult(img, faces);
        if (imgUrls.length != 0) {
          setTimeout(() => {
            processImageAndDrawResult(imgUrls.shift());
          }, 500);
        } else {
          console.log('FINISH');
        }
        console.log(infos, 'Detected faces');
        console.log(urlWithoutFaces, 'Not detected');
      });
    };
    processImageAndDrawResult(imgUrls.shift());
  }
};

const imageUpload = document.getElementById('img-loader-o');
const imageUploadM = document.getElementById('img-loader-m');
const imageUploadS = document.getElementById('img-loader-sm');
const csvExport = document.getElementById('csvExport');
const csvUrlWithoutFaces = document.getElementById('csvExportUrls');

imageUpload.addEventListener('click', () =>
  launchApp(ARR.bigSizeUrls, 'originalSize.csv', 'originalSizeUrls.csv')
);
imageUploadM.addEventListener('click', () =>
  launchApp(ARR.medSizeUrls, 'mediumSize.csv', 'mediumSizeUrls.csv')
);
imageUploadS.addEventListener('click', () =>
  launchApp(ARR.smallSizeUrls, 'smallSize.csv', 'smallSizeUrls.csv')
);
