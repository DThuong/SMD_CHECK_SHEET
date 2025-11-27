import { useEffect, useRef } from 'react';
import logo from '../../assets/image/brand_image_3.webp'
import { FaLocationDot } from "react-icons/fa6";

const Footer = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS and initialize map
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    
    script.onload = () => {
      if (mapRef.current && !mapInstanceRef.current) {
        const L = (window as any).L;
        
        // Initialize map - Pyeongtaek, Gyeonggi-do coordinates
        const map = L.map(mapRef.current).setView([37.0, 127.0], 13);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Add marker
        const marker = L.marker([37.0, 127.0]).addTo(map);
        marker.bindPopup('<b>DONG YANG E.P</b><br>Gyeonggi-do, Korea').openPopup();
        
        mapInstanceRef.current = map;
      }
    };
    
    document.body.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <footer className="bg-gray-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-5">
          {/* Company Info */}
          <div>
            <div className="w-32 h-16 flex items-center gap-3 mb-4">
              <img src={logo} alt="error image" className='w-full h-full object-cover' />
            </div>
            <div className="space-y-1 text-sm text-gray-300">
              <p>sales@dyenp.com</p>
              <p>Tel: 82-(0)31-370-6600</p>
              <p>Fax: 82-(0)31-235-6243</p>
            </div>
          </div>

          {/* Notice */}
          <div>
            <h3 className="font-bold mb-2 text-white">Notice +</h3>
            <ul className="flex flex-col gap-2 py-2 text-sm mb-0 p-0">
              <li><a href="#" className="hover:text-white text-white transition">Company News</a></li>
              <li><a href="#" className="hover:text-white text-white transition">Product Updates</a></li>
              <li><a href="#" className="hover:text-white text-white transition">Events</a></li>
            </ul>
          </div>

          {/* Location with Leaflet Map */}
          <div>
            <div className='mb-2 flex flex-row gap-2 items-center'>
                <span><FaLocationDot size={27} /></span>
                <h3 className="font-bold text-red-400">LOCATION</h3>
            </div>
            <div 
              ref={mapRef}
              className="bg-gray-600 rounded-lg overflow-hidden h-48 w-full"
            />
          </div>
        </div>

        {/* Copyright */}
        <div className="py-3 mt-8 pt-8 border-t border-gray-600 text-sm text-gray-400 text-center md:text-left">
          <p>Tel. 031-370-6600 Email. sales@dyenp.com</p>
          <p className="mt-1 mb-0">
            DONG YANG E&P | Jinwi-myeon, Pyeongtaek-si, Gyeonggi-do, Korea. Copyright © DONG YANG E&P Inc. All Right Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;