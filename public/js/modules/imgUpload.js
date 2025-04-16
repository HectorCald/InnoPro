export function initializeImgUpload() {
    const view = document.querySelector('.imgUpload-view');
    if (!view) return;

    view.innerHTML = `
        <div class="upload-container">
            <h2>Subir Imagen</h2>
            <div class="upload-area" id="uploadArea">
                <i class="fas fa-cloud-upload-alt upload-icon"></i>
                <p class="upload-text">Arrastra y suelta tu imagen aquí o haz clic para seleccionar</p>
                <input type="file" id="fileInput" accept="image/*" style="display: none;">
            </div>
            <div class="image-preview">
                <img id="previewImage" src="" alt="Preview">
            </div>
            <div class="upload-progress">
                <div class="progress-bar"></div>
            </div>
            <button class="upload-btn" disabled>Subir Imagen</button>
        </div>
    `;

    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.querySelector('.image-preview');
    const previewImage = document.getElementById('previewImage');
    const uploadButton = document.querySelector('.upload-btn');
    const progressBar = document.querySelector('.progress-bar');

    // Eventos de arrastrar y soltar
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragging');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragging');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragging');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleFile(file);
        }
    });

    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    });

    uploadButton.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (file) {
            uploadButton.disabled = true;
            document.querySelector('.upload-progress').style.display = 'block';
            
            try {
                await subirImagen(file, (progress) => {
                    progressBar.style.width = `${progress}%`;
                });
                
                mostrarNotificacion('Imagen subida correctamente', 'success');
                resetUploadForm();
            } catch (error) {
                mostrarNotificacion('Error al subir la imagen', 'error');
            } finally {
                uploadButton.disabled = false;
                document.querySelector('.upload-progress').style.display = 'none';
            }
        }
    });

    function handleFile(file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB límite
            mostrarNotificacion('La imagen es demasiado grande. Máximo 5MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            previewContainer.style.display = 'block';
            uploadButton.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    function resetUploadForm() {
        fileInput.value = '';
        previewContainer.style.display = 'none';
        previewImage.src = '';
        uploadButton.disabled = true;
        progressBar.style.width = '0%';
    }
}

async function subirImagen(file, onProgress) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onloadend = async () => {
            try {
                const base64Data = reader.result;
                onProgress(50); // Simulación de progreso
                
                const response = await fetch('/subir-imagen', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nombre: file.name,
                        imagen: base64Data
                    })
                });
                
                const data = await response.json();
                onProgress(100);
                
                if (data.success) {
                    resolve(data);
                } else {
                    reject(new Error(data.error || 'Error al subir la imagen'));
                }
            } catch (error) {
                reject(error);
            }
        };
    });
}