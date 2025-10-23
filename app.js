// Kakao Map Bar Finder Application
// Main application logic

// Global state
const App = {
    map: null,
    drawingManager: null,
    currentOverlay: null,
    searchResults: [],
    currentSort: { column: null, direction: 'asc' },
    selectedRegion: null,
    gridCells: []
};

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadKakaoMapScript();
});

// Load Kakao Map Script dynamically
function loadKakaoMapScript() {
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${CONFIG.KAKAO_MAP_API_KEY}&libraries=drawing,services&autoload=false`;
    script.onload = function() {
        kakao.maps.load(initializeMap);
    };
    script.onerror = function() {
        alert('Kakao Map API를 로드하는데 실패했습니다. config.js에서 API 키를 확인해주세요.');
    };
    document.head.appendChild(script);
}

// Initialize Kakao Map
function initializeMap() {
    const mapContainer = document.getElementById('map');
    const mapOption = {
        center: new kakao.maps.LatLng(CONFIG.DEFAULT_CENTER.lat, CONFIG.DEFAULT_CENTER.lng),
        level: CONFIG.DEFAULT_LEVEL
    };

    App.map = new kakao.maps.Map(mapContainer, mapOption);

    // Initialize drawing manager
    initializeDrawingManager();

    // Setup event listeners
    setupEventListeners();
}

// Initialize Drawing Manager
function initializeDrawingManager() {
    const drawingOptions = {
        map: App.map,
        drawingMode: [
            kakao.maps.drawing.OverlayType.RECTANGLE,
            kakao.maps.drawing.OverlayType.POLYGON
        ],
        rectangleOptions: {
            draggable: true,
            removable: true,
            editable: true,
            strokeColor: '#39f',
            fillColor: '#39f',
            fillOpacity: 0.3
        },
        polygonOptions: {
            draggable: true,
            removable: true,
            editable: true,
            strokeColor: '#39f',
            fillColor: '#39f',
            fillOpacity: 0.3
        }
    };

    App.drawingManager = new kakao.maps.drawing.DrawingManager(drawingOptions);

    // Event listeners for drawing
    kakao.maps.event.addListener(App.drawingManager, 'drawend', function(data) {
        App.currentOverlay = data.target;
        onRegionDrawn(data);
    });

    kakao.maps.event.addListener(App.drawingManager, 'remove', function() {
        clearRegion();
    });
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('drawRectangle').addEventListener('click', function() {
        clearDrawing();
        App.drawingManager.select(kakao.maps.drawing.OverlayType.RECTANGLE);
        this.classList.add('active');
    });

    document.getElementById('drawPolygon').addEventListener('click', function() {
        clearDrawing();
        App.drawingManager.select(kakao.maps.drawing.OverlayType.POLYGON);
        this.classList.add('active');
    });

    document.getElementById('clearDrawing').addEventListener('click', clearDrawing);
    document.getElementById('searchButton').addEventListener('click', startSearch);
    document.getElementById('downloadCSV').addEventListener('click', downloadCSV);
    document.getElementById('searchFilter').addEventListener('input', filterResults);

    // Table sorting
    document.querySelectorAll('#resultsTable th[data-sort]').forEach(th => {
        th.addEventListener('click', function() {
            sortTable(this.dataset.sort);
        });
    });
}

// Clear current drawing
function clearDrawing() {
    App.drawingManager.cancel();
    if (App.currentOverlay) {
        App.currentOverlay.setMap(null);
        App.currentOverlay = null;
    }
    clearRegion();
    document.querySelectorAll('.controls .btn-primary').forEach(btn => {
        btn.classList.remove('active');
    });
}

// Clear region selection
function clearRegion() {
    App.selectedRegion = null;
    App.gridCells = [];
    document.getElementById('regionText').textContent = '영역을 그려주세요';
    document.getElementById('gridInfo').style.display = 'none';
    document.getElementById('searchButton').disabled = true;
}

// Handler when region is drawn
function onRegionDrawn(data) {
    const bounds = getOverlayBounds(data.target, data.overlayType);

    if (!bounds) {
        alert('영역을 인식할 수 없습니다. 다시 그려주세요.');
        return;
    }

    App.selectedRegion = bounds;
    App.drawingManager.cancel();

    // Calculate area
    const area = calculateArea(bounds);
    const areaKm2 = (area / 1000000).toFixed(2);

    // Generate grid
    App.gridCells = generateGrid(bounds);

    // Update UI
    document.getElementById('regionText').textContent =
        `면적: ${areaKm2} km² | 중심: (${bounds.center.lat.toFixed(4)}, ${bounds.center.lng.toFixed(4)})`;
    document.getElementById('gridInfo').style.display = 'block';
    document.getElementById('gridText').textContent =
        `${App.gridCells.length}개의 1km×1km 그리드 생성됨`;
    document.getElementById('searchButton').disabled = false;
}

// Get bounds from overlay
function getOverlayBounds(overlay, type) {
    if (type === kakao.maps.drawing.OverlayType.RECTANGLE) {
        const bounds = overlay.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();

        return {
            sw: { lat: sw.getLat(), lng: sw.getLng() },
            ne: { lat: ne.getLat(), lng: ne.getLng() },
            center: {
                lat: (sw.getLat() + ne.getLat()) / 2,
                lng: (sw.getLng() + ne.getLng()) / 2
            }
        };
    } else if (type === kakao.maps.drawing.OverlayType.POLYGON) {
        const path = overlay.getPath();
        let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;

        path.forEach(point => {
            const lat = point.getLat();
            const lng = point.getLng();
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
        });

        return {
            sw: { lat: minLat, lng: minLng },
            ne: { lat: maxLat, lng: maxLng },
            center: {
                lat: (minLat + maxLat) / 2,
                lng: (minLng + maxLng) / 2
            }
        };
    }
    return null;
}

// Calculate area in square meters (approximate)
function calculateArea(bounds) {
    const latDiff = bounds.ne.lat - bounds.sw.lat;
    const lngDiff = bounds.ne.lng - bounds.sw.lng;

    // Approximate: 1 degree latitude ≈ 111km, longitude varies by latitude
    const latMeters = latDiff * 111000;
    const lngMeters = lngDiff * 111000 * Math.cos(bounds.center.lat * Math.PI / 180);

    return Math.abs(latMeters * lngMeters);
}

// Generate 1km x 1km grid cells
function generateGrid(bounds) {
    const cells = [];
    const cellSizeMeters = CONFIG.GRID_CELL_SIZE;

    // Convert to meters (approximate)
    const latDegreeMeters = 111000; // 1 degree latitude ≈ 111km
    const lngDegreeMeters = 111000 * Math.cos(bounds.center.lat * Math.PI / 180);

    const cellSizeLat = cellSizeMeters / latDegreeMeters;
    const cellSizeLng = cellSizeMeters / lngDegreeMeters;

    // Generate grid
    for (let lat = bounds.sw.lat; lat < bounds.ne.lat; lat += cellSizeLat) {
        for (let lng = bounds.sw.lng; lng < bounds.ne.lng; lng += cellSizeLng) {
            const centerLat = lat + cellSizeLat / 2;
            const centerLng = lng + cellSizeLng / 2;

            cells.push({
                center: { lat: centerLat, lng: centerLng },
                bounds: {
                    sw: { lat, lng },
                    ne: { lat: lat + cellSizeLat, lng: lng + cellSizeLng }
                }
            });
        }
    }

    return cells;
}

// Start search
async function startSearch() {
    if (!App.selectedRegion || App.gridCells.length === 0) {
        alert('먼저 검색할 영역을 그려주세요.');
        return;
    }

    // Reset results
    App.searchResults = [];
    document.getElementById('resultsSection').style.display = 'none';

    // Show progress
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    progressContainer.style.display = 'block';

    // Disable search button
    document.getElementById('searchButton').disabled = true;

    const totalCells = App.gridCells.length;
    let completedCells = 0;
    const allResults = new Map(); // Use Map to deduplicate by place ID

    try {
        // Search each grid cell
        for (let i = 0; i < totalCells; i++) {
            const cell = App.gridCells[i];

            progressText.textContent = `그리드 ${i + 1}/${totalCells} 검색 중...`;

            const cellResults = await searchGridCell(cell);

            // Add results to map (deduplication by place ID)
            cellResults.forEach(place => {
                if (!allResults.has(place.id)) {
                    allResults.set(place.id, place);
                }
            });

            completedCells++;
            const progress = (completedCells / totalCells * 100).toFixed(1);
            progressBar.style.width = progress + '%';

            // Small delay to avoid rate limiting
            await sleep(100);
        }

        // Convert Map to Array
        App.searchResults = Array.from(allResults.values());

        progressText.textContent = `검색 완료! 총 ${App.searchResults.length}개의 결과`;

        // Display results
        displayResults();

    } catch (error) {
        console.error('검색 중 오류:', error);
        alert('검색 중 오류가 발생했습니다: ' + error.message);
    } finally {
        // Re-enable search button
        document.getElementById('searchButton').disabled = false;
    }
}

// Search a single grid cell
async function searchGridCell(cell) {
    const results = [];
    let page = 1;
    let isEnd = false;

    while (!isEnd && page <= CONFIG.MAX_PAGE) {
        try {
            const data = await searchKakaoAPI(
                cell.center.lng,
                cell.center.lat,
                CONFIG.SEARCH_RADIUS,
                page
            );

            if (data.documents && data.documents.length > 0) {
                // Filter for bar-related places based on category
                // Only include places where category_name contains "음식점 > 술집"
                // This matches the exact category and all subcategories (e.g., "음식점 > 술집 > 호프·요리주점")
                const barPlaces = data.documents.filter(place => {
                    const categoryName = place.category_name || '';
                    return categoryName.includes(CONFIG.BAR_CATEGORY_FILTER);
                });

                results.push(...barPlaces);
            }

            isEnd = data.meta.is_end;
            page++;

            // Small delay between pages
            if (!isEnd) {
                await sleep(50);
            }

        } catch (error) {
            console.error(`그리드 검색 오류 (페이지 ${page}):`, error);
            break;
        }
    }

    return results;
}

// Call Kakao Local API
async function searchKakaoAPI(x, y, radius, page) {
    const url = new URL('https://dapi.kakao.com/v2/local/search/category.json');
    url.searchParams.append('category_group_code', CONFIG.CATEGORY.RESTAURANT);
    url.searchParams.append('x', x);
    url.searchParams.append('y', y);
    url.searchParams.append('radius', radius);
    url.searchParams.append('page', page);
    url.searchParams.append('size', CONFIG.RESULTS_PER_PAGE);

    const response = await fetch(url, {
        headers: {
            'Authorization': `KakaoAK ${CONFIG.KAKAO_REST_API_KEY}`
        }
    });

    if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

// Sleep utility
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Display results in table
function displayResults() {
    if (App.searchResults.length === 0) {
        alert('검색 결과가 없습니다. 다른 영역을 시도해보세요.');
        return;
    }

    document.getElementById('resultsSection').style.display = 'block';
    document.getElementById('resultCount').textContent = App.searchResults.length;

    renderTable(App.searchResults);

    // Scroll to results
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
}

// Render table
function renderTable(data) {
    const tbody = document.getElementById('resultsBody');
    tbody.innerHTML = '';

    data.forEach((place, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${escapeHtml(place.place_name || '-')}</td>
            <td>${escapeHtml(place.category_name || '-')}</td>
            <td>${escapeHtml(place.address_name || '-')}</td>
            <td>${escapeHtml(place.road_address_name || '-')}</td>
            <td>${escapeHtml(place.phone || '-')}</td>
            <td>${place.x || '-'}</td>
            <td>${place.y || '-'}</td>
            <td>${place.place_url ? `<a href="${place.place_url}" target="_blank">링크</a>` : '-'}</td>
            <td>${place.distance || '-'}</td>
        `;
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Filter results based on search input
function filterResults() {
    const searchTerm = document.getElementById('searchFilter').value.toLowerCase();

    if (!searchTerm) {
        renderTable(App.searchResults);
        document.getElementById('resultCount').textContent = App.searchResults.length;
        return;
    }

    const filtered = App.searchResults.filter(place => {
        return Object.values(place).some(value => {
            return String(value).toLowerCase().includes(searchTerm);
        });
    });

    renderTable(filtered);
    document.getElementById('resultCount').textContent = filtered.length;
}

// Sort table
function sortTable(column) {
    const th = document.querySelector(`th[data-sort="${column}"]`);
    const allTh = document.querySelectorAll('#resultsTable th[data-sort]');

    // Remove sort classes from other columns
    allTh.forEach(t => {
        if (t !== th) {
            t.classList.remove('sort-asc', 'sort-desc');
        }
    });

    // Toggle sort direction
    let direction = 'asc';
    if (App.currentSort.column === column) {
        direction = App.currentSort.direction === 'asc' ? 'desc' : 'asc';
    }

    App.currentSort = { column, direction };

    // Update UI
    th.classList.remove('sort-asc', 'sort-desc');
    th.classList.add(direction === 'asc' ? 'sort-asc' : 'sort-desc');

    // Sort data
    const sorted = [...App.searchResults].sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];

        // Handle index specially
        if (column === 'index') {
            return 0; // Will be regenerated
        }

        // Handle numeric values
        if (column === 'x' || column === 'y' || column === 'distance') {
            aVal = parseFloat(aVal) || 0;
            bVal = parseFloat(bVal) || 0;
        } else {
            aVal = String(aVal || '').toLowerCase();
            bVal = String(bVal || '').toLowerCase();
        }

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    renderTable(sorted);
}

// Download results as CSV
function downloadCSV() {
    if (App.searchResults.length === 0) {
        alert('다운로드할 결과가 없습니다.');
        return;
    }

    // CSV headers
    const headers = [
        '번호',
        '장소명',
        '카테고리',
        '지번 주소',
        '도로명 주소',
        '전화번호',
        '경도 (X)',
        '위도 (Y)',
        'URL',
        '거리(m)'
    ];

    // CSV rows
    const rows = App.searchResults.map((place, index) => [
        index + 1,
        place.place_name || '',
        place.category_name || '',
        place.address_name || '',
        place.road_address_name || '',
        place.phone || '',
        place.x || '',
        place.y || '',
        place.place_url || '',
        place.distance || ''
    ]);

    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create blob with UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    // Download
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bar_search_results_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
