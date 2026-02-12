const base64Input = document.getElementById('base64Input');
const outputImage = document.getElementById('outputImage');
const info = document.getElementById('info');
const downloadBtn = document.getElementById('downloadBtn');

let lastDataUrl = '';
let lastMimeType = '';

function detectMimeAndConvert(str) {
  let mimeType = '';
  let base64Data = '';

  if (str.startsWith('data:')) {
    const matches = str.match(/^data:(.*?);base64,(.*)$/);
    if (matches) {
      mimeType = matches[1];
      base64Data = matches[2];
    }
  } else {
    base64Data = str.trim();
    try {
      const binary = atob(base64Data.substring(0, 50));
      const bytes = Array.from(binary).map(ch => ch.charCodeAt(0));
      if (bytes[0] === 0xFF && bytes[1] === 0xD8) mimeType = 'image/jpeg';
      else if (bytes[0] === 0x89 && bytes[1] === 0x50) mimeType = 'image/png';
      else if (bytes[0] === 0x47 && bytes[1] === 0x49) mimeType = 'image/gif';
      else if (bytes[0] === 0x42 && bytes[1] === 0x4D) mimeType = 'image/bmp';
      else mimeType = 'application/octet-stream';
    } catch {
      info.textContent = 'Invalid Base64 input.';
      return;
    }
  }

  const dataUrl = `data:${mimeType};base64,${base64Data}`;
  outputImage.src = dataUrl;
  outputImage.style.display = 'block';
  info.textContent = `MIME Type: ${mimeType} (${str.startsWith('data:') ? 'Data URL' : 'Raw Base64'})`;

  lastDataUrl = dataUrl;
  lastMimeType = mimeType;

  downloadBtn.style.display = 'inline-block';
}

const mimeToExt = {
  'image/png': 'png',
  'image/apng': 'apng',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/pjpeg': 'jpg',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/x-bmp': 'bmp',
  'image/x-ms-bmp': 'bmp',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/tiff': 'tif',
  'image/x-tiff': 'tif',
  'image/svg+xml': 'svg',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
  'image/vnd.wap.wbmp': 'wbmp'
};

downloadBtn.addEventListener('click', () => {
  if (!lastDataUrl) return;
  const ext = mimeToExt[lastMimeType?.toLowerCase()] || 'bin';
  const a = document.createElement('a');
  a.href = lastDataUrl;
  a.download = `converted-image.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
});

base64Input.addEventListener('input', () => {
  const val = base64Input.value.trim();
  if (val.length > 0) {
    detectMimeAndConvert(val);
  } else {
    outputImage.style.display = 'none';
    info.textContent = '';
    downloadBtn.style.display = 'none';
  }
});
