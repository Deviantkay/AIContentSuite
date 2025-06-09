document.addEventListener('DOMContentLoaded', () => {
    // --- Constants & Global State ---
    const CATEGORIES = [
        "Abstract", "Animals", "Arts & Culture", "Backgrounds & Textures", "Beauty & Fashion",
        "Buildings & Architecture", "Business & Finance", "Celebrations", "Education", "Emotions",
        "Environment", "Food & Drink", "Healthcare & Medicine", "Hobbies & Leisure", "Holidays",
        "Industrial", "Interiors", "Landscape & Nature", "Lifestyle", "Objects", "Parks & Outdoor",
        "People", "Plants & Flowers", "Religion & Spirituality", "Science & Technology", "Signs & Symbols",
        "Social Issues", "Sports", "Transportation", "Travel & Tourism", "Vintage"
    ];
    CATEGORIES.sort();
    const API_KEYS_STORAGE_KEY = 'aiContentSuite_apiKeys_gemini_v3';

    let generatedFilesData = [];
    let convertedFilesData = [];
    let croppedFilesData = []; // For auto-batch crop results
    let resizedFilesData = [];

    let batchFilesCurrentlyProcessing = 0;
    let totalFilesForBatch = 0;
    let filesProcessedByWorkerCounter = 0;

    // Manual Crop State
    let cropperManualInstance = null;
    let currentManualCropFile = null;


    // --- UI Elements ---
    const loaderModal = document.getElementById('loaderModal');
    const loaderMessage = document.getElementById('loaderMessage');
    const globalProgressContainer = document.getElementById('globalProgressContainer');
    const globalProgressBar = document.getElementById('globalProgressBar');
    const progressMessageElem = document.getElementById('progressMessage');
    const progressCounterElem = document.getElementById('progressCounter');
    const toastContainer = document.getElementById('toastContainer');

    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const hamburgerIconOpen = document.getElementById('hamburgerIconOpen');
    const hamburgerIconClose = document.getElementById('hamburgerIconClose');
    const tabNavigation = document.getElementById('tabNavigation');
    const tabContentsContainer = document.getElementById('tabContentsContainer');

    // Generate Metadata Tab
    const generateContentDiv = document.getElementById('generateContent');
    const generateBtn = document.getElementById('generateBtn');
    const imageFilesInput = document.getElementById('imageFiles');
    const apiKeysInput = document.getElementById('apiKeys');
    const autoDetectCheckbox = document.getElementById('autoDetect');
    const renameFilesCheckbox = document.getElementById('renameFiles');
    const generateXmpCheckbox = document.getElementById('generateXmp'); // Added for XMP
    const generateResultsDiv = document.getElementById('generateResults');
    const downloadAllGeneratedBtn = document.getElementById('downloadAllGeneratedBtn');
    const jsonMetadataFileInput = document.getElementById('jsonMetadataFile');
    const generateActionsContainer = document.getElementById('generateActionsContainer');
    const generateImageList = document.getElementById('generateImageList');
    const generateFileDropZone = document.getElementById('generateFileDropZone');
    const generateCategoryGrid = document.getElementById('generateCategoryGrid');

    // Read Metadata Tab
    const readContentDiv = document.getElementById('readContent');
    const readImageFileInput = document.getElementById('readImageFile');
    const metadataResultsDisplay = document.getElementById('metadataResultsDisplay');
    const readImagePreview = document.getElementById('readImagePreview');
    const readFileDropZone = document.getElementById('readFileDropZone');

    // Delete Metadata Tab
    const deleteContentDiv = document.getElementById('deleteContent');
    const deleteImageFileInput = document.getElementById('deleteImageFile');
    const deleteMetadataBtn = document.getElementById('deleteMetadataBtn');
    const deleteImagePreview = document.getElementById('deleteImagePreview');
    const deleteFileDropZone = document.getElementById('deleteFileDropZone');

    // Convert Tab
    const convertContentDiv = document.getElementById('convertContent');
    const convertImageFilesInput = document.getElementById('convertImageFiles');
    const jpegQualitySlider = document.getElementById('jpegQuality');
    const jpegQualityValueSpan = document.getElementById('jpegQualityValue');
    const convertBtn = document.getElementById('convertBtn');
    const convertResultsDiv = document.getElementById('convertResults');
    const downloadAllConvertedBtn = document.getElementById('downloadAllConvertedBtn');
    const convertImageList = document.getElementById('convertImageList');
    const convertFileDropZone = document.getElementById('convertFileDropZone');

    // Resize Tab Elements
    const resizeContentDiv = document.getElementById('resizeContent');
    const resizeImageFilesInput = document.getElementById('resizeImageFiles');
    const resizeFileDropZone = document.getElementById('resizeFileDropZone');
    const resizeImageList = document.getElementById('resizeImageList');
    const resizeModeSelect = document.getElementById('resizeMode');
    const dimensionsInputsContainer = document.getElementById('dimensionsInputsContainer');
    const resizeWidthInput = document.getElementById('resizeWidth');
    const resizeHeightInput = document.getElementById('resizeHeight');
    const percentageInputContainer = document.getElementById('percentageInputContainer');
    const resizePercentageInput = document.getElementById('resizePercentage');
    const maintainAspectRatioResizeCheckbox = document.getElementById('maintainAspectRatioResize');
    const resizeOutputFormatSelect = document.getElementById('resizeOutputFormat');
    const resizeJpegQualityContainer = document.getElementById('resizeJpegQualityContainer');
    const resizeJpegQualitySlider = document.getElementById('resizeJpegQuality');
    const resizeJpegQualityValueSpan = document.getElementById('resizeJpegQualityValue');
    const startBatchResizeBtn = document.getElementById('startBatchResizeBtn');
    const resizeResultsDiv = document.getElementById('resizeResults');


    // Crop Tab - Auto Mode
    const cropContentDiv = document.getElementById('cropContent');
    const cropImageFilesInput = document.getElementById('cropImageFiles'); // For batch auto-crop
    const cropAspectRatioAutoSelect = document.getElementById('cropAspectRatioAuto'); // Renamed from cropAspectRatio
    const startBatchCropBtn = document.getElementById('startBatchCropBtn');
    const cropResultsDiv = document.getElementById('cropResults'); // Shared for auto-crop results
    const cropImageList = document.getElementById('cropImageList'); // For batch auto-crop
    const cropFileDropZone = document.getElementById('cropFileDropZone'); // For batch auto-crop

    // Crop Tab - Mode Toggle
    const autoCropModeBtn = document.getElementById('autoCropModeBtn');
    const manualCropModeBtn = document.getElementById('manualCropModeBtn');
    const autoCropModeUI = document.getElementById('autoCropModeUI');
    const manualCropModeUI = document.getElementById('manualCropModeUI');

    // Crop Tab - Manual Mode
    const manualCropFileDropZone = document.getElementById('manualCropFileDropZone');
    const manualCropImageFileInput = document.getElementById('manualCropImageFile');
    const manualCropImageList = document.getElementById('manualCropImageList');
    const manualCropperWrapper = document.getElementById('manualCropperWrapper');
    const imageToCropManual = document.getElementById('imageToCropManual');
    const manualCropAspectRatioSelect = document.getElementById('manualCropAspectRatioSelect');
    const manualCropOutputFormat = document.getElementById('manualCropOutputFormat');
    const manualCropJpegQualityContainer = document.getElementById('manualCropJpegQualityContainer');
    const manualCropJpegQuality = document.getElementById('manualCropJpegQuality');
    const manualCropJpegQualityValue = document.getElementById('manualCropJpegQualityValue');
    const applyManualCropAndDownloadBtn = document.getElementById('applyManualCropAndDownloadBtn');
    const resetManualCropBtn = document.getElementById('resetManualCropBtn');
    const zoomInManualCropBtn = document.getElementById('zoomInManualCropBtn');
    const zoomOutManualCropBtn = document.getElementById('zoomOutManualCropBtn');
    const rotateLeftManualCropBtn = document.getElementById('rotateLeftManualCropBtn');
    const rotateRightManualCropBtn = document.getElementById('rotateRightManualCropBtn');


    // --- Helper Functions ---
    function showLoader(message = "Processing...") {
        if (loaderModal) {
            if (loaderMessage) loaderMessage.textContent = message;
            loaderModal.classList.remove('hidden');
        }
    }
    function hideLoader() {
        if (loaderModal) loaderModal.classList.add('hidden');
    }
    function showToast(message, type = 'info', duration = 3500) {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast p-4 rounded-lg shadow-lg text-white mb-2`;
        let bgColor = 'bg-blue-500';
        if (type === 'success') bgColor = 'bg-green-500';
        else if (type === 'error') bgColor = 'bg-red-500';
        else if (type === 'warning') bgColor = 'bg-yellow-500 text-slate-800';
        toast.classList.add(...bgColor.split(' '));
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('hide');
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        }, duration);
    }
    function updateGlobalProgressBar(current, total, message = "Processing files...") {
        if (!globalProgressContainer || !globalProgressBar || !progressMessageElem || !progressCounterElem) return;
        if (total === 0 && current === 0 && message === "") { globalProgressContainer.classList.add('hidden'); return; }
        if (current > total && total !== 0) current = total;
        globalProgressContainer.classList.remove('hidden');
        const percentage = total > 0 ? Math.min(100, (current / total) * 100) : 0;
        globalProgressBar.style.width = `${percentage}%`;
        progressMessageElem.textContent = message;
        progressCounterElem.textContent = `${current} / ${total}`;
        if (current >= total && total > 0) {
            setTimeout(() => {
                if (globalProgressContainer) globalProgressContainer.classList.add('hidden');
                 updateGlobalProgressBar(0,0,""); // Reset after hiding
            }, 3000);
        }
    }
    function _debounce(func, delay) {
      let timeout;
      return function(...args) { const context = this; clearTimeout(timeout); timeout = setTimeout(() => func.apply(context, args), delay); };
    }
    function setupDragAndDrop(dropZoneId, fileInputId, fileListId = null, singleFilePreviewId = null, isSingleFile = false) {
        const dropZone = document.getElementById(dropZoneId);
        if (!dropZone) { console.warn(`Drop zone with ID ${dropZoneId} not found.`); return; }
        const fileInput = document.getElementById(fileInputId);
        if (!fileInput) { console.warn(`File input with ID ${fileInputId} not found.`); return; }
        const fileListElem = fileListId ? document.getElementById(fileListId) : null;
        const previewElem = singleFilePreviewId ? document.getElementById(singleFilePreviewId) : null;

        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault(); dropZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (isSingleFile && files.length > 0) {
                const dataTransfer = new DataTransfer(); dataTransfer.items.add(files[0]);
                fileInput.files = dataTransfer.files;
            } else if (files.length > 0) { fileInput.files = files; }
            updateFileListDisplay(fileInput, fileListElem, previewElem, isSingleFile, dropZone);
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        });
        fileInput.addEventListener('change', () => {
            updateFileListDisplay(fileInput, fileListElem, previewElem, isSingleFile, dropZone);
        });
    }
    function updateFileListDisplay(fileInput, fileListElem, previewElem, isSingleFile, dropZone) {
        const defaultText = dropZone.dataset.defaultText || (isSingleFile ? "Drag 'n' drop an image here, or click to select" : "Drag 'n' drop files here, or click to select files");
        const dropZoneParagraph = dropZone ? dropZone.querySelector('p') : null;
        if (dropZone && !dropZone.dataset.defaultText && dropZoneParagraph) {
            dropZone.dataset.defaultText = dropZoneParagraph.textContent || defaultText;
        }
        if (fileListElem) fileListElem.innerHTML = '';

        if (isSingleFile) {
             if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                if (fileListElem) { const listItem = document.createElement('li'); listItem.textContent = file.name; fileListElem.appendChild(listItem); }
                if (dropZoneParagraph) dropZoneParagraph.textContent = file.name;
                if (previewElem && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e_reader) => { previewElem.src = e_reader.target.result; previewElem.classList.remove('hidden'); }
                    reader.readAsDataURL(file);
                } else if (previewElem) { previewElem.classList.add('hidden'); previewElem.src = "#"; }
            } else {
                if (dropZoneParagraph) dropZoneParagraph.textContent = defaultText;
                if (previewElem) { previewElem.classList.add('hidden'); previewElem.src = "#"; }
            }
        } else {
             if (fileInput.files.length === 0) {
                if (dropZoneParagraph) dropZoneParagraph.textContent = defaultText;
             } else {
                Array.from(fileInput.files).forEach(file => {
                    if (fileListElem) { const listItem = document.createElement('li'); listItem.textContent = file.name; fileListElem.appendChild(listItem); }
                });
                if (dropZoneParagraph) dropZoneParagraph.textContent = `${fileInput.files.length} file(s) selected`;
             }
        }
    }
    function populateCategoryGrid(gridId) {
        const categoryGrid = document.getElementById(gridId);
        if (!categoryGrid) return;
        categoryGrid.innerHTML = '';
        CATEGORIES.forEach(category => {
            const div = document.createElement('div'); div.className = 'flex items-center';
            const inputId = `${gridId}-${category.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')}`;
            div.innerHTML = `<input type="checkbox" id="${inputId}" name="${gridId}-categories" value="${category}" class="checkbox-style"><label for="${inputId}" class="ml-2 text-sm text-slate-700 cursor-pointer">${category}</label>`;
            categoryGrid.appendChild(div);
        });
    }
    function getSelectedCategories(gridId) { return Array.from(document.querySelectorAll(`#${gridId} input[name="${gridId}-categories"]:checked`)).map(cb => cb.value); }

    function encodeUTF16(str) { // For EXIF XP* tags
        if (str === null || typeof str === 'undefined') str = '';
        const bytes = [];
        for (let i = 0; i < str.length; i++) {
            const charCode = str.charCodeAt(i);
            bytes.push(charCode & 0xFF);      // Low byte
            bytes.push((charCode >> 8) & 0xFF); // High byte
        }
        bytes.push(0, 0); // Null terminator (2 bytes for UTF-16)
        return bytes;
    }

    function decodeUTF16(byteArray) { // For EXIF XP* tags
        if (!byteArray || !Array.isArray(byteArray) || byteArray.length === 0) return "";
        let str = "";
        for (let i = 0; i < byteArray.length; i += 2) {
            if (i + 1 >= byteArray.length) break; // Ensure pair exists
            const charCode = byteArray[i] + (byteArray[i + 1] << 8);
            if (charCode === 0 && i === byteArray.length - 2) break; // Check for final null terminator
            if (charCode === 0) break; // General null terminator
            str += String.fromCharCode(charCode);
        }
        return str;
    }

    function escapeXml(unsafe) {
        if (unsafe === null || typeof unsafe === 'undefined') return '';
        return String(unsafe).replace(/[<>&'"]/g, function (c) {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case "'": return '&#39;';
                case '"': return '&quot;';
            }
            return c; // Should not happen with the regex
        });
    }

    async function convertToJpeg(file, quality = 1.0) { return new Promise((resolve,reject)=>{if(file.type==='image/jpeg'&&quality>=0.99){file.arrayBuffer().then(buf=>resolve(new File([buf],file.name.replace(/\.[^/.]+$/,'.jpg'),{type:'image/jpeg',lastModified:file.lastModified}))).catch(reject);return;}const img=new Image();img.onload=()=>{const cvs=document.createElement('canvas');cvs.width=img.naturalWidth;cvs.height=img.naturalHeight;const ctx=cvs.getContext('2d');ctx.drawImage(img,0,0,img.naturalWidth,img.naturalHeight);cvs.toBlob(blob=>{if(blob)resolve(new File([blob],file.name.replace(/\.[^/.]+$/,'')+'.jpg',{type:'image/jpeg',lastModified:Date.now()}));else reject(new Error('Canvas toBlob failed for JPEG.'));},'image/jpeg',quality);URL.revokeObjectURL(img.src);};img.onerror=()=>{URL.revokeObjectURL(img.src);reject(new Error('Image loading failed for JPEG conversion.'));};img.src=URL.createObjectURL(file);});}
    async function createExifImage(originalFile, metadata) { let fileToProcess=originalFile;if(originalFile.type!=='image/jpeg'){try{fileToProcess=await convertToJpeg(originalFile,1.0);}catch(e){console.error(`Could not convert ${originalFile.name} to JPEG for EXIF:`,e);showToast(`Could not convert ${originalFile.name}. EXIF not applied.`,'error');return new Promise(r=>originalFile.arrayBuffer().then(b=>r(new Blob([b],{type:originalFile.type}))).catch(()=>r(new Blob())));}}return new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>{try{const dataUrl=reader.result;let exifObj;try{exifObj=piexif.load(dataUrl);}catch(e){exifObj={"0th":{},"Exif":{},"GPS":{},"1st":{},"thumbnail":null};}if(metadata.title)exifObj["0th"][piexif.ImageIFD.XPTitle]=encodeUTF16(metadata.title);if(metadata.subject)exifObj["0th"][piexif.ImageIFD.XPSubject]=encodeUTF16(metadata.subject);if(metadata.keywords)exifObj["0th"][piexif.ImageIFD.XPKeywords]=encodeUTF16(metadata.keywords);const catsTag=Array.isArray(metadata.categories)?metadata.categories.join('; '):(metadata.categories||'');if(catsTag)exifObj["0th"][piexif.ImageIFD.XPComment]=encodeUTF16(catsTag);if(metadata.author)exifObj["0th"][piexif.ImageIFD.Artist]=metadata.author;if(metadata.copyright)exifObj["0th"][piexif.ImageIFD.Copyright]=metadata.copyright;const defSoft="AI Content Suite Pro "+new Date().getFullYear();if(metadata.software)exifObj["0th"][piexif.ImageIFD.Software]=metadata.software;else if(!exifObj["0th"][piexif.ImageIFD.Software]&&metadata.software!==null)exifObj["0th"][piexif.ImageIFD.Software]=defSoft;const exifBytes=piexif.dump(exifObj);const updUrl=piexif.insert(exifBytes,dataUrl);const byteStr=atob(updUrl.split(',')[1]);const mimeStr=updUrl.split(',')[0].split(':')[1].split(';')[0];const ab=new ArrayBuffer(byteStr.length);const ia=new Uint8Array(ab);for(let i=0;i<byteStr.length;i++)ia[i]=byteStr.charCodeAt(i);resolve(new Blob([ab],{type:mimeStr}));}catch(error){console.error(`Error embedding EXIF for ${fileToProcess.name}:`,error);showToast(`EXIF update failed for ${fileToProcess.name}.`,'error');fileToProcess.arrayBuffer().then(b=>resolve(new Blob([b],{type:fileToProcess.type}))).catch(()=>resolve(new Blob()));}};reader.onerror=()=>{console.error(`FileReader error for EXIF processing of ${fileToProcess.name}`);showToast(`Could not read ${fileToProcess.name} for EXIF update.`,'error');fileToProcess.arrayBuffer().then(b=>resolve(new Blob([b],{type:fileToProcess.type}))).catch(()=>resolve(new Blob()));};reader.readAsDataURL(fileToProcess);});}
    function createXmpSidecarContent(metadata, originalFilename) {
        const title = metadata.title || "";
        const subject = metadata.subject || "";
        const author = metadata.author || "Unknown Creator"; // Some fields expect a value
        // Keywords are expected as a comma-separated string for this function
        const keywordsList = (metadata.keywords || "").split(',').map(k => k.trim()).filter(k => k);
        // Categories are expected as an array
        const categoriesList = Array.isArray(metadata.categories) ? metadata.categories.map(c => c.trim()).filter(c => c) : [];
        const copyright = metadata.copyright || "";
        const appName = `AI Content Suite Pro ${new Date().getFullYear()}`;
        const nowISO = new Date().toISOString();

        let keywordsXMP = keywordsList.map(k => `<rdf:li>${escapeXml(k)}</rdf:li>`).join('\n              ');
        // For Adobe Stock, categories are often included as keywords too
        let categoriesAsKeywordsXMP = categoriesList.map(c => `<rdf:li>${escapeXml(c)}</rdf:li>`).join('\n              ');

        return `<?xml version="1.0" encoding="UTF-8"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="${escapeXml(appName)}">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
        xmlns:xmp="http://ns.adobe.com/xmp/1.0/"
        xmlns:xmpRights="http://ns.adobe.com/xmp/rights/">
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${escapeXml(title)}</rdf:li>
        </rdf:Alt>
      </dc:title>
      <dc:description>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${escapeXml(subject)}</rdf:li>
        </rdf:Alt>
      </dc:description>
      <dc:creator>
        <rdf:Seq>
          <rdf:li>${escapeXml(author)}</rdf:li>
        </rdf:Seq>
      </dc:creator>
      <dc:subject>
        <rdf:Bag>
          ${keywordsXMP}
          ${categoriesAsKeywordsXMP}
        </rdf:Bag>
      </dc:subject>
      ${copyright ? `
      <dc:rights>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${escapeXml(copyright)}</rdf:li>
        </rdf:Alt>
      </dc:rights>
      <xmpRights:Marked>True</xmpRights:Marked>
      <!-- <xmpRights:WebStatement>http://yourcopyrighturl.com</xmpRights:WebStatement> -->
      ` : ''}
      <photoshop:Headline>${escapeXml(title)}</photoshop:Headline>
      <photoshop:AuthorsPosition>Creator</photoshop:AuthorsPosition>
      <photoshop:Credit>${escapeXml(author)}</photoshop:Credit>
      <photoshop:Source>${escapeXml(originalFilename)}</photoshop:Source>
      <photoshop:DateCreated>${nowISO.split('T')[0]}</photoshop:DateCreated> <!-- YYYY-MM-DD -->
      <xmp:CreatorTool>${escapeXml(appName)}</xmp:CreatorTool>
      <xmp:CreateDate>${nowISO}</xmp:CreateDate>
      <xmp:ModifyDate>${nowISO}</xmp:ModifyDate>
      <xmp:MetadataDate>${nowISO}</xmp:MetadataDate>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>`;
    }
    function loadApiKeys() { if(!apiKeysInput)return;const storedKeys=localStorage.getItem(API_KEYS_STORAGE_KEY);if(storedKeys){try{const keysArray=JSON.parse(storedKeys);if(Array.isArray(keysArray))apiKeysInput.value=keysArray.join('\n');}catch(e){console.error("Error parsing stored API keys:",e);localStorage.removeItem(API_KEYS_STORAGE_KEY);}}}
    function saveApiKeys() { if(!apiKeysInput)return;const keysStr=apiKeysInput.value.trim();if(keysStr){const keysArray=keysStr.split(/[\s,;\n]+/).map(k=>k.trim()).filter(k=>k);if(keysArray.length>0){localStorage.setItem(API_KEYS_STORAGE_KEY,JSON.stringify(keysArray));showToast('API Keys saved to local storage.','info',2000);}else localStorage.removeItem(API_KEYS_STORAGE_KEY);}else localStorage.removeItem(API_KEYS_STORAGE_KEY);}
    function createResultCardHTML(originalName, newName, status, metadata, isError, dataArrayIndex, tabSource, thumbnailUrl = '') { let retryBtnHtml=isError && tabSource === 'generate'?`<button data-gfd-index="${dataArrayIndex}" data-tab-source="${tabSource}" class="button-warning retry-btn">Retry</button>`:'';let downloadBtnHtml=!isError?`<button data-gfd-index="${dataArrayIndex}" data-tab-source="${tabSource}" class="button-primary download-individual-btn">Download</button>`:'';return`<div class="flex items-start flex-1 min-w-0 content-area">${thumbnailUrl?`<img src="${thumbnailUrl}" alt="thumb" class="result-card-thumbnail">`:'<div class="result-card-thumbnail bg-slate-200"></div>'}<div class="flex-1 min-w-0"><h3 class="text-sm font-semibold text-slate-800 truncate" title="${originalName}">${originalName}</h3><p class="text-xs text-slate-500 mb-1">To: <span class="font-medium text-slate-600 truncate" title="${newName}">${newName||'N/A'}</span></p>${!isError&&metadata?`<div class="space-y-0.5 text-xs text-slate-600">${metadata.title?`<p><strong>Title:</strong> <span class="line-clamp-1" title="${metadata.title}">${metadata.title}</span></p>`:''}${Array.isArray(metadata.keywords) && metadata.keywords.length > 0 ?`<p><strong>Keywords:</strong> <span class="line-clamp-1" title="${metadata.keywords.join(', ')}">${metadata.keywords.join(', ')}</span></p>`:''}${Array.isArray(metadata.categories) && metadata.categories.length > 0 ?`<p><strong>Categories:</strong> <span class="line-clamp-1">${metadata.categories.join(', ')}</span></p>`:''}</div>`:`<p class="text-xs ${isError?'text-red-600':'text-green-600'} font-medium">${status}</p>`}</div></div><div class="actions-area">${downloadBtnHtml}${retryBtnHtml}</div>`;}
    function sanitizeFilename(name, maxLength = 50) { if(!name||typeof name!=='string')return`default_filename_${Date.now()}`;let sane=name.replace(/[^\w\s.-]/gi,'').replace(/\s+/g,'_').substring(0,maxLength);sane=sane.replace(/^_+|_+$/g,'').replace(/^\.+|\.+$/g,'');return sane||`image_${Date.now()}`;}
    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // --- Tab Switching Logic ---
    function switchTab(targetTabId) {
        if (!tabContentsContainer || !tabNavigation) { console.error("Tab containers not found for switching."); return; }
        tabNavigation.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('tab-active'));
        const activeButton = tabNavigation.querySelector(`.tab-button[data-tab="${targetTabId}"]`);
        if (activeButton) activeButton.classList.add('tab-active');
        else console.warn(`No button found for tab ID: ${targetTabId}`);

        tabContentsContainer.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
        const targetTabContent = document.getElementById(targetTabId);
        if (targetTabContent) targetTabContent.classList.remove('hidden');
        else console.warn(`No content found for tab ID: ${targetTabId}`);

        if (globalProgressContainer) globalProgressContainer.classList.add('hidden');
       if (tabNavigation.classList.contains('mobile-menu-open')) {
            tabNavigation.classList.remove('mobile-menu-open');
            if (hamburgerIconOpen && hamburgerIconClose) {
                hamburgerIconOpen.classList.remove('hidden');
                hamburgerIconClose.classList.add('hidden');
            }
        }
    }
    if (tabNavigation) {
        tabNavigation.addEventListener('click', (e) => {
            const button = e.target.closest('.tab-button');
            if (!button || !button.dataset.tab) return;
            switchTab(button.dataset.tab);
        });
    }
    if (hamburgerBtn && tabNavigation && hamburgerIconOpen && hamburgerIconClose) {
        hamburgerBtn.addEventListener('click', () => {
            const isOpen = tabNavigation.classList.toggle('mobile-menu-open');
            hamburgerIconOpen.classList.toggle('hidden', isOpen);
            hamburgerIconClose.classList.toggle('hidden', !isOpen);
        });
    }

    // --- Tab: Generate Metadata ---
    async function processSingleFileWithGemini(file, apiKey, selectedCategories, autoDetect, customContext = "") {
        let fileToProcess = file;
        let mimeTypeForApi = file.type;
        if (!file.type.match(/^image\/(jpeg|png|webp|gif|heic|heif)$/)) {
            console.warn(`File ${file.name} type ${file.type}. Sending as-is to Gemini, but API might prefer common types.`);
        }
        const reader = new FileReader();
        return new Promise(resolve => {
            reader.onload = async () => {
                const base64Image = reader.result.split(',')[1];
                try {
                    const shouldAutoDetectCats = autoDetect && selectedCategories.length === 0;
                    let prompt = `Analyze this image carefully. ${customContext}\n`;
                    prompt += `Provide the output STRICTLY in JSON format. The JSON object should have these exact keys: `;
                    prompt += `"title" (string, concise and descriptive, max 10-15 words, good for search), `;
                    prompt += `"subject" (string, detailed description of the image content, people, actions, and setting, 50-100 words), `;
                    prompt += `"keywords" (array of 20-40 relevant string keywords, diverse including conceptual and object tags), `;
                    prompt += `"categories" (array of strings).`;

                    if (shouldAutoDetectCats) {
                        prompt += `\nFor "categories", select the most relevant ones from this list: ${CATEGORIES.join(', ')}. Pick at least one, up to five.`;
                    } else if (selectedCategories.length > 0) {
                        prompt += `\nThe "categories" array in JSON should strictly be: ${JSON.stringify(selectedCategories)}. Do not add or change these.`;
                    } else {
                        prompt += `\nIf no categories are pre-selected and auto-detect is off, the "categories" array should be empty or contain only "Uncategorized".`;
                    }
                    prompt += `\nExample output format: {"title": "...", "subject": "...", "keywords": ["tag1", "tag2", ...], "categories": ["Cat1", "Cat2"]}`;

                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
                       method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [ { text: prompt }, { inlineData: { mimeType: mimeTypeForApi, data: base64Image } } ] }],
                            safetySettings: [
                                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                            ]
                        })
                    });

                    if (!response.ok) {
                        const errData = await response.json();
                        throw new Error(`Gemini API Error: ${response.status} - ${errData.error?.message || 'Unknown Gemini error'}`);
                    }

                    const data = await response.json();
                    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                        throw new Error("Invalid response structure from Gemini API for metadata.");
                    }

                    const textResponse = data.candidates[0].content.parts[0].text;
                    let metadataJson;
                    try {
                        const cleanJsonString = textResponse.replace(/^```json\s*|```$/g, '').trim();
                        metadataJson = JSON.parse(cleanJsonString);
                    } catch (e) {
                        console.error("Failed to parse JSON from Gemini (Metadata):", textResponse, e);
                        // This specific title value will trigger retries if needed
                        metadataJson = { title: "N/A (Parsing Error)", subject: "N/A (Parsing Error)", keywords: [], categories: [] };
                    }

                    // Ensure keywords and categories are consistently arrays of strings
                    let finalKeywordsArray = [];
                    if (Array.isArray(metadataJson.keywords)) {
                        finalKeywordsArray = metadataJson.keywords.map(k => String(k).trim()).filter(Boolean);
                    } else if (typeof metadataJson.keywords === 'string' && metadataJson.keywords.toLowerCase() !== 'n/a' && metadataJson.keywords.trim() !== '') {
                        finalKeywordsArray = metadataJson.keywords.split(/[\s,;]+/).map(k => String(k).trim()).filter(Boolean);
                    }

                    let finalCategoriesArray = [];
                    const preSelectedCats = (Array.isArray(selectedCategories) && selectedCategories.length > 0) ? selectedCategories.map(c => String(c).trim()).filter(Boolean) : [];

                    if (Array.isArray(metadataJson.categories)) {
                        finalCategoriesArray = metadataJson.categories.map(c => String(c).trim()).filter(Boolean);
                    } else if (typeof metadataJson.categories === 'string' && metadataJson.categories.trim() !== '' && metadataJson.categories.toLowerCase() !== 'n/a') {
                        finalCategoriesArray = metadataJson.categories.split(/[,;\t\n]+/).map(c => String(c).trim()).filter(Boolean);
                    }
                     
                    if (finalCategoriesArray.length === 0) { // If Gemini didn't provide categories or format was wrong, use fallback
                        if (shouldAutoDetectCats) {
                            finalCategoriesArray = []; // Gemini was asked to auto-detect but returned none/empty
                        } else if (preSelectedCats.length > 0) {
                            finalCategoriesArray = preSelectedCats;
                        } else {
                            finalCategoriesArray = []; // No pre-selection, auto-detect off or Gemini returned nothing suitable
                        }
                    }
                    
                    resolve({
                        title: metadataJson.title || "N/A", // Keep "N/A" string for title/subject if Gemini says so
                        subject: metadataJson.subject || "N/A",
                        keywords: finalKeywordsArray, // Always an array
                        categories: finalCategoriesArray, // Always an array
                        author: metadataJson.author || null,
                        copyright: metadataJson.copyright || null
                    });

                } catch (error) {
                    console.error(`Error processing metadata for ${file.name} with Gemini:`, error);
                    resolve({ title: "Error (API or Network)", subject: error.message.substring(0, 100), keywords: [], categories: [], author: null, copyright: null });
                }
            };
            reader.onerror = () => {
                console.error(`FileReader error for metadata processing of ${file.name}`);
                resolve({ title: "Error (FileReader)", subject: "FileReader error", keywords: [], categories: [], author: null, copyright: null });
            };
            reader.readAsDataURL(fileToProcess);
        });
    }
    if (generateBtn) generateBtn.addEventListener('click', async () => {
        const files = imageFilesInput.files;
        const apiKeysRaw = apiKeysInput.value;
        const shouldRename = renameFilesCheckbox.checked;
        const generateXmp = generateXmpCheckbox ? generateXmpCheckbox.checked : false;
        const jsonFile = jsonMetadataFileInput.files.length > 0 ? jsonMetadataFileInput.files[0] : null;

        if (files.length === 0) { showToast('Please select at least one image for metadata generation.', 'warning'); return; }
        const apiKeysArray = apiKeysRaw.split(/[\s,;\n]+/).map(k => k.trim()).filter(k => k);
        if (apiKeysArray.length === 0) { showToast('Please enter Gemini API key(s) for metadata.', 'warning'); return; }

        showLoader('Preparing to generate metadata...');
        if (generateResultsDiv) generateResultsDiv.innerHTML = '';
        generatedFilesData = [];
        if (downloadAllGeneratedBtn) downloadAllGeneratedBtn.style.display = 'none';
        const downloadCsvBtnOld = document.getElementById('downloadCsvGeneratedBtn');
        if (downloadCsvBtnOld) downloadCsvBtnOld.style.display = 'none';
        updateGlobalProgressBar(0, files.length, "Starting metadata generation...");

        let userJsonData = {};
        if (jsonFile) {
            try {
                const jsonContent = await jsonFile.text();
                const parsedJson = JSON.parse(jsonContent);
                if (Array.isArray(parsedJson)) parsedJson.forEach(item => { if (item.filename) userJsonData[item.filename] = item; });
                else if (typeof parsedJson === 'object') userJsonData = parsedJson;
                showToast('JSON metadata loaded.', 'info');
            } catch (e) { showToast('Error parsing JSON metadata. Proceeding without it.', 'error'); console.error("JSON metadata parsing error:", e); }
        }

        let filesProcessedCounter = 0;
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                updateGlobalProgressBar(filesProcessedCounter + 1, files.length, `Processing metadata for ${file.name}...`);
                showLoader(`Processing metadata for ${file.name} (${filesProcessedCounter + 1}/${files.length})`);
                
                let metadata;
                const jsonDataForFile = userJsonData[file.name];

                if (jsonDataForFile?.title && jsonDataForFile?.subject && jsonDataForFile?.keywords) {
                    metadata = {
                        title: jsonDataForFile.title,
                        subject: jsonDataForFile.subject,
                        keywords: Array.isArray(jsonDataForFile.keywords) ? jsonDataForFile.keywords : String(jsonDataForFile.keywords || "").split(/[\s,;]+/).map(k => k.trim()).filter(Boolean),
                        categories: Array.isArray(jsonDataForFile.categories) ? jsonDataForFile.categories : String(jsonDataForFile.categories || "").split(/[\s,;]+/).map(k => k.trim()).filter(Boolean),
                        author: jsonDataForFile.author || null,
                        copyright: jsonDataForFile.copyright || null
                    };
                    showToast(`Used metadata from JSON for ${file.name}.`, 'info', 1500);
                } else {
                    const apiKey = apiKeysArray[i % apiKeysArray.length];
                    const selectedCats = getSelectedCategories('generateCategoryGrid');
                    const autoDetect = autoDetectCheckbox.checked;
                    const contextForGemini = jsonDataForFile?.context_for_gemini || "";
                    
                    let retries = 0;
                    const MAX_GEMINI_RETRIES = 2; 

                    do {
                        metadata = await processSingleFileWithGemini(file, apiKey, selectedCats, autoDetect, contextForGemini);
                        if (metadata.title && metadata.title.includes("N/A (Parsing Error)")) {
                            retries++;
                            if (retries <= MAX_GEMINI_RETRIES) {
                                showToast(`Gemini parsing error for ${file.name}. Retrying (${retries}/${MAX_GEMINI_RETRIES})...`, 'warning', 2500);
                                await new Promise(resolve_timeout => setTimeout(resolve_timeout, 1000 * retries)); // Optional: incremental backoff
                            } else {
                                showToast(`Max retries for Gemini parsing reached for ${file.name}. File will be skipped for CSV.`, 'error');
                                metadata.title = "Error (Gemini Parsing Failed After Retries)";
                                metadata.subject = "Could not parse Gemini response after multiple attempts.";
                                metadata.keywords = []; 
                                metadata.categories = []; 
                                break; 
                            }
                        } else {
                            break; 
                        }
                    } while (true);

                    if (jsonDataForFile && !metadata.title.includes("Error (Gemini Parsing Failed After Retries)")) {
                        metadata.title = jsonDataForFile.title || metadata.title;
                        metadata.subject = jsonDataForFile.subject || metadata.subject;
                        if (jsonDataForFile.keywords) {
                             metadata.keywords = Array.isArray(jsonDataForFile.keywords) ? jsonDataForFile.keywords : String(jsonDataForFile.keywords || "").split(/[\s,;]+/).map(k => k.trim()).filter(Boolean);
                        }
                        if (jsonDataForFile.categories) {
                            metadata.categories = Array.isArray(jsonDataForFile.categories) ? jsonDataForFile.categories : String(jsonDataForFile.categories || "").split(/[\s,;]+/).map(k => k.trim()).filter(Boolean);
                        }
                        metadata.author = jsonDataForFile.author || metadata.author;
                        metadata.copyright = jsonDataForFile.copyright || metadata.copyright;
                    }
                }

                const exifMetadataPayload = {
                    ...metadata,
                    keywords: Array.isArray(metadata.keywords) ? metadata.keywords.join(',') : (metadata.keywords || ""),
                    categories: Array.isArray(metadata.categories) ? metadata.categories.join('; ') : (metadata.categories || "")
                };
                const processedBlob = await createExifImage(file, exifMetadataPayload);
                
                let xmpContent = null;
                if (generateXmp) {
                    const xmpMetadataPayload = {
                        ...metadata, // title, subject, author, copyright are fine
                        keywords: Array.isArray(metadata.keywords) ? metadata.keywords.join(',') : (metadata.keywords || ""), // XMP function expects comma-separated string
                        categories: metadata.categories // XMP function expects array
                    };
                    xmpContent = createXmpSidecarContent(xmpMetadataPayload, file.name);
                }

                const sanitizedTitleForFilename = metadata.title && !metadata.title.includes("N/A") && !metadata.title.includes("Error") ? sanitizeFilename(metadata.title) : null;
                const newFileName = shouldRename && sanitizedTitleForFilename ? `${sanitizedTitleForFilename}.jpg` : `processed_${sanitizeFilename(file.name.replace(/\.[^/.]+$/, ''), 40)}.jpg`;
                
                const isError = metadata.title.includes("Error") || metadata.title.includes("N/A (Parsing Error)");

                let existingDataIndex = generatedFilesData.findIndex(d => d.originalName === file.name);
                const dataToStore = {
                    blob: processedBlob,
                    metadata, // This metadata has keywords and categories as arrays
                    originalName: file.name,
                    newName: newFileName,
                    originalFileReference: file,
                    xmpData: xmpContent,
                    error: isError || !processedBlob || processedBlob.size === 0,
                    status: isError ? metadata.title : (processedBlob?.size > 0 ? "Processed successfully" : "Processing failed, empty blob")
                };

                if (existingDataIndex > -1) generatedFilesData[existingDataIndex] = dataToStore;
                else { generatedFilesData.push(dataToStore); existingDataIndex = generatedFilesData.length - 1; }

                let resultCard = document.getElementById(`result-card-gen-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`);
                if (!resultCard) {
                    resultCard = document.createElement('div');
                    resultCard.id = `result-card-gen-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
                    resultCard.className = 'result-card';
                    if (generateResultsDiv) generateResultsDiv.appendChild(resultCard);
                }
                const thumbnailUrl = dataToStore.blob?.size > 0 ? URL.createObjectURL(dataToStore.blob) : (file ? URL.createObjectURL(file) : '');
                if (resultCard) resultCard.innerHTML = createResultCardHTML(file.name, newFileName, dataToStore.status, metadata, dataToStore.error, existingDataIndex, 'generate', thumbnailUrl);
                
                filesProcessedCounter++;
            }
            updateGlobalProgressBar(files.length, files.length, "All files processed for metadata!");
            if (generatedFilesData.length > 0) {
                showToast(`Successfully generated metadata for ${generatedFilesData.filter(f => !f.error).length} of ${generatedFilesData.length} image(s).`, 'success');
                if (downloadAllGeneratedBtn) downloadAllGeneratedBtn.style.display = 'flex';
                let downloadCsvBtn = document.getElementById('downloadCsvGeneratedBtn');
                if (!downloadCsvBtn && generateActionsContainer) {
                    downloadCsvBtn = document.createElement('button');
                    downloadCsvBtn.id = 'downloadCsvGeneratedBtn';
                    downloadCsvBtn.className = 'button-teal';
                    downloadCsvBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>Download CSV`;
                    generateActionsContainer.appendChild(downloadCsvBtn);
                    downloadCsvBtn.addEventListener('click', generateAndDownloadCsv);
                }
                if (downloadCsvBtn) downloadCsvBtn.style.display = 'flex';
            } else if (files.length > 0) showToast(`Metadata generation process completed with issues for ${files.length} image(s).`, 'warning');

            if (imageFilesInput) imageFilesInput.value = null;
            if (generateImageList) generateImageList.innerHTML = '';
            const genDropZonePara = generateFileDropZone ? generateFileDropZone.querySelector('p') : null;
            if (genDropZonePara && generateFileDropZone) genDropZonePara.textContent = generateFileDropZone.dataset.defaultText || "Drag 'n' drop files here, or click to select files";
            if (jsonMetadataFileInput) jsonMetadataFileInput.value = null;
        } catch (error) {
            console.error('Error during batch metadata generation:', error);
            showToast(`An error occurred: ${error.message}`, 'error');
            updateGlobalProgressBar(files.length, files.length, "Metadata processing failed.");
        } finally {
            hideLoader();
        }
    });

    function csvQuote(fieldValue) {
        const str = String(fieldValue == null ? '' : fieldValue);
        // Clean tabs and newlines
        const cleanStr = str.replace(/[\r\n\t]+/g, ' ').trim();

        if (/[,"\t;|]/.test(cleanStr)) {
            return `"${cleanStr.replace(/"/g, '""')}"`;
        }
        return cleanStr;
    }

    function generateAndDownloadCsv() {
        const filesForCsv = generatedFilesData.filter(item => !item.error);

        if (filesForCsv.length === 0) {
            showToast('No valid metadata to download as CSV. Files with processing errors (including persistent parsing errors) are excluded.', 'info');
            return;
        }
        const csvHeader = "Filename,Title,Subject,Keywords,Categories,Author,Copyright\n";
        let csvContent = csvHeader;
        
        filesForCsv.forEach(item => {
            const filename = item.newName || item.originalName;
            const title = (item.metadata.title || "").replace(/[\r\n]+/g, ' ').trim();
            const subject = (item.metadata.subject || "").replace(/[\r\n]+/g, ' ').trim();
            
            const keywordsString = (Array.isArray(item.metadata.keywords) ? item.metadata.keywords.join(', ') : String(item.metadata.keywords || "")).replace(/[\r\n\t]+/g, ' ').trim();
            const categoriesString = (Array.isArray(item.metadata.categories) ? item.metadata.categories.join(', ') : String(item.metadata.categories || "")).replace(/[\r\n\t]+/g, ' ').trim();


            const author = (item.metadata.author || "").replace(/[\r\n]+/g, ' ').trim();
            const copyright = (item.metadata.copyright || "").replace(/[\r\n]+/g, ' ').trim();
            
            csvContent += `${csvQuote(filename)},${csvQuote(title)},${csvQuote(subject)},${csvQuote(keywordsString)},${csvQuote(categoriesString)},${csvQuote(author)},${csvQuote(copyright)}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'metadata_export.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('CSV download started.', 'success');
    }

    // Centralized listener for result card actions (Download/Retry)
    document.querySelectorAll('.results-container').forEach(container => {
        container.addEventListener('click', async (e) => {
            const downloadButton = e.target.closest('.download-individual-btn');
            const retryButton = e.target.closest('.retry-btn');

            if (downloadButton) {
                const index = parseInt(downloadButton.dataset.gfdIndex);
                const tabSource = downloadButton.dataset.tabSource;
                let fileData;

                if (tabSource === 'generate') fileData = generatedFilesData[index];
                else if (tabSource === 'convert') fileData = convertedFilesData[index];
                else if (tabSource === 'autocrop') fileData = croppedFilesData[index];
                else if (tabSource === 'resize') fileData = resizedFilesData[index];

                if (fileData && fileData.blob && fileData.blob.size > 0) {
                    downloadBlob(fileData.blob, fileData.newName);
                } else {
                    showToast('Error: Processed file data is invalid or empty for download.', 'error');
                }
            } else if (retryButton) {
                const index = parseInt(retryButton.dataset.gfdIndex);
                const tabSource = retryButton.dataset.tabSource;

                if (tabSource === 'generate') { 
                    let dataToRetry = generatedFilesData[index];
                    if (!dataToRetry || !dataToRetry.originalFileReference) {
                        showToast('Cannot retry: Original file reference not found.', 'error');
                        return;
                    }
                    const fileToRetry = dataToRetry.originalFileReference;
                    showLoader(`Retrying ${fileToRetry.name}...`);
                    try {
                        const apiKeysRaw = apiKeysInput.value;
                        const apiKeysArr = apiKeysRaw.split(/[\s,;\n]+/).map(k => k.trim()).filter(k => k);
                        if (apiKeysArr.length === 0) {
                            showToast('API Key is required for retry.', 'error');
                            hideLoader();
                            return;
                        }
                        const apiKeyForRetry = apiKeysArr[index % apiKeysArr.length]; 
                        const selCats = getSelectedCategories('generateCategoryGrid');
                        const autoDet = autoDetectCheckbox.checked;
                        const customCtx = ""; // Custom context not easily retrieved for single retry
                        const generateXmp = generateXmpCheckbox ? generateXmpCheckbox.checked : false;
                        
                        let newMeta;
                        let retries = 0;
                        const MAX_GEMINI_RETRIES_SINGLE = 2;

                        do {
                            newMeta = await processSingleFileWithGemini(fileToRetry, apiKeyForRetry, selCats, autoDet, customCtx);
                            if (newMeta.title && newMeta.title.includes("N/A (Parsing Error)")) {
                                retries++;
                                if (retries <= MAX_GEMINI_RETRIES_SINGLE) {
                                     showToast(`Gemini parsing error on retry for ${fileToRetry.name}. Retrying (${retries}/${MAX_GEMINI_RETRIES_SINGLE})...`, 'warning', 2500);
                                     await new Promise(resolve_timeout => setTimeout(resolve_timeout, 1000 * retries));
                                } else {
                                    showToast(`Max retries for Gemini parsing reached for ${fileToRetry.name} on manual retry.`, 'error');
                                    newMeta.title = "Error (Gemini Parsing Failed After Retries)";
                                    newMeta.subject = "Could not parse Gemini response after multiple attempts.";
                                    newMeta.keywords = [];
                                    newMeta.categories = [];
                                    break;
                                }
                            } else {
                                break;
                            }
                        } while(true);


                        const exifMetaPayloadRetry = { ...newMeta, keywords: Array.isArray(newMeta.keywords) ? newMeta.keywords.join(',') : (newMeta.keywords || ""), categories: Array.isArray(newMeta.categories) ? newMeta.categories.join('; ') : (newMeta.categories || "")};
                        const newBlob = await createExifImage(fileToRetry, exifMetaPayloadRetry);
                        
                        let newXmpContent = null;
                        if (generateXmp) {
                            const xmpMetaPayloadRetry = { ...newMeta, keywords: Array.isArray(newMeta.keywords) ? newMeta.keywords.join(',') : (newMeta.keywords || ""), categories: newMeta.categories };
                            newXmpContent = createXmpSidecarContent(xmpMetaPayloadRetry, fileToRetry.name);
                        }

                        const shouldRename = renameFilesCheckbox.checked;
                        const sanitizedTitleForFilename = newMeta.title && !newMeta.title.includes("N/A") && !newMeta.title.includes("Error") ? sanitizeFilename(newMeta.title) : null;
                        const newNewFileName = shouldRename && sanitizedTitleForFilename ? `${sanitizedTitleForFilename}.jpg` : `processed_${sanitizeFilename(fileToRetry.name.replace(/\.[^/.]+$/, ''), 40)}.jpg`;
                        
                        const isErrorRetry = newMeta.title.includes("Error") || newMeta.title.includes("N/A (Parsing Error)");

                        generatedFilesData[index] = {
                            ...generatedFilesData[index],
                            blob: newBlob,
                            metadata: newMeta,
                            newName: newNewFileName,
                            xmpData: newXmpContent,
                            error: isErrorRetry || !newBlob || newBlob.size === 0,
                            status: isErrorRetry ? newMeta.title : (newBlob?.size > 0 ? "Processed successfully (retry)" : "Retry failed, empty blob")
                        };

                        const cardToUpdate = document.getElementById(`result-card-gen-${fileToRetry.name.replace(/[^a-zA-Z0-9]/g, '-')}`); 
                        if (cardToUpdate) {
                            const thumbnailUrl = newBlob?.size > 0 ? URL.createObjectURL(newBlob) : (fileToRetry ? URL.createObjectURL(fileToRetry) : '');
                            cardToUpdate.innerHTML = createResultCardHTML(fileToRetry.name, newNewFileName, generatedFilesData[index].status, newMeta, generatedFilesData[index].error, index, 'generate', thumbnailUrl);
                        }
                        showToast(`Retry for ${fileToRetry.name} ${generatedFilesData[index].error ? 'failed' : 'OK'}.`, generatedFilesData[index].error ? 'error' : 'success');
                    } catch (error) {
                        showToast(`Retry attempt failed for ${fileToRetry.name}: ${error.message}`, 'error');
                        console.error("Retry error:", error);
                    } finally {
                        hideLoader();
                    }
                } else {
                    showToast('Retry is only available for metadata generation.', 'info');
                }
            }
        });
    });

    if(downloadAllGeneratedBtn) downloadAllGeneratedBtn.addEventListener('click', async () => {
        const validFilesToZip=generatedFilesData.filter(fd=>fd.blob&&fd.blob.size>0&&!fd.error);
        if(validFilesToZip.length===0){
            showToast('No valid processed files to download. Files with errors are excluded.','info');
            return;
        }
        showLoader('Zipping files...');
        const zip=new JSZip();

        validFilesToZip.forEach(fileData=>{
            zip.file(fileData.newName,fileData.blob);
            if(fileData.xmpData){
                const baseFileName = fileData.newName.substring(0, fileData.newName.lastIndexOf('.')) || fileData.newName;
                const xmpFilename = `${baseFileName}.xmp`;
                zip.file(xmpFilename, fileData.xmpData);
            }
        });

        try{
            updateGlobalProgressBar(0,100,`Zipping... 0%`);
            const content=await zip.generateAsync({type:'blob'},metadata_zip=>updateGlobalProgressBar(Math.floor(metadata_zip.percent),100,`Zipping... ${Math.floor(metadata_zip.percent)}%`));
            downloadBlob(content, 'generated_metadata_images.zip');
            showToast('Zip file download started.','success');
            updateGlobalProgressBar(100,100,`Zipping complete!`);
        }catch(e){
            console.error("Error creating zip:",e);
            showToast('Error creating zip file.','error');
            updateGlobalProgressBar(0,0,`Zipping failed.`);
        }finally{
            hideLoader();
        }
    });

    // --- Tab: Read Metadata ---
    if (readImageFileInput) {
        readImageFileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) {
                if (metadataResultsDisplay)
                    metadataResultsDisplay.innerHTML = '<p class="text-slate-500 italic">Select an image to view its metadata.</p>';
                if (readImagePreview)
                    readImagePreview.classList.add('hidden');
                return;
            }
            if (!file.type.startsWith('image/')) {
                showToast('Please select an image file.', 'warning');
                if (metadataResultsDisplay)
                    metadataResultsDisplay.innerHTML = '<p class="text-red-500 italic">Invalid file type. Please select an image.</p>';
                if (readImagePreview)
                    readImagePreview.classList.add('hidden');
                return;
            }
            showLoader('Reading metadata...');
            try {
                const metadata = await readAllMetadata(file);
                if (metadataResultsDisplay)
                    metadataResultsDisplay.innerHTML = displayAllMetadataHTML(metadata, file.name);
            } catch (error) {
                console.error('Error reading metadata:', error);
                if (metadataResultsDisplay)
                    metadataResultsDisplay.innerHTML = `<div class="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">Error reading metadata: ${error.message}</div>`;
                showToast(`Error reading metadata for ${file.name}.`, 'error');
            } finally {
                hideLoader();
            }
        });
    }

    async function readAllMetadata(file) {
        let fileToRead = file;
        // Convert to JPEG if not JPEG/TIFF for EXIF reading
        if (file.type !== 'image/jpeg' && file.type !== 'image/tiff') {
            try {
                fileToRead = await convertToJpeg(file, 1.0);
            } catch (e) {
                console.warn(`Could not convert ${file.name} to JPEG for EXIF reading.`, e);
            }
        }
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const dataUrl = reader.result;
                    const exifObj = piexif.load(dataUrl);

                    // Helper functions
                    function fGPS(d, r) {
                        if (!d || !r || !Array.isArray(d) || d.length < 3) return null;
                        return `${d[0][0] / d[0][1]}° ${d[1][0] / d[1][1]}' ${d[2][0] / d[2][1]}" ${r}`;
                    }
                    function fDT(s) {
                        if (!s || typeof s !== 'string') return null;
                        return s.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
                    }
                    function fR(r) {
                        if (!r || !Array.isArray(r) || r.length < 2) return null;
                        return r[1] === 0 ? `${r[0]}` : `${r[0]}/${r[1]}`;
                    }
                    function fRF(r, p = 2) {
                        if (!r || !Array.isArray(r) || r.length < 2 || r[1] === 0) return null;
                        return (r[0] / r[1]).toFixed(p);
                    }

                    const meta = {
                        xpTitle: decodeUTF16(exifObj["0th"]?.[piexif.ImageIFD.XPTitle]) || null,
                        xpComment: decodeUTF16(exifObj["0th"]?.[piexif.ImageIFD.XPComment]) || null,
                        xpAuthor: decodeUTF16(exifObj["0th"]?.[piexif.ImageIFD.XPAuthor]) || null,
                        xpKeywords: decodeUTF16(exifObj["0th"]?.[piexif.ImageIFD.XPKeywords]) || null,
                        xpSubject: decodeUTF16(exifObj["0th"]?.[piexif.ImageIFD.XPSubject]) || null,

                        imageDescription: exifObj["0th"]?.[piexif.ImageIFD.ImageDescription] || null,
                        make: exifObj["0th"]?.[piexif.ImageIFD.Make] || null,
                        model: exifObj["0th"]?.[piexif.ImageIFD.Model] || null,
                        orientation: exifObj["0th"]?.[piexif.ImageIFD.Orientation] || null,
                        xResolution: fR(exifObj["0th"]?.[piexif.ImageIFD.XResolution]),
                        yResolution: fR(exifObj["0th"]?.[piexif.ImageIFD.YResolution]),
                        resolutionUnit: exifObj["0th"]?.[piexif.ImageIFD.ResolutionUnit] || null,
                        software: exifObj["0th"]?.[piexif.ImageIFD.Software] || null,
                        dateTime: fDT(exifObj["0th"]?.[piexif.ImageIFD.DateTime]) || null,
                        artist: exifObj["0th"]?.[piexif.ImageIFD.Artist] || null,
                        copyright: exifObj["0th"]?.[piexif.ImageIFD.Copyright] || null,

                        exposureTime: fR(exifObj.Exif?.[piexif.ExifIFD.ExposureTime]),
                        fNumber: fRF(exifObj.Exif?.[piexif.ExifIFD.FNumber], 1),
                        exposureProgram: exifObj.Exif?.[piexif.ExifIFD.ExposureProgram] || null,
                        isoSpeedRatings: exifObj.Exif?.[piexif.ExifIFD.ISOSpeedRatings] || null,
                        dateTimeOriginal: fDT(exifObj.Exif?.[piexif.ExifIFD.DateTimeOriginal]) || null,
                        dateTimeDigitized: fDT(exifObj.Exif?.[piexif.ExifIFD.DateTimeDigitized]) || null,
                        shutterSpeedValue: fRF(exifObj.Exif?.[piexif.ExifIFD.ShutterSpeedValue]),
                        apertureValue: fRF(exifObj.Exif?.[piexif.ExifIFD.ApertureValue]),
                        brightnessValue: fRF(exifObj.Exif?.[piexif.ExifIFD.BrightnessValue]),
                        exposureBiasValue: fRF(exifObj.Exif?.[piexif.ExifIFD.ExposureBiasValue]),
                        maxApertureValue: fRF(exifObj.Exif?.[piexif.ExifIFD.MaxApertureValue]),
                        subjectDistance: fRF(exifObj.Exif?.[piexif.ExifIFD.SubjectDistance]),
                        meteringMode: exifObj.Exif?.[piexif.ExifIFD.MeteringMode] || null,
                        flash: exifObj.Exif?.[piexif.ExifIFD.Flash] || null,
                        focalLength: fRF(exifObj.Exif?.[piexif.ExifIFD.FocalLength], 1),
                        userComment: decodeUTF16(exifObj.Exif?.[piexif.ExifIFD.UserComment]) || null,
                        pixelXDimension: exifObj.Exif?.[piexif.ExifIFD.PixelXDimension] || null,
                        pixelYDimension: exifObj.Exif?.[piexif.ExifIFD.PixelYDimension] || null,
                        focalLengthIn35mmFilm: exifObj.Exif?.[piexif.ExifIFD.FocalLengthIn35mmFilm] || null,
                        lensSpecification: exifObj.Exif?.[piexif.ExifIFD.LensSpecification]?.map(r_val => fRF(r_val, 1)).join(', ') || null,
                        lensMake: exifObj.Exif?.[piexif.ExifIFD.LensMake] || null,
                        lensModel: exifObj.Exif?.[piexif.ExifIFD.LensModel] || null,

                        gpsLatitude: fGPS(exifObj.GPS?.[piexif.GPSIFD.GPSLatitude], exifObj.GPS?.[piexif.GPSIFD.GPSLatitudeRef]) || null,
                        gpsLongitude: fGPS(exifObj.GPS?.[piexif.GPSIFD.GPSLongitude], exifObj.GPS?.[piexif.GPSIFD.GPSLongitudeRef]) || null,
                        gpsAltitude: exifObj.GPS?.[piexif.GPSIFD.GPSAltitude]
                            ? fRF(exifObj.GPS[piexif.GPSIFD.GPSAltitude], 0) + 'm'
                            : null,
                        gpsTimeStamp: exifObj.GPS?.[piexif.GPSIFD.GPSTimeStamp]?.map(t => fRF(t, 0)).join(':') || null,
                        gpsDateStamp: exifObj.GPS?.[piexif.GPSIFD.GPSDateStamp] || null,
                    };
                    resolve(meta);
                } catch (error) {
                    if (
                        error.message.includes("Given data is not JPEG.") ||
                        error.message.includes("Given data is not TIFF.")
                    ) {
                        resolve({ error: `File type (${file.type}) not directly EXIF supported or could not be converted.` });
                    } else if (error.message.includes("Given data is not EXIF.")) {
                        resolve({ error: "No EXIF data found in this image." });
                    } else {
                        console.error('Error parsing EXIF data:', error);
                        resolve({ error: 'Failed to parse EXIF data. The file might be corrupted or not contain standard EXIF.' });
                    }
                }
            };
            reader.onerror = () => resolve({ error: 'FileReader failed to read the image.' });
            reader.readAsDataURL(fileToRead);
        });
    }

    function displayAllMetadataHTML(metadata, filename) {
        if (metadata.error) {
            return `<div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
                <p class="font-bold">Notice for ${filename}</p>
                <p>${metadata.error}</p>
            </div>`;
        }
        let html = `<h2 class="text-xl font-semibold text-blue-600 mb-4">Metadata for ${filename}</h2>`;
        const sections = {
            'App Specific (XP Tags)': ['xpTitle', 'xpSubject', 'xpKeywords', 'xpComment', 'xpAuthor'],
            'Primary Image': [
                'imageDescription', 'make', 'model', 'orientation', 'xResolution', 'yResolution',
                'resolutionUnit', 'software', 'dateTime', 'artist', 'copyright'
            ],
            'Camera & Exposure': [
                'exposureTime', 'fNumber', 'exposureProgram', 'isoSpeedRatings', 'shutterSpeedValue',
                'apertureValue', 'brightnessValue', 'exposureBiasValue', 'maxApertureValue',
                'subjectDistance', 'meteringMode', 'flash', 'focalLength', 'focalLengthIn35mmFilm',
                'lensSpecification', 'lensMake', 'lensModel'
            ],
            'Date & Time': ['dateTimeOriginal', 'dateTimeDigitized'],
            'Image Dimensions': ['pixelXDimension', 'pixelYDimension'],
            'GPS Data': ['gpsLatitude', 'gpsLongitude', 'gpsAltitude', 'gpsTimeStamp', 'gpsDateStamp'],
            'Other': ['userComment']
        };
        let foundAnyData = false;
        for (const sectionTitle in sections) {
            const fields = sections[sectionTitle].filter(
                key => metadata[key] !== null && typeof metadata[key] !== 'undefined' && String(metadata[key]).trim() !== ""
            );
            if (fields.length === 0) continue;
            foundAnyData = true;
            html += `<div class="section-block">
                <h3 class="text-lg font-semibold text-slate-700 border-b border-slate-200 pb-2 mb-3">${sectionTitle}</h3>
                <dl class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">`;
            fields.forEach(key => {
                const val = metadata[key];
                const dispVal = Array.isArray(val) ? val.join(', ') : String(val);
                const dispName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                html += `<div class="py-1 break-words">
                    <dt class="font-medium text-slate-600">${dispName}:</dt>
                    <dd class="text-slate-800 whitespace-pre-wrap">${dispVal}</dd>
                </div>`;
            });
            html += `</dl></div>`;
        }
        if (!foundAnyData)
            html += '<p class="text-slate-500 italic">No significant EXIF data found for this image.</p>';
        return html;
    }

    // --- Tab: Delete Metadata ---
    if (deleteMetadataBtn) {
        deleteMetadataBtn.addEventListener('click', async () => {
            const file = deleteImageFileInput.files[0];
            if (!file) {
                showToast('Please select an image.', 'warning');
                return;
            }
            if (file.type !== 'image/jpeg') {
                showToast('This function currently only supports JPEG images for metadata removal.', 'warning');
                return;
            }
            showLoader('Clearing metadata...');
            try {
                const reader = new FileReader();
                reader.onload = async e_reader => {
                    try {
                        let dataUrl = e_reader.target.result;
                        let exifObj = piexif.load(dataUrl);

                        // Remove app-specific and standard tags
                        delete exifObj["0th"][piexif.ImageIFD.XPTitle];
                        delete exifObj["0th"][piexif.ImageIFD.XPSubject];
                        delete exifObj["0th"][piexif.ImageIFD.XPKeywords];
                        delete exifObj["0th"][piexif.ImageIFD.XPComment];
                        delete exifObj["0th"][piexif.ImageIFD.XPAuthor];
                        delete exifObj["0th"][piexif.ImageIFD.Software];

                        const exifBytes = piexif.dump(exifObj);
                        const updatedDataUrl = piexif.insert(exifBytes, dataUrl);
                        const byteString = atob(updatedDataUrl.split(',')[1]);
                        const ab = new ArrayBuffer(byteString.length);
                        const ia = new Uint8Array(ab);
                        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                        const blob = new Blob([ab], { type: "image/jpeg" });

                        downloadBlob(blob, `cleaned_${file.name}`);
                        showToast('App-specific metadata cleared and download started.', 'success');

                        if (deleteImageFileInput) deleteImageFileInput.value = null;
                        if (deleteImagePreview) {
                            deleteImagePreview.classList.add('hidden');
                            deleteImagePreview.src = "#";
                        }
                        const delDP = deleteFileDropZone ? deleteFileDropZone.querySelector('p') : null;
                        if (delDP && deleteFileDropZone)
                            delDP.textContent = deleteFileDropZone.dataset.defaultText || "Drag JPEG here";
                    } catch (exifError) {
                        console.error("EXIF processing error during delete:", exifError);
                        if (exifError.message.includes("Given data is not EXIF."))
                            showToast('No EXIF data found to delete.', 'info');
                        else
                            showToast('Error processing EXIF data for deletion.', 'error');
                    } finally {
                        hideLoader();
                    }
                };
                reader.onerror = () => {
                    showToast('Failed to read file for metadata deletion.', 'error');
                    hideLoader();
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Error deleting metadata:', error);
                showToast('An error occurred while deleting metadata.', 'error');
                hideLoader();
            }
        });
    }

    // --- Tab: Convert to JPEG ---
    if (jpegQualitySlider && jpegQualityValueSpan) {
        jpegQualitySlider.addEventListener('input', (e) => {
            jpegQualityValueSpan.textContent = e.target.value;
        });
    }

    if (convertBtn) {
        convertBtn.addEventListener('click', async () => {
            const files = convertImageFilesInput.files;
            if (files.length === 0) {
                showToast('Please select at least one image to convert.', 'warning');
                return;
            }
            const quality = parseInt(jpegQualitySlider.value) / 100;
            showLoader('Preparing to convert images...');
            if (convertResultsDiv) convertResultsDiv.innerHTML = '';
            convertedFilesData = [];
            if (downloadAllConvertedBtn) downloadAllConvertedBtn.style.display = 'none';
            updateGlobalProgressBar(0, files.length, "Starting conversion...");

            try {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    updateGlobalProgressBar(i + 1, files.length, `Converting ${file.name}...`);
                    showLoader(`Converting ${file.name} (${i + 1}/${files.length})`);

                    if (!file.type.startsWith('image/')) {
                        showToast(`${file.name} is not an image. Skipped.`, 'warning');
                        const errorCard = document.createElement('div');
                        errorCard.className = 'result-card text-yellow-700 p-3 my-1 rounded border border-yellow-300 bg-yellow-50';
                        errorCard.innerHTML = `<p class="font-medium">${file.name} - Skipped (not an image)</p>`;
                        if (convertResultsDiv) convertResultsDiv.appendChild(errorCard);
                        continue;
                    }

                    try {
                        const convertedBlob = await convertToJpeg(file, quality);
                        const newFileName = `${sanitizeFilename(file.name.replace(/\.[^/.]+$/, ''), 40)}_q${parseInt(jpegQualitySlider.value)}.jpg`;
                        convertedFilesData.push({
                            blob: convertedBlob,
                            newName: newFileName,
                            originalName: file.name,
                            originalFileReference: file,
                            error: false,
                            status: `Converted (${(convertedBlob.size / 1024).toFixed(1)}KB)`
                        });

                        const resultCard = document.createElement('div');
                        resultCard.className = 'result-card';
                        const thumbnailUrl = URL.createObjectURL(convertedBlob);
                        resultCard.innerHTML = createResultCardHTML(
                            file.name,
                            newFileName,
                            `Converted (${(convertedBlob.size / 1024).toFixed(1)}KB) - Original: (${(file.size / 1024).toFixed(1)}KB)`,
                            null,
                            false,
                            convertedFilesData.length - 1,
                            'convert',
                            thumbnailUrl
                        );
                        if (convertResultsDiv) convertResultsDiv.appendChild(resultCard);
                    } catch (conversionError) {
                        console.error(`Error converting ${file.name}:`, conversionError);
                        showToast(`Failed to convert ${file.name}. ${conversionError.message}`, 'error');
                        convertedFilesData.push({
                            blob: null,
                            newName: file.name,
                            originalName: file.name,
                            originalFileReference: file,
                            error: true,
                            status: `Conversion Failed: ${conversionError.message}`
                        });
                        const errorCard = document.createElement('div');
                        errorCard.className = 'result-card text-red-700 p-3 my-1 rounded border border-red-300 bg-red-50';
                        errorCard.innerHTML = `<p class="font-medium">${file.name} - Conversion Failed</p><p class="text-sm">${conversionError.message}</p>`;
                        if (convertResultsDiv) convertResultsDiv.appendChild(errorCard);
                    }
                }

                updateGlobalProgressBar(files.length, files.length, "All files processed for conversion!");

                if (convertedFilesData.length > 0) {
                    const successfulConversions = convertedFilesData.filter(f => !f.error).length;
                    showToast(`Finished converting ${successfulConversions} of ${convertedFilesData.length} image(s).`, 'success');
                    if (downloadAllConvertedBtn && successfulConversions > 0)
                        downloadAllConvertedBtn.style.display = 'flex';
                } else if (files.length > 0) {
                    showToast(`Conversion process completed, but no files were successfully converted.`, 'warning');
                }

                if (convertImageFilesInput) convertImageFilesInput.value = null;
                if (convertImageList) convertImageList.innerHTML = '';
                const convDP = convertFileDropZone ? convertFileDropZone.querySelector('p') : null;
                if (convDP && convertFileDropZone)
                    convDP.textContent = convertFileDropZone.dataset.defaultText || "Drag 'n' drop images here, or click to select";
            } catch (error) {
                console.error('Error during batch conversion:', error);
                showToast('An error occurred during conversion.', 'error');
                updateGlobalProgressBar(files.length, files.length, "Conversion failed.");
            } finally {
                hideLoader();
            }
        });
    }

    if (downloadAllConvertedBtn) {
        downloadAllConvertedBtn.addEventListener('click', async () => {
            const validFiles = convertedFilesData.filter(fd => fd.blob?.size > 0 && !fd.error);
            if (validFiles.length === 0) {
                showToast('No valid converted files to download.', 'info');
                return;
            }
            showLoader('Zipping converted files...');
            const zip = new JSZip();
            validFiles.forEach(fd => zip.file(fd.newName, fd.blob));
            try {
                updateGlobalProgressBar(0, 100, `Zipping... 0%`);
                const content = await zip.generateAsync({ type: 'blob' }, m =>
                    updateGlobalProgressBar(Math.floor(m.percent), 100, `Zipping... ${Math.floor(m.percent)}%`)
                );
                downloadBlob(content, 'converted_images.zip');
                showToast('Converted images ZIP download started.', 'success');
                updateGlobalProgressBar(100, 100, `Zip complete!`);
            } catch (e) {
                console.error("Zip converted error:", e);
                showToast('Error creating ZIP for converted files.', 'error');
                updateGlobalProgressBar(0, 0, "Zip creation failed.");
            } finally {
                hideLoader();
            }
        });
    }

    // --- Main Thread Fallback Image Processing Functions ---
    async function autoCropImageMainThread(file, options) {
        return new Promise((resolve, reject) => {
            const targetAspectRatio = options.targetAspectRatio;
            const outputFormat = options.outputFormat || 'image/jpeg';
            const jpegQuality = options.jpegQuality !== undefined ? options.jpegQuality : 0.92;

            const image = new Image();
            image.src = URL.createObjectURL(file);
            image.onload = () => {
                URL.revokeObjectURL(image.src);
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                if (isNaN(targetAspectRatio) || targetAspectRatio <= 0) { // Free form or invalid
                    canvas.width = image.naturalWidth;
                    canvas.height = image.naturalHeight;
                    ctx.drawImage(image, 0, 0);
                } else {
                    let srcX = 0, srcY = 0, srcW = image.naturalWidth, srcH = image.naturalHeight;
                    const curAR = srcW / srcH;
                    if (curAR > targetAspectRatio) {
                        srcW = srcH * targetAspectRatio;
                        srcX = (image.naturalWidth - srcW) / 2;
                    } else if (curAR < targetAspectRatio) {
                        srcH = srcW / targetAspectRatio;
                        srcY = (image.naturalHeight - srcH) / 2;
                    }
                    srcW = Math.max(1, Math.round(srcW));
                    srcH = Math.max(1, Math.round(srcH));
                    srcX = Math.round(srcX);
                    srcY = Math.round(srcY);

                    canvas.width = srcW;
                    canvas.height = srcH;
                    ctx.drawImage(image, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
                }
                canvas.toBlob(blob => {
                    if (blob) resolve(blob);
                    else reject(new Error('Canvas toBlob failed for autoCrop (main thread).'));
                }, outputFormat, jpegQuality);
            };
            image.onerror = () => {
                URL.revokeObjectURL(image.src);
                reject(new Error('Image loading failed for autoCrop (main thread).'));
            };
        });
    }

    async function resizeImageWithCanvas(file, options) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                let finalWidth = img.naturalWidth;
                let finalHeight = img.naturalHeight;
                const originalAspectRatio = img.naturalWidth / img.naturalHeight;

                if (options.mode === 'dimensions') {
                    const tw = options.targetWidth ? parseInt(options.targetWidth) : 0;
                    const th = options.targetHeight ? parseInt(options.targetHeight) : 0;

                    if (options.maintainAspectRatio) {
                        if (tw && th) { // Both width and height are targets, fit within bounds
                            const ratioW = tw / img.naturalWidth;
                            const ratioH = th / img.naturalHeight;
                            if (ratioW < ratioH) {
                                finalWidth = tw;
                                finalHeight = Math.round(tw / originalAspectRatio);
                            } else {
                                finalHeight = th;
                                finalWidth = Math.round(th * originalAspectRatio);
                            }
                        } else if (tw) { // Only width is target
                            finalWidth = tw;
                            finalHeight = Math.round(tw / originalAspectRatio);
                        } else if (th) { // Only height is target
                            finalHeight = th;
                            finalWidth = Math.round(th * originalAspectRatio);
                        }
                        // If neither tw nor th, original size is kept
                    } else { // Not maintaining aspect ratio, stretch/squash
                        if (tw) finalWidth = tw;
                        if (th) finalHeight = th;
                        // If one is not provided, it remains original
                    }
                } else if (options.mode === 'percentage') {
                    const scale = (options.percentage ? parseInt(options.percentage) : 100) / 100;
                    if (scale <=0) { reject(new Error('Percentage must be > 0.')); return; }
                    finalWidth = Math.round(img.naturalWidth * scale);
                    finalHeight = Math.round(img.naturalHeight * scale);
                }

                finalWidth = Math.max(1, finalWidth); // Ensure at least 1px
                finalHeight = Math.max(1, finalHeight);

                canvas.width = finalWidth;
                canvas.height = finalHeight;
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

                const qualityParam = options.outputFormat === 'image/jpeg' ? options.jpegQuality : undefined;
                canvas.toBlob(blob => {
                    if (blob) resolve(blob);
                    else reject(new Error('Canvas toBlob failed for resize (main thread).'));
                }, options.outputFormat, qualityParam);
                URL.revokeObjectURL(img.src);
            };
            img.onerror = () => {
                URL.revokeObjectURL(img.src);
                reject(new Error('Image loading failed for resize (main thread).'));
            };
            img.src = URL.createObjectURL(file);
        });
    }

    // --- Universal Batch Processing with Worker Function ---
    async function processBatchWithWorker(filesArrayLike, options, taskType, resultsDiv, dataArray, newFileNamePrefix) {
        const files = Array.from(filesArrayLike);
        if (!files || files.length === 0) {
            showToast(`No images selected for ${taskType}.`, 'warning');
            return;
        }

        showLoader(`Batch ${taskType}ing...`);
        if (resultsDiv) resultsDiv.innerHTML = '';
        dataArray.length = 0;

        totalFilesForBatch = files.length;
        filesProcessedByWorkerCounter = 0;
        batchFilesCurrentlyProcessing = 0;

        updateGlobalProgressBar(0, totalFilesForBatch, `Starting batch ${taskType}...`);

        const useWorker = window.Worker && typeof OffscreenCanvas !== 'undefined';
        if (!useWorker) {
            console.warn("Web Workers or OffscreenCanvas not supported. Using main thread.");
            showToast("Processing on main thread (UI might be less responsive).", "info", 4000);
        }

        const allWorkersFinishedPromise = new Promise((resolveBatch) => {
            if (files.length === 0) {
                resolveBatch();
                return;
            }

            files.forEach(async (file, index) => {
                batchFilesCurrentlyProcessing++;
                updateGlobalProgressBar(filesProcessedByWorkerCounter, totalFilesForBatch, `Preparing ${file.name} (${filesProcessedByWorkerCounter + 1}/${totalFilesForBatch})`);

                if (!file.type.startsWith('image/')) {
                    showToast(`${file.name} is not an image. Skipped.`, 'warning');
                    filesProcessedByWorkerCounter++;
                    batchFilesCurrentlyProcessing--;
                    const errorCard = document.createElement('div');
                    errorCard.className = 'result-card text-yellow-700 p-3 my-1 rounded border border-yellow-300 bg-yellow-50';
                    errorCard.innerHTML = `<p class="font-medium">${file.name} - Skipped (not an image)</p>`;
                    if (resultsDiv) resultsDiv.appendChild(errorCard);
                    if (filesProcessedByWorkerCounter === totalFilesForBatch && batchFilesCurrentlyProcessing === 0) {
                        resolveBatch();
                    }
                    return;
                }

                const processFile = async (fileToProcess) => {
                    try {
                        let resultBlob;

                        if (useWorker) {
                            try {
                                resultBlob = await new Promise((resolveWorker, rejectWorker) => {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                        const worker = new Worker('imageProcessorWorker.js');
                                        const operationId = `${taskType}-${fileToProcess.name.replace(/[^a-zA-Z0-9]/g, '-')}-${index}`;

                                        worker.postMessage({
                                            fileDataUrl: event.target.result,
                                            options,
                                            operationId,
                                            fileName: fileToProcess.name,
                                            taskType,
                                            originalFileType: fileToProcess.type
                                        });

                                        worker.onmessage = (e) => {
                                            const { success, blob, error } = e.data;
                                            if (success && blob) {
                                                resolveWorker(blob);
                                            } else {
                                                rejectWorker(new Error(error || `Worker processing failed for ${fileToProcess.name}`));
                                            }
                                            worker.terminate();
                                        };

                                        worker.onerror = (e_worker_error) => {
                                            rejectWorker(new Error(`Worker error: ${e_worker_error.message || 'Unknown worker error'}`));
                                            worker.terminate();
                                        };
                                        setTimeout(() => { // Worker timeout
                                            worker.terminate();
                                            rejectWorker(new Error('Worker timeout'));
                                        }, 30000);
                                    };
                                    reader.onerror = () => rejectWorker(new Error(`FileReader error for ${fileToProcess.name}`));
                                    reader.readAsDataURL(fileToProcess);
                                });
                            } catch (workerError) {
                                console.warn(`Worker failed for ${fileToProcess.name}, falling back to main thread:`, workerError);
                                if (taskType === 'autocrop') {
                                    resultBlob = await autoCropImageMainThread(fileToProcess, options);
                                } else if (taskType === 'resize') {
                                    resultBlob = await resizeImageWithCanvas(fileToProcess, options);
                                } else {
                                    throw new Error(`Unknown task type for main thread fallback: ${taskType}`);
                                }
                            }
                        } else { // Main thread processing if worker not available/failed
                            if (taskType === 'autocrop') {
                                resultBlob = await autoCropImageMainThread(fileToProcess, options);
                            } else if (taskType === 'resize') {
                                resultBlob = await resizeImageWithCanvas(fileToProcess, options);
                            } else {
                                throw new Error(`Unknown task type: ${taskType}`);
                            }
                        }

                        if (resultBlob && resultBlob.size > 0) {
                            const extension = resultBlob.type.split('/')[1] || (options.outputFormat ? options.outputFormat.split('/')[1] : 'jpg');
                            const newFileName = `${newFileNamePrefix}${sanitizeFilename(fileToProcess.name.replace(/\.[^/.]+$/, ''), 40)}.${extension}`;
                            dataArray.push({ blob: resultBlob, newName: newFileName, originalName: fileToProcess.name, error: false, status: `${taskType}ed successfully` });

                            const resultCard = document.createElement('div');
                            resultCard.className = 'result-card';
                            const thumbnailUrl = URL.createObjectURL(resultBlob);
                            resultCard.innerHTML = createResultCardHTML(
                                fileToProcess.name, newFileName,
                                `${taskType.charAt(0).toUpperCase() + taskType.slice(1)}ed (${(resultBlob.size / 1024).toFixed(1)}KB)`,
                                null, false, dataArray.length - 1, taskType, thumbnailUrl
                            );
                            if (resultsDiv) resultsDiv.appendChild(resultCard);
                        } else {
                            throw new Error(`Processing resulted in an empty blob for ${fileToProcess.name}`);
                        }
                    } catch (err) {
                        console.error(`Error ${taskType}ing ${fileToProcess.name}:`, err);
                        showToast(`Error ${taskType}ing ${fileToProcess.name}: ${err.message}`, 'error', 5000);
                        const errorCard = document.createElement('div');
                        errorCard.className = 'result-card text-red-700 p-3 my-1 rounded border border-red-300 bg-red-50';
                        errorCard.innerHTML = `<p class="font-medium">${fileToProcess.name} - ${taskType} Failed</p><p class="text-sm">${err.message}</p>`;
                        if (resultsDiv) resultsDiv.appendChild(errorCard);
                        dataArray.push({ blob: null, newName: fileToProcess.name, originalName: fileToProcess.name, error: true, status: `${taskType} failed: ${err.message}` });
                    } finally {
                        filesProcessedByWorkerCounter++;
                        batchFilesCurrentlyProcessing--;
                        updateGlobalProgressBar(filesProcessedByWorkerCounter, totalFilesForBatch, `${taskType}: ${filesProcessedByWorkerCounter}/${totalFilesForBatch} done.`);
                        if (filesProcessedByWorkerCounter === totalFilesForBatch && batchFilesCurrentlyProcessing === 0) {
                            resolveBatch();
                        }
                    }
                };
                processFile(file);
            });
        });

        await allWorkersFinishedPromise;
        updateGlobalProgressBar(totalFilesForBatch, totalFilesForBatch, `Batch ${taskType} complete!`);

        const validResults = dataArray.filter(d => d.blob && d.blob.size > 0 && !d.error);
        if (validResults.length > 0) {
            showToast(`Finished batch ${taskType}ing ${validResults.length} of ${totalFilesForBatch} image(s).`, 'success');
            const zip = new JSZip();
            validResults.forEach(d => zip.file(d.newName, d.blob));

            updateGlobalProgressBar(0, 100, `Zipping ${taskType}ed files... 0%`);
            try {
                const content = await zip.generateAsync({ type: "blob" }, m =>
                    updateGlobalProgressBar(Math.floor(m.percent), 100, `Zipping... ${Math.floor(m.percent)}%`)
                );
                downloadBlob(content, `batch_${taskType}ed_images.zip`);
                showToast(`${taskType.charAt(0).toUpperCase() + taskType.slice(1)}ed images ZIP download started.`, 'success');
                updateGlobalProgressBar(100, 100, `Zipping complete!`);
            } catch (zipError) {
                console.error(`Error zipping ${taskType}ed files:`, zipError);
                showToast(`Error creating ZIP for ${taskType}ed files.`, 'error');
                updateGlobalProgressBar(0, 0, `Zipping failed.`);
            }
        } else if (totalFilesForBatch > 0) {
            showToast(`Batch ${taskType} process completed, but no files were successfully ${taskType}ed.`, 'warning');
        }

        const typeKey = taskType === 'autocrop' ? 'crop' : (taskType === 'resize' ? 'resize' : null);
        if (typeKey) {
            const fileInputElem = document.getElementById(`${typeKey}ImageFiles`);
            const fileListElem = document.getElementById(`${typeKey}ImageList`);
            const dropZoneElem = document.getElementById(`${typeKey}FileDropZone`);
            const dropZoneTextElem = dropZoneElem ? dropZoneElem.querySelector('p') : null;

            if (fileInputElem) fileInputElem.value = null;
            if (fileListElem) fileListElem.innerHTML = '';
            if (dropZoneTextElem && dropZoneElem && dropZoneElem.dataset.defaultText) {
                dropZoneTextElem.textContent = dropZoneElem.dataset.defaultText;
            } else if (dropZoneTextElem) {
                 dropZoneTextElem.textContent = "Drag 'n' drop files here, or click to select files";
            }
        }
        hideLoader();
    }

    // --- CROP TAB ---

    // Function to switch between Auto and Manual crop modes
    function switchCropMode(mode) {
        if (mode === 'auto') {
            autoCropModeUI.classList.remove('hidden');
            manualCropModeUI.classList.add('hidden');
            autoCropModeBtn.classList.add('bg-blue-600', 'text-white');
            autoCropModeBtn.classList.remove('bg-slate-100', 'text-slate-700'); 
            manualCropModeBtn.classList.add('bg-slate-100', 'text-slate-700');
            manualCropModeBtn.classList.remove('bg-blue-600', 'text-white');

            if (cropperManualInstance) {
                cropperManualInstance.destroy();
                cropperManualInstance = null;
            }
            if (imageToCropManual) imageToCropManual.src = '#';
            if (manualCropperWrapper) manualCropperWrapper.classList.add('hidden');
            if(manualCropImageFileInput) manualCropImageFileInput.value = '';
            if(manualCropImageList) manualCropImageList.innerHTML = '';
            const manualDropZoneText = manualCropFileDropZone ? manualCropFileDropZone.querySelector('p') : null;
            if (manualDropZoneText && manualCropFileDropZone) {
                manualDropZoneText.textContent = manualCropFileDropZone.dataset.defaultText || "Drag 'n' drop an image here, or click to select";
            }

            [manualCropAspectRatioSelect, manualCropOutputFormat, manualCropJpegQuality,
             applyManualCropAndDownloadBtn, resetManualCropBtn, zoomInManualCropBtn, zoomOutManualCropBtn,
             rotateLeftManualCropBtn, rotateRightManualCropBtn].forEach(el => { if(el) el.disabled = true });

        } else if (mode === 'manual') {
            autoCropModeUI.classList.add('hidden');
            manualCropModeUI.classList.remove('hidden');
            manualCropModeBtn.classList.add('bg-blue-600', 'text-white');
            manualCropModeBtn.classList.remove('bg-slate-100', 'text-slate-700');
            autoCropModeBtn.classList.add('bg-slate-100', 'text-slate-700');
            autoCropModeBtn.classList.remove('bg-blue-600', 'text-white');

            if(cropImageFilesInput) cropImageFilesInput.value = '';
            if(cropImageList) cropImageList.innerHTML = '';
            const autoDropZoneText = cropFileDropZone ? cropFileDropZone.querySelector('p') : null;
            if (autoDropZoneText && cropFileDropZone) {
                autoDropZoneText.textContent = cropFileDropZone.dataset.defaultText || "Drag 'n' drop images here, or click to select files";
            }
            if(cropResultsDiv) cropResultsDiv.innerHTML = '';
        }
    }

    if (autoCropModeBtn && manualCropModeBtn) {
        autoCropModeBtn.addEventListener('click', () => switchCropMode('auto'));
        manualCropModeBtn.addEventListener('click', () => switchCropMode('manual'));
    }

    // --- Auto Crop (Batch) Logic ---
    if (startBatchCropBtn && cropImageFilesInput && cropAspectRatioAutoSelect && cropResultsDiv) {
        startBatchCropBtn.addEventListener('click', async () => {
            const files = cropImageFilesInput.files;
            if (files.length === 0) {
                showToast('Please select at least one image to auto-crop.', 'warning');
                return;
            }

            let aspectRatioValue = parseFloat(cropAspectRatioAutoSelect.value);
            if (cropAspectRatioAutoSelect.value === "free") {
                aspectRatioValue = 0;
                showToast("Batch 'Free Form' crop will process images without changing aspect ratio, applying output format.", 'info', 6000);
            } else if (isNaN(aspectRatioValue) || aspectRatioValue <= 0) {
                 showToast("Invalid aspect ratio selected for batch crop. Using free form.", "warning");
                aspectRatioValue = 0;
            }

            const cropOptions = {
                targetAspectRatio: aspectRatioValue,
                outputFormat: 'image/jpeg', // Default for batch auto, can be changed
                jpegQuality: 0.92,
            };
            await processBatchWithWorker(files, cropOptions, 'autocrop', cropResultsDiv, croppedFilesData, 'cropped_auto_');
        });
    }

    // --- Manual Crop Logic ---
    if (manualCropImageFileInput) {
        manualCropImageFileInput.addEventListener('change', function(event) {
            const files = event.target.files;
            if (files && files.length > 0) {
                currentManualCropFile = files[0];
                if (!currentManualCropFile.type.startsWith('image/')) {
                    showToast('Please select a valid image file.', 'error');
                    currentManualCropFile = null;
                    if (cropperManualInstance) cropperManualInstance.destroy();
                    imageToCropManual.src = '#';
                    manualCropperWrapper.classList.add('hidden');
                    [manualCropAspectRatioSelect, manualCropOutputFormat, manualCropJpegQuality,
                     applyManualCropAndDownloadBtn, resetManualCropBtn, zoomInManualCropBtn, zoomOutManualCropBtn,
                     rotateLeftManualCropBtn, rotateRightManualCropBtn].forEach(el => { if(el) el.disabled = true });
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e_reader) => {
                    if (cropperManualInstance) {
                        cropperManualInstance.destroy();
                    }
                    imageToCropManual.src = e_reader.target.result;
                    manualCropperWrapper.classList.remove('hidden');

                    cropperManualInstance = new Cropper(imageToCropManual, {
                        aspectRatio: parseFloat(manualCropAspectRatioSelect.value) || NaN,
                        viewMode: 1,
                        dragMode: 'crop',
                        autoCropArea: 0.8,
                        movable: true,
                        zoomable: true,
                        rotatable: true,
                        scalable: true,
                        cropBoxResizable: true,
                        cropBoxMovable: true,
                        ready: function () {
                            [manualCropAspectRatioSelect, manualCropOutputFormat,
                             applyManualCropAndDownloadBtn, resetManualCropBtn, zoomInManualCropBtn, zoomOutManualCropBtn,
                             rotateLeftManualCropBtn, rotateRightManualCropBtn].forEach(el => { if(el) el.disabled = false });
                            if (manualCropOutputFormat) manualCropOutputFormat.dispatchEvent(new Event('change'));
                        }
                    });
                };
                reader.readAsDataURL(currentManualCropFile);
            }
        });
    }

    if (manualCropAspectRatioSelect && manualCropOutputFormat) {
        manualCropAspectRatioSelect.addEventListener('change', function() {
            if (cropperManualInstance) {
                cropperManualInstance.setAspectRatio(parseFloat(this.value) || NaN);
            }
        });

        manualCropOutputFormat.addEventListener('change', function() {
            if (this.value === 'image/jpeg') {
                if (manualCropJpegQualityContainer) manualCropJpegQualityContainer.classList.remove('hidden');
                if (manualCropJpegQuality) manualCropJpegQuality.disabled = !cropperManualInstance;
            } else {
                if (manualCropJpegQualityContainer) manualCropJpegQualityContainer.classList.add('hidden');
                if (manualCropJpegQuality) manualCropJpegQuality.disabled = true;
            }
        });
    }

    if(manualCropJpegQuality && manualCropJpegQualityValue) {
        manualCropJpegQuality.addEventListener('input', function() {
            manualCropJpegQualityValue.textContent = this.value;
        });
    }

    if (applyManualCropAndDownloadBtn) {
        applyManualCropAndDownloadBtn.addEventListener('click', async () => {
            if (!cropperManualInstance || !currentManualCropFile) {
                showToast('No image loaded or cropper not initialized.', 'error');
                return;
            }
            showLoader('Cropping image...');
            try {
                const outputFormat = manualCropOutputFormat.value;
                const jpegQuality = parseInt(manualCropJpegQuality.value) / 100;

                const canvas = cropperManualInstance.getCroppedCanvas({
                    imageSmoothingEnabled: true,
                    imageSmoothingQuality: 'high'
                });

                canvas.toBlob((blob) => {
                    if (blob) {
                        const extension = outputFormat.split('/')[1] || 'jpg';
                        const filename = `manually_cropped_${sanitizeFilename(currentManualCropFile.name.replace(/\.[^/.]+$/, ''), 40)}.${extension}`;
                        downloadBlob(blob, filename);
                        showToast('Image cropped and download started!', 'success');
                    } else {
                        showToast('Failed to create blob from cropped image.', 'error');
                    }
                    hideLoader();
                }, outputFormat, outputFormat === 'image/jpeg' ? jpegQuality : undefined);

            } catch (error) {
                console.error('Error during manual crop:', error);
                showToast(`Manual crop error: ${error.message}`, 'error');
                hideLoader();
            }
        });
    }

    if (resetManualCropBtn) {
        resetManualCropBtn.addEventListener('click', () => {
            if (cropperManualInstance) cropperManualInstance.reset();
        });
    }
    if (zoomInManualCropBtn) {
        zoomInManualCropBtn.addEventListener('click', () => {
            if (cropperManualInstance) cropperManualInstance.zoom(0.1);
        });
    }
    if (zoomOutManualCropBtn) {
        zoomOutManualCropBtn.addEventListener('click', () => {
            if (cropperManualInstance) cropperManualInstance.zoom(-0.1);
        });
    }
    if (rotateLeftManualCropBtn) {
        rotateLeftManualCropBtn.addEventListener('click', () => {
            if (cropperManualInstance) cropperManualInstance.rotate(-45);
        });
    }
    if (rotateRightManualCropBtn) {
        rotateRightManualCropBtn.addEventListener('click', () => {
            if (cropperManualInstance) cropperManualInstance.rotate(45);
        });
    }
    // --- END CROP TAB ---

    // --- Resize Tab Logic ---
    if (resizeModeSelect) {
        resizeModeSelect.addEventListener('change', function() {
            if (this.value === 'dimensions') {
                if (dimensionsInputsContainer) dimensionsInputsContainer.classList.remove('hidden');
                if (percentageInputContainer) percentageInputContainer.classList.add('hidden');
            } else { // percentage
                if (dimensionsInputsContainer) dimensionsInputsContainer.classList.add('hidden');
                if (percentageInputContainer) percentageInputContainer.classList.remove('hidden');
            }
        });
    }

    if (resizeOutputFormatSelect) {
        resizeOutputFormatSelect.addEventListener('change', function() {
            if (this.value === 'image/jpeg') {
                if (resizeJpegQualityContainer) resizeJpegQualityContainer.classList.remove('hidden');
                if (resizeJpegQualitySlider) resizeJpegQualitySlider.disabled = false;
            } else {
                if (resizeJpegQualityContainer) resizeJpegQualityContainer.classList.add('hidden');
                if (resizeJpegQualitySlider) resizeJpegQualitySlider.disabled = true;
            }
        });
    }

    if (resizeJpegQualitySlider && resizeJpegQualityValueSpan) {
        resizeJpegQualitySlider.addEventListener('input', function() {
            resizeJpegQualityValueSpan.textContent = this.value;
        });
    }

    if (startBatchResizeBtn) {
        startBatchResizeBtn.addEventListener('click', async () => {
            const files = resizeImageFilesInput.files;
            if (files.length === 0) {
                showToast('Please select images to resize.', 'warning');
                return;
            }

            const resizeOptions = {
                mode: resizeModeSelect.value,
                targetWidth: resizeWidthInput.value,
                targetHeight: resizeHeightInput.value,
                percentage: resizePercentageInput.value,
                maintainAspectRatio: maintainAspectRatioResizeCheckbox.checked,
                outputFormat: resizeOutputFormatSelect.value,
                jpegQuality: parseInt(resizeJpegQualitySlider.value) / 100
            };

            if (resizeOptions.mode === 'dimensions' && !resizeOptions.targetWidth && !resizeOptions.targetHeight) {
                showToast('Please provide at least Width or Height for dimension-based resize.', 'warning');
                return;
            }
            if (resizeOptions.mode === 'percentage' && (!resizeOptions.percentage || parseInt(resizeOptions.percentage) <= 0)) {
                showToast('Please provide a valid percentage > 0 for percentage-based resize.', 'warning');
                return;
            }

            await processBatchWithWorker(files, resizeOptions, 'resize', resizeResultsDiv, resizedFilesData, 'resized_');
        });
    }
    // --- END Resize Tab Logic ---


    // --- Initialization ---
    function initializeApp() {
        let initialTabId = 'generateContent';
        const preActiveButton = tabNavigation ? tabNavigation.querySelector('.tab-button.tab-active') : null;
        if (preActiveButton && preActiveButton.dataset.tab) initialTabId = preActiveButton.dataset.tab;
        else if (tabNavigation) {
            const firstButton = tabNavigation.querySelector(`.tab-button[data-tab="${initialTabId}"]`) || tabNavigation.querySelector('.tab-button');
            if (firstButton && firstButton.dataset.tab) initialTabId = firstButton.dataset.tab;
            else console.warn("No suitable initial tab button found.");
        }
        switchTab(initialTabId);

        loadApiKeys();
        if (apiKeysInput) apiKeysInput.addEventListener('input', _debounce(saveApiKeys, 1000));
        if(generateCategoryGrid) populateCategoryGrid('generateCategoryGrid');

        setupDragAndDrop('generateFileDropZone', 'imageFiles', 'generateImageList');
        setupDragAndDrop('readFileDropZone', 'readImageFile', null, 'readImagePreview', true);
        setupDragAndDrop('deleteFileDropZone', 'deleteImageFile', null, 'deleteImagePreview', true);
        setupDragAndDrop('convertFileDropZone', 'convertImageFiles', 'convertImageList');

        setupDragAndDrop('cropFileDropZone', 'cropImageFiles', 'cropImageList');
        setupDragAndDrop('manualCropFileDropZone', 'manualCropImageFile', 'manualCropImageList', null, true);

        setupDragAndDrop('resizeFileDropZone', 'resizeImageFiles', 'resizeImageList');

        if (jsonMetadataFileInput) jsonMetadataFileInput.addEventListener('change', () => { if (jsonMetadataFileInput.files.length > 0) showToast(`${jsonMetadataFileInput.files[0].name} selected for bulk metadata.`, 'info', 2500); });

        if (resizeModeSelect) resizeModeSelect.dispatchEvent(new Event('change'));
        if (resizeOutputFormatSelect) resizeOutputFormatSelect.dispatchEvent(new Event('change'));

        const currentYearElem = document.getElementById('currentYear');
        if (currentYearElem) currentYearElem.textContent = new Date().getFullYear();

        switchCropMode('auto'); // Initialize crop mode

        if (manualCropOutputFormat && manualCropJpegQualityContainer && manualCropJpegQuality) {
            if (manualCropOutputFormat.value === 'image/jpeg') {
                manualCropJpegQualityContainer.classList.remove('hidden');
                manualCropJpegQuality.disabled = true; 
            } else {
                manualCropJpegQualityContainer.classList.add('hidden');
                manualCropJpegQuality.disabled = true;
            }
        }
    }

    initializeApp();
});