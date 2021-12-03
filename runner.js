const { createFFmpeg, fetchFile } = FFmpeg;

let ffmpeg;

/**
 * Called when the user asks to convert the video.
 *
 * Uses the form values from the page to determine FPS, and size.
 */
const transcode = async () => {
  if (!uploadInput.value) {
    message.innerHTML = "ファイルを選択してください。";
    return
  }
  if (!ffmpeg) {
    ffmpeg = createFFmpeg({ corePath: './lib/ffmpeg-core.js', log: false, progress: p => displayProgress(p) });
  }

  ffmpeg.setLogger(({ type, message }) => {
    if (type == "fferr") {
      detailMessage.innerHTML = message;
    }
  });

  const scalePercent = parseInt(scaleSlider.value);
  const fps = parseInt(fpsSlider.value);
  const { name } = uploadInput.files[0];
  outputImage.classList.add('hidden');
  convertButton.disabled = true;
  uploadInput.disabled = true;
  message.innerHTML = 'ffmpeg-core.jsを読込中';
  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }
  ffmpeg.FS('writeFile', name, await fetchFile(uploadInput.files[0]));
  message.innerHTML = '変換中…';
  let filter_complex = "fps=" + fps + ",scale=iw/100*" + scalePercent + ":-1:flags=lanczos";
  if (isHighQuality) {
    filter_complex = "[0:v] fps=" + fps + ",scale=iw/100*" + scalePercent + ":-1:flags=lanczos,split [a][b];[a] palettegen [p];[b][p] paletteuse=dither=sierra2"
  }
  await ffmpeg.run('-i', name, '-filter_complex', filter_complex, '-loop', (isLoop ? '0' : '-1'), 'output.gif');

  message.innerHTML = '変換完了';
  const data = ffmpeg.FS('readFile', 'output.gif');

  outputImage.src = URL.createObjectURL(new Blob([data.buffer], { type: 'image/gif' }));
  outputImage.classList.remove('hidden');
  convertButton.disabled = false;
  uploadInput.disabled = false;
}

function displayProgress(progress) {
  console.log(progress)
  convertButton.innerText = '変換中…' + Math.round(100 * progress.ratio) + '%'

  if (progress.ratio >= 1) {
    setTimeout(
      function () {
        convertButton.innerText = 'GIF画像に変換'
      },
      1000
    )
  }
}

const message = document.getElementById('status-box');
const detailMessage = document.getElementById('detail-message');
const fpsSlider = document.getElementById('fps');
const scaleSlider = document.getElementById('scale');
const isLoop = document.getElementById('loop').checked;
const isHighQuality = document.getElementById('priority2').checked;

const outputImage = document.getElementById('output-image');

const convertButton = document.getElementById('convert-button');
convertButton.addEventListener('click', transcode, false);

const uploadInput = document.getElementById("upload-input");

// const cancel = () => {
//   try {
//     ffmpeg.exit();
//   } catch (e) { }
//   ffmpeg = null;
// }
