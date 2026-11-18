import React from 'react';
import { Wind, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-10 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-white">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Wind className="w-4 h-4" />
              </div>
              <span className="font-bold text-base">AirWise AI</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              GenAI-powered environmental intelligence companion helping families and communities navigate severe winter smog and urban air pollution.
            </p>
          </div>

          {/* Environmental Data Standards */}
          <div className="space-y-2">
            <h5 className="text-white font-semibold text-xs uppercase tracking-wider">Air Quality Standards</h5>
            <p className="text-[11px] leading-relaxed">
              Indices displayed adhere to the official <strong className="text-slate-200">US EPA AQI Standard (0-500)</strong> with pollutant-specific breakpoints for PM2.5, PM10, NO2, SO2, and Ozone. Never fabricated or conflated across standards.
            </p>
          </div>

          {/* Data Sources */}
          <div className="space-y-2">
            <h5 className="text-white font-semibold text-xs uppercase tracking-wider">Open Environmental APIs</h5>
            <ul className="space-y-1.5 text-[11px]">
              <li className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Open-Meteo Air Quality (Copernicus CAMS)</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Open-Meteo Global Weather Models (GFS/ECMWF)</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>DEFRA & US EPA GHG Emission Factors</span>
              </li>
            </ul>
          </div>

          {/* Transparency & Disclaimer */}
          <div className="space-y-2">
            <h5 className="text-white font-semibold text-xs uppercase tracking-wider">Scientific Disclaimer</h5>
            <p className="text-[11px] leading-relaxed">
              AirWise AI provides exposure reduction guidance and estimated carbon metrics based on published environmental health models. Always consult local public health authorities during severe hazardous pollution emergencies.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <p>© 2026 AirWise AI — Virtual PromptWars Production Submission. All rights reserved.</p>
          <p className="flex items-center space-x-1 mt-2 sm:mt-0">
            <span>Built with precision for human health and environmental sustainability</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
