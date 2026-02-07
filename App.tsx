
import React, { useState, useEffect } from 'react';
import AgriMap from './components/AgriMap';
import { Coordinate, FarmState, IrrigationStatus } from './types';
import { CROP_PROFILES, SOIL_PROFILES, Icons } from './constants';
import { calculateArea, formatThaiArea } from './utils/geometry';
import { getAgriculturalAdvice, estimateSoilType } from './services/geminiService';

const App: React.FC = () => {
  const [farm, setFarm] = useState<FarmState>({
    points: [],
    areaSqm: 0,
    selectedCrop: CROP_PROFILES[0].id,
    selectedSoil: SOIL_PROFILES[0].id,
    irrigationStatus: IrrigationStatus.OFF,
    isRecording: false
  });

  const [aiAdvice, setAiAdvice] = useState<any>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [isEstimatingSoil, setIsEstimatingSoil] = useState(false);
  const [systemLog, setSystemLog] = useState<string[]>(['AgriFlow พร้อมทำงาน...']);

  const addPoint = (coord: Coordinate) => {
    setFarm(prev => {
      const newPoints = [...prev.points, coord];
      return {
        ...prev,
        points: newPoints,
        areaSqm: calculateArea(newPoints)
      };
    });
  };

  const clearPoints = () => {
    setFarm(prev => ({ ...prev, points: [], areaSqm: 0 }));
    setAiAdvice(null);
  };

  const handleAutoSoilEstimate = async () => {
    if (farm.points.length === 0) {
      alert('กรุณาระบุตำแหน่งบนแผนที่ก่อนเพื่อให้ AI วิเคราะห์พื้นที่');
      return;
    }
    
    setIsEstimatingSoil(true);
    const centerPoint = farm.points[0];
    const result = await estimateSoilType(centerPoint.lat, centerPoint.lng);
    
    if (result && result.soilId) {
      setFarm(prev => ({ ...prev, selectedSoil: result.soilId }));
      setSystemLog(prev => [`AI วิเคราะห์ดิน: ${result.reason}`, ...prev.slice(0, 4)]);
    }
    setIsEstimatingSoil(false);
  };

  const handleGetAdvice = async () => {
    if (farm.areaSqm <= 0) return;
    setIsLoadingAdvice(true);
    const crop = CROP_PROFILES.find(c => c.id === farm.selectedCrop);
    const soil = SOIL_PROFILES.find(s => s.id === farm.selectedSoil);
    const advice = await getAgriculturalAdvice(farm.areaSqm, crop?.name || 'พืช', soil?.name || 'ดิน');
    setAiAdvice(advice);
    setIsLoadingAdvice(false);
  };

  const toggleIrrigation = (status: IrrigationStatus) => {
    setFarm(prev => ({ ...prev, irrigationStatus: status }));
    const logMsg = status === IrrigationStatus.ON ? 'เปิดวาล์วน้ำ (Manual)' : 
                   status === IrrigationStatus.AUTO ? 'ระบบอัตโนมัติทำงาน' : 'ปิดระบบ';
    setSystemLog(prev => [logMsg, ...prev.slice(0, 4)]);
  };

  const currentCrop = CROP_PROFILES.find(c => c.id === farm.selectedCrop);
  const currentSoil = SOIL_PROFILES.find(s => s.id === farm.selectedSoil);
  
  // Advanced water calculation: Area * CropNeed * SoilRetentionFactor
  const calculatedDailyWater = farm.areaSqm * (currentCrop?.waterNeedsPerDay || 0) * (currentSoil?.retentionFactor || 1);
  const dailyWaterVolume = calculatedDailyWater.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row p-4 gap-6 max-w-7xl mx-auto">
      
      {/* Sidebar - Controls & Info */}
      <div className="w-full md:w-80 lg:w-96 space-y-6 flex-shrink-0">
        <header className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="p-3 bg-emerald-500 rounded-xl text-white shadow-emerald-200 shadow-lg">
            <Icons.Water />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">AgriFlow 2.0</h1>
            <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-widest">Precision Agriculture</p>
          </div>
        </header>

        {/* Section: Land & Soil Selection */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-md font-bold text-slate-700 flex items-center gap-2">
              <Icons.Location /> ตั้งค่าแปลงเกษตร
            </h2>
            <button onClick={clearPoints} className="text-[10px] text-slate-400 hover:text-red-500 font-bold uppercase">Clear Map</button>
          </div>

          {/* Area Display */}
          <div className="bg-slate-900 p-4 rounded-xl text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
               <Icons.Map />
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">พื้นที่คำนวณได้</p>
            <p className="text-xl font-bold text-emerald-400">{formatThaiArea(farm.areaSqm)}</p>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">ชนิดพืชที่ปลูก</label>
              <select 
                value={farm.selectedCrop}
                onChange={(e) => setFarm(prev => ({ ...prev, selectedCrop: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {CROP_PROFILES.map(crop => <option key={crop.id} value={crop.id}>{crop.name}</option>)}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase">ประเภทดิน</label>
                <button 
                  onClick={handleAutoSoilEstimate}
                  disabled={isEstimatingSoil}
                  className="flex items-center gap-1 text-[10px] font-bold text-purple-600 hover:text-purple-700 disabled:opacity-50"
                >
                  <Icons.Sparkles /> {isEstimatingSoil ? 'กำลังวิเคราะห์...' : 'AI วิเคราะห์ดินอัตโนมัติ'}
                </button>
              </div>
              <select 
                value={farm.selectedSoil}
                onChange={(e) => setFarm(prev => ({ ...prev, selectedSoil: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none"
              >
                {SOIL_PROFILES.map(soil => <option key={soil.id} value={soil.id}>{soil.name}</option>)}
              </select>
              <p className="mt-1.5 text-[10px] text-slate-400 leading-relaxed">
                {currentSoil?.description}
              </p>
            </div>
          </div>
        </section>

        {/* Section: Water Requirements */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-md font-bold text-slate-700 flex items-center gap-2 mb-4">
            <Icons.Water /> ปริมาณน้ำที่ต้องการ
          </h2>
          <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 text-blue-100 scale-150 rotate-12">
              <Icons.Water />
            </div>
            <p className="text-[10px] text-blue-600 font-bold uppercase mb-1">ประมาณการรายวัน</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-900">{dailyWaterVolume}</span>
              <span className="text-sm font-bold text-blue-700">ลิตร</span>
            </div>
            <p className="text-[10px] text-blue-500 mt-2 font-medium">
              * คำนวณจาก {currentCrop?.name} ใน {currentSoil?.name}
            </p>
          </div>
        </section>

        {/* Section: Irrigation Controls */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-md font-bold text-slate-700 flex items-center gap-2 mb-4">
            <Icons.Automation /> ควบคุมการให้น้ำ
          </h2>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { id: IrrigationStatus.OFF, label: 'ปิด', color: 'slate' },
              { id: IrrigationStatus.ON, label: 'เปิด', color: 'emerald' },
              { id: IrrigationStatus.AUTO, label: 'AUTO', color: 'blue' }
            ].map(btn => (
              <button 
                key={btn.id}
                onClick={() => toggleIrrigation(btn.id)}
                className={`py-3 rounded-xl text-xs font-bold transition-all ${
                  farm.irrigationStatus === btn.id 
                  ? `bg-${btn.color}-600 text-white shadow-lg scale-105` 
                  : `bg-${btn.color}-50 text-${btn.color}-600 hover:bg-${btn.color}-100`
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
          <div className="bg-slate-900 rounded-xl p-3 h-24 overflow-y-auto font-mono text-[9px] text-emerald-400 border border-slate-800">
            {systemLog.map((log, i) => (
              <div key={i} className="mb-1 opacity-90"><span className="text-slate-600 mr-2">LOG:</span>{log}</div>
            ))}
          </div>
        </section>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Map Display */}
        <div className="flex-1 min-h-[400px] bg-white rounded-[2rem] shadow-sm border border-slate-200 p-2 relative group">
          <AgriMap points={farm.points} onPointAdd={addPoint} isRecording={farm.isRecording} />
          
          <div className="absolute top-6 left-6 z-[1000]">
            <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-xl border border-white/20 text-xs font-bold text-slate-700">
              {farm.points.length} จุดกำหนดขอบเขต
            </div>
          </div>

          <div className="absolute bottom-6 right-6 z-[1000]">
            <button 
              onClick={() => window.navigator.geolocation.getCurrentPosition(
                (pos) => addPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => alert('ไม่สามารถเข้าถึงตำแหน่งได้'),
                { enableHighAccuracy: true }
              )}
              className="bg-emerald-500 p-4 rounded-2xl shadow-2xl hover:bg-emerald-600 text-white transition-all transform active:scale-95 border-b-4 border-emerald-700"
            >
              <Icons.Location />
            </button>
          </div>
        </div>

        {/* AI Insight Section */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 opacity-50"></div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                <Icons.Sparkles />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">AI Agricultural Insight</h2>
                <p className="text-sm text-slate-500 font-medium">คำแนะนำอัจฉริยะสำหรับแปลงเกษตรของคุณ</p>
              </div>
            </div>
            <button 
              onClick={handleGetAdvice}
              disabled={isLoadingAdvice || farm.areaSqm <= 0}
              className={`px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-xl ${
                isLoadingAdvice || farm.areaSqm <= 0 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:-translate-y-1'
              }`}
            >
              {isLoadingAdvice ? 'กำลังประมวลผล...' : 'เริ่มการวิเคราะห์'}
            </button>
          </div>

          {aiAdvice ? (
            <div className="grid md:grid-cols-3 gap-6 relative z-10">
              <div className="md:col-span-2 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">ตารางการให้น้ำ</p>
                    <p className="text-slate-700 font-bold leading-relaxed">{aiAdvice.dailyWaterNeeds}</p>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">เวลาที่เหมาะสมที่สุด</p>
                    <p className="text-slate-700 font-bold leading-relaxed">{aiAdvice.bestTiming}</p>
                  </div>
                </div>
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase mb-2">กลยุทธ์ประหยัดน้ำ (Automation Tips)</p>
                  <p className="text-slate-700 text-sm leading-relaxed font-medium">{aiAdvice.automationTips}</p>
                </div>
              </div>
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 h-full">
                <p className="text-[10px] font-bold text-amber-600 uppercase mb-3">ข้อควรระวังสำคัญ</p>
                <ul className="space-y-3">
                  {aiAdvice.precautions.map((p: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700 font-medium">
                      <span className="text-amber-500">•</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
              <div className="mb-4 scale-150 text-slate-300"><Icons.Map /></div>
              <p className="text-slate-500 font-bold max-w-xs leading-relaxed">
                {farm.areaSqm > 0 
                  ? 'พร้อมวิเคราะห์! กดปุ่มเริ่มการวิเคราะห์เพื่อรับคำแนะนำรายพืชและรายดิน' 
                  : 'กรุณาวาดขอบเขตแปลงเกษตรบนแผนที่เพื่อเริ่มใช้งาน'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
