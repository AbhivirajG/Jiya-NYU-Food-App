import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Chip, Stack, ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import SearchIcon from '@mui/icons-material/Search';
import RestaurantIcon from '@mui/icons-material/Restaurant';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#57068c', // NYU Purple
    },
    secondary: {
      main: '#ffffff',
    },
  },
});

// NYU dining locations data
const diningLocations = [
  {
    id: 1,
    name: "Palladium",
    position: [40.7317, -73.9921],
    type: "dining_hall",
    menu: [
      { item: "Poke Bowl", categories: ["fish", "healthy", "bowl", "lunch", "dinner"] },
      { item: "Halal Gyro", categories: ["halal", "meat", "lunch", "dinner"] },
      { item: "Vegan Stir Fry", categories: ["vegan", "asian", "hot", "dinner"] },
      { item: "Fresh Sushi", categories: ["sushi", "fish", "lunch", "dinner"] },
      { item: "Quinoa Salad", categories: ["vegetarian", "vegan", "healthy", "salads"] }
    ],
    dietaryOptions: ["halal", "vegetarian", "vegan"],
    description: "Retail & Residential Dining Hall with diverse options"
  },
  {
    id: 2,
    name: "Third North",
    position: [40.7312, -73.9889],
    type: "dining_hall",
    menu: [
      { item: "Halal Chicken Biryani", categories: ["halal", "indian", "rice", "dinner"] },
      { item: "Vegetable Curry", categories: ["vegetarian", "vegan", "indian", "dinner"] },
      { item: "California Roll", categories: ["sushi", "fish", "lunch"] },
      { item: "Beyond Meat Burger", categories: ["vegan", "burgers", "lunch", "dinner"] },
      { item: "Gluten-Free Pizza", categories: ["gluten-free", "vegetarian", "dinner"] }
    ],
    dietaryOptions: ["halal", "vegetarian", "vegan", "gluten-free"],
    description: "Residential Dining Hall with international cuisine"
  },
  {
    id: 3,
    name: "Weinstein",
    position: [40.7299, -73.9947],
    type: "dining_hall",
    menu: [
      { item: "Classic Burger", categories: ["burgers", "meat", "lunch", "dinner"] },
      { item: "Veggie Burger", categories: ["burgers", "vegetarian", "vegan", "lunch", "dinner"] },
      { item: "Halal Chicken Sandwich", categories: ["sandwiches", "halal", "meat", "lunch"] },
      { item: "Greek Salad", categories: ["salads", "vegetarian", "healthy", "lunch", "dinner"] }
    ],
    dietaryOptions: ["halal", "vegetarian", "vegan"],
    description: "Retail & Residential Dining Hall"
  },
  {
    id: 4,
    name: "Kimmel",
    position: [40.7295, -73.9973],
    type: "marketplace",
    menu: [
      { item: "Sandwich Bar", categories: ["sandwiches", "lunch"] },
      { item: "Salad Station", categories: ["salads", "healthy", "vegetarian"] },
      { item: "Hot Foods", categories: ["hot", "lunch", "dinner"] }
    ],
    dietaryOptions: ["vegetarian", "vegan"],
    description: "Marketplace with various food stations"
  },
  {
    id: 5,
    name: "Lipton",
    position: [40.7292, -73.9982],
    type: "dining_hall",
    menu: [
      { item: "Daily Hot Entrees", categories: ["hot", "lunch", "dinner"] },
      { item: "Salad Bar", categories: ["salads", "healthy", "vegetarian"] },
      { item: "Kosher Options", categories: ["kosher", "lunch", "dinner"] }
    ],
    dietaryOptions: ["kosher", "vegetarian", "vegan"],
    description: "Residential Dining Hall"
  },
  {
    id: 6,
    name: "18 Below",
    position: [40.7297, -73.9947],
    type: "marketplace",
    menu: [
      { item: "Grab and Go Items", categories: ["quick", "snacks"] },
      { item: "Sandwiches", categories: ["sandwiches", "lunch"] },
      { item: "Beverages", categories: ["drinks"] }
    ],
    dietaryOptions: [],
    description: "Quick service marketplace"
  },
  {
    id: 7,
    name: "Paulson (181 Mercer)",
    position: [40.7275, -73.9965],
    type: "dining_hall",
    menu: [
      { item: "Hot Entrees", categories: ["hot", "lunch", "dinner"] },
      { item: "Salad Bar", categories: ["salads", "healthy", "vegetarian"] },
      { item: "Grill Station", categories: ["grill", "lunch", "dinner"] }
    ],
    dietaryOptions: ["vegetarian", "vegan"],
    description: "New Dining Facility at 181 Mercer"
  },
  {
    id: 8,
    name: "University Hall",
    position: [40.7320, -73.9935],
    type: "dining_hall",
    menu: [
      { item: "Daily Specials", categories: ["hot", "lunch", "dinner"] },
      { item: "Salad Bar", categories: ["salads", "healthy", "vegetarian"] },
      { item: "Deli Station", categories: ["sandwiches", "lunch"] }
    ],
    dietaryOptions: ["vegetarian", "vegan"],
    description: "Residential Dining Hall"
  }
];

