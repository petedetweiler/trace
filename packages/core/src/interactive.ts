// Interactive pan/zoom script generator for SVG diagrams
// Generates self-contained JavaScript that gets embedded directly in the SVG

export interface InteractiveOptions {
  /** Base width of the diagram */
  width: number
  /** Base height of the diagram */
  height: number
  /** Canvas padding */
  padding: number
  /** Unique ID for this SVG instance */
  svgId: string
  /** Button colors from theme */
  colors: {
    background: string
    text: string
    textMuted: string
    border: string
  }
}

/**
 * Generate the inline JavaScript for pan/zoom functionality
 * Returns a self-executing function scoped to the specific SVG
 */
export function generateInteractiveScript(options: InteractiveOptions): string {
  const { width, height, padding, svgId } = options
  const totalWidth = width + padding * 2
  const totalHeight = height + padding * 2

  // Minified-ish but still readable script
  return `(function(){
  var svg = document.getElementById('${svgId}');
  if (!svg) return;

  var baseW = ${totalWidth}, baseH = ${totalHeight};
  var scale = 1, panX = 0, panY = 0;
  var isDragging = false, startX = 0, startY = 0, startPanX = 0, startPanY = 0;
  var minScale = 0.1, maxScale = 10;

  function updateViewBox() {
    var w = baseW / scale;
    var h = baseH / scale;
    svg.setAttribute('viewBox', panX + ' ' + panY + ' ' + w + ' ' + h);
  }

  function clampPan() {
    var w = baseW / scale;
    var h = baseH / scale;
    var maxPanX = baseW - w;
    var maxPanY = baseH - h;
    panX = Math.max(Math.min(panX, maxPanX), -(baseW - w));
    panY = Math.max(Math.min(panY, maxPanY), -(baseH - h));
  }

  function zoom(delta, cx, cy) {
    var factor = delta > 0 ? 0.9 : 1.1;
    var newScale = Math.min(Math.max(scale * factor, minScale), maxScale);
    if (newScale === scale) return;

    // Get cursor position in viewBox coordinates
    var rect = svg.getBoundingClientRect();
    var vbW = baseW / scale;
    var vbH = baseH / scale;
    var mouseX = panX + (cx - rect.left) / rect.width * vbW;
    var mouseY = panY + (cy - rect.top) / rect.height * vbH;

    // Update scale
    var oldScale = scale;
    scale = newScale;

    // Adjust pan to keep cursor point stationary
    var newVbW = baseW / scale;
    var newVbH = baseH / scale;
    panX = mouseX - (cx - rect.left) / rect.width * newVbW;
    panY = mouseY - (cy - rect.top) / rect.height * newVbH;

    clampPan();
    updateViewBox();
  }

  function fit() {
    scale = 1;
    panX = 0;
    panY = 0;
    updateViewBox();
  }

  function zoomIn() {
    var rect = svg.getBoundingClientRect();
    zoom(-1, rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  function zoomOut() {
    var rect = svg.getBoundingClientRect();
    zoom(1, rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  // Mouse wheel zoom
  svg.addEventListener('wheel', function(e) {
    e.preventDefault();
    zoom(e.deltaY, e.clientX, e.clientY);
  }, { passive: false });

  // Mouse drag pan
  svg.addEventListener('mousedown', function(e) {
    if (e.target.closest('.trace-controls')) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startPanX = panX;
    startPanY = panY;
    svg.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    var rect = svg.getBoundingClientRect();
    var vbW = baseW / scale;
    var vbH = baseH / scale;
    var dx = (e.clientX - startX) / rect.width * vbW;
    var dy = (e.clientY - startY) / rect.height * vbH;
    panX = startPanX - dx;
    panY = startPanY - dy;
    clampPan();
    updateViewBox();
  });

  window.addEventListener('mouseup', function() {
    if (isDragging) {
      isDragging = false;
      svg.style.cursor = 'grab';
    }
  });

  // Touch support
  var lastTouchDist = 0;
  var lastTouchX = 0, lastTouchY = 0;

  svg.addEventListener('touchstart', function(e) {
    if (e.target.closest('.trace-controls')) return;
    if (e.touches.length === 1) {
      isDragging = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startPanX = panX;
      startPanY = panY;
    } else if (e.touches.length === 2) {
      isDragging = false;
      var dx = e.touches[1].clientX - e.touches[0].clientX;
      var dy = e.touches[1].clientY - e.touches[0].clientY;
      lastTouchDist = Math.sqrt(dx * dx + dy * dy);
      lastTouchX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      lastTouchY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    }
  }, { passive: true });

  svg.addEventListener('touchmove', function(e) {
    if (e.target.closest('.trace-controls')) return;
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
      var rect = svg.getBoundingClientRect();
      var vbW = baseW / scale;
      var vbH = baseH / scale;
      var dx = (e.touches[0].clientX - startX) / rect.width * vbW;
      var dy = (e.touches[0].clientY - startY) / rect.height * vbH;
      panX = startPanX - dx;
      panY = startPanY - dy;
      clampPan();
      updateViewBox();
    } else if (e.touches.length === 2) {
      var dx = e.touches[1].clientX - e.touches[0].clientX;
      var dy = e.touches[1].clientY - e.touches[0].clientY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      var cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      if (lastTouchDist > 0) {
        var delta = lastTouchDist - dist;
        zoom(delta, cx, cy);
      }
      lastTouchDist = dist;
      lastTouchX = cx;
      lastTouchY = cy;
    }
  }, { passive: false });

  svg.addEventListener('touchend', function() {
    isDragging = false;
    lastTouchDist = 0;
  }, { passive: true });

  // Wire up control buttons
  var btnZoomIn = svg.querySelector('.trace-ctrl-zoomin');
  var btnZoomOut = svg.querySelector('.trace-ctrl-zoomout');
  var btnFit = svg.querySelector('.trace-ctrl-fit');
  var btnReset = svg.querySelector('.trace-ctrl-reset');

  if (btnZoomIn) btnZoomIn.addEventListener('click', function(e) { e.stopPropagation(); zoomIn(); });
  if (btnZoomOut) btnZoomOut.addEventListener('click', function(e) { e.stopPropagation(); zoomOut(); });
  if (btnFit) btnFit.addEventListener('click', function(e) { e.stopPropagation(); fit(); });
  if (btnReset) btnReset.addEventListener('click', function(e) { e.stopPropagation(); fit(); });

  // Set initial cursor style
  svg.style.cursor = 'grab';
})();`
}

