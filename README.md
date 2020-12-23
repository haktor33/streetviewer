# Introduction

Street Level Imagery Viewer based on Three.js

# Getting Started


2.  Install dependencies:

        yarn

    or

        npm install

3.  Run webpack:

        npm start
# Usage

### init

        init(options)
Initializes viewer. 

Parameters:
        -configuration : api end point configuration. 
        -coordinates : starting coordinates
        -controlid : html control to render the viewer. 


### setLocation
        setLocation(coordinates)

Opens a panorama by coordinates. Returns 

Parameters:
        -coordinates : panorama coordinates
  
### setId
        setId(id)

Opens a panorama by panorama id. 

Parameters:
        -id : panorama id

## Events 

### camerachanged

Fired when the viewer camera changed pov. 

