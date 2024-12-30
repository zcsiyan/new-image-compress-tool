document.addEventListener('DOMContentLoaded', function() {
    const imageInput = document.getElementById('imageInput');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const widthInput = document.getElementById('width');
    const heightInput = document.getElementById('height');
    const maintainRatio = document.getElementById('maintainRatio');
    const imagesList = document.querySelector('.images-list');
    const compressAllBtn = document.getElementById('compressAllBtn');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const outputFormat = document.getElementById('outputFormat');

    let images = [];

    // 添加支持的图片格式配置
    const supportedFormats = {
        'image/jpeg': {
            extension: 'jpg',
            mimeType: 'image/jpeg',
            qualitySupport: true,
            description: '适合照片，体积小'
        },
        'image/png': {
            extension: 'png',
            mimeType: 'image/png',
            qualitySupport: false,
            description: '支持透明背景，无损压缩'
        },
        'image/webp': {
            extension: 'webp',
            mimeType: 'image/webp',
            qualitySupport: true,
            description: '更高压缩率，新一代格式'
        },
        'image/gif': {
            extension: 'gif',
            mimeType: 'image/gif',
            qualitySupport: false,
            description: '支持动画，适合简单图像'
        },
        'image/bmp': {
            extension: 'bmp',
            mimeType: 'image/bmp',
            qualitySupport: false,
            description: '无压缩，完整保真'
        },
        'image/tiff': {
            extension: 'tiff',
            mimeType: 'image/tiff',
            qualitySupport: true,
            description: '专业图像，支持多页面'
        }
    };

    // 更新质量显示
    qualitySlider.addEventListener('input', function() {
        qualityValue.textContent = this.value;
    });

    // 监听文件选择
    imageInput.addEventListener('change', handleFiles);
    
    // 拖拽功能
    document.body.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    document.body.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleFiles({ target: { files: e.dataTransfer.files } });
    });

    function handleFiles(e) {
        const supportedTypes = Object.keys(supportedFormats);
        const files = Array.from(e.target.files).filter(file => {
            const isSupported = supportedTypes.includes(file.type);
            if (!isSupported) {
                console.warn(`不支持的文件类型: ${file.type}`);
            }
            return isSupported;
        });

        if (files.length === 0) {
            alert('请选择支持的图片格式文件：JPG, PNG, WebP, GIF, BMP, TIFF');
            return;
        }

        images = images.concat(files.map(file => ({
            file,
            id: Date.now() + Math.random(),
            status: 'pending',
            compressed: null,
            originalFormat: file.type
        })));

        updateImagesList();
        compressAllBtn.disabled = false;
    }

    function updateImagesList() {
        imagesList.innerHTML = images.map(image => `
            <div class="image-item" data-id="${image.id}">
                <img src="${image.preview || '#'}" class="image-preview-small" alt="预览">
                <div class="image-info">
                    <div class="image-name">${image.file.name}</div>
                    <div class="image-status">
                        原始大小: ${(image.file.size / 1024).toFixed(2)} KB
                        ${image.compressed && image.compressed.size ? `<br>压缩后: ${(image.compressed.size / 1024).toFixed(2)} KB` : ''}
                    </div>
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${image.status === 'completed' ? '100%' : '0'}"></div>
                    </div>
                </div>
                <div class="image-actions">
                    <button class="action-button" data-action="compress" data-id="${image.id}"
                        ${image.status === 'completed' ? 'disabled' : ''}>
                        ${image.status === 'completed' ? '已压缩' : '压缩'}
                    </button>
                    ${image.compressed && image.compressed.url ? `
                        <button class="action-button" data-action="download" data-id="${image.id}">下载</button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // 添加事件监听器
        const buttons = imagesList.querySelectorAll('button[data-action]');
        buttons.forEach(button => {
            button.addEventListener('click', function() {
                const action = this.dataset.action;
                const id = parseFloat(this.dataset.id);
                if (action === 'compress') {
                    compressImage(id);
                } else if (action === 'download') {
                    downloadImage(id);
                }
            });
        });

        // 生成预览图
        images.forEach(image => {
            if (!image.preview) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    image.preview = e.target.result;
                    updateImagesList();
                };
                reader.readAsDataURL(image.file);
            }
        });
    }

    // 压缩单张图片
    window.compressImage = async function(id) {
        try {
            const image = images.find(img => Math.abs(img.id - id) < Number.EPSILON);
            if (!image) {
                console.error('找不到图片');
                return;
            }

            // 显示压缩进度
            const progressBar = document.querySelector(`[data-id="${id}"] .progress-bar-fill`);
            if (progressBar) {
                progressBar.style.width = '50%';
            }

            const result = await compressImageFile(image.file);
            if (!result || !result.url) {
                throw new Error('压缩失败');
            }

            image.compressed = result;
            image.status = 'completed';
            
            // 更新进度条
            if (progressBar) {
                progressBar.style.width = '100%';
            }

            updateImagesList();
            checkAllCompleted();

        } catch (error) {
            console.error('压缩图片时出错:', error);
            alert('压缩图片时出现错误，请重试');
        }
    };

    // 压缩所有图片
    compressAllBtn.addEventListener('click', async function() {
        this.disabled = true;
        for (let image of images) {
            if (image.status !== 'completed') {
                await compressImage(image.id);
            }
        }
    });

    // 检查浏览器是否支持 WebP
    function checkWebPSupport() {
        const canvas = document.createElement('canvas');
        if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
            return true;
        }
        // 如果不支持 WebP，移除该选项
        const webpOption = outputFormat.querySelector('option[value="image/webp"]');
        if (webpOption) {
            webpOption.remove();
        }
        return false;
    }
    checkWebPSupport();

    // 修改 compressImageFile 函数
    async function compressImageFile(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    let width = parseInt(widthInput.value);
                    let height = parseInt(heightInput.value);

                    if (maintainRatio.checked) {
                        const ratio = img.width / img.height;
                        if (width / height > ratio) {
                            width = height * ratio;
                        } else {
                            height = width / ratio;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // 处理背景
                    const format = outputFormat.value;
                    if (format === 'image/png' || format === 'image/gif') {
                        ctx.clearRect(0, 0, width, height);
                    } else {
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, width, height);
                    }

                    ctx.drawImage(img, 0, 0, width, height);

                    // 根据不同格式设置不同的压缩参数
                    const formatConfig = supportedFormats[format];
                    let quality = formatConfig.qualitySupport ? qualitySlider.value / 100 : 1;
                    
                    const compressedDataUrl = canvas.toDataURL(format, quality);
                    const compressedSize = Math.round((compressedDataUrl.length - 22) * 3 / 4);

                    resolve({
                        url: compressedDataUrl,
                        size: compressedSize,
                        extension: formatConfig.extension,
                        mimeType: formatConfig.mimeType
                    });
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // 修改下载单张图片函数
    window.downloadImage = async function(id) {
        try {
            const image = images.find(img => Math.abs(img.id - id) < Number.EPSILON);
            if (!image) {
                console.error('找不到图片');
                return;
            }

            if (!image.compressed || !image.compressed.url) {
                console.error('图片未压缩或压缩数据不完整');
                alert('请先压缩图片');
                return;
            }

            // 创建新的 JSZip 实例
            const zip = new JSZip();
            
            // 从 base64 URL 中提取数据
            const base64Data = image.compressed.url.split(',')[1];
            const extension = image.compressed.extension;
            const fileName = image.file.name.replace(/\.[^/.]+$/, '') + '_compressed.' + extension;
            
            // 添加文件到 zip
            zip.file(fileName, base64Data, {base64: true});

            // 生成 zip 文件
            const content = await zip.generateAsync({
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: {
                    level: 9
                }
            });

            // 创建下载链接
            const downloadUrl = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;  // 单个文件下载时直接使用文件名，不需要zip后缀
            
            // 触发下载
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 清理 URL 对象
            setTimeout(() => {
                URL.revokeObjectURL(downloadUrl);
            }, 1000);

        } catch (error) {
            console.error('下载图片时出错:', error);
            alert('下载图片时出现错误，请重试');
        }
    };

    // 修改打包下载函数
    downloadAllBtn.addEventListener('click', async function() {
        try {
            // 禁用按钮，防止重复点击
            this.disabled = true;
            
            // 创建新的 JSZip 实例
            const zip = new JSZip();
            
            // 添加所有压缩后的图片到 zip
            for (const image of images) {
                if (image.compressed && image.compressed.url) {
                    // 从 base64 URL 中提取数据
                    const base64Data = image.compressed.url.split(',')[1];
                    const extension = image.compressed.extension;
                    const fileName = image.file.name.replace(/\.[^/.]+$/, '') + '_compressed.' + extension;
                    
                    // 添加文件到 zip
                    zip.file(fileName, base64Data, {base64: true});
                }
            }

            // 生成 zip 文件
            const content = await zip.generateAsync({
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: {
                    level: 9
                }
            });

            // 创建下载链接
            const downloadUrl = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = "compressed_images.zip";
            
            // 触发下载
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 清理 URL 对象
            setTimeout(() => {
                URL.revokeObjectURL(downloadUrl);
            }, 1000);

        } catch (error) {
            console.error('打包下载出错:', error);
            alert('打包下载时出现错误，请重试');
        } finally {
            // 重新启用按钮
            this.disabled = false;
        }
    });

    function checkAllCompleted() {
        const allCompleted = images.every(img => img.status === 'completed');
        downloadAllBtn.disabled = !allCompleted;
    }

    // 检查浏览器对各种格式的支持
    function checkFormatSupport() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const formatSelect = document.getElementById('outputFormat');
        
        Object.keys(supportedFormats).forEach(format => {
            const isSupported = canvas.toDataURL(format).indexOf(`data:${format}`) === 0;
            if (!isSupported) {
                const option = formatSelect.querySelector(`option[value="${format}"]`);
                if (option) {
                    option.disabled = true;
                    option.text += ' (浏览器不支持)';
                }
            }
        });
    }

    checkFormatSupport();
}); 