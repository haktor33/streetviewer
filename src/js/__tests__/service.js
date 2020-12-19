
import * as service from '../service';

test('Panorama should check coordinates', () => {


  
    expect(() => {
        service.getPanoramabyCoordinates();
      }).toThrow('Coordinates must be defined');
 


  });
  
  test('Panorama should check options', () => {


  
    expect(() => {
        service.getPanoramabyCoordinates([]);
      }).toThrow('Options must be defined');
 


  }); 
  
  test('Panorama should check configuration', () => {


  
    expect(() => {
        service.getPanoramabyCoordinates([],{});
      }).toThrow('Configuration must be defined');
 


  });