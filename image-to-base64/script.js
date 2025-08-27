    const imageInput = document.getElementById('imageInput');
    const previewImage = document.getElementById('previewImage');
    const base64Output = document.getElementById('base64Output');

    imageInput.addEventListener('change', () => {
      const file = imageInput.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        previewImage.src = reader.result;
        base64Output.value = reader.result;
      };
      reader.readAsDataURL(file);
    });
