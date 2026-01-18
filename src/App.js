import React, { useState, useEffect } from 'react';
import { Check, Edit, BarChart3, Calendar, X, Trash2, Plus, FileText, Home } from 'lucide-react';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [completionData, setCompletionData] = useState({});
  const [currentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('home'); // 'home', 'activity', 'edit'
  const [editingId, setEditingId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDateDetails, setShowDateDetails] = useState(false);
  const [editModeInput, setEditModeInput] = useState('');
  const [editInputValue, setEditInputValue] = useState('');
  const [animatingTodos, setAnimatingTodos] = useState(new Set());
  const [deletingTodos, setDeletingTodos] = useState(new Set());
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [currentNotesTodo, setCurrentNotesTodo] = useState(null);
  const [notesInput, setNotesInput] = useState('');

  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    const savedCompletion = localStorage.getItem('completion-data');
    if (savedTodos) setTodos(JSON.parse(savedTodos));
    if (savedCompletion) setCompletionData(JSON.parse(savedCompletion));
  }, []);

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
    localStorage.setItem('completion-data', JSON.stringify(completionData));
  }, [todos, completionData]);

  const getDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const toggleTodo = (id) => {
    setAnimatingTodos(p => new Set(p).add(id));
    setTimeout(() => setAnimatingTodos(p => { const n = new Set(p); n.delete(id); return n; }), 300);
    const todo = todos.find(t => t.id === id);
    if (todo) {
      setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
      const dk = getDateKey(currentDate);
      const cc = completionData[dk] || 0;
      setCompletionData({ ...completionData, [dk]: todo.completed ? Math.max(0, cc - 1) : cc + 1 });
    }
  };

  const deleteTodo = (id) => {
    setDeletingTodos(p => new Set(p).add(id));
    setTimeout(() => {
      const todo = todos.find(t => t.id === id);
      if (todo?.completed) {
        const dk = getDateKey(currentDate);
        setCompletionData({ ...completionData, [dk]: Math.max(0, (completionData[dk] || 0) - 1) });
      }
      setTodos(todos.filter(t => t.id !== id));
      setDeletingTodos(p => { const n = new Set(p); n.delete(id); return n; });
    }, 300);
  };

  const startEdit = (id) => {
    const todo = todos.find(t => t.id === id);
    if (todo) { setEditInputValue(todo.text); setEditingId(id); }
  };

  const saveEdit = (id) => {
    if (editInputValue.trim()) {
      setTodos(todos.map(t => t.id === id ? { ...t, text: editInputValue.trim() } : t));
      setEditingId(null); setEditInputValue('');
    }
  };

  const cancelEdit = () => { setEditingId(null); setEditInputValue(''); };

  const addTaskInEditMode = () => {
    if (editModeInput.trim()) {
      setTodos([...todos, { id: Date.now(), text: editModeInput.trim(), completed: false, createdAt: getDateKey(currentDate), notes: '' }]);
      setEditModeInput('');
    }
  };

  const openNotesModal = (todo, e) => {
    if (e) e.stopPropagation();
    setCurrentNotesTodo(todo);
    setNotesInput(todo.notes || '');
    setShowNotesModal(true);
  };

  const saveNotes = () => {
    if (currentNotesTodo) {
      setTodos(todos.map(t => t.id === currentNotesTodo.id ? { ...t, notes: notesInput } : t));
      setShowNotesModal(false);
      setCurrentNotesTodo(null);
      setNotesInput('');
    }
  };

  const closeNotesModal = () => {
    setShowNotesModal(false);
    setCurrentNotesTodo(null);
    setNotesInput('');
  };

  const generateYearlyGrid = () => {
    const weeks = [], today = new Date(currentDate), start = new Date(today);
    start.setDate(start.getDate() - 364 - start.getDay());
    let week = [], d = new Date(start);
    for (let i = 0; i < 371; i++) {
      const dk = getDateKey(d), c = completionData[dk] || 0;
      const cd = new Date(d); cd.setHours(0,0,0,0);
      const td = new Date(currentDate); td.setHours(0,0,0,0);
      week.push({ date: new Date(d), count: c, dateKey: dk, isPastToday: cd > td });
      if (week.length === 7) { weeks.push(week); week = []; }
      d.setDate(d.getDate() + 1);
    }
    if (week.length) weeks.push(week);
    return weeks;
  };

  const getColor = (c, p) => {
    if (p) return 'bg-gray-100 border border-gray-200';
    if (c === 0) return 'bg-gray-200 hover:bg-gray-300';
    if (c === 1) return 'bg-green-300 hover:bg-green-400';
    if (c === 2) return 'bg-green-400 hover:bg-green-500';
    if (c === 3) return 'bg-green-500 hover:bg-green-600';
    if (c === 4) return 'bg-green-600 hover:bg-green-700';
    return 'bg-green-700 hover:bg-green-800';
  };

  const todaysTodos = todos.filter(t => t.createdAt === getDateKey(currentDate));
  const completedToday = todaysTodos.filter(t => t.completed).length;
  const grid = generateYearlyGrid();
  const days = ['S','M','T','W','T','F','S'];
  const selTasks = selectedDate ? todos.filter(t => t.createdAt === selectedDate) : [];
  const completedTasks = selTasks.filter(t => t.completed);
  const pendingTasks = selTasks.filter(t => !t.completed);
  const total = todos.length, done = todos.filter(t => t.completed).length;
  const rate = total > 0 ? Math.round((done / total) * 100) : 0;
  const progressPercentage = todaysTodos.length > 0 ? (completedToday / todaysTodos.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-indigo-100">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Todo Tracker</h1>
              <p className="text-sm text-gray-500 mt-1">Stay productive, track your progress</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setCurrentView('home')} className={`px-4 py-2.5 ${currentView === 'home' ? 'bg-gradient-to-r from-indigo-500 to-blue-500' : 'bg-gray-200 text-gray-700'} text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all text-sm font-medium flex items-center gap-2`}>
                <Home size={18}/>Home
              </button>
              <button onClick={() => setCurrentView('edit')} className={`px-4 py-2.5 ${currentView === 'edit' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-200 text-gray-700'} text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all text-sm font-medium flex items-center gap-2`}>
                <Edit size={18}/>Edit
              </button>
              <button onClick={() => setCurrentView('activity')} className={`px-4 py-2.5 ${currentView === 'activity' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gray-200 text-gray-700'} text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all text-sm font-medium flex items-center gap-2`}>
                <BarChart3 size={18}/>Activity
              </button>
            </div>
          </div>
        </div>

        {showDateDetails && selectedDate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setShowDateDetails(false); setSelectedDate(null); }}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{new Date(selectedDate+'T00:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</h3>
                  <p className="text-sm text-gray-500 mt-1">{completedTasks.length} completed • {pendingTasks.length} pending</p>
                </div>
                <button onClick={() => { setShowDateDetails(false); setSelectedDate(null); }} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"><X size={24}/></button>
              </div>
              
              {selTasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center"><Calendar size={40} className="text-gray-400"/></div>
                  <p className="text-gray-500">No tasks for this day</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {completedTasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                        <Check size={16} className="text-green-600"/>
                        Completed Tasks ({completedTasks.length})
                      </h4>
                      <div className="space-y-2">
                        {completedTasks.map(t => (
                          <div key={t.id} className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 border-2 border-green-500 flex items-center justify-center">
                                <Check size={14} className="text-white"/>
                              </div>
                              <span className="flex-1 text-sm line-through text-gray-600">{t.text}</span>
                              <button onClick={(e) => openNotesModal(t, e)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors">
                                <FileText size={14}/>
                                {t.notes ? 'View Notes' : 'Add Notes'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {pendingTasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-yellow-700 mb-3 flex items-center gap-2">
                        <Calendar size={16} className="text-yellow-600"/>
                        Pending Tasks ({pendingTasks.length})
                      </h4>
                      <div className="space-y-2">
                        {pendingTasks.map(t => (
                          <div key={t.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300"></div>
                              <span className="flex-1 text-sm text-gray-800 font-medium">{t.text}</span>
                              <button onClick={(e) => openNotesModal(t, e)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors">
                                <FileText size={14}/>
                                {t.notes ? 'View Notes' : 'Add Notes'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {showNotesModal && currentNotesTodo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeNotesModal}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center"><FileText size={20} className="text-indigo-600"/></div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Task Notes</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{currentNotesTodo.text}</p>
                  </div>
                </div>
                <button onClick={closeNotesModal} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"><X size={24}/></button>
              </div>
              <textarea value={notesInput} onChange={e => setNotesInput(e.target.value)} placeholder="Add notes about this task..." className="w-full h-64 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm" autoFocus/>
              <div className="flex gap-3 mt-4">
                <button onClick={saveNotes} className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all font-medium">Save Notes</button>
                <button onClick={closeNotesModal} className="px-6 py-3 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl transition-all font-medium">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {currentView === 'home' && (
          <>
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-indigo-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Today's Progress</h2>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-600">Tasks Completed Today</p>
                    <p className="text-3xl font-bold text-indigo-900">{completedToday} / {todaysTodos.length}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold text-indigo-600">{Math.round(progressPercentage)}%</p>
                    <p className="text-sm text-gray-600">Complete</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-4 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-indigo-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Today's Tasks</h2>
                <span className="text-sm text-gray-500">{currentDate.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</span>
              </div>
              {todaysTodos.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center"><Calendar size={48} className="text-indigo-400"/></div>
                  <p className="text-gray-600 text-lg mb-2">No tasks for today</p>
                  <p className="text-gray-500 text-sm">Click "Edit" to add some tasks!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaysTodos.map(t => (
                    <div key={t.id} className={`flex items-center justify-between gap-4 p-4 rounded-xl transition-all border-2 ${animatingTodos.has(t.id) ? 'scale-105' : 'scale-100'} ${t.completed ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:border-indigo-300 hover:shadow-md'}`}>
                      <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => toggleTodo(t.id)}>
                        <button className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${t.completed ? 'bg-green-500 border-green-500 shadow-lg shadow-green-200' : 'border-gray-300 hover:border-indigo-500 hover:bg-indigo-50'}`}>
                          {t.completed && <Check size={16} className="text-white"/>}
                        </button>
                        <span className={`flex-1 text-base transition-all ${t.completed ? 'line-through text-gray-500' : 'text-gray-800 font-medium'}`}>{t.text}</span>
                      </div>
                      <button onClick={(e) => openNotesModal(t, e)} className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors flex-shrink-0">
                        <FileText size={14}/>
                        {t.notes ? 'Notes' : 'Add Note'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {currentView === 'activity' && (
          <>
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-indigo-100">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-600 mb-1"><Calendar size={18}/><span className="text-xs font-medium">Today</span></div>
                  <p className="text-2xl font-bold text-blue-900">{completedToday}/{todaysTodos.length}</p>
                  <p className="text-xs text-blue-700 mt-1">Tasks completed</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-2 text-purple-600 mb-1"><BarChart3 size={18}/><span className="text-xs font-medium">Overall</span></div>
                  <p className="text-2xl font-bold text-purple-900">{rate}%</p>
                  <p className="text-xs text-purple-700 mt-1">Completion rate</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                  <div className="flex items-center gap-2 text-green-600 mb-1"><Check size={18}/><span className="text-xs font-medium">Total</span></div>
                  <p className="text-2xl font-bold text-green-900">{done}</p>
                  <p className="text-xs text-green-700 mt-1">Tasks completed</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 overflow-x-auto border border-indigo-100">
              <div className="mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Year Activity</h2>
                <p className="text-sm text-gray-600 mt-1">Last 365 days • Click any day for details</p>
              </div>
              <div className="flex gap-1 pb-2">
                <div className="flex flex-col gap-1 pr-2">
                  <div className="h-4"></div>
                  {days.map((d,i) => <div key={i} className="h-4 text-xs text-gray-500 leading-4 font-medium">{i%2===1?d:''}</div>)}
                </div>
                <div className="flex gap-1">
                  {grid.map((w,wi) => (
                    <div key={wi} className="flex flex-col gap-1">
                      {w.map((d,di) => {
                        const isT = d.dateKey === getDateKey(currentDate);
                        return <div key={di} onClick={() => { setSelectedDate(d.dateKey); setShowDateDetails(true); }} className={`w-4 h-4 rounded-md ${getColor(d.count, d.isPastToday)} ${isT ? 'ring-2 ring-indigo-500 ring-offset-1' : ''} transition-all cursor-pointer transform hover:scale-125 hover:shadow-md`} title={`${d.dateKey}: ${d.count} tasks`}/>;
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-6 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                <span className="font-medium">Less</span>
                <div className="flex gap-1.5">
                  {['bg-gray-200','bg-green-300','bg-green-400','bg-green-500','bg-green-600','bg-green-700'].map((c,i) => <div key={i} className={`w-4 h-4 ${c} rounded-md`}/>)}
                </div>
                <span className="font-medium">More</span>
              </div>
            </div>
          </>
        )}

        {currentView === 'edit' && (
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-purple-300">
            <div className="flex items-center gap-2 mb-4">
              <Edit className="text-purple-600" size={24}/>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Edit Mode</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
              <input type="text" value={editModeInput} onChange={e => setEditModeInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && addTaskInEditMode()} placeholder="Add a new task..." className="flex-1 px-4 py-3 border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"/>
              <button onClick={addTaskInEditMode} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all font-medium text-sm flex items-center gap-2"><Plus size={18}/>Add Task</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700 text-lg">Today's Tasks</h3>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">{todaysTodos.length} {todaysTodos.length===1?'task':'tasks'}</span>
              </div>
              {todaysTodos.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="w-20 h-20 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center"><Plus size={40} className="text-purple-400"/></div>
                  <p className="text-gray-500">No tasks yet. Add one above!</p>
                </div>
              ) : (
                todaysTodos.map(t => (
                  <div key={t.id} className={`flex flex-col gap-3 p-4 bg-white border-2 rounded-xl transition-all ${deletingTodos.has(t.id) ? 'opacity-0 scale-95' : 'opacity-100 border-gray-200 hover:border-purple-300 hover:shadow-md'}`}>
                    {editingId === t.id ? (
                      <>
                        <input type="text" value={editInputValue} onChange={e => setEditInputValue(e.target.value)} onKeyPress={e => { if(e.key==='Enter')saveEdit(t.id); if(e.key==='Escape')cancelEdit(); }} className="flex-1 px-4 py-2 border-2 border-purple-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400" autoFocus/>
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(t.id)} className="flex-1 px-4 py-2 text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg rounded-lg transition-all font-medium text-sm">Save</button>
                          <button onClick={cancelEdit} className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-all font-medium text-sm">Cancel</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${t.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>{t.completed && <Check size={12} className="text-white"/>}</div>
                          <span className={`flex-1 font-medium ${t.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.text}</span>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${t.completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.completed ? 'Done' : 'Pending'}</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => startEdit(t.id)} className="flex-1 sm:flex-initial px-4 py-2 text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg rounded-lg transition-all font-medium text-sm flex items-center gap-1"><Edit size={14}/>Rename</button>
                          <button onClick={() => deleteTodo(t.id)} className="flex-1 sm:flex-initial px-4 py-2 text-white bg-gradient-to-r from-red-500 to-pink-500 hover:shadow-lg rounded-lg transition-all font-medium text-sm flex items-center gap-1"><Trash2 size={14}/>Delete</button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}