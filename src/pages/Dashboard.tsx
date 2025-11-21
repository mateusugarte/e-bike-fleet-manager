import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, Users, Bike, Phone, Target, CheckCircle2 } from 'lucide-react';

const STAGE_COLORS = {
  'Contato Inicial': 'hsl(var(--chart-1))',
  'Envio do Catálogo': 'hsl(var(--chart-2))',
  'Perguntas': 'hsl(var(--chart-3))',
  'Qualificado': 'hsl(var(--chart-4))',
};

export default function Dashboard() {
  const [filterType, setFilterType] = useState<'day' | 'month' | 'year'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [qualifiedRate, setQualifiedRate] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [leadsByDay, setLeadsByDay] = useState<any[]>([]);
  const [leadsByStage, setLeadsByStage] = useState<any[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalContacts, setTotalContacts] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [avgTicket, setAvgTicket] = useState(0);
  const [salesConversionRate, setSalesConversionRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [filterType, selectedDate]);

  const parseCustomDate = (dateString: string): Date | null => {
    try {
      // Handle dd-mm-yyyy format
      if (dateString.includes('-') && dateString.length === 10) {
        const [day, month, year] = dateString.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
      return new Date(dateString);
    } catch {
      return null;
    }
  };

  const isDateInRange = (dateString: string, startDate: Date, endDate: Date): boolean => {
    const date = parseCustomDate(dateString);
    if (!date) return false;
    return date >= startDate && date <= endDate;
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    
    try {
      // Fetch all contacts
      const { data: allContacts } = await supabase
        .from('Gestao de contatos')
        .select('*')
        .order('criado_em', { ascending: false });

      if (!allContacts) {
        setLoading(false);
        return;
      }

      // Calculate date range based on filter
      let startDate: Date;
      let endDate: Date;

      const now = new Date();
      if (filterType === 'month') {
        startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);
      } else if (filterType === 'year') {
        startDate = new Date(selectedDate.getFullYear(), 0, 1);
        endDate = new Date(selectedDate.getFullYear(), 11, 31, 23, 59, 59);
      } else {
        startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
      }

      // Filter contacts by date range
      const filteredContacts = allContacts.filter(c => 
        isDateInRange(c.criado_em, startDate, endDate)
      );

      setTotalLeads(filteredContacts.length);
      setTotalContacts(allContacts.length);

      // Calculate qualified rate
      if (filteredContacts.length > 0) {
        const qualified = filteredContacts.filter(c => c.intenção === 'Qualificado').length;
        setQualifiedRate(Math.round((qualified / filteredContacts.length) * 100));
        
        // Calculate conversion rate (from initial contact to qualified)
        const initialContacts = filteredContacts.filter(c => c.intenção === 'Contato Inicial').length;
        if (initialContacts > 0) {
          setConversionRate(Math.round((qualified / initialContacts) * 100));
        } else {
          setConversionRate(qualified > 0 ? 100 : 0);
        }
      } else {
        setQualifiedRate(0);
        setConversionRate(0);
      }

      // Calculate leads by stage
      const stageData = [
        { name: 'Contato Inicial', value: 0, color: STAGE_COLORS['Contato Inicial'] },
        { name: 'Envio do Catálogo', value: 0, color: STAGE_COLORS['Envio do Catálogo'] },
        { name: 'Perguntas', value: 0, color: STAGE_COLORS['Perguntas'] },
        { name: 'Qualificado', value: 0, color: STAGE_COLORS['Qualificado'] },
      ];

      filteredContacts.forEach(contact => {
        const stage = stageData.find(s => s.name === contact.intenção);
        if (stage) stage.value++;
      });

      setLeadsByStage(stageData.filter(s => s.value > 0));

      // Calculate leads by day (last 7 days)
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStr = format(date, 'dd-MM-yyyy');
        
        const dayContacts = allContacts.filter(c => c.criado_em === dayStr);

        last7Days.push({
          date: format(date, 'dd/MM', { locale: ptBR }),
          leads: dayContacts.length,
        });
      }
      setLeadsByDay(last7Days);

      // Fetch sales from vendas table
      const { data: allSales } = await supabase
        .from('vendas')
        .select('*')
        .order('created_at', { ascending: false });

      if (allSales) {
        // Filter sales by date range
        const filteredSales = allSales.filter(sale => 
          isDateInRange(sale.data_venda, startDate, endDate)
        );
        
        setTotalSales(filteredSales.length);

        // Calculate revenue
        const revenue = filteredSales.reduce((acc, sale) => {
          const valor = parseFloat(sale.valor_final.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
          return acc + valor;
        }, 0);
        setTotalRevenue(revenue);

        // Calculate average ticket
        const ticket = filteredSales.length > 0 ? revenue / filteredSales.length : 0;
        setAvgTicket(ticket);

        // Calculate sales conversion rate (qualified leads to sales)
        const qualifiedLeads = filteredContacts.filter(c => c.intenção === 'Qualificado').length;
        const convRate = qualifiedLeads > 0 ? (filteredSales.length / qualifiedLeads) * 100 : 0;
        setSalesConversionRate(convRate);
      }

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

      {/* Main Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Leads */}
        <Card className="border-chart-1/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Leads
            </CardTitle>
            <Users className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-1">{totalLeads}</div>
            <p className="text-xs text-muted-foreground mt-1">
              No período selecionado
            </p>
          </CardContent>
        </Card>

        {/* Qualified Rate */}
        <Card className="border-success/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Qualificação
            </CardTitle>
            <Target className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{qualifiedRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Leads qualificados
            </p>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card className="border-chart-3/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Conversão
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-3">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Contato inicial → Qualificado
            </p>
          </CardContent>
        </Card>

      {/* Total Sales */}
        <Card className="border-chart-4/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Vendas Realizadas
            </CardTitle>
            <Bike className="h-4 w-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-4">{totalSales}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total no período
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Revenue Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-success/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receita Total
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Soma das vendas no período
            </p>
          </CardContent>
        </Card>

        <Card className="border-chart-3/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ticket Médio
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">
              R$ {avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor médio por venda
            </p>
          </CardContent>
        </Card>

        <Card className="border-chart-5/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Conversão
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-chart-5" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-5">
              {salesConversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Leads → Vendas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Leads by Day Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-chart-1" />
              Leads por Dia (Últimos 7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
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

        {/* Leads by Stage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-chart-2" />
              Distribuição por Estágio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={leadsByStage}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {leadsByStage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
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
