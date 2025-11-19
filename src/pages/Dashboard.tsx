import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, Users, Bike } from 'lucide-react';

export default function Dashboard() {
  const [filterType, setFilterType] = useState<'day' | 'month' | 'year'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [qualifiedRate, setQualifiedRate] = useState(0);
  const [leadsByDay, setLeadsByDay] = useState<any[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [filterType, selectedDate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    try {
      // Calculate date range based on filter
      let startDate: Date;
      let endDate: Date;

      if (filterType === 'month') {
        startDate = startOfMonth(selectedDate);
        endDate = endOfMonth(selectedDate);
      } else if (filterType === 'year') {
        startDate = startOfYear(selectedDate);
        endDate = endOfYear(selectedDate);
      } else {
        startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
      }

      // Fetch contacts
      const { data: contacts } = await supabase
        .from('Gestao de contatos')
        .select('*')
        .gte('criado_em', startDate.toISOString())
        .lte('criado_em', endDate.toISOString());

      // Calculate qualified rate
      if (contacts && contacts.length > 0) {
        const qualified = contacts.filter(c => c.intenção === 'Qualificado').length;
        setQualifiedRate(Math.round((qualified / contacts.length) * 100));
      } else {
        setQualifiedRate(0);
      }

      // Calculate leads by day (last 7 days)
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const { data: dayContacts } = await supabase
          .from('Gestao de contatos')
          .select('*')
          .gte('criado_em', dayStart.toISOString())
          .lte('criado_em', dayEnd.toISOString());

        last7Days.push({
          date: format(date, 'dd/MM', { locale: ptBR }),
          leads: dayContacts?.length || 0,
        });
      }
      setLeadsByDay(last7Days);

      // Fetch sales (bikes with status "Vendida")
      const { data: bikes } = await supabase
        .from('Catálogo_bikes')
        .select('*')
        .eq('status', 'Vendida');
      
      setTotalSales(bikes?.length || 0);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Por Dia</SelectItem>
              <SelectItem value="month">Por Mês</SelectItem>
              <SelectItem value="year">Por Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Qualified Rate Card */}
        <Card className="border-success/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Leads Qualificados
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{qualifiedRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Leads que chegaram em "Qualificado"
            </p>
          </CardContent>
        </Card>

        {/* Leads by Day Chart Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-chart-1" />
              Leads por Dia (Últimos 7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={leadsByDay}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="leads" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Total Sales Card */}
        <Card className="border-chart-3/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Vendas Realizadas
            </CardTitle>
            <Bike className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-3">{totalSales}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Bikes vendidas no total
            </p>
          </CardContent>
        </Card>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}
