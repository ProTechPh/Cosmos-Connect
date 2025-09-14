# NASA Open APIs - Complete Endpoint Documentation

Official Source: https://api.nasa.gov/ (NASA Open APIs Portal)
Extracted: September 13, 2025

## Overview

Welcome to the NASA API portal. The objective of this site is to make NASA data, including imagery, eminently accessible to application developers. This catalog focuses on broadly useful and user friendly APIs and does not hold every NASA API.

⚠️ **Important Notice**: The Earth API has been archived and replaced with [Earthdata GIBS API](https://api.nasa.gov/#gibs). Please update your bookmarks or projects as needed.

## Authentication & Rate Limits

### API Key Registration
- **Sign up**: https://api.nasa.gov/#signUp
- **Contact**: hq-open-innovation@mail.nasa.gov
- **Recovery**: Contact support for API key recovery

### Rate Limits
- **With API Key**: 1,000 requests per hour
- **DEMO_KEY**: 30 requests per hour, 50 requests per day
- **Usage Monitoring**: Check `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers

### Important Notes
- You do not need to authenticate to explore NASA data initially
- For intensive use (e.g., mobile applications), sign up for a developer key
- Rate limits apply across all api.nasa.gov requests
- Exceeding limits temporarily blocks your API key for one hour
- Hourly counters reset on a rolling basis

---

## Complete API Catalog

### 1. APOD - Astronomy Picture of the Day

**Description**: One of the most popular websites at NASA. This endpoint structures the APOD imagery and associated metadata so that it can be repurposed for other applications.

**Documentation**: [APOD API Github repository](https://github.com/nasa/apod-api)

#### HTTP Request
```
GET https://api.nasa.gov/planetary/apod
```

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| date | YYYY-MM-DD | today | The date of the APOD image to retrieve |
| start_date | YYYY-MM-DD | none | Start of date range (cannot be used with date) |
| end_date | YYYY-MM-DD | today | End of date range (used with start_date) |
| count | int | none | Number of randomly chosen images |
| thumbs | bool | False | Return video thumbnail URL |
| api_key | string | DEMO_KEY | api.nasa.gov key for expanded usage |

#### Example Query
```
https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY
```

**Note**: concept_tags are now disabled. An optional return parameter `copyright` is returned if the image is not public domain.

---

### 2. Asteroids NeoWs - Near Earth Object Web Service

**Description**: RESTful web service for near earth Asteroid information. Search for Asteroids based on their closest approach date to Earth, lookup specific Asteroids, and browse the overall dataset.

**Data Source**: NASA JPL Asteroid team (http://neo.jpl.nasa.gov/)
**Maintained by**: [SpaceRocks Team](https://github.com/SpaceRocks/)

#### Neo - Feed
```
GET https://api.nasa.gov/neo/rest/v1/feed?start_date=START_DATE&end_date=END_DATE&api_key=API_KEY
```

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| start_date | YYYY-MM-DD | none | Starting date for asteroid search |
| end_date | YYYY-MM-DD | 7 days after start_date | Ending date for asteroid search |
| api_key | string | DEMO_KEY | api.nasa.gov key for expanded usage |

#### Example Query
```
https://api.nasa.gov/neo/rest/v1/feed?start_date=2015-09-07&end_date=2015-09-08&api_key=DEMO_KEY
```

#### Neo - Lookup
```
GET https://api.nasa.gov/neo/rest/v1/neo/{asteroid_id}
```

#### Path Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| asteroid_id | int | none | Asteroid SPK-ID correlates to NASA JPL small body |
| api_key | string | DEMO_KEY | api.nasa.gov key for expanded usage |

#### Example Query
```
https://api.nasa.gov/neo/rest/v1/neo/3542519?api_key=DEMO_KEY
```

#### Neo - Browse
```
GET https://api.nasa.gov/neo/rest/v1/neo/browse/
```

#### Example Query
```
https://api.nasa.gov/neo/rest/v1/neo/browse?api_key=DEMO_KEY
```

---

### 3. DONKI - Space Weather Database Of Notifications, Knowledge, Information

**Description**: Comprehensive online tool for space weather forecasters, scientists, and the general space science community. Chronicles daily interpretations of space weather observations, analysis, models, forecasts, and notifications.

**More Info**: [DONKI Portal](https://ccmc.gsfc.nasa.gov/tools/DONKI/)

#### Available Services

| API | Example |
|-----|----------|
| [Coronal Mass Ejection (CME)](#donki-cme) | https://api.nasa.gov/DONKI/CME?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&api_key=DEMO_KEY |
| [CME Analysis](#donki-cme-analysis) | https://api.nasa.gov/DONKI/CMEAnalysis?startDate=2016-09-01&endDate=2016-09-30&mostAccurateOnly=true&speed=500&halfAngle=30&catalog=ALL&api_key=DEMO_KEY |
| [Geomagnetic Storm (GST)](#donki-gst) | https://api.nasa.gov/DONKI/GST?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&api_key=DEMO_KEY |
| [Interplanetary Shock (IPS)](#donki-ips) | https://api.nasa.gov/DONKI/IPS?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&location=LOCATION&catalog=CATALOG&api_key=DEMO_KEY |
| [Solar Flare (FLR)](#donki-flr) | https://api.nasa.gov/DONKI/FLR?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&api_key=DEMO_KEY |
| [Solar Energetic Particle (SEP)](#donki-sep) | https://api.nasa.gov/DONKI/SEP?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&api_key=DEMO_KEY |
| [Magnetopause Crossing (MPC)](#donki-mpc) | https://api.nasa.gov/DONKI/MPC?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&api_key=DEMO_KEY |
| [Radiation Belt Enhancement (RBE)](#donki-rbe) | https://api.nasa.gov/DONKI/RBE?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&api_key=DEMO_KEY |
| [High Speed Stream (HSS)](#donki-hss) | https://api.nasa.gov/DONKI/HSS?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&api_key=DEMO_KEY |
| [WSA+EnlilSimulation](#donki-wsa) | https://api.nasa.gov/DONKI/WSAEnlilSimulations?startDate=2016-01-06&endDate=2016-01-06&api_key=DEMO_KEY |
| [Notifications](#donki-notifications) | https://api.nasa.gov/DONKI/notifications?startDate=2014-05-01&endDate=2014-05-08&type=all&api_key=DEMO_KEY |

#### Default Parameters
- **startDate**: Default to 30 days prior to current UTC date (7 days for WSA and Notifications)
- **endDate**: Default to current UTC date

---

### 4. EONET - The Earth Observatory Natural Event Tracker

**Description**: Prototype web service providing a curated source of continuously updated natural event metadata and links to thematically-related web service-enabled image sources.

**More Info**: [EONET API Documentation](http://eonet.gsfc.nasa.gov/docs/v2.1)
**Supported by**: [NASA's Earth Observatory](http://earthobservatory.nasa.gov/) and [ESDIS Project](https://earthdata.nasa.gov/about/esdis-project)

**Development**: Started in 2015

---

### 5. EPIC - Earth Polychromatic Imaging Camera

**Description**: Provides information on daily imagery collected by DSCOVR's Earth Polychromatic Imaging Camera (EPIC) instrument. Uniquely positioned at the Earth-Sun Lagrange point, EPIC provides full disc imagery of Earth.

**Technical Details**:
- 2048x2048 pixel CCD detector
- 30-cm aperture Cassegrain telescope
- Captures lunar transits and other astronomical events

**Development**: API development began in 2015
**Supported by**: [Laboratory for Atmospheres](http://atmospheres.gsfc.nasa.gov/), Goddard Space Flight Center
**More Info**: [EPIC website](http://epic.gsfc.nasa.gov/)

#### Retrievable Metadata
- Image name
- Date
- Caption
- centroid_coordinates
- dscovr_j2000_position
- lunar_j2000_position
- sun_j2000_position
- attitude_quaternions

#### Querying by Date(s)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| natural | string | Most Recent Natural Color | Metadata on the most recent date of natural color imagery |
| natural/date | YYYY-MM-DD | Most Recent Available | Metadata for natural color imagery available for a given date |
| natural/all | string | Dates for Natural Color | A listing of all dates with available natural color imagery |
| natural/available | string | Dates for Natural Color | Alternate listing of all dates with available natural color imagery |
| enhanced | string | Most Recent Enhanced Color | Metadata on the most recent date of enhanced color imagery |
| enhanced/date | YYYY-MM-DD | Most Recent Available | Metadata for enhanced color imagery for a given date |
| enhanced/all | string | Dates for Enhanced Imagery | A listing of all dates with available enhanced color imagery |
| enhanced/available | string | Dates for Enhanced Imagery | Alternate listing of all dates with available enhanced color imagery |
| api_key | string | DEMO_KEY | API key from api.nasa.gov for expanded usage |

#### Example Queries
```
https://api.nasa.gov/EPIC/api/natural/images?api_key=DEMO_KEY
https://api.nasa.gov/EPIC/api/natural/date/2019-05-30?api_key=DEMO_KEY
https://api.nasa.gov/EPIC/api/natural/all?api_key=DEMO_KEY
https://api.nasa.gov/EPIC/archive/natural/2019/05/30/png/epic_1b_20190530011359.png?api_key=DEMO_KEY
```

**More Examples**: [EPIC API Documentation Page](https://epic.gsfc.nasa.gov/about/api)

---

### 6. Exoplanet Archive

**Description**: Manages database of planet detections and characterizations. The archive stores data from exoplanet surveys including: K2, Kepler, TESS (Transiting Exoplanet Survey Satellite), HIRES, HARPS, and other ground-based radial velocity surveys.

**Searchable Parameters**:
- Planet properties (period, radius, mass, eccentricity, etc.)
- Stellar properties (temperature, radius, age, metallicity, etc.)
- Discovery properties (year, method, reference, etc.)

**API Documentation**: [Exoplanet Archive API Guide](https://exoplanetarchive.ipac.caltech.edu/docs/program_interfaces.html)
**Data Reference**: [Planetary Systems Table](https://exoplanetarchive.ipac.caltech.edu/cgi-bin/TblView/nph-tblView?app=ExoTbls&config=PS)

#### HTTP Request
```
GET https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+*+from+ps+where+disc_year=2020&format=json
```

#### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| query | string | SQL-like query for data selection |
| format | string | Output format (json, csv, xml, votable, ipac, etc.) |
| table | string | Database table name (ps, pscomppars, etc.) |

#### Example Queries
```
# Get all planets discovered in 2020
https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+*+from+ps+where+disc_year=2020&format=json

# Get planets with Earth-like radius
https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+pl_name,pl_rade+from+ps+where+pl_rade+between+0.8+and+1.2&format=json
```

---

### 7. GIBS - Global Imagery Browse Services

**Description**: Provides full-resolution satellite imagery and data visualizations. GIBS accesses satellite data products from various NASA missions and provides them as georeferenced map tiles.

**Important Note**: GIBS replaced the legacy Earth API in 2017

**Supported Data Sources**:
- MODIS (Terra/Aqua)
- VIIRS (Suomi NPP/NOAA-20)
- GEOS-5 Model
- AMSR2 (GCOM-W1)
- OMI (Aura)
- MISR (Terra)

**Documentation**: [GIBS API Documentation](https://wiki.earthdata.nasa.gov/display/GIBS/)
**More Info**: [Worldview](https://worldview.earthdata.nasa.gov/) (powered by GIBS)

#### Web Map Service (WMS)
```
GET https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi
```

#### Web Map Tile Service (WMTS)
```
GET https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi
```

#### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| SERVICE | string | WMS or WMTS |
| REQUEST | string | GetCapabilities, GetMap, GetTile |
| LAYERS | string | Layer identifier |
| TIME | ISO 8601 | Date/time for temporal layers |
| BBOX | string | Bounding box coordinates |
| WIDTH/HEIGHT | int | Image dimensions |
| FORMAT | string | Image format (image/png, image/jpeg) |

#### Example Query
```
https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&layers=MODIS_Terra_CorrectedReflectance_TrueColor&version=1.3.0&crs=EPSG:4326&transparent=true&width=512&height=512&bbox=-90,-180,90,180&format=image/png&time=2023-01-01
```

---

### 8. InSight - Mars Weather Service API

**Description**: Access weather reports from NASA's InSight Mars lander. Provides daily weather measurements including temperature, wind, and pressure from the Martian surface.

**Mission Details**: InSight (Interior Exploration using Seismic Investigations, Geodesy and Heat Transport)
**Landing Site**: Elysium Planitia, Mars
**Mission Status**: Completed (2018-2022)

**Data Includes**:
- Air temperature (high/low)
- Wind speed and direction  
- Atmospheric pressure
- Sol (Martian day) information

#### HTTP Request
```
GET https://api.nasa.gov/insight_weather/
```

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| api_key | string | DEMO_KEY | api.nasa.gov key for expanded usage |
| feedtype | string | json | Response format |
| ver | string | 1.0 | API version |

#### Example Query
```
https://api.nasa.gov/insight_weather/?api_key=DEMO_KEY&feedtype=json&ver=1.0
```

**Note**: InSight mission concluded in December 2022. Historical weather data remains available through this API.

---

### 9. Mars Rover Photos

**Description**: Access image data gathered by NASA's Mars rovers. This API is designed around the sol (Martian rotation or day) on which a photo was taken, along with the rover which took it.

**Available Rovers**: Curiosity, Opportunity, Spirit, Perseverance
**Data Source**: Mars Science Laboratory (MSL), Mars Exploration Rover (MER), Mars 2020 missions

#### Available Cameras by Rover

**Curiosity**:
- FHAZ (Front Hazard Avoidance Camera)
- RHAZ (Rear Hazard Avoidance Camera) 
- MAST (Mast Camera)
- CHEMCAM (Chemistry and Camera Complex)
- MAHLI (Mars Hand Lens Imager)
- MARDI (Mars Descent Imager)
- NAVCAM (Navigation Camera)
- PANCAM (Panoramic Camera)
- MINITES (Miniature Thermal Emission Spectrometer)

**Opportunity & Spirit**:
- FHAZ (Front Hazard Avoidance Camera)
- RHAZ (Rear Hazard Avoidance Camera)
- NAVCAM (Navigation Camera)
- PANCAM (Panoramic Camera)
- MINITES (Miniature Thermal Emission Spectrometer)

**Perseverance**:
- EDL_RUCAM (Rover Up-Look Camera)
- EDL_RDCAM (Rover Down-Look Camera)
- EDL_DDCAM (Descent Stage Down-Look Camera)
- EDL_PUCAM1 (Parachute Up-Look Camera A)
- EDL_PUCAM2 (Parachute Up-Look Camera B)
- NAVCAM_LEFT (Navigation Camera - Left)
- NAVCAM_RIGHT (Navigation Camera - Right)
- MCZ_RIGHT (Mast Camera Zoom - Right)
- MCZ_LEFT (Mast Camera Zoom - Left)
- FRONT_HAZCAM_LEFT_A (Front Hazard Avoidance Camera - Left)
- FRONT_HAZCAM_RIGHT_A (Front Hazard Avoidance Camera - Right)
- REAR_HAZCAM_LEFT (Rear Hazard Avoidance Camera - Left)
- REAR_HAZCAM_RIGHT (Rear Hazard Avoidance Camera - Right)
- SKYCAM (MEDA Skycam)
- SHERLOC_WATSON (SHERLOC WATSON Camera)

#### HTTP Requests

##### Photos by Sol
```
GET https://api.nasa.gov/mars-photos/api/v1/rovers/{rover_name}/photos
```

##### Photos by Earth Date
```
GET https://api.nasa.gov/mars-photos/api/v1/rovers/{rover_name}/photos
```

##### Mission Manifest
```
GET https://api.nasa.gov/mars-photos/api/v1/manifests/{rover_name}
```

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| sol | int | none | Martian sol (day) of the rover's mission |
| earth_date | YYYY-MM-DD | none | Earth date |
| camera | string | all | Abbreviation of camera |
| page | int | 1 | 25 items per page returned |
| api_key | string | DEMO_KEY | api.nasa.gov key for expanded usage |

#### Example Queries
```
# Curiosity photos from Sol 1000
https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?sol=1000&api_key=DEMO_KEY

# Perseverance photos from specific Earth date
https://api.nasa.gov/mars-photos/api/v1/rovers/perseverance/photos?earth_date=2021-03-05&api_key=DEMO_KEY

# Opportunity PANCAM photos from Sol 1000
https://api.nasa.gov/mars-photos/api/v1/rovers/opportunity/photos?sol=1000&camera=pancam&api_key=DEMO_KEY

# Get Curiosity mission manifest
https://api.nasa.gov/mars-photos/api/v1/manifests/curiosity?api_key=DEMO_KEY
```

---

### 10. NASA Image and Video Library

**Description**: Access to the NASA Image and Video Library, offering a comprehensive search of NASA's extensive collection of imagery, videos, and audio files spanning the agency's history.

**Base URL**: https://images-api.nasa.gov
**Collection Size**: 140,000+ assets and growing
**Content Types**: Images, Videos, Audio files

#### HTTP Request
```
GET https://images-api.nasa.gov/search
```

#### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Free text search terms |
| center | string | NASA center which published the media |
| description | string | Terms to search for in "Description" fields |
| description_508 | string | Terms to search for in "508 Description" fields |
| keywords | string | Terms to search for in "Keywords" fields |
| location | string | Terms to search for in "Location" fields |
| media_type | string | Media types to restrict the search to (image, video, audio) |
| nasa_id | string | The media asset's NASA ID |
| page | int | Page number, starting at 1 |
| photographer | string | Terms to search for in "Photographer" fields |
| secondary_creator | string | Terms to search for in "Secondary Creator" fields |
| title | string | Terms to search for in "Title" fields |
| year_start | YYYY | The start year for results |
| year_end | YYYY | The end year for results |

#### Additional Endpoints

##### Asset Manifest
```
GET https://images-api.nasa.gov/asset/{nasa_id}
```

##### Asset Metadata
```
GET https://images-api.nasa.gov/metadata/{nasa_id}
```

##### Asset Captions (for videos)
```
GET https://images-api.nasa.gov/captions/{nasa_id}
```

#### Example Queries
```
# Search for Apollo mission images
https://images-api.nasa.gov/search?q=apollo&media_type=image

# Search for Mars videos from 2020
https://images-api.nasa.gov/search?q=mars&media_type=video&year_start=2020&year_end=2020

# Search by NASA center
https://images-api.nasa.gov/search?center=JPL&media_type=image

# Get asset manifest
https://images-api.nasa.gov/asset/as11-40-5874
```

**Note**: This API does not require an API key but has rate limiting in place.

---

### 11. Open Science Data Repository

**Description**: Access NASA's repository for open science data, including datasets from various missions and research programs. The repository supports scientific research and data sharing initiatives.

**Purpose**: Facilitate access to NASA's scientific datasets
**Data Types**: Mission data, research datasets, processed scientific results
**Format Support**: Multiple formats including JSON, CSV, XML, HDF5, NetCDF

#### Key Features
- Search and discovery of scientific datasets
- Metadata access for all datasets
- Direct download links for data files
- API access for programmatic data retrieval

#### Example Data Categories
- Earth Science datasets
- Planetary science data
- Astrophysics observations
- Heliophysics measurements
- Space technology datasets

**Access**: Through data.nasa.gov portal and various mission-specific APIs
**Documentation**: [NASA Open Data Portal](https://data.nasa.gov/)

---

### 12. Satellite Situation Center

**Description**: Web-based tool for satellite orbit visualization and data analysis. Provides access to spacecraft trajectory data, orbital information, and satellite tracking capabilities.

**Capabilities**:
- Spacecraft trajectory plotting
- Orbital data analysis
- Satellite position calculations
- Mission planning support

**Data Sources**: 
- SPICE kernels
- Two-Line Element sets (TLEs)
- Definitive and predictive orbit data

**Access Method**: [SSC Web Services](https://sscweb.gsfc.nasa.gov/)
**Web Interface**: [Satellite Situation Center](https://sscweb.gsfc.nasa.gov/)

#### Example Usage
- Track International Space Station (ISS)
- Monitor satellite constellations
- Plan observation windows
- Analyze spacecraft trajectories

---

### 13. SSD/CNEOS - Small-Body Database and Center for Near Earth Object Studies

**Description**: Access data from NASA's Small-Body Database (SSD) and Center for Near Earth Object Studies (CNEOS). Provides information about asteroids, comets, and their close approaches to Earth.

**SSD Features**:
- Physical and orbital data for small bodies
- Discovery circumstances
- Observational data

**CNEOS Features**:
- Close approach data
- Impact risk assessments
- Sentry monitoring system data

#### HTTP Requests

##### Small-Body Database Browser
```
GET https://ssd-api.jpl.nasa.gov/sbdb.api
```

##### Close Approach Data
```
GET https://ssd-api.jpl.nasa.gov/cad.api
```

##### Sentry Impact Monitoring
```
GET https://ssd-api.jpl.nasa.gov/sentry.api
```

#### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| sstr | string | Small-body designation |
| full-prec | bool | Full precision numerical output |
| date-min | YYYY-MM-DD | Minimum close approach date |
| date-max | YYYY-MM-DD | Maximum close approach date |
| dist-max | string | Maximum close approach distance |
| sort | string | Sort order for results |

#### Example Queries
```
# Get data for asteroid Bennu
https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=101955

# Get close approaches for 2023
https://ssd-api.jpl.nasa.gov/cad.api?date-min=2023-01-01&date-max=2023-12-31

# Get Sentry impact risk data
https://ssd-api.jpl.nasa.gov/sentry.api
```

---

### 14. TechPort

**Description**: Access information about NASA's current technology portfolio and research projects. TechPort provides visibility into NASA's technology investments and development efforts.

**Coverage**: Current and past NASA technology projects
**Data Includes**: Project descriptions, benefits, applications, work locations, and responsible organizations

#### HTTP Request
```
GET https://api.nasa.gov/techport/api/projects
```

#### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| api_key | string | api.nasa.gov key for expanded usage |
| updatedSince | YYYY-MM-DD | Return projects updated since this date |

#### Individual Project Data
```
GET https://api.nasa.gov/techport/api/projects/{project_id}
```

#### Example Queries
```
# Get all projects
https://api.nasa.gov/techport/api/projects?api_key=DEMO_KEY

# Get projects updated since specific date
https://api.nasa.gov/techport/api/projects?updatedSince=2023-01-01&api_key=DEMO_KEY

# Get specific project details
https://api.nasa.gov/techport/api/projects/17792?api_key=DEMO_KEY
```

---

### 15. TechTransfer

**Description**: Search NASA's patents portfolio and technologies available for licensing. Supports NASA's technology transfer mission by providing public access to innovations developed by NASA.

**Database Content**:
- NASA Patents
- Software catalog
- Spinoff technologies
- Technology transfer opportunities

#### HTTP Requests

##### Patent Search
```
GET https://api.nasa.gov/techtransfer/patent/
```

##### Software Search
```
GET https://api.nasa.gov/techtransfer/software/
```

##### Spinoff Search
```
GET https://api.nasa.gov/techtransfer/spinoff/
```

#### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| engine | string | Search engine (patent, software, spinoff) |
| query | string | Search term |
| format | string | Response format |
| api_key | string | api.nasa.gov key for expanded usage |

#### Example Queries
```
# Search patents for propulsion
https://api.nasa.gov/techtransfer/patent/?engine=patent&query=propulsion&api_key=DEMO_KEY

# Search software catalog
https://api.nasa.gov/techtransfer/software/?engine=software&query=simulation&api_key=DEMO_KEY

# Search spinoff technologies
https://api.nasa.gov/techtransfer/spinoff/?engine=spinoff&query=medical&api_key=DEMO_KEY
```

---

### 16. TLE API - Two Line Element

**Description**: Access Two Line Element (TLE) data for tracking satellite and space debris. TLEs are data format encoding orbital elements of Earth-orbiting objects for a given point in time.

**Data Sources**: 
- Active satellites
- Space debris
- International Space Station
- Various spacecraft

**Update Frequency**: Regular updates as new TLE data becomes available
**Format**: Standard TLE format as specified by NORAD

#### Use Cases
- Satellite tracking
- Orbital prediction
- Space situational awareness
- Amateur radio satellite operations

**Access**: Through various NASA and partner APIs
**Documentation**: [TLE Format Specification](https://celestrak.com/NORAD/documentation/tle-fmt.php)

---

### 17. Vesta/Moon/Mars Trek WMTS

**Description**: Web Map Tile Service (WMTS) for planetary mapping data from NASA's Trek portals. Provides access to high-resolution imagery and maps of celestial bodies.

**Available Maps**:
- **Moon Trek**: Lunar surface imagery and topography
- **Mars Trek**: Martian surface features and geological data  
- **Vesta Trek**: Asteroid Vesta surface mapping data

#### Features
- High-resolution imagery
- Topographic data
- Landing site information
- Scientific annotations
- Mission planning tools

#### Web Portals
- [Moon Trek](https://trek.nasa.gov/moon/)
- [Mars Trek](https://trek.nasa.gov/mars/)
- [Vesta Trek](https://trek.nasa.gov/vesta/)

#### WMTS Services
```
# Moon WMTS
GET https://trek.nasa.gov/tiles/Moon/{layer}/{z}/{x}/{y}.png

# Mars WMTS  
GET https://trek.nasa.gov/tiles/Mars/{layer}/{z}/{x}/{y}.png

# Vesta WMTS
GET https://trek.nasa.gov/tiles/Vesta/{layer}/{z}/{x}/{y}.png
```

#### Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| layer | string | Map layer identifier |
| z | int | Zoom level |
| x | int | Tile column |
| y | int | Tile row |

**Note**: These services follow standard WMTS tile naming conventions and can be integrated with web mapping libraries like Leaflet, OpenLayers, or ArcGIS API.

---

## Summary and Rate Limits

### Rate Limits
- **Demo Key (DEMO_KEY)**: 30 requests per hour, 50 requests per day
- **Personal API Key**: 1,000 requests per hour
- **Rate Limit Headers**: Check `X-RateLimit-Limit` and `X-RateLimit-Remaining` in responses
- **Blocking**: Exceeding limits temporarily blocks your API key for one hour
- **Reset**: Hourly counters reset on a rolling basis

### Authentication
Get your free API key at: [https://api.nasa.gov/](https://api.nasa.gov/)

### API Categories Summary
1. **Imagery & Earth Observation**: APOD, EPIC, GIBS, Mars Rover Photos
2. **Space Weather & Events**: DONKI, EONET
3. **Planetary & Asteroid Data**: Asteroids NeoWs, SSD/CNEOS, Mars Weather (InSight)
4. **Scientific Databases**: Exoplanet Archive, NASA Image Library, Open Science Data
5. **Technology & Innovation**: TechPort, TechTransfer
6. **Mission Support**: Satellite Situation Center, TLE API, Trek WMTS

### Additional Resources
- [NASA Open Data Portal](https://data.nasa.gov/)
- [NASA API Documentation](https://api.nasa.gov/)
- [NASA GitHub Repository](https://github.com/nasa/api-docs)
- [API Support](mailto:hq-open-innovation@mail.nasa.gov)

---

*Documentation compiled from: https://api.nasa.gov/*  
*Last Updated: September 13, 2025*  
*Total APIs Documented: 17 major services*

**Note**: Some endpoints may require specific authentication or have different base URLs. Always refer to the official NASA API documentation for the most current information and any updates to available services.