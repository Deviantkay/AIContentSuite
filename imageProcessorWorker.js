// Image Processing Web Worker

self.onmessage = async function(e) {
    const { fileDataUrl, options, operationId, fileName, taskType, originalFileType } = e.data;
    
    try {
        // Convert data URL to image
        const response = await fetch(fileDataUrl);
        const blob = await response.blob();
        const imageBitmap = await createImageBitmap(blob);
        
        let resultBlob;
        
        if (taskType === 'autocrop') {
            resultBlob = await autoCropImage(imageBitmap, options);
        } else if (taskType === 'resize') {
            resultBlob = await resizeImage(imageBitmap, options);
        } else {
            throw new Error(`Unknown task type: ${taskType}`);
        }
        
        self.postMessage({
            success: true,
            blob: resultBlob,
            operationId: operationId
        });
        
    } catch (error) {
        self.postMessage({
            success: false,
            error: error.message,
            operationId: operationId
        });
    }
};

async function autoCropImage(imageBitmap, options) {
    const { targetAspectRatio, outputFormat = 'image/jpeg', jpegQuality = 0.92 } = options;
    
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    if (isNaN(targetAspectRatio) || targetAspectRatio <= 0) {
        // Free form - no cropping, just format conversion
        canvas.width = imageBitmap.width;
        canvas.height = imageBitmap.height;
        ctx.drawImage(imageBitmap, 0, 0);
    } else {
        // Calculate crop dimensions
        let srcX = 0, srcY = 0, srcW = imageBitmap.width, srcH = imageBitmap.height;
        const currentAR = srcW / srcH;
        
        if (currentAR > targetAspectRatio) {
            // Image is wider than target, crop width
            srcW = srcH * targetAspectRatio;
            srcX = (imageBitmap.width - srcW) / 2;
        } else if (currentAR < targetAspectRatio) {
            // Image is taller than target, crop height
            srcH = srcW / targetAspectRatio;
            srcY = (imageBitmap.height - srcH) / 2;
        }
        
        srcW = Math.max(1, Math.round(srcW));
        srcH = Math.max(1, Math.round(srcH));
        srcX = Math.round(srcX);
        srcY = Math.round(srcY);
        
        canvas.width = srcW;
        canvas.height = srcH;
        ctx.drawImage(imageBitmap, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
    }
    
    const qualityParam = outputFormat === 'image/jpeg' ? jpegQuality : undefined;
    return await canvas.convertToBlob({ type: outputFormat, quality: qualityParam });
}

async function resizeImage(imageBitmap, options) {
    const { 
        mode, 
        targetWidth, 
        targetHeight, 
        percentage, 
        maintainAspectRatio, 
        outputFormat = 'image/jpeg', 
        jpegQuality = 0.92 
    } = options;
    
    let finalWidth = imageBitmap.width;
    let finalHeight = imageBitmap.height;
    const originalAspectRatio = imageBitmap.width / imageBitmap.height;
    
    if (mode === 'dimensions') {
        const tw = targetWidth ? parseInt(targetWidth) : 0;
        const th = targetHeight ? parseInt(targetHeight) : 0;
        
        if (maintainAspectRatio) {
            if (tw && th) {
                finalWidth = tw;
                finalHeight = Math.round(tw / originalAspectRatio);
                if (finalHeight > th && th > 0) {
                    finalHeight = th;
                    finalWidth = Math.round(th * originalAspectRatio);
                }
            } else if (tw) {
                finalWidth = tw;
                finalHeight = Math.round(tw / originalAspectRatio);
            } else if (th) {
                finalHeight = th;
                finalWidth = Math.round(th * originalAspectRatio);
            }
        } else {
            if (tw) finalWidth = tw;
            if (th) finalHeight = th;
        }
    } else if (mode === 'percentage') {
        const scale = (percentage ? parseInt(percentage) : 100) / 100;
        if (scale <= 0) {
            throw new Error('Percentage must be > 0.');
        }
        finalWidth = Math.round(imageBitmap.width * scale);
        finalHeight = Math.round(imageBitmap.height * scale);
    }
    
    finalWidth = Math.max(1, finalWidth);
    finalHeight = Math.max(1, finalHeight);
    
    const canvas = new OffscreenCanvas(finalWidth, finalHeight);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imageBitmap, 0, 0, finalWidth, finalHeight);
    
    const qualityParam = outputFormat === 'image/jpeg' ? jpegQuality : undefined;
    return await canvas.convertToBlob({ type: outputFormat, quality: qualityParam });
}