/**
 * Generate SVG control buttons for zoom/pan
 * Returns SVG elements for the control panel
 */
export function generateControls(options: InteractiveOptions): string {
  const { width, padding, colors } = options
  const totalWidth = width + padding * 2

  // Position controls in top-right corner
  const controlX = totalWidth - 48
  const controlY = 12
  const btnSize = 28
  const btnSpacing = 4
  const btnRadius = 6

  const btnStyle = `fill="${colors.background}" stroke="${colors.border}" stroke-width="1"`
  const iconColor = colors.textMuted

  return `
    <!-- Pan/Zoom Controls -->
    <g class="trace-controls" transform="translate(${controlX}, ${controlY})">
      <!-- Zoom In -->
      <g class="trace-ctrl-zoomin" style="cursor:pointer">
        <rect x="0" y="0" width="${btnSize}" height="${btnSize}" rx="${btnRadius}" ${btnStyle}/>
        <line x1="${btnSize/2 - 6}" y1="${btnSize/2}" x2="${btnSize/2 + 6}" y2="${btnSize/2}" stroke="${iconColor}" stroke-width="2" stroke-linecap="round"/>
        <line x1="${btnSize/2}" y1="${btnSize/2 - 6}" x2="${btnSize/2}" y2="${btnSize/2 + 6}" stroke="${iconColor}" stroke-width="2" stroke-linecap="round"/>
      </g>
      <!-- Zoom Out -->
      <g class="trace-ctrl-zoomout" style="cursor:pointer" transform="translate(0, ${btnSize + btnSpacing})">
        <rect x="0" y="0" width="${btnSize}" height="${btnSize}" rx="${btnRadius}" ${btnStyle}/>
        <line x1="${btnSize/2 - 6}" y1="${btnSize/2}" x2="${btnSize/2 + 6}" y2="${btnSize/2}" stroke="${iconColor}" stroke-width="2" stroke-linecap="round"/>
      </g>
      <!-- Fit to View -->
      <g class="trace-ctrl-fit" style="cursor:pointer" transform="translate(0, ${(btnSize + btnSpacing) * 2})">
        <rect x="0" y="0" width="${btnSize}" height="${btnSize}" rx="${btnRadius}" ${btnStyle}/>
        <rect x="${btnSize/2 - 6}" y="${btnSize/2 - 6}" width="12" height="12" fill="none" stroke="${iconColor}" stroke-width="1.5" rx="2"/>
        <line x1="${btnSize/2 - 3}" y1="${btnSize/2 - 6}" x2="${btnSize/2 - 3}" y2="${btnSize/2 - 9}" stroke="${iconColor}" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="${btnSize/2 - 6}" y1="${btnSize/2 - 3}" x2="${btnSize/2 - 9}" y2="${btnSize/2 - 3}" stroke="${iconColor}" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="${btnSize/2 + 3}" y1="${btnSize/2 - 6}" x2="${btnSize/2 + 3}" y2="${btnSize/2 - 9}" stroke="${iconColor}" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="${btnSize/2 + 6}" y1="${btnSize/2 - 3}" x2="${btnSize/2 + 9}" y2="${btnSize/2 - 3}" stroke="${iconColor}" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="${btnSize/2 - 3}" y1="${btnSize/2 + 6}" x2="${btnSize/2 - 3}" y2="${btnSize/2 + 9}" stroke="${iconColor}" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="${btnSize/2 - 6}" y1="${btnSize/2 + 3}" x2="${btnSize/2 - 9}" y2="${btnSize/2 + 3}" stroke="${iconColor}" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="${btnSize/2 + 3}" y1="${btnSize/2 + 6}" x2="${btnSize/2 + 3}" y2="${btnSize/2 + 9}" stroke="${iconColor}" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="${btnSize/2 + 6}" y1="${btnSize/2 + 3}" x2="${btnSize/2 + 9}" y2="${btnSize/2 + 3}" stroke="${iconColor}" stroke-width="1.5" stroke-linecap="round"/>
      </g>
    </g>`
}
