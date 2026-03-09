import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import './index.css'

const API_URL = 'http://localhost:8000/api'

const COLORS = ['#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6']

function App() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [connected, setConnected] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)
  
  const [stats, setStats] = useState({
    total_predictions: 0,
    average_confidence: 0,
    predictions: [],
    confidence_distribution: []
  })
  
  const [recentPredictions, setRecentPredictions] = useState([])

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (modelLoaded) {
      fetchStats()
    }
  }, [prediction, modelLoaded])

  const checkHealth = async () => {
    try {
      const res = await axios.get(`${API_URL}/health`)
      setConnected(true)
      setModelLoaded(res.data.model_loaded)
    } catch {
      setConnected(false)
      setModelLoaded(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/stats`)
      setStats(res.data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0]
    if (file) {
      setImage(file)
      setPreview(URL.createObjectURL(file))
      setPrediction(null)
      setError(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp']
    },
    maxFiles: 1,
    noClick: !!preview
  })

  const handlePredict = async () => {
    if (!image || !modelLoaded) return
    
    const startTime = performance.now()
    setLoading(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('file', image)
      
      const res = await axios.post(`${API_URL}/predict`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      const endTime = performance.now()
      const processingTime = (endTime - startTime).toFixed(0)
      
      setPrediction({
        ...res.data.prediction,
        processing_time: processingTime
      })
      
      setRecentPredictions(prev => [{
        ...res.data.prediction,
        timestamp: new Date().toLocaleTimeString(),
        processing_time: processingTime
      }, ...prev.slice(0, 9)])
      
      await fetchStats()
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Prediction failed')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setImage(null)
    setPreview(null)
    setPrediction(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-600/10 animate-pulse" />
      </div>

      <div className="relative z-10 p-4 md:p-8">
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                AI Vision Dashboard
              </h1>
              <p className="text-sm text-slate-500">Real-time Computer Vision Analytics</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-800">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span className="text-sm text-slate-400">{connected ? 'Live' : 'Offline'}</span>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm border ${
              modelLoaded 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              {modelLoaded ? 'Model Ready' : 'Loading...'}
            </div>
          </div>
        </motion.header>

        <main className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card rounded-2xl p-6 border border-slate-800 bg-slate-900/50 backdrop-blur-xl"
            >
              <h2 className="text-lg font-semibold text-slate-200 mb-4">Upload Image</h2>

              <div
                {...getRootProps()}
                onClick={!preview ? open : undefined}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                  isDragActive 
                    ? 'border-cyan-400 bg-cyan-400/10 scale-[1.02]' 
                    : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/30'
                }`}
              >
                <input {...getInputProps()} />
                
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg object-contain" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                      <p className="text-white font-medium">Click to change image</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-8">
                    <svg className="w-12 h-12 mx-auto text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-slate-400 mb-2">
                      {isDragActive ? 'Drop your image here' : 'Drag & drop an image, or click to browse'}
                    </p>
                    <p className="text-xs text-slate-500">Supports PNG, JPG, JPEG, WebP, GIF</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handlePredict}
                  disabled={!image || loading || !modelLoaded}
                  className="flex-1 py-3 px-6 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/25"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Analyzing...
                    </span>
                  ) : 'Analyze Image'}
                </button>
                
                {image && (
                  <button
                    onClick={handleClear}
                    className="py-3 px-6 rounded-xl font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all border border-slate-700"
                  >
                    Clear
                  </button>
                )}
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <AnimatePresence>
              {prediction && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="glass-card rounded-2xl p-6 border border-slate-800 bg-slate-900/50 backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-slate-200">Prediction Result</h2>
                    {prediction.processing_time && (
                      <span className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
                        Processed in {prediction.processing_time}ms
                      </span>
                    )}
                  </div>

                  <div className="text-center mb-8">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30 mb-4"
                    >
                      <span className="text-cyan-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      <span className="text-sm text-cyan-300">
                        Confidence: {Math.round(prediction.confidence * 100)}%
                      </span>
                    </motion.div>
                    
                    <h3 className="text-4xl font-bold text-white capitalize mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                      {prediction.label?.replace(/_/g, ' ')}
                    </h3>
                    
                    <div className="w-full max-w-md mx-auto h-4 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${prediction.confidence * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 rounded-full shadow-lg shadow-cyan-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Top Predictions</p>
                    {prediction.top_predictions?.map((pred, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center gap-4"
                      >
                        <span className="text-xs font-mono text-slate-500 w-6">#{idx + 1}</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-300 capitalize">{pred.label?.replace(/_/g, ' ')}</span>
                            <span className={`font-mono font-bold ${
                              pred.confidence >= 0.7 ? 'text-emerald-400' : 
                              pred.confidence >= 0.4 ? 'text-amber-400' : 'text-slate-400'
                            }`}>
                              {Math.round(pred.confidence * 100)}%
                            </span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${pred.confidence * 100}%` }}
                              transition={{ duration: 0.8, delay: idx * 0.1 }}
                              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                              style={{ opacity: 1 - idx * 0.2 }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="glass-card rounded-xl p-4 border border-slate-800 bg-slate-900/50 backdrop-blur-xl"
              >
                <p className="text-3xl font-bold text-white">{stats.total_predictions}</p>
                <p className="text-sm text-slate-400 mt-1">Total Predictions</p>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="glass-card rounded-xl p-4 border border-slate-800 bg-slate-900/50 backdrop-blur-xl"
              >
                <p className="text-3xl font-bold text-white">{Math.round(stats.average_confidence * 100)}%</p>
                <p className="text-sm text-slate-400 mt-1">Avg Confidence</p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card rounded-2xl p-6 border border-slate-800 bg-slate-900/50 backdrop-blur-xl"
            >
              <h2 className="text-lg font-semibold text-slate-200 mb-4">Confidence Distribution</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.confidence_distribution || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="range" stroke="#475569" fontSize={11} />
                    <YAxis stroke="#475569" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        border: '1px solid #1e293b',
                        borderRadius: '8px',
                        color: '#f8fafc'
                      }}
                      cursor={{ fill: '#1e293b' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {(stats.confidence_distribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card rounded-2xl p-6 border border-slate-800 bg-slate-900/50 backdrop-blur-xl"
            >
              <h2 className="text-lg font-semibold text-slate-200 mb-4">Recent Predictions</h2>
              
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                <AnimatePresence>
                  {(recentPredictions.length > 0 ? recentPredictions : (stats.predictions || []).slice().reverse()).map((pred, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700/50"
                    >
                      <div className="flex flex-col">
                        <span className="text-slate-300 text-sm capitalize font-medium">
                          {pred.class?.replace(/_/g, ' ') || pred.label?.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-slate-500">{pred.timestamp}</span>
                      </div>
                      <span className={`text-sm font-mono font-bold ${
                        pred.confidence >= 0.8 ? 'text-emerald-400' : 
                        pred.confidence >= 0.5 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {Math.round(pred.confidence * 100)}%
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {(recentPredictions.length === 0 && (!stats.predictions || stats.predictions.length === 0)) && (
                  <p className="text-slate-500 text-sm text-center py-4">No predictions yet</p>
                )}
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
