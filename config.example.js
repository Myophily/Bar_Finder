// Kakao API Configuration
// Get your REST API key from: https://developers.kakao.com/console/app

const CONFIG = {
  // Replace with your Kakao REST API key
  KAKAO_REST_API_KEY: "YOUR_REST_API_KEY_HERE",

  // Kakao Map JavaScript API key (can be same as REST API key)
  KAKAO_MAP_API_KEY: "YOUR_MAP_API_KEY_HERE",

  // Default map center (Seoul City Hall)
  DEFAULT_CENTER: {
    lat: 37.5665,
    lng: 126.978,
  },

  // Default map zoom level
  DEFAULT_LEVEL: 8,

  // Grid cell size in meters (100m x 100m)
  GRID_CELL_SIZE: 100,

  // Search radius for each grid cell (diagonal / 2 ≈ 71m)
  SEARCH_RADIUS: 71,

  // API limits
  MAX_PAGE: 45,
  RESULTS_PER_PAGE: 15,

  // Category codes
  CATEGORY: {
    RESTAURANT: "FD6",
  },

  // Category filter for bars (exact category to match in category_name field)
  // This will match "음식점 > 술집" and all subcategories like:
  // - "음식점 > 술집 > 호프·요리주점"
  // - "음식점 > 술집 > 포장마차"
  // - etc.
  BAR_CATEGORY_FILTER: "음식점 > 술집",

  // DEPRECATED: Keywords-based filtering is no longer used
  // Kept for reference only
  BAR_KEYWORDS: [
    "술집",
    "포차",
    "주점",
    "호프",
    "맥주",
    "선술집",
    "이자카야",
    "BAR",
    "bar",
    "Bar",
  ],
};
