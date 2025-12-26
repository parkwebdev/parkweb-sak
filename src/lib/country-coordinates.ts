// Country name to coordinates mapping for geographic visualization
// Coordinates represent approximate center of each country

export interface CountryCoordinate {
  lat: number;
  lng: number;
}

export const COUNTRY_COORDINATES: Record<string, CountryCoordinate> = {
  // North America
  "United States": { lat: 37.0902, lng: -95.7129 },
  "USA": { lat: 37.0902, lng: -95.7129 },
  "US": { lat: 37.0902, lng: -95.7129 },
  "Canada": { lat: 56.1304, lng: -106.3468 },
  "Mexico": { lat: 23.6345, lng: -102.5528 },
  
  // Europe
  "United Kingdom": { lat: 55.3781, lng: -3.4360 },
  "UK": { lat: 55.3781, lng: -3.4360 },
  "Germany": { lat: 51.1657, lng: 10.4515 },
  "France": { lat: 46.2276, lng: 2.2137 },
  "Italy": { lat: 41.8719, lng: 12.5674 },
  "Spain": { lat: 40.4637, lng: -3.7492 },
  "Netherlands": { lat: 52.1326, lng: 5.2913 },
  "Belgium": { lat: 50.5039, lng: 4.4699 },
  "Switzerland": { lat: 46.8182, lng: 8.2275 },
  "Austria": { lat: 47.5162, lng: 14.5501 },
  "Poland": { lat: 51.9194, lng: 19.1451 },
  "Sweden": { lat: 60.1282, lng: 18.6435 },
  "Norway": { lat: 60.4720, lng: 8.4689 },
  "Denmark": { lat: 56.2639, lng: 9.5018 },
  "Finland": { lat: 61.9241, lng: 25.7482 },
  "Ireland": { lat: 53.1424, lng: -7.6921 },
  "Portugal": { lat: 39.3999, lng: -8.2245 },
  "Greece": { lat: 39.0742, lng: 21.8243 },
  "Czech Republic": { lat: 49.8175, lng: 15.4730 },
  "Romania": { lat: 45.9432, lng: 24.9668 },
  "Hungary": { lat: 47.1625, lng: 19.5033 },
  "Ukraine": { lat: 48.3794, lng: 31.1656 },
  "Russia": { lat: 61.5240, lng: 105.3188 },
  
  // Asia
  "China": { lat: 35.8617, lng: 104.1954 },
  "Japan": { lat: 36.2048, lng: 138.2529 },
  "South Korea": { lat: 35.9078, lng: 127.7669 },
  "India": { lat: 20.5937, lng: 78.9629 },
  "Indonesia": { lat: -0.7893, lng: 113.9213 },
  "Thailand": { lat: 15.8700, lng: 100.9925 },
  "Vietnam": { lat: 14.0583, lng: 108.2772 },
  "Philippines": { lat: 12.8797, lng: 121.7740 },
  "Malaysia": { lat: 4.2105, lng: 101.9758 },
  "Singapore": { lat: 1.3521, lng: 103.8198 },
  "Taiwan": { lat: 23.6978, lng: 120.9605 },
  "Hong Kong": { lat: 22.3193, lng: 114.1694 },
  "Pakistan": { lat: 30.3753, lng: 69.3451 },
  "Bangladesh": { lat: 23.6850, lng: 90.3563 },
  "Sri Lanka": { lat: 7.8731, lng: 80.7718 },
  "Nepal": { lat: 28.3949, lng: 84.1240 },
  
  // Middle East
  "Saudi Arabia": { lat: 23.8859, lng: 45.0792 },
  "United Arab Emirates": { lat: 23.4241, lng: 53.8478 },
  "UAE": { lat: 23.4241, lng: 53.8478 },
  "Israel": { lat: 31.0461, lng: 34.8516 },
  "Turkey": { lat: 38.9637, lng: 35.2433 },
  "Iran": { lat: 32.4279, lng: 53.6880 },
  "Iraq": { lat: 33.2232, lng: 43.6793 },
  "Qatar": { lat: 25.3548, lng: 51.1839 },
  "Kuwait": { lat: 29.3117, lng: 47.4818 },
  "Oman": { lat: 21.4735, lng: 55.9754 },
  "Jordan": { lat: 30.5852, lng: 36.2384 },
  "Lebanon": { lat: 33.8547, lng: 35.8623 },
  
  // Africa
  "South Africa": { lat: -30.5595, lng: 22.9375 },
  "Nigeria": { lat: 9.0820, lng: 8.6753 },
  "Egypt": { lat: 26.8206, lng: 30.8025 },
  "Kenya": { lat: -0.0236, lng: 37.9062 },
  "Morocco": { lat: 31.7917, lng: -7.0926 },
  "Ghana": { lat: 7.9465, lng: -1.0232 },
  "Ethiopia": { lat: 9.1450, lng: 40.4897 },
  "Tanzania": { lat: -6.3690, lng: 34.8888 },
  "Algeria": { lat: 28.0339, lng: 1.6596 },
  
  // South America
  "Brazil": { lat: -14.2350, lng: -51.9253 },
  "Argentina": { lat: -38.4161, lng: -63.6167 },
  "Colombia": { lat: 4.5709, lng: -74.2973 },
  "Chile": { lat: -35.6751, lng: -71.5430 },
  "Peru": { lat: -9.1900, lng: -75.0152 },
  "Venezuela": { lat: 6.4238, lng: -66.5897 },
  "Ecuador": { lat: -1.8312, lng: -78.1834 },
  "Uruguay": { lat: -32.5228, lng: -55.7658 },
  
  // Oceania
  "Australia": { lat: -25.2744, lng: 133.7751 },
  "New Zealand": { lat: -40.9006, lng: 174.8860 },
  
  // Central America & Caribbean
  "Costa Rica": { lat: 9.7489, lng: -83.7534 },
  "Panama": { lat: 8.5380, lng: -80.7821 },
  "Puerto Rico": { lat: 18.2208, lng: -66.5901 },
  "Jamaica": { lat: 18.1096, lng: -77.2975 },
  "Cuba": { lat: 21.5218, lng: -77.7812 },
  "Dominican Republic": { lat: 18.7357, lng: -70.1627 },
  
  // Default/Unknown - center of world map
  "Unknown": { lat: 20, lng: 0 },
};

export function getCountryCoordinates(country: string): CountryCoordinate | null {
  // Try exact match first
  if (COUNTRY_COORDINATES[country]) {
    return COUNTRY_COORDINATES[country];
  }
  
  // Try case-insensitive match
  const normalizedCountry = country.toLowerCase().trim();
  for (const [key, coords] of Object.entries(COUNTRY_COORDINATES)) {
    if (key.toLowerCase() === normalizedCountry) {
      return coords;
    }
  }
  
  // Try partial match (country name contains the search term)
  for (const [key, coords] of Object.entries(COUNTRY_COORDINATES)) {
    if (key.toLowerCase().includes(normalizedCountry) || normalizedCountry.includes(key.toLowerCase())) {
      return coords;
    }
  }
  
  return null;
}