const discountLocations = [
  {
    id: 1,
    name: "Starbucks",
    position: [40.7299, -73.9947],
    type: "coffee_shop",
    discount: "10% off with NYU ID",
    description: "Coffee and snacks",
    menu: ["Coffee", "Tea", "Pastries", "Sandwiches"]
  }
];

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendations, setRecommendations] = useState([]);

  const findAlternatives = (query) => {
    const alternatives = {
      'burger': ['sandwich', 'wrap'],
      'sushi': ['poke bowl', 'fish'],
      'vegan': ['vegetarian', 'plant-based'],
      'meat': ['chicken', 'beef', 'lamb'],
      'healthy': ['salad', 'bowl', 'grilled'],
    };
    return alternatives[query.toLowerCase()] || [];
  };

  const handleSearch = () => {
    const query = searchQuery.toLowerCase();
    const results = [];
    let exactMatches = [];
    let alternativeMatches = [];

    diningLocations.forEach(location => {
      // Check for exact matches in menu items and categories
      const menuMatches = location.menu.filter(item => 
        item.item.toLowerCase().includes(query) || 
        item.categories.some(cat => cat.toLowerCase().includes(query))
      );

      if (menuMatches.length > 0) {
        exactMatches.push({
          location: location.name,
          matches: menuMatches,
          description: location.description,
          type: 'exact',
          dietaryOptions: location.dietaryOptions || []
        });
      }

      // Check for dietary options if they exist
      if (location.dietaryOptions && location.dietaryOptions.some(option => option.toLowerCase().includes(query))) {
        exactMatches.push({
          location: location.name,
          description: location.description,
          dietaryOptions: location.dietaryOptions,
          type: 'dietary'
        });
      }

      // Look for alternative matches if no exact matches found
      const alternatives = findAlternatives(query);
      const altMatches = location.menu.filter(item =>
        alternatives.some(alt => 
          item.item.toLowerCase().includes(alt) || 
          item.categories.some(cat => cat.toLowerCase().includes(alt))
        )
      );

      if (altMatches.length > 0) {
        alternativeMatches.push({
          location: location.name,
          matches: altMatches,
          description: location.description,
          type: 'alternative',
          dietaryOptions: location.dietaryOptions || []
        });
      }
    });

    results.push(...exactMatches);
    if (exactMatches.length === 0) {
      results.push(...alternativeMatches);
    }

    setRecommendations(results);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="phone-frame">
        <div className="app-content">
          <div className="app-header">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <RestaurantIcon sx={{ color: '#57068c' }} />
              <Typography variant="h6" component="h1" sx={{ color: '#57068c', fontWeight: 'bold' }}>
                NYU Dining
              </Typography>
            </Box>
          </div>

          <div className="search-container">
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                placeholder="Search food, dietary options..."
                variant="outlined"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                size="small"
                className="search-box"
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                }}
              />
              <Button 
                variant="contained" 
                onClick={handleSearch}
                className="search-button"
                sx={{ minWidth: 'auto', px: 3 }}
              >
                Go
              </Button>
            </Box>
          </div>

          <Box sx={{ height: '300px', width: '100%' }}>
            <MapContainer
              center={[40.7299, -73.9947]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {diningLocations.map((location) => (
                <Marker 
                  key={location.id} 
                  position={location.position}
                  icon={L.divIcon({
                    className: `location-marker ${location.type}`,
                    html: `<div class="marker-icon ${location.type}"></div>`,
                    iconSize: [25, 25]
                  })}
                >
                  <Popup>
                    <Typography variant="subtitle2">{location.name}</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{location.description}</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Type: {location.type.replace('_', ' ')}</Typography>
                    {location.dietaryOptions && location.dietaryOptions.length > 0 && (
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        Dietary Options: {location.dietaryOptions.join(', ')}
                      </Typography>
                    )}
                  </Popup>
                </Marker>
              ))}

              {discountLocations.map((location) => (
                <Marker 
                  key={location.id} 
                  position={location.position}
                  icon={L.divIcon({
                    className: `location-marker ${location.type}`,
                    html: `<div class="marker-icon ${location.type}"></div>`,
                    iconSize: [25, 25]
                  })}
                >
                  <Popup>
                    <Typography variant="subtitle2">{location.name}</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{location.description}</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'primary.main' }}>{location.discount}</Typography>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </Box>

          <div className="recommendations-container">
            {recommendations.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Recommendations
                </Typography>
                {recommendations.map((rec, index) => (
                  <Paper 
                    key={index} 
                    sx={{ 
                      p: 2, 
                      mb: 1, 
                      borderRadius: 2,
                      borderLeft: rec.type === 'alternative' ? '4px solid #ffa726' : '4px solid #4caf50',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{rec.location}</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                      {rec.description}
                    </Typography>
                    
                    {rec.type === 'dietary' && rec.dietaryOptions && (
                      <Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                        {rec.dietaryOptions.map((option, i) => (
                          <Chip 
                            key={i} 
                            label={option} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        ))}
                      </Stack>
                    )}

                    {rec.matches && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                          Available items:
                        </Typography>
                        <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                          {rec.matches.map((match, i) => (
                            <Chip 
                              key={i} 
                              label={match.item} 
                              size="small" 
                              color={rec.type === 'alternative' ? 'warning' : 'success'}
                              sx={{ fontSize: '0.7rem' }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {rec.type === 'alternative' && (
                      <Typography 
                        variant="body2" 
                        color="warning.main" 
                        sx={{ mt: 1, fontSize: '0.8rem' }}
                      >
                        Alternative suggestion based on your search
                      </Typography>
                    )}
                  </Paper>
                ))}
              </Box>
            )}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
