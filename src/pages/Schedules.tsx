import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, User, ChevronLeft, ChevronRight, MapPin, Search, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="h-1 w-8 bg-[#df982a] rounded-full"></div>
          <span className="text-[10px] font-black text-[#df982a] uppercase tracking-[0.3em]">Agenda</span>
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Escalas de Serviço</h2>
          <div className="flex items-center bg-white rounded-full p-1 border border-slate-100 shadow-sm">
            <button 
              onClick={() => setSelectedDate(addDays(selectedDate, -7))}
              className="p-1.5 hover:bg-slate-50 rounded-full transition active:scale-90"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button 
              onClick={() => setSelectedDate(addDays(selectedDate, 7))}
              className="p-1.5 hover:bg-slate-50 rounded-full transition active:scale-90"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Week Selector */}
      <div className="bg-white/80 backdrop-blur-md p-3 rounded-[2rem] shadow-sm border border-slate-100 flex justify-between overflow-x-auto no-scrollbar">
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          return (
            <button
              key={day.toString()}
              onClick={() => setSelectedDate(day)}
              className={clsx(
                "flex flex-col items-center min-w-[50px] py-4 rounded-[1.5rem] transition-all duration-300",
                isSelected 
                  ? "bg-[#df982a] text-white shadow-xl shadow-orange-100 scale-105" 
                  : "text-slate-400 hover:bg-slate-50 active:scale-95"
              )}
            >
              <span className={clsx(
                "text-[9px] uppercase font-black tracking-widest mb-1",
                isSelected ? "text-orange-100" : "text-slate-300"
              )}>
                {format(day, 'eee', { locale: ptBR })}
              </span>
              <span className="text-lg font-black">{format(day, 'd')}</span>
            </button>
          );
        })}
      </div>

      {/* Daily List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
            <CalendarIcon className="w-3.5 h-3.5 text-[#df982a]" />
            <span>{format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</span>
          </div>
          <button className="text-[10px] font-black text-[#df982a] uppercase tracking-widest hover:underline">
            Ver Mês Inteiro
          </button>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[1, 2].map(i => (
              <div key={i} className="h-28 bg-white border border-slate-100 rounded-[2rem] animate-pulse" />
            ))}
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white border-2 border-dashed border-slate-100 rounded-[2.5rem]">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-slate-200" />
            </div>
            <p className="text-slate-400 font-bold text-sm">Nenhuma escala para este dia</p>
            <p className="text-slate-300 text-xs">Selecione outra data acima.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredSchedules.map((schedule) => (
              <div key={schedule.id} className="group bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 active:scale-[0.98]">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-[#df982a] group-hover:scale-110 transition-transform duration-500 shadow-inner">
                  <User className="w-7 h-7" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-[#df982a] tracking-widest">{schedule.ministry_name}</span>
                    <div className="h-1 w-1 bg-slate-200 rounded-full" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" /> Templo SÉ
                    </span>
                  </div>
                  <p className="text-xl font-black text-slate-900 leading-none">{schedule.member_name}</p>
                  {schedule.description && (
                    <p className="text-xs text-slate-500 font-medium line-clamp-1">{schedule.description}</p>
                  )}
                </div>
                <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 hover:text-[#df982a] transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-900 rounded-[2.5rem] text-white space-y-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-orange-300" />
          </div>
          <div>
            <h4 className="font-black tracking-tight leading-none uppercase text-sm">Aviso de Serviço</h4>
            <p className="text-[10px] font-medium text-slate-400">@AIGREJADAVILA</p>
          </div>
        </div>
        <p className="text-sm text-slate-300 font-medium">
          Caso não possa comparecer no dia escalado, favor avisar sua liderança com antecedência mínima de 48 horas.
        </p>
      </div>
    </div>
  );
};
