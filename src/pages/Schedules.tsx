import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, User, ChevronLeft, ChevronRight, MapPin, Search, Sparkles, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface Schedule {
  id: string;
  ministry_name: string;
  member_name: string;
  event_date: string;
  description: string;
}

export const Schedules: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .order('event_date', { ascending: true });

    if (!error) setSchedules(data || []);
    setLoading(false);
  };

  const weekDays = [...Array(7)].map((_, i) => addDays(startOfWeek(selectedDate, { weekStartsOn: 0 }), i));

  const filteredSchedules = schedules.filter(s => 
    isSameDay(new Date(s.event_date + 'T12:00:00'), selectedDate)
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-10">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-10 bg-[#df982a] rounded-full shadow-[0_0_15px_#df982a]"></div>
          <span className="text-[10px] font-black text-[#df982a] uppercase tracking-[0.4em]">Agenda</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-4xl font-black text-white tracking-tighter leading-none uppercase">Escalas</h2>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Servindo com amor na Vila</p>
          </div>
          <div className="flex items-center bg-slate-900 rounded-3xl p-1.5 border border-white/5 shadow-2xl">
            <button 
              onClick={() => setSelectedDate(addDays(selectedDate, -7))}
              className="p-3 hover:bg-white/5 rounded-[1.25rem] transition-all active:scale-90 text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setSelectedDate(addDays(selectedDate, 7))}
              className="p-3 hover:bg-white/5 rounded-[1.25rem] transition-all active:scale-90 text-slate-400 hover:text-white"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Week Selector */}
      <div className="bg-slate-900/40 backdrop-blur-xl p-4 rounded-[3rem] shadow-2xl border border-white/5 flex justify-between overflow-x-auto no-scrollbar gap-2">
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          return (
            <button
              key={day.toString()}
              onClick={() => setSelectedDate(day)}
              className={clsx(
                "flex flex-col items-center min-w-[58px] py-6 rounded-[1.8rem] transition-all duration-500",
                isSelected 
                  ? "bg-[#df982a] text-slate-950 shadow-[0_15px_30px_rgba(223,152,42,0.3)] scale-105" 
                  : "text-slate-500 hover:bg-white/5 hover:text-slate-300 active:scale-95"
              )}
            >
              <span className={clsx(
                "text-[10px] uppercase font-black tracking-widest mb-1.5",
                isSelected ? "text-slate-950/60" : "text-slate-700"
              )}>
                {format(day, 'eee', { locale: ptBR })}
              </span>
              <span className="text-2xl font-black">{format(day, 'd')}</span>
            </button>
          );
        })}
      </div>

      {/* Daily List */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center border border-white/5 shadow-lg">
              <CalendarIcon className="w-5 h-5 text-[#df982a]" />
            </div>
            <span className="text-sm font-black text-white uppercase tracking-widest">{format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</span>
          </div>
          <button className="text-[10px] font-black text-[#df982a] uppercase tracking-widest hover:underline opacity-60 hover:opacity-100 transition-opacity">
            Mês Inteiro
          </button>
        </div>

        {loading ? (
          <div className="grid gap-6">
            {[1, 2].map(i => (
              <div key={i} className="h-32 bg-slate-900/50 border border-white/5 rounded-[2.5rem] animate-pulse" />
            ))}
          </div>
        ) : filteredSchedules.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 bg-slate-900/30 border-2 border-dashed border-white/5 rounded-[3rem] shadow-2xl"
          >
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Search className="w-8 h-8 text-slate-800" />
            </div>
            <p className="text-slate-500 font-black uppercase tracking-widest text-sm">Nenhuma escala hoje</p>
            <p className="text-slate-700 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Tente outra data acima</p>
          </motion.div>
        ) : (
          <div className="grid gap-6">
            <AnimatePresence>
              {filteredSchedules.map((schedule, index) => (
                <motion.div 
                  key={schedule.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-slate-900/40 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/5 shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 flex items-center gap-6 active:scale-[0.98]"
                >
                  <div className="w-16 h-16 rounded-[1.5rem] bg-slate-950 border border-white/5 flex items-center justify-center text-[#df982a] group-hover:scale-110 transition-transform duration-500 shadow-2xl group-hover:border-[#df982a]/30">
                    <User className="w-8 h-8" />
                  </div>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className="text-[10px] font-black uppercase text-[#df982a] tracking-[0.2em] whitespace-nowrap">{schedule.ministry_name}</span>
                      <div className="w-1.5 h-1.5 bg-slate-800 rounded-full flex-shrink-0" />
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5 truncate">
                        <MapPin className="w-3 h-3 text-[#df982a]" /> SÉ
                      </span>
                    </div>
                    <p className="text-2xl font-black text-white leading-none uppercase tracking-tighter truncate">{schedule.member_name}</p>
                    {schedule.description && (
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wide truncate">{schedule.description}</p>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-700 group-hover:text-white transition-all border border-white/5">
                    <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="p-8 bg-gradient-to-br from-slate-900 to-slate-950 rounded-[3rem] text-white space-y-6 shadow-2xl border border-white/5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Sparkles className="w-24 h-24 text-[#df982a]" />
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
            <Sparkles className="w-6 h-6 text-[#df982a]" />
          </div>
          <div className="space-y-1">
            <h4 className="font-black tracking-[0.2em] leading-none uppercase text-xs text-[#df982a]">Aviso de Serviço</h4>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Compromisso com a Vila</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.1em] leading-relaxed relative z-10">
          Caso não possa comparecer no dia escalado, favor avisar sua liderança com antecedência mínima de <span className="text-white">48 horas</span>.
        </p>
      </motion.div>
    </div>
  );
};
